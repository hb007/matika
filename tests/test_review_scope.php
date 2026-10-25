<?php
// Chyba se vrátí v téže úloze bez ohledu na úroveň a obtížnost a v mixu z jakékoli úlohy.
$today = '2026-10-11';
$right = fn(array $c) => $c['ex']['kind'] === 'divrem' ? ['q' => (string) $c['ex']['a'][0], 'r' => (string) $c['ex']['a'][1]] : answer_str($c['ex']);

$db = test_db();
$c = next_exercise($db, 1, 'mala', 'nasobeni', 'tezke');
$missed = $c['ex']['q'];
handle_answer($db, $c, 1, '-1', $today);
handle_answer($db, $c, 1, $right($c), $today);
$seen = false;
for ($i = 0; $i < REVIEW_AFTER + 1 && !$seen; $i++) {
    $n = next_exercise($db, 1, 'mala', 'deleni', 'lehke');   // jiná úroveň i obtížnost
    $seen = $n['review'] && $n['ex']['q'] === $missed;
    if ($seen) {
        check($n['diff'] === 'tezke', 'body podle puvodni obtiznosti chyby');
    }
    handle_answer($db, $n, 1, $right($n), $today);
}
check($seen, 'chyba se vratila v teze uloze pri jine urovni a obtiznosti');

$db = test_db();
$c = next_exercise($db, 1, 'zlomky', 'kraceni', 'stredni');
$missed = $c['ex']['q'];
handle_answer($db, $c, 1, '1/99', $today);
handle_answer($db, $c, 1, $right($c), $today);
$other = false;
for ($i = 0; $i < REVIEW_AFTER + 1; $i++) {
    $n = next_exercise($db, 1, 'mala', 'nasobeni', 'stredni');
    $other = $other || $n['review'];
    handle_answer($db, $n, 1, $right($n), $today);
}
check(!$other, 'chyba ze zlomku se nevraci v male nasobilce');
$n = next_exercise($db, 1, 'mix', 'vse', 'vse');
check($n['review'] && $n['ex']['q'] === $missed, 'mix bere chyby ze vsech uloh');
