import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://zmzjnqvsywizojqoewus.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptempucXZzeXdpem9qcW9ld3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDM2MDUsImV4cCI6MjA4NTE3OTYwNX0.4BkgRZtm3bXu3utRzu-u4uhrthEhwoBO4kzeZMl6obQ";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const dummy = {
    id: "00000000-0000-0000-0000-000000000000",
    examId: "fd0d963e-9035-490b-86c7-8b37c473d7aa",
    studentName: "test",
    className: "test",
    status: "finished",
    startedAt: 123,
    elapsedSeconds: 123,
    currentQuestionIndex: 1,
    messages: [{ role: "system", content: "test", timestamp: 123, finalSummary: { summaryText: "test" } }],
    focusLossCount: 0,
    focusEvents: [],
    emailSent: false
  };
  const { data, error } = await supabase.from('submissions').upsert(dummy);
  console.log("Error:", error);
}
run();
