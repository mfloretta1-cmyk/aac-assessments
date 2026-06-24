import { saveAssessment, generateAndStorePdfs } from "./supabase.js";

export async function saveCompletedAssessment({
  studentName,
  enrolledGrade,
  assessmentType,
  results,
  domainStates,
}) {
  // Capture report HTML from DOM
  const reportEl = document.getElementById("report-content");
  const planEl   = document.getElementById("learning-plan-content");

  const wrap = (body, title) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;color:#111;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}.wrap{max-width:820px;margin:20px auto}@media print{body{margin:0}.wrap{max-width:100%;margin:0}@page{margin:1.5cm;size:A4}}</style>
</head><body><div class="wrap">${body}</div></body></html>`;

  const reportHtml      = reportEl ? wrap(reportEl.innerHTML, `AAC Report — ${studentName}`)        : null;
  const learningPlanHtml = planEl  ? wrap(planEl.innerHTML,   `AAC Learning Plan — ${studentName}`) : null;

  const payload = {
    student_name:        studentName,
    enrolled_grade:      enrolledGrade,
    assessment_type:     assessmentType,
    results,
    domain_states:       domainStates,
    report_html:         reportHtml,
    learning_plan_html:  learningPlanHtml,
  };

  try {
    // 1. Save assessment record to database
    const saved = await saveAssessment(payload);
    const record = Array.isArray(saved) ? saved[0] : saved;
    console.log("✓ Assessment saved to database", record?.id);

    // 2. Trigger async PDF generation + storage (fire and forget — doesn't block UI)
    if (record?.id && reportHtml && learningPlanHtml) {
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "2-digit", day: "2-digit",
      });
      generateAndStorePdfs({
        assessmentId: record.id,
        reportHtml,
        learningPlanHtml,
        studentName,
        date: dateStr,
      }).then(urls => {
        if (urls) console.log("✓ PDFs stored:", urls.reportUrl);
        else console.warn("PDF generation did not return URLs");
      });
    }

    return record;
  } catch (e) {
    console.warn("Could not save assessment:", e.message);
    return null;
  }
}
