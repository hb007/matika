// Shoda kontroly odpovědi: offline.js musí rozhodnout stejně jako server.
// Použití: php tests/parity_cases.php | node tests/parity.js
const fs = require('fs');
global.window = {};
global.localStorage = { getItem: () => null, setItem: () => {} };
eval(fs.readFileSync(__dirname + '/../offline.js', 'utf8'));
const cases = JSON.parse(fs.readFileSync(0, 'utf8'));
let failed = 0;
for (const c of cases) {
  const r = window.Offline.check(c.ex, c.given);
  if (r.ok !== c.ok || r.note !== c.note || r.readable !== c.readable) {
    if (failed++ < 15) console.log('FAIL', JSON.stringify(c), '→ JS', JSON.stringify(r));
  }
}
console.log(failed ? `${failed} z ${cases.length} se liší` : `OK (${cases.length} případů)`);
process.exit(failed ? 1 : 0);
