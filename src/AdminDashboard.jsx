import { useState, useEffect, useCallback } from "react";
import { fetchAssessments, fetchAssessmentById, deleteAssessment } from "./supabase.js";

const ADMIN_PASSWORD = "aac2026";  // change this to whatever you want

const GRADE_LABELS_K5 = { K:"K", "1":"1st", "2":"2nd", "3":"3rd", "4":"4th", "5":"5th" };
const GRADE_LABELS_68  = { "6":"6th", "7":"7th", "8":"8th" };
const DOMAIN_NAMES = {
  OA: "Operations & Algebraic Thinking",
  NBT: "Number & Operations in Base Ten",
  MD: "Measurement & Data",
  G: "Geometry",
};

function gradeLabel(g) {
  return GRADE_LABELS_K5[g]
    ? GRADE_LABELS_K5[g] + (g === "K" ? "" : " Grade")
    : (GRADE_LABELS_68[g] ? GRADE_LABELS_68[g] + " Grade" : g);
}

const CSS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --red: #ff0000; --red-dark: #cc0000; --red-pale: #fff0f0;
    --black: #111; --gray-900: #1c1c1c; --gray-700: #444; --gray-500: #777;
    --gray-300: #ccc; --gray-100: #f5f5f5; --white: #fff; --border: #e5e5e5;
    --shadow: 0 2px 12px rgba(0,0,0,.07); --radius: 4px;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--gray-100); color: var(--black); }
  .admin-header { background: #111; border-bottom: 3px solid #ff0000; padding: 12px 32px; display: flex; align-items: center; gap: 16px; }
  .admin-header-title { font-size: 15px; font-weight: 600; color: white; }
  .admin-header-sub { font-size: 12px; color: rgba(255,255,255,.5); margin-left: auto; }
  .admin-main { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
  .admin-toolbar { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }
  .search-input { padding: 9px 14px; border: 1.5px solid var(--border); border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--black); background: white; outline: none; width: 260px; }
  .search-input:focus { border-color: var(--red); }
  .filter-select { padding: 9px 14px; border: 1.5px solid var(--border); border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-size: 14px; background: white; outline: none; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23777' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
  .filter-select:focus { border-color: var(--red); }
  .count-badge { font-size: 12px; color: var(--gray-500); margin-left: auto; }
  .table-wrap { background: white; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
  table { width: 100%; border-collapse: collapse; }
  thead { background: #111; color: white; }
  th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
  td { padding: 12px 16px; font-size: 13px; color: var(--black); border-bottom: 1px solid var(--border); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--red-pale); cursor: pointer; }
  .domain-chip { display: inline-flex; flex-direction: column; align-items: center; margin-right: 10px; }
  .domain-chip-code { font-size: 9px; font-weight: 700; letter-spacing: .06em; color: var(--gray-500); text-transform: uppercase; }
  .domain-chip-val { font-size: 12px; font-weight: 600; color: var(--black); white-space: nowrap; }
  .type-badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 2px; letter-spacing: .04em; }
  .type-k5 { background: #fff0f0; color: #cc0000; }
  .type-68 { background: #f0f0f0; color: #333; }
  .empty-state { padding: 64px; text-align: center; color: var(--gray-500); }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .empty-text { font-size: 15px; }
  .loading { padding: 48px; text-align: center; color: var(--gray-500); font-size: 14px; }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 1000; display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px; overflow-y: auto; }
  .modal { background: white; border-radius: var(--radius); width: 100%; max-width: 840px; box-shadow: 0 8px 48px rgba(0,0,0,.2); overflow: hidden; }
  .modal-header { background: #111; color: white; padding: 20px 28px; display: flex; align-items: center; gap: 12px; }
  .modal-header-title { font-family: 'DM Serif Display', serif; font-size: 18px; flex: 1; }
  .modal-close { background: rgba(255,255,255,.1); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
  .modal-close:hover { background: rgba(255,255,255,.2); }
  .modal-body { padding: 28px; }
  .modal-meta { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; font-size: 13px; color: var(--gray-700); }
  .modal-meta strong { color: var(--black); }
  .domain-results-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
  .domain-result-card { background: var(--gray-100); border-radius: var(--radius); padding: 14px; text-align: center; }
  .domain-result-code { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--gray-500); margin-bottom: 4px; }
  .domain-result-val { font-family: 'DM Serif Display', serif; font-size: 16px; color: var(--black); line-height: 1.3; }
  .domain-result-score { font-size: 11px; color: var(--gray-500); margin-top: 3px; }
  .modal-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .btn-red { background: var(--red); color: white; border: none; padding: 10px 22px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; border-radius: var(--radius); cursor: pointer; transition: background .15s; }
  .btn-red:hover { background: var(--red-dark); }
  .btn-dark { background: #111; color: white; border: none; padding: 10px 22px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; border-radius: var(--radius); cursor: pointer; }
  .btn-ghost-sm { background: transparent; color: var(--black); border: 1.5px solid var(--border); padding: 10px 22px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; border-radius: var(--radius); cursor: pointer; }
  .btn-ghost-sm:hover { border-color: var(--gray-500); }
  .btn-danger { background: transparent; color: #cc0000; border: 1.5px solid #ffcdd2; padding: 10px 22px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; border-radius: var(--radius); cursor: pointer; margin-left: auto; }
  .btn-danger:hover { background: #fff0f0; }

  /* Login */
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--gray-100); }
  .login-card { background: white; border: 1px solid var(--border); border-top: 4px solid var(--red); border-radius: var(--radius); padding: 48px; width: 360px; box-shadow: var(--shadow); }
  .login-title { font-family: 'DM Serif Display', serif; font-size: 24px; margin-bottom: 8px; }
  .login-sub { font-size: 13px; color: var(--gray-500); margin-bottom: 28px; }
  .login-input { width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-size: 15px; outline: none; margin-bottom: 8px; }
  .login-input:focus { border-color: var(--red); }
  .login-error { font-size: 12px; color: #cc0000; margin-bottom: 12px; }
`;

function downloadBlob(html, filename) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.style.display = "none";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function AssessmentModal({ record, onClose }) {
  const results = record.results || {};
  const domains = ["OA","NBT","MD","G"];
  const dateStr = new Date(record.created_at).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });

  function handleDownloadReport() {
    if (record.report_html) {
      downloadBlob(record.report_html, `AAC_Report_${record.student_name.replace(/\s+/g,'_')}_${dateStr.replace(/,?\s+/g,'_')}.html`);
    }
  }

  function handleDownloadPlan() {
    if (record.learning_plan_html) {
      downloadBlob(record.learning_plan_html, `AAC_LearningPlan_${record.student_name.replace(/\s+/g,'_')}_${dateStr.replace(/,?\s+/g,'_')}.html`);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete assessment for ${record.student_name}? This cannot be undone.`)) return;
    await deleteAssessment(record.id);
    onClose(true); // true = refresh list
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

          <div className="modal-actions">
            <button className="btn-red" onClick={handleDownloadReport}
              disabled={!record.report_html} title={!record.report_html ? "No report saved" : ""}>
              ↓ Download Report
            </button>
            <button className="btn-dark" onClick={handleDownloadPlan}
              disabled={!record.learning_plan_html} title={!record.learning_plan_html ? "No learning plan saved" : ""}>
              ↓ Download Learning Plan
            </button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ onBack }) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAssessments({ search, grade: gradeFilter });
      const filtered = typeFilter ? data.filter(r => r.assessment_type === typeFilter) : data;
      setRecords(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, gradeFilter, typeFilter]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  function handleLogin(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) { setAuthed(true); setPwError(""); }
    else setPwError("Incorrect password.");
  }

  function handleModalClose(refresh) {
    setSelected(null);
    if (refresh) load();
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
          <div className="login-sub">Assessment records database</div>
          <form onSubmit={handleLogin}>
            <input className="login-input" type="password" placeholder="Enter password"
              value={password} onChange={e => setPassword(e.target.value)} autoFocus/>
            {pwError && <div className="login-error">{pwError}</div>}
            <button className="btn-red" type="submit" style={{width:"100%",marginTop:"4px"}}>Sign In →</button>
          </form>
          <div style={{marginTop:"20px",textAlign:"center"}}>
            <button className="btn-ghost-sm" onClick={onBack}>← Back to Assessments</button>
          </div>
        </div>
      </div>
    </>
  );

  const allGrades = ["K","1","2","3","4","5","6","7","8"];

  return (
    <>
      <style>{CSS_ADMIN}</style>
      <div style={{minHeight:"100vh",background:"var(--gray-100)"}}>
        <div className="admin-header">
          <div className="admin-header-title">AAC — Assessment Records</div>
          <button className="btn-ghost-sm" style={{fontSize:"12px",padding:"6px 14px"}} onClick={onBack}>
            ← Assessments
          </button>
          <div className="admin-header-sub">{records.length} record{records.length !== 1 ? "s" : ""}</div>
        </div>

        <div className="admin-main">
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
            <button className="btn-red" style={{padding:"9px 18px",fontSize:"13px"}} onClick={load}>Refresh</button>
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
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(rec => {
                    const r = rec.results || {};
                    const d = new Date(rec.created_at).toLocaleDateString("en-US", {month:"short",day:"numeric",year:"numeric"});
                    return (
                      <tr key={rec.id} onClick={() => setSelected(rec)}>
                        <td style={{fontWeight:600}}>{rec.student_name}</td>
                        <td>{gradeLabel(rec.enrolled_grade)}</td>
                        <td>
                          <span className={`type-badge ${rec.assessment_type === "6-8" ? "type-68" : "type-k5"}`}>
                            {rec.assessment_type}
                          </span>
                        </td>
                        {["OA","NBT","MD","G"].map(d2 => (
                          <td key={d2} style={{fontSize:"12px"}}>{r[d2]?.label || "—"}</td>
                        ))}
                        <td style={{color:"var(--gray-500)",fontSize:"12px"}}>{d}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {selected && <AssessmentModal record={selected} onClose={handleModalClose}/>}
    </>
  );
}
