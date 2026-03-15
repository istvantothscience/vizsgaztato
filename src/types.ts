export type UserRole = "teacher" | "student";

export type ExamStatus = "idle" | "running" | "finished";

export type MessageRole = "system" | "assistant" | "student";

export type ExamLifecycleStatus = "draft" | "active" | "closed";

export interface ExamConfig {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  topic: string;
  description: string;
  examCode: string;
  sourceMaterial: string;
  keyConcepts: string[];
  requiredConcepts: string[];
  excludedConcepts: string[];
  teacherInstructions: string;
  questionCount: number;
  questionTypes: string[];
  scoringMode: "equal" | "custom";
  questionPoints: number[];
  totalPoints: number;
  gradingScale: {
    excellent: number; // e.g. 90
    good: number;      // e.g. 75
    satisfactory: number; // e.g. 60
    pass: number;      // e.g. 50
  };
  difficulty: "easy" | "medium" | "hard";
  tone: "supportive" | "neutral" | "strict";
  answerLength: "short" | "medium" | "detailed";
  timeLimitMinutes?: number;
  isActive?: boolean; // Deprecated, use lifecycleStatus instead
  lifecycleStatus: ExamLifecycleStatus;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface FocusEvent {
  id: string;
  type: "blur" | "visibilitychange" | "focus" | "fullscreenchange";
  timestamp: number;
  detail: string;
}

export interface StructuredScore {
  questionPointsAwarded: number[];
  totalPoints: number;
  percentage: number;
  grade: number;
}

export interface FinalSummary {
  summaryText: string;
  strengths: string[];
  improvements: string[];
  studyTip: string;
}

export interface StudentSession {
  id: string;
  examId: string;
  studentName: string;
  className?: string;
  status: ExamStatus;
  startedAt: number;
  finishedAt?: number;
  elapsedSeconds: number;
  currentQuestionIndex: number;
  messages: ChatMessage[];
  focusLossCount: number;
  focusEvents: FocusEvent[];
  structuredScore?: StructuredScore;
  finalSummary?: FinalSummary;
  emailSent: boolean;
}
