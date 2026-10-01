-- ====================================================================
-- KMRL SECURITY BREAK REGISTER: NEW CONTRACTOR MIGRATION & ARCHIVE SQL
-- Project: rpfeazjpuxpfhofdrcza.supabase.co
-- Date: 2026-10-01
-- ====================================================================

-- --------------------------------------------------------------------
-- STEP 1: CREATE ARCHIVE TABLES
-- --------------------------------------------------------------------

-- Drop partial archive tables if left by previous run
DROP TABLE IF EXISTS archive_habitual_offenders;
DROP TABLE IF EXISTS archive_break_summary;
DROP TABLE IF EXISTS archive_employees;

CREATE TABLE IF NOT EXISTS archive_employees (
    id INTEGER PRIMARY KEY,
    emp_id TEXT NOT NULL,
    name TEXT NOT NULL,
    designation TEXT,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS archive_break_summary (
    id INTEGER PRIMARY KEY,
    entry_date TEXT,
    emp_id TEXT,
    station TEXT,
    shift_type TEXT,
    break1 INTEGER DEFAULT 0,
    break2 INTEGER DEFAULT 0,
    break3 INTEGER DEFAULT 0,
    break4 INTEGER DEFAULT 0,
    break5 INTEGER DEFAULT 0,
    break6 INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    current_open_break TEXT,
    current_start_time TEXT,
    edited_by_name TEXT,
    edited_by_emp TEXT,
    edit_reason TEXT,
    edited_at TEXT,
    shift_session TEXT,
    break_logs JSONB DEFAULT '{}'::jsonb,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS archive_habitual_offenders (
    emp_id TEXT PRIMARY KEY,
    total_violations INTEGER,
    latest_date TEXT,
    latest_station TEXT,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is disabled (consistent with existing employees & break_summary)
ALTER TABLE archive_employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE archive_break_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE archive_habitual_offenders DISABLE ROW LEVEL SECURITY;

-- Performance indexes for archive querying
CREATE INDEX IF NOT EXISTS idx_archive_employees_empid ON archive_employees (emp_id);
CREATE INDEX IF NOT EXISTS idx_archive_break_summary_empid ON archive_break_summary (emp_id);
CREATE INDEX IF NOT EXISTS idx_archive_break_summary_date ON archive_break_summary (entry_date);
CREATE INDEX IF NOT EXISTS idx_archive_break_summary_station ON archive_break_summary (station);

-- --------------------------------------------------------------------
-- STEP 2: COPY DATA TO ARCHIVE (STRICT: NO "ON CONFLICT DO NOTHING")
-- --------------------------------------------------------------------

INSERT INTO archive_employees (id, emp_id, name, designation)
SELECT id, emp_id, name, designation FROM employees;

INSERT INTO archive_break_summary (
    id, entry_date, emp_id, station, shift_type,
    break1, break2, break3, break4, break5, break6, total,
    current_open_break, current_start_time,
    edited_by_name, edited_by_emp, edit_reason, edited_at,
    shift_session, break_logs
)
SELECT 
    id, entry_date, emp_id, station, shift_type,
    break1, break2, break3, break4, break5, break6, total,
    current_open_break, current_start_time,
    edited_by_name, edited_by_emp, edit_reason, edited_at,
    shift_session, break_logs
FROM break_summary;

INSERT INTO archive_habitual_offenders (emp_id, total_violations, latest_date, latest_station)
SELECT emp_id, total_violations, latest_date, latest_station FROM habitual_offenders;

-- --------------------------------------------------------------------
-- STEP 3: PRE-RESET VERIFICATION QUERIES
-- Run these and confirm expected counts before proceeding to Step 4:
-- --------------------------------------------------------------------

SELECT 
    (SELECT count(*) FROM archive_employees) AS archived_employees_count, -- Must be 406
    (SELECT count(*) FROM archive_break_summary) AS archived_breaks_count, -- Must be 24020
    (SELECT count(*) FROM archive_habitual_offenders) AS archived_habitual_count; -- Must be 193

-- --------------------------------------------------------------------
-- STEP 4: RESET OPERATIONAL TABLES (STRICT: NO CASCADE USED)
-- Execute only after Step 3 verification passes 100%:
-- --------------------------------------------------------------------

TRUNCATE TABLE break_summary RESTART IDENTITY;
TRUNCATE TABLE employees RESTART IDENTITY;

-- --------------------------------------------------------------------
-- STEP 5: POST-RESET CONFIRMATION
-- --------------------------------------------------------------------

SELECT 
    (SELECT count(*) FROM employees) AS current_employees_count,       -- Must be 0
    (SELECT count(*) FROM break_summary) AS current_break_count,        -- Must be 0
    (SELECT count(*) FROM archive_employees) AS preserved_archive_emp,  -- Must be 406
    (SELECT count(*) FROM archive_break_summary) AS preserved_archive_breaks; -- Must be 24020
