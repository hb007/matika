<?php
// Sešity: registrace s kódem třídy, PIN a zámek, tokeny zařízení, žebříček,
// migrace ze starší verze, bez sešitu (GUEST), smazání.
$db = test_db();
$today = '2026-10-11';
$now = 1760000000;

// třídy a registrace
$cid = add_class($db, '6.A', 'abc123');
check(class_by_code($db, 'ABC123')['id'] === $cid, 'kod tridy velkymi pismeny');
$threw = '';
try {
    add_class($db, '6.B', 'ABC123');
} catch (InvalidArgumentException $e) {
    $threw = $e->getMessage();
}
check($threw !== '', 'stejny kod dvakrat nejde');
check(preg_match('/^[A-Z2-9]{6}$/', class_code()) === 1, 'nahodny kod: 6 znaku bez 0/O/1/I');
check(class_by_code($db, 'XXXX') === null, 'spatne heslo tridy: null');
foreach ([['', 'zelena', '1234'], ['Anička', 'neon', '1234'], ['Anička', 'zelena', '12'], ['Anička', 'zelena', '12345678'], ['Anička', 'zelena', 'abcd']] as [$n, $c, $p]) {
    $threw = false;
    try {
        register_user($db, $n, $c, $p, $cid, $today);
    } catch (InvalidArgumentException $e) {
        $threw = true;
    }
    check($threw, "registrace odmitne spatny vstup ($n, $c, $p)");
}
$a = register_user($db, 'Anička Nováková', 'zelena', '1234', $cid, $today);
$u = user_by_slug($db, 'anicka-novakova');
check($u && $u['id'] === $a && $u['color'] === 'zelena' && $u['class_id'] === $cid && $u['has_pin'], 'registrace: slug bez diakritiky, trida, PIN');
$b = register_user($db, 'Anička Nováková', 'modra', '5678', $cid, $today);
check(user_by_slug($db, 'anicka-novakova-2')['id'] === $b, 'stejna prezdivka: slug s cislem');
$l = register_user($db, '🦄 Lili', 'fialova', '1234', $cid, $today, 'Lili');
check(user_by_slug($db, 'lili')['id'] === $l && user_by_slug($db, 'lili')['name'] === '🦄 Lili', 'vlastni prihlasovaci jmeno, prezdivka s emoji');
foreach (['lili', 'Žofie', 'a b'] as $badLogin) {
    $threw = '';
    try {
        register_user($db, 'X', 'modra', '1234', $cid, $today, $badLogin);
    } catch (InvalidArgumentException $e) {
        $threw = $e->getMessage();
    }
    check(str_contains($threw, 'řihlašovací'), "prihlasovaci jmeno '$badLogin' odmitnuto");
}
delete_user($db, $l);
check(slugify('  Ťom?! ') === 'tom' && slugify('???') === 'dite' && slugify('Žofie-Lída') === 'zofie-lida' && strlen(slugify(str_repeat('a', 30))) === 16, 'slugify');
check(user_rows($db, [$a])[0]['class_name'] === '6.A', 'nazev tridy u ditete');

// zvací odkazy
$tok = add_invite($db, 'rodiče 6.A', $cid, $today);
$tok2 = add_invite($db, 'bez třídy', null, $today);
check(preg_match('/^[a-z2-9]{12}$/', $tok) === 1 && $tok !== $tok2, 'token odkazu');
$i = invite_by_token($db, $tok);
check($i['class_id'] === $cid && $i['class_name'] === '6.A' && $i['label'] === 'rodiče 6.A' && $i['uses'] === 0, 'odkaz s tridou');
check(invite_by_token($db, $tok2)['class_id'] === null && invite_by_token($db, 'nic') === null && invite_by_token($db, "x' OR 1=1") === null, 'odkaz bez tridy, neplatny');
$c2 = register_user($db, 'Pozvaný', 'modra', '1234', invite_by_token($db, $tok2)['class_id'], $today);
check(user_by_slug($db, 'pozvany')['class_id'] === null && count(invites($db)) === 2, 'ucet bez tridy pres odkaz');
delete_user($db, $c2);

// PIN: spatny, zamek po 5, spravny po zamku
check_pin($db, $a, '1234', $now);
$msgs = [];
for ($i = 0; $i < 5; $i++) {
    try {
        check_pin($db, $a, '0000', $now);
    } catch (InvalidArgumentException $e) {
        $msgs[] = $e->getMessage();
    }
}
check(count($msgs) === 5 && $msgs[0] === 'Špatný PIN.' && str_contains($msgs[4], 'minutu'), 'po 5 spatnych PINech zamek');
$threw = false;
try {
    check_pin($db, $a, '0000', $now + 10);
} catch (InvalidArgumentException $e) {
    $threw = true;
}
check($threw && (int) $db->query("SELECT pin_fails FROM users WHERE id = $a")->fetchColumn() === 5, 'v zamku se pokus nepocita');
$threw = false;
try {
    check_pin($db, $a, '1234', $now + 10);
} catch (InvalidArgumentException $e) {
    $threw = true;
}
check($threw, 'v zamku neprojde ani spravny PIN');
check_pin($db, $a, '1234', $now + PIN_LOCK + 1);
check(true, 'po zamku spravny PIN projde');
// po správném PINu počítadlo od nuly: pětice chyb = minuta; další pětice po zámku = 2 minuty
$t = $now + PIN_LOCK + 2;
for ($i = 0; $i < 5; $i++) {
    try {
        check_pin($db, $a, '0000', $t);
    } catch (InvalidArgumentException $e) {
        $msg = $e->getMessage();
    }
}
check(str_contains($msg, 'minutu') && (int) $db->query("SELECT pin_until FROM users WHERE id = $a")->fetchColumn() === $t + PIN_LOCK, 'prvni zamek minuta');
$t += PIN_LOCK + 1;
for ($i = 0; $i < 5; $i++) {
    try {
        check_pin($db, $a, '0000', $t);
    } catch (InvalidArgumentException $e) {
        $msg = $e->getMessage();
    }
}
check(str_contains($msg, '2 minut') && (int) $db->query("SELECT pin_until FROM users WHERE id = $a")->fetchColumn() === $t + 2 * PIN_LOCK, 'druhy zamek 2 minuty, pocitadlo se nenuluje');
check_pin($db, $a, '1234', $t + 2 * PIN_LOCK + 1);
check((int) $db->query("SELECT pin_fails FROM users WHERE id = $a")->fetchColumn() === 0, 'spravny PIN vynuluje pocitadlo');
$tk = issue_token($db, $a, $now);
$to = issue_token($db, $a, $now);
set_pin($db, $a, '9999', $tk);
check(logged_users($db, [$tk, $to], $now) === [$a => $tk], 'novy PIN odhlasi ostatni zarizeni');
check_pin($db, $a, '9999', $t + 2 * PIN_LOCK + 2);
check(!has_pin($db, 1) && has_pin($db, $a), 'holka bez PINu, novy sesit s PINem');
$threw = false;
try {
    check_pin($db, 1, '1234', $now);
} catch (InvalidArgumentException $e) {
    $threw = true;
}
check($threw, 'sesit bez PINu se PINem prihlasit neda');

// tokeny zařízení
$t1 = issue_token($db, $a, $now);
$t2 = issue_token($db, 1, $now);
check(preg_match('/^[0-9a-f]{32}$/', $t1) === 1, 'token: 32 hex znaku');
check(cookie_tokens("$t1.$t2.xx") === [$t1, $t2], 'tokeny z cookie, neplatne pryc');
check(logged_users($db, [$t1, $t2, 'ffffffffffffffffffffffffffffffff'], $now + 5) === [$a => $t1, 1 => $t2], 'prihlasene deti podle tokenu');
check(logged_users($db, [$t1], $now + TOKEN_DAYS * 86400 + 1) === [], 'prosly token neplati');
revoke_token($db, $t1);
check(logged_users($db, [$t1, $t2], $now) === [1 => $t2], 'odhlaseni = token pryc');

// žebříček: třída a všichni, série dní
for ($i = 0; $i < 3; $i++) {
    $c = next_exercise($db, $a, 'mala', 'nasobeni', 'tezke');
    handle_answer($db, $c, $a, answer_str($c['ex']), $today);
}
$c = next_exercise($db, 1, 'mala', 'nasobeni', 'lehke');
handle_answer($db, $c, 1, answer_str($c['ex']), $today);
$all = leaderboard($db, $today, null);
check(count($all) === 4 && $all[0]['id'] === $a && $all[0]['total'] === 9 && $all[0]['today'] === 9, 'zebricek vsech: Anicka prvni');
$cls = leaderboard($db, $today, $cid);
check(count($cls) === 2 && !in_array(1, array_column($cls, 'id'), true), 'zebricek tridy bez holky');
$card = user_card($db, $a, $today);
check($card['name'] === 'Anička Nováková' && $card['total'] === 9 && isset($card['stickers']) && !isset($card['streak']) && !isset($card['slug']), 'verejna karta bez prihlasovaciho jmena');
check(user_card($db, 999, $today) === null, 'karta neznameho: null');
check(class_stats($db, $cid)[0]['kids'] === 1 && class_stats($db, null)[0]['n'] === 1, 'prehled za tridu a bez tridy');

// bez sešitu: body jen v rozpracovaném příkladu, nic v databázi
$before = (int) $db->query('SELECT COUNT(*) FROM results')->fetchColumn();
$c = next_exercise($db, GUEST, 'mala', 'nasobeni', 'tezke');
$c['streak'] = 4;
$r = handle_answer($db, $c, GUEST, answer_str($c['ex']), $today);
check($r['correct'] && $r['points'] === 3 && $r['bonus'] === 1 && $r['streak'] === 5 && $r['rewards'] === [] && $r['suggest'] === null && $c['streak'] === 5, 'guest: body a serie bez odmen');
$c = next_exercise($db, GUEST, 'mala', 'nasobeni', 'tezke');
$c['streak'] = 5;
handle_answer($db, $c, GUEST, '-1', $today);
check($c['streak'] === 0, 'guest: chyba vynuluje serii');
$r = handle_reveal($db, $c, GUEST, $today);
check($r['answer'] !== '' && $r['suggest'] === null, 'guest: ukazany vysledek');
check((int) $db->query('SELECT COUNT(*) FROM results')->fetchColumn() === $before
    && (int) $db->query('SELECT COUNT(*) FROM review')->fetchColumn() === 0, 'guest: nic v databazi');

// smazání sešitu
award($db, $b, 'jednorozec', $today);
delete_user($db, $b);
check(user_by_slug($db, 'anicka-novakova-2') === null && (int) $db->query("SELECT COUNT(*) FROM stickers WHERE user_id = $b")->fetchColumn() === 0, 'smazani sesitu i nalepek');

// migrace ze starší verze: users (id, kind, name, streak)
$old = new PDO('sqlite::memory:');
$old->exec("CREATE TABLE users (id INTEGER PRIMARY KEY, kind TEXT NOT NULL, name TEXT NOT NULL, streak INTEGER NOT NULL DEFAULT 0)");
$old->exec("INSERT INTO users VALUES (1, 'holka', 'Terka', 7), (2, 'kluk', 'Kuba', 0)");
$old->exec("CREATE TABLE results (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id), day TEXT NOT NULL, module TEXT NOT NULL, difficulty TEXT NOT NULL, question TEXT NOT NULL, answer TEXT NOT NULL, tries INTEGER NOT NULL, solved INTEGER NOT NULL, points INTEGER NOT NULL)");
$old->exec("INSERT INTO results (user_id, day, module, difficulty, question, answer, tries, solved, points) VALUES (1, '$today', 'mala', 'lehke', '2 · 3', '6', 1, 1, 1)");
db_migrate_users($old);
$cols = array_column($old->query('PRAGMA table_info(users)')->fetchAll(PDO::FETCH_ASSOC), 'name');
check(in_array('slug', $cols, true) && !in_array('kind', $cols, true), 'migrace: kind -> slug');
$row = $old->query("SELECT slug, name, color, streak, pin_hash FROM users WHERE id = 1")->fetch(PDO::FETCH_ASSOC);
check($row === ['slug' => 'holka', 'name' => 'Terka', 'color' => 'ruzova', 'streak' => 7, 'pin_hash' => null], 'migrace: holka s prezdivkou, barvou, serii, bez PINu');
check((int) $old->query('SELECT COUNT(*) FROM results')->fetchColumn() === 1, 'migrace: vysledky zustaly');
check(str_contains($old->query("SELECT sql FROM sqlite_master WHERE name = 'results'")->fetchColumn(), 'REFERENCES users(id)'), 'migrace: cizi klice dal ukazuji na users');
$old->exec('PRAGMA foreign_keys = ON');
$old->exec("INSERT INTO results (user_id, day, module, difficulty, question, answer, tries, solved, points) VALUES (2, '$today', 'mala', 'lehke', '2 · 4', '8', 1, 1, 1)");
check(true, 'migrace: zapis s kontrolou cizich klicu projde');
check(count(users_state(db_open('sqlite::memory:'), $today)) === 0, 'cista databaze: zadne deti');
db_migrate_users($old);
check(true, 'migrace podruhe nic nedela');

// cesta appky z adresy (hosting může mít ve SCRIPT_NAME cestu na disku)
foreach (['/' => '/', '/novy/' => '/novy/', '/novy/api.php' => '/novy/', '/novy/admin.php?p=x' => '/novy/', '/novy/holka' => '/novy/',
          '/novy/u/anicka-2' => '/novy/', '/u/anicka' => '/', '/holka' => '/', '/api.php' => '/', '' => '/'] as $uri => $want) {
    $_SERVER['REQUEST_URI'] = $uri;
    check(app_path() === $want, "app_path($uri) = $want, je " . app_path());
}
unset($_SERVER['REQUEST_URI']);

// WAL na souborové databázi (v paměti ho SQLite neumí)
$f = sys_get_temp_dir() . '/matika-test-' . bin2hex(random_bytes(4)) . '.sqlite';
$fdb = db_open('sqlite:' . $f);
check(strtolower((string) $fdb->query('PRAGMA journal_mode')->fetchColumn()) === 'wal', 'souborova databaze bezi ve WAL');
$fdb = null;
foreach (glob("$f*") as $x) {
    unlink($x);
}

// adresa dítěte
set_slug($db, $a, 'Ela');
check(user_by_slug($db, 'ela')['id'] === $a, 'zmena adresy, mala pismena');
foreach (['Ela', 'žofie', 'a b', ''] as $bad) {
    $threw = false;
    try {
        set_slug($db, 1, $bad === 'Ela' ? 'ela' : $bad);
    } catch (InvalidArgumentException $e) {
        $threw = true;
    }
    check($threw, "adresa '$bad' odmitnuta (obsazena nebo neplatna)");
}

// WAL na souborové databázi (v paměti ho SQLite neumí)
$f = sys_get_temp_dir() . '/matika-test-' . bin2hex(random_bytes(4)) . '.sqlite';
$fdb = db_open('sqlite:' . $f);
check(strtolower((string) $fdb->query('PRAGMA journal_mode')->fetchColumn()) === 'wal', 'souborova databaze bezi ve WAL');
$fdb = null;
foreach (glob("$f*") as $x) {
    unlink($x);
}

// adresa dítěte
set_slug($db, $a, 'Ela');
check(user_by_slug($db, 'ela')['id'] === $a, 'zmena adresy, mala pismena');
foreach (['Ela', 'žofie', 'a b', ''] as $bad) {
    $threw = false;
    try {
        set_slug($db, 1, $bad === 'Ela' ? 'ela' : $bad);
    } catch (InvalidArgumentException $e) {
        $threw = true;
    }
    check($threw, "adresa '$bad' odmitnuta (obsazena nebo neplatna)");
}

// nahrazení databáze kopií jiné (VACUUM INTO): stejná data, zdroj beze změny
$src = sys_get_temp_dir() . '/matika-src-' . bin2hex(random_bytes(4)) . '.sqlite';
$s1 = db_open('sqlite:' . $src);
$s1->exec("INSERT INTO users (id, slug, name, color) VALUES (5, 'ela', 'Ela', 'ruzova')");
$s1 = null;
$dst = sys_get_temp_dir() . '/matika-dst-' . bin2hex(random_bytes(4)) . '.sqlite';
$s2 = new PDO('sqlite:' . $src);
$s2->exec('VACUUM INTO ' . $s2->quote($dst));
$s2 = null;
$d = db_open('sqlite:' . $dst);
check(user_by_slug($d, 'ela')['id'] === 5, 'kopie databaze ma stejna data');
$d = null;
foreach (array_merge(glob("$src*"), glob("$dst*")) as $x) {
    unlink($x);
}
