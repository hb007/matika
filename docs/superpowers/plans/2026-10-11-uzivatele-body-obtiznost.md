# Uživatelé, body a obtížnost: implementační plán

> **Pro agenty:** povinný pomocný skill je superpowers:subagent-driven-development (doporučeno) nebo superpowers:executing-plans. Kroky používají zaškrtávací syntaxi (`* [ ]`).

**Cíl:** Vrátit do Matiky dva uživatele (holka a kluk, bez hesla) se sbíráním bodů a porovnáním. Přidat obtížnost lehké / střední / těžké s barevným odlišením, opakování chybných příkladů, denní cíl se sérií dní, sérii správně v řadě a přehled pro rodiče.

**Architektura:** Server (PHP) generuje a kontroluje příklady a nově ukládá výsledky do SQLite v `data/`. Herní pravidla (body, série, opakování) jsou čisté funkce v `lib/game.php`, testované skriptem `tests/run.php` nad SQLite v paměti. `api.php` je tenká vrstva nad nimi. Rozpracovaný příklad drží PHP session, uživatele cookie `matika_user`. Klient (`app.js`) přepíná uživatele v horním řádku a obtížnost obarví celou obrazovku příkladu.

**Technologie:** PHP 8.1+, PDO SQLite, čisté JS a CSS bez knihoven a bez buildu, Playwright na ruční ověření.

**Spec:** návrh odsouhlasený v konverzaci 2026-10-11, shrnutý v sekci Design níže (rozsah bounded, samostatný spec soubor se nepíše).

## Design

* **Uživatelé:** pevně dva, 👧 holka (id 1) a 👦 kluk (id 2). Přezdívku jde přepsat (1 až 20 znaků) a ukládá se jen do databáze, ne do gitu. Výchozí přezdívky jsou „Holka“ a „Kluk“. Kdo cvičí, se pamatuje v cookie `matika_user` (365 dní). Bez vybraného uživatele se ukáže obrazovka „Kdo dnes cvičí?“.
* **Horní řádek:** logo „Matika“, dva čipy dětí (emoji, přezdívka, body za dnešek, u aktivního dítěte proužek postupu k dennímu cíli a 🔥 série dní) a odkaz „Výsledky“. Klik na čip přepne uživatele.
* **Obtížnost:** Lehké / Střední / Těžké na obrazovce příkladu, ne v hlavním menu. Hlavní menu ukazuje jen názvy úloh, bez popisků rozsahů, a klik vede rovnou na příklad (obrazovka výběru úrovně zaniká). Každé dítě má po úlohách zapamatovanou úroveň a obtížnost (localStorage). Výchozí je první úroveň a obtížnost Střední.
* **Barvy obtížnosti:** na obrazovce příkladu má `<body>` atribut `data-diff`. Lehké = zelená, Střední = modrá, Těžké = červenooranžová. Barva se promítne do akcentu (záložky, tlačítka, rámečky), do pozadí horního řádku, do silného spodního pruhu horního řádku a do `meta theme-color` (stavový řádek na mobilu). Tlačítko zvolené obtížnosti je vyplněné svou barvou.
* **Rozsahy:**

| Úloha (úrovně) | Lehké | Střední | Těžké |
|---|---|---|---|
| Malá násobilka (násobení, dělení, obojí) | 2–5 × 2–5 | 2–10 × 2–10 | 6–9 × 6–9 |
| Velká násobilka (násobení, dělení, obojí) | 11–15 × 2–5 | 11–20 × 2–10 | 11–20 × 11–20 |
| Sčítání a odčítání: celá čísla | do 100 | do 1 000 | do 10 000 |
| Sčítání a odčítání: záporná | ±20 | ±50 | ±500 |
| Sčítání a odčítání: desetinná | 1 místo, 1,0–9,9 | 1 místo, 1,0–99,9 | 2 místa, 1,00–99,99 |
| Zlomky: krácení | jmenovatel do 6, krátí se 2–3 | do 12, 2–6 | do 15, 2–9 |
| Zlomky: sčítání a odčítání | stejné jmenovatele 2–6 | 2–10, polovina stejné | 2–12, vždy různé |
| Zlomky: násobení a dělení | jmenovatele 2–5 | 2–9 | 2–12 |
| Dělení s ocáskem | 100–999 : 2–9 | 1 000–9 999 : 2–9 | 1 000–99 999 : 11–99 |
| Náhodný mix | vše lehké | vše střední | vše těžké |

* Odchylka od tabulky v konverzaci: u těžkých zlomků nejsou smíšená čísla v zadání, protože vysvětlení po krocích (`explain_frac`) s nimi nepočítá. Těžké zlomky mají místo toho větší a vždy různé jmenovatele.
* **Body:** správně napoprvé Lehké 1, Střední 2, Těžké 3. Správně po chybném pokusu 1. Po „Ukázat výsledek“ 0. Nápověda body nebere. Nečitelná odpověď (písmena, chybí zbytek) se nepočítá jako pokus.
* **Série správně v řadě:** počítá se napoprvé správně, chyba ji vynuluje. Každých 5 v řadě dá +1 bod. Od 3 v řadě se ukazuje „🔥 N v řadě“.
* **Denní cíl:** 20 vyřešených příkladů za den (ukázaný výsledek se nepočítá). Série dní je počet po sobě jdoucích dnů se splněným cílem, končící dneškem, nebo včerejškem, pokud dnes cíl ještě splněný není. Den a týden (od pondělí) se počítají v čase Europe/Prague.
* **Opakování chyb:** příklad, který dítě napoprvé netrefí (nebo si ukáže výsledek bez pokusu), se zařadí do fronty. Vrátí se v téže úloze, úrovni a obtížnosti po 5 dalších dokončených příkladech, s odznakem „🔁 Tenhle ti minule nešel“. Stejné zadání je ve frontě nejvýš jednou.
* **Výsledky:** porovnání obou dětí (dnes, tento týden, celkem, dnes vyřešeno z 20, série dní) s tlačítkem na přejmenování. Pod tím přehled pro rodiče u každého dítěte: úspěšnost napoprvé podle tématu a obtížnosti a nejčastěji chybované příklady za 30 dní.

## Global Constraints

* PHP 8.1+, bez frameworků, bez nových závislostí, bez buildu.
* Texty v appce česky, s diakritikou.
* Každý text od uživatele (přezdívka) se v HTML vypisuje přes `esc()`.
* Skripty a styly se v `index.php` načítají přes `$v(...)` (verze podle `filemtime`, viz `tasks/lessons.md`).
* Složka `data/` (s `.htaccess` a neprázdným `index.html`) zůstává v repu natrvalo. Databáze je `data/matika-v2.sqlite`; nový název, aby nekolidoval se starým schématem.
* Animace respektují `prefers-reduced-motion`.
* Komentáře v kódu česky, jen tam, kde kód sám neřekne proč.

## Review Focus

* Opakované odeslání správné odpovědi (dvojklik, dvakrát Enter, zopakovaný požadavek) nesmí přičíst body dvakrát. Server odpoví 409 „Příklad už je hotový.“ Test v úkolu 2.
* Nečitelná odpověď („abc“, prázdný zbytek, pole místo textu) nesmí spotřebovat pokus: dítě nepřijde o body za první pokus a příklad se nezařadí do opakování. Test v úkolu 2.
* Přezdívka s HTML, prázdná, jen z mezer nebo delší než 20 znaků se odmítne se zprávou. Povolená přezdívka s `<` se vypíše jako text. Test v úkolu 2, ověření v úkolu 5.
* Přepnutí uživatele uprostřed příkladu: body za rozpracovaný příklad nesmí dostat druhé dítě. `switch` zahodí příklad v session a další `answer` vrátí 404. Ověření curlem v úkolu 3.
* Session ze staré verze (v `$_SESSION['ex']` je přímo příklad, bez klíče `ex`) po nasazení nesmí shodit `answer`. Vrátí 404 „Příklad vypršel“. Ověření curlem v úkolu 3.

## Soubory

* Vytvořit: `lib/db.php` (připojení, schéma, dva uživatelé), `lib/game.php` (pravidla a dotazy), `tests/run.php` (spouštěč), `tests/test_generators.php`, `tests/test_game.php`, `data/.htaccess`, `data/index.html`.
* Upravit: `lib/generators.php` (obtížnost, nové úrovně), `lib/explain.php` (desetinná na 1 i 2 místa), `api.php`, `index.php`, `app.js`, `style.css`, `.github/workflows/deploy.yml`, `README.md`, `docs/rozhodnuti.md`, `tasks/todo.md`.

### Task 1: Obtížnost v generátorech a testovací kostra

**Files:**

* Create: `tests/run.php`, `tests/test_generators.php`
* Modify: `lib/generators.php` (MODULES, generate_exercise, gen_*), `lib/explain.php` (`explain_add`, `steps_add` u desetinných)

**Interfaces:**

* Produces: `const DIFFICULTIES = ['lehke' => 'Lehké', 'stredni' => 'Střední', 'tezke' => 'Těžké']`, `generate_exercise(string $module, string $level, string $diff): array` (vyhodí `InvalidArgumentException` při neznámém vstupu, vrací příklad s klíčem `m` = skutečné téma), nové klíče úrovní: `scitani` → `cela|zaporna|desetinna`, `deleni` → `zbytek`, `mix` → `vse`, `velka` bez `tezka`. Desetinné příklady mají `p['dp']` (1 nebo 2).

* [ ] **Step 1: Spouštěč testů**

```php
<?php
// Testy bez frameworku: php tests/run.php. Při selhání skončí kódem 1.
declare(strict_types=1);
date_default_timezone_set('Europe/Prague');
foreach (glob(__DIR__ . '/../lib/*.php') as $f) {
    require_once $f;
}

$failed = 0;
function check(bool $ok, string $what): void
{
    global $failed;
    if (!$ok) {
        $failed++;
        echo "FAIL: $what\n";
    }
}

foreach (glob(__DIR__ . '/test_*.php') as $f) {
    require $f;
}
echo $failed ? "$failed selhalo\n" : "OK\n";
exit($failed ? 1 : 0);
```

* [ ] **Step 2: Testy generátorů (musí selhat)**

`tests/test_generators.php`:

```php
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
```

* [ ] **Step 3: Spustit, ověřit selhání**

Run: `php tests/run.php`
Expected: chyba `ArgumentCountError` nebo `FAIL` (generate_exercise zatím bere 2 argumenty, chybí `DIFFICULTIES`).

* [ ] **Step 4: Implementace v `lib/generators.php`**

Nahradit `MODULES`, `MIX_POOLS`, `gen_mala`, `gen_velka`, `gen_scitani`, `gen_zlomky`, `gen_deleni` a `generate_exercise`:

```php
const MODULES = [
    'mala'    => ['title' => 'Malá násobilka',     'levels' => ['nasobeni' => 'Násobení', 'deleni' => 'Dělení', 'mix' => 'Obojí']],
    'velka'   => ['title' => 'Velká násobilka',    'levels' => ['nasobeni' => 'Násobení', 'deleni' => 'Dělení', 'mix' => 'Obojí']],
    'scitani' => ['title' => 'Sčítání a odčítání', 'levels' => ['cela' => 'Celá čísla', 'zaporna' => 'Záporná čísla', 'desetinna' => 'Desetinná čísla']],
    'zlomky'  => ['title' => 'Zlomky',             'levels' => ['kraceni' => 'Krácení', 'scitani' => 'Sčítání a odčítání', 'nasobeni' => 'Násobení a dělení', 'mix' => 'Všechno']],
    'deleni'  => ['title' => 'Dělení s ocáskem',   'levels' => ['zbytek' => 'Se zbytkem']],
    'mix'     => ['title' => 'Náhodný mix',        'levels' => ['vse' => 'Všechno']],
];

const DIFFICULTIES = ['lehke' => 'Lehké', 'stredni' => 'Střední', 'tezke' => 'Těžké'];

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
    if (!isset(MODULES[$module]['levels'][$level]) || !isset(DIFFICULTIES[$diff])) {
        throw new InvalidArgumentException('Neznámá úloha, úroveň nebo obtížnost');
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
    return $ex;
}
```

* [ ] **Step 5: Desetinná na 1 i 2 místa v `lib/explain.php`**

V `explain_add` nahradit větev `desetinna`:

```php
    if ($p['lvl'] === 'desetinna') {
        $dp = $p['dp'] ?? 1;
        $f = 10 ** $dp;
        $ai = (int) round($a * $f);
        $bi = (int) round($b * $f);
        $ri = $op === '+' ? $ai + $bi : $ai - $bi;
        $mista = $dp === 1 ? 'jedno desetinné místo' : 'dvě desetinná místa';
        return ["Obě čísla napíšu na $mista: " . number_format($a, $dp, ',', ' ') . ' a ' . number_format($b, $dp, ',', ' ') . '.',
                'Počítám bez čárky: ' . fmt_num($ai) . ($op === '+' ? ' + ' : ' − ') . fmt_num($bi) . ' = ' . fmt_num($ri) . '.',
                "Vrátím čárku ($mista): " . fmt_num(round($res, $dp)) . '.'];
    }
```

V `steps_add` nahradit větev `desetinna`:

```php
    if ($p['lvl'] === 'desetinna') {
        $dp = $p['dp'] ?? 1;
        $f = 10 ** $dp;
        $ai = (int) round($a * $f);
        $bi = (int) round($b * $f);
        return ['Napiš čísla pod sebe tak, aby byla čárka pod čárkou.',
                'Počítej, jako by tam čárka nebyla: ' . fmt_num($ai) . " $sym " . fmt_num($bi) . '.',
                'Na konci vrať čárku: ve výsledku ' . ($dp === 1 ? 'je jedno desetinné místo.' : 'jsou dvě desetinná místa.')];
    }
```

* [ ] **Step 6: Spustit testy**

Run: `php tests/run.php`
Expected: `OK`

* [ ] **Step 7: Commit**

```bash
git add tests/ lib/generators.php lib/explain.php
git commit -m "Obtížnost lehké, střední, těžké v generátorech a testy"
```

### Task 2: Databáze a herní pravidla

**Files:**

* Create: `lib/db.php`, `lib/game.php`, `tests/test_game.php`

**Interfaces:**

* Consumes: `generate_exercise`, `check_answer`, `answer_str`, `explain`, `diagnose`, `parse_num`, `parse_frac` z `lib/generators.php` a `lib/explain.php`.
* Produces:
  * `db(): PDO` (soubor `data/matika-v2.sqlite`), `db_open(string $dsn): PDO`
  * konstanty `DIFF_POINTS`, `GOAL = 20`, `STREAK_BONUS = 5`, `REVIEW_AFTER = 5`
  * `base_points(string $diff, int $tries): int`, `streak_bonus(int $streak): int`, `week_start(string $day): string`, `day_streak(array $goalDays, string $today): int`
  * `next_exercise(PDO $db, int $uid, string $module, string $level, string $diff): array` vrací `$cur = ['ex' => array, 'task' => "m|l|d", 'diff' => string, 'tries' => 0, 'done' => false, 'review' => bool]`
  * `handle_answer(PDO $db, array &$cur, int $uid, mixed $given, string $today): array` vrací `['correct' => false, 'note' => string, 'why' => string]` nebo `['correct' => true, 'note' => string, 'points' => int, 'bonus' => int, 'streak' => int]`; u hotového příkladu vyhodí `DomainException`
  * `handle_reveal(PDO $db, array &$cur, int $uid, string $today): array` vrací `['answer' => string, 'steps' => array]`
  * `users_state(PDO $db, string $today): array` seznam `['id', 'kind', 'name', 'streak', 'days', 'today', 'week', 'total', 'solved_today']` (vše int kromě kind a name)
  * `user_stats(PDO $db, int $uid, string $today): array` vrací `['per_task' => [['module', 'difficulty', 'n', 'first']], 'hardest' => [['question', 'answer', 'n']]]`
  * `rename_user(PDO $db, int $uid, string $name): void` (vyhodí `InvalidArgumentException`), `user_exists(PDO $db, int $uid): bool`

* [ ] **Step 1: Testy (musí selhat)**

`tests/test_game.php`:

```php
<?php
// Body, série, týden, opakování a ochrana proti dvojímu započtení.
check(base_points('lehke', 1) === 1 && base_points('stredni', 1) === 2 && base_points('tezke', 1) === 3, 'body napoprve');
check(base_points('tezke', 2) === 1 && base_points('lehke', 5) === 1, 'body po chybe');
check(streak_bonus(5) === 1 && streak_bonus(10) === 1 && streak_bonus(4) === 0 && streak_bonus(0) === 0, 'bonus za serii');
check(week_start('2026-10-11') === '2026-10-05', 'nedele patri k tydnu od pondeli');
check(week_start('2026-10-12') === '2026-10-12', 'pondeli je zacatek tydne');
check(day_streak(['2026-10-09', '2026-10-10', '2026-10-11'], '2026-10-11') === 3, 'serie dni vcetne dneska');
check(day_streak(['2026-10-09', '2026-10-10'], '2026-10-11') === 2, 'dnes jeste nesplneno: serie konci vcera');
check(day_streak(['2026-10-08', '2026-10-10'], '2026-10-11') === 1, 'mezera serii prerusi');
check(day_streak([], '2026-10-11') === 0, 'bez splnenych dnu');
check(day_streak(['2026-03-28', '2026-03-29'], '2026-03-29') === 2, 'prechod na letni cas');

$db = db_open('sqlite::memory:');
$today = '2026-10-11';
check(count(users_state($db, $today)) === 2, 'dva uzivatele');
check(user_exists($db, 1) && user_exists($db, 2) && !user_exists($db, 3), 'user_exists');

// správně napoprvé: plné body, opakované odeslání nic nepřidá
$cur = next_exercise($db, 1, 'mala', 'nasobeni', 'tezke');
$right = answer_str($cur['ex']);
$r = handle_answer($db, $cur, 1, $right, $today);
check($r['correct'] && $r['points'] === 3 && $r['bonus'] === 0 && $r['streak'] === 1, 'napoprve tezke 3 body');
$threw = false;
try {
    handle_answer($db, $cur, 1, $right, $today);
} catch (DomainException $e) {
    $threw = true;
}
check($threw, 'druhe odeslani hotoveho prikladu musi selhat');
check(users_state($db, $today)[0]['today'] === 3, 'body se zapocetly jednou');

// nečitelná odpověď není pokus
$cur = next_exercise($db, 1, 'mala', 'nasobeni', 'stredni');
$r = handle_answer($db, $cur, 1, 'abc', $today);
check(!$r['correct'] && $r['note'] !== '' && $cur['tries'] === 0, 'pismena nejsou pokus');
$r = handle_answer($db, $cur, 1, ['q' => '1'], $today);
check(!$r['correct'] && $cur['tries'] === 0, 'pole misto cisla neni pokus a nespadne');
$r = handle_answer($db, $cur, 1, answer_str($cur['ex']), $today);
check($r['points'] === 2, 'po preklepu porad body za prvni pokus');

// chyba: série se vynuluje, příklad do fronty, správně po chybě 1 bod
$cur = next_exercise($db, 1, 'mala', 'nasobeni', 'lehke');
$wrong = (string) ($cur['ex']['a'] + 1);
$r = handle_answer($db, $cur, 1, $wrong, $today);
check(!$r['correct'] && $cur['tries'] === 1, 'spatne je pokus');
check((int) $db->query('SELECT streak FROM users WHERE id = 1')->fetchColumn() === 0, 'chyba nuluje serii');
handle_answer($db, $cur, 1, $wrong, $today);
check((int) $db->query('SELECT COUNT(*) FROM review')->fetchColumn() === 1, 'chybny priklad je ve fronte jednou');
$r = handle_answer($db, $cur, 1, answer_str($cur['ex']), $today);
check($r['points'] === 1 && $r['streak'] === 0, 'spravne po chybe 1 bod');

// fronta: vrátí se v téže úloze až po REVIEW_AFTER dalších příkladech
$missedQ = $cur['ex']['q'];
$seen = false;
for ($i = 0; $i < REVIEW_AFTER + 1 && !$seen; $i++) {
    $c = next_exercise($db, 1, 'mala', 'nasobeni', 'lehke');
    if ($c['review']) {
        $seen = $c['ex']['q'] === $missedQ;
        check($i >= REVIEW_AFTER - 3, 'opakovani prislo moc brzy');
    }
    handle_answer($db, $c, 1, answer_str($c['ex']), $today);
}
check($seen, 'chybny priklad se vratil');
check(!next_exercise($db, 2, 'mala', 'nasobeni', 'lehke')['review'], 'fronta jednoho ditete neplati pro druhe');

// bonus za 5 v řadě
$db2 = db_open('sqlite::memory:');
$bonuses = 0;
for ($i = 0; $i < 5; $i++) {
    $c = next_exercise($db2, 2, 'mala', 'nasobeni', 'lehke');
    $bonuses += handle_answer($db2, $c, 2, answer_str($c['ex']), $today)['bonus'];
}
check($bonuses === 1, 'paty v rade dava bonus');
check(users_state($db2, $today)[1]['today'] === 6, '5 x 1 bod + 1 bonus');

// ukázání výsledku: 0 bodů, nezapočítá se do denního cíle, podruhé nic nezapíše
$c = next_exercise($db2, 2, 'mala', 'nasobeni', 'lehke');
$r = handle_reveal($db2, $c, 2, $today);
check($r['answer'] === answer_str($c['ex']) && $r['steps'] !== [], 'reveal vrati vysledek a postup');
handle_reveal($db2, $c, 2, $today);
check((int) $db2->query('SELECT COUNT(*) FROM results WHERE solved = 0')->fetchColumn() === 1, 'reveal se zapise jednou');
check(users_state($db2, $today)[1]['solved_today'] === 5, 'ukazany vysledek se nepocita do cile');

// denní cíl a série dní
$db3 = db_open('sqlite::memory:');
foreach (['2026-10-10', '2026-10-11'] as $day) {
    for ($i = 0; $i < GOAL; $i++) {
        $c = next_exercise($db3, 1, 'mala', 'nasobeni', 'lehke');
        handle_answer($db3, $c, 1, answer_str($c['ex']), $day);
    }
}
check(users_state($db3, '2026-10-11')[0]['days'] === 2, 'dva dny se splnenym cilem');

// přezdívky
rename_user($db, 1, '  Ani  čka ');
check(users_state($db, $today)[0]['name'] === 'Ani čka', 'prezdivka orezana');
rename_user($db, 2, '<b>Tom</b>');
check(users_state($db, $today)[1]['name'] === '<b>Tom</b>', 'prezdivka se uklada jako text, escapuje klient');
foreach (['', '   ', str_repeat('x', 21), "\xff\xfe"] as $bad) {
    $threw = false;
    try {
        rename_user($db, 1, $bad);
    } catch (InvalidArgumentException $e) {
        $threw = true;
    }
    check($threw, 'spatna prezdivka musi selhat: ' . bin2hex($bad));
}

// statistiky pro rodiče
$s = user_stats($db, 1, $today);
check($s['per_task'] !== [] && $s['hardest'] !== [], 'statistiky maji data');
```

* [ ] **Step 2: Spustit, ověřit selhání**

Run: `php tests/run.php`
Expected: `Call to undefined function base_points()`

* [ ] **Step 3: `lib/db.php`**

```php
<?php
// SQLite v data/ (složka zůstává v repu, viz tasks/lessons.md). Tabulky
// a oba uživatele založí první požadavek sám.
function db(): PDO
{
    static $pdo = null;
    return $pdo ??= db_open('sqlite:' . __DIR__ . '/../data/matika-v2.sqlite');
}

function db_open(string $dsn): PDO
{
    $pdo = new PDO($dsn, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA busy_timeout = 3000');   // dvě děti na dvou zařízeních najednou
    $pdo->exec('CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY, kind TEXT NOT NULL, name TEXT NOT NULL, streak INTEGER NOT NULL DEFAULT 0)');
    $pdo->exec("INSERT OR IGNORE INTO users (id, kind, name) VALUES (1, 'holka', 'Holka'), (2, 'kluk', 'Kluk')");
    $pdo->exec('CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
        day TEXT NOT NULL, module TEXT NOT NULL, difficulty TEXT NOT NULL,
        question TEXT NOT NULL, answer TEXT NOT NULL,
        tries INTEGER NOT NULL, solved INTEGER NOT NULL, points INTEGER NOT NULL)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS results_user_day ON results (user_id, day)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS review (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
        task TEXT NOT NULL, q TEXT NOT NULL, ex TEXT NOT NULL, due INTEGER NOT NULL,
        UNIQUE (user_id, task, q))');
    return $pdo;
}
```

* [ ] **Step 4: `lib/game.php`**

```php
<?php
// Herní pravidla: body, série, denní cíl, opakování chyb. Rozpracovaný příklad
// ($cur) drží volající (api.php v session), funkce ho jen čtou a mění.

const DIFF_POINTS = ['lehke' => 1, 'stredni' => 2, 'tezke' => 3];
const GOAL = 20;           // denní cíl: vyřešených příkladů
const STREAK_BONUS = 5;    // každých 5 napoprvé správně v řadě = +1 bod
const REVIEW_AFTER = 5;    // chybný příklad se vrátí po 5 dalších

function base_points(string $diff, int $tries): int
{
    return $tries === 1 ? DIFF_POINTS[$diff] : 1;
}

function streak_bonus(int $streak): int
{
    return $streak > 0 && $streak % STREAK_BONUS === 0 ? 1 : 0;
}

function week_start(string $day): string
{
    $t = strtotime($day);
    return date('Y-m-d', strtotime('-' . (date('N', $t) - 1) . ' days', $t));
}

// Po sobě jdoucí dny se splněným cílem, končící dneškem (nebo včerejškem,
// když dnes cíl ještě splněný není).
function day_streak(array $goalDays, string $today): int
{
    $set = array_flip($goalDays);
    $day = isset($set[$today]) ? $today : date('Y-m-d', strtotime("$today -1 day"));
    $n = 0;
    while (isset($set[$day])) {
        $n++;
        $day = date('Y-m-d', strtotime("$day -1 day"));
    }
    return $n;
}

function user_exists(PDO $db, int $uid): bool
{
    $st = $db->prepare('SELECT 1 FROM users WHERE id = ?');
    $st->execute([$uid]);
    return (bool) $st->fetchColumn();
}

function rename_user(PDO $db, int $uid, string $name): void
{
    $name = trim((string) preg_replace('/\s+/u', ' ', $name));   // neplatné UTF-8 → null → ''
    if ($name === '' || mb_strlen($name) > 20) {
        throw new InvalidArgumentException('Přezdívka musí mít 1 až 20 znaků.');
    }
    if (!user_exists($db, $uid)) {
        throw new InvalidArgumentException('Neznámý uživatel.');
    }
    $db->prepare('UPDATE users SET name = ? WHERE id = ?')->execute([$name, $uid]);
}

function done_count(PDO $db, int $uid): int
{
    $st = $db->prepare('SELECT COUNT(*) FROM results WHERE user_id = ?');
    $st->execute([$uid]);
    return (int) $st->fetchColumn();
}

function get_streak(PDO $db, int $uid): int
{
    $st = $db->prepare('SELECT streak FROM users WHERE id = ?');
    $st->execute([$uid]);
    return (int) $st->fetchColumn();
}

function set_streak(PDO $db, int $uid, int $streak): void
{
    $db->prepare('UPDATE users SET streak = ? WHERE id = ?')->execute([$streak, $uid]);
}

// Nový příklad, nebo dřívější chybný z fronty, když už na něj přišla řada.
function next_exercise(PDO $db, int $uid, string $module, string $level, string $diff): array
{
    $ex = generate_exercise($module, $level, $diff);   // zároveň ověří vstup
    $task = "$module|$level|$diff";
    $st = $db->prepare('SELECT id, ex FROM review WHERE user_id = ? AND task = ? AND due <= ? ORDER BY due, id LIMIT 1');
    $st->execute([$uid, $task, done_count($db, $uid)]);
    $row = $st->fetch();
    if ($row) {
        $db->prepare('DELETE FROM review WHERE id = ?')->execute([$row['id']]);
        $ex = json_decode($row['ex'], true);
    }
    return ['ex' => $ex, 'task' => $task, 'diff' => $diff, 'tries' => 0, 'done' => false, 'review' => (bool) $row];
}

function queue_review(PDO $db, int $uid, array $cur): void
{
    $ex = $cur['ex'];
    unset($ex['hints']);
    $db->prepare('INSERT OR IGNORE INTO review (user_id, task, q, ex, due) VALUES (?, ?, ?, ?, ?)')
        ->execute([$uid, $cur['task'], $ex['q'], json_encode($ex), done_count($db, $uid) + REVIEW_AFTER]);
}

function record_result(PDO $db, int $uid, array $cur, bool $solved, int $points, string $today): void
{
    $ex = $cur['ex'];
    $db->prepare('INSERT INTO results (user_id, day, module, difficulty, question, answer, tries, solved, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([$uid, $today, $ex['m'], $cur['diff'], $ex['q'], answer_str($ex), $cur['tries'], $solved ? 1 : 0, $points]);
}

// Odpověď z JSONu do tvaru, se kterým počítá check_answer; cokoli jiného = prázdná.
function clean_given(array $ex, $given)
{
    $s = fn($v) => is_scalar($v) ? (string) $v : '';
    if ($ex['kind'] === 'divrem') {
        $g = is_array($given) ? $given : [];
        return ['q' => $s($g['q'] ?? ''), 'r' => $s($g['r'] ?? '')];
    }
    return $s($given);
}

function answer_readable(array $ex, $given): bool
{
    return match ($ex['kind']) {
        'frac' => parse_frac($given) !== null,
        'divrem' => parse_num($given['q']) !== null && parse_num($given['r']) !== null,
        default => parse_num($given) !== null,
    };
}

function handle_answer(PDO $db, array &$cur, int $uid, $given, string $today): array
{
    if ($cur['done']) {
        throw new DomainException('Příklad už je hotový.');
    }
    $ex = $cur['ex'];
    $given = clean_given($ex, $given);
    [$ok, $note] = check_answer($ex, $given);
    if (!answer_readable($ex, $given)) {
        return ['correct' => false, 'note' => $note, 'why' => ''];   // překlep, ne pokus
    }
    $cur['tries']++;
    if (!$ok) {
        if ($cur['tries'] === 1) {
            queue_review($db, $uid, $cur);
            set_streak($db, $uid, 0);
        }
        return ['correct' => false, 'note' => $note, 'why' => $note !== '' ? '' : diagnose($ex, $given)];
    }
    $first = $cur['tries'] === 1;
    $streak = $first ? get_streak($db, $uid) + 1 : 0;
    set_streak($db, $uid, $streak);
    $points = base_points($cur['diff'], $cur['tries']);
    $bonus = $first ? streak_bonus($streak) : 0;
    record_result($db, $uid, $cur, true, $points + $bonus, $today);
    $cur['done'] = true;
    return ['correct' => true, 'note' => $note, 'points' => $points, 'bonus' => $bonus, 'streak' => $streak];
}

function handle_reveal(PDO $db, array &$cur, int $uid, string $today): array
{
    if (!$cur['done']) {
        if ($cur['tries'] === 0) {
            queue_review($db, $uid, $cur);
        }
        set_streak($db, $uid, 0);
        record_result($db, $uid, $cur, false, 0, $today);
        $cur['done'] = true;
    }
    return ['answer' => answer_str($cur['ex']), 'steps' => explain($cur['ex'])];
}

function users_state(PDO $db, string $today): array
{
    $out = [];
    foreach ($db->query('SELECT id, kind, name, streak FROM users ORDER BY id')->fetchAll() as $u) {
        $st = $db->prepare('SELECT COALESCE(SUM(points), 0) AS total,
                COALESCE(SUM(CASE WHEN day >= ? THEN points END), 0) AS week,
                COALESCE(SUM(CASE WHEN day = ? THEN points END), 0) AS today,
                COALESCE(SUM(CASE WHEN day = ? AND solved = 1 THEN 1 END), 0) AS solved_today
            FROM results WHERE user_id = ?');
        $st->execute([week_start($today), $today, $today, $u['id']]);
        $sums = array_map('intval', $st->fetch());
        $st = $db->prepare('SELECT day FROM results WHERE user_id = ? AND solved = 1 GROUP BY day HAVING COUNT(*) >= ?');
        $st->execute([$u['id'], GOAL]);
        $out[] = ['id' => (int) $u['id'], 'kind' => $u['kind'], 'name' => $u['name'], 'streak' => (int) $u['streak'],
                  'days' => day_streak($st->fetchAll(PDO::FETCH_COLUMN), $today)] + $sums;
    }
    return $out;
}

function user_stats(PDO $db, int $uid, string $today): array
{
    $st = $db->prepare('SELECT module, difficulty, COUNT(*) AS n, SUM(tries = 1 AND solved = 1) AS first
        FROM results WHERE user_id = ? GROUP BY module, difficulty ORDER BY module, difficulty');
    $st->execute([$uid]);
    $per = $st->fetchAll();
    $st = $db->prepare('SELECT question, answer, COUNT(*) AS n FROM results
        WHERE user_id = ? AND NOT (tries = 1 AND solved = 1) AND day >= ?
        GROUP BY question, answer ORDER BY n DESC, question LIMIT 8');
    $st->execute([$uid, date('Y-m-d', strtotime("$today -30 days"))]);
    return ['per_task' => $per, 'hardest' => $st->fetchAll()];
}
```

* [ ] **Step 5: Spustit testy**

Run: `php tests/run.php`
Expected: `OK`

* [ ] **Step 6: Commit**

```bash
git add lib/db.php lib/game.php tests/test_game.php
git commit -m "Databáze a herní pravidla: body, série, denní cíl, opakování chyb"
```

### Task 3: API

**Files:**

* Modify: `api.php` (celý soubor)

**Interfaces:**

* Consumes: vše z úkolu 2.
* Produces (POST `api.php?action=...`, JSON):
  * `state` → `{modules, difficulties, goal, users, user: int|null}`
  * `switch {user}` → jako `state`, nastaví cookie `matika_user`, zahodí rozpracovaný příklad
  * `rename {user, name}` → jako `state`, 400 se zprávou při neplatné přezdívce
  * `next {module, level, difficulty}` → `{q, kind, keys, review}`, bez uživatele 401
  * `hint` → `{steps, total}`
  * `answer {answer}` → výsledek `handle_answer`, u správné navíc `users`; hotový příklad 409
  * `reveal` → `{answer, steps, users}`
  * `stats` → `{users, stats: {"1": user_stats, "2": user_stats}}`

* [ ] **Step 1: Přepsat `api.php`**

```php
<?php
// JSON API. Volá se POST /api.php?action=... s JSON tělem.
// Uživatel = cookie s id (holka 1, kluk 2), bez hesla. Rozpracovaný příklad
// drží PHP session, správný výsledek klient dostane jen přes reveal.
declare(strict_types=1);

require __DIR__ . '/lib/generators.php';
require __DIR__ . '/lib/explain.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/game.php';

date_default_timezone_set('Europe/Prague');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const USER_COOKIE = 'matika_user';

function out($data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $msg, int $code = 400): never
{
    out(['error' => $msg], $code);
}

function body(): array
{
    $raw = file_get_contents('php://input');
    $data = $raw ? json_decode($raw, true) : [];
    return is_array($data) ? $data : [];
}

function param(array $in, string $key): string
{
    return is_scalar($in[$key] ?? null) ? (string) $in[$key] : '';
}

function current_uid(): ?int
{
    $uid = (int) ($_COOKIE[USER_COOKIE] ?? 0);
    return user_exists(db(), $uid) ? $uid : null;
}

function require_uid(): int
{
    return current_uid() ?? fail('Nejdřív vyber, kdo cvičí.', 401);
}

// Rozpracovaný příklad; session ze starší verze (bez klíče ex) neplatí.
function require_ex(): void
{
    if (!isset($_SESSION['ex']['ex'])) {
        fail('Příklad vypršel, načti další.', 404);
    }
}

function state(?int $uid, string $today): array
{
    return ['modules' => MODULES, 'difficulties' => DIFFICULTIES, 'goal' => GOAL,
            'users' => users_state(db(), $today), 'user' => $uid];
}

$action = $_GET['action'] ?? '';
$in = body();
$today = date('Y-m-d');
session_start(['cookie_httponly' => true, 'cookie_samesite' => 'Lax']);

try {
    switch ($action) {
        case 'state':
            out(state(current_uid(), $today));

        case 'switch':
            $uid = (int) param($in, 'user');
            if (!user_exists(db(), $uid)) {
                fail('Neznámý uživatel.');
            }
            setcookie(USER_COOKIE, (string) $uid, [
                'expires' => time() + 365 * 86400, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax',
            ]);
            unset($_SESSION['ex']);   // rozpracovaný příklad nepatří novému uživateli
            out(state($uid, $today));

        case 'rename':
            try {
                rename_user(db(), (int) param($in, 'user'), param($in, 'name'));
            } catch (InvalidArgumentException $e) {
                fail($e->getMessage());
            }
            out(state(current_uid(), $today));

        case 'next':
            $uid = require_uid();
            try {
                $_SESSION['ex'] = next_exercise(db(), $uid, param($in, 'module'), param($in, 'level'), param($in, 'difficulty'));
            } catch (InvalidArgumentException $e) {
                fail($e->getMessage());
            }
            $ex = $_SESSION['ex']['ex'];
            out(['q' => $ex['q'], 'kind' => $ex['kind'], 'keys' => extra_keys($ex), 'review' => $_SESSION['ex']['review']]);

        case 'hint':
            require_uid();
            require_ex();
            $steps = hint_steps($_SESSION['ex']['ex']);
            $shown = min(count($steps), (int) ($_SESSION['ex']['ex']['hints'] ?? 0) + 1);
            $_SESSION['ex']['ex']['hints'] = $shown;
            out(['steps' => array_slice($steps, 0, $shown), 'total' => count($steps)]);

        case 'answer':
            $uid = require_uid();
            require_ex();
            try {
                $res = handle_answer(db(), $_SESSION['ex'], $uid, $in['answer'] ?? '', $today);
            } catch (DomainException $e) {
                fail($e->getMessage(), 409);
            }
            if ($res['correct']) {
                $res['users'] = users_state(db(), $today);
            }
            out($res);

        case 'reveal':
            $uid = require_uid();
            require_ex();
            $res = handle_reveal(db(), $_SESSION['ex'], $uid, $today);
            out($res + ['users' => users_state(db(), $today)]);

        case 'stats':
            $stats = [];
            foreach (users_state(db(), $today) as $u) {
                $stats[$u['id']] = user_stats(db(), $u['id'], $today);
            }
            out(['users' => users_state(db(), $today), 'stats' => $stats]);

        default:
            fail('Neznámá akce.', 404);
    }
} catch (PDOException $e) {
    error_log('matika DB: ' . $e->getMessage());
    fail('Chyba databáze. Je složka data/ zapisovatelná?', 500);
}
```

* [ ] **Step 2: Lokální databáze ze staré verze**

`data/matika.sqlite` (stará verze, jiné schéma) nová appka nepoužívá, nový soubor je `data/matika-v2.sqlite`. Nic se nemaže.

* [ ] **Step 3: Ověření curlem (každý příkaz zvlášť, se společným cookie jar ve scratchpadu `$J`)**

Run: `curl -s -c $J -b $J -X POST 'http://localhost:3000/api.php?action=next' -d '{"module":"mala","level":"nasobeni","difficulty":"lehke"}'`
Expected: `{"error":"Nejdřív vyber, kdo cvičí."}`

Run: `curl -s -c $J -b $J -X POST 'http://localhost:3000/api.php?action=switch' -d '{"user":1}' | jq '.user, (.users | length)'`
Expected: `1` a `2`

Run: `curl -s -c $J -b $J -X POST 'http://localhost:3000/api.php?action=next' -d '{"module":"mala","level":"nasobeni","difficulty":"lehke"}'`
Expected: `{"q":"…","kind":"num","keys":[],"review":false}`

Run: `curl -s -c $J -b $J -X POST 'http://localhost:3000/api.php?action=switch' -d '{"user":2}' > /dev/null` a pak `curl -s -c $J -b $J -X POST 'http://localhost:3000/api.php?action=answer' -d '{"answer":"1"}'`
Expected: `{"error":"Příklad vypršel, načti další."}` (přepnutí zahodilo příklad)

Run: `curl -s -c $J -b $J -X POST 'http://localhost:3000/api.php?action=rename' -d '{"user":1,"name":""}'`
Expected: `{"error":"Přezdívka musí mít 1 až 20 znaků."}`

Stará session: v `php -a` nebo přes skript ve scratchpadu nastavit `$_SESSION['ex'] = ['q' => '1 · 1', 'kind' => 'num', 'a' => 1]` se stejným session id a zavolat `answer`. Expected: 404 „Příklad vypršel“.

* [ ] **Step 4: Commit**

```bash
git add api.php
git commit -m "API: uživatelé bez hesla, body, opakování, statistiky"
```

### Task 4: Klient: uživatelé v horním řádku, obtížnost a její barvy, menu

**Files:**

* Modify: `index.php` (horní řádek, obrazovka „Kdo dnes cvičí?“, menu, obrazovka příkladu, odstranit obrazovku úrovně), `app.js`, `style.css`

**Interfaces:**

* Consumes: API z úkolu 3.
* Produces: `renderKids(users)`, `setUser(id)`, `startTask(module, level, diff)`, `prefs()` / `savePrefs()` (localStorage `matika_pref_<uid>`), `body[data-diff]`.

* [ ] **Step 1: `index.php`**

Horní řádek:

```html
<header class="top">
  <a href="#" class="brand" data-go="menu">Matika</a>
  <div class="kids" id="kids"></div>
  <button class="link" id="btn-stats">Výsledky</button>
</header>
```

Nová obrazovka před menu:

```html
  <!-- kdo cvičí -->
  <section id="screen-who" class="screen" hidden>
    <h1>Kdo dnes cvičí?</h1>
    <div class="who-pick" id="who-pick"></div>
  </section>
```

Menu: `screen-menu` dostane `hidden` (start rozhodne JS). Smazat celou sekci `screen-level`. Na obrazovce příkladu pod `#chips` přidat:

```html
    <div class="diffs" id="diffs" aria-label="Obtížnost"></div>
```

a nad `#question`:

```html
        <div class="review-badge" id="review" hidden>🔁 Tenhle ti minule nešel</div>
```

* [ ] **Step 2: `app.js`: stav, uživatelé, preference**

Stav:

```js
  const state = { modules: {}, diffs: {}, goal: 20, users: [], user: null, module: null, level: null, diff: 'stredni', ex: null, lock: false, timer: null };
  const EMOJI = { holka: '👧', kluk: '👦' };
  const DIFF_COLOR = { lehke: '#1f9d55', stredni: '#3b6cf6', tezke: '#d6452b' };
```

Preference dítěte (úroveň a obtížnost po úlohách), s ověřením proti aktuálním úlohám (staré klíče úrovní typu `100` se zahodí):

```js
  function prefs() {
    try { return JSON.parse(localStorage.getItem('matika_pref_' + state.user)) || {}; } catch (e) { return {}; }
  }
  function savePrefs(p) {
    try { localStorage.setItem('matika_pref_' + state.user, JSON.stringify(p)); } catch (e) { /* bez úložiště */ }
  }
  function prefFor(module) {
    const p = prefs()[module] || {};
    const levels = Object.keys(state.modules[module].levels);
    return { level: levels.includes(p.level) ? p.level : levels[0], diff: p.diff in state.diffs ? p.diff : 'stredni' };
  }
```

Horní řádek a přepínání:

```js
  function renderKids(users) {
    state.users = users;
    $('kids').innerHTML = users.map((u) => {
      const on = u.id === state.user;
      const goal = on ? `<span class="goal" title="Denní cíl ${u.solved_today}/${state.goal}"><span style="width:${Math.min(100, (u.solved_today / state.goal) * 100)}%"></span></span>` : '';
      const days = on && u.days ? `<span class="days">🔥${u.days}</span>` : '';
      return `<button type="button" class="kid" data-user="${u.id}"${on ? ' aria-current="true"' : ''}>`
        + `${EMOJI[u.kind]} <span class="kid-name">${esc(u.name)}</span> <b>${u.today}</b>${days}${goal}</button>`;
    }).join('');
  }

  $('kids').addEventListener('click', (e) => {
    const b = e.target.closest('[data-user]');
    if (b && Number(b.dataset.user) !== state.user) setUser(Number(b.dataset.user));
  });

  async function setUser(id) {
    const s = await api('switch', { user: id });
    state.user = s.user;
    renderKids(s.users);
    if (!$('screen-round').hidden) {
      const p = prefFor(state.module);
      startTask(state.module, p.level, p.diff);   // stejná úloha, předvolby nového dítěte
    } else {
      showMenu();
    }
  }

  function showWho() {
    $('who-pick').innerHTML = state.users.map((u) =>
      `<button type="button" class="who-btn" data-user="${u.id}"><span>${EMOJI[u.kind]}</span>${esc(u.name)}</button>`).join('');
    show('who');
  }
  $('who-pick').addEventListener('click', (e) => {
    const b = e.target.closest('[data-user]');
    if (b) setUser(Number(b.dataset.user));
  });
```

* [ ] **Step 3: `app.js`: menu bez popisků, rovnou na příklad**

Smazat `DESC`, `pickModule` a obsluhu `#levels`. `renderMenu` přejmenovat na `showMenu`:

```js
  function showMenu() {
    delete document.body.dataset.diff;
    $('modules').innerHTML = Object.entries(state.modules)
      .map(([key, m]) => `<button class="module" data-module="${key}">${esc(m.title)}</button>`)
      .join('');
    show('menu');
  }
  $('modules').addEventListener('click', (e) => {
    const b = e.target.closest('[data-module]');
    if (!b) return;
    const p = prefFor(b.dataset.module);
    startTask(b.dataset.module, p.level, p.diff);
  });
```

* [ ] **Step 4: `app.js`: úloha s obtížností a barvami**

```js
  function startTask(module, level, diff) {
    Object.assign(state, { module, level, diff });
    const p = prefs();
    p[module] = { level, diff };
    savePrefs(p);
    document.body.dataset.diff = diff;
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = DIFF_COLOR[diff];
    renderTabs();
    show('round');
    $('tabs').querySelector('[aria-current]').scrollIntoView({ inline: 'center', block: 'nearest' });
    next();
  }

  function renderTabs() {
    const btn = (cls, attr, val, label, on) =>
      `<button type="button" class="${cls}" ${attr}="${val}"${on ? ' aria-current="true"' : ''}>${esc(label)}</button>`;
    $('tabs').innerHTML = Object.entries(state.modules)
      .map(([key, m]) => btn('tab', 'data-module', key, m.title, key === state.module)).join('');
    const levels = Object.entries(state.modules[state.module].levels);
    $('chips').hidden = levels.length < 2;
    $('chips').innerHTML = levels.map(([lv, label]) => btn('chip', 'data-level', lv, label, lv === state.level)).join('');
    $('diffs').innerHTML = Object.entries(state.diffs)
      .map(([d, label]) => btn('diff', 'data-diff', d, label, d === state.diff)).join('');
  }

  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-module]');
    if (!b) return;
    const p = prefFor(b.dataset.module);
    startTask(b.dataset.module, p.level, p.diff);
  });
  $('chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-level]');
    if (b) startTask(state.module, b.dataset.level, state.diff);
  });
  $('diffs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-diff]');
    if (b) startTask(state.module, state.level, b.dataset.diff);
  });
```

V `next()` posílat obtížnost: `api('next', { module: state.module, level: state.level, difficulty: state.diff })`. V `showQuestion()` přidat `$('review').hidden = !q.review;`. Odstranit staré `state.levels` a předchozí verzi `startTask`, `renderTabs` a obsluhy `#tabs` a `#chips`.

* [ ] **Step 5: `app.js`: body, série a cíl ve zpětné vazbě**

Ve větvi `if (r.correct)` nahradit text pochvaly:

```js
      const me = r.users.find((u) => u.id === state.user);
      const pts = `<small>+${r.points} b.${r.bonus ? ` a +${r.bonus} navíc za ${r.streak} v řadě` : ''}</small>`;
      const fire = r.streak >= 3 ? `<small>🔥 ${r.streak} v řadě</small>` : '';
      const goal = me.solved_today === state.goal ? '<small>🎯 Denní cíl splněný!</small>' : '';
      fb.innerHTML = pick(['Správně!', 'Přesně tak!', 'Paráda!', 'Trefa!', 'Výborně!', 'Super!']) + pts + fire + goal + (r.note ? `<small>${esc(r.note)}</small>` : '');
      renderKids(r.users);
```

V obsluze `btn-reveal` po úspěšném `api('reveal')` přidat `renderKids(r.users);`. U chyby 401 z `api()` (např. smazaná cookie) zobrazit `showWho()`: v `api()` doplnit před `throw`:

```js
    if (res.status === 401) { state.user = null; showWho(); }
```

* [ ] **Step 6: `app.js`: navigace a start**

```js
  document.querySelectorAll('[data-go]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      clearTimeout(state.timer);
      state.ex = null;
      if (state.user) showMenu(); else showWho();
    })
  );

  (async () => {
    try {
      const s = await api('state');
      Object.assign(state, { modules: s.modules, diffs: s.difficulties, goal: s.goal, user: s.user });
      renderKids(s.users);
      if (s.user) showMenu(); else showWho();
    } catch (e) {
      document.body.insertAdjacentHTML('afterbegin', `<p style="padding:16px;color:#d64545">${esc(e.message)}</p>`);
    }
  })();
```

Funkce `show(name)` na začátku smaže `document.body.dataset.diff`, když `name !== 'round'`.

* [ ] **Step 7: `style.css`**

```css
/* horní řádek s dětmi */
.top { gap: 10px; }
.kids { display: flex; gap: 6px; flex: 1; justify-content: center; min-width: 0; }
.kid {
  position: relative; display: inline-flex; align-items: center; gap: 4px; min-width: 0;
  border: 2px solid #d5dbea; background: var(--card); color: var(--ink); border-radius: 999px;
  font-size: 15px; font-weight: 600; padding: 4px 10px 6px; cursor: pointer; overflow: hidden;
}
.kid-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 9em; }
.kid b { color: var(--accent); }
.kid[aria-current] { border-color: var(--accent); }
.kid .days { font-size: 13px; }
.goal { position: absolute; left: 10px; right: 10px; bottom: 2px; height: 3px; background: #e3e8f4; border-radius: 3px; }
.goal span { display: block; height: 100%; background: var(--accent); border-radius: 3px; }
.who-pick { display: flex; gap: 14px; flex-wrap: wrap; }
.who-btn {
  flex: 1; min-width: 140px; border: 2px solid #d5dbea; background: var(--card); border-radius: var(--radius);
  font-size: 22px; font-weight: 700; padding: 24px 12px; cursor: pointer; color: var(--ink);
}
.who-btn span { display: block; font-size: 56px; }
.who-btn:hover { border-color: var(--accent); }

/* obtížnost: barva celé obrazovky příkladu */
body[data-diff=lehke] { --accent: #1f9d55; --diff-bg: #e6f6ec; }
body[data-diff=stredni] { --accent: #3b6cf6; --diff-bg: #e8eefe; }
body[data-diff=tezke] { --accent: #d6452b; --diff-bg: #fdeae6; }
body[data-diff] .top { background: var(--diff-bg); box-shadow: inset 0 -4px 0 var(--accent); }
.diffs { display: flex; gap: 6px; margin: -10px 0 20px; }
.diff {
  border: 2px solid var(--c); background: var(--card); color: var(--c); border-radius: 999px;
  font-size: 14px; font-weight: 700; padding: 5px 14px; cursor: pointer;
}
.diff[data-diff=lehke] { --c: #1f9d55; }
.diff[data-diff=stredni] { --c: #3b6cf6; }
.diff[data-diff=tezke] { --c: #d6452b; }
.diff[aria-current] { background: var(--c); color: #fff; }
.review-badge { text-align: center; color: #7a5200; background: #fff8e1; border-radius: 999px; padding: 4px 12px; margin: 0 auto 10px; width: fit-content; font-weight: 700; font-size: 15px; }

@media (max-width: 480px) {
  .kid { font-size: 13px; padding: 3px 8px 6px; }
  .kid-name { max-width: 5em; }
  .top .link { font-size: 14px; }
}
```

Odstranit nepoužívané `.module small`, `.levels*` a v `@media (max-width: 600px)` řádky `.module small` a `.levels button`.

* [ ] **Step 8: Ověření v prohlížeči (Playwright, 1280 px i 390 px s dotykem)**

* první návštěva → „Kdo dnes cvičí?“, výběr 👧 → menu bez popisků, v horním řádku dvě děti
* klik na úlohu → rovnou příklad, obtížnost Střední, modrý horní řádek a modrý akcent
* klik na Lehké → zelená, Těžké → červenooranžová, příklad z nového rozsahu
* správně napoprvé na Těžké → „+3 b.“, body v horním řádku se zvednou, proužek cíle se posune
* špatně, pak správně → „+1 b.“
* přepnutí na 👦 uprostřed příkladu → nový příklad, předvolby kluka, body holky beze změny
* šířka stránky na 390 px = 390 (nic nepřetéká), v konzoli žádné chyby

* [ ] **Step 9: Commit**

```bash
git add index.php app.js style.css
git commit -m "Uživatelé v horním řádku, obtížnost s barvami, menu rovnou na příklad"
```

### Task 5: Výsledky a přehled pro rodiče

**Files:**

* Modify: `index.php` (obrazovka `screen-stats`), `app.js` (`loadStats`), `style.css` (tabulka)

**Interfaces:**

* Consumes: `stats`, `rename` z API, `renderKids`.

* [ ] **Step 1: `index.php`**

```html
  <!-- výsledky -->
  <section id="screen-stats" class="screen" hidden>
    <h1>Výsledky</h1>
    <table class="table" id="compare"></table>
    <h2>Přehled pro rodiče</h2>
    <div id="parent"></div>
    <button class="link" data-go="menu">← Zpět</button>
  </section>
```

* [ ] **Step 2: `app.js`**

```js
  const MODULE_NAME = (m) => (state.modules[m] ? state.modules[m].title : m);

  async function loadStats() {
    const s = await api('stats');
    renderKids(s.users);
    const row = (label, f) => `<tr><th>${label}</th>${s.users.map((u) => `<td class="num">${f(u)}</td>`).join('')}</tr>`;
    $('compare').innerHTML =
      `<tr><th></th>${s.users.map((u) => `<th class="num">${EMOJI[u.kind]} ${esc(u.name)} <button type="button" class="link rename" data-user="${u.id}" aria-label="Přejmenovat">✏️</button></th>`).join('')}</tr>`
      + row('Dnes', (u) => u.today + ' b.')
      + row('Tento týden', (u) => u.week + ' b.')
      + row('Celkem', (u) => u.total + ' b.')
      + row('Dnes vyřešeno', (u) => `${u.solved_today} / ${state.goal}`)
      + row('Série dní', (u) => (u.days ? '🔥 ' + u.days : '–'));
    $('parent').innerHTML = s.users.map((u) => {
      const st = s.stats[u.id];
      const per = st.per_task.length
        ? `<table class="table">${st.per_task.map((p) => `<tr><td>${esc(MODULE_NAME(p.module))} – ${esc(state.diffs[p.difficulty] || p.difficulty)}</td><td class="num">${p.n}×</td><td class="num">${Math.round((p.first / p.n) * 100)} % napoprvé</td></tr>`).join('')}</table>`
        : '<p class="empty">Zatím nic.</p>';
      const hard = st.hardest.length
        ? `<div class="mistakes">${st.hardest.map((h) => `<div><span>${renderQ(h.question)}</span><span class="right">${renderQ(h.answer)}</span></div>`).join('')}</div>`
        : '<p class="empty">Žádné opakované chyby.</p>';
      return `<details open><summary>${EMOJI[u.kind]} ${esc(u.name)}</summary>${per}<h3>Co nejde (30 dní)</h3>${hard}</details>`;
    }).join('');
    show('stats');
  }

  $('btn-stats').addEventListener('click', () => { clearTimeout(state.timer); loadStats(); });
  $('compare').addEventListener('click', async (e) => {
    const b = e.target.closest('.rename');
    if (!b) return;
    const u = state.users.find((x) => x.id === Number(b.dataset.user));
    const name = prompt('Přezdívka (1 až 20 znaků):', u.name);
    if (name === null) return;
    try {
      await api('rename', { user: u.id, name });
      loadStats();
    } catch (err) {
      alert(err.message);
    }
  });
```

* [ ] **Step 3: `style.css`** (tabulky a seznam chyb byly smazané, vracejí se)

```css
.table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: var(--radius); overflow: hidden; margin-bottom: 10px; }
.table th, .table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eef1f7; font-size: 16px; }
.table th { color: var(--muted); font-weight: 600; font-size: 14px; }
.table .num { text-align: right; font-variant-numeric: tabular-nums; }
.rename { font-size: 14px; padding: 0 2px; }
.empty { color: var(--muted); }
#parent details { margin: 10px 0; }
#parent summary { font-weight: 700; font-size: 18px; cursor: pointer; margin-bottom: 8px; }
#parent h3 { font-size: 16px; margin: 12px 0 6px; }
.mistakes { background: var(--card); border-radius: var(--radius); padding: 10px 16px; }
.mistakes div { display: flex; justify-content: space-between; gap: 10px; padding: 6px 0; border-bottom: 1px solid #eef1f7; }
.mistakes div:last-child { border-bottom: 0; }
.mistakes .right { color: var(--ok); font-weight: 700; }
```

* [ ] **Step 4: Ověření v prohlížeči**

* po několika příkladech u obou dětí: „Výsledky“ ukazují správné součty (shodné s horním řádkem)
* ✏️ → přezdívka `<b>Tom</b>` se ukáže jako text, ne tučně; prázdná → hláška „Přezdívka musí mít 1 až 20 znaků.“
* přehled pro rodiče: úspěšnost napoprvé a chybované příklady
* 390 px: tabulka se vejde

* [ ] **Step 5: Commit**

```bash
git add index.php app.js style.css
git commit -m "Výsledky: porovnání dětí a přehled pro rodiče"
```

### Task 6: Nasazení a dokumentace

**Files:**

* Create: `data/.htaccess`, `data/index.html`
* Modify: `.github/workflows/deploy.yml`, `README.md`, `docs/rozhodnuti.md`, `tasks/todo.md`

* [ ] **Step 1: Složka `data/`**

`data/.htaccess`:

```apache
# Databáze s body dětí. Složku nemaž z repa: FTP nasazení by ji smazalo i s obsahem.
Require all denied
```

`data/index.html` (nesmí být prázdný, prázdný soubor FTP akce nenahraje):

```html
<!doctype html><title>Matika</title>
```

* [ ] **Step 2: `deploy.yml`**

Za krok „Kontrola syntaxe PHP“ přidat:

```yaml
      - name: Testy
        run: php tests/run.php
```

Do `exclude` přidat `data/*.sqlite*` a `tests/**`. Komentář v hlavičce doplnit o větu: „Databáze v data/ se nikdy nepřepisuje ani nemaže (vyřazená z nahrávání), složka data/ musí zůstat v repu.“

* [ ] **Step 3: Dokumentace**

* `README.md`: úvod (děti, body, obtížnost), tabulka rozsahů z Designu místo dnešní tabulky úrovní, body, série, denní cíl, opakování, výsledky, poznámka „web je veřejný, používejte přezdívky“, `data/` a `tests/` v „Jak to funguje“, lokální `php tests/run.php`, frontmatter `popis` (PHP + SQLite).
* `docs/rozhodnuti.md`: nová sekce nahoře „2026-10-11: Dva uživatelé, body a obtížnost“, předchozí rozhodnutí označit jako částečně nahrazené (databáze a uživatelé se vrací, heslo dál ne).
* `tasks/todo.md`: odškrtat a doplnit výsledek.

* [ ] **Step 4: Testy a commit**

Run: `php tests/run.php`
Expected: `OK`

```bash
git add data/ .github/workflows/deploy.yml README.md docs/rozhodnuti.md tasks/todo.md
git commit -m "Nasazení s testy a databází v data/, dokumentace"
```
