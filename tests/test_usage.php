<?php
// Čas v appce: součet ze všech zařízení, ochrana proti nesmyslům.
$db = db_open('sqlite::memory:');
$today = '2026-10-11';
check(add_usage($db, 1, [['day' => $today, 'ms' => 60000]], $today) === 60000, 'cas: prvni zarizeni minuta');
check(add_usage($db, 1, [['day' => $today, 'ms' => 120000]], $today) === 180000, 'cas: druhe zarizeni se pricte');
check(add_usage($db, 1, [['day' => '2026-10-10', 'ms' => 50000]], $today) === 180000, 'cas: vcerejsek se do dneska nepocita');
check(usage_on($db, 1, '2026-10-10') === 50000, 'cas: vcerejsek ulozeny (offline)');
add_usage($db, 1, [['day' => '2026-10-12', 'ms' => 5000], ['day' => '2026-09-01', 'ms' => 5000], ['day' => 'x', 'ms' => 5],
    ['day' => $today, 'ms' => -50000], 'nesmysl'], $today);
check(usage_on($db, 1, $today) === 180000 && usage_on($db, 1, '2026-10-12') === 0 && usage_on($db, 1, '2026-09-01') === 0, 'cas: budoucnost, stare dny a zaporne se ignoruji');
add_usage($db, 1, [['day' => $today, 'ms' => 999999999]], $today);
check(usage_on($db, 1, $today) === 180000 + USAGE_MAX_MS, 'cas: strop na jeden pozadavek');
check(usage_on($db, 2, $today) === 0, 'cas: druhe dite zvlast');
$u = users_state($db, $today);
check($u[0]['time_today'] === 180000 + USAGE_MAX_MS && $u[1]['time_today'] === 0, 'cas: v users_state');
