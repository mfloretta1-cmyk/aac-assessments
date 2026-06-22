import { useState } from "react";
import AssessmentK5 from "./AssessmentK5.jsx";
import Assessment68 from "./Assessment68.jsx";
import AdminDashboard from "./AdminDashboard.jsx";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #f5f5f5; color: #111; -webkit-font-smoothing: antialiased; }
`;

export default function App() {
  const [screen, setScreen] = useState("home");

  // Check for ?admin in URL to go straight to admin
  if (typeof window !== "undefined" && window.location.search.includes("admin") && screen === "home") {
    return <AdminDashboard onBack={() => setScreen("home")} />;
  }

  if (screen === "k5")    return <AssessmentK5 onHome={() => setScreen("home")} />;
  if (screen === "68")    return <Assessment68  onHome={() => setScreen("home")} />;
  if (screen === "admin") return <AdminDashboard onBack={() => setScreen("home")} />;

  return (
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",background:"#f5f5f5"}}>
        {/* Header */}
        <div style={{background:"white",borderBottom:"3px solid #ff0000",padding:"14px 40px",display:"flex",alignItems:"center",gap:"16px"}}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"22px",color:"#111",fontWeight:400}}>
            Academic Achievement Center
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:"12px",alignItems:"center"}}>
            <span style={{fontSize:"12px",color:"#aaa"}}>Internal Assessment Tools</span>
            <button
              onClick={() => setScreen("admin")}
              style={{background:"transparent",border:"1.5px solid #e5e5e5",borderRadius:"3px",padding:"6px 14px",fontSize:"12px",fontWeight:600,color:"#555",cursor:"pointer",letterSpacing:".04em"}}>
              Admin →
            </button>
          </div>
        </div>

        {/* Landing */}
        <div style={{maxWidth:"860px",margin:"0 auto",padding:"60px 24px"}}>
          <div style={{marginBottom:"48px"}}>
            <div style={{fontSize:"11px",fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",color:"#ff0000",marginBottom:"10px"}}>
              Academic Achievement Center · Eugene, Oregon
            </div>
            <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"36px",color:"#111",marginBottom:"12px",lineHeight:1.2}}>
              Math Placement Assessments
            </h1>
            <p style={{fontSize:"16px",color:"#555",lineHeight:1.7,maxWidth:"580px"}}>
              Adaptive, standards-aligned assessments for grades K–8. Results are automatically saved to the AAC database. Select an assessment below.
            </p>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px"}}>
            {/* K-5 */}
            <div onClick={() => setScreen("k5")}
              style={{background:"white",border:"1px solid #e5e5e5",borderTop:"4px solid #ff0000",borderRadius:"4px",padding:"36px",cursor:"pointer",transition:"box-shadow .15s",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 28px rgba(0,0,0,.12)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.06)"}>
              <div style={{fontSize:"11px",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"#ff0000",marginBottom:"10px"}}>Grades K – 5</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"24px",color:"#111",marginBottom:"12px",lineHeight:1.3}}>Elementary Math Assessment</div>
              <p style={{fontSize:"14px",color:"#555",lineHeight:1.7,marginBottom:"28px"}}>Operations & Algebraic Thinking, Number & Operations in Base Ten, Measurement & Data, and Geometry across Kindergarten through 5th grade.</p>
              {["240 questions · 6 grade levels","Adaptive — adjusts to student level","Auto-saves to AAC database","Parent report + tutor learning plan"].map(f=>(
                <div key={f} style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",color:"#444",marginBottom:"6px"}}>
                  <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#ff0000",flexShrink:0}}/>{f}
                </div>
              ))}
              <div style={{marginTop:"24px",background:"#ff0000",color:"white",padding:"12px 24px",borderRadius:"3px",fontSize:"13px",fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",display:"inline-block"}}>
                Start Assessment →
              </div>
            </div>

            {/* 6-8 */}
            <div onClick={() => setScreen("68")}
              style={{background:"white",border:"1px solid #e5e5e5",borderTop:"4px solid #111",borderRadius:"4px",padding:"36px",cursor:"pointer",transition:"box-shadow .15s",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 28px rgba(0,0,0,.12)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.06)"}>
              <div style={{fontSize:"11px",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"#111",marginBottom:"10px"}}>Grades 6 – 8</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"24px",color:"#111",marginBottom:"12px",lineHeight:1.3}}>Middle School Math Assessment</div>
              <p style={{fontSize:"14px",color:"#555",lineHeight:1.7,marginBottom:"28px"}}>Operations, Algebra & Functions, The Number System, Statistics & Probability, and Geometry across 6th through 8th grade.</p>
              {["120 questions · 3 grade levels","Calculator available for most questions","Auto-saves to AAC database","Parent report + tutor learning plan"].map(f=>(
                <div key={f} style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",color:"#444",marginBottom:"6px"}}>
                  <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#111",flexShrink:0}}/>{f}
                </div>
              ))}
              <div style={{marginTop:"24px",background:"#111",color:"white",padding:"12px 24px",borderRadius:"3px",fontSize:"13px",fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",display:"inline-block"}}>
                Start Assessment →
              </div>
            </div>
          </div>

          <div style={{marginTop:"48px",padding:"18px 24px",background:"white",border:"1px solid #e5e5e5",borderRadius:"4px",fontSize:"13px",color:"#777",lineHeight:1.7}}>
            <strong style={{color:"#111"}}>For internal use only.</strong> Assessment results are automatically saved to the AAC database after each completed assessment. Access all records via the <strong>Admin</strong> button above.
          </div>
        </div>
      </div>
    </>
  );
}
