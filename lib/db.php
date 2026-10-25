<?php
// SQLite v data/ (složka zůstává v repu, viz tasks/lessons.md). Tabulky
// založí první požadavek sám; databázi ze starší verze (holka a kluk) převede.

// Žebříček ve Výsledcích (body ostatních dětí, jejich karty). Dočasně vypnutý:
// děti nemají mezi sebou soutěžit. Zapnutí: true.
const BOARD = false;

// Paleta barev dítěte: klíč → název a odstíny (světlý motiv: text i pozadí
// štítku; tmavý motiv: text, pozadí). Stejné klíče zná style.css ([data-color=…])
// a icon.php (ikona na plochu). Holka a kluk ze starší verze mají růžovou a petrolejovou.
const COLORS = [
    'ruzova'      => ['name' => 'růžová',      'light' => '#d6336c', 'dark' => '#ff86b0', 'dark_bg' => '#c22d62'],
    'petrolejova' => ['name' => 'petrolejová', 'light' => '#0c7c8c', 'dark' => '#46c7d8', 'dark_bg' => '#0b6f7d'],
    'cervena'     => ['name' => 'červená',     'light' => '#c92a2a', 'dark' => '#ff8787', 'dark_bg' => '#b02525'],
    'oranzova'    => ['name' => 'oranžová',    'light' => '#d9480f', 'dark' => '#ffa94d', 'dark_bg' => '#c0410d'],
    'zlata'       => ['name' => 'zlatá',       'light' => '#a37a00', 'dark' => '#ffd43b', 'dark_bg' => '#8c6900'],
    'zelena'      => ['name' => 'zelená',      'light' => '#2b8a3e', 'dark' => '#69db7c', 'dark_bg' => '#2f7a3a'],
    'limetkova'   => ['name' => 'limetková',   'light' => '#5c940d', 'dark' => '#a9e34b', 'dark_bg' => '#4f7f0b'],
    'modra'       => ['name' => 'modrá',       'light' => '#1f45b5', 'dark' => '#8fadff', 'dark_bg' => '#3557c9'],
    'fialova'     => ['name' => 'fialová',     'light' => '#7048e8', 'dark' => '#b197fc', 'dark_bg' => '#5f3dc4'],
    'purpurova'   => ['name' => 'purpurová',   'light' => '#ae3ec9', 'dark' => '#e599f7', 'dark_bg' => '#9c36b5'],
    'hneda'       => ['name' => 'hnědá',       'light' => '#8b5a2b', 'dark' => '#d9a066', 'dark_bg' => '#7a4e24'],
    'grafitova'   => ['name' => 'grafitová',   'light' => '#495057', 'dark' => '#ced4da', 'dark_bg' => '#3b4148'],
];

const DB_FILE = __DIR__ . '/../data/matika-v2.sqlite';

function db(bool $close = false): ?PDO
{
    static $pdo = null;
    if ($close) {   // zavřít před výměnou souboru; další db() otevře znovu
        $pdo = null;
        return null;
    }
    return $pdo ??= db_open('sqlite:' . DB_FILE);
}

// Nahradí vlastní databázi konzistentní kopií jiné (VACUUM INTO; zdroj se
// nemění). Jednorázové stěhování, třeba ze zkušební podsložky na hlavní doménu.
function db_replace_from(string $from): void
{
    if (!is_file($from) || !is_readable($from)) {
        throw new InvalidArgumentException('Soubor s databází nenalezen: ' . $from);
    }
    $tmp = DB_FILE . '.import';
    @unlink($tmp);
    $src = new PDO('sqlite:' . $from, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $src->exec('PRAGMA busy_timeout = 5000');
    $src->exec('VACUUM INTO ' . $src->quote($tmp));
    $src = null;
    db(true);
    foreach (['-wal', '-shm'] as $x) {
        @unlink(DB_FILE . $x);
    }
    if (!rename($tmp, DB_FILE)) {
        throw new InvalidArgumentException('Databázi se nepodařilo nahradit (práva ke složce data/?).');
    }
    db();
}

function db_open(string $dsn): PDO
{
    $pdo = new PDO($dsn, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA busy_timeout = 3000');   // víc dětí na víc zařízeních najednou
    // WAL: čtení (žebříček, stav) neblokuje zápis odpovědí a naopak; v paměti
    // (testy) ho SQLite nemá a vrátí „memory“, to nevadí
    $pdo->exec('PRAGMA journal_mode = WAL');
    // třídy: každá má registrační kód, podle něj se nové dítě zařadí
    $pdo->exec('CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE)');
    // děti: slug je v adrese (/u/anicka; holka a kluk mají /holka a /kluk), PIN je hash,
    // pin_fails a pin_until brzdí hádání PINu (lib/auth.php)
    $pdo->exec('CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT \'modra\', class_id INTEGER REFERENCES classes(id),
        pin_hash TEXT, pin_fails INTEGER NOT NULL DEFAULT 0, pin_until INTEGER NOT NULL DEFAULT 0,
        streak INTEGER NOT NULL DEFAULT 0, created TEXT NOT NULL DEFAULT \'\')');
    db_migrate_users($pdo);
    // zvací odkazy: ?pozvanka=<token> otevře registraci bez hesla, volitelně rovnou do třídy
    $pdo->exec('CREATE TABLE IF NOT EXISTS invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL UNIQUE, label TEXT NOT NULL,
        class_id INTEGER REFERENCES classes(id), created TEXT NOT NULL, uses INTEGER NOT NULL DEFAULT 0)');
    // zapamatovaná zařízení: cookie nese náhodný token, tady je jeho hash (lib/auth.php)
    $pdo->exec('CREATE TABLE IF NOT EXISTS tokens (
        hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), created INTEGER NOT NULL, used INTEGER NOT NULL)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS tokens_user ON tokens (user_id)');
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

// Starší verze měla users (id, kind, name, streak) jen pro holku a kluka.
// Tabulku přestavíme (SQLite neumí měnit sloupce): kind → slug, barva podle
// dítěte, bez PINu (nastaví si ho při prvním přihlášení). Body a vše ostatní
// zůstává, id se nemění. Nová tabulka vzniká vedle a stará se smaže, ne
// naopak: přejmenování staré by v SQLite 3.26+ přepsalo i REFERENCES users
// v ostatních tabulkách. Na čisté databázi se nic nezakládá (sešity vznikají
// registrací), holka a kluk existují jen tam, kde byli předtím.
function db_migrate_users(PDO $pdo): void
{
    $cols = array_column($pdo->query('PRAGMA table_info(users)')->fetchAll(), 'name');
    if (!in_array('kind', $cols, true)) {
        return;
    }
    $pdo->exec('BEGIN IMMEDIATE');
    try {
        $cols = array_column($pdo->query('PRAGMA table_info(users)')->fetchAll(), 'name');
        if (in_array('kind', $cols, true)) {   // mezitím to neudělal jiný požadavek
            $pdo->exec('CREATE TABLE users_new (
                id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
                color TEXT NOT NULL DEFAULT \'modra\', class_id INTEGER REFERENCES classes(id),
                pin_hash TEXT, pin_fails INTEGER NOT NULL DEFAULT 0, pin_until INTEGER NOT NULL DEFAULT 0,
                streak INTEGER NOT NULL DEFAULT 0, created TEXT NOT NULL DEFAULT \'\')');
            $pdo->exec("INSERT INTO users_new (id, slug, name, color, streak)
                SELECT id, kind, name, CASE kind WHEN 'holka' THEN 'ruzova' WHEN 'kluk' THEN 'petrolejova' ELSE 'modra' END, streak FROM users");
            $pdo->exec('DROP TABLE users');
            $pdo->exec('ALTER TABLE users_new RENAME TO users');
        }
        $pdo->exec('COMMIT');
    } catch (PDOException $e) {
        $pdo->exec('ROLLBACK');
        throw $e;
    }
}

// Dítě podle adresy (holka, kluk, anicka …); neznámé = null.
function user_by_slug(PDO $db, string $slug): ?array
{
    $st = $db->prepare('SELECT id, slug, name, color, class_id, pin_hash IS NOT NULL AS has_pin FROM users WHERE slug = ?');
    $st->execute([$slug]);
    $u = $st->fetch();
    return $u ? ['id' => (int) $u['id'], 'slug' => $u['slug'], 'name' => $u['name'], 'color' => $u['color'],
                 'class_id' => $u['class_id'] === null ? null : (int) $u['class_id'], 'has_pin' => (bool) $u['has_pin']] : null;
}

// Přezdívka dítěte pro název aplikace na ploše; neznámé dítě = ''.
function kid_name(PDO $db, string $slug): string
{
    return user_by_slug($db, $slug)['name'] ?? '';
}

// Cesta appky na webu (třeba „/“ nebo „/novy/“), pro cookie, session a <base>.
// Z REQUEST_URI, ne ze SCRIPT_NAME: některé hostingy (Wedos) dávají do
// SCRIPT_NAME cestu na disku („/subdom/matika/novy/admin.php“) a cookie s takovou
// cestou prohlížeč nikdy nepošle zpět. Odřízne se poslední část adresy: soubor
// (api.php, admin.php), přezdívka (/holka) nebo /u/<přezdívka>.
function app_path(): string
{
    $uri = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $dir = preg_replace('~/(u/)?[^/]*$~', '/', $uri);
    return $dir === '' || $dir === null || $dir[0] !== '/' ? '/' : $dir;
}

// Volby pro session_start: název podle cesty (dvě kopie appky na jednom webu
// si nepletou session) a ukládání do data/sessions, ne do systémové složky
// hostingu (ta bývá nezapisovatelná nebo se uklízí, a session se pak neudrží).
function session_options(): array
{
    $path = app_path();
    $opts = ['name' => 'matika_' . substr(md5($path), 0, 8), 'cookie_path' => $path, 'cookie_httponly' => true, 'cookie_samesite' => 'Lax'];
    $dir = __DIR__ . '/../data/sessions';
    if (is_dir($dir) || @mkdir($dir, 0700)) {
        if (is_writable($dir)) {
            $opts['save_path'] = $dir;
        }
    }
    return $opts;
}

// Nastavení mimo repo: data/config.php vrací pole, třeba ['admin_password' => '…'].
function config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $f = __DIR__ . '/../data/config.php';
        $cfg = is_file($f) ? (array) (include $f) : [];
    }
    return $cfg;
}
