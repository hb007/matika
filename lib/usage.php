<?php
// Čas v appce přes všechna zařízení. Každé zařízení posílá svůj celkový čas
// za den (ne přírůstek) spolu se svým id; server si ho pro dítě, den
// a zařízení uloží (vyšší hodnota vyhrává) a sčítá přes zařízení. Opakované
// odeslání téhož součtu (ztracená odpověď) tak nic nepřičte dvakrát.

const USAGE_MAX_MS = 24 * 3600 * 1000;  // strop za den a zařízení
const USAGE_DAYS_BACK = 7;              // starší dny se nepřijímají

// $items: [['day' => 'Y-m-d', 'ms' => celkem za den na zařízení], …]; vrací dnešní součet v ms.
function add_usage(PDO $db, int $uid, string $device, array $items, string $today): int
{
    if (!preg_match('/^[0-9a-f]{8,32}$/', $device)) {
        throw new InvalidArgumentException('Chybí id zařízení.');
    }
    $oldest = date('Y-m-d', strtotime("$today -" . USAGE_DAYS_BACK . ' days'));
    $up = $db->prepare('INSERT INTO usage_dev (user_id, day, device, ms) VALUES (?, ?, ?, ?)
        ON CONFLICT (user_id, day, device) DO UPDATE SET ms = max(ms, excluded.ms)');
    foreach (array_slice($items, 0, 20) as $it) {
        if (!is_array($it)) {
            continue;
        }
        $day = is_string($it['day'] ?? null) ? $it['day'] : '';
        $ms = (int) ($it['ms'] ?? 0);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day) || $day > $today || $day < $oldest || $ms <= 0) {
            continue;
        }
        $up->execute([$uid, $day, $device, min($ms, USAGE_MAX_MS)]);
    }
    return usage_on($db, $uid, $today);
}

function usage_on(PDO $db, int $uid, string $day): int
{
    $st = $db->prepare('SELECT COALESCE(SUM(ms), 0) FROM usage_dev WHERE user_id = ? AND day = ?');
    $st->execute([$uid, $day]);
    return (int) $st->fetchColumn();
}
