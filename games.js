// Seznam her: název, ikona, co se počítá (low = méně je lépe), návod,
// šipky pod plochou a jak hru vytvořit. Používá app.js (hry jako odměna)
// i hry.php (samostatná stránka se všemi hrami). variants = volby v úvodu hry
// (velikost plochy, jazyk): [[klíč, [[hodnota, popisek], …]], …]; každá
// kombinace má svůj rekord. noBest = hra rekord nepočítá ani neukazuje.
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
  slova: { title: 'Slova', icon: '🔤', label: 'Sekundy', low: true, noBest: true, how: 'V každém barevném poli je schované slovo. Táhni prstem po písmenech (nahoru, dolů, do stran) a projdi celé pole. Čím rychleji, tím lépe.',
    pad: [], variants: [
      ['size', [['5', '5 × 5'], ['6', '6 × 6'], ['7', '7 × 7']]],
      ['lang', [['cs', 'česky'], ['en', 'anglicky'], ['de', 'německy']]],
    ],
    make: (stage, cb, v) => window.Slova.create(stage, { ...cb, size: Number(v.size), lang: v.lang }) },
};

// Zvolené volby hry (pamatují se v prohlížeči), { klíč: hodnota }. Rekord
// s prvními hodnotami má klíč beze změny, jinak s příponou _<hodnota> za
// každou volbu, která není první. První volba se ukládá pod
// matika_variant_<hra> (jako dřív, kdy byla jen velikost).
window.MatikaVariant = {
  groups: (id) => window.MatikaGames[id].variants || [],
  key: (id, k, i) => 'matika_variant_' + id + (i ? '_' + k : ''),
  get(id) {
    const out = {};
    this.groups(id).forEach(([k, items], i) => {
      let v = null;
      try { v = localStorage.getItem(this.key(id, k, i)); } catch (e) { /* bez úložiště */ }
      out[k] = items.some(([x]) => x === v) ? v : items[0][0];
    });
    return out;
  },
  set(id, k, v) {
    const i = this.groups(id).findIndex(([g]) => g === k);
    if (i < 0) return;
    try { localStorage.setItem(this.key(id, k, i), v); } catch (e) { /* bez úložiště */ }
  },
  suffix(id) {
    const cur = this.get(id);
    return this.groups(id).map(([k, items]) => (cur[k] !== items[0][0] ? '_' + cur[k] : '')).join('');
  },
  label(id) {
    const cur = this.get(id);
    return this.groups(id).map(([k, items]) => items.find(([x]) => x === cur[k])[1]).join(', ');
  },
  // tlačítka s volbami do úvodu hry, řádek za každou volbu (prázdné, když hra žádné nemá)
  html(id) {
    const cur = this.get(id);
    return this.groups(id).map(([k, items]) => '<div class="game-variant-row">' + items.map(([v, name]) =>
      `<button type="button" class="game-variant${v === cur[k] ? ' on' : ''}" data-variant="${k}:${v}" aria-pressed="${v === cur[k]}">${name}</button>`).join('') + '</div>').join('');
  },
};
