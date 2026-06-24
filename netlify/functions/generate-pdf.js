// netlify/functions/generate-pdf.js
// Receives { assessmentId, reportHtml, learningPlanHtml, studentName, date }
// Generates two PDFs via Puppeteer, uploads to Supabase Storage, returns URLs

const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

const SUPABASE_URL = "https://qvrnkugttrfpzflgqyli.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // service role key (set in Netlify env vars)
const BUCKET = "reports";

async function htmlToPdf(browser, html) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({
    format: "A4",
    margin: { top: "1.5cm", bottom: "1.5cm", left: "1.5cm", right: "1.5cm" },
    printBackground: true,
  });
  await page.close();
  return pdf;
}

async function uploadToSupabase(pdfBuffer, path) {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/pdf",
        "x-upsert": "true",
      },
      body: pdfBuffer,
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Storage upload failed: ${err}`);
  }
  // Return public URL
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function updateAssessmentRecord(id, reportUrl, planUrl) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/assessments?id=eq.${id}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        report_pdf_url: reportUrl,
        learning_plan_pdf_url: planUrl,
      }),
    }
  );
  return res.ok;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { assessmentId, reportHtml, learningPlanHtml, studentName, date } = body;

  if (!assessmentId || !reportHtml || !learningPlanHtml) {
    return { statusCode: 400, body: "Missing required fields" };
  }

  // Safe filename slug
  const slug = `${studentName.replace(/\s+/g, "_")}_${date.replace(/\//g, "-")}`;
  const reportPath = `${assessmentId}/report_${slug}.pdf`;
  const planPath = `${assessmentId}/learning_plan_${slug}.pdf`;

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const [reportPdf, planPdf] = await Promise.all([
      htmlToPdf(browser, reportHtml),
      htmlToPdf(browser, learningPlanHtml),
    ]);

    const [reportUrl, planUrl] = await Promise.all([
      uploadToSupabase(reportPdf, reportPath),
      uploadToSupabase(planPdf, planPath),
    ]);

    await updateAssessmentRecord(assessmentId, reportUrl, planUrl);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportUrl, planUrl }),
    };
  } catch (err) {
    console.error("PDF generation error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  } finally {
    if (browser) await browser.close();
  }
};
