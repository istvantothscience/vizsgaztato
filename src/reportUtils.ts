import { ExamConfig, StudentSession } from "./types";

export const buildExamReport = (session: StudentSession, exam: ExamConfig): string => {
  const date = new Date(session.startedAt).toLocaleString("hu-HU");
  const duration = Math.floor(session.elapsedSeconds / 60) + " perc " + (session.elapsedSeconds % 60) + " mp";

  let report = `AI VIZSGA RIPORT - ${exam.subject.toUpperCase()}\n`;
  report += `========================================\n`;
  report += `Diák neve: ${session.studentName}\n`;
  if (session.className) report += `Osztály: ${session.className}\n`;
  report += `Vizsga címe: ${exam.title}\n`;
  report += `Tantárgy: ${exam.subject}\n`;
  report += `Témakör: ${exam.topic}\n`;
  report += `Vizsga kezdete: ${date}\n`;
  report += `Időtartam: ${duration}\n`;
  report += `Fókuszvesztések száma: ${session.focusLossCount}\n`;
  report += `========================================\n\n`;

  if (session.structuredScore) {
    report += `PONTOZÁS ÉS ÉRTÉKELÉS\n`;
    report += `Összpontszám: ${session.structuredScore.totalPoints} / ${exam.totalPoints}\n`;
    report += `Százalék: ${session.structuredScore.percentage}%\n`;
    report += `Érdemjegy: ${session.structuredScore.grade}\n\n`;
  }

  if (session.finalSummary) {
    report += `TANÁRI ÖSSZEGZÉS\n`;
    report += `${session.finalSummary.summaryText}\n\n`;
    report += `Erősségek:\n- ${session.finalSummary.strengths.join("\n- ")}\n\n`;
    report += `Fejlesztendő területek:\n- ${session.finalSummary.improvements.join("\n- ")}\n\n`;
    report += `Tanulási javaslat: ${session.finalSummary.studyTip}\n\n`;
  }

  report += `========================================\n`;
  report += `BESZÉLGETÉSI NAPLÓ\n`;
  report += `========================================\n\n`;

  session.messages.forEach((msg) => {
    const time = new Date(msg.timestamp).toLocaleTimeString("hu-HU");
    const role = msg.role === "assistant" ? "AI Tanár" : msg.role === "student" ? session.studentName : "Rendszer";
    report += `[${time}] ${role}:\n${msg.content}\n\n`;
  });

  return report;
};

export const sendEmailReport = async (session: StudentSession, exam: ExamConfig, teacherEmail: string = "92istvantoth@gmail.com") => {
  const report = buildExamReport(session, exam);
  const subject = `AI vizsga (${exam.subject}) - ${session.studentName} - ${exam.title}`;
  
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: teacherEmail,
        subject: subject,
        text: report
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Hiba történt az e-mail küldésekor.");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Email küldési hiba:", error);
    return { success: false, error: error.message };
  }
};

export const downloadTextReport = (session: StudentSession, exam: ExamConfig) => {
  const report = buildExamReport(session, exam);
  const blob = new Blob([report], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vizsga_riport_${session.studentName.replace(/\s+/g, "_")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

export const downloadJsonReport = (session: StudentSession) => {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vizsga_adatok_${session.studentName.replace(/\s+/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
