-- =========================================================
-- TutorAI MySQL Initial Schema Migration (001_initial_mysql_schema.sql)
-- =========================================================

-- 1. Students / User Profile
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(64) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NULL,
  age INT NOT NULL,
  country VARCHAR(100) NULL,
  preferred_language VARCHAR(50) DEFAULT 'Français',
  education_level VARCHAR(100) NOT NULL,
  school VARCHAR(255) NULL,
  field_of_study VARCHAR(255) NULL,
  study_year VARCHAR(50) NULL,
  onboarding_completed TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Subjects (Catalog)
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Student <-> Subjects Relationship (Many-to-Many)
CREATE TABLE IF NOT EXISTS student_subjects (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  subject_id VARCHAR(64) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE KEY uk_student_subject (student_id, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Learning Profiles (1-to-1 with Student)
CREATE TABLE IF NOT EXISTS learning_profiles (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL UNIQUE,
  goals LONGTEXT NULL,
  difficulties LONGTEXT NULL,
  learning_preferences LONGTEXT NULL,
  study_time VARCHAR(100) NULL,
  diagnostic_status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
  diagnostic_results LONGTEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Student Goals (Normalized relationship)
CREATE TABLE IF NOT EXISTS student_goals (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  goal VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Difficulties (Separating declared from AI-detected)
CREATE TABLE IF NOT EXISTS difficulties (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  difficulty_type ENUM('declared', 'detected') NOT NULL,
  difficulty VARCHAR(255) NOT NULL,
  context TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Diagnostic Results
CREATE TABLE IF NOT EXISTS diagnostic_results (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  subject_id VARCHAR(64) NULL,
  topic VARCHAR(255) NULL,
  score INT NOT NULL,
  strengths LONGTEXT NULL,
  weaknesses LONGTEXT NULL,
  detected_prerequisites LONGTEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Courses
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(64) PRIMARY KEY,
  subject_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Topics
CREATE TABLE IF NOT EXISTS topics (
  id VARCHAR(64) PRIMARY KEY,
  course_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  subject_id VARCHAR(64) NULL,
  course_id VARCHAR(64) NULL,
  topic VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Chat Messages
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) PRIMARY KEY,
  conversation_id VARCHAR(64) NOT NULL,
  role ENUM('user', 'assistant', 'system') NOT NULL,
  content LONGTEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Learning Memory
CREATE TABLE IF NOT EXISTS learning_memory (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  subject_id VARCHAR(64) NULL,
  topic VARCHAR(255) NULL,
  memory_type ENUM('weak_topic', 'strong_topic', 'common_mistake', 'learning_preference', 'prerequisite', 'achievement', 'recommendation') NOT NULL,
  content TEXT NOT NULL,
  confidence ENUM('Faible', 'Moyen', 'Bon') DEFAULT 'Moyen',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Progress
CREATE TABLE IF NOT EXISTS progress (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  subject_id VARCHAR(64) NULL,
  topic VARCHAR(255) NULL,
  score INT NULL,
  mastery_level ENUM('not_started', 'beginner', 'developing', 'intermediate', 'advanced', 'mastered') DEFAULT 'not_started',
  exercises_completed INT DEFAULT 0,
  quizzes_completed INT DEFAULT 0,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Exercises
CREATE TABLE IF NOT EXISTS exercises (
  id VARCHAR(64) PRIMARY KEY,
  subject_id VARCHAR(64) NOT NULL,
  topic VARCHAR(255) NULL,
  question TEXT NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Student Exercise Attempts
CREATE TABLE IF NOT EXISTS student_exercise_attempts (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  exercise_id VARCHAR(64) NOT NULL,
  answer TEXT NULL,
  is_correct TINYINT(1) NOT NULL,
  feedback TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  subject_id VARCHAR(64) NULL,
  topic VARCHAR(255) NULL,
  score INT NOT NULL,
  questions LONGTEXT NULL,
  answers LONGTEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrations Tracking Table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
