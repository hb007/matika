# Rozhodnutí

Proč je projekt tak, jak je. Jedno rozhodnutí = jedna sekce: datum, kontext, rozhodnutí, důsledky.
Nejnovější nahoře. Zrušené rozhodnutí nemaž, označ ho jako nahrazené a odkaž na nové.

## 2026-10-11: Offline se zásobou příkladů

**Kontext:** Děti chtějí cvičit i bez internetu (Android, appka na ploše). Všechno přitom dělal server: příklad, nápovědu i kontrolu.

**Rozhodnutí:** Appka si online stahuje zásobu příkladů i se správným výsledkem, nápovědou a postupem, 30 pro každou kombinaci úlohy, úrovně a obtížnosti, bez opakování (server dostane zadání, která telefon už má, a nevydá je znovu). Když úloha dojde, appka ji nenahrazuje jinou, jen napíše, že příklady došly. Bez internetu z ní bere příklady, odpověď kontroluje v telefonu (přepis `check_answer` do `offline.js`) a výsledky ukládá. Po připojení je pošle a server je přehraje přes `handle_answer` a `handle_reveal`, tedy přes stejná pravidla jako online. Příklady ze zásoby mají na serveru id (tabulka `issued`), server je ověří sám a započte jednou. Service worker (`sw.js`) drží stránku, skripty, styly a písma. Generátory se do JS nepřepisovaly: zásoba dá skoro totéž bez dvojí údržby generátorů, nápovědy a vysvětlení.

**Důsledky:** Správný výsledek je v telefonu dřív, než ho dítě spočítá (šikovné dítě by ho našlo ve vývojářských nástrojích). Body offline jsou předběžné, rozbor chyby je jen online, opakování chyb offline nefunguje. Kontrola odpovědi existuje dvakrát (PHP a JS), shodu hlídá test před nasazením. Nevyužité příklady ze zásoby server po 90 dnech zapomene (nejvýš 1500 na dítě); výsledek k zapomenutému příkladu se nezapočte.

## 2026-10-11: Dvě děti na vlastních adresách, body a obtížnost

**Kontext:** Bez bodů chybělo dětem porovnání a bez obtížnosti se nedalo přizpůsobit věku. Přihlašování a hesla dál nikdo nechce, ale hrozila záměna dětí na sdíleném zařízení.

**Rozhodnutí:** Dva pevní uživatelé (holka a kluk) s přezdívkou. Kdo cvičí, určuje adresa `/holka` nebo `/kluk`, ne cookie, a posílá se s každým požadavkem. Rozpracovaný příklad je v session zvlášť pro každé dítě. Body podle obtížnosti (1, 2, 3; po chybě 1; po ukázání výsledku 0), série v řadě s bonusem, denní cíl 20 příkladů se sérií dní, opakování chybných příkladů po 5 dalších. Data v SQLite `data/matika-v2.sqlite` (nový název kvůli staré databázi s jiným schématem). Obtížnost lehké, střední, těžké jen na obrazovce příkladu, barevně odlišená.

**Důsledky:** Složka `data/` musí zůstat v repu (FTP akce maže zmizelé složky celé). Web je dál bez hesla: kdo zná adresu, může cvičit za dítě. Herní pravidla mají testy (`tests/run.php`), které běží i před nasazením.

## 2026-10-11: Samostatné příklady bez jmen, bodů a databáze

**Stav:** částečně nahrazeno rozhodnutím „Dvě děti na vlastních adresách, body a obtížnost“ (databáze, uživatelé a body se vrátily, heslo a kola po 10 příkladech ne).

**Kontext:** Zadávání jména na začátku a sbírání bodů, hvězdiček a žebříčku dítě zdržovalo. Cílem je jen procvičovat.

**Rozhodnutí:** Appka nemá přihlášení (ani jménem, ani přístupovým heslem), body, kola po 10 příkladech, výsledek kola ani statistiky. Dítě vybere úkol a úroveň a řeší příklady jeden za druhým. Správná odpověď spustí konfety a pochvalu. Databáze (SQLite/MySQL) a instalátor jsou zrušené, aktuální příklad drží server v PHP session, takže správná odpověď se ke klientovi nedostane dřív, než dítě odpoví.

**Důsledky:** Na hosting stačí nahrát soubory, není co instalovat ani zálohovat. Rodič už nevidí historii ani příklady, které se opakovaně nedaří. Kdyby to bylo potřeba znovu, je to v historii gitu před tímto rozhodnutím.
