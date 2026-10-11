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
