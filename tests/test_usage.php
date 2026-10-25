<?php
// Čas v appce: celkové součty po zařízeních, součet přes zařízení, ochrana proti nesmyslům.
$db = test_db();
$today = '2026-10-11';
$d1 = 'aaaaaaaaaaaaaaaa';
$d2 = 'bbbbbbbbbbbbbbbb';
check(add_usage($db, 1, $d1, [['day' => $today, 'ms' => 60000]], $today) === 60000, 'cas: prvni zarizeni minuta');
check(add_usage($db, 1, $d1, [['day' => $today, 'ms' => 60000]], $today) === 60000, 'cas: stejny soucet znovu (ztracena odpoved) nic nepricte');
check(add_usage($db, 1, $d1, [['day' => $today, 'ms' => 90000]], $today) === 90000, 'cas: vyssi soucet nahradi nizsi');
check(add_usage($db, 1, $d1, [['day' => $today, 'ms' => 30000]], $today) === 90000, 'cas: nizsi soucet neubere');
check(add_usage($db, 1, $d2, [['day' => $today, 'ms' => 120000]], $today) === 210000, 'cas: druhe zarizeni se scita');
check(add_usage($db, 1, $d1, [['day' => '2026-10-10', 'ms' => 50000]], $today) === 210000, 'cas: vcerejsek se do dneska nepocita');
check(usage_on($db, 1, '2026-10-10') === 50000, 'cas: vcerejsek ulozeny (offline)');
add_usage($db, 1, $d1, [['day' => '2026-10-12', 'ms' => 5000], ['day' => '2026-09-01', 'ms' => 5000], ['day' => 'x', 'ms' => 5],
    ['day' => $today, 'ms' => -50000], 'nesmysl'], $today);
check(usage_on($db, 1, $today) === 210000 && usage_on($db, 1, '2026-10-12') === 0 && usage_on($db, 1, '2026-09-01') === 0, 'cas: budoucnost, stare dny a zaporne se ignoruji');
add_usage($db, 1, $d1, [['day' => $today, 'ms' => 999999999999]], $today);
check(usage_on($db, 1, $today) === 120000 + USAGE_MAX_MS, 'cas: strop za den a zarizeni');
check(usage_on($db, 2, $today) === 0, 'cas: druhe dite zvlast');
$threw = false;
try {
    add_usage($db, 1, 'x', [], $today);
} catch (InvalidArgumentException $e) {
    $threw = true;
}
check($threw, 'cas: bez id zarizeni odmitne');
$u = users_state($db, $today);
check($u[0]['time_today'] === 120000 + USAGE_MAX_MS && $u[1]['time_today'] === 0, 'cas: v users_state');

// migrace: starší tabulka usage (přírůstky) se převede a smaže
$f = tempnam(sys_get_temp_dir(), 'matika');
$old = new PDO("sqlite:$f");
$old->exec('CREATE TABLE usage (user_id INTEGER, day TEXT, ms INTEGER, PRIMARY KEY (user_id, day))');
$old->exec("INSERT INTO usage VALUES (2, '$today', 827000)");
$old = null;
$db3 = db_open("sqlite:$f");
check(usage_on($db3, 2, $today) === 827000, 'cas: starsi soucet prevzaty');
check(!$db3->query("SELECT 1 FROM sqlite_master WHERE name = 'usage'")->fetchColumn(), 'cas: stara tabulka pryc');
check(add_usage($db3, 2, $d1, [['day' => $today, 'ms' => 1000]], $today) === 828000, 'cas: nove zarizeni se k prevzatemu pricte');
$db3 = null;
unlink($f);
