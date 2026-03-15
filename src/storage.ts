import { ExamConfig, StudentSession } from "./types";
import { STORAGE_KEYS } from "./constants";

export const saveExams = (exams: ExamConfig[]) => {
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
};

export const loadExams = (): ExamConfig[] => {
  const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return parsed.map((exam: any) => {
      if (!exam.lifecycleStatus) {
        exam.lifecycleStatus = exam.isActive ? "active" : "draft";
      }
      return exam;
    });
  } catch (e) {
    console.error("Error parsing exams:", e);
    return [];
  }
};

export const saveSubmissions = (submissions: StudentSession[]) => {
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
};

export const loadSubmissions = (): StudentSession[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
  return data ? JSON.parse(data) : [];
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
