<?php
// Čas v appce přes všechna zařízení. Každé zařízení posílá, kolik času
// v appce přibylo (po dnech, i za dny bez internetu), server to sčítá
// pro dítě a den. Upozornění v appce se řídí součtem.

const USAGE_MAX_MS = 4 * 3600 * 1000;   // nejvíc za jeden den v jednom požadavku
const USAGE_DAYS_BACK = 7;              // starší dny se nepřičítají

// $items: [['day' => 'Y-m-d', 'ms' => …], …]; vrací dnešní součet v ms.
function add_usage(PDO $db, int $uid, array $items, string $today): int
{
    $oldest = date('Y-m-d', strtotime("$today -" . USAGE_DAYS_BACK . ' days'));
    $up = $db->prepare('INSERT INTO usage (user_id, day, ms) VALUES (?, ?, ?)
        ON CONFLICT (user_id, day) DO UPDATE SET ms = ms + excluded.ms');
    foreach (array_slice($items, 0, 20) as $it) {
        if (!is_array($it)) {
            continue;
        }
        $day = is_string($it['day'] ?? null) ? $it['day'] : '';
        $ms = (int) ($it['ms'] ?? 0);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day) || $day > $today || $day < $oldest || $ms <= 0) {
            continue;
        }
        $up->execute([$uid, $day, min($ms, USAGE_MAX_MS)]);
    }
    return usage_on($db, $uid, $today);
}

function usage_on(PDO $db, int $uid, string $day): int
{
    $st = $db->prepare('SELECT ms FROM usage WHERE user_id = ? AND day = ?');
    $st->execute([$uid, $day]);
    return (int) $st->fetchColumn();
}
