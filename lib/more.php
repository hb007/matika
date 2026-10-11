<?php
// Procenta, dělitelnost, statistika a desetinná čísla (násobení a dělení):
// generátory, nápověda po krocích, postup a rozbor chyb. Načítá se z generators.php.

// ---------- pomocné ----------

// Desetinné číslo jako celé číslo a počet míst (2,5 = [25, 1]), ať se nepočítá s nepřesnými floaty.
function dec(int $m, int $s): float
{
    return $m / 10 ** $s;
}

function dec_fmt(float $v): string
{
    return fmt_num(round($v, 4) == round($v) ? (int) round($v) : round($v, 4));
}

function dec_places(float $v): int
{
    $s = rtrim(rtrim(number_format($v, 6, '.', ''), '0'), '.');
    $p = strpos($s, '.');
    return $p === false ? 0 : strlen($s) - $p - 1;
}

function prime_factors(int $n): array
{
    $out = [];
    for ($p = 2; $p * $p <= $n; $p++) {
        while ($n % $p === 0) {
            $out[] = $p;
            $n = intdiv($n, $p);
        }
    }
    if ($n > 1) {
        $out[] = $n;
    }
    return $out;
}

function factors_str(int $n): string
{
    $f = prime_factors($n);
    return count($f) === 1 ? "$n je prvočíslo" : "$n = " . implode(' · ', $f);
}

// ---------- procenta ----------

const PROCENTA = [
    'lehke'   => ['p' => [10, 20, 25, 50, 75, 100], 'base' => [20, 200]],
    'stredni' => ['p' => [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90], 'base' => [20, 600]],
    'tezke'   => ['p' => null, 'base' => [40, 2000]],   // jakékoli 1–150 %
];

function gen_procenta(string $level, string $diff): array
{
    $cfg = PROCENTA[$diff];
    for ($try = 0; $try < 500; $try++) {
        $p = $cfg['p'] ? pick($cfg['p']) : rand(1, 150);
        $base = rand($cfg['base'][0], $cfg['base'][1]);
        if ($diff === 'lehke') {
            $base = intdiv($base, 20) * 20 ?: 20;   // kulatá čísla
        }
        if (($p * $base) % 100 !== 0) {
            continue;
        }
        $part = intdiv($p * $base, 100);
        $pp = ['op' => 'pct', 'form' => $level, 'p' => $p, 'base' => $base, 'part' => $part];
        switch ($level) {
            case 'z_cisla':
                return ['q' => "$p % z " . fmt_num($base), 'kind' => 'num', 'a' => $part, 'p' => $pp];
            case 'kolik':
                return ['q' => 'Kolik procent je ' . fmt_num($part) . ' z ' . fmt_num($base) . '?', 'kind' => 'num', 'a' => $p, 'p' => $pp];
            case 'zaklad':
                if ($part === 0) {
                    continue 2;
                }
                return ['q' => fmt_num($part) . " je $p % z kolika?", 'kind' => 'num', 'a' => $base, 'p' => $pp];
        }
    }
    throw new RuntimeException("procenta/$level/$diff");
}

function pct_steps(array $q): array
{
    ['form' => $f, 'p' => $p, 'base' => $b, 'part' => $c] = $q;
    $one = dec_fmt($b / 100);
    switch ($f) {
        case 'z_cisla':
            $special = [50 => 'polovina', 25 => 'čtvrtina', 10 => 'desetina', 100 => 'celé číslo', 20 => 'pětina', 75 => 'tři čtvrtiny'];
            if (isset($special[$p])) {
                return [["$p % je {$special[$p]} celku.", "$p % z " . fmt_num($b) . ' = ' . fmt_num($c)]];
            }
            return [['Nejdřív spočítej 1 %: vyděl celek stem.', '1 % z ' . fmt_num($b) . " = $one"],
                    ["Pak vynásob $p.", "$p · $one = " . fmt_num($c)]];
        case 'kolik':
            return [['Vyděl část celkem.', fmt_num($c) . ' : ' . fmt_num($b) . ' = ' . dec_fmt($c / $b)],
                    ['Desetinné číslo převeď na procenta (krát 100).', dec_fmt($c / $b) . " = $p %"]];
        case 'zaklad':
            return [["Nejdřív zjisti 1 %: vyděl část číslem $p.", '1 % = ' . fmt_num($c) . " : $p = $one"],
                    ['Celek je 100 %, takže vynásob 100.', "100 · $one = " . fmt_num($b)]];
    }
    return [];
}

function diagnose_pct(array $q, float $g): string
{
    ['form' => $f, 'p' => $p, 'base' => $b, 'part' => $c] = $q;
    $eq = fn($v) => abs($g - $v) < 0.001;
    if ($f === 'z_cisla' && $eq($p * $b)) {
        return 'Nezapomeň dělit stem: 1 % je setina celku.';
    }
    if ($f === 'kolik' && $eq($c / $b)) {
        return 'Tohle je desetinné číslo. V procentech je to stokrát víc.';
    }
    if ($f === 'zaklad' && $eq($c * $p / 100)) {
        return 'Hledáš celek (100 %), ne část. Celek je větší než ' . fmt_num($c) . '.';
    }
    return '';
}

// ---------- dělitelnost ----------

const DELITELNOST = [
    'lehke'   => ['digits' => [3, 3], 'by' => [2, 3, 5, 10], 'max' => 30],
    'stredni' => ['digits' => [3, 4], 'by' => [2, 3, 4, 5, 6, 9, 10], 'max' => 60],
    'tezke'   => ['digits' => [4, 5], 'by' => [3, 4, 6, 9], 'max' => 150],
];
const DELITELNOST_RULE = [
    2 => 'Číslo je dělitelné 2, když končí sudou číslicí (0, 2, 4, 6, 8).',
    3 => 'Číslo je dělitelné 3, když je jeho ciferný součet dělitelný 3.',
    4 => 'Číslo je dělitelné 4, když je jeho poslední dvojčíslí dělitelné 4.',
    5 => 'Číslo je dělitelné 5, když končí 0 nebo 5.',
    6 => 'Číslo je dělitelné 6, když je dělitelné 2 i 3 (sudé a ciferný součet dělitelný 3).',
    9 => 'Číslo je dělitelné 9, když je jeho ciferný součet dělitelný 9.',
    10 => 'Číslo je dělitelné 10, když končí nulou.',
];

function gen_delitelnost(string $level, string $diff): array
{
    $cfg = DELITELNOST[$diff];
    for ($try = 0; $try < 500; $try++) {
        if ($level === 'znaky') {
            $k = pick($cfg['by']);
            $len = rand($cfg['digits'][0], $cfg['digits'][1]);
            $digits = [rand(1, 9)];
            for ($i = 1; $i < $len; $i++) {
                $digits[] = rand(0, 9);
            }
            $pos = in_array($k, [2, 5, 10], true) ? $len - 1 : ($k === 4 ? rand($len - 2, $len - 1) : rand(0, $len - 1));
            $answer = null;
            for ($d = $pos === 0 ? 1 : 0; $d <= 9 && $answer === null; $d++) {
                $digits[$pos] = $d;
                if ((int) implode('', $digits) % $k === 0) {
                    $answer = $d;
                }
            }
            if ($answer === null) {
                continue;
            }
            $shown = $digits;
            $shown[$pos] = '□';
            return ['q' => implode('', $shown) . " je dělitelné $k", 'kind' => 'num', 'a' => $answer,
                    'p' => ['op' => 'div', 'form' => 'znaky', 'k' => $k, 'digits' => $digits, 'pos' => $pos]];
        }
        $a = rand(4, $cfg['max']);
        $b = rand(4, $cfg['max']);
        $g = gcd($a, $b);
        if ($a === $b || $g === 1 && $level === 'nsd' && $diff !== 'tezke' || max($a, $b) % min($a, $b) === 0) {
            continue;   // nudné dvojice: stejná čísla, nesoudělná u D, jedno dělí druhé
        }
        $l = intdiv($a * $b, $g);
        if ($level === 'nsn' && $l > ($diff === 'lehke' ? 120 : ($diff === 'stredni' ? 400 : 2000))) {
            continue;
        }
        $pp = ['op' => 'div', 'form' => $level, 'a' => $a, 'b' => $b];
        return $level === 'nsd'
            ? ['q' => "D($a, $b)", 'kind' => 'num', 'a' => $g, 'p' => $pp]
            : ['q' => "n($a, $b)", 'kind' => 'num', 'a' => $l, 'p' => $pp];
    }
    throw new RuntimeException("delitelnost/$level/$diff");
}

function div_steps(array $q, int $ans): array
{
    if ($q['form'] === 'znaky') {
        $k = $q['k'];
        $known = $q['digits'];
        unset($known[$q['pos']]);
        $sum = array_sum($known);
        $out = [[DELITELNOST_RULE[$k], '']];
        if (in_array($k, [3, 6, 9], true)) {
            $out[] = ['Sečti známé číslice.', 'Ciferný součet bez □ je ' . $sum];
        }
        $out[] = ['Zkoušej číslice od nejmenší a najdi první, která pravidlu vyhoví.', "□ = $ans, číslo " . implode('', $q['digits']) . " je dělitelné $k"];
        return $out;
    }
    ['a' => $a, 'b' => $b] = $q;
    $fa = prime_factors($a);
    $fb = prime_factors($b);
    $out = [['Rozlož obě čísla na prvočinitele.', factors_str($a) . ', ' . factors_str($b)]];
    if ($q['form'] === 'nsd') {
        $out[] = ['Vynásob prvočinitele, které mají obě čísla společné.', $ans === 1 ? 'Společné nemají žádné, D = 1' : "D($a, $b) = $ans"];
    } else {
        $out[] = ['Vezmi každého prvočinitele tolikrát, kolikrát je nejvíc v jednom z čísel, a vynásob.', "n($a, $b) = $ans"];
    }
    return $out;
}

function diagnose_div_rules(array $q, float $g, int $ans): string
{
    $gi = (int) $g;
    if ($q['form'] === 'znaky') {
        if ($gi < 0 || $gi > 9 || $gi != $g) {
            return 'Doplň jednu číslici 0 až 9.';
        }
        $d = $q['digits'];
        $d[$q['pos']] = $gi;
        $n = (int) implode('', $d);
        return $n % $q['k'] === 0 ? 'S touhle číslicí to dělitelné je, ale existuje menší.'
            : 'Číslo ' . $n . ' není dělitelné ' . $q['k'] . '. ' . DELITELNOST_RULE[$q['k']];
    }
    ['a' => $a, 'b' => $b] = $q;
    $l = intdiv($a * $b, gcd($a, $b));
    if ($q['form'] === 'nsd') {
        if ($gi === $l) {
            return 'To je nejmenší společný násobek. Hledáš dělitel, ten je menší než obě čísla.';
        }
        if ($gi > 0 && $a % $gi === 0 && $b % $gi === 0) {
            return 'Obě čísla tím jdou vydělit, ale existuje větší společný dělitel.';
        }
        return '';
    }
    if ($gi === gcd($a, $b)) {
        return 'To je společný dělitel. Hledáš násobek, ten je větší než obě čísla.';
    }
    if ($gi === $a * $b && $gi !== $l) {
        return 'Součin je společný násobek, ale ne nejmenší.';
    }
    if ($gi > 0 && $gi % $a === 0 && $gi % $b === 0) {
        return 'Je to společný násobek, ale ne nejmenší.';
    }
    return '';
}

// ---------- statistika ----------

const STATISTIKA = [
    'lehke'   => ['n' => [3, 4], 'max' => 10],
    'stredni' => ['n' => [5, 6], 'max' => 30],
    'tezke'   => ['n' => [6, 8], 'max' => 100],
];

function gen_statistika(string $level, string $diff): array
{
    $cfg = STATISTIKA[$diff];
    for ($try = 0; $try < 1000; $try++) {
        $n = rand($cfg['n'][0], $cfg['n'][1]);
        if ($level === 'modus') {
            $n = max($n, 5);   // ať tam jsou i jiná čísla než modus
        }
        if ($level === 'median' && $diff === 'lehke' && $n % 2 === 0) {
            $n++;   // na lehké lichý počet, medián je jedno prostřední číslo
        }
        $xs = [];
        for ($i = 0; $i < $n; $i++) {
            $xs[] = rand(1, $cfg['max']);
        }
        if ($level === 'modus') {
            // jedno číslo nejčastěji (2–3×), ostatní míň
            $m = rand(1, $cfg['max']);
            $times = $n >= 6 ? 3 : 2;
            for ($i = 0; $i < $times; $i++) {
                $xs[$i] = $m;
            }
            shuffle($xs);
            $cnt = array_count_values($xs);
            arsort($cnt);
            $top = array_values($cnt);
            if (count($top) < 2 || $top[0] === $top[1]) {
                continue;   // aspoň dvě různá čísla a jediné nejčastější
            }
            $ans = array_key_first($cnt);
        } elseif ($level === 'prumer') {
            if (array_sum($xs) % $n !== 0) {
                continue;
            }
            $ans = intdiv(array_sum($xs), $n);
        } else {
            $s = $xs;
            sort($s);
            $ans = $n % 2 ? $s[intdiv($n, 2)] : ($s[$n / 2 - 1] + $s[$n / 2]) / 2;
            if (is_float($ans) && $ans == (int) $ans) {
                $ans = (int) $ans;
            }
            if ($s === $xs) {
                continue;   // ať je potřeba čísla seřadit
            }
        }
        return ['q' => implode(', ', $xs), 'kind' => 'num', 'a' => $ans,
                'p' => ['op' => 'stat', 'form' => $level, 'xs' => $xs, 'dec' => $level === 'median' && $n % 2 === 0]];
    }
    throw new RuntimeException("statistika/$level/$diff");
}

function stat_steps(array $q, $ans): array
{
    $xs = $q['xs'];
    $n = count($xs);
    switch ($q['form']) {
        case 'prumer':
            return [['Sečti všechna čísla.', 'Součet: ' . implode(' + ', $xs) . ' = ' . array_sum($xs)],
                    ["Vyděl součet počtem čísel ($n).", array_sum($xs) . " : $n = " . fmt_num($ans)]];
        case 'median':
            $s = $xs;
            sort($s);
            $mid = $n % 2
                ? ['Prostřední číslo (' . (intdiv($n, 2) + 1) . '. z ' . $n . ') je medián.', 'Medián = ' . fmt_num($ans)]
                : ['Čísel je sudý počet: medián je průměr dvou prostředních.', '(' . $s[$n / 2 - 1] . ' + ' . $s[$n / 2] . ') : 2 = ' . fmt_num($ans)];
            return [['Seřaď čísla od nejmenšího.', 'Seřazeno: ' . implode(', ', $s)], $mid];
        case 'modus':
            $cnt = array_count_values($xs);
            return [['Spočítej, kolikrát je tam které číslo.', implode(', ', array_map(fn($v, $c) => "{$v}×$c", array_keys($cnt), $cnt))],
                    ['Modus je číslo, které je tam nejčastěji.', 'Modus = ' . $ans . ' (' . $cnt[$ans] . '×)']];
    }
    return [];
}

function diagnose_stat(array $q, float $g, $ans): string
{
    $xs = $q['xs'];
    $n = count($xs);
    $eq = fn($v) => abs($g - $v) < 0.001;
    switch ($q['form']) {
        case 'prumer':
            return $eq(array_sum($xs)) ? 'To je součet. Ještě ho vyděl počtem čísel.' : '';
        case 'median':
            $raw = $n % 2 ? $xs[intdiv($n, 2)] : ($xs[$n / 2 - 1] + $xs[$n / 2]) / 2;
            if ($eq($raw)) {
                return 'Nejdřív čísla seřaď od nejmenšího, pak vezmi prostřední.';
            }
            return $eq(array_sum($xs) / $n) ? 'To je průměr. Medián je prostřední číslo seřazené řady.' : '';
        case 'modus':
            $cnt = array_count_values($xs);
            return $eq($cnt[$ans]) ? 'To je, kolikrát tam to číslo je. Modus je to číslo samotné.' : '';
    }
    return '';
}

// ---------- desetinná čísla: násobení a dělení ----------

const DESETINNA_MD = [
    'lehke'   => ['m' => [11, 99], 'k' => [2, 9]],
    'stredni' => ['m' => [11, 99], 'k' => [2, 12]],
    'tezke'   => ['m' => [101, 999], 'k' => [2, 25]],
];

// vrací [výraz, výsledek] nebo null; vše nejvýš na 2 desetinná místa
function gen_desetinna(string $level, string $diff): array
{
    $cfg = DESETINNA_MD[$diff];
    for ($try = 0; $try < 500; $try++) {
        if ($level === 'posun') {
            $pow = $diff === 'lehke' ? 10 : pick([10, 100, 1000]);
            $mul = (bool) rand(0, 1);
            $x = dec(rand($cfg['m'][0], $cfg['m'][1]), rand(0, $diff === 'tezke' ? 2 : 1));
            $r = $mul ? $x * $pow : $x / $pow;
            if (dec_places($r) > 2 || $r >= 100000) {
                continue;
            }
            $q = dec_fmt($x) . ($mul ? ' · ' : ' : ') . fmt_num($pow);
            return ['q' => $q, 'kind' => 'num', 'a' => (float) round($r, 4), 'p' => ['op' => 'dmd', 'form' => 'posun', 'x' => $x, 'y' => $pow, 'mul' => $mul, 'dec' => true]];
        }
        // činitelé / dělitel: na lehké desetinné · celé, na střední a těžké i desetinné · desetinné
        $x = dec(rand($cfg['m'][0], $cfg['m'][1]), $diff === 'tezke' ? rand(1, 2) : 1);
        $y = $diff === 'lehke' ? rand($cfg['k'][0], $cfg['k'][1]) : dec(rand($cfg['k'][0], $cfg['k'][1]), rand(0, 1));
        if ($y == 1) {
            continue;   // krát/děleno jedničkou nic nenaučí
        }
        if ($level === 'nasobeni') {
            $r = $x * $y;
            if (dec_places($r) > 2) {
                continue;
            }
            return ['q' => dec_fmt($x) . ' · ' . dec_fmt($y), 'kind' => 'num', 'a' => (float) round($r, 4),
                    'p' => ['op' => 'dmd', 'form' => 'nasobeni', 'x' => $x, 'y' => $y, 'mul' => true, 'dec' => true]];
        }
        // dělení: dělenec = výsledek · dělitel, ať vyjde beze zbytku
        $r = $x;
        $dividend = round($r * $y, 6);
        if (dec_places($dividend) > 2 || $y == 0 || dec_places($dividend) + dec_places($y) + dec_places($r) === 0) {
            continue;   // aspoň jedno desetinné číslo, jinak to není úloha na desetinná čísla
        }
        return ['q' => dec_fmt($dividend) . ' : ' . dec_fmt($y), 'kind' => 'num', 'a' => (float) round($r, 4),
                'p' => ['op' => 'dmd', 'form' => 'deleni', 'x' => $dividend, 'y' => $y, 'mul' => false, 'dec' => true]];
    }
    throw new RuntimeException("desetinna/$level/$diff");
}

function dmd_steps(array $q, float $ans): array
{
    ['x' => $x, 'y' => $y] = $q;
    if ($q['form'] === 'posun') {
        $k = strlen((string) $y) - 1;
        $dir = $q['mul'] ? 'doprava' : 'doleva';
        return [[($q['mul'] ? 'Násobení' : 'Dělení') . ' číslem ' . fmt_num($y) . " posune desetinnou čárku o $k " . ($k === 1 ? 'místo' : 'místa') . " $dir.",
                 dec_fmt($x) . ($q['mul'] ? ' · ' : ' : ') . fmt_num($y) . ' = ' . dec_fmt($ans)]];
    }
    $px = dec_places($x);
    $py = dec_places($y);
    $ix = (int) round($x * 10 ** $px);
    $iy = (int) round($y * 10 ** $py);
    if ($q['mul']) {
        return [['Vynásob čísla, jako by neměla desetinnou čárku.', "$ix · $iy = " . ($ix * $iy)],
                ['Spočítej desetinná místa obou činitelů a tolik jich dej i výsledku.', 'Míst je ' . ($px + $py) . ': ' . dec_fmt($ans)]];
    }
    if ($py > 0) {
        $f = 10 ** $py;
        return [["Dělitel převeď na celé číslo: obě čísla vynásob $f.", dec_fmt($x) . ' : ' . dec_fmt($y) . ' = ' . dec_fmt($x * $f) . ' : ' . $iy],
                ['Teď děl celým číslem.', dec_fmt($x * $f) . ' : ' . $iy . ' = ' . dec_fmt($ans)]];
    }
    return [['Děl, jako by dělenec neměl desetinnou čárku.', "$ix : $iy = " . dec_fmt($ix / $iy)],
            ["Čárku ve výsledku posuň o $px " . ($px === 1 ? 'místo' : 'místa') . ' doleva (kolik měl dělenec).', dec_fmt($x) . ' : ' . $iy . ' = ' . dec_fmt($ans)]];
}

function diagnose_dmd(array $q, float $g, float $ans): string
{
    foreach ([10, 100, 1000] as $f) {
        if (abs($g * $f - $ans) < 0.001 || abs($g - $ans * $f) < 0.001) {
            return 'Číslice sedí, ale desetinná čárka je na špatném místě.';
        }
    }
    return '';
}

// ---------- společné rozhraní pro explain.php ----------

function more_steps(array $ex): array
{
    $p = $ex['p'];
    return match ($p['op']) {
        'pct' => pct_steps($p),
        'div' => div_steps($p, (int) $ex['a']),
        'stat' => stat_steps($p, $ex['a']),
        'dmd' => dmd_steps($p, (float) $ex['a']),
        default => [],
    };
}

// Postup: všechny kroky s výsledkem.
function explain_more(array $ex): array
{
    return array_values(array_filter(array_map(fn($s) => trim($s[0] . ($s[1] !== '' ? ' ' . $s[1] . '.' : '')), more_steps($ex))));
}

// Nápověda: kroky s výsledkem kromě posledního, ten jen jako pokyn.
function hints_more(array $ex): array
{
    $steps = more_steps($ex);
    $out = [];
    foreach ($steps as $i => $s) {
        $last = $i === count($steps) - 1;
        $out[] = $last || $s[1] === '' ? $s[0] : $s[0] . ' ' . $s[1] . '.';
    }
    return $out;
}

function diagnose_more(array $ex, float $g): string
{
    $p = $ex['p'];
    return match ($p['op']) {
        'pct' => diagnose_pct($p, $g),
        'div' => diagnose_div_rules($p, $g, (int) $ex['a']),
        'stat' => diagnose_stat($p, $g, $ex['a']),
        'dmd' => diagnose_dmd($p, $g, (float) $ex['a']),
        default => '',
    };
}

// Popisek před políčkem a jednotka za ním (průměr = …, □ = …, … %).
function more_var(array $ex): ?string
{
    $p = $ex['p'] ?? [];
    return match ($p['op'] ?? '') {
        'stat' => ['prumer' => 'průměr', 'median' => 'medián', 'modus' => 'modus'][$p['form']],
        'div' => $p['form'] === 'znaky' ? '□' : null,
        default => null,
    };
}

function question_unit(array $ex): ?string
{
    return ($ex['p']['op'] ?? '') === 'pct' && $ex['p']['form'] === 'kolik' ? '%' : null;
}

function is_more(array $ex): bool
{
    return in_array($ex['p']['op'] ?? '', ['pct', 'div', 'stat', 'dmd'], true);
}
