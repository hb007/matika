<?php
// Smazání bodů jednoho dítěte: body a série na nule, historie příkladů zůstane.
$db = test_db();
$today = '2026-10-11';
foreach ([1, 2] as $uid) {
    for ($i = 0; $i < 3; $i++) {
        $c = next_exercise($db, $uid, 'mala', 'nasobeni', 'tezke');
        handle_answer($db, $c, $uid, answer_str($c['ex']), $today);
    }
}
reset_points($db, 1);
[$girl, $boy] = users_state($db, $today);
check($girl['today'] === 0 && $girl['week'] === 0 && $girl['total'] === 0, 'body holky smazane');
check($girl['streak'] === 0, 'serie v rade smazana');
check($girl['solved_today'] === 3, 'vyresene priklady zustaly');
check(user_stats($db, 1, $today)['per_task'] !== [], 'prehled pro rodice zustal');
check($boy['total'] === 9, 'body kluka beze zmeny');
check(count(users_state($db, $today, [2])) === 1 && users_state($db, $today, [])  === [], 'users_state jen pro vybrane');
$threw = false;
try {
    reset_points($db, 3);
} catch (InvalidArgumentException $e) {
    $threw = true;
}
check($threw, 'neznamy uzivatel musi selhat');
