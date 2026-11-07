<?php
// Trojčlenka: slovní úlohy na přímou a nepřímou úměrnost. Generátor, nápověda
// po krocích, postup a rozbor chyb. Načítá se z generators.php, do nápovědy,
// postupu a rozboru se napojuje přes společné rozhraní v more.php (op 'troj').
//
// Šablony zadání:
//   {x}           – číslo (x je a, b, c, t, v, k, ans, bc)
//   {x:1|2–4|5+}  – číslo a za ním podstatné jméno ve správném tvaru (3 sešity, 5 sešitů)
//   [x:1|2–4|5+]  – jen slovo ve tvaru podle čísla x (udělá / udělají / udělá)

// Přímá úměrnost: z {a} je {b}, kolik je z {c}? Výsledek = b · c / a.
// v – jednotková hodnota (b / a) na lehké a střední: [od, do, krok], max – nejvyšší a i c.
const TROJ_PRIMA_CTX = [
    'sesity' => [
        'q' => '{a:sešit|sešity|sešitů} stojí {b} Kč. Kolik Kč stojí {c:sešit|sešity|sešitů}?',
        'unit' => 'Kč', 'v' => [8, 25, 1],
        'why' => 'Za víc sešitů zaplatíš víc korun',
        'one' => 'Zjisti, kolik stojí 1 sešit.', 'r1' => '1 sešit stojí {b} : {a} = {v} Kč',
        'two' => 'Vynásob počtem sešitů.', 'r2' => '{c:sešit|sešity|sešitů} stojí {c} · {v} = {ans} Kč',
        'per1' => 'Tohle stojí 1 sešit.',
    ],
    'auto' => [
        'q' => 'Auto ujede za {a} h {b} km. Kolik km ujede stejnou rychlostí za {c} h?',
        'unit' => 'km', 'v' => [40, 90, 10], 'max' => 10,   // nejvýš 10 h jízdy
        'why' => 'Za delší dobu ujede auto víc kilometrů',
        'one' => 'Zjisti, kolik km ujede za 1 h.', 'r1' => 'Za 1 h ujede {b} : {a} = {v} km',
        'two' => 'Vynásob počtem hodin.', 'r2' => 'Za {c} h ujede {c} · {v} = {ans} km',
        'per1' => 'Tolik ujede auto za 1 h.',
    ],
    'palacinky' => [
        'q' => 'Na {a:palačinku|palačinky|palačinek} je potřeba {b} g mouky. Kolik gramů mouky je potřeba na {c:palačinku|palačinky|palačinek}?',
        'unit' => 'g', 'v' => [20, 50, 5],
        'why' => 'Na víc palačinek je potřeba víc mouky',
        'one' => 'Zjisti, kolik mouky je potřeba na 1 palačinku.', 'r1' => 'Na 1 palačinku je potřeba {b} : {a} = {v} g',
        'two' => 'Vynásob počtem palačinek.', 'r2' => 'Na {c:palačinku|palačinky|palačinek} je potřeba {c} · {v} = {ans} g',
        'per1' => 'Tolik mouky je potřeba na 1 palačinku.',
    ],
    'kohoutek' => [
        'q' => 'Z kohoutku nateče za {a} min {b} l vody. Kolik litrů vody nateče za {c} min?',
        'unit' => 'l', 'v' => [2, 12, 1],
        'why' => 'Za delší dobu nateče víc vody',
        'one' => 'Zjisti, kolik litrů nateče za 1 min.', 'r1' => 'Za 1 min nateče {b} : {a} = {v} l',
        'two' => 'Vynásob počtem minut.', 'r2' => 'Za {c} min nateče {c} · {v} = {ans} l',
        'per1' => 'Tolik vody nateče za 1 min.',
    ],
    'tiskarna' => [
        'q' => 'Tiskárna vytiskne za {a} min {b:stranu|strany|stran}. Kolik stran vytiskne za {c} min?',
        'unit' => null, 'v' => [5, 30, 1],
        'why' => 'Za delší dobu vytiskne tiskárna víc stran',
        'one' => 'Zjisti, kolik stran vytiskne za 1 min.', 'r1' => 'Za 1 min vytiskne {b} : {a} = {v:stranu|strany|stran}',
        'two' => 'Vynásob počtem minut.', 'r2' => 'Za {c} min vytiskne {c} · {v} = {ans:stranu|strany|stran}',
        'per1' => 'Tolik stran vytiskne tiskárna za 1 min.',
    ],
];

// Nepřímá úměrnost: {a} to zvládne za {t}, za kolik {c}? Výsledek = a · t / c.
// speed – a a c jsou rychlosti v km/h (jinak počty), tmul – násobek t (koruny po desetikorunách).
const TROJ_NEPRIMA_CTX = [
    'delnici' => [
        'q' => '{a:dělník|dělníci|dělníků} [a:udělá|udělají|udělá] práci za {t} h. Za kolik hodin ji [c:udělá|udělají|udělá] {c:dělník|dělníci|dělníků}?',
        'unit' => 'h', 'speed' => false, 'tmul' => 1,
        'why' => 'Víc dělníků udělá práci rychleji',
        'one' => 'Zjisti, jak dlouho by práce trvala jednomu dělníkovi.', 'r1' => '1 dělník by ji dělal {a} · {t} = {k} h',
        'two' => 'Vyděl počtem dělníků.', 'r2' => '{c:dělník|dělníci|dělníků} [c:ji udělá|ji udělají|ji udělá] za {k} : {c} = {ans} h',
        'per1' => 'Tak dlouho by práce trvala jednomu dělníkovi.',
    ],
    'cerpadla' => [
        'q' => '{a:čerpadlo|čerpadla|čerpadel} [a:vyčerpá|vyčerpají|vyčerpá] bazén za {t} h. Za kolik hodin ho [c:vyčerpá|vyčerpají|vyčerpá] {c:čerpadlo|čerpadla|čerpadel}?',
        'unit' => 'h', 'speed' => false, 'tmul' => 1,
        'why' => 'Víc čerpadel vyčerpá bazén rychleji',
        'one' => 'Zjisti, jak dlouho by bazén čerpalo jedno čerpadlo.', 'r1' => '1 čerpadlo by ho čerpalo {a} · {t} = {k} h',
        'two' => 'Vyděl počtem čerpadel.', 'r2' => '{c:čerpadlo|čerpadla|čerpadel} [c:ho vyčerpá|ho vyčerpají|ho vyčerpá] za {k} : {c} = {ans} h',
        'per1' => 'Tak dlouho by bazén čerpalo jedno čerpadlo.',
    ],
    'rychlost' => [
        'q' => 'Při rychlosti {a} km/h trvá cesta {t} h. Kolik hodin potrvá při rychlosti {c} km/h?',
        'unit' => 'h', 'speed' => true, 'tmul' => 1,
        'why' => 'Při vyšší rychlosti trvá cesta kratší dobu',
        'one' => 'Spočítej, jak dlouhá je cesta: rychlost krát čas.', 'r1' => 'Cesta měří {a} · {t} = {k} km',
        'two' => 'Vyděl délku cesty novou rychlostí.', 'r2' => 'Při rychlosti {c} km/h potrvá {k} : {c} = {ans} h',
        'per1' => 'Tohle je délka cesty v kilometrech, ne čas.',
    ],
    'kamaradi' => [
        'q' => 'Když se o výhru rovným dílem podělí {a:kamarád|kamarádi|kamarádů}, dostane každý {t} Kč. Kolik Kč dostane každý, když se podělí {c:kamarád|kamarádi|kamarádů}?',
        'unit' => 'Kč', 'speed' => false, 'tmul' => 10,
        'why' => 'Čím víc kamarádů se dělí, tím méně dostane každý',
        'one' => 'Spočítej, kolik je celá výhra.', 'r1' => 'Výhra je {a} · {t} = {k} Kč',
        'two' => 'Vyděl ji počtem kamarádů.', 'r2' => 'Při dělení na {c:díl|díly|dílů} dostane každý {k} : {c} = {ans} Kč',
        'per1' => 'Tohle je celá výhra, ne díl pro jednoho.',
    ],
];

// a, c – počty (přímá: první a druhý počet); frac – jednotková hodnota nemusí být celá
// (počítá se zlomkem b · c/a), výsledek je ale vždy celý.
const TROJ_PRIMA = [
    'lehke'   => ['a' => [2, 5], 'c' => [2, 10], 'frac' => false],
    'stredni' => ['a' => [2, 10], 'c' => [2, 20], 'frac' => false],
    'tezke'   => ['a' => [3, 12], 'c' => [2, 24], 'frac' => true],
];
// n – počty (dělníci, čerpadla, kamarádi), t – výsledek pro první počet,
// speed – rychlosti [od, do, krok] a ts – hodiny cesty.
const TROJ_NEPRIMA = [
    'lehke'   => ['n' => [2, 6], 't' => [2, 12], 'speed' => [20, 100, 10], 'ts' => [2, 6]],
    'stredni' => ['n' => [2, 10], 't' => [2, 24], 'speed' => [20, 120, 10], 'ts' => [2, 8]],
    'tezke'   => ['n' => [2, 12], 't' => [2, 30], 'speed' => [15, 130, 5], 'ts' => [2, 10]],
];

// Tvar podle čísla: 1 sešit, 2–4 sešity, 5 sešitů (desetinné číslo: 2,5 strany).
function troj_form(float $n, array $forms): string
{
    if ($n != (int) $n) {
        return $forms[1];
    }
    $n = (int) $n;
    return $n === 1 ? $forms[0] : ($n >= 2 && $n <= 4 ? $forms[1] : $forms[2]);
}

// Mezi číslem a jednotkou nebo podstatným jménem je nezlomitelná mezera (ať se „22 h“ nerozdělí na dva řádky).
function troj_fill(string $tpl, array $vals): string
{
    $s = preg_replace_callback('/\{(\w+):([^}]+)\}/u', fn($m) => fmt_num($vals[$m[1]]) . "\u{a0}" . troj_form((float) $vals[$m[1]], explode('|', $m[2])), $tpl);
    $s = preg_replace_callback('/\[(\w+):([^\]]+)\]/u', fn($m) => troj_form((float) $vals[$m[1]], explode('|', $m[2])), $s);
    $s = preg_replace_callback('/\{(\w+)\}/u', fn($m) => fmt_num($vals[$m[1]]), $s);
    return preg_replace('/(\d) (h|min|km\/h|km|Kč|g|l)\b/u', "$1\u{a0}$2", $s);
}

function troj_ucfirst(string $s): string
{
    return mb_strtoupper(mb_substr($s, 0, 1)) . mb_substr($s, 1);
}

function troj_lcfirst(string $s): string
{
    return mb_strtolower(mb_substr($s, 0, 1)) . mb_substr($s, 1);
}

function troj_step(array $r): int
{
    return rand(0, intdiv($r[1] - $r[0], $r[2])) * $r[2] + $r[0];
}

function gen_trojclenka(string $level, string $diff): array
{
    $form = $level === 'mix' ? pick(['prima', 'neprima']) : $level;
    for ($try = 0; $try < 1000; $try++) {
        if ($form === 'prima') {
            $cfg = TROJ_PRIMA[$diff];
            $key = array_rand(TROJ_PRIMA_CTX);
            $ctx = TROJ_PRIMA_CTX[$key];
            $a = rand($cfg['a'][0], $cfg['a'][1]);
            $c = rand($cfg['c'][0], $cfg['c'][1]);
            if ($c === $a || max($a, $c) > ($ctx['max'] ?? PHP_INT_MAX)) {
                continue;
            }
            if ($cfg['frac']) {
                // jednotková hodnota není celá (4,5 Kč za kus), výsledek ano
                $b = rand($ctx['v'][0] * $a, $ctx['v'][1] * $a);
                if ($b % $a === 0 || ($b * $c) % $a !== 0) {
                    continue;
                }
            } else {
                $b = troj_step($ctx['v']) * $a;
            }
            $ans = intdiv($b * $c, $a);
            $vals = ['a' => $a, 'b' => $b, 'c' => $c];
            $p = ['op' => 'troj', 'form' => 'prima', 'ctx' => $key, 'a' => $a, 'b' => $b, 'c' => $c, 'unit' => $ctx['unit']];
        } else {
            $cfg = TROJ_NEPRIMA[$diff];
            $key = array_rand(TROJ_NEPRIMA_CTX);
            $ctx = TROJ_NEPRIMA_CTX[$key];
            if ($ctx['speed']) {
                $a = troj_step($cfg['speed']);
                $c = troj_step($cfg['speed']);
                $t = rand($cfg['ts'][0], $cfg['ts'][1]);
            } else {
                $a = rand($cfg['n'][0], $cfg['n'][1]);
                $c = rand($cfg['n'][0], $cfg['n'][1]);
                $t = rand($cfg['t'][0], $cfg['t'][1]) * $ctx['tmul'];
            }
            if ($c === $a || ($a * $t) % $c !== 0) {
                continue;
            }
            $ans = intdiv($a * $t, $c);
            $vals = ['a' => $a, 't' => $t, 'c' => $c];
            $p = ['op' => 'troj', 'form' => 'neprima', 'ctx' => $key, 'a' => $a, 't' => $t, 'c' => $c, 'unit' => $ctx['unit']];
        }
        return ['q' => troj_fill($ctx['q'], $vals), 'kind' => 'num', 'a' => $ans, 'p' => $p];
    }
    throw new RuntimeException("trojclenka/$level/$diff");
}

// Kroky [pokyn, výsledek]: nejdřív jaká je to úměrnost, pak přes jednotku
// (kolik je to pro jeden). U necelé jednotkové hodnoty přes „kolikrát víc / míň“,
// a když počty nejsou násobky, zlomkem.
function troj_steps(array $q, int $ans): array
{
    ['a' => $a, 'c' => $c] = $q;
    $unit = $q['unit'] ? "\u{a0}" . $q['unit'] : '';
    if ($q['form'] === 'prima') {
        $ctx = TROJ_PRIMA_CTX[$q['ctx']];
        $b = $q['b'];
        $first = [$ctx['why'] . ' – je to přímá úměrnost: kolikrát víc, tolikrát víc.', ''];
        if ($b % $a !== 0 && $c % $a === 0) {
            $k = intdiv($c, $a);   // 3 → 6 sešitů: dvakrát víc
            return [$first,
                    ['Zjisti, kolikrát je nový počet větší.', "$c : $a = $k"],
                    ["Výsledek bude taky {$k}krát větší: vynásob.", fmt_num($b) . " · $k = " . fmt_num($ans) . $unit]];
        }
        if ($b % $a !== 0 && $a % $c === 0) {
            $k = intdiv($a, $c);   // 6 → 2 sešity: třikrát míň
            return [$first,
                    ['Zjisti, kolikrát je nový počet menší.', "$a : $c = $k"],
                    ["Výsledek bude taky {$k}krát menší: vyděl.", fmt_num($b) . " : $k = " . fmt_num($ans) . $unit]];
        }
        if ($b % $a !== 0) {
            return [$first,
                    ['Na jeden to nevyjde celé číslo, proto počítej zlomkem: vynásob ' . fmt_num($c) . ' a vyděl ' . fmt_num($a) . '.', "x\u{a0}= " . fmt_num($b) . " · $c/$a"],
                    ['Nejdřív vynásob, pak vyděl.', fmt_num($b) . " · $c = " . fmt_num($b * $c) . ', ' . fmt_num($b * $c) . " : $a = " . fmt_num($ans) . $unit]];
        }
        $vals = ['a' => $a, 'b' => $b, 'c' => $c, 'v' => intdiv($b, $a), 'ans' => $ans];
    } else {
        $ctx = TROJ_NEPRIMA_CTX[$q['ctx']];
        $first = [$ctx['why'] . ' – je to nepřímá úměrnost: kolikrát víc, tolikrát míň.', ''];
        $vals = ['a' => $a, 't' => $q['t'], 'c' => $c, 'k' => $a * $q['t'], 'ans' => $ans];
    }
    return [$first,
            [$ctx['one'], troj_ucfirst(troj_fill($ctx['r1'], $vals))],
            [$ctx['two'], troj_ucfirst(troj_fill($ctx['r2'], $vals))]];
}

function diagnose_troj(array $q, float $g): string
{
    ['a' => $a, 'c' => $c] = $q;
    $eq = fn($v) => abs($g - $v) < 0.001;
    if ($q['form'] === 'prima') {
        $ctx = TROJ_PRIMA_CTX[$q['ctx']];
        $b = $q['b'];
        if ($eq($b * $a / $c)) {
            return 'Tohle by vyšlo u nepřímé úměrnosti. Tady je to přímá úměrnost: ' . troj_lcfirst($ctx['why']) . '.';
        }
        if ($eq($b / $a)) {
            return $ctx['per1'] . ' Ještě vynásob ' . fmt_num($c) . '.';
        }
        if ($eq($b * $c)) {
            return 'Ještě vyděl ' . fmt_num($a) . '. Vynásobit ' . fmt_num($b) . ' · ' . fmt_num($c) . ' je správný začátek.';
        }
        if ($eq($b + $c - $a)) {
            return 'U úměrnosti se rozdíl nepřičítá. Zjisti, kolik je to pro jeden, a pak vynásob.';
        }
        return '';
    }
    $ctx = TROJ_NEPRIMA_CTX[$q['ctx']];
    $t = $q['t'];
    if ($eq($t * $c / $a)) {
        return 'Tohle by vyšlo u přímé úměrnosti. Tady je to nepřímá úměrnost: ' . troj_lcfirst($ctx['why']) . '.';
    }
    if ($eq($a * $t)) {
        return $ctx['per1'] . ' Ještě vyděl ' . fmt_num($c) . '.';
    }
    return '';
}
