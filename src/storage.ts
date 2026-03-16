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
  
  // Merge Supabase and local submissions, preferring Supabase if IDs match
  const allSubmissions = [...(data || [])];
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

  const { error } = await supabase.from('submissions').upsert(submission);
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
