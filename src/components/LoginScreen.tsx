import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginTeacher } from "../auth";
import { BookOpen, User, Lock, ArrowRight } from "lucide-react";

export const LoginScreen = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<"teacher" | "student" | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 text-center bg-blue-600 text-white">
          <BookOpen className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Vizsgabiztos</h1>
          <p className="text-blue-100 mt-2">10. osztályos szóbeli mini vizsga</p>
        </div>

        <div className="p-8">
          {!role ? (
            <div className="space-y-4">
              <button
                onClick={() => setRole("student")}
                className="w-full flex items-center justify-between p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center">
                  <User className="w-6 h-6 text-blue-600 mr-3" />
                  <span className="font-medium text-slate-700">Diák vagyok</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </button>
              <button
                onClick={() => setRole("teacher")}
                className="w-full flex items-center justify-between p-4 border-2 border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all"
              >
                <div className="flex items-center">
                  <Lock className="w-6 h-6 text-emerald-600 mr-3" />
                  <span className="font-medium text-slate-700">Tanár vagyok</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          ) : role === "teacher" ? (
            <TeacherLoginForm onBack={() => setRole(null)} />
          ) : (
            <StudentEntryForm onBack={() => setRole(null)} />
          )}
        </div>
      </div>
    </div>
  );
};

const TeacherLoginForm = ({ onBack }: { onBack: () => void }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await loginTeacher(username, password);
    if (success) {
      navigate("/teacher");
    } else {
      setError("Hibás felhasználónév vagy jelszó!");
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Tanári belépés</h2>
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Felhasználónév</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Jelszó</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          required
        />
      </div>
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onBack} className="flex-1 p-3 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium transition-colors">
          Vissza
        </button>
        <button type="submit" className="flex-1 p-3 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-medium transition-colors">
          Belépés
        </button>
      </div>
    </form>
  );
};

import { loadExams, saveCurrentSession } from "../storage";
import { v4 as uuidv4 } from "uuid";

const StudentEntryForm = ({ onBack }: { onBack: () => void }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [examCode, setExamCode] = useState("");
  const [error, setError] = useState("");
  const [allExams, setAllExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      const exams = await loadExams();
      setAllExams(exams);
    };
    fetchExams();
  }, []);

  useEffect(() => {
    if (examCode) {
      const exam = allExams.find(e => e.examCode.toLowerCase() === examCode.toLowerCase());
      setSelectedExam(exam || null);
    } else {
      setSelectedExam(null);
    }
  }, [examCode, allExams]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const exams = await loadExams();
    const exam = exams.find((e) => e.examCode.toLowerCase() === examCode.toLowerCase());

    if (!exam) {
      setError("Nem található vizsga ezzel a kóddal.");
      return;
    }

    if (exam.lifecycleStatus !== "active") {
      setError("Ez a vizsga jelenleg nem indítható.");
      return;
    }

    const session = {
      id: uuidv4(),
      examId: exam.id,
      studentName: name,
      className,
      status: "idle" as const,
      startedAt: Date.now(),
      elapsedSeconds: 0,
      currentQuestionIndex: 0,
      messages: [],
      focusLossCount: 0,
      focusEvents: [],
      emailSent: false,
    };

    saveCurrentSession(session);
    navigate(`/exam/${exam.id}`);
  };

  return (
    <form onSubmit={handleStart} className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Diák belépés</h2>
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Teljes név</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Osztály (opcionális)</label>
        <input
          type="text"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="pl. 10.A"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Vizsga kiválasztása vagy kód megadása</label>
        <div className="flex gap-2">
          <select
            className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            onChange={(e) => setExamCode(e.target.value)}
            value={examCode}
          >
            <option value="">-- Válassz vizsgát --</option>
            {allExams.filter(e => e.lifecycleStatus === "active").map(exam => (
              <option key={exam.id} value={exam.examCode}>{exam.title} ({exam.examCode})</option>
            ))}
          </select>
        </div>
        <div className="mt-2">
          <input
            type="text"
            value={examCode}
            onChange={(e) => setExamCode(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            placeholder="Vagy írd be a vizsgakódot..."
            required
          />
        </div>
      </div>
      
      {selectedExam && (
        <div className={`border p-4 rounded-xl mt-4 ${selectedExam.lifecycleStatus === 'active' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
          <h3 className={`font-bold ${selectedExam.lifecycleStatus === 'active' ? 'text-blue-900' : 'text-slate-700'}`}>{selectedExam.title}</h3>
          <p className={`text-sm mt-1 ${selectedExam.lifecycleStatus === 'active' ? 'text-blue-800' : 'text-slate-600'}`}><strong>Témakör:</strong> {selectedExam.topic}</p>
          {selectedExam.description && (
            <p className={`text-sm mt-1 ${selectedExam.lifecycleStatus === 'active' ? 'text-blue-800' : 'text-slate-600'}`}><strong>Leírás:</strong> {selectedExam.description}</p>
          )}
          {selectedExam.timeLimitMinutes > 0 && (
            <p className={`text-sm mt-1 ${selectedExam.lifecycleStatus === 'active' ? 'text-blue-800' : 'text-slate-600'}`}><strong>Időkorlát:</strong> {selectedExam.timeLimitMinutes} perc</p>
          )}
          
          <div className="mt-3 pt-3 border-t border-slate-200/50">
            {selectedExam.lifecycleStatus === "draft" && <p className="text-slate-600 font-medium text-sm">Státusz: Még nem elérhető</p>}
            {selectedExam.lifecycleStatus === "active" && <p className="text-emerald-600 font-medium text-sm">Státusz: Most indítható</p>}
            {selectedExam.lifecycleStatus === "closed" && <p className="text-red-600 font-medium text-sm">Státusz: Lezárt</p>}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onBack} className="flex-1 p-3 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium transition-colors">
          Vissza
        </button>
        <button 
          type="submit" 
          disabled={selectedExam && selectedExam.lifecycleStatus !== "active"}
          className="flex-1 p-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          Tovább
        </button>
      </div>
    </form>
  );
};
