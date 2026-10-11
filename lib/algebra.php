<?php
// Pořadí operací se závorkami a rovnice: generátory, nápověda po krocích,
// postup řešení a rozbor typických chyb. Načítá se z generators.php.
//
// Výraz je pole tokenů: čísla (int) a znaky '+', '−', '·', ':', '(', ')'.
// Počítá se po jednom kroku stejně jako na papíře: nejdřív nejvnitřnější
// závorka, v ní (a pak venku) nejdřív násobení a dělení, potom sčítání
// a odčítání, vždy zleva.

const ZAVORKY = [
    'lehke'   => ['add' => [1, 20], 'mul' => [2, 5], 'max' => 100],
    'stredni' => ['add' => [1, 50], 'mul' => [2, 10], 'max' => 500],
    'tezke'   => ['add' => [1, 100], 'mul' => [2, 12], 'max' => 2000],
];
// šablony podle úrovně; vyšší obtížnost má i šablony nižších
const ZAVORKY_TPL = [
    'poradi' => [
        'lehke'   => ['a + b · c', 'a · b + c', 'a · b − c', 'a − b · c', 'a + b : c', 'a : b + c'],
        'stredni' => ['a · b + c · d', 'a + b · c − d', 'a : b + c · d'],
        'tezke'   => ['a · b − c · d', 'a − b : c + d · e', 'a · b : c + d'],
    ],
    'zavorky' => [
        'lehke'   => ['(a + b) · c', 'a · (b + c)', '(a − b) · c', 'a · (b − c)', 'a − (b + c)', '(a + b) : c'],
        'stredni' => ['a − (b − c)', '(a + b) · (c − d)', 'a : (b − c)'],
        'tezke'   => ['(a − b) · (c + d)', 'a · (b + c) : d', '(a + b) : (c − d)'],
    ],
    'mix' => [
        'lehke'   => ['a · (b + c) − d', 'a + b · (c − d)', '(a + b) · c − d'],
        'stredni' => ['a − b · (c − d)', '(a + b) · c − d · e', 'a · (b + c · d)'],
        'tezke'   => ['a · (b + c · d) − e', '(a · b − c) : d', 'a − (b + c) · d + e'],
    ],
];

const ROVNICE = [
    'lehke'   => ['x' => [1, 10], 'k' => [2, 5], 'c' => [1, 20], 'neg' => false],
    'stredni' => ['x' => [1, 20], 'k' => [2, 9], 'c' => [1, 50], 'neg' => false],
    'tezke'   => ['x' => [-10, 20], 'k' => [2, 12], 'c' => [1, 100], 'neg' => true],
];
const ROVNICE_FORMS = [
    'jednoducha'  => ['x+a', 'x-a', 'a+x', 'kx', 'x:k'],
    'dvoukrokova' => ['kx+a', 'kx-a', 'x:k+a'],
    'obe'         => ['kx+a=mx+b', 'k(x+a)', 'k(x-a)'],
];

// ---------- výrazy ----------

function expr_fmt(array $t): string
{
    $s = '';
    foreach ($t as $i => $tok) {
        $tok = is_int($tok) ? fmt_num($tok) : $tok;
        if ($i > 0 && $tok !== ')' && $t[$i - 1] !== '(') {
            $s .= ' ';
        }
        $s .= $tok;
    }
    return $s;
}

// Jeden krok výpočtu: [nové tokeny, [a, op, b, výsledek], v závorce?] nebo null
// (hotovo); false, když krok nejde (dělení se zbytkem, nulou, záporný mezivýsledek).
function expr_step(array $t)
{
    if (count($t) === 1) {
        return null;
    }
    $lo = 0;
    $hi = count($t) - 1;
    $paren = false;
    $open = -1;
    foreach ($t as $i => $tok) {
        if ($tok === '(') {
            $open = $i;
        } elseif ($tok === ')') {
            [$lo, $hi, $paren] = [$open + 1, $i - 1, true];
            break;
        }
    }
    $k = null;
    for ($i = $lo; $i <= $hi; $i++) {
        if ($t[$i] === '·' || $t[$i] === ':') {
            $k = $i;
            break;
        }
    }
    if ($k === null) {
        for ($i = $lo; $i <= $hi; $i++) {
            if ($t[$i] === '+' || $t[$i] === '−') {
                $k = $i;
                break;
            }
        }
    }
    [$a, $op, $b] = [$t[$k - 1], $t[$k], $t[$k + 1]];
    if ($op === ':' && ($b === 0 || $a % $b !== 0)) {
        return false;
    }
    $r = match ($op) { '+' => $a + $b, '−' => $a - $b, '·' => $a * $b, ':' => intdiv($a, $b) };
    if ($r < 0) {
        return false;
    }
    array_splice($t, $k - 1, 3, [$r]);
    // závorka s jediným číslem zmizí
    if ($paren && ($t[$lo - 1] ?? null) === '(' && ($t[$lo + 1] ?? null) === ')') {
        array_splice($t, $lo - 1, 3, [$r]);
    }
    return [$t, [$a, $op, $b, $r], $paren];
}

// Všechny kroky až k výsledku, nebo null, když výraz nejde spočítat celými čísly.
function expr_steps(array $t): ?array
{
    $steps = [];
    while (($s = expr_step($t)) !== null) {
        if ($s === false) {
            return null;
        }
        $steps[] = $s;
        $t = $s[0];
    }
    return $steps;
}

function expr_has(array $t, array $ops): bool
{
    return (bool) array_intersect($t, $ops);
}

function gen_zavorky(string $level, string $diff): array
{
    $cfg = ZAVORKY[$diff];
    $tpls = [];
    foreach (array_keys(DIFFICULTIES) as $d) {
        $tpls = array_merge($tpls, ZAVORKY_TPL[$level][$d]);
        if ($d === $diff) {
            break;
        }
    }
    for ($try = 0; $try < 500; $try++) {
        $tpl = pick($tpls);
        $raw = preg_split('/\s+/', trim(str_replace(['(', ')'], ['( ', ' )'], $tpl)));
        $t = [];
        foreach ($raw as $i => $tok) {
            if (preg_match('/^[a-e]$/', $tok)) {
                $mul = in_array($raw[$i - 1] ?? '', ['·', ':'], true) || in_array($raw[$i + 1] ?? '', ['·', ':'], true);
                [$lo, $hi] = $mul ? $cfg['mul'] : $cfg['add'];
                $t[] = rand($lo, $hi);
            } else {
                $t[] = $tok;
            }
        }
        // dělenec před ':' z rozsahu násobků, ať dělení vychází (jinak by šablona skoro nikdy neprošla)
        $steps = expr_steps($t);
        if ($steps === null) {
            continue;
        }
        $res = end($steps)[0][0];
        if ($res > $cfg['max']) {
            continue;
        }
        return ['q' => expr_fmt($t), 'kind' => 'num', 'a' => $res, 'p' => ['op' => 'expr', 't' => $t]];
    }
    throw new RuntimeException("Nepodařilo se vytvořit příklad: zavorky/$level/$diff");
}

// Jeden řádek postupu; $before = výraz před tímto krokem (přednost se zmíní,
// jen když v něm ještě je sčítání nebo odčítání).
function expr_line(array $step, array $before): string
{
    [$after, [$a, $op, $b, $r], $paren] = $step;
    $calc = fmt_num($a) . " $op " . fmt_num($b) . ' = ' . fmt_num($r);
    $mixed = in_array($op, ['·', ':'], true) && expr_has($before, ['+', '−']);
    $why = $paren ? 'V závorce: ' : ($mixed ? 'Násobení a dělení má přednost: ' : '');
    return $why . $calc . (count($after) > 1 ? ', zbude ' . expr_fmt($after) . '.' : '.');
}

function explain_expr(array $p): array
{
    $before = $p['t'];
    $out = [];
    foreach (expr_steps($p['t']) as $s) {
        $out[] = expr_line($s, $before);
        $before = $s[0];
    }
    return $out;
}

function steps_expr(array $p): array
{
    $t = $p['t'];
    $steps = expr_steps($t);
    $mixed = expr_has($t, ['·', ':']) && expr_has($t, ['+', '−']);
    $out = [expr_has($t, ['(']) ? 'Nejdřív spočítej, co je v závorce. Pak násobení a dělení, nakonec sčítání a odčítání.'
        : ($mixed ? 'Násobení a dělení má přednost před sčítáním a odčítáním.' : 'Počítej zleva doprava.')];
    $before = $t;
    foreach (array_slice($steps, 0, -1) as $s) {
        $out[] = expr_line($s, $before);
        $before = $s[0];
    }
    $last = count($steps) > 1 ? $steps[count($steps) - 2][0] : $t;
    $out[] = 'Teď už jen ' . expr_fmt($last) . '.';
    return $out;
}

// Výsledek, kdyby dítě počítalo jen zleva doprava (bez přednosti a závorek).
function expr_naive(array $t): ?float
{
    $t = array_values(array_filter($t, fn($x) => $x !== '(' && $x !== ')'));
    $v = (float) $t[0];
    for ($i = 1; $i < count($t); $i += 2) {
        $b = (float) $t[$i + 1];
        $v = match ($t[$i]) { '+' => $v + $b, '−' => $v - $b, '·' => $v * $b, ':' => $b == 0.0 ? NAN : $v / $b };
    }
    return is_nan($v) ? null : $v;
}

function diagnose_expr(array $p, float $g, $answer): string
{
    $naive = expr_naive($p['t']);
    if ($naive !== null && abs($naive - $g) < 0.001 && abs($naive - (float) $answer) > 0.001) {
        return expr_has($p['t'], ['(']) ? 'Tohle vyjde, když se počítá jen zleva. Nejdřív se ale počítá v závorce, pak násobení a dělení.'
            : 'Tohle vyjde, když se počítá jen zleva. Násobení a dělení má ale přednost před sčítáním a odčítáním.';
    }
    return '';
}

// ---------- rovnice ----------

// Neznámá, kterou dítě píše do políčka (u rovnic „x =“), jinak null.
function question_var(array $ex): ?string
{
    return ($ex['p']['op'] ?? '') === 'eq' ? 'x' : null;
}

function eq_rand(array $range, bool $nonzero = false): int
{
    do {
        $v = rand($range[0], $range[1]);
    } while ($nonzero && $v === 0);
    return $v;
}

// Strany rovnice pro dané x: [levá, pravá].
function eq_sides(array $p, float $x): array
{
    ['form' => $f, 'k' => $k, 'm' => $m, 'a' => $a, 'b' => $b] = $p;
    return match ($f) {
        'x+a', 'a+x' => [$x + $a, $b],
        'x-a' => [$x - $a, $b],
        'kx' => [$k * $x, $b],
        'x:k' => [$x / $k, $b],
        'kx+a' => [$k * $x + $a, $b],
        'kx-a' => [$k * $x - $a, $b],
        'x:k+a' => [$x / $k + $a, $b],
        'kx+a=mx+b' => [$k * $x + $a, $m * $x + $b],
        'k(x+a)' => [$k * ($x + $a), $b],
        'k(x-a)' => [$k * ($x - $a), $b],
    };
}

function eq_text(array $p): string
{
    ['form' => $f, 'k' => $k, 'm' => $m, 'a' => $a, 'b' => $b] = $p;
    $n = fn($v) => fmt_num($v);
    $kx = fn($c) => ($c === 1 ? '' : $c) . 'x';
    return match ($f) {
        'x+a' => "x + {$n($a)} = {$n($b)}",
        'a+x' => "{$n($a)} + x = {$n($b)}",
        'x-a' => "x − {$n($a)} = {$n($b)}",
        'kx' => "{$kx($k)} = {$n($b)}",
        'x:k' => "x : $k = {$n($b)}",
        'kx+a' => "{$kx($k)} + {$n($a)} = {$n($b)}",
        'kx-a' => "{$kx($k)} − {$n($a)} = {$n($b)}",
        'x:k+a' => "x : $k + {$n($a)} = {$n($b)}",
        'kx+a=mx+b' => "{$kx($k)} + {$n($a)} = {$kx($m)} + {$n($b)}",
        'k(x+a)' => "$k · (x + {$n($a)}) = {$n($b)}",
        'k(x-a)' => "$k · (x − {$n($a)}) = {$n($b)}",
    };
}

function gen_rovnice(string $level, string $diff): array
{
    $cfg = ROVNICE[$diff];
    for ($try = 0; $try < 500; $try++) {
        $f = pick(ROVNICE_FORMS[$level]);
        $x = eq_rand($cfg['x'], true);
        $k = eq_rand($cfg['k']);
        $m = 0;
        $a = eq_rand($cfg['c']);
        if ($f === 'x:k' || $f === 'x:k+a') {
            $x = $k * eq_rand([intdiv($cfg['x'][0], 2) ?: 1, max(2, intdiv($cfg['x'][1], 2))], true);   // x dělitelné k
        }
        if ($f === 'kx+a=mx+b') {
            $m = rand(1, $k - 1);   // x na obou stranách, vlevo víc
        }
        $p = ['op' => 'eq', 'form' => $f, 'k' => $k, 'm' => $m, 'a' => $a, 'b' => 0, 'neg' => $cfg['neg']];
        [$left] = eq_sides($p, $x);
        $p['b'] = $f === 'kx+a=mx+b' ? (int) ($left - $m * $x) : (int) $left;
        if (!$cfg['neg'] && $p['b'] < 0) {
            continue;   // bez záporných čísel na lehké a střední
        }
        if (abs($p['b']) > 500) {
            continue;
        }
        return ['q' => eq_text($p), 'kind' => 'num', 'a' => $x, 'p' => $p];
    }
    throw new RuntimeException("Nepodařilo se vytvořit příklad: rovnice/$level/$diff");
}

// Kroky řešení: [[instrukce, výsledek kroku], …]; poslední je x = …
function eq_steps(array $p, int $x): array
{
    ['form' => $f, 'k' => $k, 'm' => $m, 'a' => $a, 'b' => $b] = $p;
    $n = fn($v) => fmt_num($v);
    $kx = fn($c) => ($c === 1 ? '' : $c) . 'x';
    switch ($f) {
        case 'x+a':
        case 'a+x':
            return [["Od obou stran odečti {$n($a)}.", "x = {$n($b)} − {$n($a)} = {$n($x)}"]];
        case 'x-a':
            return [["K oběma stranám přičti {$n($a)}.", "x = {$n($b)} + {$n($a)} = {$n($x)}"]];
        case 'kx':
            return [["Obě strany vyděl číslem $k.", "x = {$n($b)} : $k = {$n($x)}"]];
        case 'x:k':
            return [["Obě strany vynásob číslem $k.", "x = {$n($b)} · $k = {$n($x)}"]];
        case 'kx+a':
            return [["Od obou stran odečti {$n($a)}.", "{$kx($k)} = {$n($b - $a)}"], ["Obě strany vyděl číslem $k.", "x = {$n($x)}"]];
        case 'kx-a':
            return [["K oběma stranám přičti {$n($a)}.", "{$kx($k)} = {$n($b + $a)}"], ["Obě strany vyděl číslem $k.", "x = {$n($x)}"]];
        case 'x:k+a':
            return [["Od obou stran odečti {$n($a)}.", "x : $k = {$n($b - $a)}"], ["Obě strany vynásob číslem $k.", "x = {$n($x)}"]];
        case 'kx+a=mx+b':
            $d = $k - $m;
            $out = [["Od obou stran odečti {$kx($m)}, ať je x jen vlevo.", "{$kx($d)} + {$n($a)} = {$n($b)}"],
                    ["Od obou stran odečti {$n($a)}.", "{$kx($d)} = {$n($b - $a)}"]];
            if ($d !== 1) {
                $out[] = ["Obě strany vyděl číslem $d.", "x = {$n($x)}"];
            }
            return $out;
        case 'k(x+a)':
            return [["Obě strany vyděl číslem $k.", "x + {$n($a)} = {$n(intdiv($b, $k))}"], ["Od obou stran odečti {$n($a)}.", "x = {$n($x)}"]];
        case 'k(x-a)':
            return [["Obě strany vyděl číslem $k.", "x − {$n($a)} = {$n(intdiv($b, $k))}"], ["K oběma stranám přičti {$n($a)}.", "x = {$n($x)}"]];
    }
    return [];
}

function eq_check_text(array $p, int $x): string
{
    [$l, $r] = eq_sides($p, $x);
    $sub = str_replace('x', fmt_operand($x), preg_replace('/(\d)x/', '$1 · x', eq_text($p)));
    return 'Zkouška: ' . $sub . ', obě strany ' . fmt_num((int) $l) . '.';
}

function explain_eq(array $p, int $x): array
{
    $out = array_map(fn($s) => "{$s[0]} {$s[1]}.", eq_steps($p, $x));
    $out[] = eq_check_text($p, $x);
    return $out;
}

function steps_eq(array $p, int $x): array
{
    $steps = eq_steps($p, $x);
    $out = ['Chceš mít x na jedné straně samotné. S oběma stranami rovnice dělej vždy totéž.'];
    foreach (array_slice($steps, 0, -1) as $s) {
        $out[] = "{$s[0]} Vyjde {$s[1]}.";
    }
    $out[] = end($steps)[0];   // poslední krok bez výsledku
    return $out;
}

function diagnose_eq(array $p, float $g, int $x): string
{
    ['form' => $f, 'k' => $k, 'a' => $a, 'b' => $b] = $p;
    $eq = fn($v) => abs($g - $v) < 0.001;
    if (in_array($f, ['x+a', 'a+x'], true) && $eq($b + $a)) {
        return 'Opačná operace ke sčítání je odčítání: číslo od obou stran odečti.';
    }
    if ($f === 'x-a' && $eq($b - $a)) {
        return 'Opačná operace k odčítání je sčítání: číslo k oběma stranám přičti.';
    }
    if ($f === 'kx' && $eq($b * $k)) {
        return 'Opačná operace k násobení je dělení: obě strany vyděl.';
    }
    if ($f === 'x:k' && $eq($b / $k)) {
        return 'Opačná operace k dělení je násobení: obě strany vynásob.';
    }
    if ($f === 'kx+a' && $eq(($b + $a) / $k)) {
        return 'Číslo ' . fmt_num($a) . ' od obou stran odečti, nepřičítej.';
    }
    if ($f === 'kx-a' && $eq(($b - $a) / $k)) {
        return 'Číslo ' . fmt_num($a) . ' k oběma stranám přičti, neodečítej.';
    }
    [$l, $r] = eq_sides($p, $g);
    $fmt = fn($v) => fmt_num(abs($v - round($v)) < 0.001 ? (int) round($v) : round($v, 2));
    return 'Zkouška: pro x = ' . $fmt($g) . ' vyjde vlevo ' . $fmt($l) . ' a vpravo ' . $fmt($r) . ', strany se nerovnají.';
}
