<?php
// Správa pro rodiče a učitele: třídy a jejich kódy, děti (nový PIN, přesun do
// třídy, smazání), přehled pro rodiče u každého dítěte a za třídu. Chrání ji
// HTTP basic auth s heslem z data/config.php (mimo repo):
//   <?php return ['admin_password' => 'tajne-heslo'];
// Bez hesla v configu správa nejde otevřít. Stránka je čisté PHP bez JS.
declare(strict_types=1);

foreach (['generators', 'explain', 'db', 'auth', 'game', 'rewards', 'usage'] as $f) {
    require __DIR__ . "/lib/$f.php";
}
date_default_timezone_set('Europe/Prague');
header('Cache-Control: no-store');

$password = (string) (config()['admin_password'] ?? '');
if ($password === '') {
    http_response_code(503);
    echo '<!doctype html><meta charset="utf-8"><title>Matika – správa</title><p style="font:18px system-ui;padding:24px">Správa není zapnutá. '
        . 'Na serveru vytvoř soubor <code>data/config.php</code> s obsahem <code>&lt;?php return [\'admin_password\' =&gt; \'tajne-heslo\'];</code></p>';
    exit;
}
if (!hash_equals($password, (string) ($_SERVER['PHP_AUTH_PW'] ?? ''))) {
    header('WWW-Authenticate: Basic realm="Matika – správa", charset="UTF-8"');
    http_response_code(401);
    echo 'Je potřeba heslo správce.';
    exit;
}

session_start(['cookie_httponly' => true, 'cookie_samesite' => 'Lax']);
$csrf = $_SESSION['admin_csrf'] ??= bin2hex(random_bytes(16));
$today = date('Y-m-d');
$db = db();
$h = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES);
$self = basename($_SERVER['SCRIPT_NAME']);

// ---------- akce (POST, pak přesměrování) ----------
$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals($csrf, (string) ($_POST['csrf'] ?? ''))) {
        http_response_code(400);
        exit('Formulář vypršel, zkus to znovu.');
    }
    $id = (int) ($_POST['id'] ?? 0);
    $back = (string) ($_POST['back'] ?? $self);
    try {
        switch ($_POST['do'] ?? '') {
            case 'add_class':
                add_class($db, (string) ($_POST['name'] ?? ''), (string) ($_POST['code'] ?? ''));
                $msg = 'Třída založená.';
                break;
            case 'class_rename':
                $db->prepare('UPDATE classes SET name = ? WHERE id = ?')->execute([clean_name((string) ($_POST['name'] ?? '')), $id]);
                $msg = 'Třída přejmenovaná.';
                break;
            case 'class_code':
                // nový kód: starý přestane platit, děti ve třídě zůstanou
                $code = class_code();
                $db->prepare('UPDATE classes SET code = ? WHERE id = ?')->execute([$code, $id]);
                $msg = "Nový kód třídy: $code";
                break;
            case 'class_delete':
                $db->prepare('UPDATE users SET class_id = NULL WHERE class_id = ?')->execute([$id]);
                $db->prepare('DELETE FROM classes WHERE id = ?')->execute([$id]);
                $msg = 'Třída smazaná, děti zůstaly bez třídy.';
                break;
            case 'pin':
                if (!user_exists($db, $id)) {
                    throw new InvalidArgumentException('Neznámé dítě.');
                }
                set_pin($db, $id, (string) ($_POST['pin'] ?? ''));
                $msg = 'PIN nastavený.';
                break;
            case 'rename':
                rename_user($db, $id, (string) ($_POST['name'] ?? ''));
                $msg = 'Přezdívka změněná.';
                break;
            case 'class_set':
                $cid = (int) ($_POST['class_id'] ?? 0) ?: null;
                $db->prepare('UPDATE users SET class_id = ? WHERE id = ?')->execute([$cid, $id]);
                $msg = 'Třída změněná.';
                break;
            case 'logout_all':
                $db->prepare('DELETE FROM tokens WHERE user_id = ?')->execute([$id]);
                $msg = 'Dítě je odhlášené ze všech zařízení.';
                break;
            case 'delete':
                if (!user_exists($db, $id)) {
                    throw new InvalidArgumentException('Neznámé dítě.');
                }
                delete_user($db, $id);
                $back = $self;
                $msg = 'Sešit smazaný.';
                break;
            default:
                throw new InvalidArgumentException('Neznámá akce.');
        }
    } catch (InvalidArgumentException $e) {
        $msg = 'Chyba: ' . $e->getMessage();
    }
    $_SESSION['admin_msg'] = $msg;
    header('Location: ' . (preg_match('~^[\w.?=&-]*$~', $back) ? $back : $self));
    exit;
}
$msg = (string) ($_SESSION['admin_msg'] ?? '');
unset($_SESSION['admin_msg']);

$page = (string) ($_GET['p'] ?? '');
$id = (int) ($_GET['id'] ?? 0);
$classes = classes($db);
$users = users_state($db, $today);
$byClass = [];
foreach ($users as $u) {
    $byClass[$u['class_id'] ?? 0][] = $u;
}
$v = fn(string $f): string => $f . '?v=' . filemtime(__DIR__ . '/' . $f);

function per_task_table(array $per, bool $kids = false): string
{
    $h = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES);
    if (!$per) {
        return '<p class="empty">Zatím nic.</p>';
    }
    $rows = '';
    foreach ($per as $p) {
        $rows .= '<tr><td>' . $h((MODULES[$p['module']]['title'] ?? $p['module']) . ' – ' . (DIFFICULTIES[$p['difficulty']] ?? $p['difficulty'])) . '</td>'
            . ($kids ? '<td class="num">' . (int) $p['kids'] . ' dětí</td>' : '')
            . '<td class="num">' . (int) $p['n'] . '×</td><td class="num">' . round($p['first'] / $p['n'] * 100) . ' % napoprvé</td></tr>';
    }
    return "<table class=\"table\">$rows</table>";
}
?>
<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="robots" content="noindex">
<title>Matika – správa</title>
<link rel="stylesheet" href="<?= $v('style.css') ?>">
<style>
.admin { max-width: 860px; margin: 0 auto; padding: 16px; }
.admin h1 { font-family: var(--hand); font-size: 34px; margin: 0 0 6px; }
.admin h2 { margin-top: 32px; }
.admin form.inline { display: inline-flex; gap: 6px; align-items: center; flex-wrap: wrap; margin: 4px 0; }
.admin input[type=text], .admin input[type=password], .admin select { font: inherit; font-size: 16px; padding: 6px 8px; border: 2px solid var(--line); border-radius: 4px; background: var(--sheet); color: var(--ink); max-width: 14em; }
.admin .btn { min-height: 38px; padding: 6px 14px; font-size: 15px; }
.admin .danger { color: var(--danger); }
.admin .msg { background: var(--notice-bg); color: var(--notice-ink); padding: 8px 12px; border-radius: 8px; margin: 10px 0; font-weight: 700; }
.admin .kid { display: inline-block; font-family: var(--hand); font-size: 24px; color: var(--kid); text-decoration: none; }
.admin code { background: var(--fn-bg); padding: 2px 6px; border-radius: 4px; font-size: 17px; letter-spacing: 1px; }
.admin .table td { vertical-align: top; }
.admin nav a { margin-right: 14px; }
</style>
</head>
<body class="admin">
<h1>Matika – správa</h1>
<nav><a class="link" href="<?= $self ?>">Třídy a děti</a><a class="link" href="./">Appka</a></nav>
<?php if ($msg !== ''): ?><p class="msg"><?= $h($msg) ?></p><?php endif; ?>

<?php if ($page === 'dite' && ($kid = user_rows($db, [$id])[0] ?? null)): ?>
  <?php $st = user_stats($db, $id, $today); $u = users_state($db, $today, [$id])[0]; ?>
  <h2><span class="kid" data-color="<?= $h($kid['color']) ?>"><?= $h($kid['name']) ?></span>
    <small>(<?= $h($kid['class_name'] ?: 'bez třídy') ?>, adresa <a class="link" href="<?= in_array($kid['slug'], ['holka', 'kluk'], true) ? $h($kid['slug']) : 'u/' . $h($kid['slug']) ?>">/<?= in_array($kid['slug'], ['holka', 'kluk'], true) ? '' : 'u/' ?><?= $h($kid['slug']) ?></a>)</small></h2>
  <p>Dnes <?= $u['today'] ?> b., týden <?= $u['week'] ?> b., celkem <?= $u['total'] ?> b., dnes vyřešeno <?= $u['solved_today'] ?> z <?= GOAL ?>, dní v řadě se splněným cílem: <?= $u['days'] ?: '–' ?>,
    dnes v appce <?= intdiv($u['time_today'], 60000) ?> min. Sešit založený <?= $h($kid['created'] ?: 'před zavedením sešitů') ?>.<?= $kid['has_pin'] ? '' : ' <b>Ještě nemá PIN</b> (nastaví si ho při prvním přihlášení, nebo ho nastav tady).' ?></p>
  <form method="post" class="inline"><input type="hidden" name="csrf" value="<?= $csrf ?>"><input type="hidden" name="do" value="pin"><input type="hidden" name="id" value="<?= $id ?>"><input type="hidden" name="back" value="<?= $self ?>?p=dite&amp;id=<?= $id ?>">
    <label>Nový PIN (<?= PIN_MIN ?>–<?= PIN_MAX ?> číslic) <input type="text" name="pin" inputmode="numeric" pattern="\d{<?= PIN_MIN ?>,<?= PIN_MAX ?>}" required></label> <button class="btn">Nastavit PIN</button></form><br>
  <form method="post" class="inline"><input type="hidden" name="csrf" value="<?= $csrf ?>"><input type="hidden" name="do" value="rename"><input type="hidden" name="id" value="<?= $id ?>"><input type="hidden" name="back" value="<?= $self ?>?p=dite&amp;id=<?= $id ?>">
    <label>Přezdívka <input type="text" name="name" value="<?= $h($kid['name']) ?>" maxlength="<?= NAME_MAX ?>" required></label> <button class="btn">Přejmenovat</button></form><br>
  <form method="post" class="inline"><input type="hidden" name="csrf" value="<?= $csrf ?>"><input type="hidden" name="do" value="class_set"><input type="hidden" name="id" value="<?= $id ?>"><input type="hidden" name="back" value="<?= $self ?>?p=dite&amp;id=<?= $id ?>">
    <label>Třída <select name="class_id"><option value="0">bez třídy</option>
    <?php foreach ($classes as $c): ?><option value="<?= $c['id'] ?>"<?= (int) $c['id'] === $kid['class_id'] ? ' selected' : '' ?>><?= $h($c['name']) ?></option><?php endforeach; ?>
    </select></label> <button class="btn">Přesunout</button></form><br>
  <form method="post" class="inline"><input type="hidden" name="csrf" value="<?= $csrf ?>"><input type="hidden" name="do" value="logout_all"><input type="hidden" name="id" value="<?= $id ?>"><input type="hidden" name="back" value="<?= $self ?>?p=dite&amp;id=<?= $id ?>">
    <button class="btn">Odhlásit ze všech zařízení</button></form>
  <form method="post" class="inline" onsubmit="return confirm('Opravdu smazat sešit <?= $h($kid['name']) ?> i se všemi body a nálepkami? Vrátit to nejde.')"><input type="hidden" name="csrf" value="<?= $csrf ?>"><input type="hidden" name="do" value="delete"><input type="hidden" name="id" value="<?= $id ?>">
    <button class="btn danger">Smazat sešit</button></form>
  <h3>Úspěšnost napoprvé</h3>
  <?= per_task_table($st['per_task']) ?>
  <h3>Co nejde (30 dní)</h3>
  <?php if ($st['hardest']): ?><div class="mistakes"><?php foreach ($st['hardest'] as $x): ?><div><span><?= $h($x['question']) ?></span><span class="right"><?= $h($x['answer']) ?></span></div><?php endforeach; ?></div>
  <?php else: ?><p class="empty">Žádné opakované chyby.</p><?php endif; ?>

<?php elseif ($page === 'trida'): ?>
  <?php $cls = null; foreach ($classes as $c) { if ((int) $c['id'] === $id) { $cls = $c; } } ?>
  <h2><?= $cls ? $h($cls['name']) : 'Bez třídy' ?></h2>
  <?php if ($cls): ?>
  <p>Kód třídy pro nové sešity: <code><?= $h($cls['code']) ?></code></p>
  <form method="post" class="inline"><input type="hidden" name="csrf" value="<?= $csrf ?>"><input type="hidden" name="do" value="class_rename"><input type="hidden" name="id" value="<?= $id ?>"><input type="hidden" name="back" value="<?= $self ?>?p=trida&amp;id=<?= $id ?>">
    <label>Název <input type="text" name="name" value="<?= $h($cls['name']) ?>" maxlength="<?= NAME_MAX ?>" required></label> <button class="btn">Přejmenovat</button></form>
  <form method="post" class="inline" onsubmit="return confirm('Vygenerovat nový kód? Starý přestane platit.')"><input type="hidden" name="csrf" value="<?= $csrf ?>"><input type="hidden" name="do" value="class_code"><input type="hidden" name="id" value="<?= $id ?>"><input type="hidden" name="back" value="<?= $self ?>?p=trida&amp;id=<?= $id ?>">
    <button class="btn">Nový kód</button></form>
  <form method="post" class="inline" onsubmit="return confirm('Smazat třídu? Děti zůstanou, jen bez třídy.')"><input type="hidden" name="csrf" value="<?= $csrf ?>"><input type="hidden" name="do" value="class_delete"><input type="hidden" name="id" value="<?= $id ?>">
    <button class="btn danger">Smazat třídu</button></form>
  <?php endif; ?>
  <h3>Co třídě nejde</h3>
  <?= per_task_table(class_stats($db, $cls ? $id : null), true) ?>
  <h3>Děti</h3>
  <table class="table"><tr><th>Dítě</th><th class="num">Dnes</th><th class="num">Týden</th><th class="num">Celkem</th><th class="num">Dní v řadě</th></tr>
  <?php foreach ($byClass[$cls ? $id : 0] ?? [] as $u): ?>
    <tr><td><a class="kid" data-color="<?= $h($u['color']) ?>" href="<?= $self ?>?p=dite&amp;id=<?= $u['id'] ?>"><?= $h($u['name']) ?></a></td><td class="num"><?= $u['today'] ?></td><td class="num"><?= $u['week'] ?></td><td class="num"><?= $u['total'] ?></td><td class="num"><?= $u['days'] ?: '–' ?></td></tr>
  <?php endforeach; ?></table>

<?php else: ?>
  <h2>Třídy</h2>
  <p>Nový sešit si dítě založí v appce („Nový sešit“) s kódem své třídy. Kód mu dej osobně, na web nepatří.</p>
  <table class="table"><tr><th>Třída</th><th>Kód</th><th class="num">Dětí</th></tr>
  <?php foreach ($classes as $c): ?>
    <tr><td><a class="link" href="<?= $self ?>?p=trida&amp;id=<?= $c['id'] ?>"><?= $h($c['name']) ?></a></td><td><code><?= $h($c['code']) ?></code></td><td class="num"><?= $c['kids'] ?></td></tr>
  <?php endforeach; ?>
  <?php if (!empty($byClass[0])): ?><tr><td><a class="link" href="<?= $self ?>?p=trida&amp;id=0">Bez třídy</a></td><td>–</td><td class="num"><?= count($byClass[0]) ?></td></tr><?php endif; ?>
  </table>
  <form method="post" class="inline"><input type="hidden" name="csrf" value="<?= $csrf ?>"><input type="hidden" name="do" value="add_class">
    <label>Nová třída <input type="text" name="name" placeholder="6.A" maxlength="<?= NAME_MAX ?>" required></label>
    <label>Kód (nepovinný, jinak náhodný) <input type="text" name="code" pattern="[A-Za-z0-9]{4,12}" maxlength="12"></label>
    <button class="btn">Založit třídu</button></form>

  <h2>Děti</h2>
  <?php foreach ([null, ...$classes] as $c): $cid = $c ? (int) $c['id'] : 0; if (empty($byClass[$cid])) { continue; } ?>
    <h3><a class="link" href="<?= $self ?>?p=trida&amp;id=<?= $cid ?>"><?= $c ? $h($c['name']) : 'Bez třídy' ?></a></h3>
    <table class="table"><tr><th>Dítě</th><th>Adresa</th><th class="num">Celkem</th><th class="num">Dní v řadě</th><th>PIN</th></tr>
    <?php foreach ($byClass[$cid] as $u): ?>
      <tr><td><a class="kid" data-color="<?= $h($u['color']) ?>" href="<?= $self ?>?p=dite&amp;id=<?= $u['id'] ?>"><?= $h($u['name']) ?></a></td>
      <td>/<?= in_array($u['slug'], ['holka', 'kluk'], true) ? '' : 'u/' ?><?= $h($u['slug']) ?></td><td class="num"><?= $u['total'] ?></td><td class="num"><?= $u['days'] ?: '–' ?></td>
      <td><?= $u['has_pin'] ? 'má' : '<b>chybí</b>' ?></td></tr>
    <?php endforeach; ?></table>
  <?php endforeach; ?>
<?php endif; ?>
</body>
</html>
