<?php
// Instalace Matiky na hosting. Otevři https://tvuj-web/…/install.php,
// projdi formulář a po úspěchu se skript sám smaže.
//
// Záměrně psáno bez novinek z PHP 8, aby i na starém PHP ukázal srozumitelnou
// chybu místo bílé stránky.

$root = __DIR__;
$localConfig = $root . '/config.local.php';

function h($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }

function page($title, $body)
{
    echo '<!doctype html><html lang="cs"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<title>' . h($title) . '</title><style>'
        . 'body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#f4f6fb;color:#1f2a44;margin:0;padding:24px 16px;line-height:1.45}'
        . 'main{max-width:620px;margin:0 auto;background:#fff;border-radius:14px;padding:22px 22px 26px;box-shadow:0 2px 8px rgba(31,42,68,.06)}'
        . 'h1{font-size:26px;margin:0 0 14px}h2{font-size:18px;margin:22px 0 8px}'
        . 'ul.checks{list-style:none;padding:0;margin:0}ul.checks li{padding:6px 0;border-bottom:1px solid #eef1f7}'
        . '.ok{color:#1f9d55;font-weight:700}.bad{color:#d64545;font-weight:700}.warn{color:#b26b00;font-weight:700}'
        . 'label{display:block;margin:12px 0 4px;font-weight:600}input[type=text],input[type=password]{width:100%;box-sizing:border-box;font-size:17px;padding:10px 12px;border:2px solid #d5dbea;border-radius:10px}'
        . '.choice{display:flex;gap:10px;align-items:flex-start;margin:8px 0;font-weight:500}.choice input{margin-top:5px}'
        . 'button{margin-top:20px;border:0;border-radius:12px;background:#3b6cf6;color:#fff;font-size:18px;font-weight:700;padding:12px 24px;cursor:pointer}'
        . '.note{color:#6b7a99;font-size:15px}.box{background:#fde8e8;color:#a33;border-radius:10px;padding:10px 14px;margin:12px 0}'
        . '.okbox{background:#e4f7ec;color:#17643a;border-radius:10px;padding:10px 14px;margin:12px 0}'
        . '#mysql{border-left:3px solid #d5dbea;padding-left:14px;margin-top:6px}'
        . '</style></head><body><main>' . $body . '</main></body></html>';
    exit;
}

// ---------- už nainstalováno ----------
if (is_file($localConfig)) {
    page('Matika je nainstalovaná', '<h1>Matika už je nainstalovaná</h1>'
        . '<p>Nastavení je uložené v souboru <code>config.local.php</code>. Pokud chceš instalovat znovu, '
        . 'smaž ho přes FTP a otevři tuhle stránku znovu.</p>'
        . '<p><b>Tenhle soubor (install.php) už můžeš smazat.</b></p><p><a href="./">Otevřít Matiku →</a></p>');
}

// ---------- kontrola hostingu ----------
$checks = array();
$fatal = false;
$phpOk = PHP_VERSION_ID >= 80100;
$checks[] = array($phpOk ? 'ok' : 'bad', 'PHP ' . PHP_VERSION . ($phpOk ? '' : ' – potřeba je PHP 8.1 nebo novější (dá se přepnout v administraci hostingu)'));
$fatal = $fatal || !$phpOk;
$hasPdo = class_exists('PDO');
$drivers = $hasPdo ? PDO::getAvailableDrivers() : array();
$hasSqlite = in_array('sqlite', $drivers, true);
$hasMysql = in_array('mysql', $drivers, true);
$checks[] = array($hasSqlite ? 'ok' : 'warn', 'SQLite ' . ($hasSqlite ? 'je k dispozici' : 'chybí – bude potřeba MySQL'));
$checks[] = array($hasMysql ? 'ok' : 'warn', 'MySQL ' . ($hasMysql ? 'je k dispozici' : 'chybí'));
if (!$hasSqlite && !$hasMysql) {
    $fatal = true;
    $checks[] = array('bad', 'Není dostupná žádná databáze (PDO SQLite ani PDO MySQL).');
}
$mb = function_exists('mb_strlen');
$checks[] = array($mb ? 'ok' : 'bad', 'Rozšíření mbstring ' . ($mb ? 'je k dispozici' : 'chybí'));
$fatal = $fatal || !$mb;
$canWriteRoot = is_writable($root);
$checks[] = array($canWriteRoot ? 'ok' : 'bad', 'Zápis do složky appky ' . ($canWriteRoot ? 'je povolený' : 'NENÍ povolený – nastav práva složky na 755 nebo 775'));
$fatal = $fatal || !$canWriteRoot;
$dataDir = $root . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0775, true);
}
$canWriteData = is_dir($dataDir) && is_writable($dataDir);
$checks[] = array($canWriteData ? 'ok' : ($hasMysql ? 'warn' : 'bad'), 'Zápis do složky data/ ' . ($canWriteData ? 'je povolený' : 'NENÍ povolený (pro SQLite nutné)'));
$sqliteUsable = $hasSqlite && $canWriteData;
$apache = isset($_SERVER['SERVER_SOFTWARE']) && stripos($_SERVER['SERVER_SOFTWARE'], 'apache') !== false;

function checksHtml($checks)
{
    $icons = array('ok' => '✔', 'warn' => '!', 'bad' => '✘');
    $out = '<ul class="checks">';
    foreach ($checks as $c) {
        $out .= '<li><span class="' . $c[0] . '">' . $icons[$c[0]] . '</span> ' . h($c[1]) . '</li>';
    }
    return $out . '</ul>';
}

// ---------- odeslaný formulář ----------
$error = '';
$v = array('db' => $sqliteUsable ? 'sqlite' : 'mysql', 'host' => 'localhost', 'name' => '', 'user' => '', 'pass' => '', 'access' => '');
if (!$fatal && $_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach ($v as $k => $_) {
        if (isset($_POST[$k])) {
            $v[$k] = trim((string) $_POST[$k]);
        }
    }
    $config = array();
    try {
        if ($v['db'] === 'sqlite') {
            if (!$sqliteUsable) {
                throw new Exception('SQLite tady nejde použít, zvol MySQL.');
            }
            // náhodný název souboru: databáze se nedá stáhnout ani tam, kde nefunguje .htaccess
            $file = $dataDir . '/matika-' . bin2hex(random_bytes(8)) . '.sqlite';
            $config['dsn'] = 'sqlite:' . $file;
            $pdo = new PDO($config['dsn'], null, null, array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION));
            $pdo = null;
        } else {
            if (!$hasMysql) {
                throw new Exception('MySQL tady není k dispozici.');
            }
            if ($v['name'] === '' || $v['user'] === '') {
                throw new Exception('Vyplň název databáze a uživatele.');
            }
            $config['dsn'] = 'mysql:host=' . $v['host'] . ';dbname=' . $v['name'] . ';charset=utf8mb4';
            $config['user'] = $v['user'];
            $config['pass'] = $v['pass'];
            $pdo = new PDO($config['dsn'], $config['user'], $config['pass'], array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION));
            $sql = preg_replace('/^\s*--.*$/m', '', file_get_contents($root . '/schema.sql'));
            foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
                $pdo->exec($stmt);
            }
        }
        if ($v['access'] !== '') {
            $config['access_hash'] = password_hash($v['access'], PASSWORD_DEFAULT);
        }
        $php = "<?php\n// Vygeneroval install.php " . date('Y-m-d H:i') . ". Nesdílej, obsahuje přístup k databázi.\nreturn "
            . var_export($config, true) . ";\n";
        if (file_put_contents($localConfig, $php, LOCK_EX) === false) {
            throw new Exception('Nepodařilo se zapsat config.local.php.');
        }
        @chmod($localConfig, 0640);
        // ověření celé appky: připojení přes její vlastní kód (u SQLite založí tabulky)
        require $root . '/lib/db.php';
        db()->query('SELECT COUNT(*) FROM users')->fetchColumn();
    } catch (Throwable $e) {
        @unlink($localConfig);
        $msg = $e->getMessage();
        if ($e instanceof PDOException) {
            $msg = 'Databáze odmítla připojení: ' . $msg;
        }
        $error = $msg;
    }
    if ($error === '') {
        $deleted = @unlink(__FILE__);
        page('Hotovo', '<h1>Hotovo 🎉</h1><div class="okbox">Matika je nainstalovaná'
            . ($v['db'] === 'sqlite' ? ' (databáze SQLite ve složce data/)' : ' (databáze MySQL ' . h($v['name']) . ')') . '.</div>'
            . ($v['access'] !== '' ? '<p>Při prvním otevření se Matika zeptá na heslo, které jsi zadal(a). Každé zařízení si ho pak pamatuje.</p>' : '')
            . ($deleted ? '<p class="note">Instalační skript se sám smazal.</p>'
                        : '<div class="box"><b>Smaž soubor install.php přes FTP.</b> Sám se smazat nedokázal.</div>')
            . '<p><a href="./">Otevřít Matiku →</a></p>');
    }
}

// ---------- formulář ----------
$body = '<h1>Instalace Matiky</h1><h2>Kontrola hostingu</h2>' . checksHtml($checks);
if (!$apache) {
    $body .= '<p class="note">Server není Apache, takže ochrana souborů přes .htaccess nemusí platit. '
        . 'Databáze SQLite dostane náhodný název, takže ji nikdo neuhodne.</p>';
}
if ($fatal) {
    page('Instalace Matiky', $body . '<div class="box">Hosting zatím nesplňuje požadavky. Oprav červené body a obnov stránku.</div>');
}
if ($error !== '') {
    $body .= '<div class="box">' . h($error) . '</div>';
}
$sel = function ($x) use ($v) { return $v['db'] === $x ? ' checked' : ''; };
$body .= '<form method="post"><h2>Databáze</h2>';
if ($sqliteUsable) {
    $body .= '<label class="choice"><input type="radio" name="db" value="sqlite"' . $sel('sqlite') . ' onchange="m()"> '
        . '<span><b>SQLite – doporučeno.</b> Nic nezakládáš, databáze je soubor ve složce data/.</span></label>';
}
if ($hasMysql) {
    $body .= '<label class="choice"><input type="radio" name="db" value="mysql"' . $sel('mysql') . ' onchange="m()"> '
        . '<span><b>MySQL / MariaDB.</b> Databázi a uživatele nejdřív založ v administraci hostingu.</span></label>'
        . '<div id="mysql">'
        . '<label>Server</label><input type="text" name="host" value="' . h($v['host']) . '">'
        . '<label>Název databáze</label><input type="text" name="name" value="' . h($v['name']) . '">'
        . '<label>Uživatel</label><input type="text" name="user" value="' . h($v['user']) . '" autocomplete="off">'
        . '<label>Heslo k databázi</label><input type="password" name="pass" value="" autocomplete="new-password">'
        . '</div>';
}
$body .= '<h2>Přístupové heslo (nepovinné)</h2>'
    . '<p class="note">Když ho vyplníš, Matika se při prvním otevření na každém zařízení zeptá na heslo. '
    . 'Hodí se, když je web veřejně na internetu. Nech prázdné, pokud heslo nechceš.</p>'
    . '<input type="password" name="access" value="" autocomplete="new-password" placeholder="např. heslo pro rodinu">'
    . '<button type="submit">Nainstalovat</button></form>'
    . '<script>function m(){var s=document.querySelector("input[name=db]:checked"),b=document.getElementById("mysql");'
    . 'if(b)b.style.display=s&&s.value==="mysql"?"block":"none";}m();</script>';
page('Instalace Matiky', $body);
