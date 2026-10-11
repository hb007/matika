// Papír na počítání: čtverečkovaný list, na který jde psát prstem, perem
// nebo myší. Nic se neodesílá ani nerozpoznává, je to jen pomocný papír.
window.Paper = (() => {
  // barva pera ze stylů (--canvas-ink), ať je vidět i v tmavém motivu
  const PEN = { color: '#1f3a8a', width: 3 };
  const penColor = (el) => getComputedStyle(el).getPropertyValue('--canvas-ink').trim() || PEN.color;
  const ERASER = { width: 26 };

  function create(canvas) {
    const ctx = canvas.getContext('2d');
    let strokes = [];     // { tool, points: [[x, y], …] }
    let current = null;
    let tool = 'pen';
    let ink = penColor(canvas);

    function resize() {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    }

    function drawStroke(s) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (s.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = ERASER.width;
      } else {
        ctx.strokeStyle = ink;
        ctx.lineWidth = PEN.width;
      }
      ctx.beginPath();
      const [x0, y0] = s.points[0];
      ctx.moveTo(x0, y0);
      if (s.points.length === 1) ctx.lineTo(x0 + 0.1, y0 + 0.1);   // tečka
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i][0], s.points[i][1]);
      ctx.stroke();
      ctx.restore();
    }

    function redraw() {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      strokes.forEach(drawStroke);
    }

    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button > 0) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      current = { tool, points: [pos(e)] };
      strokes.push(current);
      drawStroke(current);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!current) return;
      e.preventDefault();
      // u rychlých tahů prohlížeč slučuje události; vezmeme i ty sloučené
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      const from = current.points.length - 1;
      evs.forEach((ev) => current.points.push(pos(ev)));
      drawStroke({ tool: current.tool, points: current.points.slice(from) });
    });
    const end = () => { current = null; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);

    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    window.addEventListener('resize', resize);

    return {
      resize,
      // po přepnutí motivu: nová barva pera i pro už napsané tahy
      recolor() { ink = penColor(canvas); redraw(); },
      setTool(t) { tool = t; },
      undo() { strokes.pop(); redraw(); },
      clear() { strokes = []; current = null; redraw(); },
      isEmpty() { return strokes.length === 0; },
    };
  }

  return { create };
})();
