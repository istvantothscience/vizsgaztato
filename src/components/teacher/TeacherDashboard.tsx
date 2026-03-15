import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadExams, loadSubmissions, saveExams } from "../../storage";
import { logoutTeacher } from "../../auth";
import { ExamConfig, StudentSession, ExamLifecycleStatus } from "../../types";
import { Plus, LogOut, Settings, FileText, Trash2, Copy, Download, Mail, RefreshCw, Info } from "lucide-react";
import { downloadJsonReport, downloadTextReport, sendEmailReport, buildExamReport } from "../../reportUtils";

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamConfig[]>([]);
  const [submissions, setSubmissions] = useState<StudentSession[]>([]);
  const [activeTab, setActiveTab] = useState<"exams" | "submissions">("exams");
  const [examFilter, setExamFilter] = useState<string>("");
  const [studentFilter, setStudentFilter] = useState<string>("");
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  useEffect(() => {
    setExams(loadExams());
    setSubmissions(loadSubmissions());
  }, []);

  const handleLogout = () => {
    logoutTeacher();
    navigate("/");
  };

  const deleteExam = (id: string) => {
    if (window.confirm("Biztosan törlöd ezt a vizsgát?")) {
      const updated = exams.filter((e) => e.id !== id);
      saveExams(updated);
      setExams(updated);
    }
  };

  const handleStatusChange = (examId: string, newStatus: ExamLifecycleStatus) => {
    if (newStatus === "closed") {
      if (!window.confirm("Biztosan le szeretnéd zárni ezt a vizsgát? A diákok ezután nem tudják elindítani.")) {
        return;
      }
    }
    const updatedExams = exams.map((e) => (e.id === examId ? { ...e, lifecycleStatus: newStatus } : e));
    saveExams(updatedExams);
    setExams(updatedExams);
    
    if (newStatus === "active") alert("A vizsga aktiválva.");
    else if (newStatus === "closed") alert("A vizsga lezárva.");
    else if (newStatus === "draft") alert("A vizsga piszkozatba helyezve.");
  };

  const handleRefreshSubmissions = () => {
    setSubmissions(loadSubmissions());
    setRefreshMessage("Az eredménylista frissítve.");
    setTimeout(() => setRefreshMessage(null), 3000);
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchExam = examFilter ? sub.examId === examFilter : true;
    const matchStudent = studentFilter ? sub.studentName.toLowerCase().includes(studentFilter.toLowerCase()) : true;
    return matchExam && matchStudent;
  });

  const getStatusBadge = (status: ExamLifecycleStatus) => {
    switch(status) {
      case "draft": return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-bold border border-slate-200">Piszkozat</span>;
      case "active": return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold border border-emerald-200">Aktív</span>;
      case "closed": return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold border border-red-200">Lezárt</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Tanári Vezérlőpult</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-600 hover:text-red-600 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Kijelentkezés
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-slate-500 text-sm font-medium mb-1">Összes Vizsga</div>
            <div className="text-3xl font-bold text-slate-800">{exams.length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-slate-500 text-sm font-medium mb-1">Aktív Vizsgák</div>
            <div className="text-3xl font-bold text-emerald-600">{exams.filter((e) => e.lifecycleStatus === "active").length}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-slate-500 text-sm font-medium mb-1">Beküldött Eredmények</div>
            <div className="text-3xl font-bold text-blue-600">{submissions.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("exams")}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === "exams" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Vizsgák Kezelése
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === "submissions" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Eredmények ({submissions.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === "exams" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-800">Saját Vizsgák</h2>
                  <button
                    onClick={() => navigate("/teacher/exam/new")}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Új Vizsga
                  </button>
                </div>

                {exams.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Még nincs létrehozott vizsga.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {exams.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-slate-800">{exam.title}</h3>
                            {getStatusBadge(exam.lifecycleStatus)}
                          </div>
                          <div className="text-sm text-slate-500 flex gap-4">
                            <span>Kód: <strong className="text-slate-700 font-mono">{exam.examCode}</strong></span>
                            <span>Témakör: {exam.topic}</span>
                            <span>Kérdések: {exam.questionCount}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {exam.lifecycleStatus === "draft" && (
                            <button onClick={() => handleStatusChange(exam.id, "active")} className="px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                              Aktiválás
                            </button>
                          )}
                          {exam.lifecycleStatus === "active" && (
                            <>
                              <button onClick={() => handleStatusChange(exam.id, "closed")} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                Lezárás
                              </button>
                              <button onClick={() => handleStatusChange(exam.id, "draft")} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                Piszkozatba
                              </button>
                            </>
                          )}
                          {exam.lifecycleStatus === "closed" && (
                            <>
                              <button onClick={() => handleStatusChange(exam.id, "active")} className="px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                                Újranyitás
                              </button>
                              <button onClick={() => handleStatusChange(exam.id, "draft")} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                Piszkozatba
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => navigate(`/teacher/exam/${exam.id}`)}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors ml-2"
                          >
                            Szerkesztés
                          </button>
                          <button
                            onClick={() => deleteExam(exam.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Törlés"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "submissions" && (
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    Az alkalmazás helyi tárolással működik, ezért több külön eszköz között nincs garantált automatikus valós idejű szinkron. Az e-mailes beküldés a legbiztosabb. A legfrissebb eredmények betöltéséhez használd a frissítés gombot.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-slate-800">Beküldött Eredmények</h2>
                    <button 
                      onClick={handleRefreshSubmissions}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Eredmények frissítése
                    </button>
                    {refreshMessage && <span className="text-sm text-emerald-600 font-medium">{refreshMessage}</span>}
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Keresés diák neve alapján..."
                      value={studentFilter}
                      onChange={(e) => setStudentFilter(e.target.value)}
                      className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <select
                      value={examFilter}
                      onChange={(e) => setExamFilter(e.target.value)}
                      className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    >
                      <option value="">Minden vizsga</option>
                      {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                  </div>
                </div>
                {filteredSubmissions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p>Nincs a szűrésnek megfelelő eredmény.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-sm text-slate-500">
                          <th className="pb-3 font-medium">Diák</th>
                          <th className="pb-3 font-medium">Vizsga</th>
                          <th className="pb-3 font-medium">Dátum</th>
                          <th className="pb-3 font-medium">Eredmény</th>
                          <th className="pb-3 font-medium text-right">Műveletek</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubmissions.map((sub) => {
                          const exam = exams.find(e => e.id === sub.examId);
                          return (
                            <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3">
                                <div className="font-medium text-slate-800">{sub.studentName}</div>
                                <div className="text-xs text-slate-500">{sub.className || "-"}</div>
                              </td>
                              <td className="py-3 text-sm text-slate-600">{exam?.title || "Ismeretlen vizsga"}</td>
                              <td className="py-3 text-sm text-slate-600">{new Date(sub.startedAt).toLocaleDateString("hu-HU")}</td>
                              <td className="py-3">
                                {sub.structuredScore ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800">{sub.structuredScore.percentage}%</span>
                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                                      Érdemjegy: {sub.structuredScore.grade}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-slate-400">Nincs értékelve</span>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => exam && sendEmailReport(sub, exam)}
                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Újraküldés e-mailben"
                                  >
                                    <Mail className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => exam && navigator.clipboard.writeText(buildExamReport(sub, exam)).then(() => alert("Riport másolva a vágólapra!"))}
                                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Riport másolása"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => exam && downloadTextReport(sub, exam)}
                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="TXT Letöltése"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => downloadJsonReport(sub)}
                                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="JSON Letöltése"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
