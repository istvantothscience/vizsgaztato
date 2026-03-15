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

export const startExamChat = async (exam: ExamConfig): Promise<string> => {
  const ai = getAIClient();
  const systemPrompt = buildSystemPrompt(exam);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: "Kezdjük a vizsgát!",
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
    },
  });

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

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: contents as any,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
    },
  });

  return response.text || "Hiba történt a válasz feldolgozásakor.";
};
