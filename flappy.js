// Ptáček: ťukni (mezerník, šipka nahoru) a ptáček vyletí výš. Proleť co nejvíc
// mezer mezi sloupy. Náraz do sloupu nebo do země hru ukončí.
window.Flappy = (() => {
  function create(stage, { onScore, onOver } = {}) {
    const { canvas, ctx, colors: readColors, fit } = window.GameCanvas(stage, {
      bg: ['--canvas', '#fff'], pipe: ['--kid', '#1f45b5'], ground: ['--line', '#b9c7d6'],
    });
    let W = 0, bird, pipes, score, over, running, raf, last, spawn, css;

    function resize() {
      const w = fit();
      if (!w) return;
      W = w;
      draw();
    }
    function reset() {
      cancelAnimationFrame(raf);
      css = readColors();
      bird = { y: 0.45, vy: 0 };   // v násobcích šířky plochy
      pipes = [];
      score = 0;
      spawn = 0;
      over = false;
      running = false;
      resize();
      if (onScore) onScore(0);
    }
    const GAP = 0.3, PIPE_W = 0.14, SPEED = 0.28, GRAV = 1.5, FLAP = -0.48, BIRD_X = 0.25, BIRD_R = 0.035, GROUND = 0.93;
    function draw() {
      if (!W) return;
      ctx.fillStyle = css.bg;
      ctx.fillRect(0, 0, W, W);
      ctx.fillStyle = css.pipe;
      pipes.forEach((p) => {
        ctx.fillRect(p.x * W, 0, PIPE_W * W, (p.gap - GAP / 2) * W);
        ctx.fillRect(p.x * W, (p.gap + GAP / 2) * W, PIPE_W * W, (GROUND - p.gap - GAP / 2) * W);
      });
      ctx.fillStyle = css.ground;
      ctx.fillRect(0, GROUND * W, W, W);
      ctx.save();
      ctx.translate(BIRD_X * W, bird.y * W);
      ctx.rotate(Math.max(-0.5, Math.min(0.9, bird.vy * 1.2)));
      ctx.scale(-1, 1);   // emoji kouká doleva, letí doprava
      ctx.font = `${Math.round(W * 0.09)}px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐤', 0, 0);
      ctx.restore();
    }
    function step(t) {
      if (!running) return;
      const dt = Math.min(0.033, (t - last) / 1000 || 0);
      last = t;
      bird.vy += GRAV * dt;
      bird.y += bird.vy * dt;
      spawn -= dt;
      if (spawn <= 0) {
        pipes.push({ x: 1.05, gap: 0.25 + Math.random() * 0.45, passed: false });
        spawn = 1.6;
      }
      pipes.forEach((p) => { p.x -= SPEED * dt; });
      pipes = pipes.filter((p) => p.x > -PIPE_W - 0.05);
      for (const p of pipes) {
        if (!p.passed && p.x + PIPE_W < BIRD_X) {
          p.passed = true;
          score++;
          if (onScore) onScore(score);
        }
        const inX = BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W;
        const inGap = bird.y - BIRD_R > p.gap - GAP / 2 && bird.y + BIRD_R < p.gap + GAP / 2;
        if (inX && !inGap) return finish();
      }
      if (bird.y + BIRD_R > GROUND || bird.y < -0.1) return finish();
      draw();
      raf = requestAnimationFrame(step);
    }
    function finish() {
      over = true;
      running = false;
      draw();
      if (onOver) onOver(score);
    }
    function flap() {
      if (over) return;
      if (!running) start();
      bird.vy = FLAP;
    }
    function start() {
      if (running || over) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(step);
    }
    canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); if (running) flap(); });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    reset();
    return {
      reset, start, stop() { running = false; cancelAnimationFrame(raf); }, recolor() { css = readColors(); draw(); },
      turn(dir) { if (dir === 'up') flap(); }, action: flap,
      get running() { return running; }, get over() { return over; },
    };
  }
  return { create };
})();
