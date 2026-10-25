<?php
// Herní pravidla: body, série, denní cíl, opakování chyb. Rozpracovaný příklad
// ($cur) drží volající (api.php v session), funkce ho jen čtou a mění.

const DIFF_POINTS = ['lehke' => 1, 'stredni' => 2, 'tezke' => 3];
const GOAL = 20;           // denní cíl: vyřešených příkladů
const STREAK_BONUS = 5;    // každých 5 napoprvé správně v řadě = +1 bod
const REVIEW_AFTER = 5;    // chybný příklad se vrátí po 5 dalších
const SUGGEST_WINDOW = 10; // návrh jiné obtížnosti podle posledních 10 příkladů
const GUEST = 0;           // „bez sešitu“: příklady bez ukládání (body jen v session, api.php)

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

// Návrh jiné obtížnosti v téže úloze: 10× v řadě napoprvé → o stupeň těžší,
// pod polovinu napoprvé z posledních 10 → o stupeň lehčí. V mixu se nenavrhuje.
function suggest_difficulty(PDO $db, int $uid, string $module, string $diff): ?string
{
    if ($module === 'mix' || !isset(DIFFICULTIES[$diff])) {
        return null;
    }
    $st = $db->prepare('SELECT tries = 1 AND solved = 1 FROM results WHERE user_id = ? AND module = ? AND difficulty = ?
        ORDER BY id DESC LIMIT ' . SUGGEST_WINDOW);
    $st->execute([$uid, $module, $diff]);
    $first = array_map('intval', $st->fetchAll(PDO::FETCH_COLUMN));
    if (count($first) < SUGGEST_WINDOW) {
        return null;
    }
    $keys = array_keys(DIFFICULTIES);
    $i = array_search($diff, $keys, true);
    $hits = array_sum($first);
    if ($hits === SUGGEST_WINDOW) {
        return $keys[$i + 1] ?? null;
    }
    return $hits * 2 < SUGGEST_WINDOW ? ($keys[$i - 1] ?? null) : null;
}

function task_module(array $cur): string
{
    return explode('|', $cur['task'])[0];
}

function user_exists(PDO $db, int $uid): bool
{
    $st = $db->prepare('SELECT 1 FROM users WHERE id = ?');
    $st->execute([$uid]);
    return (bool) $st->fetchColumn();
}

function rename_user(PDO $db, int $uid, string $name): void
{
    $name = clean_name($name);
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
    // fronta chyb je po úlohách (bez ohledu na úroveň a obtížnost), mix bere ze všech;
    // LIKE kvůli starším záznamům s klíčem "úloha|úroveň|obtížnost"
    $task = $module;
    if ($uid === GUEST) {   // bez sešitu se chyby neopakují
        return ['ex' => $ex, 'task' => $task, 'diff' => $ex['d'] ?? $diff, 'tries' => 0, 'done' => false, 'review' => false];
    }
    if ($module === 'mix') {
        $st = $db->prepare('SELECT id, ex FROM review WHERE user_id = ? AND due <= ? ORDER BY due, id LIMIT 1');
        $st->execute([$uid, done_count($db, $uid)]);
    } else {
        $st = $db->prepare('SELECT id, ex FROM review WHERE user_id = ? AND (task = ? OR task LIKE ?) AND due <= ? ORDER BY due, id LIMIT 1');
        $st->execute([$uid, $module, "$module|%", done_count($db, $uid)]);
    }
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
        ->execute([$uid, $ex['m'] ?? task_module($cur), $ex['q'], json_encode($ex), done_count($db, $uid) + REVIEW_AFTER]);   // pod skutečnou úlohu, i z mixu
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
        'roman' => roman_readable($given),
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
    $guest = $uid === GUEST;
    if (!$ok) {
        if ($cur['tries'] === 1) {
            if (!$guest) {
                queue_review($db, $uid, $cur);
            }
            cur_set_streak($db, $cur, $uid, 0);
        }
        return ['correct' => false, 'note' => $note, 'why' => $note !== '' ? '' : diagnose($ex, $given)];
    }
    $first = $cur['tries'] === 1;
    $streak = $first ? cur_streak($db, $cur, $uid) + 1 : 0;
    cur_set_streak($db, $cur, $uid, $streak);
    $points = base_points($cur['diff'], $cur['tries']);
    $bonus = $first ? streak_bonus($streak) : 0;
    $cur['done'] = true;
    if ($guest) {   // bez sešitu: body jen pro tuhle návštěvu, bez odměn a návrhů
        return ['correct' => true, 'note' => $note, 'points' => $points, 'bonus' => $bonus, 'streak' => $streak, 'rewards' => [], 'suggest' => null];
    }
    $before = total_points($db, $uid);
    record_result($db, $uid, $cur, true, $points + $bonus, $today);
    return ['correct' => true, 'note' => $note, 'points' => $points, 'bonus' => $bonus, 'streak' => $streak,
            'rewards' => rewards_after_correct($db, $uid, $cur, $streak, $before, $today),
            'suggest' => suggest_difficulty($db, $uid, task_module($cur), $cur['diff'])];
}

// Série v řadě: v databázi, bez sešitu (GUEST) jen v rozpracovaném příkladu
// (api.php ji přenáší mezi příklady v session).
function cur_streak(PDO $db, array $cur, int $uid): int
{
    return $uid === GUEST ? (int) ($cur['streak'] ?? 0) : get_streak($db, $uid);
}

function cur_set_streak(PDO $db, array &$cur, int $uid, int $streak): void
{
    if ($uid === GUEST) {
        $cur['streak'] = $streak;
    } else {
        set_streak($db, $uid, $streak);
    }
}

function handle_reveal(PDO $db, array &$cur, int $uid, string $today): array
{
    if (!$cur['done']) {
        if ($cur['tries'] === 0 && $uid !== GUEST) {
            queue_review($db, $uid, $cur);
        }
        cur_set_streak($db, $cur, $uid, 0);
        if ($uid !== GUEST) {
            record_result($db, $uid, $cur, false, 0, $today);
        }
        $cur['done'] = true;
    }
    return ['answer' => answer_str($cur['ex']), 'steps' => explain($cur['ex']),
            'suggest' => $uid === GUEST ? null : suggest_difficulty($db, $uid, task_module($cur), $cur['diff'])];
}

// Stav dětí pro klienta (body dnes, týden, celkem, cíl, série). Bez $uids
// všechny děti (správa), jinak jen vybrané (přihlášené na zařízení).
function users_state(PDO $db, string $today, ?array $uids = null): array
{
    $out = [];
    foreach (user_rows($db, $uids) as $u) {
        $st = $db->prepare('SELECT COALESCE(SUM(points), 0) AS total,
                COALESCE(SUM(CASE WHEN day >= ? THEN points END), 0) AS week,
                COALESCE(SUM(CASE WHEN day = ? THEN points END), 0) AS today,
                COALESCE(SUM(CASE WHEN day = ? AND solved = 1 THEN 1 END), 0) AS solved_today
            FROM results WHERE user_id = ?');
        $st->execute([week_start($today), $today, $today, $u['id']]);
        $sums = array_map('intval', $st->fetch());
        $out[] = $u + ['days' => day_streak(goal_days($db, $u['id']), $today),
                       'time_today' => usage_on($db, $u['id'], $today)] + $sums;   // ms v appce dnes, všechna zařízení
    }
    return $out;
}

function user_rows(PDO $db, ?array $uids): array
{
    $uids = $uids === null ? null : array_values(array_filter(array_map('intval', $uids)));
    if ($uids === []) {
        return [];
    }
    $where = $uids === null ? '' : ' WHERE u.id IN (' . implode(',', $uids) . ')';
    $rows = $db->query('SELECT u.id, u.slug, u.name, u.color, u.class_id, u.streak, u.created, u.pin_hash IS NOT NULL AS has_pin, c.name AS class_name
        FROM users u LEFT JOIN classes c ON c.id = u.class_id' . $where . ' ORDER BY u.id')->fetchAll();
    return array_map(fn($u) => ['id' => (int) $u['id'], 'slug' => $u['slug'], 'name' => $u['name'], 'color' => $u['color'],
        'class_id' => $u['class_id'] === null ? null : (int) $u['class_id'], 'class_name' => $u['class_name'] ?? '',
        'streak' => (int) $u['streak'], 'has_pin' => (bool) $u['has_pin'], 'created' => $u['created']], $rows);
}

// Žebříček: všechny děti (nebo jedna třída) s body dnes, za týden a celkem
// a sérií dní. Řazení si dělá klient podle záložky.
function leaderboard(PDO $db, string $today, ?int $classId): array
{
    $where = $classId === null ? '' : ' WHERE u.class_id = ' . $classId;
    $st = $db->prepare('SELECT u.id, u.name, u.color, u.class_id,
            COALESCE(SUM(r.points), 0) AS total,
            COALESCE(SUM(CASE WHEN r.day >= ? THEN r.points END), 0) AS week,
            COALESCE(SUM(CASE WHEN r.day = ? THEN r.points END), 0) AS today
        FROM users u LEFT JOIN results r ON r.user_id = u.id' . $where . ' GROUP BY u.id ORDER BY total DESC, u.id');
    $st->execute([week_start($today), $today]);
    $rows = $st->fetchAll();
    // dny se splněným cílem pro všechny najednou (GOAL v SQL, viz goal_days)
    $days = [];
    foreach ($db->query('SELECT user_id, day FROM results WHERE solved = 1 GROUP BY user_id, day HAVING COUNT(*) >= ' . GOAL)->fetchAll() as $d) {
        $days[(int) $d['user_id']][] = $d['day'];
    }
    return array_map(fn($u) => ['id' => (int) $u['id'], 'name' => $u['name'], 'color' => $u['color'],
        'class_id' => $u['class_id'] === null ? null : (int) $u['class_id'],
        'today' => (int) $u['today'], 'week' => (int) $u['week'], 'total' => (int) $u['total'],
        'days' => day_streak($days[(int) $u['id']] ?? [], $today)], $rows);
}

// Veřejná karta dítěte (klepnutí v žebříčku): body, série dní a album.
function user_card(PDO $db, int $uid, string $today): ?array
{
    $u = users_state($db, $today, [$uid])[0] ?? null;
    if (!$u) {
        return null;
    }
    unset($u['streak'], $u['time_today'], $u['has_pin'], $u['created']);
    return $u + ['stickers' => user_stickers($db, $uid)];
}

// Přehled za třídu pro správce: úspěšnost napoprvé podle úlohy a obtížnosti.
function class_stats(PDO $db, ?int $classId): array
{
    $where = $classId === null ? 'u.class_id IS NULL' : 'u.class_id = ' . $classId;
    return $db->query('SELECT r.module, r.difficulty, COUNT(*) AS n, SUM(r.tries = 1 AND r.solved = 1) AS first, COUNT(DISTINCT r.user_id) AS kids
        FROM results r JOIN users u ON u.id = r.user_id WHERE ' . $where . ' GROUP BY r.module, r.difficulty ORDER BY r.module, r.difficulty')->fetchAll();
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
    return ['per_task' => $per, 'hardest' => $st->fetchAll(), 'stickers' => user_stickers($db, $uid)];
}
