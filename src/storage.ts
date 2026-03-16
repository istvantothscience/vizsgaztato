import { ExamConfig, StudentSession } from "./types";
import { STORAGE_KEYS } from "./constants";
import { supabase } from "./supabase";

export const loadExams = async (): Promise<ExamConfig[]> => {
  const { data, error } = await supabase.from('exams').select('*');
  if (error) {
    console.error("Error loading exams:", error);
    return [];
  }
  return data || [];
};

export const saveExam = async (exam: ExamConfig) => {
  const { error } = await supabase.from('exams').upsert(exam);
  if (error) {
    console.error("Error saving exam:", error);
  }
};

export const deleteExamFromDb = async (id: string) => {
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) {
    console.error("Error deleting exam:", error);
  }
};

export const loadSubmissions = async (): Promise<StudentSession[]> => {
  const { data, error } = await supabase.from('submissions').select('*');
  
  // Load local fallbacks
  const localData = localStorage.getItem('local_submissions');
  const localSubmissions: StudentSession[] = localData ? JSON.parse(localData) : [];

  if (error) {
    console.error("Error loading submissions from Supabase:", error);
    return localSubmissions;
  }
  
  // Decode Supabase submissions
  const decodedData = (data || []).map(sub => {
    let finalSummary = sub.finalSummary;
    let structuredScore = sub.structuredScore;
    let messages = sub.messages || [];
    
    // Check if the last message contains the encoded data
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "system" && lastMsg.content === "__SUPABASE_ENCODED_DATA__") {
        if (lastMsg.finalSummary) finalSummary = lastMsg.finalSummary;
        if (lastMsg.structuredScore) structuredScore = lastMsg.structuredScore;
        messages = messages.slice(0, -1);
      }
    }
    
    return {
      ...sub,
      messages,
      finalSummary,
      structuredScore
    };
  });

  // Merge Supabase and local submissions, preferring Supabase if IDs match
  const allSubmissions = [...decodedData];
  for (const localSub of localSubmissions) {
    if (!allSubmissions.find(s => s.id === localSub.id)) {
      allSubmissions.push(localSub);
    }
  }
  
  return allSubmissions;
};

export const saveSubmission = async (submission: StudentSession) => {
  // Always save locally as a fallback
  try {
    const localData = localStorage.getItem('local_submissions');
    const localSubmissions: StudentSession[] = localData ? JSON.parse(localData) : [];
    const existingIndex = localSubmissions.findIndex(s => s.id === submission.id);
    if (existingIndex >= 0) {
      localSubmissions[existingIndex] = submission;
    } else {
      localSubmissions.push(submission);
    }
    localStorage.setItem('local_submissions', JSON.stringify(localSubmissions));
  } catch (e) {
    console.error("Failed to save submission locally", e);
  }

  // Encode for Supabase to avoid schema errors
  const supabaseSubmission = { ...submission };
  delete supabaseSubmission.finalSummary;
  delete supabaseSubmission.structuredScore;
  
  if (submission.finalSummary || submission.structuredScore) {
    supabaseSubmission.messages = [
      ...submission.messages,
      {
        id: "sys-encoded-data",
        role: "system",
        content: "__SUPABASE_ENCODED_DATA__",
        timestamp: Date.now(),
        finalSummary: submission.finalSummary,
        structuredScore: submission.structuredScore
      } as any
    ];
  }

  const { error } = await supabase.from('submissions').upsert(supabaseSubmission);
  if (error) {
    console.error("Error saving submission:", error);
    alert(`Figyelem! Az eredmény nem mentődött el a központi adatbázisba: ${error.message}. Kérlek, mindenképp töltsd le vagy küldd el e-mailben a tanárnak! (Helyileg elmentve)`);
  }
};

export const saveCurrentSession = (session: StudentSession) => {
  sessionStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
};

export const loadCurrentSession = (): StudentSession | null => {
  const data = sessionStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
  return data ? JSON.parse(data) : null;
};

export const clearCurrentSession = () => {
  sessionStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
};
