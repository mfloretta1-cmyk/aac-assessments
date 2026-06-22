-- Run this in your Supabase project → SQL Editor → New Query

-- Create assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  student_name    TEXT NOT NULL,
  enrolled_grade  TEXT NOT NULL,
  assessment_type TEXT NOT NULL DEFAULT 'K-5',  -- 'K-5' or '6-8'

  -- Domain results (stored as JSON for flexibility)
  results         JSONB NOT NULL,   -- { OA: { label, numeric, correct, answered }, ... }
  domain_states   JSONB NOT NULL,   -- full adaptive state for learning plan generation

  -- Pre-rendered HTML snapshots for fast retrieval
  report_html     TEXT,
  learning_plan_html TEXT
);

-- Index for fast name/grade lookups
CREATE INDEX IF NOT EXISTS idx_assessments_student ON assessments (student_name);
CREATE INDEX IF NOT EXISTS idx_assessments_grade   ON assessments (enrolled_grade);
CREATE INDEX IF NOT EXISTS idx_assessments_date    ON assessments (created_at DESC);

-- Enable Row Level Security (keeps data private)
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Allow anon key to read and insert (your app uses anon key)
CREATE POLICY "Allow anon read"   ON assessments FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON assessments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON assessments FOR DELETE USING (true);
