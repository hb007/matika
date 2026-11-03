// Seznam her: název, ikona, co se počítá (low = méně je lépe), návod,
// šipky pod plochou a jak hru vytvořit. Používá app.js (hry jako odměna)
// i hry.php (samostatná stránka se všemi hrami).
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
    pad: [], make: (stage, cb) => window.Slova.create(stage, cb) },
};
