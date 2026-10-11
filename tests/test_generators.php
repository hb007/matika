<?php
// Každá kombinace úloha × úroveň × obtížnost: správná odpověď projde kontrolou,
// vysvětlení i nápověda jdou spočítat a operandy jsou v rozsahu.
foreach (MODULES as $m => $def) {
    foreach (array_keys($def['levels']) as $l) {
        foreach (array_keys(DIFFICULTIES) as $d) {
            for ($i = 0; $i < 150; $i++) {
                $ex = generate_exercise($m, (string) $l, $d);
                $given = $ex['kind'] === 'divrem'
                    ? ['q' => (string) $ex['a'][0], 'r' => (string) $ex['a'][1]]
                    : answer_str($ex);
                [$ok] = check_answer($ex, $given);
                check($ok, "$m/$l/$d: vlastní odpověď neprošla: {$ex['q']} = " . answer_str($ex));
                check(explain($ex) !== [], "$m/$l/$d: prázdné vysvětlení: {$ex['q']}");
                check(isset($ex['m']), "$m/$l/$d: chybí skutečné téma m");
                hint_steps($ex);
            }
        }
    }
}

$in = fn(int $x, int $lo, int $hi) => $x >= $lo && $x <= $hi;
for ($i = 0; $i < 300; $i++) {
    $e = generate_exercise('mala', 'nasobeni', 'tezke');
    check($in($e['p']['a'], 6, 9) && $in($e['p']['b'], 6, 9), 'mala tezke: ' . $e['q']);
    $e = generate_exercise('mala', 'nasobeni', 'lehke');
    check($in($e['p']['a'], 2, 5) && $in($e['p']['b'], 2, 5), 'mala lehke: ' . $e['q']);
    $e = generate_exercise('velka', 'nasobeni', 'tezke');
    check($in($e['p']['a'], 11, 20) && $in($e['p']['b'], 11, 20), 'velka tezke: ' . $e['q']);
    $e = generate_exercise('scitani', 'cela', 'lehke');
    check($in((int) $e['a'], 0, 100), 'scitani cela lehke: ' . $e['q']);
    $e = generate_exercise('scitani', 'zaporna', 'lehke');
    check(abs($e['p']['a']) <= 20 && abs($e['p']['b']) <= 20, 'zaporna lehke: ' . $e['q']);
    $e = generate_exercise('scitani', 'desetinna', 'tezke');
    check($e['p']['dp'] === 2, 'desetinna tezke ma 2 mista');
    $e = generate_exercise('zlomky', 'scitani', 'lehke');
    check($e['p']['a'][1] === $e['p']['b'][1], 'zlomky lehke: stejne jmenovatele ' . $e['q']);
    $e = generate_exercise('zlomky', 'scitani', 'tezke');
    check($e['p']['a'][1] !== $e['p']['b'][1], 'zlomky tezke: ruzne jmenovatele ' . $e['q']);
    $e = generate_exercise('deleni', 'zbytek', 'lehke');
    check($in($e['p']['a'], 100, 999) && $in($e['p']['b'], 2, 9), 'deleni lehke: ' . $e['q']);
    $e = generate_exercise('deleni', 'zbytek', 'tezke');
    check($in($e['p']['b'], 11, 99), 'deleni tezke: ' . $e['q']);
}

foreach ([['mala', 'nasobeni', 'xx'], ['nic', 'nasobeni', 'lehke'], ['scitani', '100', 'lehke']] as [$m, $l, $d]) {
    $threw = false;
    try {
        generate_exercise($m, $l, $d);
    } catch (InvalidArgumentException $e) {
        $threw = true;
    }
    check($threw, "neplatny vstup $m/$l/$d musi vyhodit vyjimku");
}

// desetinná na 2 místa: vysvětlení i nápověda počítají v setinách
$e = generate_exercise('scitani', 'desetinna', 'tezke');
$ai = fmt_num((int) round($e['p']['a'] * 100));
check(str_contains(implode(' ', explain($e)), 'dvě desetinná místa') && str_contains(implode(' ', explain($e)), $ai), 'explain 2 mista: ' . $e['q']);
check(str_contains(implode(' ', hint_steps($e)), 'dvě desetinná místa'), 'napoveda 2 mista: ' . $e['q']);
$e = generate_exercise('scitani', 'desetinna', 'lehke');
check(str_contains(implode(' ', explain($e)), 'jedno desetinné místo'), 'explain 1 misto: ' . $e['q']);
