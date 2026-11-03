<?php
// Samostatná stránka se všemi hrami (adresa /hry): bez přihlášení, bez
// denního cíle a limitu her. Z appky na ni nevede odkaz. Seznam her je
// v games.js, ovládání v hry.js.
header('Cache-Control: no-cache');
$v = fn(string $f): string => $f . '?v=' . filemtime(__DIR__ . '/' . $f);
$games = ['gamekit.js', 'snake.js', 'g2048.js', 'pexeso.js', 'breakout.js', 'flappy.js', 'pacman.js', 'slova.js', 'games.js', 'hry.js'];
?>
<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#fbfcfa">
<meta name="color-scheme" content="light dark">
<meta name="robots" content="noindex">
<script>
(function () {
  var t = null;
  try { t = localStorage.getItem('matika_theme'); } catch (e) {}
  var dark = t === 'dark' || (t !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  if (dark) document.querySelector('meta[name=theme-color]').setAttribute('content', '#15181d');
})();
</script>
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-180.png">
<title>Hry · Matika</title>
<link rel="stylesheet" href="<?= $v('style.css') ?>">
</head>
<body>
<header class="top">
  <a href="hry.php" class="brand">Hry</a>
</header>
<main>
  <section id="screen-games" class="screen">
    <h1>Všechny hry</h1>
    <p class="games-info">Vyber si hru. Hraje se bez limitu.</p>
    <div class="games" id="games-list"></div>
  </section>

  <section id="screen-game" class="screen" hidden>
    <div class="game-head">
      <h1 id="game-title"></h1>
      <span class="game-score"><span id="game-score-label"></span> <b id="game-score">0</b> · rekord <b id="game-best">0</b></span>
    </div>
    <div class="game-wrap">
      <div class="game-stage" id="game-stage" aria-label="Herní plocha"></div>
      <div class="game-overlay" id="game-overlay">
        <p id="game-msg"></p>
        <div class="game-variants" id="game-variants" role="group" aria-label="Obtížnost" hidden></div>
        <button type="button" class="btn" id="game-start">Hrát</button>
      </div>
    </div>
    <div class="game-pad" id="game-pad" aria-label="Ovládání">
      <button type="button" class="pad" data-dir="up" aria-label="Nahoru" style="grid-area: up">▲</button>
      <button type="button" class="pad" data-dir="left" aria-label="Doleva" style="grid-area: left">◀</button>
      <button type="button" class="pad" data-dir="down" aria-label="Dolů" style="grid-area: down">▼</button>
      <button type="button" class="pad" data-dir="right" aria-label="Doprava" style="grid-area: right">▶</button>
    </div>
    <button type="button" class="btn game-pause" id="game-pause" disabled>Pauza</button>
    <p><button type="button" class="link" id="btn-games-back">Zpět ke hrám</button></p>
  </section>
</main>
<?php foreach ($games as $f): ?>
<script src="<?= $v($f) ?>"></script>
<?php endforeach; ?>
</body>
</html>
