import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LoginScreen } from "./components/LoginScreen";
import { TeacherDashboard } from "./components/teacher/TeacherDashboard";
import { ExamEditor } from "./components/teacher/ExamEditor";
import { ExamScreen } from "./components/student/ExamScreen";
import { ExamSummaryScreen } from "./components/student/ExamSummaryScreen";
import { isTeacherLoggedIn } from "./auth";

const ProtectedTeacherRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isTeacherLoggedIn()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<LoginScreen />} />
            
            {/* Teacher Routes */}
            <Route 
              path="/teacher" 
              element={
                <ProtectedTeacherRoute>
                  <TeacherDashboard />
                </ProtectedTeacherRoute>
              } 
            />
            <Route 
              path="/teacher/exam/:id" 
              element={
                <ProtectedTeacherRoute>
                  <ExamEditor />
                </ProtectedTeacherRoute>
              } 
            />

            {/* Student Routes */}
            <Route path="/exam/:id" element={<ExamScreen />} />
            <Route path="/exam/:id/summary" element={<ExamSummaryScreen />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <footer className="py-4 text-center">
          <p className="text-sm text-slate-400 font-medium">made by schoollab</p>
        </footer>
      </div>
    </Router>
  );
}
