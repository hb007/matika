<?php
// Římské číslice: převod z římských na arabské (odpověď číslo) a z arabských
// na římské (odpověď text, kind 'roman', klávesnice s písmeny I V X L C D M).

const RIMSKE = [
    'lehke'   => ['range' => [1, 39], 'keys' => ['I', 'V', 'X']],
    'stredni' => ['range' => [40, 399], 'keys' => ['I', 'V', 'X', 'L', 'C']],
    'tezke'   => ['range' => [400, 3999], 'keys' => ['I', 'V', 'X', 'L', 'C', 'D', 'M']],
];
const ROMAN_VALUES = ['I' => 1, 'V' => 5, 'X' => 10, 'L' => 50, 'C' => 100, 'D' => 500, 'M' => 1000];
// Správný zápis: stejná číslice nejvýš 3× za sebou, odečítá se jen I, X, C (IV, IX, XL, XC, CD, CM).
const ROMAN_RE = '/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/';

function gen_rimske(string $level, string $diff): array
{
    ['range' => [$lo, $hi], 'keys' => $keys] = RIMSKE[$diff];
    $n = rand($lo, $hi);
    $r = to_roman($n);
    $p = ['op' => 'rom', 'form' => $level, 'n' => $n, 'r' => $r, 'keys' => $keys];
    return $level === 'na_rimske'
        ? ['q' => fmt_num($n), 'kind' => 'roman', 'a' => $r, 'p' => $p]
        : ['q' => $r, 'kind' => 'num', 'a' => $n, 'p' => $p];
}

// Řády čísla jako [hodnota, římský zápis], např. 1994 → [[1000, M], [900, CM], [90, XC], [4, IV]].
function roman_parts(int $n): array
{
    $sym = [[1, 'I', 'V', 'X'], [10, 'X', 'L', 'C'], [100, 'C', 'D', 'M'], [1000, 'M', '', '']];
    $out = [];
    for ($i = 3; $i >= 0; $i--) {
        [$u, $one, $five, $ten] = $sym[$i];
        $d = intdiv($n, $u) % 10;
        if ($d === 0) {
            continue;
        }
        $s = match (true) {
            $d === 9 => $one . $ten,
            $d >= 5 => $five . str_repeat($one, $d - 5),
            $d === 4 => $one . $five,
            default => str_repeat($one, $d),
        };
        $out[] = [$d * $u, $s];
    }
    return $out;
}

function to_roman(int $n): string
{
    return implode('', array_column(roman_parts($n), 1));
}

// Odpověď dítěte: velká písmena bez mezer.
function roman_norm(string $s): string
{
    return strtoupper(preg_replace('/[ \t\r\n]+/', '', $s));
}

function roman_readable(string $s): bool
{
    return (bool) preg_match('/^[IVXLCDM]+$/', roman_norm($s));
}

// Hodnota i nesprávně zapsaného čísla (menší před větší se odečítá).
function roman_value(string $s): int
{
    $v = 0;
    $s = roman_norm($s);
    for ($i = 0; $i < strlen($s); $i++) {
        $x = ROMAN_VALUES[$s[$i]];
        $v += $i + 1 < strlen($s) && $x < ROMAN_VALUES[$s[$i + 1]] ? -$x : $x;
    }
    return $v;
}

// Jak se řád počítá: IX → 10 − 1, VIII → 5 + 1 + 1 + 1, M → ''.
function roman_part_sum(string $s): string
{
    $vals = array_map(fn($c) => fmt_num(ROMAN_VALUES[$c]), str_split($s));
    if (count($vals) === 2 && ROMAN_VALUES[$s[0]] < ROMAN_VALUES[$s[1]]) {
        return "{$vals[1]} − {$vals[0]}";
    }
    return count($vals) > 1 ? implode(' + ', $vals) : '';
}

// Kroky [pokyn, výsledek] jako v more.php: nápověda ukáže u posledního jen pokyn.
function rom_steps(array $p): array
{
    $vals = implode(', ', array_map(fn($c) => "$c = " . fmt_num(ROMAN_VALUES[$c]), $p['keys']));
    $steps = [["Hodnoty: $vals.", '']];
    $parts = roman_parts($p['n']);
    $multi = count($parts) > 1;
    if ($p['form'] === 'na_rimske') {
        if ($multi) {
            $steps[] = ['Rozlož číslo na tisíce, stovky, desítky a jednotky:', fmt_num($p['n']) . ' = ' . implode(' + ', array_map(fn($x) => fmt_num($x[0]), $parts))];
        }
        foreach ($parts as [$v, $s]) {
            $sum = roman_part_sum($s);
            $steps[] = [fmt_num($v) . ' =', $s . ($sum !== '' ? " ($sum)" : '')];
        }
        if ($multi) {
            $steps[] = ['Napiš části za sebou:', $p['r']];
        }
        return $steps;
    }
    if ($multi) {
        $steps[] = ['Rozděl číslo na tisíce, stovky, desítky a jednotky:', implode(' | ', array_column($parts, 1))];
    }
    foreach ($parts as [$v, $s]) {
        $sum = roman_part_sum($s);
        $sub = strlen($s) === 2 && ROMAN_VALUES[$s[0]] < ROMAN_VALUES[$s[1]];
        $steps[] = ["$s =", fmt_num($v) . ($sum !== '' ? ' (' . ($sub ? 'menší před větší se odečítá: ' : '') . "$sum)" : '')];
    }
    if ($multi) {
        $steps[] = ['Sečti části:', implode(' + ', array_map(fn($x) => fmt_num($x[0]), $parts)) . ' = ' . fmt_num($p['n'])];
    }
    return $steps;
}

function explain_rom(array $ex): array
{
    return array_map(fn($s) => trim($s[0] . ($s[1] !== '' ? ' ' . $s[1] . '.' : '')), rom_steps($ex['p']));
}

function hints_rom(array $ex): array
{
    $steps = rom_steps($ex['p']);
    $out = [];
    foreach ($steps as $i => $s) {
        $out[] = $i === count($steps) - 1 || $s[1] === '' ? $s[0] : $s[0] . ' ' . $s[1] . '.';
    }
    return $out;
}

function diagnose_rom(array $ex, $given): string
{
    $p = $ex['p'];
    if ($p['form'] === 'na_rimske') {
        $g = roman_norm((string) $given);
        if (!roman_readable($g) || !preg_match(ROMAN_RE, $g)) {
            return '';   // nesprávný zápis vysvětlí už poznámka z check_answer
        }
        return "$g je " . fmt_num(roman_value($g)) . ', ne ' . fmt_num($p['n']) . '.';
    }
    $g = parse_num((string) $given);
    if ($g === null) {
        return '';
    }
    $plain = array_sum(array_map(fn($c) => ROMAN_VALUES[$c], str_split($p['r'])));
    if ($plain !== $p['n'] && abs($g - $plain) < 0.001) {
        foreach (roman_parts($p['n']) as [$v, $s]) {
            if (strlen($s) === 2 && ROMAN_VALUES[$s[0]] < ROMAN_VALUES[$s[1]]) {
                return "Menší číslice před větší se odečítá: $s = " . roman_part_sum($s) . ' = ' . fmt_num($v) . ', ne ' . fmt_num(ROMAN_VALUES[$s[0]] + ROMAN_VALUES[$s[1]]) . '.';
            }
        }
    }
    return '';
}
