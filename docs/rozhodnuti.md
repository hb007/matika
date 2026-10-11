# Rozhodnutí

Proč je projekt tak, jak je. Jedno rozhodnutí = jedna sekce: datum, kontext, rozhodnutí, důsledky.
Nejnovější nahoře. Zrušené rozhodnutí nemaž, označ ho jako nahrazené a odkaž na nové.

## 2026-10-11: Dvě děti na vlastních adresách, body a obtížnost

**Kontext:** Bez bodů chybělo dětem porovnání a bez obtížnosti se nedalo přizpůsobit věku. Přihlašování a hesla dál nikdo nechce, ale hrozila záměna dětí na sdíleném zařízení.

**Rozhodnutí:** Dva pevní uživatelé (holka a kluk) s přezdívkou. Kdo cvičí, určuje adresa `/holka` nebo `/kluk`, ne cookie, a posílá se s každým požadavkem. Rozpracovaný příklad je v session zvlášť pro každé dítě. Body podle obtížnosti (1, 2, 3; po chybě 1; po ukázání výsledku 0), série v řadě s bonusem, denní cíl 20 příkladů se sérií dní, opakování chybných příkladů po 5 dalších. Data v SQLite `data/matika-v2.sqlite` (nový název kvůli staré databázi s jiným schématem). Obtížnost lehké, střední, těžké jen na obrazovce příkladu, barevně odlišená.

**Důsledky:** Složka `data/` musí zůstat v repu (FTP akce maže zmizelé složky celé). Web je dál bez hesla: kdo zná adresu, může cvičit za dítě. Herní pravidla mají testy (`tests/run.php`), které běží i před nasazením.

## 2026-10-11: Samostatné příklady bez jmen, bodů a databáze

**Stav:** částečně nahrazeno rozhodnutím „Dvě děti na vlastních adresách, body a obtížnost“ (databáze, uživatelé a body se vrátily, heslo a kola po 10 příkladech ne).

**Kontext:** Zadávání jména na začátku a sbírání bodů, hvězdiček a žebříčku dítě zdržovalo. Cílem je jen procvičovat.

**Rozhodnutí:** Appka nemá přihlášení (ani jménem, ani přístupovým heslem), body, kola po 10 příkladech, výsledek kola ani statistiky. Dítě vybere úkol a úroveň a řeší příklady jeden za druhým. Správná odpověď spustí konfety a pochvalu. Databáze (SQLite/MySQL) a instalátor jsou zrušené, aktuální příklad drží server v PHP session, takže správná odpověď se ke klientovi nedostane dřív, než dítě odpoví.

**Důsledky:** Na hosting stačí nahrát soubory, není co instalovat ani zálohovat. Rodič už nevidí historii ani příklady, které se opakovaně nedaří. Kdyby to bylo potřeba znovu, je to v historii gitu před tímto rozhodnutím.
