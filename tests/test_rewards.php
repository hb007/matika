<?php
// Odměny a album nálepek.
$today = '2026-10-11';
$right = fn(array $c) => $c['ex']['kind'] === 'divrem' ? ['q' => (string) $c['ex']['a'][0], 'r' => (string) $c['ex']['a'][1]] : answer_str($c['ex']);
$kinds = fn(array $r) => array_column($r['rewards'] ?? [], 'kind');
$solve = function (PDO $db, int $uid, string $diff = 'lehke', string $day = '2026-10-11') use ($right) {
    $c = next_exercise($db, $uid, 'mala', 'nasobeni', $diff);
    return handle_answer($db, $c, $uid, $right($c), $day);
};

// série v řadě: 10 jednorožec, 25 duha, 50 zlatý jednorožec
$db = db_open('sqlite::memory:');
set_streak($db, 1, 9);
$r = $solve($db, 1);
check($kinds($r) === ['jednorozec'] && $r['rewards'][0]['new'] && $r['rewards'][0]['value'] === 10, 'jednorozec za 10 v rade');
set_streak($db, 1, 19);
$r = $solve($db, 1);
check($kinds($r) === ['jednorozec'] && !$r['rewards'][0]['new'], 'jednorozec podruhe uz neni novy');
check(user_stickers($db, 1)['jednorozec'] === 2, 'album: jednorozec 2x');
set_streak($db, 1, 24);
check($kinds($solve($db, 1)) === ['duha'], 'duha za 25');
set_streak($db, 1, 49);
check($kinds($solve($db, 1)) === ['zlaty_jednorozec'], 'zlaty jednorozec za 50 (ne obycejny)');
set_streak($db, 1, 3);
check($kinds($solve($db, 1)) === [], 'bez odmeny mimo milniky');

// raketa: 5 těžkých napoprvé v řadě
$db = db_open('sqlite::memory:');
$got = [];
for ($i = 1; $i <= 5; $i++) {
    $got = array_merge($got, $kinds($solve($db, 1, 'tezke')));
}
check(in_array('raketa', $got, true) && array_count_values($got)['raketa'] === 1, 'raketa za 5 tezkych napoprve');
$solve($db, 1, 'lehke');
$got = [];
for ($i = 1; $i <= 4; $i++) {
    $got = array_merge($got, $kinds($solve($db, 1, 'tezke')));
}
check(!in_array('raketa', $got, true), 'lehky priklad radu tezkych prerusi');

// sova: opravená chyba (příklad z fronty opakování)
$db = db_open('sqlite::memory:');
$c = next_exercise($db, 1, 'mala', 'nasobeni', 'stredni');
handle_answer($db, $c, 1, '-1', $today);
handle_answer($db, $c, 1, $right($c), $today);
$owl = false;
for ($i = 0; $i < REVIEW_AFTER + 2 && !$owl; $i++) {
    $c = next_exercise($db, 1, 'mala', 'nasobeni', 'stredni');
    $r = handle_answer($db, $c, 1, $right($c), $today);
    $owl = in_array('sova', $kinds($r), true);
    check($owl === $c['review'], 'sova prave u opakovaneho prikladu');
}
check($owl, 'sova za opravenou chybu');

// ohňostroj za denní cíl, drak za 3 dny v řadě
$db = db_open('sqlite::memory:');
foreach (['2026-10-09', '2026-10-10'] as $d) {
    for ($i = 0; $i < GOAL; $i++) {
        $db->exec("INSERT INTO results (user_id, day, module, difficulty, question, answer, tries, solved, points) VALUES (1, '$d', 'mala', 'lehke', 'x', '1', 1, 1, 0)");
    }
}
$fire = [];
for ($i = 1; $i <= GOAL + 1; $i++) {
    $k = $kinds($solve($db, 1));
    if ($k) {
        $fire[$i] = $k;
    }
}
check(isset($fire[GOAL]) && in_array('ohnostroj', $fire[GOAL], true) && in_array('drak3', $fire[GOAL], true), 'ohnostroj a drak3 pri splneni cile');
check(!isset($fire[GOAL + 1]), 'po cili uz zadny dalsi ohnostroj');

// poklad: přechod přes 100 bodů celkem
$db = db_open('sqlite::memory:');
$db->exec("INSERT INTO results (user_id, day, module, difficulty, question, answer, tries, solved, points) VALUES (1, '2026-10-01', 'mala', 'lehke', 'x', '1', 1, 1, 99)");
check($kinds($solve($db, 1)) === ['poklad100'], 'poklad za 100 bodu');
check($kinds($solve($db, 1)) === [], 'poklad jen jednou');

// offline: nálepky přibudou i po přehrání výsledků
$db = db_open('sqlite::memory:');
set_streak($db, 1, 9);
$pool = issue_pool($db, 1, [['module' => 'mala', 'level' => 'nasobeni', 'difficulty' => 'stredni', 'n' => 1]], strtotime('2026-10-11 10:00'));
$it = $pool['mala|nasobeni|stredni'][0];
sync_results($db, 1, [['id' => $it['id'], 'answers' => [$it['answer']], 'at' => strtotime('2026-10-11 10:05') * 1000]], strtotime('2026-10-11 12:00'));
check((user_stickers($db, 1)['jednorozec'] ?? 0) === 1, 'offline: jednorozec v albu po syncu');
check(array_diff(array_keys(user_stickers($db, 1)), STICKERS) === [], 'nalepky jen ze seznamu');
