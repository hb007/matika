// Seznam her: název, ikona, co se počítá (low = méně je lépe), návod,
// šipky pod plochou a jak hru vytvořit. Používá app.js (hry jako odměna)
// i hry.php (samostatná stránka se všemi hrami). variants = volba obtížnosti
// (velikost plochy) v úvodu hry: [id, popisek]; každá má svůj rekord.
window.MatikaGames = {
  had: { title: 'Had', icon: '🐍', label: 'Jablka', how: 'Táhni prstem po ploše, ťukej na šipky, nebo hraj šipkami na klávesnici.',
    pad: ['up', 'left', 'down', 'right'], make: (stage, cb) => { const c = document.createElement('canvas'); stage.appendChild(c); return window.Snake.create(c, cb); } },
  pexeso: { title: 'Pexeso', icon: '🃏', label: 'Tahy', low: true, how: 'Najdi dvojice: příklad a jeho výsledek. Čím méně tahů, tím lépe.',
    pad: [], make: (stage, cb) => window.Pexeso.create(stage, cb) },
  g2048: { title: '2048', icon: '🔢', label: 'Body', how: 'Posouvej dlaždice tažením nebo šipkami. Stejná čísla se spojí.',
    pad: ['up', 'left', 'down', 'right'], make: (stage, cb) => window.Game2048.create(stage, cb) },
  cihly: { title: 'Cihly', icon: '🧱', label: 'Cihly', how: 'Táhni pálkou prstem nebo šipkami a ťuknutím vystřel míček. Máš 3 životy.',
    pad: ['left', 'right'], hold: true, make: (stage, cb) => window.Breakout.create(stage, cb) },
  ptacek: { title: 'Ptáček', icon: '🐤', label: 'Sloupy', how: 'Ťukej na plochu (nebo mezerník) a proleť mezerami mezi sloupy.',
    pad: [], make: (stage, cb) => window.Flappy.create(stage, cb) },
  pacman: { title: 'Pacman', icon: '👻', label: 'Body', how: 'Sněz všechny tečky a vyhni se duchům. Po velké tečce můžeš duchy chvíli jíst. Táhni prstem nebo hraj šipkami.',
    pad: ['up', 'left', 'down', 'right'], make: (stage, cb) => window.Pacman.create(stage, cb) },
  slova: { title: 'Slova', icon: '🔤', label: 'Sekundy', low: true, how: 'V každém barevném poli je schované slovo. Táhni prstem po písmenech (nahoru, dolů, do stran) a projdi celé pole. Čím rychleji, tím lépe.',
    pad: [], variants: [['5', '5 × 5'], ['6', '6 × 6'], ['7', '7 × 7']],
    make: (stage, cb, v) => window.Slova.create(stage, { ...cb, size: Number(v) }) },
};

// Zvolená obtížnost hry (pamatuje se v prohlížeči). Rekord první varianty
// má klíč beze změny, ostatní s příponou _<id>.
window.MatikaVariant = {
  get(id) {
    const vs = window.MatikaGames[id].variants;
    if (!vs) return '';
    let v = null;
    try { v = localStorage.getItem('matika_variant_' + id); } catch (e) { /* bez úložiště */ }
    return vs.some(([k]) => k === v) ? v : vs[0][0];
  },
  set(id, v) {
    try { localStorage.setItem('matika_variant_' + id, v); } catch (e) { /* bez úložiště */ }
  },
  suffix(id) {
    const vs = window.MatikaGames[id].variants;
    const v = this.get(id);
    return vs && v !== vs[0][0] ? '_' + v : '';
  },
  label(id) {
    const vs = window.MatikaGames[id].variants;
    return vs ? vs.find(([k]) => k === this.get(id))[1] : '';
  },
  // tlačítka s volbou do úvodu hry (prázdné, když hra varianty nemá)
  html(id) {
    const vs = window.MatikaGames[id].variants;
    if (!vs) return '';
    const cur = this.get(id);
    return vs.map(([k, name]) => `<button type="button" class="game-variant${k === cur ? ' on' : ''}" data-variant="${k}" aria-pressed="${k === cur}">${name}</button>`).join('');
  },
};
