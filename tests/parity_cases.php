<?php
// Případy pro test shody kontroly odpovědi PHP (check_answer) a JS (offline.js).
// Použití: php tests/parity_cases.php | node tests/parity.js
declare(strict_types=1);
foreach (glob(__DIR__ . '/../lib/*.php') as $f) {
    require_once $f;
}
mt_srand(7);
$cases = [];
$variants = function (array $ex): array {
    $a = $ex['a'];
    switch ($ex['kind']) {
        case 'frac':
            [$n, $d] = $a;
            $whole = intdiv($n, $d);
            $out = [answer_str($ex), "$n/$d", (2 * $n) . '/' . (2 * $d), ($n + 1) . "/$d", "$n/0", "$n / $d", 'abc', '', '1,5', (string) $n,
                    $whole > 0 && $n % $d ? "$whole " . ($n % $d) . "/$d" : "$n/$d", "-$n/$d", "$n/" . ($d + 1)];
            return $out;
        case 'divrem':
            return [['q' => (string) $a[0], 'r' => (string) $a[1]], ['q' => (string) ($a[0] + 1), 'r' => (string) $a[1]],
                    ['q' => (string) $a[0], 'r' => ''], ['q' => 'x', 'r' => '0'], ['q' => fmt_num($a[0]), 'r' => (string) $a[1]],
                    ['q' => $a[0] . '.0', 'r' => (string) $a[1]], ['q' => (string) $a[0], 'r' => (string) ($a[1] + 1)]];
        default:
            $s = answer_str($ex);
            return [$s, (string) $a, str_replace(',', '.', $s), str_replace('−', '-', $s), (string) ($a + 1), (string) -$a,
                    'abc', '', '1e2', '.5', '5.', ' ' . $s . ' ', '1,2,3', '--1', '+' . $a];
    }
};
foreach (MODULES as $m => $def) {
    foreach (array_keys($def['levels']) as $l) {
        foreach (array_merge(array_keys(DIFFICULTIES), $m === 'mix' ? [DIFF_ALL] : []) as $d) {
            for ($i = 0; $i < 25; $i++) {
                $ex = generate_exercise($m, (string) $l, $d);
                foreach ($variants($ex) as $given) {
                    $given = clean_given($ex, $given);
                    [$ok, $note] = check_answer($ex, $given);
                    $cases[] = ['ex' => ['kind' => $ex['kind'], 'a' => $ex['a'], 'strict' => !empty($ex['strict'])],
                                'given' => $given, 'ok' => $ok, 'note' => $note, 'readable' => answer_readable($ex, $given)];
                }
            }
        }
    }
}
echo json_encode($cases, JSON_UNESCAPED_UNICODE);
