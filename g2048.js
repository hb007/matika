// Hra 2048: posouvej dlaždice, stejná čísla se spojí. Konec, když už nejde
// nic posunout. Ovládání: tažení prstem, šipky (pod plochou i na klávesnici).
window.Game2048 = (() => {
  const N = 4;
  const COLORS = { 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563', 32: '#f67c5f', 64: '#f65e3b',
    128: '#edcf72', 256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e' };

  function create(stage, { onScore, onOver } = {}) {
    const { canvas, ctx, colors: readColors, fit } = window.GameCanvas(stage, {
      bg: ['--line', '#b9c7d6'], empty: ['--canvas', '#fff'], ink: [null, '#3b3520'], inkLight: [null, '#fff'], big: ['--kid', '#1f45b5'],
    });
    let grid, score, over, running, size, css;

    function resize() {
      const w = fit();
      if (!w) return;
      size = w;
      draw();
    }
    function addTile() {
      const free = [];
      grid.forEach((row, y) => row.forEach((v, x) => { if (!v) free.push([x, y]); }));
      if (!free.length) return;
      const [x, y] = free[Math.floor(Math.random() * free.length)];
      grid[y][x] = Math.random() < 0.9 ? 2 : 4;
    }
    function reset() {
      grid = Array.from({ length: N }, () => Array(N).fill(0));
      score = 0;
      over = false;
      running = false;
      css = readColors();
      addTile();
      addTile();
      resize();
      if (onScore) onScore(0);
    }
    function draw() {
      if (!size || !grid) return;
      const gap = size * 0.025;
      const cell = (size - gap * (N + 1)) / N;
      ctx.fillStyle = css.bg;
      ctx.fillRect(0, 0, size, size);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      grid.forEach((row, y) => row.forEach((v, x) => {
        const px = gap + x * (cell + gap);
        const py = gap + y * (cell + gap);
        ctx.fillStyle = v ? COLORS[v] || css.big : css.empty;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(px, py, cell, cell, cell * 0.08) : ctx.rect(px, py, cell, cell);
        ctx.fill();
        if (v) {
          ctx.fillStyle = v <= 4 ? css.ink : css.inkLight;
          const digits = String(v).length;
          ctx.font = `700 ${Math.round(cell * (digits < 3 ? 0.45 : digits === 3 ? 0.36 : 0.28))}px 'Atkinson Hyperlegible', system-ui, sans-serif`;
          ctx.fillText(String(v), px + cell / 2, py + cell / 2 + 1);
        }
      }));
    }
    // posun jednoho řádku doleva; vrací [nový řádek, body]
    function slide(row) {
      const vals = row.filter(Boolean);
      const out = [];
      let pts = 0;
      for (let i = 0; i < vals.length; i++) {
        if (vals[i] === vals[i + 1]) {
          out.push(vals[i] * 2);
          pts += vals[i] * 2;
          i++;
        } else {
          out.push(vals[i]);
        }
      }
      while (out.length < N) out.push(0);
      return [out, pts];
    }
    function canMove() {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const v = grid[y][x];
        if (!v || (x < N - 1 && grid[y][x + 1] === v) || (y < N - 1 && grid[y + 1][x] === v)) return true;
      }
      return false;
    }
    function turn(dir) {
      if (over) return;
      running = true;
      const before = JSON.stringify(grid);
      for (let i = 0; i < N; i++) {
        let line = dir === 'left' || dir === 'right' ? grid[i].slice() : grid.map((r) => r[i]);
        if (dir === 'right' || dir === 'down') line.reverse();
        let [res, pts] = slide(line);
        score += pts;
        if (dir === 'right' || dir === 'down') res = res.reverse();
        if (dir === 'left' || dir === 'right') grid[i] = res;
        else res.forEach((v, y) => { grid[y][i] = v; });
      }
      if (JSON.stringify(grid) === before) return;
      addTile();
      draw();
      if (onScore) onScore(score);
      if (!canMove()) {
        over = true;
        running = false;
        if (onOver) onOver(score);
      }
    }
    // tažení prstem
    let sx = null, sy = null;
    canvas.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; e.preventDefault(); });
    canvas.addEventListener('pointerup', (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      sx = sy = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    });
    canvas.addEventListener('pointercancel', () => { sx = sy = null; });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    reset();
    return {
      reset, turn, start() { running = !over; }, stop() { running = false; }, recolor() { css = readColors(); draw(); },
      get running() { return running; }, get over() { return over; },
    };
  }
  return { create };
})();
