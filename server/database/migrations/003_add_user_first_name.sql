-- =========================================================
-- TutorAI MySQL Migration 003 -- Add first_name to users
-- =========================================================

ALTER TABLE users ADD COLUMN first_name VARCHAR(100) NULL AFTER email;
