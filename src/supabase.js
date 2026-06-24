// ─── Supabase client ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://qvrnkugttrfpzflgqyli.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cm5rdWd0dHJmcHpmbGdxeWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDU1NjcsImV4cCI6MjA5NzcyMTU2N30.LoroXuvA3b3J_IG2YxDH0rxyeiSX4AXQ2yMS-swLONc";

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

// Save a completed assessment to Supabase
export async function saveAssessment(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/assessments`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Save failed: ${err}`);
  }
  return res.json();
}

// Fetch all assessments, newest first
export async function fetchAssessments({ search = "", grade = "", limit = 200 } = {}) {
  let url = `${SUPABASE_URL}/rest/v1/assessments?order=created_at.desc&limit=${limit}`;
  if (grade) url += `&enrolled_grade=eq.${encodeURIComponent(grade)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const data = await res.json();
  if (search) {
    return data.filter(r => r.student_name.toLowerCase().includes(search.toLowerCase()));
  }
  return data;
}

// Fetch a single assessment by id
export async function fetchAssessmentById(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/assessments?id=eq.${id}`, { headers });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const data = await res.json();
  return data[0] || null;
}

// Delete an assessment
export async function deleteAssessment(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/assessments?id=eq.${id}`, {
    method: "DELETE",
    headers,
  });
  return res.ok;
}

// Trigger PDF generation via Netlify Function
// Called after assessment is saved — passes the saved record's ID + HTML
export async function generateAndStorePdfs({ assessmentId, reportHtml, learningPlanHtml, studentName, date }) {
  try {
    const res = await fetch("/.netlify/functions/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId, reportHtml, learningPlanHtml, studentName, date }),
    });
    if (!res.ok) {
      console.warn("PDF generation failed:", await res.text());
      return null;
    }
    return res.json(); // { reportUrl, planUrl }
  } catch (e) {
    console.warn("PDF generation error:", e.message);
    return null;
  }
}
