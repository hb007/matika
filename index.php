<?php
// Verze v adrese podle data změny: po nasazení prohlížeč nevezme starý JS/CSS
// z cache (staré app.js s novým HTML aplikaci rozbije).
header('Cache-Control: no-cache');
$v = fn(string $f): string => $f . '?v=' . filemtime(__DIR__ . '/' . $f);
// /holka a /kluk otevřou rovnou profil dítěte (přepis v .htaccess; lokální
// php -S sem pošle každou neexistující adresu).
$kid = basename((string) parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH));
$kid = in_array($kid, ['holka', 'kluk'], true) ? $kid : '';
$icon = $kid ? "icon-$kid" : 'icon';
// název ikony na ploše (iOS ho bere odsud) podle přezdívky dítěte
$nick = '';
if ($kid) {
    require __DIR__ . '/lib/db.php';
    try {
        $nick = kid_name(db(), $kid);
    } catch (PDOException $e) {
        // bez databáze aspoň výchozí jméno
    }
    $nick = $nick !== '' ? $nick : ucfirst($kid);
}
?>
<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#fbfcfa">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="<?= $nick !== '' ? htmlspecialchars($nick, ENT_QUOTES) : 'Matika' ?>">
<meta name="format-detection" content="telephone=no">
<link rel="manifest" href="manifest.php<?= $kid ? "?kdo=$kid" : '' ?>">
<title>Matika</title>
<link rel="icon" href="<?= $icon ?>.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="<?= $icon ?>-180.png">
<link rel="stylesheet" href="<?= $v('style.css') ?>">
</head>
<body<?= $kid ? " data-kid=\"$kid\"" : '' ?>>
<header class="top">
  <a href="./" class="brand" id="brand">Matika</a>
  <span class="me" id="me" hidden></span>
  <div class="task">
    <button type="button" class="task-btn" id="btn-task" aria-haspopup="true" aria-expanded="false" aria-controls="task-menu" hidden>
      <span id="task-name"></span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <nav class="task-menu" id="task-menu" aria-label="Úlohy" hidden>
      <div id="task-list"></div>
      <div class="task-sep" aria-hidden="true"></div>
      <div id="task-other"></div>
      <button type="button" class="task-item link-ink" id="btn-stats">Výsledky a body</button>
    </nav>
  </div>
</header>

<main id="app">

  <!-- kdo cvičí -->
  <section id="screen-who" class="screen" hidden>
    <h1>Kdo dnes cvičí?</h1>
    <div class="covers" id="who-pick"></div>
  </section>

  <!-- příklad -->
  <section id="screen-round" class="screen" hidden>
    <div class="controls" id="controls">
      <div class="levels" id="chips" aria-label="Úroveň"></div>
      <div class="diffs" id="diffs" aria-label="Obtížnost"></div>
    </div>
    <div class="round-grid">
      <div class="round-main">
        <div class="review-badge" id="review" hidden>Tenhle ti minule nešel, zkus ho znovu</div>
        <div class="question" id="question"></div>
        <form id="form-answer" class="answer">
          <div id="inputs"></div>
          <button type="submit" class="btn" id="btn-submit">Hotovo</button>
        </form>
        <div id="feedback" class="feedback" hidden></div>
        <div class="hintbox">
          <ol id="hints" class="hints" hidden></ol>
          <div class="hint-actions">
            <button type="button" class="hintbtn" id="btn-hint">Nápověda</button>
            <button type="button" class="ghostbtn" id="btn-reveal" hidden>Ukázat výsledek</button>
          </div>
          <span id="hint-info" class="hint-info"></span>
        </div>
        <div id="keypad" class="keypad" hidden></div>
      </div>
      <div class="round-side paper-wrap">
        <div class="paper-bar">
          <span class="goal-text" id="goal-text"></span>
          <button type="button" class="link" id="btn-paper">Papír na počítání</button>
          <span class="tools" id="paper-tools" hidden>
            <button type="button" class="tool on" data-tool="pen" title="Pero" aria-label="Pero"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg></button>
            <button type="button" class="tool" data-tool="eraser" title="Guma" aria-label="Guma"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg></button>
            <button type="button" class="tool" id="paper-undo" title="Zpět" aria-label="Zpět"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg></button>
            <button type="button" class="tool" id="paper-clear" title="Smazat vše" aria-label="Smazat vše"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/></svg></button>
          </span>
        </div>
        <div class="paper" id="paper" hidden><canvas id="paper-canvas"></canvas></div>
      </div>
    </div>
  </section>

  <!-- výsledky -->
  <section id="screen-stats" class="screen" hidden>
    <h1>Výsledky</h1>
    <table class="table" id="compare"></table>
    <h2>Přehled pro rodiče</h2>
    <div id="parent"></div>
    <button type="button" class="link" data-go="back">Zpět k příkladům</button>
  </section>
</main>
<script src="<?= $v('paper.js') ?>"></script>
<script src="<?= $v('app.js') ?>"></script>
</body>
</html>
