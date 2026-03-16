import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadExams, saveExam } from "../../storage";
import { ExamConfig } from "../../types";
import { v4 as uuidv4 } from "uuid";
import { ArrowLeft, Save, Eye, Copy, Upload, FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const DEFAULT_EXAM: ExamConfig = {
  id: "",
  title: "Új Vizsga",
  subject: "",
  gradeLevel: "10. osztály",
  topic: "",
  description: "",
  examCode: "",
  sourceMaterial: "",
  keyConcepts: [],
  requiredConcepts: [],
  excludedConcepts: [],
  teacherInstructions: "Légy támogató, de szigorú. Kérj pontos definíciókat.",
  questionCount: 3,
  questionTypes: ["fogalommagyarázó", "gondolkodtató"],
  scoringMode: "equal",
  questionPoints: [10, 10, 10],
  totalPoints: 30,
  gradingScale: {
    excellent: 85,
    good: 70,
    satisfactory: 50,
    pass: 40,
  },
  difficulty: "medium",
  tone: "supportive",
  answerLength: "medium",
  lifecycleStatus: "draft",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const ExamEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [exam, setExam] = useState<ExamConfig>(DEFAULT_EXAM);
  const [keyConceptInput, setKeyConceptInput] = useState("");
  const [requiredConceptInput, setRequiredConceptInput] = useState("");
  const [excludedConceptInput, setExcludedConceptInput] = useState("");
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPdf(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }

      setExam(prev => ({
        ...prev,
        sourceMaterial: prev.sourceMaterial ? prev.sourceMaterial + "\n\n" + fullText.trim() : fullText.trim()
      }));
    } catch (error) {
      console.error("Error reading PDF:", error);
      alert("Hiba történt a PDF beolvasása közben.");
    } finally {
      setIsUploadingPdf(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    if (id && id !== "new") {
      const fetchExam = async () => {
        const exams = await loadExams();
        const existing = exams.find((e) => e.id === id);
        if (existing) {
          setExam(existing);
        }
      };
      fetchExam();
    } else {
      setExam({ ...DEFAULT_EXAM, id: uuidv4(), examCode: Math.random().toString(36).substring(2, 8).toUpperCase() });
    }
  }, [id]);

  const handleSave = async () => {
    if (!exam.title.trim()) {
      alert("A vizsga címe kötelező!");
      return;
    }
    if (!exam.subject.trim()) {
      alert("A tantárgy megadása kötelező!");
      return;
    }

    if (exam.scoringMode === "custom") {
      const sum = exam.questionPoints.reduce((a, b) => a + b, 0);
      if (sum !== exam.totalPoints) {
        alert(`Hibás pontozási beállítás: A kérdések egyedi pontszámainak összege (${sum}) nem egyezik meg a megadott összpontszámmal (${exam.totalPoints}).`);
        return;
      }
    }

    const updatedExam = { ...exam, updatedAt: Date.now() };
    await saveExam(updatedExam);
    navigate("/teacher");
  };

  const addTag = (field: "keyConcepts" | "requiredConcepts" | "excludedConcepts", value: string, setter: (v: string) => void) => {
    if (value.trim() && !exam[field].includes(value.trim())) {
      setExam({ ...exam, [field]: [...exam[field], value.trim()] });
      setter("");
    }
  };

  const removeTag = (field: "keyConcepts" | "requiredConcepts" | "excludedConcepts", index: number) => {
    const newTags = [...exam[field]];
    newTags.splice(index, 1);
    setExam({ ...exam, [field]: newTags });
  };

  const handlePreview = async () => {
    const exams = await loadExams();
    const index = exams.findIndex((e) => e.id === exam.id);
    if (index === -1) {
      alert("Kérlek előbb mentsd el a vizsgát az előnézethez!");
      return;
    }
    
    import("../../storage").then(({ saveCurrentSession }) => {
      saveCurrentSession({
        id: uuidv4(),
        examId: exam.id,
        studentName: "Tanári Előnézet",
        className: "Teszt",
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
  };

  const handleSaveAsCopy = async () => {
    if (!exam.title.trim()) {
      alert("A vizsga címe kötelező!");
      return;
    }
    if (!exam.subject.trim()) {
      alert("A tantárgy megadása kötelező!");
      return;
    }

    if (exam.scoringMode === "custom") {
      const sum = exam.questionPoints.reduce((a, b) => a + b, 0);
      if (sum !== exam.totalPoints) {
        alert(`Hibás pontozási beállítás: A kérdések egyedi pontszámainak összege (${sum}) nem egyezik meg a megadott összpontszámmal (${exam.totalPoints}).`);
        return;
      }
    }

    const newExam = { ...exam, id: uuidv4(), title: `${exam.title} (Másolat)` };
    await saveExam(newExam);
    navigate("/teacher");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/teacher")} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">Vizsga Szerkesztése</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePreview} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors font-medium">
              <Eye className="w-4 h-4" />
              Előnézet
            </button>
            <button onClick={handleSaveAsCopy} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium">
              <Copy className="w-4 h-4" />
              Másolat Mentése
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
              <Save className="w-4 h-4" />
              Mentés
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Alapadatok */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Alapadatok</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vizsga Címe</label>
              <input type="text" value={exam.title} onChange={(e) => setExam({ ...exam, title: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Témakör</label>
              <input type="text" value={exam.topic} onChange={(e) => setExam({ ...exam, topic: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="pl. Kinematika, Elektromosság" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vizsgakód (Diákoknak)</label>
              <input type="text" value={exam.examCode} onChange={(e) => setExam({ ...exam, examCode: e.target.value.toUpperCase() })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tantárgy</label>
              <input type="text" value={exam.subject} onChange={(e) => setExam({ ...exam, subject: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Évfolyam</label>
              <input type="text" value={exam.gradeLevel} onChange={(e) => setExam({ ...exam, gradeLevel: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Rövid leírás (Diákok is látják)</label>
              <textarea value={exam.description} onChange={(e) => setExam({ ...exam, description: e.target.value })} rows={2} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="md:col-span-2 flex items-center mt-2">
              <span className="text-sm font-medium text-slate-700 mr-3">Aktuális státusz:</span>
              {exam.lifecycleStatus === "draft" && <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-bold border border-slate-200">Piszkozat</span>}
              {exam.lifecycleStatus === "active" && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-200">Aktív</span>}
              {exam.lifecycleStatus === "closed" && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold border border-red-200">Lezárt</span>}
              <span className="text-xs text-slate-500 ml-3">(A státuszt a mentés után, a tanári vezérlőpulton tudod módosítani)</span>
            </div>
          </div>
        </section>

        {/* Tananyag */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Tananyag és Fókusz</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Feldolgozandó Tananyag (AI tudásbázisa)</label>
                <label className="cursor-pointer text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors hover:bg-emerald-100">
                  <Upload className="w-4 h-4" />
                  PDF feltöltése
                  <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} disabled={isUploadingPdf} />
                </label>
              </div>
              <textarea value={exam.sourceMaterial} onChange={(e) => setExam({ ...exam, sourceMaterial: e.target.value })} rows={8} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-serif" placeholder="Másold be ide a tankönyvi szöveget vagy a jegyzetet..." disabled={isUploadingPdf} />
              {isUploadingPdf && <p className="text-sm text-emerald-600 mt-2 flex items-center gap-2"><div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div> PDF feldolgozása folyamatban...</p>}
            </div>

            {/* Kulcsfogalmak */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kulcsfogalmak (Enterrel rögzít)</label>
              <input type="text" value={keyConceptInput} onChange={(e) => setKeyConceptInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("keyConcepts", keyConceptInput, setKeyConceptInput))} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mb-2" placeholder="pl. gyorsulás, erő..." />
              <div className="flex flex-wrap gap-2">
                {exam.keyConcepts.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
                    {tag} <button onClick={() => removeTag("keyConcepts", i)} className="hover:text-red-500">&times;</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Kötelező */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kötelezően Számonkérendő (Enterrel rögzít)</label>
              <input type="text" value={requiredConceptInput} onChange={(e) => setRequiredConceptInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("requiredConcepts", requiredConceptInput, setRequiredConceptInput))} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mb-2" />
              <div className="flex flex-wrap gap-2">
                {exam.requiredConcepts.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium flex items-center gap-1">
                    {tag} <button onClick={() => removeTag("requiredConcepts", i)} className="hover:text-red-500">&times;</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Tiltott */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kihagyandó / Tiltott Részek (Enterrel rögzít)</label>
              <input type="text" value={excludedConceptInput} onChange={(e) => setExcludedConceptInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("excludedConcepts", excludedConceptInput, setExcludedConceptInput))} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mb-2" />
              <div className="flex flex-wrap gap-2">
                {exam.excludedConcepts.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
                    {tag} <button onClick={() => removeTag("excludedConcepts", i)} className="hover:text-red-500">&times;</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI Beállítások */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Feleltető3000 Beállításai</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanári Instrukciók az AI-nak</label>
              <textarea value={exam.teacherInstructions} onChange={(e) => setExam({ ...exam, teacherInstructions: e.target.value })} rows={3} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kérdések Száma</label>
              <input type="number" min="1" max="10" value={exam.questionCount} onChange={(e) => {
                const count = parseInt(e.target.value) || 1;
                let newQuestionPoints = [...exam.questionPoints];
                if (count > newQuestionPoints.length) {
                  newQuestionPoints = [...newQuestionPoints, ...Array(count - newQuestionPoints.length).fill(10)];
                } else {
                  newQuestionPoints = newQuestionPoints.slice(0, count);
                }
                setExam({ ...exam, questionCount: count, questionPoints: newQuestionPoints });
              }} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Összpontszám</label>
              <input type="number" min="1" value={exam.totalPoints} onChange={(e) => setExam({ ...exam, totalPoints: parseInt(e.target.value) || 1 })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Pontozás típusa</label>
              <select value={exam.scoringMode} onChange={(e) => setExam({ ...exam, scoringMode: e.target.value as any })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white mb-2">
                <option value="equal">Egyenlő ponteloszlás (Összpontszám / Kérdések száma)</option>
                <option value="custom">Egyedi pontozás kérdésenként</option>
              </select>
              
              {exam.scoringMode === "custom" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  {Array.from({ length: exam.questionCount }).map((_, i) => (
                    <div key={i}>
                      <label className="block text-xs font-medium text-slate-500 mb-1">{i + 1}. kérdés pontja</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={exam.questionPoints[i] || 0} 
                        onChange={(e) => {
                          const newPoints = [...exam.questionPoints];
                          newPoints[i] = parseInt(e.target.value) || 0;
                          setExam({ ...exam, questionPoints: newPoints });
                        }} 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nehézségi Szint</label>
              <select value={exam.difficulty} onChange={(e) => setExam({ ...exam, difficulty: e.target.value as any })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="easy">Könnyű</option>
                <option value="medium">Közepes</option>
                <option value="hard">Nehéz</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vizsgastílus</label>
              <select value={exam.tone} onChange={(e) => setExam({ ...exam, tone: e.target.value as any })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="supportive">Támogató, bátorító</option>
                <option value="neutral">Semleges, tárgyilagos</option>
                <option value="strict">Szigorú, következetes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Válaszok hossza</label>
              <select value={exam.answerLength} onChange={(e) => setExam({ ...exam, answerLength: e.target.value as any })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="short">Rövid</option>
                <option value="medium">Közepes</option>
                <option value="detailed">Részletes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Időkorlát (perc, 0 = nincs)</label>
              <input type="number" min="0" value={exam.timeLimitMinutes || 0} onChange={(e) => setExam({ ...exam, timeLimitMinutes: parseInt(e.target.value) || 0 })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Kérdéstípusok (vesszővel elválasztva)</label>
              <input type="text" value={exam.questionTypes.join(", ")} onChange={(e) => setExam({ ...exam, questionTypes: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="fogalommagyarázó, számolós, érvelős" />
            </div>

            <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
              <h3 className="font-bold text-slate-800 mb-3">Érdemjegyhatárok (%)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Jeles (5) minimum</label>
                  <input type="number" min="0" max="100" value={exam.gradingScale.excellent} onChange={(e) => setExam({ ...exam, gradingScale: { ...exam.gradingScale, excellent: parseInt(e.target.value) || 0 } })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Jó (4) minimum</label>
                  <input type="number" min="0" max="100" value={exam.gradingScale.good} onChange={(e) => setExam({ ...exam, gradingScale: { ...exam.gradingScale, good: parseInt(e.target.value) || 0 } })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Közepes (3) minimum</label>
                  <input type="number" min="0" max="100" value={exam.gradingScale.satisfactory} onChange={(e) => setExam({ ...exam, gradingScale: { ...exam.gradingScale, satisfactory: parseInt(e.target.value) || 0 } })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Elégséges (2) minimum</label>
                  <input type="number" min="0" max="100" value={exam.gradingScale.pass} onChange={(e) => setExam({ ...exam, gradingScale: { ...exam.gradingScale, pass: parseInt(e.target.value) || 0 } })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
