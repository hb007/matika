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
    'mala'    => ['title' => 'Malá násobilka',        'levels' => ['nasobeni' => 'Násobení', 'deleni' => 'Dělení', 'mix' => 'Obojí']],
    'velka'   => ['title' => 'Velká násobilka',       'levels' => ['nasobeni' => 'Násobení 11–20', 'deleni' => 'Dělení', 'mix' => 'Obojí', 'tezka' => 'Těžká (11–20 × 11–20)']],
    'scitani' => ['title' => 'Sčítání a odčítání',    'levels' => ['100' => 'Do 100', '1000' => 'Do 1 000', '10000' => 'Do 10 000', 'zaporna' => 'Záporná čísla', 'desetinna' => 'Desetinná čísla']],
    'zlomky'  => ['title' => 'Zlomky',                'levels' => ['kraceni' => 'Krácení', 'scitani' => 'Sčítání a odčítání', 'nasobeni' => 'Násobení a dělení', 'mix' => 'Všechno']],
    'deleni'  => ['title' => 'Dělení s ocáskem',      'levels' => ['1' => 'Jednociferný dělitel', '2' => 'Dvojciferný dělitel']],
    'mix'     => ['title' => 'Náhodný mix',           'levels' => ['lehky' => 'Lehčí', 'vse' => 'Všechno']],
];

// Z čeho se skládá náhodný mix: každý příklad má náhodné téma i úroveň.
const MIX_POOLS = [
    'lehky' => [['mala', 'mix'], ['velka', 'nasobeni'], ['scitani', '100'], ['scitani', '1000'],
                ['zlomky', 'kraceni'], ['zlomky', 'nasobeni'], ['deleni', '1']],
    'vse'   => null,   // všechny úrovně všech témat
];

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

function gen_mala(string $level): array
{
    $a = rand(2, 10);
    $b = rand(2, 10);
    $op = $level === 'mix' ? pick(['x', 'd']) : ($level === 'deleni' ? 'd' : 'x');
    return mul_or_div($op, $a, $b);
}

// Příklad na násobení (a · b) nebo dělení (a·b : a) včetně operandů pro vysvětlení.
function mul_or_div(string $op, int $a, int $b): array
{
    if ($op === 'x') {
        return ['q' => "$a · $b", 'kind' => 'num', 'a' => $a * $b, 'p' => ['op' => 'x', 'a' => $a, 'b' => $b]];
    }
    return ['q' => ($a * $b) . " : $a", 'kind' => 'num', 'a' => $b, 'p' => ['op' => 'd', 'a' => $a * $b, 'b' => $a]];
}

function gen_velka(string $level): array
{
    if ($level === 'tezka') {
        $a = rand(11, 20);
        $b = rand(11, 20);
        return mul_or_div('x', $a, $b);
    }
    $a = rand(11, 20);
    $b = rand(2, 10);
    if (rand(0, 1)) {
        [$a, $b] = [$b, $a];
    }
    $op = $level === 'mix' ? pick(['x', 'd']) : ($level === 'deleni' ? 'd' : 'x');
    return mul_or_div($op, $a, $b);
}

function gen_scitani(string $level): array
{
    $op = pick(['+', '-']);
    $sym = $op === '+' ? '+' : '−';
    if ($level === 'zaporna') {
        $a = rand(-50, 50);
        $b = rand(-50, 50);
        $r = $op === '+' ? $a + $b : $a - $b;
        return ['q' => fmt_num($a) . " $sym " . fmt_operand($b), 'kind' => 'num', 'a' => $r, 'p' => ['op' => $op, 'a' => $a, 'b' => $b, 'lvl' => 'zaporna']];
    }
    if ($level === 'desetinna') {
        $a = rand(10, 999) / 10;
        $b = rand(10, 999) / 10;
        if ($op === '-' && $b > $a) {
            [$a, $b] = [$b, $a];
        }
        $r = round($op === '+' ? $a + $b : $a - $b, 1);
        return ['q' => fmt_num($a) . " $sym " . fmt_num($b), 'kind' => 'num', 'a' => $r, 'p' => ['op' => $op, 'a' => $a, 'b' => $b, 'lvl' => 'desetinna']];
    }
    $max = (int) $level;
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

// Čitatel tak, aby zlomek byl v základním tvaru (a ne roven 1); $mult určuje,
// kolikrát může čitatel přesáhnout jmenovatele (nepravé zlomky).
function simple_numerator(int $d, int $mult): int
{
    do {
        $n = rand(1, $d * $mult - 1);
    } while (gcd($n, $d) !== 1);
    return $n;
}

function gen_zlomky(string $level): array
{
    if ($level === 'mix') {
        $level = pick(['kraceni', 'scitani', 'nasobeni']);
    }
    if ($level === 'kraceni') {
        do {
            $d = rand(2, 12);
            $n = rand(1, $d * 2);
        } while (gcd($n, $d) !== 1 || $n === $d);
        $k = rand(2, 6);
        return ['q' => 'Zkrať: ' . ($n * $k) . '/' . ($d * $k), 'kind' => 'frac', 'a' => [$n, $d], 'strict' => true,
                'p' => ['op' => 'k', 'a' => [$n * $k, $d * $k]]];
    }
    if ($level === 'scitani') {
        $op = pick(['+', '-']);
        $b = rand(2, 10);
        $d = rand(0, 1) ? $b : rand(2, 10);   // půlka příkladů má stejné jmenovatele
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
    // násobení a dělení
    $op = pick(['·', ':']);
    $b = rand(2, 9);
    $d = rand(2, 9);
    $a = simple_numerator($b, 1);
    $c = simple_numerator($d, 1);
    if ($op === '·') {
        return ['q' => "$a/$b · $c/$d", 'kind' => 'frac', 'a' => frac_reduce($a * $c, $b * $d), 'p' => ['op' => '*', 'a' => [$a, $b], 'b' => [$c, $d]]];
    }
    return ['q' => "$a/$b : $c/$d", 'kind' => 'frac', 'a' => frac_reduce($a * $d, $b * $c), 'p' => ['op' => '/', 'a' => [$a, $b], 'b' => [$c, $d]]];
}

function gen_deleni(string $level): array
{
    if ($level === '2') {
        $divisor = rand(11, 99);
        $dividend = rand(1000, 99999);
    } else {
        $divisor = rand(2, 9);
        $dividend = rand(100, 9999);
    }
    return [
        'q' => fmt_num($dividend) . ' : ' . $divisor,
        'kind' => 'divrem',
        'a' => [intdiv($dividend, $divisor), $dividend % $divisor],
        'p' => ['a' => $dividend, 'b' => $divisor],
    ];
}

function generate_round(string $module, string $level, int $count): array
{
    if (!isset(MODULES[$module]) || !isset(MODULES[$module]['levels'][$level])) {
        throw new InvalidArgumentException('Neznámý modul nebo úroveň');
    }
    $pool = [];
    if ($module === 'mix') {
        $pool = MIX_POOLS[$level];
        if ($pool === null) {
            foreach (MODULES as $m => $def) {
                if ($m !== 'mix') {
                    foreach (array_keys($def['levels']) as $l) {
                        $pool[] = [$m, (string) $l];
                    }
                }
            }
        }
    }
    $out = [];
    $seen = [];
    $guard = 0;
    while (count($out) < $count && $guard++ < 500) {
        [$m, $l] = $pool ? $pool[random_int(0, count($pool) - 1)] : [$module, $level];
        $ex = ('gen_' . $m)($l);
        if (isset($seen[$ex['q']])) {
            continue;   // žádné opakování v jednom kole
        }
        $seen[$ex['q']] = true;
        $out[] = $ex;
    }
    return $out;
}

// Které klávesy kromě číslic příklad potřebuje (pro klávesnici na mobilu).
function extra_keys(array $ex): array
{
    if ($ex['kind'] === 'frac') {
        return ['/'];
    }
    $lvl = $ex['p']['lvl'] ?? '';
    return $lvl === 'zaporna' ? ['−'] : ($lvl === 'desetinna' ? [','] : []);
}

// Správná odpověď jako text (do DB a do zpětné vazby).
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

function given_str(array $ex, $given): string
{
    if ($ex['kind'] === 'divrem') {
        return trim((string) ($given['q'] ?? '')) . ' zb. ' . trim((string) ($given['r'] ?? ''));
    }
    return mb_substr(trim((string) $given), 0, 40);
}
