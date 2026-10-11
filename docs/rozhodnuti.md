# Rozhodnutí

Proč je projekt tak, jak je. Jedno rozhodnutí = jedna sekce: datum, kontext, rozhodnutí, důsledky.
Nejnovější nahoře. Zrušené rozhodnutí nemaž, označ ho jako nahrazené a odkaž na nové.

## 2026-10-11: Samostatné příklady bez jmen, bodů a databáze

**Kontext:** Zadávání jména na začátku a sbírání bodů, hvězdiček a žebříčku dítě zdržovalo. Cílem je jen procvičovat.

**Rozhodnutí:** Appka nemá přihlášení (ani jménem, ani přístupovým heslem), body, kola po 10 příkladech, výsledek kola ani statistiky. Dítě vybere úkol a úroveň a řeší příklady jeden za druhým. Správná odpověď spustí konfety a pochvalu. Databáze (SQLite/MySQL) a instalátor jsou zrušené, aktuální příklad drží server v PHP session, takže správná odpověď se ke klientovi nedostane dřív, než dítě odpoví.

**Důsledky:** Na hosting stačí nahrát soubory, není co instalovat ani zálohovat. Rodič už nevidí historii ani příklady, které se opakovaně nedaří. Kdyby to bylo potřeba znovu, je to v historii gitu před tímto rozhodnutím.
