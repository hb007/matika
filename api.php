<?php
// JSON API. Volá se POST /api.php?action=... s JSON tělem.
// Uživatel = cookie s id (holka 1, kluk 2), bez hesla. Rozpracovaný příklad
// drží PHP session, správný výsledek klient dostane jen přes reveal.
declare(strict_types=1);

require __DIR__ . '/lib/generators.php';
require __DIR__ . '/lib/explain.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/game.php';

date_default_timezone_set('Europe/Prague');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const USER_COOKIE = 'matika_user';

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

function current_uid(): ?int
{
    $uid = (int) ($_COOKIE[USER_COOKIE] ?? 0);
    return user_exists(db(), $uid) ? $uid : null;
}

function require_uid(): int
{
    return current_uid() ?? fail('Nejdřív vyber, kdo cvičí.', 401);
}

// Rozpracovaný příklad; session ze starší verze (bez klíče ex) neplatí.
function require_ex(): void
{
    if (!isset($_SESSION['ex']['ex'])) {
        fail('Příklad vypršel, načti další.', 404);
    }
}

function state(?int $uid, string $today): array
{
    return ['modules' => MODULES, 'difficulties' => DIFFICULTIES, 'goal' => GOAL,
            'users' => users_state(db(), $today), 'user' => $uid];
}

$action = $_GET['action'] ?? '';
$in = body();
$today = date('Y-m-d');
session_start(['cookie_httponly' => true, 'cookie_samesite' => 'Lax']);

try {
    switch ($action) {
        case 'state':
            out(state(current_uid(), $today));

        case 'switch':
            $uid = (int) param($in, 'user');
            if (!user_exists(db(), $uid)) {
                fail('Neznámý uživatel.');
            }
            setcookie(USER_COOKIE, (string) $uid, [
                'expires' => time() + 365 * 86400, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax',
            ]);
            unset($_SESSION['ex']);   // rozpracovaný příklad nepatří novému uživateli
            out(state($uid, $today));

        case 'rename':
            try {
                rename_user(db(), (int) param($in, 'user'), param($in, 'name'));
            } catch (InvalidArgumentException $e) {
                fail($e->getMessage());
            }
            out(state(current_uid(), $today));

        case 'next':
            $uid = require_uid();
            try {
                $_SESSION['ex'] = next_exercise(db(), $uid, param($in, 'module'), param($in, 'level'), param($in, 'difficulty'));
            } catch (InvalidArgumentException $e) {
                fail($e->getMessage());
            }
            $ex = $_SESSION['ex']['ex'];
            out(['q' => $ex['q'], 'kind' => $ex['kind'], 'keys' => extra_keys($ex), 'review' => $_SESSION['ex']['review']]);

        case 'hint':
            require_uid();
            require_ex();
            $steps = hint_steps($_SESSION['ex']['ex']);
            $shown = min(count($steps), (int) ($_SESSION['ex']['ex']['hints'] ?? 0) + 1);
            $_SESSION['ex']['ex']['hints'] = $shown;
            out(['steps' => array_slice($steps, 0, $shown), 'total' => count($steps)]);

        case 'answer':
            $uid = require_uid();
            require_ex();
            try {
                $res = handle_answer(db(), $_SESSION['ex'], $uid, $in['answer'] ?? '', $today);
            } catch (DomainException $e) {
                fail($e->getMessage(), 409);
            }
            if ($res['correct']) {
                $res['users'] = users_state(db(), $today);
            }
            out($res);

        case 'reveal':
            $uid = require_uid();
            require_ex();
            $res = handle_reveal(db(), $_SESSION['ex'], $uid, $today);
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
