// Hra Had: had sbírá jablka a roste, s každým jablkem je o kousek rychlejší.
// Naráží do zdi a do sebe. Ovládání: tažení prstem po herní ploše, šipky
// pod plochou, šipky nebo WASD na klávesnici. Barvy bere ze stylů (motiv,
// barva dítěte). Funguje i offline, nic neposílá na server.
window.Snake = (() => {
  const N = 15;            // políček na šířku i výšku
  const START_MS = 220;    // krok na začátku (klidné tempo, ať se dítě rozkouká)
  const MIN_MS = 100;      // nejrychlejší krok (dosáhne ho po 30 jablkách)
  const FASTER = 4;        // o kolik ms zrychlí každé jablko
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  function create(canvas, { onScore, onOver } = {}) {
    const { ctx, colors: readColors, fit } = window.GameCanvas(canvas, {
      bg: ['--canvas', '#fff'], grid: ['--canvas-grid', '#e3e9f5'], snake: ['--kid', '#1f45b5'], eye: ['--canvas', '#fff'],
    });
    let snake, dir, queue, food, score, step, timer, running, over, cell, colors;

    function size() {
      const w = fit();
      if (!w) return;
      cell = w / N;
      draw();
    }

    function placeFood() {
      const free = [];
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) {
        if (!snake.some(([sx, sy]) => sx === x && sy === y)) free.push([x, y]);
      }
      food = free[Math.floor(Math.random() * free.length)];
    }

    function reset() {
      const m = Math.floor(N / 2);
      snake = [[m, m], [m - 1, m], [m - 2, m]];
      dir = 'right';
      queue = [];
      score = 0;
      step = START_MS;
      running = false;
      over = false;
      clearTimeout(timer);
      colors = readColors();
      placeFood();
      size();
      if (onScore) onScore(score);
    }

    function draw() {
      if (!cell || !snake) return;
      const w = cell * N;
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, w, w);
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < N; i++) {
        ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, w);
        ctx.moveTo(0, i * cell); ctx.lineTo(w, i * cell);
      }
      ctx.stroke();
      // jablko
      ctx.font = `${Math.round(cell * 0.9)}px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍎', food[0] * cell + cell / 2, food[1] * cell + cell / 2 + cell * 0.05);
      // had: tělo jako zaoblené čtverečky, hlava s očima
      ctx.fillStyle = colors.snake;
      snake.forEach(([x, y], i) => {
        const pad = i === 0 ? 1 : 2.5;
        roundRect(x * cell + pad, y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.3);
        ctx.globalAlpha = i === 0 ? 1 : Math.max(0.55, 1 - i * 0.02);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      const [hx, hy] = snake[0];
      const [dx, dy] = DIRS[dir];
      ctx.fillStyle = colors.eye;
      [-1, 1].forEach((side) => {
        const ex = hx * cell + cell / 2 + dx * cell * 0.15 + dy * side * cell * 0.2;
        const ey = hy * cell + cell / 2 + dy * cell * 0.15 - dx * side * cell * 0.2;
        ctx.beginPath();
        ctx.arc(ex, ey, cell * 0.11, 0, Math.PI * 2);
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

    function tick() {
      if (queue.length) dir = queue.shift();
      const [dx, dy] = DIRS[dir];
      const head = [snake[0][0] + dx, snake[0][1] + dy];
      const eat = head[0] === food[0] && head[1] === food[1];
      const body = eat ? snake : snake.slice(0, -1);   // ocas se posune, do něj narazit nejde
      if (head[0] < 0 || head[1] < 0 || head[0] >= N || head[1] >= N || body.some(([x, y]) => x === head[0] && y === head[1])) {
        running = false;
        over = true;
        draw();
        if (onOver) onOver(score);
        return;
      }
      snake.unshift(head);
      if (eat) {
        score++;
        step = Math.max(MIN_MS, step - FASTER);
        if (onScore) onScore(score);
        if (snake.length === N * N) { running = false; over = true; draw(); if (onOver) onOver(score); return; }
        placeFood();
      } else {
        snake.pop();
      }
      draw();
      timer = setTimeout(tick, step);
    }

    // Otočení: do fronty (dvě rychlá otočení za jeden krok se neztratí), ne o 180°.
    function turn(d) {
      if (!DIRS[d] || over) return;
      const last = queue.length ? queue[queue.length - 1] : dir;
      const [lx, ly] = DIRS[last];
      const [nx, ny] = DIRS[d];
      if (lx === -nx && ly === -ny) return;
      if (d !== last && queue.length < 3) queue.push(d);
      if (!running) start();
    }

    function start() {
      if (running || over) return;
      running = true;
      timer = setTimeout(tick, step);
    }

    function stop() {
      running = false;
      clearTimeout(timer);
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
      sx = e.clientX; sy = e.clientY;   // další tah bez zvednutí prstu
    });
    const up = () => { sx = sy = null; };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    if (window.ResizeObserver) new ResizeObserver(size).observe(canvas);

    reset();
    return { reset, start, stop, turn, recolor() { colors = readColors(); draw(); }, get running() { return running; }, get over() { return over; } };
  }

  return { create };
})();
