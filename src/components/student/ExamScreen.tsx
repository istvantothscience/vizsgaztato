import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadExams, loadCurrentSession, saveCurrentSession, saveSubmission } from "../../storage";
import { ExamConfig, StudentSession, ChatMessage } from "../../types";
import { startExamChat, sendStudentMessage } from "../../aiClient";
import { FocusTracker } from "../../focusTracker";
import { v4 as uuidv4 } from "uuid";
import { Send, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export const ExamScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamConfig | null>(null);
  const [session, setSession] = useState<StudentSession | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusTracker, setFocusTracker] = useState<FocusTracker | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session && session.status === "running") {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - session.startedAt) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session?.status, session?.startedAt]);

  useEffect(() => {
    const init = async () => {
      const exams = await loadExams();
      const currentExam = exams.find((e) => e.id === id);
      const currentSession = loadCurrentSession();

      if (!currentExam || !currentSession || currentSession.examId !== id) {
        navigate("/");
        return;
      }

      setExam(currentExam);
      setSession(currentSession);

      // Init Focus Tracker
      const tracker = new FocusTracker((event) => {
        setSession((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            focusLossCount: prev.focusLossCount + 1,
            focusEvents: [...prev.focusEvents, event],
            messages: [
              ...prev.messages,
              { id: uuidv4(), role: "system" as const, content: `Figyelem: Az oldal elvesztette a fókuszt! (${event.detail})`, timestamp: Date.now() },
            ],
          };
          saveCurrentSession(updated);
          return updated;
        });
      });
      tracker.start();
      setFocusTracker(tracker);
    };
    init();

    return () => {
      setFocusTracker((prev) => {
        if (prev) prev.stop();
        return null;
      });
    };
  }, [id, navigate]);

  useEffect(() => {
    // Start exam if idle
    if (exam && session && session.status === "idle" && !isLoading) {
      initExam(exam);
    }
  }, [exam, session, isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  const initExam = async (examConf: ExamConfig) => {
    setIsLoading(true);
    try {
      const response = await startExamChat(examConf);
      setSession((prev) => {
        if (!prev) return prev;
        const updatedSession = {
          ...prev,
          status: "running" as const,
          messages: [...prev.messages, { id: uuidv4(), role: "assistant" as const, content: response, timestamp: Date.now() }],
        };
        saveCurrentSession(updatedSession);
        return updatedSession;
      });
    } catch (error) {
      console.error(error);
      alert("Hiba történt az AI inicializálásakor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !exam || !session || isLoading) return;

    const userMsg: ChatMessage = { id: uuidv4(), role: "student", content: input.trim(), timestamp: Date.now() };
    const updatedMessages = [...session.messages, userMsg];
    
    const tempSession = { ...session, messages: updatedMessages };
    setSession(tempSession);
    saveCurrentSession(tempSession);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendStudentMessage(exam, updatedMessages);
      
      // Check if response contains JSON (final summary)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      let finalSummaryObj = null;
      let aiText = response;

      if (jsonMatch) {
        try {
          finalSummaryObj = JSON.parse(jsonMatch[0]);
          aiText = response.replace(jsonMatch[0], "").trim();
        } catch (e) {
          console.error("Failed to parse JSON", e);
        }
      }

      const aiMsg: ChatMessage = { id: uuidv4(), role: "assistant", content: aiText || "Vizsga lezárva.", timestamp: Date.now() };
      const isFinished = !!finalSummaryObj;
      
      const latestSession = loadCurrentSession() || tempSession;

      const newSession: StudentSession = {
        ...latestSession,
        messages: [...latestSession.messages, aiMsg],
        currentQuestionIndex: latestSession.currentQuestionIndex + 1,
        status: isFinished ? "finished" : "running",
        finishedAt: isFinished ? Date.now() : undefined,
        elapsedSeconds: Math.floor((Date.now() - latestSession.startedAt) / 1000),
      };

      if (isFinished && finalSummaryObj) {
        newSession.finalSummary = {
          summaryText: finalSummaryObj.summaryText,
          strengths: finalSummaryObj.strengths,
          improvements: finalSummaryObj.improvements,
          studyTip: finalSummaryObj.studyTip,
        };
        newSession.structuredScore = {
          questionPointsAwarded: finalSummaryObj.questionPointsAwarded || [],
          totalPoints: finalSummaryObj.totalPoints || 0,
          percentage: finalSummaryObj.percentage || 0,
          grade: calculateGrade(finalSummaryObj.percentage || 0, exam.gradingScale),
        };
      }
      
      setSession(newSession);
      saveCurrentSession(newSession);

      if (isFinished) {
        // Save to submissions
        await saveSubmission(newSession);
        focusTracker?.stop();
        navigate(`/exam/${exam.id}/summary`);
      }
    } catch (error) {
      console.error(error);
      alert("Hiba történt a válasz küldésekor.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateGrade = (percent: number, scale: ExamConfig["gradingScale"]) => {
    if (percent >= scale.excellent) return 5;
    if (percent >= scale.good) return 4;
    if (percent >= scale.satisfactory) return 3;
    if (percent >= scale.pass) return 2;
    return 1;
  };

  if (!exam || !session) return <div className="p-8 text-center">Betöltés...</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{exam.title}</h1>
          <p className="text-sm text-slate-500">{exam.topic} | {session.studentName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium">
            <Clock className="w-4 h-4" />
            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, "0")}
          </div>
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            Fókuszvesztés: {session.focusLossCount}
          </div>
          <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Kérdés: {session.currentQuestionIndex} / {exam.questionCount}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {session.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                  msg.role === "student"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : msg.role === "system"
                    ? "bg-amber-100 text-amber-800 border border-amber-200 w-full text-center text-sm font-medium"
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                }`}
              >
                {msg.role !== "system" && (
                  <div className={`text-xs mb-1 font-medium ${msg.role === "student" ? "text-blue-200" : "text-slate-400"}`}>
                    {msg.role === "student" ? session.studentName : "AI Tanár"} • {new Date(msg.timestamp).toLocaleTimeString("hu-HU", { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 p-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Írd ide a válaszod... (Enter a küldéshez, Shift+Enter új sorhoz)"
              className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-14"
              disabled={isLoading || session.status === "finished"}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || session.status === "finished"}
              className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
};
