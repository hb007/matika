<?php
// Odměny za skutečný úspěch a album nálepek.
//
// Po každé správné odpovědi server spočítá, jestli dítě něco nezískalo
// (série v řadě, opravená chyba, denní cíl, série dní, těžké napoprvé,
// milník bodů). Každá odměna je zároveň nálepka do alba (tabulka stickers,
// počítá se, kolikrát ji dítě dostalo). Protože to dělá server v rámci
// handle_answer, nálepky přibudou i za příklady vyřešené offline (sync).

const REWARD_DAYS = [3, 7, 14, 30];                 // drak: dní v řadě se splněným cílem
const REWARD_POINTS = [100, 500, 1000, 2000, 5000]; // poklad: bodů celkem
const REWARD_HARD = 5;                              // raketa: těžké napoprvé v řadě

// Všechny nálepky v pořadí alba (klient k nim má obrázky a popisy).
const STICKERS = ['jednorozec', 'duha', 'zlaty_jednorozec', 'raketa', 'sova', 'ohnostroj',
    'drak3', 'drak7', 'drak14', 'drak30', 'poklad100', 'poklad500', 'poklad1000', 'poklad2000', 'poklad5000'];

function total_points(PDO $db, int $uid): int
{
    $st = $db->prepare('SELECT COALESCE(SUM(points), 0) FROM results WHERE user_id = ?');
    $st->execute([$uid]);
    return (int) $st->fetchColumn();
}

// Kolik posledních příkladů v řadě bylo těžkých a správně napoprvé.
function hard_run(PDO $db, int $uid): int
{
    $st = $db->prepare('SELECT difficulty = \'tezke\' AND tries = 1 AND solved = 1 FROM results WHERE user_id = ? ORDER BY id DESC LIMIT 200');
    $st->execute([$uid]);
    $n = 0;
    foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $ok) {
        if (!(int) $ok) {
            break;
        }
        $n++;
    }
    return $n;
}

function solved_on(PDO $db, int $uid, string $day): int
{
    $st = $db->prepare('SELECT COUNT(*) FROM results WHERE user_id = ? AND day = ? AND solved = 1');
    $st->execute([$uid, $day]);
    return (int) $st->fetchColumn();
}

function goal_days(PDO $db, int $uid): array
{
    $st = $db->prepare('SELECT day FROM results WHERE user_id = ? AND solved = 1 GROUP BY day HAVING COUNT(*) >= ' . GOAL);
    $st->execute([$uid]);
    return $st->fetchAll(PDO::FETCH_COLUMN);
}

// Nálepka do alba; vrací true, když ji dítě dostalo poprvé.
function award(PDO $db, int $uid, string $kind, string $day): bool
{
    $db->prepare('INSERT INTO stickers (user_id, kind, n, first_day) VALUES (?, ?, 1, ?)
        ON CONFLICT (user_id, kind) DO UPDATE SET n = n + 1')->execute([$uid, $kind, $day]);
    $st = $db->prepare('SELECT n FROM stickers WHERE user_id = ? AND kind = ?');
    $st->execute([$uid, $kind]);
    return (int) $st->fetchColumn() === 1;
}

// Odměny po správné odpovědi (už zapsané do results). $before = body celkem před ní.
// Vrací [['kind' => …, 'value' => číslo do textu, 'new' => poprvé?], …].
function rewards_after_correct(PDO $db, int $uid, array $cur, int $streak, int $before, string $day): array
{
    $first = $cur['tries'] === 1;
    $out = [];
    $add = function (string $kind, int $value) use (&$out, $db, $uid, $day) {
        $out[] = ['kind' => $kind, 'value' => $value, 'new' => award($db, $uid, $kind, $day)];
    };
    // série správně napoprvé v řadě: 50 zlatý jednorožec, 25 duha, 10 jednorožec
    if ($first && $streak > 0) {
        if ($streak % 50 === 0) {
            $add('zlaty_jednorozec', $streak);
        } elseif ($streak % 25 === 0) {
            $add('duha', $streak);
        } elseif ($streak % 10 === 0) {
            $add('jednorozec', $streak);
        }
    }
    if ($first && $cur['diff'] === 'tezke') {
        $run = hard_run($db, $uid);
        if ($run > 0 && $run % REWARD_HARD === 0) {
            $add('raketa', $run);
        }
    }
    if (!empty($cur['review'])) {
        $add('sova', 0);   // opravená chyba: příklad, který minule nešel
    }
    if (solved_on($db, $uid, $day) === GOAL) {
        $add('ohnostroj', GOAL);
        $days = day_streak(goal_days($db, $uid), $day);
        if (in_array($days, REWARD_DAYS, true)) {
            $add("drak$days", $days);
        }
    }
    $after = total_points($db, $uid);
    foreach (REWARD_POINTS as $m) {
        if ($before < $m && $after >= $m) {
            $add("poklad$m", $m);
        }
    }
    return $out;
}

function user_stickers(PDO $db, int $uid): array
{
    $st = $db->prepare('SELECT kind, n FROM stickers WHERE user_id = ?');
    $st->execute([$uid]);
    return array_map('intval', $st->fetchAll(PDO::FETCH_KEY_PAIR));
}
