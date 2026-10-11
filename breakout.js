// Cihly: odrážej míček pálkou a rozbij všechny cihly. 3 životy.
// Ovládání: táhni prstem nebo myší po ploše, šipky doleva a doprava,
// mezerník nebo ťuknutí vystřelí míček.
window.Breakout = (() => {
  const COLS = 7, ROWS = 5;
  const ROW_COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7'];

  function create(stage, { onScore, onOver } = {}) {
    const { canvas, ctx, colors: readColors, fit } = window.GameCanvas(stage, {
      bg: ['--canvas', '#fff'], paddle: ['--kid', '#1f45b5'], ball: ['--ink', '#262a31'], muted: ['--muted', '#5d6470'],
    });
    let W = 0, bricks, ball, paddle, lives, score, over, running, stuck, raf, last, css, keyDir = 0;

    function resize() {
      const w = fit();
      if (!w) return;
      const scale = W ? w / W : 1;
      if (W && ball) {   // při změně velikosti přepočítat pozice
        ball.x *= scale; ball.y *= scale; ball.vx *= scale; ball.vy *= scale; paddle.x *= scale;
      }
      W = w;
      layout();
      draw();
    }
    function layout() {
      paddle = paddle || { x: W / 2 };
      paddle.w = W * 0.22;
      paddle.h = W * 0.03;
      paddle.y = W * 0.92;
      ball = ball || {};
      ball.r = W * 0.018;
    }
    function newBall() {
      stuck = true;
      ball.x = paddle.x;
      ball.y = paddle.y - ball.r - 2;
      const sp = W * 0.65;   // px za sekundu
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
      ball.vx = Math.cos(a) * sp;
      ball.vy = Math.sin(a) * sp;
    }
    function reset() {
      cancelAnimationFrame(raf);
      css = readColors();
      bricks = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) bricks.push({ r, c, on: true });
      lives = 3;
      score = 0;
      over = false;
      running = false;
      paddle = null;
      ball = null;
      resize();
      newBall();
      draw();
      if (onScore) onScore(0);
    }
    function brickRect(b) {
      const pad = W * 0.02;
      const bw = (W - pad * (COLS + 1)) / COLS;
      const bh = W * 0.045;
      return { x: pad + b.c * (bw + pad), y: W * 0.1 + b.r * (bh + pad), w: bw, h: bh };
    }
    function draw() {
      if (!W) return;
      ctx.fillStyle = css.bg;
      ctx.fillRect(0, 0, W, W);
      bricks.forEach((b) => {
        if (!b.on) return;
        const r = brickRect(b);
        ctx.fillStyle = ROW_COLORS[b.r];
        ctx.fillRect(r.x, r.y, r.w, r.h);
      });
      ctx.fillStyle = css.paddle;
      ctx.fillRect(paddle.x - paddle.w / 2, paddle.y, paddle.w, paddle.h);
      ctx.fillStyle = css.ball;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = css.muted;
      ctx.font = `700 ${Math.round(W * 0.04)}px system-ui, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('❤'.repeat(lives), W - W * 0.02, W * 0.02);
    }
    function step(t) {
      if (!running) return;
      const dt = Math.min(0.033, (t - last) / 1000 || 0);
      last = t;
      paddle.x = Math.max(paddle.w / 2, Math.min(W - paddle.w / 2, paddle.x + keyDir * W * 1.1 * dt));
      if (stuck) {
        ball.x = paddle.x;
      } else {
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
        if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); }
        if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }
        // pálka: úhel odrazu podle místa dopadu
        if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y < paddle.y + paddle.h && Math.abs(ball.x - paddle.x) <= paddle.w / 2 + ball.r) {
          const hit = (ball.x - paddle.x) / (paddle.w / 2);
          const sp = Math.hypot(ball.vx, ball.vy) * 1.02;
          const a = -Math.PI / 2 + hit * 1.05;
          ball.vx = Math.cos(a) * sp;
          ball.vy = Math.sin(a) * sp;
        }
        for (const b of bricks) {
          if (!b.on) continue;
          const r = brickRect(b);
          if (ball.x + ball.r > r.x && ball.x - ball.r < r.x + r.w && ball.y + ball.r > r.y && ball.y - ball.r < r.y + r.h) {
            b.on = false;
            score++;
            if (onScore) onScore(score);
            const overlapX = Math.min(ball.x + ball.r - r.x, r.x + r.w - (ball.x - ball.r));
            const overlapY = Math.min(ball.y + ball.r - r.y, r.y + r.h - (ball.y - ball.r));
            if (overlapX < overlapY) ball.vx = -ball.vx; else ball.vy = -ball.vy;
            break;
          }
        }
        if (score === COLS * ROWS) return finish();
        if (ball.y > W + ball.r) {
          lives--;
          if (lives <= 0) return finish();
          newBall();
        }
      }
      draw();
      raf = requestAnimationFrame(step);
    }
    function finish() {
      over = true;
      running = false;
      draw();
      if (onOver) onOver(score);
    }
    function start() {
      if (running || over) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(step);
    }
    function stop() {
      running = false;
      keyDir = 0;
      cancelAnimationFrame(raf);
    }
    // pálka za prstem / myší
    const follow = (e) => {
      const r = canvas.getBoundingClientRect();
      paddle.x = Math.max(paddle.w / 2, Math.min(W - paddle.w / 2, e.clientX - r.left));
      if (!running) draw();
    };
    canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); follow(e); if (running && stuck) stuck = false; });
    canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) follow(e); });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    reset();
    return {
      reset, start, stop, recolor() { css = readColors(); draw(); },
      // šipky: pohyb pálky, dokud je klávesa / tlačítko dole (release = 'stop')
      turn(dir) { keyDir = dir === 'left' ? -1 : dir === 'right' ? 1 : 0; },
      release() { keyDir = 0; },
      action() { if (running && stuck) stuck = false; },
      get running() { return running; }, get over() { return over; },
    };
  }
  return { create };
})();
