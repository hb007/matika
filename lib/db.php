<?php
// Připojení k DB přes PDO. MySQL je hlavní cíl; SQLite se hodí na lokální
// zkoušení (schéma se pak založí samo).
function db(): PDO
{
    static $pdo = null;
    if ($pdo) {
        return $pdo;
    }
    $cfg = require __DIR__ . '/../config.php';
    $pdo = new PDO($cfg['dsn'], $cfg['user'], $cfg['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    if (str_starts_with($cfg['dsn'], 'sqlite:')) {
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
        $pdo->exec('CREATE TABLE IF NOT EXISTS rounds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            module TEXT NOT NULL, level TEXT NOT NULL, questions TEXT NOT NULL,
            total INTEGER NOT NULL, correct INTEGER NOT NULL DEFAULT 0,
            points INTEGER NOT NULL DEFAULT 0,
            started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, finished_at TEXT NULL)');
        $pdo->exec('CREATE TABLE IF NOT EXISTS answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
            idx INTEGER NOT NULL, question TEXT NOT NULL, correct_answer TEXT NOT NULL,
            given_answer TEXT NOT NULL, is_correct INTEGER NOT NULL,
            answered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (round_id, idx))');
    }
    return $pdo;
}

// SQL výraz "teď minus N dní" – liší se mezi MySQL a SQLite.
function sql_days_ago(int $days): string
{
    $driver = db()->getAttribute(PDO::ATTR_DRIVER_NAME);
    return $driver === 'sqlite'
        ? "datetime('now', '-$days days')"
        : "NOW() - INTERVAL $days DAY";
}

function sql_today_start(): string
{
    $driver = db()->getAttribute(PDO::ATTR_DRIVER_NAME);
    return $driver === 'sqlite' ? "date('now')" : "CURDATE()";
}
