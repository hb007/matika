<?php
// Generátory příkladů a kontrola odpovědí.
//
// Každý příklad je pole:
//   q    – zadání pro zobrazení (zlomky jako "3/4", klient je vykreslí svisle)
//   kind – 'num' (jedno číslo), 'frac' (zlomek), 'divrem' (podíl + zbytek)
//   a    – správná odpověď: int|float pro num, [čitatel, jmenovatel] pro frac,
//          [podíl, zbytek] pro divrem
//   strict (jen frac) – vyžaduje se zkrácený tvar (modul krácení)
//   p    – operandy (pro nápovědu, vysvětlení a rozbor chyby, viz explain.php)

const MODULES = [
    'mala'    => ['title' => 'Malá násobilka',     'levels' => ['nasobeni' => 'Násobení', 'deleni' => 'Dělení', 'mix' => 'Obojí']],
    'velka'   => ['title' => 'Velká násobilka',    'levels' => ['nasobeni' => 'Násobení', 'deleni' => 'Dělení', 'mix' => 'Obojí']],
    'scitani' => ['title' => 'Sčítání a odčítání', 'levels' => ['cela' => 'Celá čísla', 'zaporna' => 'Záporná čísla', 'desetinna' => 'Desetinná čísla']],
    'zlomky'  => ['title' => 'Zlomky',             'levels' => ['kraceni' => 'Krácení', 'scitani' => 'Sčítání a odčítání', 'nasobeni' => 'Násobení a dělení', 'mix' => 'Všechno']],
    'deleni'  => ['title' => 'Dělení s ocáskem',   'levels' => ['zbytek' => 'Se zbytkem']],
    'zavorky' => ['title' => 'Závorky a pořadí',   'levels' => ['poradi' => 'Pořadí operací', 'zavorky' => 'Se závorkami', 'mix' => 'Všechno']],
    'rovnice' => ['title' => 'Rovnice',            'levels' => ['jednoducha' => 'Jednoduché', 'dvoukrokova' => 'Na dva kroky', 'obe' => 'x na obou stranách a závorky']],
    'mix'     => ['title' => 'Náhodný mix',        'levels' => ['vse' => 'Všechno']],
];

const DIFFICULTIES = ['lehke' => 'Lehké', 'stredni' => 'Střední', 'tezke' => 'Těžké'];
const DIFF_ALL = 'vse';   // jen v Náhodném mixu: každý příklad má náhodnou obtížnost

// Rozsahy podle obtížnosti (viz tabulka v README).
const MALA_RANGE = ['lehke' => [2, 5], 'stredni' => [2, 10], 'tezke' => [6, 9]];
const VELKA_RANGE = ['lehke' => [[11, 15], [2, 5]], 'stredni' => [[11, 20], [2, 10]], 'tezke' => [[11, 20], [11, 20]]];
const CELA_MAX = ['lehke' => 100, 'stredni' => 1000, 'tezke' => 10000];
const ZAPORNA_MAX = ['lehke' => 20, 'stredni' => 50, 'tezke' => 500];
const DESETINNA = ['lehke' => [10, 99, 1], 'stredni' => [10, 999, 1], 'tezke' => [100, 9999, 2]];   // [od, do, míst]
const ZLOMKY = [
    'lehke'   => ['kd' => 6, 'kk' => 3, 'sd' => 6, 'same' => true, 'nd' => 5],
    'stredni' => ['kd' => 12, 'kk' => 6, 'sd' => 10, 'same' => null, 'nd' => 9],
    'tezke'   => ['kd' => 15, 'kk' => 9, 'sd' => 12, 'same' => false, 'nd' => 12],
];   // kd/kk: jmenovatel a krátitel u krácení, sd: jmenovatel u + −, same: stejné jmenovatele (null = půlka), nd: jmenovatel u · :
const DELENI = ['lehke' => [[2, 9], [100, 999]], 'stredni' => [[2, 9], [1000, 9999]], 'tezke' => [[11, 99], [1000, 99999]]];

function gen_mala(string $level, string $diff): array
{
    [$lo, $hi] = MALA_RANGE[$diff];
    $op = $level === 'mix' ? pick(['x', 'd']) : ($level === 'deleni' ? 'd' : 'x');
    return mul_or_div($op, rand($lo, $hi), rand($lo, $hi));
}

function gen_velka(string $level, string $diff): array
{
    [[$alo, $ahi], [$blo, $bhi]] = VELKA_RANGE[$diff];
    $a = rand($alo, $ahi);
    $b = rand($blo, $bhi);
    if (rand(0, 1)) {
        [$a, $b] = [$b, $a];
    }
    $op = $level === 'mix' ? pick(['x', 'd']) : ($level === 'deleni' ? 'd' : 'x');
    return mul_or_div($op, $a, $b);
}

function gen_scitani(string $level, string $diff): array
{
    $op = pick(['+', '-']);
    $sym = $op === '+' ? '+' : '−';
    if ($level === 'zaporna') {
        $max = ZAPORNA_MAX[$diff];
        $a = rand(-$max, $max);
        $b = rand(-$max, $max);
        $r = $op === '+' ? $a + $b : $a - $b;
        return ['q' => fmt_num($a) . " $sym " . fmt_operand($b), 'kind' => 'num', 'a' => $r, 'p' => ['op' => $op, 'a' => $a, 'b' => $b, 'lvl' => 'zaporna']];
    }
    if ($level === 'desetinna') {
        [$lo, $hi, $dp] = DESETINNA[$diff];
        $f = 10 ** $dp;
        $a = rand($lo, $hi) / $f;
        $b = rand($lo, $hi) / $f;
        if ($op === '-' && $b > $a) {
            [$a, $b] = [$b, $a];
        }
        $r = round($op === '+' ? $a + $b : $a - $b, $dp);
        return ['q' => fmt_num($a) . " $sym " . fmt_num($b), 'kind' => 'num', 'a' => $r, 'p' => ['op' => $op, 'a' => $a, 'b' => $b, 'lvl' => 'desetinna', 'dp' => $dp]];
    }
    $max = CELA_MAX[$diff];
    if ($op === '+') {
        $a = rand((int) ($max / 10), $max - 1);
        $b = rand(1, $max - $a);
    } else {
        $a = rand((int) ($max / 5), $max);
        $b = rand(1, $a - 1);
    }
    $r = $op === '+' ? $a + $b : $a - $b;
    return ['q' => fmt_num($a) . " $sym " . fmt_num($b), 'kind' => 'num', 'a' => $r, 'p' => ['op' => $op, 'a' => $a, 'b' => $b, 'lvl' => 'cela']];
}

function gen_zlomky(string $level, string $diff): array
{
    $z = ZLOMKY[$diff];
    if ($level === 'mix') {
        $level = pick(['kraceni', 'scitani', 'nasobeni']);
    }
    if ($level === 'kraceni') {
        do {
            $d = rand(2, $z['kd']);
            $n = rand(1, $d * 2);
        } while (gcd($n, $d) !== 1 || $n === $d);
        $k = rand(2, $z['kk']);
        return ['q' => 'Zkrať: ' . ($n * $k) . '/' . ($d * $k), 'kind' => 'frac', 'a' => [$n, $d], 'strict' => true,
                'p' => ['op' => 'k', 'a' => [$n * $k, $d * $k]]];
    }
    if ($level === 'scitani') {
        $op = pick(['+', '-']);
        $b = rand(2, $z['sd']);
        $same = $z['same'] ?? (bool) rand(0, 1);
        if ($same) {
            $d = $b;
        } else {
            do {
                $d = rand(2, $z['sd']);
            } while ($d === $b);
        }
        $a = simple_numerator($b, 2);
        $c = simple_numerator($d, 2);
        if ($op === '-' && $a * $d < $c * $b) {
            [$a, $b, $c, $d] = [$c, $d, $a, $b];
        }
        if ($op === '-' && $a * $d === $c * $b) {
            $op = '+';   // výsledek 0 není zajímavý
        }
        $rn = $op === '+' ? $a * $d + $c * $b : $a * $d - $c * $b;
        $rd = $b * $d;
        $sym = $op === '+' ? '+' : '−';
        return ['q' => "$a/$b $sym $c/$d", 'kind' => 'frac', 'a' => frac_reduce($rn, $rd), 'p' => ['op' => $op, 'a' => [$a, $b], 'b' => [$c, $d]]];
    }
    $op = pick(['·', ':']);
    $b = rand(2, $z['nd']);
    $d = rand(2, $z['nd']);
    $a = simple_numerator($b, 1);
    $c = simple_numerator($d, 1);
    if ($op === '·') {
        return ['q' => "$a/$b · $c/$d", 'kind' => 'frac', 'a' => frac_reduce($a * $c, $b * $d), 'p' => ['op' => '*', 'a' => [$a, $b], 'b' => [$c, $d]]];
    }
    return ['q' => "$a/$b : $c/$d", 'kind' => 'frac', 'a' => frac_reduce($a * $d, $b * $c), 'p' => ['op' => '/', 'a' => [$a, $b], 'b' => [$c, $d]]];
}

function gen_deleni(string $level, string $diff): array
{
    [[$dlo, $dhi], [$nlo, $nhi]] = DELENI[$diff];
    $divisor = rand($dlo, $dhi);
    $dividend = rand($nlo, $nhi);
    return [
        'q' => fmt_num($dividend) . ' : ' . $divisor,
        'kind' => 'divrem',
        'a' => [intdiv($dividend, $divisor), $dividend % $divisor],
        'p' => ['a' => $dividend, 'b' => $divisor],
    ];
}

function generate_exercise(string $module, string $level, string $diff): array
{
    $all = $module === 'mix' && $diff === DIFF_ALL;
    if (!isset(MODULES[$module]['levels'][$level]) || (!isset(DIFFICULTIES[$diff]) && !$all)) {
        throw new InvalidArgumentException('Neznámá úloha, úroveň nebo obtížnost');
    }
    if ($all) {
        $diff = array_rand(DIFFICULTIES);
    }
    if ($module === 'mix') {
        $pool = [];
        foreach (MODULES as $m => $def) {
            if ($m !== 'mix') {
                foreach (array_keys($def['levels']) as $l) {
                    $pool[] = [$m, (string) $l];
                }
            }
        }
        [$module, $level] = $pool[random_int(0, count($pool) - 1)];
    }
    $ex = ('gen_' . $module)($level, $diff);
    $ex['m'] = $module;   // skutečné téma (u mixu), pro statistiky
    $ex['d'] = $diff;     // skutečná obtížnost (u mixu napříč obtížnostmi), pro body
    return $ex;
}

function gcd(int $a, int $b): int
{
    $a = abs($a);
    $b = abs($b);
    while ($b) {
        [$a, $b] = [$b, $a % $b];
    }
    return $a;
}

function frac_reduce(int $n, int $d): array
{
    if ($d < 0) {
        $n = -$n;
        $d = -$d;
    }
    $g = gcd($n, $d) ?: 1;
    return [intdiv($n, $g), intdiv($d, $g)];
}

function frac_str(int $n, int $d): string
{
    [$n, $d] = frac_reduce($n, $d);
    return $d === 1 ? (string) $n : "$n/$d";
}

function fmt_num($n): string
{
    if (is_float($n)) {
        return str_replace('.', ',', rtrim(rtrim(number_format($n, 2, '.', ''), '0'), '.'));
    }
    $s = number_format(abs($n), 0, ',', ' ');
    return ($n < 0 ? '−' : '') . $s;
}

// Druhý operand: záporné číslo se zobrazí v závorce.
function fmt_operand($n): string
{
    return $n < 0 ? '(' . fmt_num($n) . ')' : fmt_num($n);
}

function pick(array $arr)
{
    return $arr[array_rand($arr)];
}


// Příklad na násobení (a · b) nebo dělení (a·b : a) včetně operandů pro vysvětlení.
function mul_or_div(string $op, int $a, int $b): array
{
    if ($op === 'x') {
        return ['q' => "$a · $b", 'kind' => 'num', 'a' => $a * $b, 'p' => ['op' => 'x', 'a' => $a, 'b' => $b]];
    }
    return ['q' => ($a * $b) . " : $a", 'kind' => 'num', 'a' => $b, 'p' => ['op' => 'd', 'a' => $a * $b, 'b' => $a]];
}



// Čitatel tak, aby zlomek byl v základním tvaru (a ne roven 1); $mult určuje,
// kolikrát může čitatel přesáhnout jmenovatele (nepravé zlomky).
function simple_numerator(int $d, int $mult): int
{
    do {
        $n = rand(1, $d * $mult - 1);
    } while (gcd($n, $d) !== 1);
    return $n;
}




// Které klávesy kromě číslic příklad potřebuje (pro klávesnici na mobilu).
function extra_keys(array $ex): array
{
    if ($ex['kind'] === 'frac') {
        return ['/'];
    }
    if (!empty($ex['p']['neg'])) {
        return ['−'];   // rovnice na těžké: x může vyjít záporné
    }
    $lvl = $ex['p']['lvl'] ?? '';
    return $lvl === 'zaporna' ? ['−'] : ($lvl === 'desetinna' ? [','] : []);
}

// Správná odpověď jako text (do zpětné vazby).
function answer_str(array $ex): string
{
    switch ($ex['kind']) {
        case 'frac':
            return frac_str($ex['a'][0], $ex['a'][1]);
        case 'divrem':
            return fmt_num($ex['a'][0]) . ' zb. ' . $ex['a'][1];
        default:
            return fmt_num($ex['a']);
    }
}

// Rozparsuje "3/4", "1 3/4", "2", "-5/2" na [čitatel, jmenovatel] nebo null.
function parse_frac(string $s): ?array
{
    $s = trim(str_replace(',', '.', $s));
    if ($s === '') {
        return null;
    }
    if (preg_match('/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/', $s, $m)) {   // smíšené číslo
        if ((int) $m[4] === 0) {
            return null;
        }
        $n = (int) $m[2] * (int) $m[4] + (int) $m[3];
        return [$m[1] === '-' ? -$n : $n, (int) $m[4]];
    }
    if (preg_match('/^(-?\d+)\s*\/\s*(\d+)$/', $s, $m)) {
        return (int) $m[2] === 0 ? null : [(int) $m[1], (int) $m[2]];
    }
    if (preg_match('/^-?\d+$/', $s)) {
        return [(int) $s, 1];
    }
    return null;
}

function parse_num(string $s): ?float
{
    $s = str_replace([' ', "\u{a0}", '−'], ['', '', '-'], trim($s));
    $s = str_replace(',', '.', $s);
    return is_numeric($s) ? (float) $s : null;
}

// Vrátí [správně?, poznámka pro dítě]. $given je string (num/frac) nebo
// pole ['q' => ..., 'r' => ...] pro divrem.
function check_answer(array $ex, $given): array
{
    switch ($ex['kind']) {
        case 'num':
            $v = parse_num((string) $given);
            if ($v === null) {
                return [false, 'To není číslo.'];
            }
            return [abs($v - (float) $ex['a']) < 0.001, ''];

        case 'frac':
            $f = parse_frac((string) $given);
            if ($f === null) {
                return [false, 'Zlomek piš jako 3/4 (nebo celé číslo).'];
            }
            [$n, $d] = $ex['a'];
            $equal = $f[0] * $d === $n * $f[1];
            if (!$equal) {
                return [false, ''];
            }
            $reduced = $f === [$n, $d];   // dítě napsalo přesně základní tvar
            if (!$reduced && !empty($ex['strict'])) {
                return [false, 'Hodnota sedí, ale ještě to jde zkrátit (čitatel i jmenovatel dělit ' . gcd($f[0], $f[1]) . ').'];
            }
            return [true, $reduced ? '' : 'Správně, ale dá se zkrátit na ' . frac_str($n, $d) . '.'];

        case 'divrem':
            $q = parse_num((string) ($given['q'] ?? ''));
            $r = parse_num((string) ($given['r'] ?? ''));
            if ($q === null || $r === null) {
                return [false, 'Vyplň podíl i zbytek (zbytek může být 0).'];
            }
            return [(int) $q === $ex['a'][0] && (int) $r === $ex['a'][1], ''];
    }
    return [false, ''];
}

require_once __DIR__ . '/algebra.php';   // závorky a rovnice
