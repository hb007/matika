// Pacman: sněz všechny tečky v bludišti a vyhni se duchům. Po velké tečce
// duchové chvíli zmodrají a dají se sníst. Prázdné bludiště = další kolo
// s rychlejšími duchy. Tři životy. Ovládání: tažení prstem, šipky pod
// plochou, šipky nebo WASD na klávesnici. Duchové jsou pomalejší a jen jeden
// z nich jde přímo po Pacmanovi, ať to zvládnou i malé děti.
window.Pacman = (() => {
  // # zeď, . tečka, o velká tečka, - dveře domečku duchů, mezera = domeček.
  // Řádek 5 je tunel: kraje vedou na druhou stranu. Pod bludištěm je řádek se životy.
  const MAZE = [
    '###############',
    '#o.....#.....o#',
    '#.##.#.#.#.##.#',
    '#....#...#....#',
    '##.#.##-##.#.##',
    '...#.#   #.#...',
    '##.#.#####.#.##',
    '#.............#',
    '#.##.##.##.##.#',
    '#o.#.......#.o#',
    '##.#.#.#.#.#.##',
    '#....#.#.#....#',
    '#......#......#',
    '###############',
  ];
  const N = 15;                 // políček na šířku (plátno je čtverec: 14 řádků bludiště + řádek životů)
  const ROWS = MAZE.length;
  const START = [7, 9];         // Pacman
  const EXIT = [7, 3];          // políčko nad dveřmi, kudy duchové vycházejí
  const HOME = [[6, 5], [7, 5], [8, 5], [7, 5]];
  const GHOSTS = ['#e8453c', '#f28fc4', '#3fc6d9', '#f5a03a'];
  const RELEASE = [0, 2, 5, 8]; // za kolik sekund duch vyjde z domečku
  const PAC_SPEED = 4.6;        // políček za sekundu
  const GHOST_SPEED = 3.4;      // první kolo; každé další o kousek rychlejší
  const SCARED_SPEED = 2.2;
  const SCARED_S = 7;           // jak dlouho jsou duchové modří
  const LIVES = 3;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const BACK = { up: 'down', down: 'up', left: 'right', right: 'left' };

  const wall = (x, y) => y < 0 || y >= ROWS || '#- '.includes(MAZE[y][((x % N) + N) % N]);
  const open = (x, y, d) => !wall(x + DIRS[d][0], y + DIRS[d][1]);

  function create(stage, { onScore, onOver } = {}) {
    const { canvas, ctx, colors: readColors, fit } = window.GameCanvas(stage, {
      bg: ['--canvas', '#fff'], wall: ['--kid', '#1f45b5'], dot: ['--ink', '#262a31'],
    });
    let W = 0, cell, css, pac, ghosts, dots, left, score, lives, level, scared, combo, freeze, time;
    let running, over, raf, last;

    function resize() {
      const w = fit();
      if (!w) return;
      W = w;
      cell = w / N;
      draw();
    }

    // Postava stojí na políčku (x, y) a jde ke dalšímu ve směru dir; t = kus cesty (0–1).
    const mover = (x, y, dir) => ({ x, y, dir, t: 0 });
    function place() {
      pac = { ...mover(START[0], START[1], null), want: null, mouth: 0 };
      ghosts = GHOSTS.map((color, i) => ({ ...mover(HOME[i][0], HOME[i][1], null), color, home: true, wait: RELEASE[i], eaten: false }));
      scared = 0;
      freeze = 0.8;   // chvilka na rozkoukání
    }
    function fillDots() {
      dots = MAZE.map((row) => row.split('').map((c) => (c === '.' ? 1 : c === 'o' ? 2 : 0)));
      dots[START[1]][START[0]] = 0;
      left = dots.flat().filter(Boolean).length;
    }
    function reset() {
      cancelAnimationFrame(raf);
      css = readColors();
      score = 0;
      lives = LIVES;
      level = 0;
      time = 0;
      running = false;
      over = false;
      fillDots();
      place();
      resize();
      if (onScore) onScore(0);
    }

    // Posun o dist políček; na každém políčku se postava rozhodne, kam dál.
    function move(m, dist, decide) {
      while (dist > 0) {
        if (!m.dir) { decide(m); if (!m.dir) return; }
        const step = Math.min(dist, 1 - m.t);
        m.t += step;
        dist -= step;
        if (m.t >= 1) {
          m.x = (m.x + DIRS[m.dir][0] + N) % N;
          m.y += DIRS[m.dir][1];
          m.t = 0;
          arrive(m);
          decide(m);
          if (!m.dir) return;
        }
      }
    }
    // Obrátit se uprostřed cesty: cílem je políčko, odkud postava vyšla.
    function reverse(m) {
      m.x = (m.x + DIRS[m.dir][0] + N) % N;
      m.y += DIRS[m.dir][1];
      m.t = 1 - m.t;
      m.dir = BACK[m.dir];
    }
    const pos = (m) => [m.x + (m.dir ? DIRS[m.dir][0] * m.t : 0), m.y + (m.dir ? DIRS[m.dir][1] * m.t : 0)];

    function pacDecide(m) {
      if (m.want && open(m.x, m.y, m.want)) m.dir = m.want;
      else if (m.dir && !open(m.x, m.y, m.dir)) m.dir = null;
    }
    function ghostDecide(g) {
      const ways = Object.keys(DIRS).filter((d) => open(g.x, g.y, d) && d !== BACK[g.dir]);
      if (!ways.length) { g.dir = BACK[g.dir] || null; return; }
      const i = ghosts.indexOf(g);
      // modrý duch utíká náhodně; první duch jde po Pacmanovi, ostatní jen napůl
      if (scared > 0 || Math.random() < (i === 0 ? 0.15 : 0.55)) { g.dir = ways[Math.floor(Math.random() * ways.length)]; return; }
      const dist = (d) => Math.hypot(g.x + DIRS[d][0] - pac.x, g.y + DIRS[d][1] - pac.y);
      g.dir = ways.reduce((a, b) => (dist(b) < dist(a) ? b : a));
    }
    function arrive(m) {
      if (m !== pac) return;
      const d = dots[m.y][m.x];
      if (!d) return;
      dots[m.y][m.x] = 0;
      left--;
      score += d === 2 ? 5 : 1;
      if (d === 2) { scared = SCARED_S; combo = 0; ghosts.forEach((g) => { if (!g.home && g.dir) reverse(g); }); }
      if (onScore) onScore(score);
    }

    function step(t) {
      if (!running) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0);
      last = t;
      time += dt;
      if (freeze > 0) {
        freeze -= dt;
      } else {
        update(dt);
        if (over) return;
      }
      draw();
      raf = requestAnimationFrame(step);
    }
    function update(dt) {
      move(pac, PAC_SPEED * dt, pacDecide);
      if (pac.dir) pac.mouth += dt * 9;
      if (scared > 0) scared = Math.max(0, scared - dt);
      const speed = scared > 0 ? SCARED_SPEED : Math.min(4.4, GHOST_SPEED + level * 0.25);
      ghosts.forEach((g) => {
        if (g.home) {
          g.wait -= dt;
          if (g.wait <= 0) Object.assign(g, mover(EXIT[0], EXIT[1], null), { home: false, eaten: false });
          return;
        }
        move(g, speed * dt, ghostDecide);
      });
      // srážka s duchem
      const [px, py] = pos(pac);
      for (const g of ghosts) {
        if (g.home) continue;
        const [gx, gy] = pos(g);
        if (Math.hypot(px - gx, py - gy) > 0.6) continue;
        if (scared > 0) {
          combo++;
          score += 10 * combo;
          if (onScore) onScore(score);
          Object.assign(g, mover(7, 5, null), { home: true, wait: 3, eaten: true });
        } else {
          lives--;
          if (lives <= 0) { finish(); return; }
          place();
          return;
        }
      }
      if (!left) {   // prázdné bludiště: další kolo
        level++;
        fillDots();
        place();
      }
    }
    function finish() {
      over = true;
      running = false;
      draw();
      if (onOver) onOver(score);
    }

    function draw() {
      if (!W || !dots) return;
      ctx.fillStyle = css.bg;
      ctx.fillRect(0, 0, W, W);
      // zdi: zaoblené bloky v barvě dítěte, dveře domečku jako tenká čára
      ctx.fillStyle = css.wall;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < N; x++) {
        const c = MAZE[y][x];
        if (c === '#') {
          const pad = cell * 0.12;
          roundRect(x * cell + pad, y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.25);
          ctx.fill();
          // spoje se sousedními zdmi, ať bludiště vypadá jako souvislé chodby
          if (MAZE[y][x + 1] === '#') ctx.fillRect(x * cell + cell / 2, y * cell + pad, cell, cell - pad * 2);
          if (MAZE[y + 1] && MAZE[y + 1][x] === '#') ctx.fillRect(x * cell + pad, y * cell + cell / 2, cell - pad * 2, cell);
        } else if (c === '-') {
          ctx.fillRect(x * cell, y * cell + cell * 0.42, cell, cell * 0.16);
        }
      }
      // tečky
      ctx.fillStyle = css.dot;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < N; x++) {
        const d = dots[y][x];
        if (!d) continue;
        const r = d === 2 ? cell * (0.24 + 0.04 * Math.sin(time * 6)) : cell * 0.09;
        ctx.beginPath();
        ctx.arc(x * cell + cell / 2, y * cell + cell / 2, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ghosts.forEach(drawGhost);
      drawPac(...pos(pac), pac.dir || pac.want || 'right', 0.12 + 0.6 * Math.abs(Math.sin(pac.mouth)));
      // životy pod bludištěm
      for (let i = 0; i < lives; i++) drawPac(0.6 + i * 1.2, ROWS, 'right', 0.5, 0.38);
    }
    function drawPac(x, y, dir, mouth, size = 0.42) {
      const a = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir];
      const cx = x * cell + cell / 2, cy = y * cell + cell / 2;
      ctx.fillStyle = '#f5c400';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, cell * size, a + mouth / 2, a + Math.PI * 2 - mouth / 2);
      ctx.closePath();
      ctx.fill();
    }
    function drawGhost(g) {
      const [x, y] = pos(g);
      const bob = g.home ? Math.sin(time * 4 + g.x) * 0.08 : 0;
      const cx = x * cell + cell / 2, cy = (y + bob) * cell + cell / 2, r = cell * 0.4;
      const blue = scared > 0 && !g.home;
      const blink = blue && scared < 2 && Math.floor(time * 5) % 2;
      if (!g.eaten || !g.home) {
        ctx.fillStyle = blink ? '#ffffff' : blue ? '#3b5bdb' : g.color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI, 0);
        ctx.lineTo(cx + r, cy + r);
        for (let i = 1; i <= 4; i++) ctx.lineTo(cx + r - (i * r) / 2, cy + r - (i % 2 ? r * 0.3 : 0));
        ctx.closePath();
        ctx.fill();
      }
      // oči (snědený duch v domečku má jen oči)
      const [dx, dy] = g.dir ? DIRS[g.dir] : [0, 0];
      [-1, 1].forEach((side) => {
        const ex = cx + side * r * 0.38, ey = cy - r * 0.15;
        if (!blue) {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(ex, ey, r * 0.27, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = blink ? '#e8453c' : blue ? '#fff' : '#1b2a4a';
        ctx.beginPath();
        ctx.arc(ex + dx * r * 0.12, ey + dy * r * 0.12, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    // Otočení: platí hned, jde-li to, jinak na nejbližší odbočce. Obrátit se jde kdykoli.
    function turn(d) {
      if (!DIRS[d] || over) return;
      pac.want = d;
      if (pac.dir && d === BACK[pac.dir]) reverse(pac);
      else if (!pac.dir) {
        pacDecide(pac);
      }
      if (!running) start();
    }
    function start() {
      if (running || over) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(step);
    }

    // tažení prstem po ploše
    let sx = null, sy = null;
    canvas.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; e.preventDefault(); });
    canvas.addEventListener('pointermove', (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      sx = e.clientX; sy = e.clientY;
    });
    const up = () => { sx = sy = null; };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

    reset();
    return {
      reset, start, turn, stop() { running = false; cancelAnimationFrame(raf); }, recolor() { css = readColors(); draw(); },
      get running() { return running; }, get over() { return over; },
    };
  }
  return { create };
})();
