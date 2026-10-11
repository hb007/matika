<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#3b6cf6">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Matika">
<meta name="format-detection" content="telephone=no">
<link rel="manifest" href="manifest.json">
<title>Matika</title>
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="top">
  <a href="#" class="brand" data-go="menu">Matika</a>
</header>

<main id="app">

  <!-- menu modulů -->
  <section id="screen-menu" class="screen">
    <h1>Co procvičíš?</h1>
    <div class="modules" id="modules"></div>
  </section>

  <!-- výběr úrovně -->
  <section id="screen-level" class="screen" hidden>
    <h1 id="level-title"></h1>
    <div class="levels" id="levels"></div>
    <button class="link" data-go="menu">← Zpět</button>
  </section>

  <!-- příklad -->
  <section id="screen-round" class="screen" hidden>
    <div class="meta" id="task"></div>
    <div class="round-grid">
      <div class="round-main">
        <div class="question" id="question"></div>
        <form id="form-answer" class="answer">
          <div id="inputs"></div>
          <button type="submit" class="btn" id="btn-submit">Hotovo</button>
        </form>
        <div id="keypad" class="keypad" hidden></div>
        <div id="feedback" class="feedback" hidden></div>
        <div class="hintbox">
          <ol id="hints" class="hints" hidden></ol>
          <button type="button" class="hintbtn" id="btn-hint">Nápověda</button>
          <span id="hint-info" class="hint-info"></span>
        </div>
      </div>
      <div class="round-side paper-wrap">
        <div class="paper-bar">
          <button type="button" class="link" id="btn-paper">✏️ Papír na počítání</button>
          <span class="tools" id="paper-tools" hidden>
            <button type="button" class="tool on" data-tool="pen" title="Pero" aria-label="Pero">✏️</button>
            <button type="button" class="tool" data-tool="eraser" title="Guma" aria-label="Guma">🧽</button>
            <button type="button" class="tool" id="paper-undo" title="Zpět" aria-label="Zpět">↶</button>
            <button type="button" class="tool" id="paper-clear" title="Smazat vše" aria-label="Smazat vše">🗑</button>
          </span>
        </div>
        <div class="paper" id="paper" hidden><canvas id="paper-canvas"></canvas></div>
      </div>
    </div>
    <button class="link small" data-go="menu">← Jiný úkol</button>
  </section>
</main>
<script src="paper.js"></script>
<script src="app.js"></script>
</body>
</html>
