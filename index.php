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
  <div class="who" id="who" hidden>
    <span id="who-name"></span>
    <span class="chip" id="who-points" title="Body celkem">0 b.</span>
    <button class="link" data-go="stats">Výsledky</button>
  </div>
</header>

<main id="app">

  <!-- přístupové heslo (jen když je nastavené) -->
  <section id="screen-access" class="screen" hidden>
    <h1>Zadej heslo</h1>
    <form id="form-access" class="row">
      <input id="access-pass" type="password" autocomplete="current-password" placeholder="Heslo">
      <button type="submit" class="btn">Vstoupit</button>
    </form>
    <p class="empty" id="access-error"></p>
  </section>

  <!-- výběr jména -->
  <section id="screen-login" class="screen">
    <h1>Kdo dnes cvičí?</h1>
    <div class="names" id="names"></div>
    <form id="form-login" class="row">
      <input id="login-name" type="text" maxlength="40" placeholder="Nové jméno" autocomplete="off">
      <button type="submit" class="btn">Jdu na to</button>
    </form>
  </section>

  <!-- menu modulů -->
  <section id="screen-menu" class="screen" hidden>
    <p class="today" id="today"></p>
    <div class="modules" id="modules"></div>
  </section>

  <!-- výběr úrovně -->
  <section id="screen-level" class="screen" hidden>
    <h1 id="level-title"></h1>
    <div class="levels" id="levels"></div>
    <button class="link" data-go="menu">← Zpět</button>
  </section>

  <!-- kolo -->
  <section id="screen-round" class="screen" hidden>
    <div class="progress"><div class="bar" id="bar"></div></div>
    <div class="meta">
      <span id="counter"></span>
      <span id="streak" class="streak" hidden></span>
    </div>
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
    <button class="link small" data-go="menu">Ukončit kolo</button>
  </section>

  <!-- výsledek kola -->
  <section id="screen-result" class="screen" hidden>
    <div class="stars" id="stars"></div>
    <h1 id="result-title"></h1>
    <p id="result-text"></p>
    <div class="row center">
      <button class="btn" id="btn-again">Ještě jednou</button>
      <button class="btn ghost" data-go="menu">Jiný úkol</button>
    </div>
    <div id="mistakes"></div>
  </section>

  <!-- statistiky -->
  <section id="screen-stats" class="screen" hidden>
    <h1>Moje výsledky</h1>
    <div class="tiles" id="tiles"></div>
    <h2>Podle úkolů</h2>
    <table class="table" id="per-level"></table>
    <h2>Co mi dává zabrat</h2>
    <div id="hardest"></div>
    <h2>Tento týden</h2>
    <table class="table" id="board"></table>
    <div class="row spread">
      <button class="link" data-go="menu">← Zpět</button>
      <button class="link" id="btn-logout">Změnit jméno</button>
    </div>
  </section>

</main>
<script src="paper.js"></script>
<script src="app.js"></script>
</body>
</html>
