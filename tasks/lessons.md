# Poučení: Matika

Poučení z oprav a korekcí, která platí i pro další práci na projektu.

## FTP-Deploy-Action a složky (2026-10-11)

* Když z repa zmizí složka, akce (v4.3.5) na serveru maže celou složku rekurzivně, včetně souborů vyřazených přes `exclude`. `exclude` chrání jen jednotlivé soubory, ne jejich složku.
* Když složka na serveru chybí (smazaná ručně), mazání spadne na `550 Failed to change directory` a nahrávání souboru do ní na `553 Could not create file`. Po chybě se neuloží stav synchronizace, takže každé další nasazení spadne stejně.
* Postup při odstranění složky z repa: ověřit, co v ní na serveru je (data, která tam mají zůstat, nejdřív přesunout). Když složka na serveru chybí, založit ji prázdnou a teprve pak pushnout.
