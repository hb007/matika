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

// procenta, dělitelnost, statistika, desetinná čísla: rozsahy a tvar odpovědi
for ($i = 0; $i < 300; $i++) {
    $e = generate_exercise('procenta', 'z_cisla', 'lehke');
    check(in_array($e['p']['p'], PROCENTA['lehke']['p'], true) && is_int($e['a']), 'procenta lehke: ' . $e['q']);
    $e = generate_exercise('delitelnost', 'znaky', 'stredni');
    $d = $e['p']['digits'];
    check((int) implode('', $d) % $e['p']['k'] === 0 && $e['a'] >= 0 && $e['a'] <= 9, 'znaky: ' . $e['q']);
    for ($x = $e['p']['pos'] === 0 ? 1 : 0; $x < $e['a']; $x++) {
        $d[$e['p']['pos']] = $x;
        check((int) implode('', $d) % $e['p']['k'] !== 0, 'znaky: existuje mensi cislice ' . $e['q']);
    }
    $e = generate_exercise('delitelnost', 'nsn', 'stredni');
    check($e['a'] % $e['p']['a'] === 0 && $e['a'] % $e['p']['b'] === 0 && $e['a'] < $e['p']['a'] * $e['p']['b'] || gcd($e['p']['a'], $e['p']['b']) === 1, 'nsn: ' . $e['q']);
    $e = generate_exercise('statistika', 'modus', 'lehke');
    check(count(array_unique($e['p']['xs'])) > 1, 'modus: vic ruznych cisel ' . $e['q']);
    $e = generate_exercise('desetinna', 'deleni', 'tezke');
    check(dec_places((float) $e['a']) <= 2 && $e['p']['y'] != 1, 'desetinna deleni: ' . $e['q']);
    $e = generate_exercise('desetinna', 'nasobeni', 'stredni');
    check(dec_places((float) $e['a']) <= 2, 'desetinna nasobeni max 2 mista: ' . $e['q']);
}
// rozbor chyb
$e = ['kind' => 'num', 'a' => 30, 'p' => ['op' => 'pct', 'form' => 'z_cisla', 'p' => 20, 'base' => 150, 'part' => 30]];
check(str_contains(diagnose($e, '3000'), 'stem'), 'procenta: zapomenute deleni stem');
$e = ['kind' => 'num', 'a' => 7, 'p' => ['op' => 'stat', 'form' => 'prumer', 'xs' => [10, 8, 7, 3]]];
check(str_contains(diagnose($e, '28'), 'součet'), 'prumer: soucet misto prumeru');
$e = ['kind' => 'num', 'a' => 36, 'p' => ['op' => 'div', 'form' => 'nsn', 'a' => 12, 'b' => 9]];
check(str_contains(diagnose($e, '108'), 'Součin'), 'nsn: soucin');
$e = ['kind' => 'num', 'a' => 2.6, 'p' => ['op' => 'dmd', 'form' => 'deleni', 'x' => 15.6, 'y' => 6, 'mul' => false, 'dec' => true]];
check(str_contains(diagnose($e, '26'), 'čárka'), 'desetinna: carka');

// posun čárky: zadání desetinné (nekončí nulou), výsledek nejvýš 3 místa
$intQ = 0;
for ($i = 0; $i < 600; $i++) {
    foreach (array_keys(DIFFICULTIES) as $d) {
        $e = generate_exercise('desetinna', 'posun', $d);
        check(dec_places((float) $e['a']) <= 3, "posun $d: max 3 mista " . $e['q']);
        $first = preg_split('/ [·:] /u', $e['q'])[0];   // první číslo (může mít mezery v tisících)
        check(!preg_match('/,\d*0$/', $first), "posun $d: desetinne cislo nekonci nulou " . $e['q']);
        check(abs($e['a'] - ($e['p']['mul'] ? $e['p']['x'] * $e['p']['y'] : $e['p']['x'] / $e['p']['y'])) < 0.00001, "posun $d: vysledek " . $e['q']);
        $intQ += !str_contains($first, ',');
    }
}
check($intQ < 0.15 * 1800, "posun: cele zadani jen vyjimecne ($intQ z 1800)");
[$ok] = check_answer(['kind' => 'num', 'a' => 0.045], '0,045');
[$bad] = check_answer(['kind' => 'num', 'a' => 0.045], '0,046');
check($ok && !$bad, 'kontrola rozlisi tri desetinna mista');

// trojčlenka: celý výsledek, přímá roste s počtem, nepřímá klesá, tvary podle čísla
$sp = fn(array $lines) => str_replace("\u{a0}", ' ', implode(' ', $lines));   // nezlomitelné mezery jako obyčejné
for ($i = 0; $i < 300; $i++) {
    foreach (array_keys(DIFFICULTIES) as $d) {
        $e = generate_exercise('trojclenka', 'prima', $d);
        $p = $e['p'];
        check(is_int($e['a']) && $e['a'] * $p['a'] === $p['b'] * $p['c'] && $p['a'] !== $p['c'], "trojclenka prima $d: " . $e['q']);
        check($d !== 'tezke' ? $p['b'] % $p['a'] === 0 : $p['b'] % $p['a'] !== 0, "trojclenka prima $d: jednotkova hodnota " . $e['q']);
        $e = generate_exercise('trojclenka', 'neprima', $d);
        $p = $e['p'];
        check(is_int($e['a']) && $e['a'] * $p['c'] === $p['a'] * $p['t'] && $p['a'] !== $p['c'], "trojclenka neprima $d: " . $e['q']);
        check(!preg_match('/\b(1 dělníci|[5-9] dělníci|[2-4] dělníků|[5-9] kamarádi|[2-4] kamarádů|[2-4] čerpadel|[5-9] čerpadla|[2-4] sešitů|[5-9] sešity)\b/u', str_replace("\u{a0}", ' ', $e['q'])), "trojclenka: tvar podle cisla " . $e['q']);
    }
    $e = generate_exercise('trojclenka', 'mix', 'stredni');
    check(in_array($e['p']['form'], ['prima', 'neprima'], true), 'trojclenka mix: ' . $e['q']);
}
check($sp([troj_fill('{a:dělník|dělníci|dělníků} [a:udělá|udělají|udělá]', ['a' => 3])]) === '3 dělníci udělají', 'trojclenka: 3 dělníci udělají');
check($sp([troj_fill('{a:dělník|dělníci|dělníků} [a:udělá|udělají|udělá]', ['a' => 12])]) === '12 dělníků udělá', 'trojclenka: 12 dělníků udělá');
$e = ['kind' => 'num', 'a' => 40, 'p' => ['op' => 'troj', 'form' => 'prima', 'ctx' => 'sesity', 'a' => 3, 'b' => 24, 'c' => 5, 'unit' => 'Kč']];
check(str_contains(diagnose($e, '14,4'), 'nepřímé'), 'trojclenka prima: obracene');
check(str_contains(diagnose($e, '8'), 'vynásob 5'), 'trojclenka prima: jen za kus');
check(str_contains($sp(explain($e)), '5 sešitů stojí 5 · 8 = 40 Kč'), 'trojclenka prima: postup');
check(question_unit($e) === 'Kč', 'trojclenka: jednotka za polickem');
$e = ['kind' => 'num', 'a' => 8, 'p' => ['op' => 'troj', 'form' => 'neprima', 'ctx' => 'delnici', 'a' => 4, 't' => 6, 'c' => 3, 'unit' => 'h']];
check(str_contains(diagnose($e, '4,5'), 'přímé úměrnosti'), 'trojclenka neprima: obracene');
check(str_contains(diagnose($e, '24'), 'vyděl 3'), 'trojclenka neprima: jen pro jednoho');
check(str_contains($sp(explain($e)), '3 dělníci ji udělají za 24 : 3 = 8 h'), 'trojclenka neprima: postup');
$e = ['kind' => 'num', 'a' => 18, 'p' => ['op' => 'troj', 'form' => 'prima', 'ctx' => 'sesity', 'a' => 6, 'b' => 27, 'c' => 4, 'unit' => 'Kč']];
check(str_contains($sp(hint_steps($e)), 'x = 27 · 4/6'), 'trojclenka tezke: zlomkem');
$e = ['kind' => 'num', 'a' => 82, 'p' => ['op' => 'troj', 'form' => 'prima', 'ctx' => 'sesity', 'a' => 3, 'b' => 41, 'c' => 6, 'unit' => 'Kč']];
check(str_contains($sp(explain($e)), '41 · 2 = 82 Kč'), 'trojclenka tezke: dvakrat vic');
