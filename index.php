<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Matika</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>➗</text></svg>">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="top">
  <a href="#" class="brand" data-go="menu">Matika</a>
  <div class="who" id="who" hidden>
    <span id="who-name"></span>
    <span class="chip" id="who-points" title="Body celkem">0 b.</span>
    <button class="link" data-go="stats">Výsledky</button>
    <button class="link" id="btn-logout">Změnit jméno</button>
  </div>
</header>

<main id="app">

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
    <div class="question" id="question"></div>
    <form id="form-answer" class="answer">
      <div id="inputs"></div>
      <button type="submit" class="btn" id="btn-submit">Hotovo</button>
    </form>
    <div id="feedback" class="feedback" hidden></div>
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
    <button class="link" data-go="menu">← Zpět</button>
  </section>

</main>
<script src="app.js"></script>
</body>
</html>
