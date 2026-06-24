import { useState, useEffect, useCallback } from "react";
import { fetchAssessments, deleteAssessment } from "./supabase.js";

// ─── Question bank data ───────────────────────────────────────────────────────
// Imported lazily so the admin dashboard doesn't bundle both assessment files
// Instead we define a lightweight registry here — id, grade, domain, hasSvg
// This is generated from the question bank and should be updated when questions change.

import { getQuestionsK5 } from "./AssessmentK5.jsx";
import { getQuestions68 } from "./Assessment68.jsx";

function buildQuestionRegistry() {
  return [...getQuestionsK5(), ...getQuestions68()];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "aac2026";

const GRADE_LABELS_K5 = { K:"K", "1":"1st", "2":"2nd", "3":"3rd", "4":"4th", "5":"5th" };
const GRADE_LABELS_68  = { "6":"6th", "7":"7th", "8":"8th" };

function gradeLabel(g) {
  return GRADE_LABELS_K5[g]
    ? GRADE_LABELS_K5[g] + (g === "K" ? "" : " Grade")
    : (GRADE_LABELS_68[g] ? GRADE_LABELS_68[g] + " Grade" : g);
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --red: #ff0000; --red-dark: #cc0000; --red-pale: #fff0f0;
    --black: #111; --gray-900: #1c1c1c; --gray-700: #444; --gray-500: #777;
    --gray-300: #ccc; --gray-100: #f5f5f5; --white: #fff; --border: #e5e5e5;
    --shadow: 0 2px 12px rgba(0,0,0,.07); --radius: 4px;
    --green: #22863a; --green-pale: #f0fff4;
    --amber: #b45309; --amber-pale: #fffbeb;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--gray-100); color: var(--black); }

  /* Header */
  .admin-header { background: #111; border-bottom: 3px solid #ff0000; padding: 0 32px; display: flex; align-items: stretch; gap: 0; }
  .admin-header-title { font-size: 14px; font-weight: 600; color: white; padding: 14px 0; flex: 1; }
  .admin-header-sub { font-size: 12px; color: rgba(255,255,255,.4); padding: 14px 0; margin-left: 12px; }

  /* Tabs */
  .tab-bar { display: flex; gap: 0; border-bottom: none; }
  .tab { padding: 14px 22px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,.5); cursor: pointer; border-bottom: 3px solid transparent; transition: all .15s; background: none; border-top: none; border-left: none; border-right: none; font-family: 'DM Sans', sans-serif; letter-spacing: .04em; }
  .tab:hover { color: rgba(255,255,255,.8); }
  .tab.active { color: white; border-bottom-color: #ff0000; }

  /* Main */
  .admin-main { max-width: 1140px; margin: 0 auto; padding: 28px 24px; }
  .admin-toolbar { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
  .search-input { padding: 9px 14px; border: 1.5px solid var(--border); border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--black); background: white; outline: none; width: 240px; }
  .search-input:focus { border-color: var(--red); }
  .filter-select { padding: 9px 14px; border: 1.5px solid var(--border); border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-size: 13px; background: white; outline: none; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23777' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
  .filter-select:focus { border-color: var(--red); }
  .count-badge { font-size: 12px; color: var(--gray-500); margin-left: auto; }

  /* Table */
  .table-wrap { background: white; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
  table { width: 100%; border-collapse: collapse; }
  thead { background: #111; color: white; }
  th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
  td { padding: 11px 14px; font-size: 13px; color: var(--black); border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr.clickable:hover td { background: var(--red-pale); cursor: pointer; }
  .empty-state { padding: 56px; text-align: center; color: var(--gray-500); }
  .empty-icon { font-size: 36px; margin-bottom: 10px; }
  .empty-text { font-size: 14px; }
  .loading { padding: 48px; text-align: center; color: var(--gray-500); font-size: 14px; }

  /* Badges */
  .type-badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 2px; letter-spacing: .04em; }
  .type-k5 { background: #fff0f0; color: #cc0000; }
  .type-68 { background: #f0f0f0; color: #333; }
  .svg-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 2px; }
  .svg-yes { background: var(--green-pale); color: var(--green); }
  .svg-no  { background: var(--amber-pale); color: var(--amber); }
  .pdf-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 3px 8px; border-radius: 2px; }
  .pdf-ready  { background: #f0fff4; color: #22863a; }
  .pdf-pending { background: #fffbeb; color: #b45309; }

  /* Buttons */
  .btn-red { background: var(--red); color: white; border: none; padding: 9px 20px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; border-radius: var(--radius); cursor: pointer; transition: background .15s; text-decoration: none; display: inline-block; }
  .btn-red:hover { background: var(--red-dark); }
  .btn-red:disabled { opacity: .45; cursor: default; }
  .btn-dark { background: #111; color: white; border: none; padding: 9px 20px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; border-radius: var(--radius); cursor: pointer; text-decoration: none; display: inline-block; }
  .btn-ghost { background: transparent; color: var(--black); border: 1.5px solid var(--border); padding: 9px 18px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; border-radius: var(--radius); cursor: pointer; }
  .btn-ghost:hover { border-color: var(--gray-500); }
  .btn-ghost-sm { background: transparent; color: rgba(255,255,255,.7); border: 1px solid rgba(255,255,255,.2); padding: 7px 14px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; border-radius: var(--radius); cursor: pointer; }
  .btn-ghost-sm:hover { color: white; border-color: rgba(255,255,255,.4); }
  .btn-danger { background: transparent; color: #cc0000; border: 1.5px solid #ffcdd2; padding: 9px 18px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; border-radius: var(--radius); cursor: pointer; margin-left: auto; }
  .btn-danger:hover { background: #fff0f0; }
  .btn-link { background: none; border: none; color: var(--red); font-size: 13px; cursor: pointer; padding: 0; text-decoration: underline; font-family: 'DM Sans', sans-serif; }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 1000; display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px; overflow-y: auto; }
  .modal { background: white; border-radius: var(--radius); width: 100%; max-width: 860px; box-shadow: 0 8px 48px rgba(0,0,0,.2); overflow: hidden; }
  .modal-header { background: #111; color: white; padding: 18px 28px; display: flex; align-items: center; gap: 12px; }
  .modal-header-title { font-family: 'DM Serif Display', serif; font-size: 18px; flex: 1; }
  .modal-close { background: rgba(255,255,255,.1); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
  .modal-close:hover { background: rgba(255,255,255,.2); }
  .modal-body { padding: 28px; }
  .modal-meta { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; font-size: 13px; color: var(--gray-700); }
  .modal-meta strong { color: var(--black); }
  .domain-results-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
  .domain-result-card { background: var(--gray-100); border-radius: var(--radius); padding: 14px; text-align: center; }
  .domain-result-code { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--gray-500); margin-bottom: 4px; }
  .domain-result-val { font-family: 'DM Serif Display', serif; font-size: 15px; color: var(--black); line-height: 1.3; }
  .domain-result-score { font-size: 11px; color: var(--gray-500); margin-top: 3px; }
  .modal-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
  .pdf-section { background: var(--gray-100); border-radius: var(--radius); padding: 16px 18px; margin-bottom: 20px; }
  .pdf-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--gray-500); margin-bottom: 12px; }
  .pdf-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .pdf-row:last-child { margin-bottom: 0; }
  .pdf-label { font-size: 13px; color: var(--gray-700); flex: 1; }

  /* Login */
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--gray-100); }
  .login-card { background: white; border: 1px solid var(--border); border-top: 4px solid var(--red); border-radius: var(--radius); padding: 48px; width: 360px; box-shadow: var(--shadow); }
  .login-title { font-family: 'DM Serif Display', serif; font-size: 24px; margin-bottom: 8px; }
  .login-sub { font-size: 13px; color: var(--gray-500); margin-bottom: 28px; }
  .login-input { width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-size: 15px; outline: none; margin-bottom: 8px; }
  .login-input:focus { border-color: var(--red); }
  .login-error { font-size: 12px; color: #cc0000; margin-bottom: 12px; }

  /* Question bank specific */
  .qb-stats { display: flex; gap: 16px; margin-bottom: 20px; }
  .qb-stat { background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 18px; flex: 1; text-align: center; box-shadow: var(--shadow); }
  .qb-stat-num { font-family: 'DM Serif Display', serif; font-size: 28px; color: var(--black); }
  .qb-stat-label { font-size: 11px; color: var(--gray-500); margin-top: 2px; text-transform: uppercase; letter-spacing: .06em; }
  .qb-stat-num.warn { color: var(--amber); }
  .domain-chip { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 2px; background: #f0f0f0; color: #555; letter-spacing: .04em; }
  .grade-chip { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 2px; background: #f0f4ff; color: #3730a3; }
  td.q-text { max-width: 360px; }
  td.q-text span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function downloadHtmlBlob(html, filename) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.style.display = "none";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ─── Assessment Modal ─────────────────────────────────────────────────────────
function AssessmentModal({ record, onClose }) {
  const results = record.results || {};
  const domains = ["OA","NBT","MD","G"];
  const dateStr = new Date(record.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const fileSlug = `${record.student_name.replace(/\s+/g,"_")}_${dateStr.replace(/,?\s+/g,"_")}`;

  const hasPdfs = !!(record.report_pdf_url && record.learning_plan_pdf_url);

  async function handleDelete() {
    if (!confirm(`Delete assessment for ${record.student_name}? This cannot be undone.`)) return;
    await deleteAssessment(record.id);
    onClose(true);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose(false)}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-header-title">{record.student_name}</div>
          <button className="modal-close" onClick={() => onClose(false)}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-meta">
            <span>Grade: <strong>{gradeLabel(record.enrolled_grade)}</strong></span>
            <span>Type: <strong>{record.assessment_type === "6-8" ? "Middle School (6–8)" : "Elementary (K–5)"}</strong></span>
            <span>Date: <strong>{dateStr}</strong></span>
          </div>

          <div className="domain-results-grid">
            {domains.map(d => {
              const r = results[d] || {};
              return (
                <div key={d} className="domain-result-card">
                  <div className="domain-result-code">{d}</div>
                  <div className="domain-result-val">{r.label || "—"}</div>
                  <div className="domain-result-score">{r.correct ?? "—"}/{r.answered ?? "—"} correct</div>
                </div>
              );
            })}
          </div>

          {/* PDF Downloads */}
          <div className="pdf-section">
            <div className="pdf-section-title">PDF Files</div>
            <div className="pdf-row">
              <div className="pdf-label">Assessment Report</div>
              {record.report_pdf_url ? (
                <a className="btn-red" href={record.report_pdf_url} target="_blank" rel="noreferrer"
                   download={`AAC_Report_${fileSlug}.pdf`}>
                  ↓ Download PDF
                </a>
              ) : record.report_html ? (
                <>
                  <span className="pdf-badge pdf-pending">⏳ PDF generating…</span>
                  <button className="btn-ghost" style={{fontSize:"12px",padding:"6px 12px"}}
                    onClick={() => downloadHtmlBlob(record.report_html, `AAC_Report_${fileSlug}.html`)}>
                    ↓ HTML fallback
                  </button>
                </>
              ) : (
                <span className="pdf-badge pdf-pending">Not available</span>
              )}
            </div>
            <div className="pdf-row">
              <div className="pdf-label">Tutor Learning Plan</div>
              {record.learning_plan_pdf_url ? (
                <a className="btn-dark" href={record.learning_plan_pdf_url} target="_blank" rel="noreferrer"
                   download={`AAC_LearningPlan_${fileSlug}.pdf`}>
                  ↓ Download PDF
                </a>
              ) : record.learning_plan_html ? (
                <>
                  <span className="pdf-badge pdf-pending">⏳ PDF generating…</span>
                  <button className="btn-ghost" style={{fontSize:"12px",padding:"6px 12px"}}
                    onClick={() => downloadHtmlBlob(record.learning_plan_html, `AAC_LearningPlan_${fileSlug}.html`)}>
                    ↓ HTML fallback
                  </button>
                </>
              ) : (
                <span className="pdf-badge pdf-pending">Not available</span>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn-danger" onClick={handleDelete}>Delete Record</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Records Tab ──────────────────────────────────────────────────────────────
function RecordsTab({ onSelectRecord }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [pdfFilter, setPdfFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAssessments({ search, grade: gradeFilter });
      let filtered = typeFilter ? data.filter(r => r.assessment_type === typeFilter) : data;
      if (pdfFilter === "ready")   filtered = filtered.filter(r => r.report_pdf_url);
      if (pdfFilter === "pending") filtered = filtered.filter(r => !r.report_pdf_url);
      setRecords(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, gradeFilter, typeFilter, pdfFilter]);

  useEffect(() => { load(); }, [load]);

  const allGrades = ["K","1","2","3","4","5","6","7","8"];
  const pdfReady = records.filter(r => r.report_pdf_url).length;

  return (
    <>
      <div style={{display:"flex",gap:"12px",marginBottom:"16px",flexWrap:"wrap"}}>
        <div className="qb-stat" style={{minWidth:140}}>
          <div className="qb-stat-num">{records.length}</div>
          <div className="qb-stat-label">Total Records</div>
        </div>
        <div className="qb-stat" style={{minWidth:140}}>
          <div className="qb-stat-num" style={{color:"#22863a"}}>{pdfReady}</div>
          <div className="qb-stat-label">PDFs Ready</div>
        </div>
        <div className="qb-stat" style={{minWidth:140}}>
          <div className="qb-stat-num warn">{records.length - pdfReady}</div>
          <div className="qb-stat-label">PDF Pending</div>
        </div>
      </div>

      <div className="admin-toolbar">
        <input className="search-input" type="text" placeholder="Search by student name…"
          value={search} onChange={e => setSearch(e.target.value)}/>
        <select className="filter-select" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
          <option value="">All grades</option>
          {allGrades.map(g => <option key={g} value={g}>{gradeLabel(g)}</option>)}
        </select>
        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">K–5 & 6–8</option>
          <option value="K-5">Elementary (K–5)</option>
          <option value="6-8">Middle School (6–8)</option>
        </select>
        <select className="filter-select" value={pdfFilter} onChange={e => setPdfFilter(e.target.value)}>
          <option value="">All PDFs</option>
          <option value="ready">PDF Ready</option>
          <option value="pending">PDF Pending</option>
        </select>
        <button className="btn-red" style={{padding:"9px 16px",fontSize:"13px"}} onClick={load}>Refresh</button>
        <span className="count-badge">{records.length} result{records.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading">Loading records…</div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">No assessments found.</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Grade</th>
                <th>Type</th>
                <th>OA</th>
                <th>NBT</th>
                <th>MD</th>
                <th>G</th>
                <th>PDFs</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map(rec => {
                const r = rec.results || {};
                const d = new Date(rec.created_at).toLocaleDateString("en-US", {month:"short",day:"numeric",year:"numeric"});
                const pdfReady = !!(rec.report_pdf_url && rec.learning_plan_pdf_url);
                return (
                  <tr key={rec.id} className="clickable" onClick={() => onSelectRecord(rec)}>
                    <td style={{fontWeight:600}}>{rec.student_name}</td>
                    <td>{gradeLabel(rec.enrolled_grade)}</td>
                    <td><span className={`type-badge ${rec.assessment_type === "6-8" ? "type-68" : "type-k5"}`}>{rec.assessment_type}</span></td>
                    {["OA","NBT","MD","G"].map(d2 => (
                      <td key={d2} style={{fontSize:"12px"}}>{r[d2]?.label || "—"}</td>
                    ))}
                    <td>
                      <span className={`pdf-badge ${pdfReady ? "pdf-ready" : "pdf-pending"}`}>
                        {pdfReady ? "✓ Ready" : "⏳ Pending"}
                      </span>
                    </td>
                    <td style={{color:"var(--gray-500)",fontSize:"12px"}}>{d}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ─── Question Bank Tab ────────────────────────────────────────────────────────
function QuestionBankTab() {
  const [questions] = useState(() => buildQuestionRegistry());
  const [search, setSearch]           = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [typeFilter, setTypeFilter]   = useState("");
  const [svgFilter, setSvgFilter]     = useState("missing"); // default: show missing

  const allGrades  = ["K","1","2","3","4","5","6","7","8"];
  const allDomains = ["OA","NBT","MD","G"];

  const filtered = questions.filter(q => {
    if (search && !q.question.toLowerCase().includes(search.toLowerCase()) && !q.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (gradeFilter && q.grade !== gradeFilter) return false;
    if (domainFilter && q.domain !== domainFilter) return false;
    if (typeFilter && q.type !== typeFilter) return false;
    if (svgFilter === "missing" && q.hasSvg) return false;
    if (svgFilter === "has" && !q.hasSvg) return false;
    return true;
  });

  const totalMissing = questions.filter(q => !q.hasSvg).length;
  const totalHas     = questions.filter(q => q.hasSvg).length;

  // Group missing by domain for summary
  const missingByDomain = {};
  for (const q of questions.filter(q => !q.hasSvg)) {
    missingByDomain[q.domain] = (missingByDomain[q.domain] || 0) + 1;
  }

  return (
    <>
      <div style={{display:"flex",gap:"12px",marginBottom:"20px",flexWrap:"wrap"}}>
        <div className="qb-stat">
          <div className="qb-stat-num">{questions.length}</div>
          <div className="qb-stat-label">Total Questions</div>
        </div>
        <div className="qb-stat">
          <div className="qb-stat-num" style={{color:"#22863a"}}>{totalHas}</div>
          <div className="qb-stat-label">Have Graphics</div>
        </div>
        <div className="qb-stat">
          <div className="qb-stat-num warn">{totalMissing}</div>
          <div className="qb-stat-label">Missing Graphics</div>
        </div>
        {Object.entries(missingByDomain).map(([domain, count]) => (
          <div key={domain} className="qb-stat">
            <div className="qb-stat-num warn">{count}</div>
            <div className="qb-stat-label">Missing — {domain}</div>
          </div>
        ))}
      </div>

      <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:4,padding:"12px 16px",marginBottom:"20px",fontSize:13,color:"#92400e"}}>
        <strong>Note:</strong> Graphics are inline SVG in the source code. To add a graphic to a question, find its ID in <code>AssessmentK5.jsx</code> or <code>Assessment68.jsx</code> and add an <code>svg</code> property. Use the question ID below to locate it.
      </div>

      <div className="admin-toolbar">
        <input className="search-input" type="text" placeholder="Search question text or ID…"
          value={search} onChange={e => setSearch(e.target.value)} style={{width:280}}/>
        <select className="filter-select" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
          <option value="">All grades</option>
          {allGrades.map(g => <option key={g} value={g}>{gradeLabel(g)}</option>)}
        </select>
        <select className="filter-select" value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>
          <option value="">All domains</option>
          {allDomains.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">K–5 & 6–8</option>
          <option value="K-5">K–5</option>
          <option value="6-8">6–8</option>
        </select>
        <select className="filter-select" value={svgFilter} onChange={e => setSvgFilter(e.target.value)}>
          <option value="">All questions</option>
          <option value="missing">Missing graphic</option>
          <option value="has">Has graphic</option>
        </select>
        <span className="count-badge">{filtered.length} question{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="table-wrap">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-text">No questions match your filters.</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Grade</th>
                <th>Domain</th>
                <th>Type</th>
                <th style={{width:"40%"}}>Question</th>
                <th>Graphic</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id}>
                  <td><code style={{fontSize:11,background:"#f5f5f5",padding:"2px 6px",borderRadius:3}}>{q.id}</code></td>
                  <td><span className="grade-chip">{q.grade === "K" ? "K" : `Gr ${q.grade}`}</span></td>
                  <td><span className="domain-chip">{q.domain}</span></td>
                  <td><span className={`type-badge ${q.type === "6-8" ? "type-68" : "type-k5"}`}>{q.type}</span></td>
                  <td className="q-text"><span title={q.question}>{q.question}</span></td>
                  <td>
                    <span className={`svg-badge ${q.hasSvg ? "svg-yes" : "svg-no"}`}>
                      {q.hasSvg ? "✓ Has SVG" : "✗ Missing"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard({ onBack }) {
  const [authed, setAuthed]   = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [tab, setTab]         = useState("records"); // "records" | "questions"
  const [selected, setSelected] = useState(null);

  function handleLogin(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) { setAuthed(true); setPwError(""); }
    else setPwError("Incorrect password.");
  }

  if (!authed) return (
    <>
      <style>{CSS_ADMIN}</style>
      <div className="login-wrap">
        <div className="login-card">
          <div style={{fontSize:"11px",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"#ff0000",marginBottom:"10px"}}>
            Academic Achievement Center
          </div>
          <div className="login-title">Admin Dashboard</div>
          <div className="login-sub">Assessment records & question bank</div>
          <form onSubmit={handleLogin}>
            <input className="login-input" type="password" placeholder="Enter password"
              value={password} onChange={e => setPassword(e.target.value)} autoFocus/>
            {pwError && <div className="login-error">{pwError}</div>}
            <button className="btn-red" type="submit" style={{width:"100%",marginTop:"4px"}}>Sign In →</button>
          </form>
          <div style={{marginTop:"20px",textAlign:"center"}}>
            <button className="btn-ghost" onClick={onBack} style={{width:"100%"}}>← Back to Assessments</button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS_ADMIN}</style>
      <div style={{minHeight:"100vh",background:"var(--gray-100)"}}>
        <div className="admin-header">
          <div className="admin-header-title">AAC — Admin</div>
          <div className="tab-bar">
            <button className={`tab ${tab === "records" ? "active" : ""}`} onClick={() => setTab("records")}>
              Assessment Records
            </button>
            <button className={`tab ${tab === "questions" ? "active" : ""}`} onClick={() => setTab("questions")}>
              Question Bank
            </button>
          </div>
          <button className="btn-ghost-sm" style={{margin:"auto 0 auto 16px"}} onClick={onBack}>
            ← Assessments
          </button>
          <div className="admin-header-sub" style={{marginLeft:16}}>v2.5</div>
        </div>

        <div className="admin-main">
          {tab === "records" && (
            <RecordsTab onSelectRecord={setSelected} />
          )}
          {tab === "questions" && (
            <QuestionBankTab />
          )}
        </div>
      </div>

      {selected && (
        <AssessmentModal
          record={selected}
          onClose={(refresh) => {
            setSelected(null);
            // RecordsTab will re-fetch on next render via its own effect
          }}
        />
      )}
    </>
  );
}
