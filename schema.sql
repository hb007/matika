-- Schéma pro MySQL / MariaDB. Vytvoř databázi a naimportuj:
--   mysql -u root -p -e "CREATE DATABASE matika CHARACTER SET utf8mb4 COLLATE utf8mb4_czech_ci"
--   mysql -u root -p matika < schema.sql

CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(40) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rounds (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    module      VARCHAR(20) NOT NULL,
    level       VARCHAR(20) NOT NULL,
    questions   TEXT NOT NULL,            -- JSON se zadáním i správnými odpověďmi
    total       TINYINT NOT NULL,
    correct     TINYINT NOT NULL DEFAULT 0,
    points      INT NOT NULL DEFAULT 0,
    started_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME NULL,
    CONSTRAINT fk_rounds_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_rounds_user (user_id, finished_at),
    INDEX idx_rounds_finished (finished_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS answers (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    round_id       INT NOT NULL,
    idx            TINYINT NOT NULL,
    question       VARCHAR(80) NOT NULL,
    correct_answer VARCHAR(40) NOT NULL,
    given_answer   VARCHAR(40) NOT NULL,
    is_correct     TINYINT(1) NOT NULL,
    hint_used      TINYINT(1) NOT NULL DEFAULT 0,
    answered_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_answers_round FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
    UNIQUE KEY uq_answer (round_id, idx)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
