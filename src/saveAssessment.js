import { saveAssessment } from "./supabase.js";

export async function saveCompletedAssessment({
  studentName,
  enrolledGrade,
  assessmentType,
  results,
  domainStates,
}) {
  // Capture report HTML from DOM if available
  const reportEl = document.getElementById("report-content");
  const planEl   = document.getElementById("learning-plan-content");

  const wrap = (body, title) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;color:#111;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}.wrap{max-width:820px;margin:20px auto}@media print{body{margin:0}.wrap{max-width:100%;margin:0}@page{margin:1.5cm;size:A4}}</style>
</head><body><div class="wrap">${body}</div></body></html>`;

  const payload = {
    student_name:        studentName,
    enrolled_grade:      enrolledGrade,
    assessment_type:     assessmentType,
    results,
    domain_states:       domainStates,
    report_html:         reportEl ? wrap(reportEl.innerHTML, `AAC Report — ${studentName}`)        : null,
    learning_plan_html:  planEl   ? wrap(planEl.innerHTML,   `AAC Learning Plan — ${studentName}`) : null,
  };

  try {
    const saved = await saveAssessment(payload);
    console.log("✓ Assessment saved to database", saved);
    return saved;
  } catch (e) {
    console.warn("Could not save assessment:", e.message);
    return null;
  }
}
