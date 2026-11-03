<?php
// Heslo správce (data/config.php, admin_password) a přihlášení formulářem do
// session. Používá ho správa (admin.php) i stránka se všemi hrami (hry.php);
// session je společná, kdo je přihlášený v jedné, je i ve druhé.
// admin_gate() bez přihlášení vypíše formulář s heslem a skončí.
declare(strict_types=1);

function admin_gate(string $self, string $title): void
{
    $password = (string) (config()['admin_password'] ?? '');
    if ($password === '') {
        http_response_code(503);
        echo '<!doctype html><meta charset="utf-8"><title>Matika – správa</title><p style="font:18px system-ui;padding:24px">Správa není zapnutá. '
            . 'Na serveru vytvoř soubor <code>data/config.php</code> s obsahem <code>&lt;?php return [\'admin_password\' =&gt; \'tajne-heslo\'];</code></p>';
        exit;
    }
    session_start(session_options());   // název podle cesty, úložiště v data/sessions (lib/db.php)
    $h = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES);

    // Přihlášení formulářem (ne HTTP basic auth: některé hostingy pod CGI/FastCGI
    // hlavičku WWW-Authenticate zahodí a prohlížeč se na heslo nezeptá).
    // Špatné heslo brzdí vteřinová pauza a po 5 pokusech minuta zámek v session.
    // Přihlášení platí ADMIN_DAYS od poslední návštěvy: admin_ok je čas návštěvy
    // a cookie session se při každé návštěvě prodlouží (jinak by zmizela se
    // zavřením prohlížeče, což mobil dělá často).
    $adminCookie = function (): void {
        $p = session_get_cookie_params();
        setcookie(session_name(), session_id(), ['expires' => time() + ADMIN_DAYS * 86400, 'path' => $p['path'],
            'secure' => $p['secure'], 'httponly' => true, 'samesite' => 'Lax']);
    };
    if (!empty($_SESSION['admin_ok'])) {
        if ($_SESSION['admin_ok'] !== true && time() - (int) $_SESSION['admin_ok'] > ADMIN_DAYS * 86400) {
            unset($_SESSION['admin_ok']);
        } else {
            $_SESSION['admin_ok'] = time();
            $adminCookie();
        }
    }
    if (($_POST['do'] ?? '') === 'odhlasit') {
        unset($_SESSION['admin_ok']);
        header('Location: ' . $self);
        exit;
    }
    $loginError = '';
    if (empty($_SESSION['admin_ok']) && isset($_POST['password'])) {
        if (($_SESSION['admin_until'] ?? 0) > time()) {
            $loginError = 'Moc pokusů, zkus to za minutu.';
        } elseif (hash_equals($password, (string) $_POST['password'])) {
            session_regenerate_id(true);   // nové id po přihlášení (proti podstrčené session)
            $_SESSION['admin_ok'] = time();
            $_SESSION['admin_fails'] = 0;
            $adminCookie();
            header('Location: ' . $self . '?prihlaseno=1');
            exit;
        } else {
            sleep(1);
            $_SESSION['admin_fails'] = ($_SESSION['admin_fails'] ?? 0) + 1;
            if ($_SESSION['admin_fails'] >= 5) {
                $_SESSION['admin_fails'] = 0;
                $_SESSION['admin_until'] = time() + 60;
            }
            $loginError = 'Špatné heslo.';
        }
    }
    if (empty($_SESSION['admin_ok'])) {
        // proč to nešlo, když heslo sedělo: session se neuložila, nebo formulář nedorazil
        if (isset($_GET['prihlaseno'])) {
            $loginError = 'Heslo sedělo, ale přihlášení se neudrželo: server neuložil session (složka ' . $h(ini_get('session.save_path') ?: 'výchozí')
                . ') nebo prohlížeč nepřijal cookie „' . $h(session_name()) . '“.';
        } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_POST['password'])) {
            $loginError = 'Formulář nedorazil (server POST přesměroval). Otevři přímo ' . $h($self) . '.';
        }
        http_response_code($loginError !== '' ? 403 : 200);
        echo '<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">'
            . '<title>' . $h($title) . '</title><link rel="stylesheet" href="style.css"></head><body style="max-width:420px;margin:0 auto;padding:16px">'
            . '<h1 style="font-family:var(--hand);font-weight:400;color:var(--pen)">' . $h($title) . '</h1>'
            . '<form method="post" action="' . $h($self) . '" class="login"><label class="field"><span>Heslo správce</span><input type="password" name="password" autocomplete="current-password" autofocus required></label>'
            . ($loginError !== '' ? '<p class="login-error">' . $h($loginError) . '</p>' : '')
            . '<div class="login-actions"><button class="btn">Přihlásit</button><a href="./" class="ghostbtn btn-link">Zpět do appky</a></div></form></body></html>';
        exit;
    }
}
