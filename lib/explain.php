<?php
// Nápověda před odpovědí, postup řešení a rozbor konkrétní chyby.
// Pracuje s operandy v $ex['p'] (viz generators.php).
//
//   hint($ex)              – věta, která navede, ale neprozradí výsledek
//   explain($ex)           – postup řešení po krocích (pole řádků)
//   diagnose($ex, $given)  – co je na odpovědi špatně; '' když to nepoznáme

function lcm(int $a, int $b): int
{
    return intdiv($a * $b, gcd($a, $b));
}

// ---------- násobilka ----------

function hint_mul(array $p): string
{
    ['a' => $a, 'b' => $b] = $p;
    if ($p['op'] === 'd') {
        return "Hledej číslo, které krát $b dá " . fmt_num($a) . '.';
    }
    if ($a > 10 || $b > 10) {
        [$big, $small] = $a >= $b ? [$a, $b] : [$b, $a];
        $tens = intdiv($big, 10) * 10;
        return "Rozlož na desítky a jednotky: $big · $small = $tens · $small + " . ($big - $tens) . " · $small.";
    }
    if ($a === 10 || $b === 10) {
        return 'Násobení deseti: připiš nulu.';
    }
    [$big, $small] = $a >= $b ? [$a, $b] : [$b, $a];
    if ($big >= 8) {
        return "Jdi přes desítku: 10 · $small = " . (10 * $small) . ', pak uber ' . (10 - $big) . '× ' . $small . '.';
    }
    if ($big >= 6) {
        return "Jdi přes pětku: 5 · $small = " . (5 * $small) . ', pak přidej ' . ($big - 5) . '× ' . $small . '.';
    }
    return "Sčítej: $small + $small + … ($big krát).";
}

function explain_mul(array $p): array
{
    ['a' => $a, 'b' => $b] = $p;
    if ($p['op'] === 'd') {
        $q = intdiv($a, $b);
        return ["Dělení je obrácené násobení: hledám číslo, které krát $b dá " . fmt_num($a) . '.',
                "$b · $q = " . fmt_num($a) . ", takže " . fmt_num($a) . " : $b = $q."];
    }
    $r = $a * $b;
    [$big, $small] = $a >= $b ? [$a, $b] : [$b, $a];
    if ($big > 10) {
        $tens = intdiv($big, 10) * 10;
        $ones = $big - $tens;
        return ["Rozložím $big na $tens + $ones.",
                "$tens · $small = " . ($tens * $small) . ", $ones · $small = " . ($ones * $small) . '.',
                ($tens * $small) . ' + ' . ($ones * $small) . " = $r."];
    }
    if ($big === 10) {
        return ["Krát deset = připiš nulu: $small → $r."];
    }
    if ($big >= 8) {
        $k = 10 - $big;
        return ["10 · $small = " . (10 * $small) . '.',
                "$big je o $k míň než 10, tak uberu {$k}× $small = " . ($k * $small) . '.',
                (10 * $small) . ' − ' . ($k * $small) . " = $r."];
    }
    if ($big >= 6) {
        $k = $big - 5;
        return ["5 · $small = " . (5 * $small) . '.',
                "$big je o $k víc než 5, tak přidám {$k}× $small = " . ($k * $small) . '.',
                (5 * $small) . ' + ' . ($k * $small) . " = $r."];
    }
    return ["$big · $small = " . implode(' + ', array_fill(0, $big, $small)) . " = $r."];
}

function diagnose_mul(array $p, float $g): string
{
    ['a' => $a, 'b' => $b] = $p;
    if ($p['op'] === 'd') {
        $gi = (int) $g;
        if ($g !== (float) $gi) {
            return '';
        }
        $back = $b * $gi;
        return "Zkouška: $b · $gi = " . fmt_num($back) . ', ale má vyjít ' . fmt_num($a) . '.';
    }
    $r = $a * $b;
    if ($g == $a + $b) {
        return 'Sečetl jsi čísla, ale má se násobit.';
    }
    foreach ([[$a, $b], [$b, $a]] as [$x, $y]) {
        if ($g == $x * ($y + 1)) {
            return "To je $x · " . ($y + 1) . ". Máš tam jednou $x navíc.";
        }
        if ($g == $x * ($y - 1)) {
            return "To je $x · " . ($y - 1) . ". Chybí ti jednou $x.";
        }
    }
    if ($g == $r * 10 || ($r % 10 === 0 && $g == $r / 10)) {
        return 'Pozor na nuly na konci.';
    }
    return '';
}

// ---------- sčítání a odčítání ----------

function place_parts(int $n): array
{
    $parts = [];
    $digits = str_split((string) $n);
    $len = count($digits);
    foreach ($digits as $i => $d) {
        if ($d !== '0') {
            $parts[] = (int) $d * (10 ** ($len - 1 - $i));
        }
    }
    return $parts;
}

function hint_add(array $p): string
{
    ['op' => $op, 'a' => $a, 'b' => $b] = $p;
    if ($p['lvl'] === 'desetinna') {
        return 'Napiš čárku pod čárku, počítej jako bez čárky a na konci čárku vrať.';
    }
    if ($p['lvl'] === 'zaporna') {
        if ($op === '-' && $b < 0) {
            return 'Mínus před závorkou obrátí znaménko: odečíst záporné = přičíst.';
        }
        if ($op === '+' && $b < 0) {
            return 'Přičíst záporné číslo = odečíst: plus a mínus dává mínus.';
        }
        if ($a < 0 && $b < 0) {
            return 'Dvě záporná čísla: sečti je jako kladná a výsledku dej mínus.';
        }
        return 'Čísla s různým znaménkem: odečti menší od většího a znaménko dej podle většího.';
    }
    $parts = place_parts($b);
    if (count($parts) < 2) {
        return $op === '+' ? 'Přičti rovnou, hlídej přechod přes desítku.' : 'Odečti rovnou, hlídej přechod přes desítku.';
    }
    return 'Rozlož ' . fmt_num($b) . ' na ' . implode(' + ', array_map('fmt_num', $parts)) . ($op === '+' ? ' a přičítej postupně.' : ' a odčítej postupně.');
}

function explain_add(array $p): array
{
    ['op' => $op, 'a' => $a, 'b' => $b] = $p;
    $res = $op === '+' ? $a + $b : $a - $b;
    if ($p['lvl'] === 'desetinna') {
        $ai = (int) round($a * 10);
        $bi = (int) round($b * 10);
        $ri = $op === '+' ? $ai + $bi : $ai - $bi;
        return ['Obě čísla napíšu na jedno desetinné místo: ' . number_format($a, 1, ',', ' ') . ' a ' . number_format($b, 1, ',', ' ') . '.',
                'Počítám bez čárky: ' . fmt_num($ai) . ($op === '+' ? ' + ' : ' − ') . fmt_num($bi) . ' = ' . fmt_num($ri) . '.',
                'Vrátím čárku (jedno místo): ' . fmt_num(round($res, 1)) . '.'];
    }
    if ($p['lvl'] === 'zaporna') {
        $lines = [];
        if ($op === '-' && $b < 0) {
            $lines[] = 'Odečíst záporné = přičíst: ' . fmt_num($a) . ' − (' . fmt_num($b) . ') = ' . fmt_num($a) . ' + ' . fmt_num(-$b) . '.';
            $op = '+';
            $b = -$b;
        } elseif ($op === '+' && $b < 0) {
            $lines[] = 'Přičíst záporné = odečíst: ' . fmt_num($a) . ' + (' . fmt_num($b) . ') = ' . fmt_num($a) . ' − ' . fmt_num(-$b) . '.';
            $op = '-';
            $b = -$b;
        }
        // teď je $b >= 0
        if ($op === '+') {
            if ($a < 0) {
                $lines[] = 'Různá znaménka: odečtu menší od většího: ' . fmt_num(max(-$a, $b)) . ' − ' . fmt_num(min(-$a, $b)) . ' = ' . fmt_num(abs($res)) . '.';
                $lines[] = 'Znaménko podle většího čísla (' . fmt_num(-$a > $b ? $a : $b) . '): ' . fmt_num($res) . '.';
            } else {
                $lines[] = fmt_num($a) . ' + ' . fmt_num($b) . ' = ' . fmt_num($res) . '.';
            }
        } else {
            if ($a < 0) {
                $lines[] = 'Záporné mínus kladné: jdu ještě víc do mínusu. ' . fmt_num(-$a) . ' + ' . fmt_num($b) . ' = ' . fmt_num(-$res) . ', s mínusem ' . fmt_num($res) . '.';
            } elseif ($b > $a) {
                $lines[] = 'Odčítám víc, než mám, výsledek bude záporný: ' . fmt_num($b) . ' − ' . fmt_num($a) . ' = ' . fmt_num(-$res) . ', tedy ' . fmt_num($res) . '.';
            } else {
                $lines[] = fmt_num($a) . ' − ' . fmt_num($b) . ' = ' . fmt_num($res) . '.';
            }
        }
        return $lines;
    }
    $parts = place_parts($b);
    if (count($parts) < 2) {
        return [fmt_num($a) . ($op === '+' ? ' + ' : ' − ') . fmt_num($b) . ' = ' . fmt_num($res) . '.'];
    }
    $lines = ['Rozložím ' . fmt_num($b) . ' na ' . implode(' + ', array_map('fmt_num', $parts)) . '.'];
    $cur = $a;
    foreach ($parts as $part) {
        $next = $op === '+' ? $cur + $part : $cur - $part;
        $lines[] = fmt_num($cur) . ($op === '+' ? ' + ' : ' − ') . fmt_num($part) . ' = ' . fmt_num($next) . '.';
        $cur = $next;
    }
    return $lines;
}

function diagnose_add(array $p, float $g): string
{
    ['op' => $op, 'a' => $a, 'b' => $b] = $p;
    $res = $op === '+' ? $a + $b : $a - $b;
    $eq = fn($x, $y) => abs($x - $y) < 0.001;
    if ($p['lvl'] === 'zaporna') {
        if ($op === '-' && $b < 0 && $eq($g, $a - abs($b))) {
            return 'Odečíst záporné číslo znamená přičíst: ' . fmt_num($a) . ' + ' . fmt_num(-$b) . '.';
        }
        if ($op === '+' && $b < 0 && $eq($g, $a + abs($b))) {
            return 'Přičíst záporné číslo znamená odečíst: ' . fmt_num($a) . ' − ' . fmt_num(-$b) . '.';
        }
        if ($eq(abs($g), abs($a) + abs($b)) && !$eq(abs($res), abs($a) + abs($b))) {
            return 'Čísla s různým znaménkem se nesčítají, ale odečítají (menší od většího).';
        }
    }
    if ($eq($g, -$res) && $res != 0) {
        return 'Číslo sedí, jen znaménko je naopak.';
    }
    if ($op === '-' && $eq($g, $a + $b)) {
        return 'Sečetl jsi, ale má se odčítat.';
    }
    if ($op === '+' && $eq($g, $a - $b)) {
        return 'Odečetl jsi, ale má se sčítat.';
    }
    if ($p['lvl'] === 'desetinna') {
        if ($eq($g * 10, $res) || $eq($g, $res * 10)) {
            return 'Desetinná čárka je na špatném místě.';
        }
        if ($eq(floor($g), floor($res))) {
            return 'Celá část sedí, chyba je v desetinách.';
        }
        return 'Pozor: čárka musí být pod čárkou (desetiny pod desetinami).';
    }
    $diff = abs($g - $res);
    foreach ([1000, 100, 10] as $step) {
        if ($eq($diff, $step)) {
            $name = ['1000' => 'tisíc', '100' => 'stovku', '10' => 'desítku'][(string) $step];
            return "Jsi vedle přesně o $name, nejspíš přechod přes " . ($step === 10 ? 'desítku' : ($step === 100 ? 'stovku' : 'tisícovku')) . '.';
        }
    }
    if ($eq($diff, 1) || $eq($diff, 2)) {
        return 'Těsně vedle, zkontroluj jednotky.';
    }
    return '';
}

// ---------- zlomky ----------

function fr(array $f): string
{
    return "{$f[0]}/{$f[1]}";
}

function hint_frac(array $p): string
{
    switch ($p['op']) {
        case 'k':
            return 'Najdi číslo, kterým jde dělit čitatel i jmenovatel. Zkus 2, 3, 5, 7. Dokud to jde, děl dál.';
        case '*':
            return 'Čitatel krát čitatel, jmenovatel krát jmenovatel. Pak zkrať.';
        case '/':
            return 'Dělit zlomkem = násobit převráceným zlomkem. Otoč druhý zlomek a násob.';
        default:
            if ($p['a'][1] === $p['b'][1]) {
                return 'Jmenovatele jsou stejné, počítej jen s čitateli. Jmenovatel zůstane.';
            }
            return 'Převeď oba zlomky na společný jmenovatel ' . lcm($p['a'][1], $p['b'][1]) . ', pak počítej čitatele.';
    }
}

function explain_frac(array $p, array $answer): array
{
    $final = frac_str($answer[0], $answer[1]);
    switch ($p['op']) {
        case 'k':
            [$n, $d] = $p['a'];
            $g = gcd($n, $d);
            return ["Největší číslo, kterým jde dělit $n i $d, je $g.",
                    "$n : $g = " . intdiv($n, $g) . ", $d : $g = " . intdiv($d, $g) . '.',
                    "Výsledek: $final."];
        case '*':
            [$a, $b] = $p['a'];
            [$c, $d] = $p['b'];
            $lines = ["Čitatel krát čitatel: $a · $c = " . ($a * $c) . ". Jmenovatel krát jmenovatel: $b · $d = " . ($b * $d) . '.'];
            $lines[] = 'Vyjde ' . ($a * $c) . '/' . ($b * $d) . (gcd($a * $c, $b * $d) > 1 ? ", zkrátím na $final." : '.');
            return $lines;
        case '/':
            [$a, $b] = $p['a'];
            [$c, $d] = $p['b'];
            $lines = ["Převrátím druhý zlomek: $c/$d → $d/$c, a násobím: $a/$b · $d/$c."];
            $lines[] = "$a · $d = " . ($a * $d) . ", $b · $c = " . ($b * $c) . ' → ' . ($a * $d) . '/' . ($b * $c) . (gcd($a * $d, $b * $c) > 1 ? ", zkrátím na $final." : '.');
            return $lines;
        default:
            [$a, $b] = $p['a'];
            [$c, $d] = $p['b'];
            $sym = $p['op'] === '+' ? '+' : '−';
            if ($b === $d) {
                $n = $p['op'] === '+' ? $a + $c : $a - $c;
                $lines = ["Stejné jmenovatele: jmenovatel $b zůstane, počítám čitatele $a $sym $c = $n."];
                $lines[] = "Vyjde $n/$b" . (gcd($n, $b) > 1 ? ", zkrátím na $final." : '.');
                return $lines;
            }
            $l = lcm($b, $d);
            $a2 = $a * intdiv($l, $b);
            $c2 = $c * intdiv($l, $d);
            $n = $p['op'] === '+' ? $a2 + $c2 : $a2 - $c2;
            $conv = fn($x, $y, $x2) => $y === $l ? "$x/$y zůstane" : "$x/$y = $x2/$l (krát " . intdiv($l, $y) . ')';
            return ["Společný jmenovatel $b a $d je $l.",
                    $conv($a, $b, $a2) . ', ' . $conv($c, $d, $c2) . '.',
                    "Čitatele: $a2 $sym $c2 = $n → $n/$l" . (gcd($n, $l) > 1 ? ", zkrátím na $final." : '.')];
    }
}

function diagnose_frac(array $p, array $f, array $answer): string
{
    [$gn, $gd] = $f;
    [$n, $d] = $answer;
    switch ($p['op']) {
        case 'k':
            [$on, $od] = $p['a'];
            if ($gn * $od === $on * $gd) {
                return 'Hodnota sedí, ale ještě to jde zkrátit.';
            }
            if ($gd === $d || $gn === $n) {
                return 'Čitatel i jmenovatel musíš dělit stejným číslem.';
            }
            return '';
        case '*':
            [$a, $b] = $p['a'];
            [$c, $d2] = $p['b'];
            if ($gn * ($b * $c) === ($a * $d2) * $gd) {
                return 'Převrátil jsi zlomek, ale tady se násobí, ne dělí.';
            }
            if ($gd === $b * $d2 || $gd === $d) {
                return 'Jmenovatel sedí, chyba je v čitateli.';
            }
            return '';
        case '/':
            [$a, $b] = $p['a'];
            [$c, $d2] = $p['b'];
            if ($gn * ($b * $d2) === ($a * $c) * $gd) {
                return 'Vynásobil jsi zlomky rovnou. Při dělení se druhý zlomek nejdřív převrátí.';
            }
            if ($gn * ($a * $d2) === ($b * $c) * $gd) {
                return 'Převrátil jsi první zlomek místo druhého.';
            }
            return '';
        default:
            [$a, $b] = $p['a'];
            [$c, $d2] = $p['b'];
            if ($gd === $b + $d2 && $b !== $d2) {
                return 'Jmenovatele se nesčítají. Nejdřív převeď zlomky na společný jmenovatel.';
            }
            if ($b === $d2 && $gd === 2 * $b) {
                return 'Při stejných jmenovatelích jmenovatel zůstává, nesčítá se.';
            }
            $other = $p['op'] === '+' ? $a * $d2 - $c * $b : $a * $d2 + $c * $b;
            if ($gn * ($b * $d2) === $other * $gd) {
                return $p['op'] === '+' ? 'Odečetl jsi, ale má se sčítat.' : 'Sečetl jsi, ale má se odčítat.';
            }
            if ($gd === $d || $gd === $b * $d2 || $gd === lcm($b, $d2)) {
                return 'Jmenovatel sedí, chyba je v čitateli. Zkontroluj, čím jsi rozšiřoval.';
            }
            return '';
    }
}

// ---------- dělení se zbytkem ----------

function division_steps(int $dividend, int $divisor): array
{
    $digits = str_split((string) $dividend);
    $lines = [];
    $cur = 0;
    $i = 0;
    // první skupina číslic, do které se dělitel vejde
    while ($i < count($digits) && $cur * 10 + (int) $digits[$i] < $divisor) {
        $cur = $cur * 10 + (int) $digits[$i];
        $i++;
    }
    $quotient = '';
    for (; $i < count($digits); $i++) {
        $cur = $cur * 10 + (int) $digits[$i];
        $q = intdiv($cur, $divisor);
        $r = $cur % $divisor;
        $quotient .= $q;
        $line = "$cur : $divisor = $q, zbude $r";
        if ($i + 1 < count($digits)) {
            $line .= ', sepíšu ' . $digits[$i + 1];
        }
        $lines[] = $line . '.';
        $cur = $r;
    }
    $lines[] = 'Podíl ' . fmt_num((int) $quotient) . ', zbytek ' . $cur . '. Zkouška: ' . fmt_num((int) $quotient) . " · $divisor + $cur = " . fmt_num($dividend) . '.';
    return $lines;
}

function first_chunk(int $dividend, int $divisor): int
{
    $cur = 0;
    foreach (str_split((string) $dividend) as $dg) {
        $cur = $cur * 10 + (int) $dg;
        if ($cur >= $divisor) {
            return $cur;
        }
    }
    return $cur;
}

function hint_div(array $p): string
{
    $chunk = first_chunk($p['a'], $p['b']);
    return "Začni zleva: kolikrát se {$p['b']} vejde do $chunk? Zbytek připiš před další číslici a pokračuj.";
}

function diagnose_div(array $p, ?int $gq, ?int $gr, array $answer): string
{
    [$q, $r] = $answer;
    ['a' => $dividend, 'b' => $divisor] = $p;
    if ($gq === null || $gr === null) {
        return '';
    }
    if ($gr >= $divisor) {
        return "Zbytek $gr je větší nebo stejný jako dělitel $divisor, ještě se tam vejde.";
    }
    if ($gq === $q) {
        return 'Podíl máš dobře, jen zbytek ne.';
    }
    if ($gr === $r) {
        return 'Zbytek sedí, chyba je v podílu.';
    }
    if (strlen((string) $gq) !== strlen((string) $q)) {
        return 'Podíl má mít ' . strlen((string) $q) . ' číslice. Když se dělitel nevejde, do podílu patří nula.';
    }
    if (abs($gq - $q) === 1) {
        return 'Podíl je o jedna vedle, zkontroluj poslední krok.';
    }
    return 'Zkouška: ' . fmt_num($gq) . " · $divisor + $gr = " . fmt_num($gq * $divisor + $gr) . ', ale má vyjít ' . fmt_num($dividend) . '.';
}

// ---------- rozhraní ----------

function hint(array $ex): string
{
    $p = $ex['p'] ?? null;
    if (!$p) {
        return '';
    }
    if ($ex['kind'] === 'divrem') {
        return hint_div($p);
    }
    if ($ex['kind'] === 'frac') {
        return hint_frac($p);
    }
    return in_array($p['op'], ['x', 'd'], true) ? hint_mul($p) : hint_add($p);
}

function explain(array $ex): array
{
    $p = $ex['p'] ?? null;
    if (!$p) {
        return [];
    }
    if ($ex['kind'] === 'divrem') {
        return division_steps($p['a'], $p['b']);
    }
    if ($ex['kind'] === 'frac') {
        return explain_frac($p, $ex['a']);
    }
    return in_array($p['op'], ['x', 'd'], true) ? explain_mul($p) : explain_add($p);
}

function diagnose(array $ex, $given): string
{
    $p = $ex['p'] ?? null;
    if (!$p) {
        return '';
    }
    if ($ex['kind'] === 'divrem') {
        $gq = parse_num((string) ($given['q'] ?? ''));
        $gr = parse_num((string) ($given['r'] ?? ''));
        return diagnose_div($p, $gq === null ? null : (int) $gq, $gr === null ? null : (int) $gr, $ex['a']);
    }
    if ($ex['kind'] === 'frac') {
        $f = parse_frac((string) $given);
        return $f ? diagnose_frac($p, $f, $ex['a']) : '';
    }
    $g = parse_num((string) $given);
    if ($g === null) {
        return '';
    }
    return in_array($p['op'], ['x', 'd'], true) ? diagnose_mul($p, $g) : diagnose_add($p, $g);
}
