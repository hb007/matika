<?php
// Verze v adrese podle data změny: po nasazení prohlížeč nevezme starý JS/CSS
// z cache (staré app.js s novým HTML aplikaci rozbije).
header('Cache-Control: no-cache');
$v = fn(string $f): string => $f . '?v=' . filemtime(__DIR__ . '/' . $f);
require __DIR__ . '/lib/db.php';
// Adresa dítěte: /holka a /kluk (sešity ze starší verze), /u/<přezdívka> pro
// ostatní (přepis v .htaccess; lokální php -S sem pošle každou neexistující
// adresu). Kořen „/“ je úvodní obrazovka s výběrem sešitu.
$path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
$slug = preg_match('~(?:^|/)(?:u/)?([a-z0-9-]+)$~', $path, $m) && !str_ends_with($path, '.php') ? $m[1] : '';
$kid = null;
if ($slug !== '') {
    try {
        $kid = user_by_slug(db(), $slug);
    } catch (PDOException $e) {
        // bez databáze aspoň stránka
    }
}
// cesta ke kořenu appky: /u/anicka je o složku hlouběji, relativní adresy
// (app.js, api.php) proto jdou přes <base>; cesta z adresy, ne ze SCRIPT_NAME (lib/db.php)
$base = app_path();
$nick = $kid['name'] ?? '';
$color = $kid ? (COLORS[$kid['color']] ?? COLORS['modra']) : null;
?>
<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<base href="<?= htmlspecialchars($base, ENT_QUOTES) ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#fbfcfa">
<meta name="color-scheme" content="light dark">
<script>
// Motiv hned při načtení, ať neprobliká světlá verze: volba z menu
// (matika_theme: dark / light), jinak podle nastavení telefonu.
(function () {
  var t = null;
  try { t = localStorage.getItem('matika_theme'); } catch (e) {}
  var dark = t === 'dark' || (t !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  if (dark) document.querySelector('meta[name=theme-color]').setAttribute('content', '#15181d');
})();
</script>
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Matika<?= $nick !== '' ? ' ' . htmlspecialchars($nick, ENT_QUOTES) : '' ?>">
<meta name="format-detection" content="telephone=no">
<?php if ($kid): /* aplikaci na plochu nabízí jen stránka dítěte, viz manifest.php */ ?>
<link rel="manifest" href="manifest.php?kdo=<?= htmlspecialchars($kid['slug'], ENT_QUOTES) ?>">
<link rel="icon" href="icon.php?barva=<?= $kid['color'] ?>&amp;svg=1" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon.php?barva=<?= $kid['color'] ?>&amp;size=180">
<?php else: ?>
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-180.png">
<?php endif; ?>
<title>Matika</title>
<link rel="stylesheet" href="<?= $v('style.css') ?>">
</head>
<body<?= $kid ? ' data-slug="' . htmlspecialchars($kid['slug'], ENT_QUOTES) . '" data-color="' . $kid['color'] . '"' : '' ?>>
<header class="top">
  <a href="./" class="brand" id="brand">Matika</a>
  <div class="account">
    <button type="button" class="me" id="me" aria-haspopup="true" aria-expanded="false" aria-controls="me-menu" hidden></button>
    <nav class="task-menu me-menu" id="me-menu" aria-label="Účet" hidden>
      <div id="me-other"></div>
      <button type="button" class="task-item link-ink" data-stats>Výsledky a body</button>
      <button type="button" class="task-item link-ink" data-games>Hry</button>
      <button type="button" class="task-item link-ink" data-theme-toggle>Motiv: podle telefonu</button>
      <button type="button" class="task-item link-ink" data-fx-toggle>Efekty: zapnuté</button>
    </nav>
  </div>
  <div class="task">
    <button type="button" class="task-btn" id="btn-task" aria-haspopup="true" aria-expanded="false" aria-controls="task-menu" hidden>
      <span id="task-name"></span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <nav class="task-menu" id="task-menu" aria-label="Úlohy" hidden>
      <div id="task-list"></div>
      <div class="task-sep" aria-hidden="true"></div>
      <div id="task-other"></div>
      <button type="button" class="task-item link-ink" data-stats>Výsledky a body</button>
      <button type="button" class="task-item link-ink" data-games>Hry</button>
      <button type="button" class="task-item link-ink" data-theme-toggle>Motiv: podle telefonu</button>
      <button type="button" class="task-item link-ink" data-fx-toggle>Efekty: zapnuté</button>
    </nav>
  </div>
</header>

<main id="app">
  <div class="offline-bar" id="offline-bar" role="status" hidden></div>
  <div class="time-bar" id="time-bar" role="status" hidden></div>

  <!-- úvod: na zařízení bez účtu uvítání a „Zkusit hned“, jinak desky sešitů
       dětí přihlášených na tomhle zařízení (klepnutí otevře rovnou dítě) -->
  <section id="screen-who" class="screen" hidden>
    <div id="welcome" hidden>
      <h1>Pojď si zacvičit matiku</h1>
      <p class="lead">Pro 2. stupeň: násobilka, zlomky, desetinná čísla, procenta, rovnice, římské číslice a další. Příklad za příkladem, s nápovědou po krocích.</p>
      <p class="lead">S účtem sbíráš body a nálepky<?= BOARD ? ', soutěžíš se třídou' : '' ?> a za splněný denní cíl máš hry.</p>
      <div class="who-more">
        <button type="button" class="btn big" data-login="guest">Zkusit hned</button>
        <span class="who-note">bez účtu, body se neukládají</span>
      </div>
      <div class="who-more">
        <button type="button" class="ghostbtn" data-login="other">Mám účet</button>
        <button type="button" class="ghostbtn" data-login="register">Založit účet</button>
      </div>
    </div>
    <div id="who-known" hidden>
      <h1>Kdo dnes cvičí?</h1>
      <div class="covers" id="who-pick"></div>
      <div class="who-more">
        <button type="button" class="btn" data-login="other">Přihlásit se</button>
        <button type="button" class="btn" data-login="register">Založit účet</button>
        <button type="button" class="ghostbtn" data-login="guest">Zkusit bez účtu</button>
      </div>
    </div>
  </section>

  <!-- přihlášení: PIN k účtu, přihlášení (přezdívka + PIN), nový účet -->
  <section id="screen-login" class="screen" hidden>
    <form id="form-login" class="login" autocomplete="off"></form>
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

  <!-- hry: rozcestník (odměna za denní cíl, s limitem her a času) -->
  <section id="screen-games" class="screen" hidden>
    <h1>Hry</h1>
    <p class="games-info" id="games-info"></p>
    <div class="games" id="games-list"></div>
    <button type="button" class="btn" id="btn-random-game">Náhodná hra</button>
    <p><button type="button" class="link" data-go="back">Zpět k příkladům</button></p>
  </section>

  <!-- jedna hra (snake.js, pexeso.js, g2048.js, breakout.js, flappy.js) -->
  <section id="screen-game" class="screen" hidden>
    <div class="game-head">
      <h1 id="game-title"></h1>
      <span class="game-score"><span id="game-score-label"></span> <b id="game-score">0</b> · rekord <b id="game-best">0</b></span>
    </div>
    <div class="game-wrap">
      <div class="game-stage" id="game-stage" aria-label="Herní plocha"></div>
      <div class="game-overlay" id="game-overlay">
        <p id="game-msg"></p>
        <button type="button" class="btn" id="game-start">Hrát</button>
      </div>
    </div>
    <div class="game-pad" id="game-pad" aria-label="Ovládání">
      <button type="button" class="pad" data-dir="up" aria-label="Nahoru" style="grid-area: up">▲</button>
      <button type="button" class="pad" data-dir="left" aria-label="Doleva" style="grid-area: left">◀</button>
      <button type="button" class="pad" data-dir="down" aria-label="Dolů" style="grid-area: down">▼</button>
      <button type="button" class="pad" data-dir="right" aria-label="Doprava" style="grid-area: right">▶</button>
    </div>
    <p class="games-info" id="game-limit"></p>
    <button type="button" class="link" id="btn-games-back">Zpět ke hrám</button>
  </section>

  <!-- výsledky: moje body, žebříček třídy a všech, album, přehled pro rodiče -->
  <section id="screen-stats" class="screen" hidden>
    <div class="screen-head"><h1>Výsledky</h1><button type="button" class="btn" data-go="back">Zpět k příkladům</button></div>
    <table class="table" id="compare"></table>
    <div class="me-actions" id="me-actions"></div>
    <div class="invite" id="invite" hidden></div>
    <div id="board-wrap"<?= BOARD ? '' : ' hidden' ?>>
    <h2>Žebříček</h2>
    <div class="tabs" id="board-scope" role="tablist" aria-label="Kdo"></div>
    <div class="tabs" id="board-range" role="tablist" aria-label="Období"></div>
    <div id="board"></div>
    <div id="card" class="card" hidden></div>
    </div>
    <h2>Album nálepek</h2>
    <div id="album"></div>
    <h2>Přehled pro rodiče</h2>
    <div id="parent"></div>
    <button type="button" class="link" data-go="back">Zpět k příkladům</button>
  </section>
</main>
<!-- upozornění na čas v appce (app.js, „čas v appce“) -->
<div class="time-warn" id="time-warn" role="alertdialog" aria-modal="true" aria-labelledby="time-warn-text" hidden>
  <div class="time-warn-box">
    <div class="time-warn-icon" aria-hidden="true">⏰</div>
    <p class="time-warn-big" id="time-warn-text"></p>
    <p>Dej si pauzu: jdi ven, protáhni se, napij se.</p>
    <button type="button" class="btn" id="time-warn-ok">Rozumím</button>
  </div>
</div>
<script src="<?= $v('paper.js') ?>"></script>
<script src="<?= $v('offline.js') ?>"></script>
<script src="<?= $v('usage.js') ?>"></script>
<script src="<?= $v('gamekit.js') ?>"></script>
<script src="<?= $v('rewards.js') ?>"></script>
<script src="<?= $v('snake.js') ?>"></script>
<script src="<?= $v('g2048.js') ?>"></script>
<script src="<?= $v('pexeso.js') ?>"></script>
<script src="<?= $v('breakout.js') ?>"></script>
<script src="<?= $v('flappy.js') ?>"></script>
<script src="<?= $v('app.js') ?>"></script>
</body>
</html>
