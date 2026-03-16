import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://zmzjnqvsywizojqoewus.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptempucXZzeXdpem9qcW9ld3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDM2MDUsImV4cCI6MjA4NTE3OTYwNX0.4BkgRZtm3bXu3utRzu-u4uhrthEhwoBO4kzeZMl6obQ";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('exams').select('id').limit(1);
  console.log("Exam ID:", data?.[0]?.id);
}
run();
