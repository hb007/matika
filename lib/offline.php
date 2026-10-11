<?php
// Offline režim: zásoba příkladů do telefonu a dodatečné započtení výsledků.
//
// Když je zařízení online, stáhne si zásobu příkladů i se správným výsledkem,
// nápovědou a postupem. Bez internetu je řeší z ní a výsledky si uloží. Po
// připojení je pošle (sync) a server je přehraje přes stejná pravidla jako
// online odpovědi (handle_answer, handle_reveal), v pořadí, v jakém je dítě
// řešilo, a se dnem, kdy je řešilo. Server zná každý vydaný příklad podle id,
// takže výsledek ověří sám a podvržený příklad nebo odpověď nic nepřinese.

const POOL_MAX_PER_TASK = 40;   // nejvíc příkladů na jednu kombinaci úlohy, úrovně a obtížnosti
const POOL_MAX_TOTAL = 300;     // nejvíc příkladů v jednom požadavku
const ISSUED_KEEP_DAYS = 90;    // nevyřešené vydané příklady se po 90 dnech zapomenou
const ISSUED_MAX = 1500;        // a na dítě jich server drží nejvýš 1500 (nejstarší pryč)
const SYNC_MAX = 500;           // nejvíc výsledků v jednom sync
const SYNC_MAX_ANSWERS = 30;    // nejvíc pokusů u jednoho příkladu

// Příklad pro klienta: zadání, správný výsledek pro kontrolu v telefonu,
// text výsledku, kroky nápovědy a postup řešení.
function pool_item(string $id, array $ex): array
{
    return [
        'id' => $id, 'q' => $ex['q'], 'kind' => $ex['kind'], 'keys' => extra_keys($ex),
        'diff' => $ex['d'], 'a' => $ex['a'], 'strict' => !empty($ex['strict']),
        'answer' => answer_str($ex), 'hints' => hint_steps($ex), 'steps' => explain($ex),
    ];
}

// $want: [['module' => …, 'level' => …, 'difficulty' => …, 'n' => …], …]
// Vrací ['module|level|difficulty' => [příklady…]]. Neplatné kombinace přeskočí.
function issue_pool(PDO $db, int $uid, array $want, int $now): array
{
    $db->prepare('DELETE FROM issued WHERE user_id = ? AND created < ?')
        ->execute([$uid, $now - ISSUED_KEEP_DAYS * 86400]);
    $out = [];
    $total = 0;
    $ins = $db->prepare('INSERT INTO issued (id, user_id, task, ex, created) VALUES (?, ?, ?, ?, ?)');
    $db->beginTransaction();
    foreach ($want as $w) {
        if (!is_array($w)) {
            continue;
        }
        $module = (string) ($w['module'] ?? '');
        $level = (string) ($w['level'] ?? '');
        $diff = (string) ($w['difficulty'] ?? '');
        $n = max(0, min(POOL_MAX_PER_TASK, (int) ($w['n'] ?? 0), POOL_MAX_TOTAL - $total));
        $key = "$module|$level|$diff";
        for ($i = 0; $i < $n; $i++) {
            try {
                $ex = generate_exercise($module, $level, $diff);
            } catch (InvalidArgumentException $e) {
                break;
            }
            $id = bin2hex(random_bytes(12));
            $ins->execute([$id, $uid, $module, json_encode($ex), $now]);
            $out[$key][] = pool_item($id, $ex);
            $total++;
        }
    }
    // strop na dítě: nejstarší vydané příklady pryč
    $db->prepare('DELETE FROM issued WHERE user_id = ? AND id NOT IN
        (SELECT id FROM issued WHERE user_id = ? ORDER BY created DESC, rowid DESC LIMIT ' . ISSUED_MAX . ')')
        ->execute([$uid, $uid]);
    $db->commit();
    return $out;
}

// Jeden offline výsledek z klienta, očištěný: id, pokusy, ukázaný výsledek, čas (ms).
function clean_sync_item($it): ?array
{
    if (!is_array($it) || !is_string($it['id'] ?? null) || !preg_match('/^[0-9a-f]{24}$/', $it['id'])) {
        return null;
    }
    $answers = is_array($it['answers'] ?? null) ? array_slice(array_values($it['answers']), 0, SYNC_MAX_ANSWERS) : [];
    return ['id' => $it['id'], 'answers' => $answers, 'revealed' => !empty($it['revealed']), 'at' => (int) ($it['at'] ?? 0)];
}

// Přehraje offline výsledky dítěte. Vrací id, které klient může zapomenout
// (započtené, neznámé i už dřív započtené: posílat je znovu nemá smysl).
function sync_results(PDO $db, int $uid, array $items, int $now): array
{
    $items = array_values(array_filter(array_map('clean_sync_item', array_slice($items, 0, SYNC_MAX))));
    usort($items, fn($a, $b) => $a['at'] <=> $b['at']);   // v pořadí, jak je dítě řešilo (série, opakování)
    $done = [];
    $get = $db->prepare('SELECT task, ex, created FROM issued WHERE id = ? AND user_id = ?');
    $del = $db->prepare('DELETE FROM issued WHERE id = ?');
    $db->beginTransaction();
    foreach ($items as $it) {
        $done[] = $it['id'];
        $get->execute([$it['id'], $uid]);
        $row = $get->fetch();
        if (!$row) {
            continue;   // neznámý, cizí nebo už započtený příklad
        }
        $del->execute([$it['id']]);
        $ex = json_decode($row['ex'], true);
        // den řešení podle času z telefonu, ale ne dřív, než byl příklad vydán, a ne v budoucnu
        $at = intdiv($it['at'], 1000);
        $day = date('Y-m-d', max((int) $row['created'], min($now, $at)));
        $cur = ['ex' => $ex, 'task' => $row['task'], 'diff' => $ex['d'], 'tries' => 0, 'done' => false, 'review' => false];
        foreach ($it['answers'] as $given) {
            if ($cur['done']) {
                break;
            }
            handle_answer($db, $cur, $uid, $given, $day);
        }
        // nevyřešený (ukázaný výsledek, nebo odpověď, kterou server neuznal) = jako „Ukázat výsledek“
        if (!$cur['done'] && ($it['revealed'] || $cur['tries'] > 0)) {
            handle_reveal($db, $cur, $uid, $day);
        }
    }
    $db->commit();
    return $done;
}
