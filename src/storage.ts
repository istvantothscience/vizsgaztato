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
  if (error) {
    console.error("Error loading submissions:", error);
    return [];
  }
  return data || [];
};

export const saveSubmission = async (submission: StudentSession) => {
  const { error } = await supabase.from('submissions').upsert(submission);
  if (error) {
    console.error("Error saving submission:", error);
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
