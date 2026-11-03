// Samostatná stránka se všemi hrami (hry.php): rozcestník a obrazovka hry
// bez limitů. Hry a jejich popis jsou v games.js, rekordy v prohlížeči
// (zvlášť od rekordů dětí v appce).
(() => {
  const GAMES = window.MatikaGames;
  const $ = (id) => document.getElementById(id);
  let game = null, gameId = null;

  const bestKey = (id) => 'matika_hry_best_' + id;
  const bestOf = (id) => { try { return Number(localStorage.getItem(bestKey(id))) || 0; } catch (e) { return 0; } };

  function show(name) {
    $('screen-games').hidden = name !== 'games';
    $('screen-game').hidden = name !== 'game';
    window.scrollTo(0, 0);
  }
  function openGames() {
    if (game) game.stop();
    game = null;
    $('games-list').innerHTML = Object.entries(GAMES).map(([id, g]) =>
      `<button type="button" class="game-card" data-game-id="${id}"><span class="game-icon">${g.icon}</span>`
      + `<b>${g.title}</b><small>rekord ${bestOf(id) || '–'}</small></button>`).join('');
    show('games');
  }
  function overlay(msg, btn) {
    $('game-msg').textContent = msg;
    $('game-start').textContent = btn;
    $('game-overlay').hidden = false;
  }
  function renderPause() { $('game-pause').disabled = !game || !game.running; }

  function openGame(id) {
    const g = GAMES[id];
    if (!g) return openGames();
    if (game) game.stop();
    gameId = id;
    $('game-stage').innerHTML = '';
    $('game-stage').className = 'game-stage game-' + id;
    $('game-title').textContent = g.title;
    $('game-score-label').textContent = g.label;
    $('game-score').textContent = '0';
    $('game-best').textContent = bestOf(id) || '–';
    $('game-pad').hidden = !g.pad.length;
    $('game-pad').querySelectorAll('[data-dir]').forEach((b) => { b.hidden = !g.pad.includes(b.dataset.dir); });
    show('game');
    game = g.make($('game-stage'), {
      onScore: (n) => { $('game-score').textContent = n; },
      onOver: (n) => over(n),
    });
    overlay(g.how, 'Hrát');
    renderPause();
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* nevadí */ }
  }
  function over(n) {
    const g = GAMES[gameId];
    const best = bestOf(gameId);
    const record = g.low ? n > 0 && (!best || n < best) : n > best;
    if (record) {
      try { localStorage.setItem(bestKey(gameId), String(n)); } catch (e) { /* bez úložiště */ }
      $('game-best').textContent = n;
    }
    overlay((record ? 'Nový rekord! ' : '') + `${g.label}: ${n}.`, 'Hrát znovu');
    renderPause();
  }
  function go() {
    if (!game) return;
    if (game.over) game.reset();
    game.paused = false;
    $('game-overlay').hidden = true;
    if (!game.running) game.start();
    renderPause();
  }
  function pause() {
    if (!game || !game.running) return;
    game.stop();
    game.paused = true;
    overlay('Pauza.', 'Pokračovat');
    renderPause();
  }

  $('games-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-game-id]');
    if (b) openGame(b.dataset.gameId);
  });
  $('btn-games-back').addEventListener('click', () => {
    try { history.replaceState(null, '', location.pathname); } catch (e) { /* nevadí */ }
    openGames();
  });
  $('game-start').addEventListener('click', go);
  $('game-pause').addEventListener('click', pause);
  // první ťuknutí na plochu hru spustí (z pauzy jen tlačítkem)
  $('game-stage').addEventListener('pointerdown', () => {
    if (game && !game.running && !game.paused && !game.over && !$('game-overlay').hidden) go();
  }, true);
  $('game-pad').querySelectorAll('[data-dir]').forEach((b) => {
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!game || game.over || game.paused) return;
      if (!game.running) go();
      game.turn(b.dataset.dir);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => b.addEventListener(ev, () => { if (game && game.release) game.release(); }));
  });
  document.addEventListener('keydown', (e) => {
    if ($('screen-game').hidden || !game) return;
    const dir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }[e.key];
    if (dir) {
      e.preventDefault();
      if (game.over || game.paused) return;
      if (!game.running) go();
      game.turn(dir);
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      e.preventDefault();
      pause();
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (document.activeElement === $('game-start')) return;
      e.preventDefault();
      if (!game.running && !$('game-overlay').hidden) go();
      else if (game.action && game.running) game.action();
    }
  });
  document.addEventListener('keyup', (e) => {
    if (game && game.release && ['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) game.release();
  });
  // odchod z okna: hra se pozastaví
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', pause);

  openGames();
  const id = location.hash.slice(1);
  if (GAMES[id]) openGame(id);
})();
