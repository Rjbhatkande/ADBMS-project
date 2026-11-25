-- ============================================================================
-- Smart Campus Event Engine & Ticket Hub - MySQL Schema
-- ============================================================================

CREATE DATABASE IF NOT EXISTS campus_events
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campus_events;

-- 1. Users (Students, Organizers, Admins)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  year TINYINT UNSIGNED NOT NULL DEFAULT 1,
  role ENUM('student', 'organizer', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_user_year CHECK (year BETWEEN 1 AND 6)
) ENGINE=InnoDB;

-- 2. Clubs
CREATE TABLE IF NOT EXISTS clubs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  category VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  lead_name VARCHAR(120) NOT NULL,
  lead_email VARCHAR(160) NOT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clubs_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. Club Memberships (Many-to-Many: Users <-> Clubs)
CREATE TABLE IF NOT EXISTS club_memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  club_id INT NOT NULL,
  member_role ENUM('member', 'coordinator', 'president') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_club_member (user_id, club_id),
  CONSTRAINT fk_membership_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_membership_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Events
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_code VARCHAR(32) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar') NOT NULL DEFAULT 'Technical',
  club_id INT NOT NULL,
  venue VARCHAR(160) NOT NULL,
  event_date DATETIME NOT NULL,
  capacity INT UNSIGNED NOT NULL,
  seats_available INT UNSIGNED NOT NULL,
  entry_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE RESTRICT,
  CONSTRAINT fk_events_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_event_seats CHECK (seats_available <= capacity),
  CONSTRAINT chk_event_fee CHECK (entry_fee >= 0),
  INDEX idx_events_category (category),
  INDEX idx_events_fee_seats (entry_fee, seats_available),
  INDEX idx_events_date (event_date)
) ENGINE=InnoDB;

-- 5. Event Tags (1-to-Many)
CREATE TABLE IF NOT EXISTS event_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  tag VARCHAR(60) NOT NULL,
  UNIQUE KEY uq_event_tag (event_id, tag),
  INDEX idx_tag_name (tag),
  CONSTRAINT fk_tags_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Event Coordinators (1-to-Many)
CREATE TABLE IF NOT EXISTS event_coordinators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  contact VARCHAR(160) NOT NULL,
  CONSTRAINT fk_coord_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Event Sponsors (1-to-Many, unique per event to avoid duplicates)
CREATE TABLE IF NOT EXISTS event_sponsors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  sponsor_name VARCHAR(120) NOT NULL,
  UNIQUE KEY uq_event_sponsor (event_id, sponsor_name),
  CONSTRAINT fk_sponsor_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Registrations / Tickets (Many-to-Many with attributes: Users <-> Events)
CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(40) NOT NULL UNIQUE,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  student_id VARCHAR(32) NOT NULL,
  student_name VARCHAR(120) NOT NULL,
  department VARCHAR(100) NOT NULL,
  year TINYINT UNSIGNED NOT NULL,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  check_in_status BOOLEAN NOT NULL DEFAULT FALSE,
  checked_in_at DATETIME NULL,
  payment_method ENUM('UPI', 'Card', 'Free', 'Cash') NOT NULL DEFAULT 'UPI',
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  payment_status ENUM('Completed', 'Pending', 'Refunded') NOT NULL DEFAULT 'Completed',
  UNIQUE KEY uq_user_event_registration (event_id, user_id),
  INDEX idx_reg_department (department),
  INDEX idx_reg_checkin (check_in_status),
  CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_reg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
