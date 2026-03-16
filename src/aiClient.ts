import { GoogleGenAI } from "@google/genai";
import { ExamConfig, ChatMessage } from "./types";
import { buildSystemPrompt } from "./examPromptBuilder";

const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

const callAIWithRetry = async (callFn: () => Promise<any>, maxRetries = 5) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await callFn();
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota") || error?.message?.includes("RESOURCE_EXHAUSTED");
      if (isRateLimit && retries < maxRetries - 1) {
        const delay = Math.pow(2, retries) * 2000 + Math.random() * 1000;
        console.warn(`AI API rate limit hit, retrying in ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        retries++;
      } else {
        if (isRateLimit) {
          throw new Error("Túl sok kérés történt az AI felé (kvóta túllépés). Kérlek, próbáld újra később.");
        }
        throw error;
      }
    }
  }
};

export const startExamChat = async (exam: ExamConfig): Promise<string> => {
  const ai = getAIClient();
  const systemPrompt = buildSystemPrompt(exam);

  const response = await callAIWithRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Kezdjük a vizsgát!",
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
    },
  }));

  return response.text || "Hiba történt a vizsga indításakor.";
};

export const sendStudentMessage = async (
  exam: ExamConfig,
  history: ChatMessage[]
): Promise<string> => {
  const ai = getAIClient();
  const systemPrompt = buildSystemPrompt(exam);

  const contents = [
    { role: "user", parts: [{ text: "Kezdjük a vizsgát!" }] },
    ...history
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }))
  ];

  const response = await callAIWithRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents as any,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
    },
  }));

  return response.text || "Hiba történt a válasz feldolgozásakor.";
};
