# Úkoly: Matika

* [ ] ověřit nasazení na hosting (GitHub Actions → FTP)

## Samostatné příklady bez jmen a bodů (2026-10-11)

* [x] api.php: jen `modules`, `next`, `hint`, `answer`; aktuální příklad v PHP session
* [x] smazat databázi, uživatele, kola, statistiky, přístupové heslo a instalátor (lib/db.php, schema.sql, config.php, install.php, data/)
* [x] generators.php: `generate_round` → jeden příklad
* [x] index.php + app.js: bez přihlášení, výsledku kola a statistik; nekonečný proud příkladů
* [x] konfety + pochvala při správné odpovědi (respektuje omezené animace)
* [x] style.css: odstranit mrtvé styly
* [x] deploy.yml, .htaccess, README, docs/rozhodnuti.md
* [x] ověřit v prohlížeči (desktop + mobil)

### Výsledek

* Ověřeno v Playwright (1280 px a 390 px): správná odpověď → konfety + pochvala → další příklad; nápověda; špatná odpověď s postupem; Enter; návrat do menu; dělení se zbytkem; zlomky.
* API přes curl: `next`, `answer` (špatně i správně), `hint` bez session vrátí 404 s hláškou.
* Neověřeno: skutečná dotyková klávesnice na zařízení, chování PHP session na produkčním hostingu.
