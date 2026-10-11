<?php
// Návrh obtížnosti: 10× napoprvé v řadě → těžší, pod 50 % z posledních 10 → lehčí.
$today = '2026-10-11';
$play = function (PDO $db, int $uid, string $m, string $l, string $d, bool $first): void {
    $c = next_exercise($db, $uid, $m, $l, $d);
    if (!$first) {
        handle_answer($db, $c, $uid, '-12345', '2026-10-11');   // čitelná, ale špatná odpověď
    }
    handle_answer($db, $c, $uid, $c['ex']['kind'] === 'divrem' ? ['q' => (string) $c['ex']['a'][0], 'r' => (string) $c['ex']['a'][1]] : answer_str($c['ex']), '2026-10-11');
};

$db = db_open('sqlite::memory:');
for ($i = 0; $i < 9; $i++) {
    $play($db, 1, 'mala', 'nasobeni', 'stredni', true);
}
check(suggest_difficulty($db, 1, 'mala', 'stredni') === null, '9 v rade jeste nic');
$play($db, 1, 'mala', 'nasobeni', 'stredni', true);
check(suggest_difficulty($db, 1, 'mala', 'stredni') === 'tezke', '10 v rade napoprve: tezsi');
check(suggest_difficulty($db, 1, 'velka', 'stredni') === null, 'jina uloha se nepocita');
check(suggest_difficulty($db, 2, 'mala', 'stredni') === null, 'jine dite se nepocita');
check(suggest_difficulty($db, 1, 'mix', 'stredni') === null, 'v mixu se nenavrhuje');

$db = db_open('sqlite::memory:');
for ($i = 0; $i < 10; $i++) {
    $play($db, 1, 'mala', 'nasobeni', 'tezke', true);
}
check(suggest_difficulty($db, 1, 'mala', 'tezke') === null, 'tezsi nez tezke neni');

$db = db_open('sqlite::memory:');
for ($i = 0; $i < 10; $i++) {
    $play($db, 1, 'mala', 'nasobeni', 'stredni', $i < 4);   // 4 z 10 napoprvé
}
check(suggest_difficulty($db, 1, 'mala', 'stredni') === 'lehke', 'pod polovinu: lehci');
for ($i = 0; $i < 5; $i++) {
    $play($db, 1, 'mala', 'nasobeni', 'stredni', true);   // okno posledních 10: 5 napoprvé
}
check(suggest_difficulty($db, 1, 'mala', 'stredni') === null, 'poslednich 10 je 5 z 10, presne polovina neni pod polovinou');

$db = db_open('sqlite::memory:');
for ($i = 0; $i < 10; $i++) {
    $play($db, 1, 'mala', 'nasobeni', 'lehke', false);
}
check(suggest_difficulty($db, 1, 'mala', 'lehke') === null, 'lehci nez lehke neni');

// rozhraní: answer vrací návrh
$db = db_open('sqlite::memory:');
for ($i = 0; $i < 9; $i++) {
    $play($db, 1, 'mala', 'nasobeni', 'stredni', true);
}
$c = next_exercise($db, 1, 'mala', 'nasobeni', 'stredni');
$r = handle_answer($db, $c, 1, answer_str($c['ex']), $today);
check(($r['suggest'] ?? null) === 'tezke', 'answer vraci navrh tezsi');
