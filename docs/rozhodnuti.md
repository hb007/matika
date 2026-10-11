# Rozhodnutí

Proč je projekt tak, jak je. Jedno rozhodnutí = jedna sekce: datum, kontext, rozhodnutí, důsledky.
Nejnovější nahoře. Zrušené rozhodnutí nemaž, označ ho jako nahrazené a odkaž na nové.

## 2026-10-11: Čas v celé appce: upozornění, ne vypínání

**Kontext:** Cílem je, aby dítě netrávilo na telefonu čas. Limit 10 minut jen na hry nestačil a vypínání s odpočtem nebylo žádoucí.

**Rozhodnutí:** Měří se čas v celé appce (otevřená a viditelná). Po 10 minutách výrazné upozornění přes celou obrazovku, pak každých 5 minut znovu, a trvalá lišta s dnešním časem. Bez odpočtu a bez zamykání. Hry mají dál jen limit počtu (3 + 1 za každých 10 příkladů po cíli).

**Důsledky:** Čas je v prohlížeči, na každém zařízení zvlášť (ve Výsledcích „na tomto zařízení“). Nahrazuje limit 10 minut her z rozhodnutí níž.

## 2026-10-11: Pět vlastních her s denním limitem

**Stav:** časový limit her nahrazen rozhodnutím „Čas v celé appce: upozornění, ne vypínání“.

**Kontext:** Víc her jako odměna, ale ne neomezeně. Otázka, jestli převzít hotové hry (2048 MIT, Hextris GPL, klony Pac-Mana s různými licencemi) nebo herní knihovnu (Phaser).

**Rozhodnutí:** Vlastní malé hry (had, pexeso s příklady, 2048, cihly, ptáček), každá pár set řádků bez knihovny, se společným rozhraním, barvami motivu a dítěte, dotykem a offline. Limit: hry až po denním cíli, 3 hry denně + 1 za každých dalších 10 příkladů, nejvýš 10 minut denně (pak upozornění a zámek do zítřka). Počítá se v prohlížeči.

**Důsledky:** Žádné cizí licence ani velké knihovny. Limity jdou obejít smazáním dat prohlížeče; pro rodinu stačí. Konstanty `GAME_PLAYS`, `GAME_EXTRA_EVERY`, `GAME_MINUTES` v `app.js`.

## 2026-10-11: Hra jako odměna za denní cíl, efekty jdou vypnout

**Stav:** odemykání hry nahrazeno rozhodnutím „Pět vlastních her s denním limitem“ (už ne celý den neomezeně).

**Kontext:** Hra má být bonus, ne volně dostupná. Běžné efekty po každé odpovědi někoho ruší.

**Rozhodnutí:** Had se odemkne splněním denního cíle a zůstane odemčený do konce dne (kontrola v prohlížeči podle `solved_today`, server hru nehlídá). Běžné náhodné efekty jdou v menu vypnout, odměny zůstávají.

**Důsledky:** Zámek hry jde obejít úpravou stránky; pro rodinnou appku to stačí. Nahrazuje část rozhodnutí níž („hra volně dostupná z menu“).

## 2026-10-11: Odměny počítá server, hra bez vazby na příklady

**Stav:** část o volně dostupné hře nahrazena rozhodnutím „Hra jako odměna za denní cíl“.

**Kontext:** Kromě jednorožce další odměny (ohňostroj, sova, drak, raketa, poklad) a album nálepek; k tomu jednoduchá hra.

**Rozhodnutí:** Odměny a nálepky počítá server v `handle_answer` (`lib/rewards.php`), takže platí i pro offline výsledky přehrané přes sync. Odměny jen za skutečný úspěch (série, opravená chyba, denní cíl, série dní, těžké napoprvé, body), žádné náhodné „vzácné“ odměny, zvuky ani odměny za rychlost. Hra Had je volně dostupná z menu a s příklady nesouvisí (odpočinek); rekord jen v prohlížeči.

**Důsledky:** Offline appka ukáže jen odměny, které pozná sama; sova a raketa offline přijdou jen jako nálepka po připojení. Hra není nijak omezená, rodič ji případně ohlídá sám.

## 2026-10-11: Tmavý motiv přes data-theme

**Kontext:** Tmavý motiv má jít podle telefonu i ručně přepnout.

**Rozhodnutí:** Skript v `<head>` nastaví `data-theme="dark|light"` na `<html>` (volba z menu, jinak `prefers-color-scheme`), CSS má jedinou tmavou sadu proměnných pod `[data-theme=dark]`. Žádný `@media (prefers-color-scheme)` blok, tmavé hodnoty by jinak byly dvakrát.

**Důsledky:** Barvy jen přes proměnné; barva napevno v pravidle v tmavém motivu nebude sedět.

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
