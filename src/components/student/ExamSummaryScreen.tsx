import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadCurrentSession, loadExams } from "../../storage";
import { ExamConfig, StudentSession } from "../../types";
import { sendEmailReport, downloadTextReport, downloadJsonReport, buildExamReport } from "../../reportUtils";
import { CheckCircle, Mail, Download, FileText, ArrowLeft, Award, Clock, AlertTriangle, Copy } from "lucide-react";

export const ExamSummaryScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<StudentSession | null>(null);
  const [exam, setExam] = useState<ExamConfig | null>(null);

  useEffect(() => {
    const init = async () => {
      const currentSession = loadCurrentSession();
      const exams = await loadExams();
      const currentExam = exams.find((e) => e.id === id);

      if (!currentSession || !currentExam || currentSession.examId !== id) {
        navigate("/");
        return;
      }

      setSession(currentSession);
      setExam(currentExam);
    };
    init();
  }, [id, navigate]);

  if (!session || !exam) return <div className="p-8 text-center">Betöltés...</div>;

  const duration = Math.floor(session.elapsedSeconds / 60) + " perc " + (session.elapsedSeconds % 60) + " mp";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Vizsga Sikeresen Befejezve!</h1>
          <p className="text-slate-600 text-lg">Szép munka, {session.studentName}!</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Eredményeid</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <div className="text-slate-500 text-sm font-medium mb-1">Százalék</div>
                <div className="text-2xl font-bold text-blue-600">{session.structuredScore?.percentage || 0}%</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <div className="text-slate-500 text-sm font-medium mb-1">Érdemjegy</div>
                <div className="text-2xl font-bold text-emerald-600">{session.structuredScore?.grade || 1}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <div className="text-slate-500 text-sm font-medium mb-1 flex items-center justify-center gap-1"><Clock className="w-4 h-4"/> Idő</div>
                <div className="text-lg font-bold text-slate-700 mt-1">{duration}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <div className="text-slate-500 text-sm font-medium mb-1 flex items-center justify-center gap-1"><AlertTriangle className="w-4 h-4"/> Fókuszvesztés</div>
                <div className="text-lg font-bold text-amber-600 mt-1">{session.focusLossCount}</div>
              </div>
            </div>
          </div>

          {session.finalSummary && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-500" />
                  Tanári Összegzés
                </h3>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {session.finalSummary.summaryText}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-emerald-700 mb-2">Erősségek</h4>
                  <ul className="space-y-2">
                    {session.finalSummary.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                        <span className="text-emerald-500 mt-0.5">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-amber-700 mb-2">Fejlesztendő Területek</h4>
                  <ul className="space-y-2">
                    {session.finalSummary.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                        <span className="text-amber-500 mt-0.5">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <h4 className="font-bold text-blue-800 mb-1">Tanulási Javaslat</h4>
                <p className="text-blue-900 text-sm">{session.finalSummary.studyTip}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => sendEmailReport(session, exam)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Mail className="w-5 h-5" />
            Eredmény Elküldése Tanárnak
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(buildExamReport(session, exam)).then(() => alert("Riport másolva a vágólapra!"))}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors font-medium shadow-sm"
            >
              <Copy className="w-5 h-5" />
              Másolás
            </button>
            <button
              onClick={() => downloadTextReport(session, exam)}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors font-medium shadow-sm"
            >
              <FileText className="w-5 h-5" />
              TXT Letöltés
            </button>
            <button
              onClick={() => downloadJsonReport(session)}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors font-medium shadow-sm"
            >
              <Download className="w-5 h-5" />
              JSON Letöltés
            </button>
          </div>
        </div>

        <div className="text-center pt-8 flex flex-col items-center gap-4">
          <button
            onClick={() => {
              if (window.confirm("Biztosan újra akarod kezdeni a vizsgát? Az eddigi eredményeid elvesznek (ha még nem küldted el).")) {
                import("../../storage").then(({ saveCurrentSession }) => {
                  saveCurrentSession({
                    id: crypto.randomUUID(),
                    examId: exam.id,
                    studentName: session.studentName,
                    className: session.className,
                    status: "idle",
                    startedAt: Date.now(),
                    elapsedSeconds: 0,
                    currentQuestionIndex: 0,
                    messages: [],
                    focusLossCount: 0,
                    focusEvents: [],
                    emailSent: false,
                  });
                  navigate(`/exam/${exam.id}`);
                });
              }
            }}
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-2"
          >
            Vizsga Újrakezdése
          </button>
          <button
            onClick={() => navigate("/")}
            className="text-slate-500 hover:text-slate-800 font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Vissza a kezdőlapra
          </button>
        </div>
      </div>
    </div>
  );
};
