<?php
// Přihlášení dětí: sešit (účet) s přezdívkou, barvou a PINem, zařazený do
// třídy podle registračního kódu. Zařízení si přihlášení pamatuje v cookie
// s náhodnými tokeny (v databázi jen jejich hash), pro každé přihlášené dítě
// jeden, takže na sdíleném tabletu je přihlášených víc dětí najednou a každý
// požadavek říká, za které dítě jde (api.php ověří, že je mezi přihlášenými).
// Hádání PINu brzdí zámek: po PIN_FAILS špatných pokusech PIN_LOCK sekund pauza.

const PIN_MIN = 4;
const PIN_MAX = 6;
const PIN_FAILS = 5;
const PIN_LOCK = 60;
const TOKEN_COOKIE = 'matika_sesity';
const TOKEN_DAYS = 400;      // cookie i token v databázi (prohlížeče delší nedovolí)
const TOKENS_MAX = 12;       // nejvíc přihlášených dětí na jednom zařízení
const NAME_MAX = 20;

function clean_name(string $name): string
{
    $name = trim((string) preg_replace('/\s+/u', ' ', $name));   // neplatné UTF-8 → null → ''
    if ($name === '' || mb_strlen($name) > NAME_MAX) {
        throw new InvalidArgumentException('Přezdívka musí mít 1 až ' . NAME_MAX . ' znaků.');
    }
    return $name;
}

function clean_pin(string $pin): string
{
    if (!preg_match('/^\d{' . PIN_MIN . ',' . PIN_MAX . '}$/', $pin)) {
        throw new InvalidArgumentException('PIN má ' . PIN_MIN . ' až ' . PIN_MAX . ' číslic.');
    }
    return $pin;
}

function clean_color(string $color): string
{
    return isset(COLORS[$color]) ? $color : throw new InvalidArgumentException('Vyber barvu.');
}

// Přezdívka → část adresy: bez diakritiky, malá písmena, číslice a pomlčky.
function slugify(string $name): string
{
    static $map = ['á' => 'a', 'ä' => 'a', 'č' => 'c', 'ď' => 'd', 'é' => 'e', 'ě' => 'e', 'ë' => 'e', 'í' => 'i', 'ľ' => 'l', 'ĺ' => 'l',
        'ň' => 'n', 'ó' => 'o', 'ô' => 'o', 'ö' => 'o', 'ř' => 'r', 'ŕ' => 'r', 'š' => 's', 'ť' => 't', 'ú' => 'u', 'ů' => 'u', 'ü' => 'u',
        'ý' => 'y', 'ž' => 'z', 'ß' => 'ss', 'ł' => 'l', 'ą' => 'a', 'ę' => 'e', 'ś' => 's', 'ź' => 'z', 'ż' => 'z', 'ć' => 'c', 'ń' => 'n'];
    $s = strtr(mb_strtolower($name), $map);
    $s = trim((string) preg_replace('/[^a-z0-9]+/', '-', $s), '-');
    return $s === '' ? 'dite' : substr($s, 0, NAME_MAX);
}

function class_by_code(PDO $db, string $code): ?array
{
    $st = $db->prepare('SELECT id, name, code FROM classes WHERE code = ?');
    $st->execute([strtoupper(trim($code))]);   // kód se opisuje z tabule, velikost písmen nevadí
    $c = $st->fetch();
    return $c ? ['id' => (int) $c['id'], 'name' => $c['name'], 'code' => $c['code']] : null;
}

// Nový sešit. Vrací id dítěte. Kód třídy musí sedět (ochrana před roboty
// a cizími lidmi; děti ho dostanou od učitele nebo rodiče).
function register_user(PDO $db, string $name, string $color, string $pin, string $code, string $today): int
{
    $name = clean_name($name);
    $color = clean_color($color);
    $pin = clean_pin($pin);
    $class = class_by_code($db, $code);
    if (!$class) {
        throw new InvalidArgumentException('Kód třídy nesedí. Zeptej se, kdo ti ho dal.');
    }
    $base = slugify($name);
    $slug = $base;
    for ($i = 2; user_by_slug($db, $slug); $i++) {
        $slug = "$base-$i";
    }
    $db->prepare('INSERT INTO users (slug, name, color, class_id, pin_hash, created) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$slug, $name, $color, $class['id'], password_hash($pin, PASSWORD_DEFAULT), $today]);
    return (int) $db->lastInsertId();
}

// Ověří PIN. Při zámku nebo špatném PINu vyhodí výjimku s hláškou pro dítě.
function check_pin(PDO $db, int $uid, string $pin, int $now): void
{
    $st = $db->prepare('SELECT pin_hash, pin_fails, pin_until FROM users WHERE id = ?');
    $st->execute([$uid]);
    $u = $st->fetch();
    if (!$u) {
        throw new InvalidArgumentException('Neznámé dítě.');
    }
    if ((int) $u['pin_until'] > $now) {
        throw new InvalidArgumentException('Moc špatných pokusů. Zkus to za chvíli.');
    }
    if ($u['pin_hash'] === null) {
        throw new InvalidArgumentException('Tenhle sešit ještě nemá PIN.');
    }
    if (!password_verify($pin, $u['pin_hash'])) {
        $fails = (int) $u['pin_fails'] + 1;
        $until = $fails >= PIN_FAILS ? $now + PIN_LOCK : 0;
        $db->prepare('UPDATE users SET pin_fails = ?, pin_until = ? WHERE id = ?')->execute([$until ? 0 : $fails, $until, $uid]);
        throw new InvalidArgumentException($until ? 'Moc špatných pokusů. Zkus to za minutu.' : 'Špatný PIN.');
    }
    $db->prepare('UPDATE users SET pin_fails = 0, pin_until = 0 WHERE id = ?')->execute([$uid]);
}

function set_pin(PDO $db, int $uid, string $pin): void
{
    $db->prepare('UPDATE users SET pin_hash = ?, pin_fails = 0, pin_until = 0 WHERE id = ?')
        ->execute([password_hash(clean_pin($pin), PASSWORD_DEFAULT), $uid]);
}

// Sešit ze starší verze (holka, kluk) PIN nemá: první přihlášení si ho nastaví.
function has_pin(PDO $db, int $uid): bool
{
    $st = $db->prepare('SELECT pin_hash IS NOT NULL FROM users WHERE id = ?');
    $st->execute([$uid]);
    return (bool) $st->fetchColumn();
}

// ---------- zapamatovaná zařízení (tokeny) ----------

function token_hash(string $token): string
{
    return hash('sha256', $token);
}

// Tokeny z cookie (jen platný tvar).
function cookie_tokens(string $cookie): array
{
    return array_values(array_filter(explode('.', $cookie), fn($t) => preg_match('/^[0-9a-f]{32}$/', $t)));
}

// Přihlášené děti podle tokenů v cookie: [uid => token]. Prošlé tokeny neplatí.
function logged_users(PDO $db, array $tokens, int $now): array
{
    if (!$tokens) {
        return [];
    }
    $out = [];
    $st = $db->prepare('SELECT user_id, created FROM tokens WHERE hash = ?');
    foreach ($tokens as $t) {
        $st->execute([token_hash($t)]);
        $row = $st->fetch();
        if ($row && (int) $row['created'] > $now - TOKEN_DAYS * 86400) {
            $out[(int) $row['user_id']] = $t;
        }
    }
    return $out;
}

// Nový token pro dítě (po ověření PINu); vrací ho pro cookie.
function issue_token(PDO $db, int $uid, int $now): string
{
    $token = bin2hex(random_bytes(16));
    $db->prepare('INSERT INTO tokens (hash, user_id, created, used) VALUES (?, ?, ?, ?)')->execute([token_hash($token), $uid, $now, $now]);
    $db->prepare('DELETE FROM tokens WHERE created < ?')->execute([$now - TOKEN_DAYS * 86400]);
    return $token;
}

function revoke_token(PDO $db, string $token): void
{
    $db->prepare('DELETE FROM tokens WHERE hash = ?')->execute([token_hash($token)]);
}

// Smaže sešit i se vším, co k němu patří (body, nálepky, čas, zásoba, přihlášení).
function delete_user(PDO $db, int $uid): void
{
    foreach (['results', 'review', 'usage_dev', 'stickers', 'issued', 'tokens'] as $t) {
        $db->prepare("DELETE FROM $t WHERE user_id = ?")->execute([$uid]);
    }
    $db->prepare('DELETE FROM users WHERE id = ?')->execute([$uid]);
}

// ---------- třídy ----------

function class_code(): string
{
    // bez 0/O a 1/I, ať se kód dobře opisuje z tabule
    $abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $s = '';
    for ($i = 0; $i < 6; $i++) {
        $s .= $abc[random_int(0, strlen($abc) - 1)];
    }
    return $s;
}

function add_class(PDO $db, string $name, string $code = ''): int
{
    $name = clean_name($name);
    $code = strtoupper(trim($code)) ?: class_code();
    if (!preg_match('/^[A-Z0-9]{4,12}$/', $code)) {
        throw new InvalidArgumentException('Kód třídy: 4 až 12 písmen a číslic.');
    }
    if (class_by_code($db, $code)) {
        throw new InvalidArgumentException('Tenhle kód už má jiná třída.');
    }
    $db->prepare('INSERT INTO classes (name, code) VALUES (?, ?)')->execute([$name, $code]);
    return (int) $db->lastInsertId();
}

function classes(PDO $db): array
{
    return $db->query('SELECT c.id, c.name, c.code, COUNT(u.id) AS kids FROM classes c LEFT JOIN users u ON u.class_id = c.id
        GROUP BY c.id ORDER BY c.name')->fetchAll();
}
