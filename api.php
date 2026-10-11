<?php
// JSON API. Volá se POST /api.php?action=... s JSON tělem.
// Identita = cookie s id uživatele (jen jméno, bez hesla – appka je pro děti
// v rodině/třídě, ne pro veřejný internet).
declare(strict_types=1);

require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/generators.php';
require __DIR__ . '/lib/explain.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const COOKIE = 'matika_uid';

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

function current_user(): ?array
{
    $uid = (int) ($_COOKIE[COOKIE] ?? 0);
    if ($uid <= 0) {
        return null;
    }
    $st = db()->prepare('SELECT id, name FROM users WHERE id = ?');
    $st->execute([$uid]);
    return $st->fetch() ?: null;
}

function require_user(): array
{
    return current_user() ?? fail('Nejdřív si vyber jméno.', 401);
}

// Body za správnou odpověď: 10, každý krok nápovědy −3, nejméně 1.
function points_for(int $hints): int
{
    return max(1, 10 - 3 * $hints);
}

function stars(int $correct, int $total): int
{
    $pct = $total ? $correct / $total : 0;
    return $pct >= 1 ? 3 : ($pct >= 0.8 ? 2 : ($pct >= 0.5 ? 1 : 0));
}

$cfg = require __DIR__ . '/config.php';
$action = $_GET['action'] ?? '';
$in = body();

try {
    switch ($action) {
        case 'modules':
            out(['modules' => MODULES, 'user' => current_user()]);

        case 'users':
            out(['users' => db()->query('SELECT id, name FROM users ORDER BY name')->fetchAll()]);

        case 'login':
            $name = trim(preg_replace('/\s+/u', ' ', (string) ($in['name'] ?? '')));
            if ($name === '' || mb_strlen($name) > 40) {
                fail('Jméno musí mít 1–40 znaků.');
            }
            $st = db()->prepare('SELECT id, name FROM users WHERE name = ?');
            $st->execute([$name]);
            $user = $st->fetch();
            if (!$user) {
                db()->prepare('INSERT INTO users (name) VALUES (?)')->execute([$name]);
                $user = ['id' => (int) db()->lastInsertId(), 'name' => $name];
            }
            setcookie(COOKIE, (string) $user['id'], [
                'expires' => time() + 365 * 86400, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax',
            ]);
            out(['user' => $user]);

        case 'logout':
            setcookie(COOKIE, '', ['expires' => time() - 3600, 'path' => '/']);
            out(['ok' => true]);

        case 'start':
            $user = require_user();
            $module = (string) ($in['module'] ?? '');
            $level = (string) ($in['level'] ?? '');
            try {
                $questions = generate_round($module, $level, (int) $cfg['round_size']);
            } catch (InvalidArgumentException $e) {
                fail($e->getMessage());
            }
            db()->prepare('INSERT INTO rounds (user_id, module, level, questions, total) VALUES (?, ?, ?, ?, ?)')
                ->execute([$user['id'], $module, $level, json_encode($questions), count($questions)]);
            $rid = (int) db()->lastInsertId();
            // klientovi jdou jen zadání, odpovědi zůstávají na serveru
            $public = array_map(fn($ex, $i) => ['i' => $i, 'q' => $ex['q'], 'kind' => $ex['kind']], $questions, array_keys($questions));
            out(['round_id' => $rid, 'questions' => $public]);

        case 'hint':
            // další krok nápovědy; každý odkrytý krok ubere body (viz points_for)
            $user = require_user();
            $rid = (int) ($in['round_id'] ?? 0);
            $i = (int) ($in['i'] ?? -1);
            $st = db()->prepare('SELECT * FROM rounds WHERE id = ? AND user_id = ? AND finished_at IS NULL');
            $st->execute([$rid, $user['id']]);
            $round = $st->fetch() ?: fail('Kolo nenalezeno.', 404);
            $questions = json_decode($round['questions'], true);
            if (!isset($questions[$i])) {
                fail('Špatné číslo příkladu.');
            }
            $steps = hint_steps($questions[$i]);
            $shown = (int) ($questions[$i]['hints'] ?? 0);
            if ($shown < count($steps)) {
                $shown++;
                $questions[$i]['hints'] = $shown;
                db()->prepare('UPDATE rounds SET questions = ? WHERE id = ?')->execute([json_encode($questions), $rid]);
            }
            out([
                'steps' => array_slice($steps, 0, $shown),
                'total' => count($steps),
                'points' => points_for($shown),
            ]);

        case 'answer':
            $user = require_user();
            $rid = (int) ($in['round_id'] ?? 0);
            $i = (int) ($in['i'] ?? -1);
            $st = db()->prepare('SELECT * FROM rounds WHERE id = ? AND user_id = ? AND finished_at IS NULL');
            $st->execute([$rid, $user['id']]);
            $round = $st->fetch() ?: fail('Kolo nenalezeno.', 404);
            $questions = json_decode($round['questions'], true);
            if (!isset($questions[$i])) {
                fail('Špatné číslo příkladu.');
            }
            $ex = $questions[$i];
            $given = $in['answer'] ?? '';
            [$ok, $note] = check_answer($ex, $given);
            $hints = (int) ($ex['hints'] ?? 0);
            $points = $ok ? points_for($hints) : 0;
            // první odpověď na příklad se počítá; opakované odeslání se ignoruje
            $st = db()->prepare('SELECT is_correct FROM answers WHERE round_id = ? AND idx = ?');
            $st->execute([$rid, $i]);
            if ($st->fetch() === false) {
                db()->prepare('INSERT INTO answers (round_id, idx, question, correct_answer, given_answer, is_correct, hint_used) VALUES (?, ?, ?, ?, ?, ?, ?)')
                    ->execute([$rid, $i, $ex['q'], answer_str($ex), given_str($ex, $given), $ok ? 1 : 0, $hints]);
                if ($ok) {
                    db()->prepare('UPDATE rounds SET correct = correct + 1, points = points + ? WHERE id = ?')->execute([$points, $rid]);
                }
            }
            $res = ['correct' => $ok, 'answer' => answer_str($ex), 'note' => $note, 'points' => $points];
            if (!$ok) {
                $res['why'] = $note !== '' ? '' : diagnose($ex, $given);   // u nečitelné odpovědi stačí poznámka
                $res['steps'] = explain($ex);
            }
            out($res);

        case 'finish':
            $user = require_user();
            $rid = (int) ($in['round_id'] ?? 0);
            $st = db()->prepare('SELECT * FROM rounds WHERE id = ? AND user_id = ?');
            $st->execute([$rid, $user['id']]);
            $round = $st->fetch() ?: fail('Kolo nenalezeno.', 404);
            if ($round['finished_at'] === null) {
                $bonus = (int) $round['correct'] === (int) $round['total'] ? 20 : 0;
                $now = date('Y-m-d H:i:s');
                db()->prepare('UPDATE rounds SET finished_at = ?, points = points + ? WHERE id = ?')->execute([$now, $bonus, $rid]);
                $round['points'] += $bonus;
            }
            // nejlepší dřívější výsledek ve stejném modulu a úrovni
            $st = db()->prepare('SELECT MAX(correct) AS best FROM rounds WHERE user_id = ? AND module = ? AND level = ? AND finished_at IS NOT NULL AND id <> ?');
            $st->execute([$user['id'], $round['module'], $round['level'], $rid]);
            $best = (int) ($st->fetch()['best'] ?? 0);
            $st = db()->prepare('SELECT idx, question, correct_answer, given_answer, is_correct, hint_used FROM answers WHERE round_id = ? ORDER BY idx');
            $st->execute([$rid]);
            $questions = json_decode($round['questions'], true);
            $answers = array_map(function ($a) use ($questions) {
                $a['steps'] = $a['is_correct'] ? [] : explain($questions[$a['idx']] ?? []);
                return $a;
            }, $st->fetchAll());
            out([
                'correct' => (int) $round['correct'],
                'total' => (int) $round['total'],
                'points' => (int) $round['points'],
                'stars' => stars((int) $round['correct'], (int) $round['total']),
                'best_before' => $best,
                'answers' => $answers,
            ]);

        case 'stats':
            $user = require_user();
            $uid = $user['id'];
            $st = db()->prepare('SELECT COALESCE(SUM(points),0) AS points, COUNT(*) AS rounds FROM rounds WHERE user_id = ? AND finished_at IS NOT NULL');
            $st->execute([$uid]);
            $totals = $st->fetch();
            $st = db()->prepare('SELECT COALESCE(SUM(correct),0) AS correct_today FROM rounds WHERE user_id = ? AND started_at >= ' . sql_today_start());
            $st->execute([$uid]);
            $today = (int) $st->fetch()['correct_today'];
            $st = db()->prepare('SELECT module, level, COUNT(*) AS rounds, SUM(correct) AS correct, SUM(total) AS total, MAX(correct) AS best
                                 FROM rounds WHERE user_id = ? AND finished_at IS NOT NULL GROUP BY module, level');
            $st->execute([$uid]);
            $per = $st->fetchAll();
            $st = db()->prepare('SELECT u.name, SUM(r.points) AS points FROM rounds r JOIN users u ON u.id = r.user_id
                                 WHERE r.finished_at IS NOT NULL AND r.finished_at >= ' . sql_days_ago(7) . '
                                 GROUP BY u.id, u.name ORDER BY points DESC LIMIT 10');
            $st->execute();
            $board = $st->fetchAll();
            // na čem to nejvíc drhne: nejčastěji chybně řešené příklady za poslední měsíc
            $st = db()->prepare('SELECT a.question, a.correct_answer, COUNT(*) AS n FROM answers a JOIN rounds r ON r.id = a.round_id
                                 WHERE r.user_id = ? AND a.is_correct = 0 AND a.answered_at >= ' . sql_days_ago(30) . '
                                 GROUP BY a.question, a.correct_answer ORDER BY n DESC, a.question LIMIT 8');
            $st->execute([$uid]);
            out([
                'user' => $user,
                'points' => (int) $totals['points'],
                'rounds' => (int) $totals['rounds'],
                'correct_today' => $today,
                'per_level' => $per,
                'leaderboard' => $board,
                'hardest' => $st->fetchAll(),
            ]);

        default:
            fail('Neznámá akce.', 404);
    }
} catch (PDOException $e) {
    error_log('matika DB: ' . $e->getMessage());
    fail('Chyba databáze.', 500);
}
