<?php
// Římské číslice: převody, rozsahy, kontrola zápisu a rozbor chyb.
foreach ([1 => 'I', 4 => 'IV', 9 => 'IX', 14 => 'XIV', 40 => 'XL', 49 => 'XLIX', 90 => 'XC', 399 => 'CCCXCIX', 400 => 'CD',
          944 => 'CMXLIV', 1994 => 'MCMXCIV', 2026 => 'MMXXVI', 3888 => 'MMMDCCCLXXXVIII', 3999 => 'MMMCMXCIX'] as $n => $r) {
    check(to_roman($n) === $r, "to_roman($n) = " . to_roman($n));
    check(roman_value($r) === $n, "roman_value($r)");
}
for ($n = 1; $n <= 3999; $n++) {
    check((bool) preg_match(ROMAN_RE, to_roman($n)) && roman_value(to_roman($n)) === $n, "tam a zpět $n");
}

foreach (RIMSKE as $d => ['range' => [$lo, $hi], 'keys' => $keys]) {
    for ($i = 0; $i < 200; $i++) {
        $e = generate_exercise('rimske', 'na_rimske', $d);
        check($e['p']['n'] >= $lo && $e['p']['n'] <= $hi, "rimske $d: {$e['q']}");
        check(array_diff(str_split($e['a']), $keys) === [], "rimske $d: písmena mimo klávesnici {$e['a']}");
        check(extra_keys($e) === $keys, "rimske $d: klávesy");
        $hints = hint_steps($e);
        check(!str_contains($hints[count($hints) - 1], $e['a']), 'nápověda prozradila výsledek: ' . $hints[count($hints) - 1]);
    }
}

$e = ['kind' => 'roman', 'a' => 'XLIX', 'p' => ['op' => 'rom', 'form' => 'na_rimske', 'n' => 49, 'r' => 'XLIX', 'keys' => ['I', 'V', 'X', 'L', 'C']]];
check(check_answer($e, ' xlix ') === [true, ''], 'malá písmena a mezery se uznají');
check(check_answer($e, '49')[0] === false && !answer_readable($e, '49'), 'číslo není pokus');
check(check_answer($e, 'XXXXVIIII')[1] !== '' && answer_readable($e, 'XXXXVIIII'), 'nesprávný zápis: poznámka a je to pokus');
check(check_answer($e, 'IL')[1] !== '', 'IL není správný zápis');
check(diagnose($e, 'XLI') === 'XLI je 41, ne 49.', 'rozbor: hodnota zápisu dítěte');
check(question_var($e) === 'římsky', 'popisek políčka');

$e = generate_exercise('rimske', 'na_arabske', 'stredni');
$e['a'] = 49; $e['q'] = 'XLIX'; $e['p'] = ['n' => 49, 'r' => 'XLIX'] + $e['p'];
check(check_answer($e, '49')[0], 'na arabské: číslo');
check(str_contains(diagnose($e, '71'), 'odečítá'), 'rozbor: sečetl všechny číslice ' . diagnose($e, '71'));
$steps = explain($e);
$hints = hint_steps($e);
check($steps[count($steps) - 1] === 'Sečti části: 40 + 9 = 49.', 'postup končí součtem: ' . $steps[count($steps) - 1]);
check($hints[count($hints) - 1] === 'Sečti části:', 'poslední nápověda bez výsledku');
