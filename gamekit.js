// Společný základ her: čtvercové plátno (ve stage, nebo rovnou předané),
// barvy z CSS (motiv, barva dítěte) a velikost podle displeje. fit() vrací
// šířku v CSS px (0 = plátno ještě není vidět); hra si po něm přepočítá své.
window.GameCanvas = (stage, fallbacks) => {
  const canvas = stage.tagName === 'CANVAS' ? stage : stage.appendChild(document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  const colors = () => {
    const s = getComputedStyle(canvas);
    return Object.fromEntries(Object.entries(fallbacks).map(([k, [name, fb]]) => [k, (name && s.getPropertyValue(name).trim()) || fb]));
  };
  const fit = () => {
    const w = canvas.getBoundingClientRect().width;
    if (!w) return 0;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.height = Math.round(w * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return w;
  };
  return { canvas, ctx, colors, fit };
};
