<?php
// SQLite v data/ (složka zůstává v repu, viz tasks/lessons.md). Tabulky
// a oba uživatele založí první požadavek sám.
function db(): PDO
{
    static $pdo = null;
    return $pdo ??= db_open('sqlite:' . __DIR__ . '/../data/matika-v2.sqlite');
}

function db_open(string $dsn): PDO
{
    $pdo = new PDO($dsn, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA busy_timeout = 3000');   // dvě děti na dvou zařízeních najednou
    $pdo->exec('CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY, kind TEXT NOT NULL, name TEXT NOT NULL, streak INTEGER NOT NULL DEFAULT 0)');
    $pdo->exec("INSERT OR IGNORE INTO users (id, kind, name) VALUES (1, 'holka', 'Holka'), (2, 'kluk', 'Kluk')");
    $pdo->exec('CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
        day TEXT NOT NULL, module TEXT NOT NULL, difficulty TEXT NOT NULL,
        question TEXT NOT NULL, answer TEXT NOT NULL,
        tries INTEGER NOT NULL, solved INTEGER NOT NULL, points INTEGER NOT NULL)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS results_user_day ON results (user_id, day)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS review (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
        task TEXT NOT NULL, q TEXT NOT NULL, ex TEXT NOT NULL, due INTEGER NOT NULL,
        UNIQUE (user_id, task, q))');
    // čas v appce za den a zařízení, sčítá se přes zařízení (lib/usage.php)
    $pdo->exec('CREATE TABLE IF NOT EXISTS usage_dev (
        user_id INTEGER NOT NULL REFERENCES users(id), day TEXT NOT NULL, device TEXT NOT NULL,
        ms INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, day, device))');
    // starší verze sčítala přírůstky do tabulky usage: převést jednou a smazat
    if ($pdo->query("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'usage'")->fetchColumn()) {
        try {
            $pdo->exec("INSERT OR IGNORE INTO usage_dev SELECT user_id, day, 'starsi', ms FROM usage");
            $pdo->exec('DROP TABLE usage');
        } catch (PDOException $e) {
            // dva požadavky najednou: druhý už tabulku nenajde
        }
    }
    // album nálepek (lib/rewards.php)
    $pdo->exec('CREATE TABLE IF NOT EXISTS stickers (
        user_id INTEGER NOT NULL REFERENCES users(id), kind TEXT NOT NULL,
        n INTEGER NOT NULL DEFAULT 1, first_day TEXT NOT NULL, PRIMARY KEY (user_id, kind))');
    // příklady vydané do zásoby pro offline (id je náhodné, klient ho vrací se sync)
    $pdo->exec('CREATE TABLE IF NOT EXISTS issued (
        id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
        task TEXT NOT NULL, ex TEXT NOT NULL, created INTEGER NOT NULL)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS issued_user ON issued (user_id, created)');
    return $pdo;
}

// Přezdívka dítěte (holka, kluk) pro název aplikace na ploše; neznámé dítě = ''.
function kid_name(PDO $db, string $kind): string
{
    $st = $db->prepare('SELECT name FROM users WHERE kind = ?');
    $st->execute([$kind]);
    return (string) $st->fetchColumn();
}
