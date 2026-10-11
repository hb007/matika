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
