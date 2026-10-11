<?php
// JSON API. Volá se POST /api.php?action=... s JSON tělem.
// Kdo cvičí, posílá stránka v každém požadavku (user: 1 holka, 2 kluk, bez
// hesla), takže karty /holka a /kluk v jednom prohlížeči se nepletou.
// Rozpracovaný příklad drží PHP session zvlášť pro každé dítě, správný
// výsledek klient dostane jen přes reveal.
declare(strict_types=1);

require __DIR__ . '/lib/generators.php';
require __DIR__ . '/lib/explain.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/game.php';

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

function require_uid(array $in): int
{
    $uid = (int) param($in, 'user');
    return user_exists(db(), $uid) ? $uid : fail('Nejdřív vyber, kdo cvičí.', 401);
}

// Rozpracovaný příklad dítěte; session ze starší verze (jiné klíče) neplatí.
function require_ex(int $uid): void
{
    if (!isset($_SESSION['cur'][$uid]['ex'])) {
        fail('Příklad vypršel, načti další.', 404);
    }
}

function state(string $today): array
{
    return ['modules' => MODULES, 'difficulties' => DIFFICULTIES, 'goal' => GOAL, 'users' => users_state(db(), $today)];
}

$action = $_GET['action'] ?? '';
$in = body();
$today = date('Y-m-d');
session_start(['cookie_httponly' => true, 'cookie_samesite' => 'Lax']);

try {
    switch ($action) {
        case 'state':
            out(state($today));

        case 'rename':
            try {
                rename_user(db(), (int) param($in, 'target'), param($in, 'name'));
            } catch (InvalidArgumentException $e) {
                fail($e->getMessage());
            }
            out(state($today));

        case 'next':
            $uid = require_uid($in);
            try {
                $_SESSION['cur'][$uid] = next_exercise(db(), $uid, param($in, 'module'), param($in, 'level'), param($in, 'difficulty'));
            } catch (InvalidArgumentException $e) {
                fail($e->getMessage());
            }
            $ex = $_SESSION['cur'][$uid]['ex'];
            out(['q' => $ex['q'], 'kind' => $ex['kind'], 'keys' => extra_keys($ex), 'review' => $_SESSION['cur'][$uid]['review']]);

        case 'hint':
            $uid = require_uid($in);
            require_ex($uid);
            $steps = hint_steps($_SESSION['cur'][$uid]['ex']);
            $shown = min(count($steps), (int) ($_SESSION['cur'][$uid]['ex']['hints'] ?? 0) + 1);
            $_SESSION['cur'][$uid]['ex']['hints'] = $shown;
            out(['steps' => array_slice($steps, 0, $shown), 'total' => count($steps)]);

        case 'answer':
            $uid = require_uid($in);
            require_ex($uid);
            try {
                $res = handle_answer(db(), $_SESSION['cur'][$uid], $uid, $in['answer'] ?? '', $today);
            } catch (DomainException $e) {
                fail($e->getMessage(), 409);
            }
            if ($res['correct']) {
                $res['users'] = users_state(db(), $today);
            }
            out($res);

        case 'reveal':
            $uid = require_uid($in);
            require_ex($uid);
            $res = handle_reveal(db(), $_SESSION['cur'][$uid], $uid, $today);
            out($res + ['users' => users_state(db(), $today)]);

        case 'stats':
            $stats = [];
            foreach (users_state(db(), $today) as $u) {
                $stats[$u['id']] = user_stats(db(), $u['id'], $today);
            }
            out(['users' => users_state(db(), $today), 'stats' => $stats]);

        default:
            fail('Neznámá akce.', 404);
    }
} catch (PDOException $e) {
    error_log('matika DB: ' . $e->getMessage());
    fail('Chyba databáze. Je složka data/ zapisovatelná?', 500);
}
