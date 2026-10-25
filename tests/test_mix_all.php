<?php
// Mix napříč obtížnostmi: každý příklad má náhodnou obtížnost, body podle ní.
$seen = [];
for ($i = 0; $i < 300; $i++) {
    $ex = generate_exercise('mix', 'vse', 'vse');
    $seen[$ex['d'] ?? '?'] = true;
}
ksort($seen);
check(array_keys($seen) === ['lehke', 'stredni', 'tezke'], 'mix vse: vsechny tri obtiznosti, nic jineho: ' . implode(',', array_keys($seen)));
check(generate_exercise('mala', 'nasobeni', 'lehke')['d'] === 'lehke', 'kazdy priklad nese svou obtiznost');
$threw = false;
try {
    generate_exercise('mala', 'nasobeni', 'vse');
} catch (InvalidArgumentException $e) {
    $threw = true;
}
check($threw, 'obtiznost vse jen v mixu');

$db = test_db();
$ok = true;
for ($i = 0; $i < 30; $i++) {
    $c = next_exercise($db, 1, 'mix', 'vse', 'vse');
    $ok = $ok && isset(DIFFICULTIES[$c['diff']]);
    $r = handle_answer($db, $c, 1, $c['ex']['kind'] === 'divrem' ? ['q' => (string) $c['ex']['a'][0], 'r' => (string) $c['ex']['a'][1]] : answer_str($c['ex']), '2026-10-11');
    $ok = $ok && $r['points'] === DIFF_POINTS[$c['diff']];
}
check($ok, 'body podle skutecne obtiznosti prikladu');
check((int) $db->query("SELECT COUNT(*) FROM results WHERE difficulty NOT IN ('lehke', 'stredni', 'tezke')")->fetchColumn() === 0, 'do vysledku jde skutecna obtiznost');
