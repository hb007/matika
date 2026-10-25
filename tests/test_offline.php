<?php
// Offline: zásoba příkladů a dodatečné započtení výsledků přes stejná pravidla.
$now = strtotime('2026-10-11 12:00:00');
$ms = fn(string $t) => strtotime($t) * 1000;
$rightOf = fn(array $it) => $it['kind'] === 'divrem' ? ['q' => (string) $it['a'][0], 'r' => (string) $it['a'][1]] : $it['answer'];
$wrongOf = fn(array $it) => $it['kind'] === 'divrem' ? ['q' => (string) ($it['a'][0] + 1), 'r' => '0'] : ($it['kind'] === 'frac' ? '1/97' : '-9999');
$points = fn(PDO $db, int $uid) => (int) $db->query("SELECT COALESCE(SUM(points), 0) FROM results WHERE user_id = $uid")->fetchColumn();
$rows = fn(PDO $db) => (int) $db->query('SELECT COUNT(*) FROM results')->fetchColumn();

// zásoba
$db = test_db();
$pool = issue_pool($db, 1, [
    ['module' => 'mala', 'level' => 'nasobeni', 'difficulty' => 'stredni', 'n' => 5],
    ['module' => 'zlomky', 'level' => 'scitani', 'difficulty' => 'tezke', 'n' => 3],
    ['module' => 'deleni', 'level' => 'zbytek', 'difficulty' => 'lehke', 'n' => 2],
    ['module' => 'mix', 'level' => 'vse', 'difficulty' => 'vse', 'n' => 4],
    ['module' => 'nic', 'level' => 'x', 'difficulty' => 'stredni', 'n' => 5],
    'nesmysl',
], $now);
check(count($pool['mala|nasobeni|stredni'] ?? []) === 5, 'zasoba: 5 prikladu male nasobilky');
check(count($pool['zlomky|scitani|tezke'] ?? []) === 3 && count($pool['deleni|zbytek|lehke'] ?? []) === 2, 'zasoba: dalsi ulohy');
check(count($pool['mix|vse|vse'] ?? []) === 4, 'zasoba: mix napric obtiznostmi');
check(!isset($pool['nic|x|stredni']), 'zasoba: neplatna uloha se preskoci');
check((int) $db->query('SELECT COUNT(*) FROM issued')->fetchColumn() === 14, 'zasoba: vydane priklady ulozene');
$it = $pool['mala|nasobeni|stredni'][0];
check(preg_match('/^[0-9a-f]{24}$/', $it['id']) === 1 && $it['diff'] === 'stredni' && $it['hints'] && $it['steps'] && $it['answer'] !== '', 'zasoba: polozka ma vse pro offline');
foreach ($pool['mix|vse|vse'] as $m) {
    check(isset(DIFFICULTIES[$m['diff']]), 'mix vse: skutecna obtiznost u prikladu');
}
$big = issue_pool($db, 1, [['module' => 'velka', 'level' => 'mix', 'difficulty' => 'tezke', 'n' => 999]], $now);
check(count($big['velka|mix|tezke']) === POOL_MAX_PER_TASK, 'zasoba: strop na ulohu');

// bez opakování: v jedné dávce žádné zadání dvakrát, nic z toho, co klient má
$qs = fn(array $items) => array_column($items, 'q');
$small = issue_pool($db, 1, [['module' => 'mala', 'level' => 'nasobeni', 'difficulty' => 'lehke', 'n' => 40]], $now)['mala|nasobeni|lehke'];
check(count($small) === count(array_unique($qs($small))), 'zasoba: zadani se neopakuji');
check(count($small) <= 16 && count($small) >= 12, 'zasoba: mala ulohu vrati jen ruzne priklady (' . count($small) . ')');
$have = array_slice($qs($small), 0, 10);
$more = issue_pool($db, 1, [['module' => 'mala', 'level' => 'nasobeni', 'difficulty' => 'lehke', 'n' => 40, 'have' => $have]], $now)['mala|nasobeni|lehke'] ?? [];
check(!array_intersect($have, $qs($more)), 'zasoba: nevyda, co klient uz ma');
check(count($more) <= 16 - 10, 'zasoba: zbytek ruznych prikladu');
$big = issue_pool($db, 1, [['module' => 'mix', 'level' => 'vse', 'difficulty' => 'vse', 'n' => 30],
    ['module' => 'scitani', 'level' => 'cela', 'difficulty' => 'tezke', 'n' => 30]], $now);
check(count($big['mix|vse|vse']) === 30 && count($big['scitani|cela|tezke']) === 30, 'zasoba: velke ulohy dostanou vse');

// správně napoprvé = stejné body jako online, podruhé se nezapočte
$db = test_db();
$pool = issue_pool($db, 1, [['module' => 'mala', 'level' => 'nasobeni', 'difficulty' => 'stredni', 'n' => 10]], $now);
$p = $pool['mala|nasobeni|stredni'];
$done = sync_results($db, 1, [['id' => $p[0]['id'], 'answers' => [$rightOf($p[0])], 'at' => $ms('2026-10-11 10:00')]], $now);
check($done === [$p[0]['id']] && $points($db, 1) === 2, 'sync: spravne napoprve 2 body');
sync_results($db, 1, [['id' => $p[0]['id'], 'answers' => [$rightOf($p[0])], 'at' => $ms('2026-10-11 10:00')]], $now);
check($points($db, 1) === 2 && $rows($db) === 1, 'sync: opakovane odeslani se nezapocte');

// chyba a pak správně: 1 bod, příklad do fronty opakování
sync_results($db, 1, [['id' => $p[1]['id'], 'answers' => [$wrongOf($p[1]), $rightOf($p[1])], 'at' => $ms('2026-10-11 10:01')]], $now);
check($points($db, 1) === 3, 'sync: spravne po chybe 1 bod');
check((int) $db->query('SELECT COUNT(*) FROM review')->fetchColumn() === 1, 'sync: chyba jde do fronty opakovani');

// ukázaný výsledek: 0 bodů, nevyřešeno
sync_results($db, 1, [['id' => $p[2]['id'], 'answers' => [], 'revealed' => true, 'at' => $ms('2026-10-11 10:02')]], $now);
check($points($db, 1) === 3 && (int) $db->query('SELECT solved FROM results ORDER BY id DESC LIMIT 1')->fetchColumn() === 0, 'sync: ukazany vysledek 0 bodu');

// klient tvrdí správně, ale odpověď je špatně: server ji neuzná
sync_results($db, 1, [['id' => $p[3]['id'], 'answers' => [$wrongOf($p[3])], 'at' => $ms('2026-10-11 10:03')]], $now);
check($points($db, 1) === 3 && (int) $db->query('SELECT solved FROM results ORDER BY id DESC LIMIT 1')->fetchColumn() === 0, 'sync: spatna odpoved se nezapocte jako vyresena');

// neznámé id a cizí příklad nic nezapočtou, ale klient je smí zapomenout
$before = $rows($db);
$done = sync_results($db, 2, [['id' => $p[4]['id'], 'answers' => [$rightOf($p[4])], 'at' => $ms('2026-10-11 10:04')],
    ['id' => str_repeat('a', 24), 'answers' => ['1'], 'at' => 0], ['id' => 'zly', 'answers' => []], 'nesmysl'], $now);
check($rows($db) === $before && count($done) === 2, 'sync: cizi a nezname priklady nic nezapoctou');
sync_results($db, 1, [['id' => $p[4]['id'], 'answers' => [$rightOf($p[4])], 'at' => $ms('2026-10-11 10:04')]], $now);
check($rows($db) === $before + 1, 'sync: vlastni dite ho pak zapocte');

// den podle času řešení; budoucnost se ořízne na dnešek
$db = test_db();
$pool = issue_pool($db, 1, [['module' => 'mala', 'level' => 'nasobeni', 'difficulty' => 'lehke', 'n' => 3]], strtotime('2026-10-09 08:00'));
$p = $pool['mala|nasobeni|lehke'];
sync_results($db, 1, [
    ['id' => $p[0]['id'], 'answers' => [$rightOf($p[0])], 'at' => $ms('2026-10-10 09:00')],
    ['id' => $p[1]['id'], 'answers' => [$rightOf($p[1])], 'at' => $ms('2030-01-01 09:00')],
    ['id' => $p[2]['id'], 'answers' => [$rightOf($p[2])], 'at' => $ms('2020-01-01 09:00')],
], $now);
$days = $db->query('SELECT day FROM results ORDER BY id')->fetchAll(PDO::FETCH_COLUMN);
check($days === ['2026-10-09', '2026-10-10', '2026-10-11'], 'sync: den podle casu reseni, orezany na vydani a dnesek');

// pořadí podle času: série a bonus za 5 v řadě jako online
$db = test_db();
$pool = issue_pool($db, 1, [['module' => 'mala', 'level' => 'nasobeni', 'difficulty' => 'lehke', 'n' => 6]], $now);
$p = $pool['mala|nasobeni|lehke'];
$items = [];
foreach ($p as $i => $x) {
    $items[] = ['id' => $x['id'], 'answers' => $i === 0 ? [$wrongOf($x), $rightOf($x)] : [$rightOf($x)], 'at' => $ms('2026-10-11 09:00') + $i * 60000];
}
sync_results($db, 1, array_reverse($items), $now);   // poslané pozpátku, přehraje se podle času
check($points($db, 1) === 1 + 5 * 1 + 1, 'sync: po chybe 5 napoprve v rade = bonus');
check(get_streak($db, 1) === 5, 'sync: serie v rade po offline');
