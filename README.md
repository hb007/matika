---
nazev: Matika
stav: aktivní
typ: kod
varianta: A
popis: Webová appka na procvičování matematiky pro 2. stupeň ZŠ (PHP + SQLite, FTP hosting), sešity dětí s PINem a třídami
dalsi-krok: –
---

# Matika – procvičování pro 2. stupeň ZŠ

Jednoduchá webová appka (PHP 8.1+, SQLite, bez frameworků a bez buildu). Funguje na počítači, tabletu i telefonu.

Každé dítě má svůj **sešit** (přezdívka, barva, PIN) zařazený do třídy podle registračního kódu, vlastní adresu (`/u/anicka`; holka a kluk ze starší verze `/holka`, `/kluk`), sbírá body a ve „Výsledcích“ je žebříček třídy a všech dětí. Kdo sešit nechce, zkusí appku bez něj (body se neukládají). Dítě si vybere úlohu, úroveň a obtížnost (lehké, střední, těžké) a řeší samostatné příklady jeden za druhým, dokud chce. Správná odpověď spustí efekt a pochvalu a hned naskočí další příklad. Po špatné odpovědi má dítě další pokus, správný výsledek se ukáže jen na vyžádání.

## Co se dá procvičovat

| Úloha (úrovně) | Lehké | Střední | Těžké |
|---|---|---|---|
| Malá násobilka (násobení, dělení, obojí) | 2–5 × 2–5 | 2–10 × 2–10 | 6–9 × 6–9 |
| Velká násobilka (násobení, dělení, obojí) | 11–15 × 2–5 | 11–20 × 2–10 | 11–20 × 11–20 |
| Sčítání a odčítání: celá čísla | do 100 | do 1 000 | do 10 000 |
| Sčítání a odčítání: záporná | ±20 | ±50 | ±500 |
| Sčítání a odčítání: desetinná | 1 místo, 1,0–9,9 | 1 místo, 1,0–99,9 | 2 místa, 1,00–99,99 |
| Zlomky: krácení | jmenovatel do 6, krátí se 2–3 | do 12, 2–6 | do 15, 2–9 |
| Zlomky: sčítání a odčítání | stejné jmenovatele 2–6 | 2–10, polovina stejné | 2–12, vždy různé |
| Zlomky: násobení a dělení | jmenovatele 2–5 | 2–9 | 2–12 |
| Dělení s ocáskem | 100–999 : 2–9 | 1 000–9 999 : 2–9 | 1 000–99 999 : 11–99 |
| Závorky a pořadí: pořadí operací (`3 + 4 · 5`), se závorkami (`(3 + 4) · 5`), všechno (`2 · (8 − 3) + 4`) | sčítance do 20, činitele 2–5, výsledek do 100 | do 50, 2–10, do 500 | do 100, 2–12, do 2 000, víc operací |
| Desetinná čísla · : (násobení, dělení, krát a děleno 10/100/1 000) | desetinné · celé, : celým; posun čárky o 1 místo | i desetinné · desetinné, : desetinným; posun o 1–2 místa | větší čísla; posun o 1–3 místa. Zadání je skoro vždy desetinné číslo (nekončí nulou), výsledek může vyjít celý; u násobení a dělení nejvýš 2 desetinná místa, u posunu čárky 3 |
| Procenta: kolik je 20 % ze 150, kolik % je 30 ze 150, celek (30 je 20 % z kolika) | 10, 20, 25, 50, 75, 100 %, kulatá čísla | 5–90 % | 1–150 %, do 2 000 |
| Dělitelnost: znaky dělitelnosti (nejmenší číslice místo □), největší společný dělitel D(a, b), nejmenší společný násobek n(a, b) | 3místná, dělitel 2, 3, 5, 10; čísla do 30 | do 4 míst, i 4, 6, 9; do 60 | 4–5 míst; do 150 |
| Průměr, medián, modus | 3–5 čísel do 10 (medián z lichého počtu) | 5–6 čísel do 30 | 6–8 čísel do 100 (medián může být ,5) |
| Rovnice: jednoduché (`x + 7 = 15`, `3x = 12`, `x : 4 = 5`), na dva kroky (`3x + 4 = 19`), x na obou stranách a závorky (`5x + 3 = 2x + 18`, `3 · (x + 2) = 21`) | x 1–10 | x 1–20 | x −10 až 20 (může vyjít záporné) |
| Římské číslice: z římských na arabské (`XLIX = 49`), z arabských na římské (`49 = XLIX`) | 1–39 (I, V, X) | 40–399 (i L, C) | 400–3 999 (i D, M) |
| Náhodný mix | vše lehké | vše střední | vše těžké |
| Náhodný mix, obtížnost „Vše“ | každý příklad má náhodnou úlohu, úroveň i obtížnost | | |

Rozsahy jsou v `lib/generators.php` (konstanty `MALA_RANGE`, `VELKA_RANGE`, `CELA_MAX` …), u závorek a rovnic v `lib/algebra.php` (`ZAVORKY`, `ZAVORKY_TPL`, `ROVNICE`, `ROVNICE_FORMS`). Výrazy se závorkami vycházejí vždy v celých nezáporných číslech (dělení beze zbytku). Nápověda a postup jdou krok po kroku (nejdřív závorka, pak násobení a dělení, pak zleva); rozbor chyby pozná počítání jen zleva. U rovnic se odpověď píše do políčka „x =“, postup končí zkouškou a rozbor chyby pozná opačnou operaci (přičtení místo odečtení …), jinak ukáže zkoušku s dítětem zadaným x. Každý příklad se generuje náhodně.

Pravidla, která hlídá server:

* Zlomek se píše jako `3/4`, jde i smíšené číslo `1 3/4` nebo celé číslo. Nezkrácený správný výsledek se uzná a appka jen napoví, na co se dá zkrátit. V úkolu **Krácení** se vyžaduje základní tvar.
* Desetinná čísla berou čárku i tečku.
* U dělení s ocáskem se zadává podíl a zbytek (zbytek 0 se píše jako 0).
* Římské číslo se píše na klávesnici s písmeny (jen ta, která obtížnost potřebuje), z klávesnice počítače jdou i malá písmena. Uzná se jen správný zápis: stejná číslice nejvýš 3× za sebou a před větší číslici jen I, X nebo C (`IIII` ani `IL` neprojde, appka napíše proč a počítá to jako pokus). Rozbor chyby u zápisu dítěte řekne, kolik jeho číslo je („XLI je 41, ne 49“), u převodu na arabské pozná sečtení všech číslic („XL = 50 − 10 = 40, ne 60“).

**Správná odpověď.** Ukáže se pochvala s náhodným efektem (konfety, hvězdičky, balónky, padající déšť emoji nebo velká medaile či palec, nikdy dvakrát po sobě stejný) a po chvilce naskočí další příklad. Kdo má v systému zapnuté omezení animací, uvidí jen pochvalu.

**Odměny za úspěch.** Místo běžného efektu přijde zvláštní animace a pod pochvalou text. Každá odměna je zároveň nálepka do alba. Počítá je server (`lib/rewards.php`), takže přibudou i za příklady vyřešené offline.

| Odměna | Za co | Animace |
|---|---|---|
| Jednorožec | 10, 20, 30 … správně napoprvé v řadě | jednorožec přeběhne s duhou a třpytkami |
| Duha | 25, 75 … v řadě | duha přes celou obrazovku |
| Zlatý jednorožec | 50, 100 … v řadě | zlatý jednorožec |
| Raketa | 5 těžkých napoprvé v řadě | raketa vystřelí nahoru |
| Sova | správně vyřešený příklad „Tenhle ti minule nešel“ | sova přiletí, „Naučil(a) ses to!“ |
| Ohňostroj | splněný denní cíl | ohňostroj |
| Dráček, Drak, Velký drak, Dračí král | 3, 7, 14, 30 dní v řadě splněný cíl | drak přeletí (čím delší série, tím větší), k tomu ohňostroj |
| Mince, Měšec, Diamant, Koruna, Pohár | 100, 500, 1 000, 2 000, 5 000 bodů celkem | poklad a fontána mincí |

Když přijde víc odměn najednou, hraje animace té nejvzácnější a texty se ukážou všechny. Další příklad pak naskočí až po doběhnutí. Offline appka pozná jen sérii, denní cíl a body. Nálepky za offline příklady (i sovu a raketu) doplní server po připojení. Při omezených animacích zůstane jen text.

**Album nálepek** je ve Výsledcích u každého dítěte (vlastní i cizí přes žebříček): získané nálepky v barvě dítěte s počtem, nezískané šedě s popisem, jak je dostat. „Smazat body“ nálepky nemaže.

**Hry.** Pět her jako odměna: Had, Pexeso (dvojice příklad a výsledek), 2048, Cihly (rozbíjení cihel pálkou) a Ptáček (proletět mezi sloupy). V menu je „Hry“: rozcestník, kde si dítě hru vybere (u každé je rekord), nebo nechá vybrat „Náhodnou hru“. Při splnění denního cíle appka nabídne „Vybrat hru“ (otevře rozcestník) nebo „Další příklad“. Hry jsou zamčené, dokud dítě nesplní denní cíl. Pak má na den 3 hry (hra = jedno kolo od startu do konce, „Hrát znovu“ je další hra) a za každých dalších 10 vyřešených příkladů jednu hru navíc. Pauza při odchodu z appky hru nespotřebuje. Limity jsou v `app.js` (`GAME_PLAYS`, `GAME_EXTRA_EVERY`), počítají se v prohlížeči pro každé dítě zvlášť a fungují i offline. Ovládání: tažení prstem, šipky pod plochou (jen u her, které je potřebují), šipky nebo WASD a mezerník na klávesnici.

**Čas v appce.** Cílem je, aby dítě netrávilo na telefonu moc času. Appka měří, jak dlouho je dnes otevřená a vidět (příklady i hry), pro každé dítě zvlášť, sečteno ze všech zařízení: každé zařízení posílá každých 30 sekund (a když appka jde do pozadí) svůj celkový čas za den se svým náhodným id, server si ho pro dítě, den a zařízení uloží a sčítá přes zařízení (`lib/usage.php`, tabulka `usage_dev`). Posílá se součet, ne přírůstek: ztracená odpověď serveru nic nepřičte dvakrát. Bez internetu se čas ukládá a odešle po připojení. Žádný odpočet a nic se nevypíná. Po 10 minutách přes celou obrazovku vyskočí upozornění „Dnes jsi v Matice už 10 minut. Dej si pauzu: jdi ven, protáhni se, napij se.“ (rozběhnutá hra se pozastaví) a pak každých 5 minut znovu (15, 20 …). Nahoře zůstane červená lišta s dnešním časem. Ve Výsledcích je řádek „Dnes v appce (všechna zařízení)“. Měření a odesílání je v `usage.js` (hranice `WARN_MIN`, `REPEAT_MIN`, `FLUSH_MS`), reakce na upozornění (pauza hry, lišta) v `app.js`.

**Efekty.** Náhodný efekt za každou správnou odpověď jde v menu vypnout („Efekty: zapnuté / vypnuté“, pamatuje se v prohlížeči). Odměny (jednorožec, ohňostroj …) se hrají dál.

**Tmavý motiv.** Appka se řídí nastavením telefonu (tmavý režim). V menu pod štítkem se jménem i v seznamu úloh je přepínač „Motiv: podle telefonu / tmavý / světlý“, volba se pamatuje v prohlížeči. Motiv se nastaví už v hlavičce stránky, takže světlá verze neprobliká. Barvy jsou v `style.css` jako proměnné v `:root`, tmavé hodnoty v bloku `:root[data-theme=dark]`; nová barva = nová proměnná v obou blocích, ne barva napevno v pravidle. Pero na papíře bere barvu z `--canvas-ink`.

**Špatná odpověď.** Appka výsledek neprozradí. Napíše „Ještě ne, zkus to znovu“, a pokud to pozná, tak i **co konkrétně bylo špatně** („sečetl jsi místo odečtení“, „jmenovatele se nesčítají“, „zbytek je větší než dělitel“, „podíl má mít 4 číslice“ …). Odpověď zůstane v políčku k opravě a pokusů je neomezeně. Tlačítko „Ukázat výsledek“ ukáže správný výsledek a **postup řešení po krocích** (rozklad na desítky, společný jmenovatel, dělení pod sebou číslici po číslici). Další příklad pak přijde po kliknutí na „Další“ nebo Enter.

**Vzhled.** Čtverečkovaný sešit: papír s mřížkou, tuha a modrý inkoust, písma Atkinson Hyperlegible (čitelnost, nesplete 1/l a 0/O) a Patrick Hand (ručně psané jméno a pochvala). Písma jsou ve složce `fonts/`, nenačítají se z Google Fonts. Holka má růžovou, kluk petrolejovou: barva nese štítek se jménem, pochvalu a ikonu na plochu. Obtížnost je zvýrazňovač v záhlaví: lehké zelený, střední žlutý, těžké oranžový. V rozhraní nejsou emoji (zůstávají jen v efektech za správnou odpověď).

**Kdo cvičí.** Na `/` se appka zeptá „Kdo dnes cvičí?“: desky sešitů dětí přihlášených na tomhle zařízení (klepnutí otevře rovnou dítě), „Jiné dítě“ (přezdívka + PIN), „Nový sešit“ a „Zkusit bez sešitu“. Adresa dítěte (`/u/anicka`, `/holka`, `/kluk`) otevře rovnou jeho sešit, když je na zařízení přihlášené, jinak chce PIN. Přihlášení si zařízení pamatuje (cookie s tokenem na rok, pro každé dítě zvlášť, nejvýš 12 dětí), takže na sdíleném tabletu je přihlášených víc dětí a PIN se zadává jen poprvé. Odhlásit jde ve Výsledcích. V záhlaví je štítek aktivního dítěte v jeho barvě s body dnes a proužkem denního cíle; klepnutí nabídne přepnutí na jiné přihlášené dítě, „Jiné dítě“ a výsledky. Dítě se posílá s každým požadavkem a server ověří, že je na zařízení přihlášené, takže se nespletou ani dvě karty v jednom prohlížeči. Na plochu jde přidat aplikace každého dítěte z jeho adresy: otevře rovnou jeho sešit, má jeho barvu (`icon.php`) a jmenuje se „Matika“ plus přezdívka v okamžiku přidání. Kořen `/` vlastní aplikaci nenabízí: se společným rozsahem `/` by Android nainstaloval jen jednu aplikaci. Přepnutí na jiné dítě uvnitř nainstalované aplikace otevře jeho stránku v prohlížeči. Web je veřejný, proto přezdívky, ne skutečná jména.

**Nový sešit.** Přezdívka, barva z palety 12 barev (`lib/db.php` `COLORS`), PIN (4 až 6 číslic) a **kód třídy**. Kód dostane dítě osobně od učitele nebo rodiče (na web nepatří); bez něj se sešit založit nedá, takže se neregistrují roboti ani cizí lidé. Adresa vznikne z přezdívky bez diakritiky (`Anička Nováková` → `/u/anicka-novakova`, při shodě `-2`). Holka a kluk ze starší verze PIN nemají a nastaví si ho při prvním otevření po nasazení (do té doby to může udělat kdokoli s jejich adresou, proto to udělej hned). Po 5 špatných PINech za sebou je minutová pauza. PIN jde změnit ve Výsledcích (starý + nový); zapomenutý PIN nastaví správce.

**Bez sešitu.** Příklady, nápověda, postup, rozbor chyby i efekty fungují, body se počítají jen do zavření prohlížeče (server je drží v session) a nic se neukládá: žádné odměny, nálepky, opakování chyb, žebříček ani zásoba pro offline.

**Správa** (`/admin`, `admin.php`) pro rodiče a učitele: třídy a jejich kódy (nový kód zneplatní starý, děti zůstanou), děti po třídách, u dítěte nový PIN, přejmenování, přesun do třídy, odhlášení ze všech zařízení, smazání sešitu (i s body a nálepkami, nevratné), přehled pro rodiče a souhrn za třídu (co třídě nejde). Chrání ji HTTP basic auth s heslem z `data/config.php` (viz Nasazení). Bez hesla se správa neotevře.

**Úloha, úroveň a obtížnost.** Appka otevře poslední úlohu dítěte. Tlačítko s názvem úlohy v záhlaví otevře seznam úloh (a přepnutí dítěte a výsledky). Pod záhlavím je jeden řádek: vlevo úrovně jako symboly (`·`, `:`, `· :`, `123`, `−5`, `2,5`, „zkrátit“, `+ −`, `XII→12`, „vše“), vpravo obtížnost jako ikony pírko, kámen, činka (v Náhodném mixu navíc „Vše“). Přepnutí hned načte nový příklad. Každé dítě má u každé úlohy zapamatovanou úroveň a obtížnost (v prohlížeči).

**Body.** Správně napoprvé: lehké 1, střední 2, těžké 3 body (v mixu „Vše“ podle obtížnosti konkrétního příkladu, barva záhlaví se mění s ní). Správně po chybném pokusu 1 bod, po „Ukázat výsledek“ 0. Nápověda body nebere. Nečitelná odpověď (písmena, chybí zbytek) se nepočítá jako pokus. Za každých 5 správně napoprvé v řadě je bod navíc (od 3 v řadě se ukazuje 🔥).

**Denní cíl.** 20 vyřešených příkladů za den (ukázaný výsledek se nepočítá), postup ukazuje proužek u dítěte v horním řádku. 🔥 u dítěte je série dní se splněným cílem. Den a týden (od pondělí) se počítají v českém čase.

**Opakování chyb.** Příklad, který dítě napoprvé netrefí, se mu vrátí po 5 dalších příkladech v téže úloze (na jakékoli úrovni a obtížnosti) nebo v Náhodném mixu, s poznámkou „Tenhle ti minule nešel“. Body za něj se počítají podle jeho původní obtížnosti.

**Návrh obtížnosti.** Po 10 příkladech v řadě napoprvé správně na jedné obtížnosti nabídne appka „Zkus těžší“. Když z posledních 10 příkladů bylo napoprvé správně méně než polovina, nabídne „Zkus lehčí“. Rozhoduje dítě, nic se nepřepne samo. Odmítnutý návrh se u úlohy do obnovení stránky neopakuje. V mixu se návrh nedává.

**Vypršelý příklad.** Když příklad leží otevřený déle, než server drží session, appka po odeslání místo chyby načte nový příklad a napíše „Předchozí příklad vypršel, tady je nový.“

**Výsledky.** Moje body (dnes, tento týden, celkem, dnes vyřešeno, série dní, čas v appce), přejmenování, změna PINu, odhlášení a „Smazat body“ (s potvrzením vynuluje body a sérii v řadě; vyřešené příklady, denní cíl, série dní a přehled pro rodiče zůstanou, vrátit to nejde). **Žebříček** se záložkami „moje třída“ / „všichni“ a dnes / tento týden / celkem: ve „dnes“ a „týden“ jen děti s body, v „celkem“ všichni, vlastní řádek vždy a zvýrazněný. Klepnutí na dítě otevře jeho veřejnou kartu (body, série dní, album). **Přehled pro rodiče** (úspěšnost napoprvé podle tématu a obtížnosti, příklady, které se za posledních 30 dní nejčastěji nedařily) vidí jen dítě u sebe a správce u všech.

**Nápověda po krocích.** Když dítě neví, klikne na „Nápověda“ a uvidí první krok (třeba „Kolikrát se 8 vejde do 66?“). Každé další kliknutí odkryje další krok. Poslední krok nikdy neprozradí výsledek, ten musí dítě dopočítat samo.

**Klávesnice.** Pod příkladem je vždy velká číselná klávesnice, jen s klávesami, které příklad potřebuje (lomítko u zlomků, minus u záporných čísel, čárka u desetinných, „zb.“ u dělení se zbytkem, u zápisu římských číslic místo číslic písmena I, V, X, L, C, D, M). Na dotykovém zařízení nahrazuje systémovou klávesnici, ta se nevysouvá. Po dobu stisku je nad klávesou bublina s velkým číslem (nebo znakem), takže je vidět, co dítě zmáčklo, i když klávesu zakrývá prst. Rychlé ťuknutí ji ukáže aspoň krátce, „smaž“, „zb.“ a „Hotovo“ bublinu nemají. Na počítači (a na tabletu s klávesnicí) jde psát i rovnou z klávesnice, Enter odešle odpověď. Na tabletu na šířku je papír na počítání vedle příkladu.

**Papír na počítání.** Pod příkladem jde otevřít čtverečkovaný papír, na který se píše prstem, perem nebo myší (guma, krok zpět, smazat). Slouží k počítání pod sebou, appka z něj nic nečte. U každého nového příkladu se vyčistí. Na tabletu s otevřeným papírem se nevysouvá klávesnice sama.

**Bez internetu.** Appka přidaná na plochu (Android, ale i iPhone a počítač) se otevře i bez internetu a dítě může dál cvičit. Dokud je online, stahuje si na pozadí zásobu příkladů: 30 pro každou kombinaci úlohy, úrovně a obtížnosti (52 kombinací, zhruba 1 500 příkladů a 500 kB na dítě, stáhne se za pár sekund). V zásobě se žádný příklad neopakuje. Kde různých příkladů tolik není, je zásoba menší (lehká a těžká malá násobilka a dělení mají jen 16 různých). Dotahuje se, když zásoba úlohy klesne pod polovinu. Ke každému příkladu je v zásobě i správný výsledek, kroky nápovědy a postup řešení. Bez internetu se nahoře ukáže lišta „Bez internetu. Počítáš ze zásoby“ a appka bere příklady odtud. Odpověď zkontroluje přímo v telefonu, nápověda i „Ukázat výsledek“ fungují. Rozbor chyby („sečetl jsi místo odečtení“) je jen online. Body v záhlaví jsou do připojení předběžné. Výsledky se uloží v telefonu a po připojení se samy odešlou (hned při obnovení spojení, jinak každých 30 sekund). Server je přehraje přes stejná pravidla jako online odpovědi, v pořadí a se dnem, kdy je dítě řešilo, takže body, série, denní cíl i opakování chyb vyjdou stejně. Každý příklad ze zásoby má na serveru své id, výsledek si server ověří sám a dvakrát ho nezapočte. Použitý příklad ze zásoby zmizí, takže se neopakuje. Před koncem appka upozorní, že zbývají poslední 2 příklady. Když vybraná úloha a obtížnost dojdou, nenahrazuje je ničím jiným a napíše „Příklady na tuhle úlohu a obtížnost už nejsou. Další přibudou, až budeš online.“ Jiné úlohy a obtížnosti jdou dál. Výsledky a přejmenování fungují jen online. Poprvé je potřeba appku otevřít s internetem (a přes HTTPS, jinak prohlížeč offline režim nepovolí).

## Nasazení na hosting

Stačí běžný webhosting s **PHP 8.1 nebo novějším** a rozšířením `pdo_sqlite`. Instalace není potřeba: databáze `data/matika-v2.sqlite` se založí sama při prvním použití. Složka `data/` musí být pro PHP zapisovatelná. Pro adresy dětí (`/u/anicka`, `/holka`, `/kluk`) je potřeba Apache s `mod_rewrite` (bez něj zbytek appky funguje). Ikony v barvě dítěte kreslí rozšíření `gd` (bez něj se použije modrá ikona z repa).

Správa (`/admin`) potřebuje heslo v souboru `data/config.php` na serveru (není v repu, nasazení ho nepřepisuje):

```php
<?php return ['admin_password' => 'tajne-heslo'];
```

Po nasazení na web se stávajícími daty: holka a kluk zůstanou (body, nálepky, adresy i nainstalované ikony), databáze se sama převede (`db_migrate_users`), a při prvním otevření si každý nastaví PIN. Ve správě pak založ třídy a kódy pro nové sešity.

1. **Stáhni appku.** Na GitHubu: Code → Download ZIP a rozbal.
2. **Nahraj soubory přes FTP** do kořene webu nebo do podsložky (třeba `/matika`). Nahraj všechno včetně skrytého `.htaccess`.
3. Hotovo, otevři web. Na tabletu nebo telefonu jde stránku přidat na plochu (Sdílet → Přidat na plochu), pak se otevírá jako appka přes celou obrazovku.

Appka si rozpracovaný příklad pamatuje v PHP session, hosting tedy musí mít zapnuté sessions (běžné výchozí nastavení).

Hosting cachuje JS a CSS až 3 dny. `index.php` proto načítá skripty a styly s verzí v adrese (`app.js?v=…`), takže po nasazení prohlížeč vezme nové.

## Automatické nahrávání na FTP (GitHub Actions)

Po každém pushi do `main` GitHub zkontroluje syntaxi PHP, spustí testy (`php tests/run.php`) a nahraje změněné soubory na hosting (`.github/workflows/deploy.yml`). Soubory, které z repa zmizí, na serveru smaže. Databázi v `data/` nikdy nepřepíše ani nesmaže. Složka `data/` proto musí zůstat v repu: kdyby z něj zmizela, akce by ji na serveru smazala i s databází.

Nastavení jednou: v repu na GitHubu **Settings → Secrets and variables → Actions**.

| Kde | Název | Hodnota |
|---|---|---|
| Secrets | `FTP_SERVER` | FTP server hostingu, např. `ftp.tvuj-web.cz` |
| Secrets | `FTP_USERNAME` | FTP uživatel |
| Secrets | `FTP_PASSWORD` | FTP heslo |
| Variables (nepovinné) | `FTP_DIR` | složka na serveru s lomítkem na konci, např. `www/matika/`; výchozí je kořen FTP účtu |
| Variables (nepovinné) | `FTP_PROTOCOL` | `ftps` (výchozí) nebo `ftp`, když hosting šifrované FTP neumí |

Pak v záložce **Actions** spusť „Nasazení na FTP“ ručně (Run workflow), nebo stačí další push.

## Lokální spuštění

```sh
php -S localhost:8080
```

a otevři <http://localhost:8080> (nebo rovnou `/holka`, `/kluk`). Lokální databáze je `data/matika-v2.sqlite`.

Testy (generátory, body, série, opakování chyb):

```sh
php tests/run.php
```

Ve vývojovém Docker kontejneru (`docker-compose.yml`, image `vibecode` s PHP) se spouští `php -S 0.0.0.0:$DEV_PORT` a appka je na hostu na `http://localhost:$HOST_PORT` (hodnoty v `.env`). `docs/`, `tasks/`, `tests/` a compose soubory se na FTP nenahrávají.

## Jak to funguje

* `index.php` + `app.js` + `paper.js` + `style.css` – jedna stránka, obrazovky se přepínají v JS. `index.php` pozná dítě z adresy (`/u/<přezdívka>`, `/holka`, `/kluk`; `/u/` je o složku hlouběji, relativní cesty řeší `<base>`). Efekty za správnou odpověď jsou v `app.js` (objekt `EFFECTS`, Web Animations API, bez knihovny); nový efekt = nová položka v `EFFECTS`.
* `api.php` – JSON API (`state`, `register`, `login`, `logout`, `pin`, `next`, `hint`, `answer`, `reveal`, `stats`, `card`, `rename`, `reset`, pro offline `pool` a `sync`, `time`). Každý požadavek nese `user` (id dítěte, 0 = bez sešitu); server ověří, že je dítě na zařízení přihlášené (`lib/auth.php`: tokeny v cookie `matika_sesity`, v databázi jen hash, tabulka `tokens`), jinak 401 a klient ukáže přihlášení (fronta offline výsledků zůstane). Příklady generuje a kontroluje server, rozpracovaný příklad drží v PHP session zvlášť pro každé dítě. `answer` vrací jen správně/špatně a rozbor chyby, správný výsledek s postupem dá až `reveal`. Opakované odeslání hotového příkladu vrátí 409, body se nepřičtou dvakrát.
* `lib/auth.php` – sešity (registrace s kódem třídy, PIN s hashem a zámkem, tokeny zařízení, smazání), třídy a kódy; `admin.php` – správa (čisté PHP, HTTP basic auth, heslo z `data/config.php`).
* `lib/game.php` – body, série, denní cíl, opakování chyb, statistiky. `lib/db.php` – SQLite (tabulky `users`, `results`, `review`, `issued`, `stickers` se založí samy).
* `lib/generators.php` – generátory příkladů podle obtížnosti a kontrola odpovědí.
* `lib/explain.php` – nápověda po krocích, postup řešení a rozbor typických chyb.
* `paper.js` – papír na počítání (canvas, pero, guma).
* `lib/algebra.php` – závorky a rovnice: generátory, výpočet výrazu po krocích, nápověda, postup, rozbor chyb.
* `lib/more.php` – procenta, dělitelnost, statistika, desetinná čísla (násobení a dělení): generátory, nápověda, postup, rozbor chyb.
* `lib/rimske.php` – římské číslice: převody, generátor (rozsahy v `RIMSKE`), kontrola zápisu, nápověda, postup, rozbor chyb.
* `gamekit.js` – společný základ her na plátně (plátno, barvy z CSS, velikost podle displeje); `snake.js`, `pexeso.js`, `g2048.js`, `breakout.js`, `flappy.js` – hry se stejným rozhraním (`create`, `start`, `stop`, `reset`, `turn`, `running`, `over`); rozcestník, limity a obrazovka hry jsou v `app.js` (`GAMES`).
* `rewards.js` – animace a texty odměn, popisy nálepek alba; `lib/rewards.php` – které odměny dítě dostalo a album (tabulka `stickers`).
* `offline.js` – zásoba příkladů, kontrola odpovědi v telefonu (přepis `check_answer` z PHP) a fronta výsledků (když se výsledek neuloží ani po uvolnění místa, appka to řekne, potichu se nic neztratí); `usage.js` – čas v appce; `sw.js` – service worker, díky kterému se stránka otevře bez internetu (stránky nejdřív ze sítě, skripty, styly a písma z cache). `lib/offline.php` – vydávání zásoby (`pool`, tabulka `issued`) a dodatečné započtení výsledků (`sync`). Shodu kontroly odpovědi v PHP a JS hlídá `php tests/parity_cases.php | node tests/parity.js` (běží i před nasazením).
* `manifest.php` – manifest pro přidání na plochu, pro každé dítě zvlášť (ikona a barva z `icon.php`, název podle přezdívky, vlastní `scope`: `./holka`, `./kluk`, `./u/<přezdívka>`).
* `fonts/` – písma Atkinson Hyperlegible a Patrick Hand (woff2, latin a latin-ext).
* `data/` – databáze (z nahrávání vyřazená, chrání ji `.htaccess` a `index.html`).
* `tests/` – testy bez frameworku, `php tests/run.php`.

Přihlášení je jen PIN (4 až 6 číslic) s brzdou proti hádání; chrání sešity před spolužáky, ne před útočníkem. Web je veřejný, žebříček vidí každé přihlášené dítě, proto přezdívky místo jmen a žádné e-maily. Heslo správce je mimo repo v `data/config.php`.
