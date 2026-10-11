# Poučení: Matika

Poučení z oprav a korekcí, která platí i pro další práci na projektu.

## FTP-Deploy-Action a složky (2026-10-11)

* Když z repa zmizí složka, akce (v4.3.5) na serveru maže celou složku rekurzivně, včetně souborů vyřazených přes `exclude`. `exclude` chrání jen jednotlivé soubory, ne jejich složku.
* Když složka na serveru chybí (smazaná ručně), mazání spadne na `550 Failed to change directory` a nahrávání souboru do ní na `553 Could not create file`. Po chybě se neuloží stav synchronizace, takže každé další nasazení spadne stejně.
* Postup při odstranění složky z repa: ověřit, co v ní na serveru je (data, která tam mají zůstat, nejdřív přesunout). Když složka na serveru chybí, založit ji prázdnou a teprve pak pushnout.

## Cache prohlížeče po nasazení (2026-10-11)

* Hosting (matika.brno.ai) posílá JS a CSS s `cache-control: max-age=259200` (3 dny), stránku jen s `max-age=300`. Bez verze v adrese tak prohlížeč po nasazení držel starý `app.js` a `style.css`, `index.php` ale stáhl nový. Nové HTML se starým JS aplikaci rozbilo („občas se blbě načte, musí se obnovit“). Reprodukováno lokálně podstrčením starého `app.js`: `Cannot set properties of null`.
* `index.php` proto přidává ke skriptům a stylům `?v=<filemtime>` a posílá `Cache-Control: no-cache`. Každý nový JS nebo CSS soubor načítat stejně přes `$v(...)`.
