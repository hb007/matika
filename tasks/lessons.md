# Poučení: Matika

Poučení z oprav a korekcí, která platí i pro další práci na projektu.

## FTP-Deploy-Action maže zmizelé složky celé (2026-10-11)

* Když z repa zmizí složka, akce na serveru zavolá rekurzivní mazání celé složky, včetně souborů vyřazených přes `exclude`. `exclude` chrání jen jednotlivé soubory, ne jejich složku.
* Při rušení databáze se tak málem smazala `data/` i se SQLite. Nasazení spadlo jen díky chybě akce (absolutní cesta `/data`, odpověď FTP 550), po chybě se neuložil stav synchronizace a každé další nasazení by spadlo znovu.
* Než z repa odstraním složku, ověřím, co v ní na serveru zůstane. Složku se serverovými daty v repu nechám (stačí `.htaccess` a `index.html`).
