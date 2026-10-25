<?php
// JSON API. Volá se POST /api.php?action=... s JSON tělem.
// Kdo cvičí, posílá stránka v každém požadavku (user: id dítěte), takže
// karty víc dětí v jednom prohlížeči se nepletou. Server ověří, že je dítě
// na tomhle zařízení přihlášené (tokeny v cookie, lib/auth.php). user 0 je
// „bez sešitu“: příklady bez ukládání, body jen do zavření prohlížeče.
// Rozpracovaný příklad drží PHP session zvlášť pro každé dítě, správný
// výsledek klient dostane jen přes reveal.
declare(strict_types=1);

require __DIR__ . '/lib/generators.php';
require __DIR__ . '/lib/explain.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/game.php';
require __DIR__ . '/lib/rewards.php';
require __DIR__ . '/lib/usage.php';
require __DIR__ . '/lib/offline.php';

date_default_timezone_set('Europe/Prague');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out($data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $msg, int $code = 400): never
{
    out(['error' => $msg], $code);
}

function body(): array
{
    $raw = file_get_contents('php://input');
    $data = $raw ? json_decode($raw, true) : [];
    return is_array($data) ? $data : [];
}

function param(array $in, string $key): string
{
    return is_scalar($in[$key] ?? null) ? (string) $in[$key] : '';
}

// ---------- přihlášení (cookie s tokeny) ----------
$now = time();
$tokens = cookie_tokens($_COOKIE[TOKEN_COOKIE] ?? '');
$logged = [];   // [uid => token], naplní se po otevření databáze

function cookie_path(): string
{
    return rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/'), '/\\') . '/';
}

function write_cookie(array $tokens): void
{
    global $now;
    setcookie(TOKEN_COOKIE, implode('.', array_slice($tokens, -TOKENS_MAX)), [
        'expires' => $tokens ? $now + TOKEN_DAYS * 86400 : 1, 'path' => cookie_path(),
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'httponly' => true, 'samesite' => 'Lax',
    ]);
}

// Přihlásí dítě na tomhle zařízení (token do cookie).
function log_in(int $uid): void
{
    global $logged, $tokens, $now;
    if (isset($logged[$uid])) {
        return;
    }
    $t = issue_token(db(), $uid, $now);
    $tokens[] = $t;
    $logged[$uid] = $t;
    write_cookie($tokens);
}

function log_out(int $uid): void
{
    global $logged, $tokens;
    if (!isset($logged[$uid])) {
        return;
    }
    revoke_token(db(), $logged[$uid]);
    $tokens = array_values(array_diff($tokens, [$logged[$uid]]));
    unset($logged[$uid]);
    write_cookie($tokens);
}

// Dítě z požadavku: přihlášené na tomhle zařízení, nebo „bez sešitu“ (0).
function require_uid(array $in, bool $allowGuest = false): int
{
    global $logged;
    $uid = (int) param($in, 'user');
    if ($uid === GUEST && $allowGuest) {
        return GUEST;
    }
    if (!isset($logged[$uid]) || !user_exists(db(), $uid)) {
        fail('Nejdřív se přihlas.', 401);
    }
    return $uid;
}

// Rozpracovaný příklad dítěte.
function require_ex(int $uid): void
{
    if (!isset($_SESSION['cur'][$uid]['ex'])) {
        fail('Příklad vypršel, načti další.', 404);
    }
}

// Řádek „bez sešitu“ ve tvaru jako dítě: body jen za tuhle návštěvu (session).
function guest_state(string $today): array
{
    $g = $_SESSION['guest'] ?? [];
    if (($g['day'] ?? '') !== $today) {
        $g = ['day' => $today, 'points' => 0, 'solved' => 0, 'streak' => 0];
    }
    $_SESSION['guest'] = $g;
    return ['id' => GUEST, 'slug' => '', 'name' => 'Bez účtu', 'color' => 'modra', 'class_id' => null, 'class_name' => '',
            'streak' => $g['streak'], 'has_pin' => false, 'created' => '', 'days' => 0, 'time_today' => 0,
            'total' => $g['points'], 'week' => $g['points'], 'today' => $g['points'], 'solved_today' => $g['solved']];
}

// Stav pro klienta: přihlášené děti na zařízení (+ řádek bez sešitu) a dítě ze stránky.
function state(string $today, string $slug = ''): array
{
    global $logged;
    $users = users_state(db(), $today, array_keys($logged));
    $users[] = guest_state($today);
    $page = $slug !== '' ? user_by_slug(db(), $slug) : null;
    return ['modules' => MODULES, 'difficulties' => DIFFICULTIES, 'goal' => GOAL, 'stickers' => STICKERS,
            'colors' => array_map(fn($c) => $c['name'], COLORS), 'pin' => ['min' => PIN_MIN, 'max' => PIN_MAX],
            'users' => $users, 'page' => $page ? $page + ['logged' => isset($logged[$page['id']])] : null];
}

$action = $_GET['action'] ?? '';
$in = body();
$today = date('Y-m-d');
session_start(session_options());   // název podle cesty, úložiště v data/sessions (lib/db.php)

try {
    $logged = logged_users(db(), $tokens, $now);
    switch ($action) {
        case 'state':
            out(state($today, param($in, 'slug')));

        case 'register':
            // nový sešit: přezdívka, barva, PIN a kód třídy; rovnou přihlásí
            try {
                $uid = register_user(db(), param($in, 'name'), param($in, 'color'), param($in, 'pin'), param($in, 'code'), $today);
            } catch (InvalidArgumentException $e) {
                fail($e->getMessage());
            }
            log_in($uid);
            out(state($today) + ['user' => user_rows(db(), [$uid])[0]]);

        case 'login':
            // podle id (sešit z úvodní obrazovky) nebo přezdívky (jiné dítě)
            $u = (int) param($in, 'target') ? (user_rows(db(), [(int) param($in, 'target')])[0] ?? null) : null;
            if (!$u && param($in, 'name') !== '') {
                // porovnání bez ohledu na velikost písmen i u háčků (lower() v SQLite umí jen ASCII)
                $want = mb_strtolower(trim(param($in, 'name')));
                $ids = [];
                foreach (db()->query('SELECT id, name FROM users ORDER BY id')->fetchAll() as $row) {
                    if (mb_strtolower($row['name']) === $want) {
                        $ids[] = (int) $row['id'];
                    }
                }
                if (count($ids) > 1) {
                    fail('Takhle se jmenuje víc dětí. Otevři svou adresu (třeba /u/anicka-2).');
                }
                $u = $ids ? user_rows(db(), [(int) $ids[0]])[0] : null;
            }
            if (!$u) {
                fail('Takový účet tu není. Zkontroluj přezdívku.');
            }
            try {
                if (!$u['has_pin']) {
                    // sešit ze starší verze: první přihlášení si PIN nastaví
                    set_pin(db(), $u['id'], param($in, 'pin'));   // zároveň odhlásí případná jiná zařízení
                } else {
                    check_pin(db(), $u['id'], param($in, 'pin'), $now);
                }
            } catch (InvalidArgumentException $e) {
                fail($e->getMessage());
            }
            log_in($u['id']);
            out(state($today) + ['user' => user_rows(db(), [$u['id']])[0]]);

        case 'logout':
            log_out((int) param($in, 'user'));
            out(state($today));

        case 'pin':
            // změna PINu: starý a nový
            $uid = require_uid($in);
            try {
                check_pin(db(), $uid, param($in, 'old'), $now);
                set_pin(db(), $uid, param($in, 'pin'), $logged[$uid]);
            } catch (InvalidArgumentException $e) {
                fail($e->getMessage());
            }
            out(['ok' => true]);

        case 'rename':
            $uid = require_uid($in);
            try {
                rename_user(db(), $uid, param($in, 'name'));
            } catch (InvalidArgumentException $e) {
                fail($e->getMessage());
            }
            out(state($today));

        case 'reset':
            $uid = require_uid($in);
            reset_points(db(), $uid);
            out(state($today));

        case 'next':
            $uid = require_uid($in, true);
            $streak = $uid === GUEST ? (int) (guest_state($today)['streak']) : 0;
            try {
                $_SESSION['cur'][$uid] = next_exercise(db(), $uid, param($in, 'module'), param($in, 'level'), param($in, 'difficulty'));
            } catch (InvalidArgumentException $e) {
                fail($e->getMessage());
            }
            $_SESSION['cur'][$uid]['streak'] = $streak;   // bez sešitu: série v řadě přes příklady
            $ex = $_SESSION['cur'][$uid]['ex'];
            out(['q' => $ex['q'], 'kind' => $ex['kind'], 'keys' => extra_keys($ex), 'var' => question_var($ex), 'unit' => question_unit($ex), 'review' => $_SESSION['cur'][$uid]['review'],
                 'diff' => $_SESSION['cur'][$uid]['diff']]);   // skutečná obtížnost (v mixu „vše“ se mění)

        case 'hint':
            $uid = require_uid($in, true);
            require_ex($uid);
            $steps = hint_steps($_SESSION['cur'][$uid]['ex']);
            $shown = min(count($steps), (int) ($_SESSION['cur'][$uid]['ex']['hints'] ?? 0) + 1);
            $_SESSION['cur'][$uid]['ex']['hints'] = $shown;
            out(['steps' => array_slice($steps, 0, $shown), 'total' => count($steps)]);

        case 'answer':
            $uid = require_uid($in, true);
            require_ex($uid);
            try {
                $res = handle_answer(db(), $_SESSION['cur'][$uid], $uid, $in['answer'] ?? '', $today);
            } catch (DomainException $e) {
                fail($e->getMessage(), 409);
            }
            if ($uid === GUEST) {
                $g = guest_state($today);
                $_SESSION['guest']['streak'] = $_SESSION['cur'][$uid]['streak'] ?? 0;
                if ($res['correct']) {
                    $_SESSION['guest']['points'] += $res['points'] + $res['bonus'];
                    $_SESSION['guest']['solved']++;
                }
            }
            if ($res['correct']) {
                $res['users'] = state($today)['users'];
            }
            out($res);

        case 'reveal':
            $uid = require_uid($in, true);
            require_ex($uid);
            $res = handle_reveal(db(), $_SESSION['cur'][$uid], $uid, $today);
            if ($uid === GUEST) {
                guest_state($today);
                $_SESSION['guest']['streak'] = 0;
            }
            out($res + ['users' => state($today)['users']]);

        case 'pool':
            // zásoba příkladů pro offline (viz lib/offline.php)
            $uid = require_uid($in);
            out(['pool' => issue_pool(db(), $uid, is_array($in['want'] ?? null) ? $in['want'] : [], time())]);

        case 'sync':
            // výsledky vyřešené bez internetu
            $uid = require_uid($in);
            $done = sync_results(db(), $uid, is_array($in['items'] ?? null) ? $in['items'] : [], time());
            out(['done' => $done, 'users' => state($today)['users']]);

        case 'time':
            // celkový čas v appce za den na tomto zařízení (viz lib/usage.php)
            $uid = require_uid($in);
            try {
                out(['ms' => add_usage(db(), $uid, param($in, 'device'), is_array($in['items'] ?? null) ? $in['items'] : [], $today)]);
            } catch (InvalidArgumentException $e) {
                fail($e->getMessage());
            }

        case 'stats':
            // moje výsledky, album a přehled pro rodiče; žebříček třídy a všech
            $uid = require_uid($in);
            $me = user_rows(db(), [$uid])[0];
            out(['users' => state($today)['users'], 'stats' => user_stats(db(), $uid, $today),
                 'board' => ['all' => leaderboard(db(), $today, null),
                             'class' => $me['class_id'] === null ? null : leaderboard(db(), $today, $me['class_id']),
                             'class_name' => $me['class_name']]]);

        case 'card':
            // veřejná karta jiného dítěte (klepnutí v žebříčku)
            require_uid($in, true);
            $card = user_card(db(), (int) param($in, 'target'), $today);
            $card ? out($card) : fail('Takový účet tu není.', 404);

        default:
            fail('Neznámá akce.', 404);
    }
} catch (PDOException $e) {
    error_log('matika DB: ' . $e->getMessage());
    fail('Chyba databáze. Je složka data/ zapisovatelná?', 500);
}
