<?php
// Herní pravidla: body, série, denní cíl, opakování chyb. Rozpracovaný příklad
// ($cur) drží volající (api.php v session), funkce ho jen čtou a mění.

const DIFF_POINTS = ['lehke' => 1, 'stredni' => 2, 'tezke' => 3];
const GOAL = 20;           // denní cíl: vyřešených příkladů
const STREAK_BONUS = 5;    // každých 5 napoprvé správně v řadě = +1 bod
const REVIEW_AFTER = 5;    // chybný příklad se vrátí po 5 dalších

function base_points(string $diff, int $tries): int
{
    return $tries === 1 ? DIFF_POINTS[$diff] : 1;
}

function streak_bonus(int $streak): int
{
    return $streak > 0 && $streak % STREAK_BONUS === 0 ? 1 : 0;
}

function week_start(string $day): string
{
    $t = strtotime($day);
    return date('Y-m-d', strtotime('-' . (date('N', $t) - 1) . ' days', $t));
}

// Po sobě jdoucí dny se splněným cílem, končící dneškem (nebo včerejškem,
// když dnes cíl ještě splněný není).
function day_streak(array $goalDays, string $today): int
{
    $set = array_flip($goalDays);
    $day = isset($set[$today]) ? $today : date('Y-m-d', strtotime("$today -1 day"));
    $n = 0;
    while (isset($set[$day])) {
        $n++;
        $day = date('Y-m-d', strtotime("$day -1 day"));
    }
    return $n;
}

function user_exists(PDO $db, int $uid): bool
{
    $st = $db->prepare('SELECT 1 FROM users WHERE id = ?');
    $st->execute([$uid]);
    return (bool) $st->fetchColumn();
}

function rename_user(PDO $db, int $uid, string $name): void
{
    $name = trim((string) preg_replace('/\s+/u', ' ', $name));   // neplatné UTF-8 → null → ''
    if ($name === '' || mb_strlen($name) > 20) {
        throw new InvalidArgumentException('Přezdívka musí mít 1 až 20 znaků.');
    }
    if (!user_exists($db, $uid)) {
        throw new InvalidArgumentException('Neznámý uživatel.');
    }
    $db->prepare('UPDATE users SET name = ? WHERE id = ?')->execute([$name, $uid]);
}

// Smaže body a sérii v řadě; vyřešené příklady (cíl, série dní, přehled pro rodiče) zůstanou.
function reset_points(PDO $db, int $uid): void
{
    if (!user_exists($db, $uid)) {
        throw new InvalidArgumentException('Neznámý uživatel.');
    }
    $db->prepare('UPDATE results SET points = 0 WHERE user_id = ?')->execute([$uid]);
    set_streak($db, $uid, 0);
}

function done_count(PDO $db, int $uid): int
{
    $st = $db->prepare('SELECT COUNT(*) FROM results WHERE user_id = ?');
    $st->execute([$uid]);
    return (int) $st->fetchColumn();
}

function get_streak(PDO $db, int $uid): int
{
    $st = $db->prepare('SELECT streak FROM users WHERE id = ?');
    $st->execute([$uid]);
    return (int) $st->fetchColumn();
}

function set_streak(PDO $db, int $uid, int $streak): void
{
    $db->prepare('UPDATE users SET streak = ? WHERE id = ?')->execute([$streak, $uid]);
}

// Nový příklad, nebo dřívější chybný z fronty, když už na něj přišla řada.
function next_exercise(PDO $db, int $uid, string $module, string $level, string $diff): array
{
    $ex = generate_exercise($module, $level, $diff);   // zároveň ověří vstup
    $task = "$module|$level|$diff";
    $st = $db->prepare('SELECT id, ex FROM review WHERE user_id = ? AND task = ? AND due <= ? ORDER BY due, id LIMIT 1');
    $st->execute([$uid, $task, done_count($db, $uid)]);
    $row = $st->fetch();
    if ($row) {
        $db->prepare('DELETE FROM review WHERE id = ?')->execute([$row['id']]);
        $ex = json_decode($row['ex'], true);
    }
    // body podle skutečné obtížnosti příkladu (v mixu „vše“ je u každého jiná)
    return ['ex' => $ex, 'task' => $task, 'diff' => $ex['d'] ?? $diff, 'tries' => 0, 'done' => false, 'review' => (bool) $row];
}

function queue_review(PDO $db, int $uid, array $cur): void
{
    $ex = $cur['ex'];
    unset($ex['hints']);
    $db->prepare('INSERT OR IGNORE INTO review (user_id, task, q, ex, due) VALUES (?, ?, ?, ?, ?)')
        ->execute([$uid, $cur['task'], $ex['q'], json_encode($ex), done_count($db, $uid) + REVIEW_AFTER]);
}

function record_result(PDO $db, int $uid, array $cur, bool $solved, int $points, string $today): void
{
    $ex = $cur['ex'];
    $db->prepare('INSERT INTO results (user_id, day, module, difficulty, question, answer, tries, solved, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([$uid, $today, $ex['m'], $cur['diff'], $ex['q'], answer_str($ex), $cur['tries'], $solved ? 1 : 0, $points]);
}

// Odpověď z JSONu do tvaru, se kterým počítá check_answer; cokoli jiného = prázdná.
function clean_given(array $ex, $given)
{
    $s = fn($v) => is_scalar($v) ? (string) $v : '';
    if ($ex['kind'] === 'divrem') {
        $g = is_array($given) ? $given : [];
        return ['q' => $s($g['q'] ?? ''), 'r' => $s($g['r'] ?? '')];
    }
    return $s($given);
}

function answer_readable(array $ex, $given): bool
{
    return match ($ex['kind']) {
        'frac' => parse_frac($given) !== null,
        'divrem' => parse_num($given['q']) !== null && parse_num($given['r']) !== null,
        default => parse_num($given) !== null,
    };
}

function handle_answer(PDO $db, array &$cur, int $uid, $given, string $today): array
{
    if ($cur['done']) {
        throw new DomainException('Příklad už je hotový.');
    }
    $ex = $cur['ex'];
    $given = clean_given($ex, $given);
    [$ok, $note] = check_answer($ex, $given);
    if (!answer_readable($ex, $given)) {
        return ['correct' => false, 'note' => $note, 'why' => ''];   // překlep, ne pokus
    }
    $cur['tries']++;
    if (!$ok) {
        if ($cur['tries'] === 1) {
            queue_review($db, $uid, $cur);
            set_streak($db, $uid, 0);
        }
        return ['correct' => false, 'note' => $note, 'why' => $note !== '' ? '' : diagnose($ex, $given)];
    }
    $first = $cur['tries'] === 1;
    $streak = $first ? get_streak($db, $uid) + 1 : 0;
    set_streak($db, $uid, $streak);
    $points = base_points($cur['diff'], $cur['tries']);
    $bonus = $first ? streak_bonus($streak) : 0;
    record_result($db, $uid, $cur, true, $points + $bonus, $today);
    $cur['done'] = true;
    return ['correct' => true, 'note' => $note, 'points' => $points, 'bonus' => $bonus, 'streak' => $streak];
}

function handle_reveal(PDO $db, array &$cur, int $uid, string $today): array
{
    if (!$cur['done']) {
        if ($cur['tries'] === 0) {
            queue_review($db, $uid, $cur);
        }
        set_streak($db, $uid, 0);
        record_result($db, $uid, $cur, false, 0, $today);
        $cur['done'] = true;
    }
    return ['answer' => answer_str($cur['ex']), 'steps' => explain($cur['ex'])];
}

function users_state(PDO $db, string $today): array
{
    $out = [];
    foreach ($db->query('SELECT id, kind, name, streak FROM users ORDER BY id')->fetchAll() as $u) {
        $st = $db->prepare('SELECT COALESCE(SUM(points), 0) AS total,
                COALESCE(SUM(CASE WHEN day >= ? THEN points END), 0) AS week,
                COALESCE(SUM(CASE WHEN day = ? THEN points END), 0) AS today,
                COALESCE(SUM(CASE WHEN day = ? AND solved = 1 THEN 1 END), 0) AS solved_today
            FROM results WHERE user_id = ?');
        $st->execute([week_start($today), $today, $today, $u['id']]);
        $sums = array_map('intval', $st->fetch());
        // GOAL přímo v SQL: parametr by šel jako text a COUNT(*) >= '20' v SQLite neplatí nikdy
        $st = $db->prepare('SELECT day FROM results WHERE user_id = ? AND solved = 1 GROUP BY day HAVING COUNT(*) >= ' . GOAL);
        $st->execute([$u['id']]);
        $out[] = ['id' => (int) $u['id'], 'kind' => $u['kind'], 'name' => $u['name'], 'streak' => (int) $u['streak'],
                  'days' => day_streak($st->fetchAll(PDO::FETCH_COLUMN), $today)] + $sums;
    }
    return $out;
}

function user_stats(PDO $db, int $uid, string $today): array
{
    $st = $db->prepare('SELECT module, difficulty, COUNT(*) AS n, SUM(tries = 1 AND solved = 1) AS first
        FROM results WHERE user_id = ? GROUP BY module, difficulty ORDER BY module, difficulty');
    $st->execute([$uid]);
    $per = $st->fetchAll();
    $st = $db->prepare('SELECT question, answer, COUNT(*) AS n FROM results
        WHERE user_id = ? AND NOT (tries = 1 AND solved = 1) AND day >= ?
        GROUP BY question, answer ORDER BY n DESC, question LIMIT 8');
    $st->execute([$uid, date('Y-m-d', strtotime("$today -30 days"))]);
    return ['per_task' => $per, 'hardest' => $st->fetchAll()];
}
