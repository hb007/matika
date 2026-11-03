// Slova pro hru Slova (slova.js), podle jazyka. Velkými písmeny, oddělená
// mezerou nebo novým řádkem, na pořadí ani opakování nezáleží (duplicity se
// vyřadí). Do hry jdou slova o 3–8 písmenech. Angličtina a němčina mají
// český překlad za rovnítkem (mezera v překladu = podtržítko); ukáže se po
// ťuknutí na vyřešené slovo. Němčina bez ß (píše se SS).
window.SlovaWords = {
  cs: `
    PES LES DŮM MÍČ NOS SÝR LEV VŮZ OKO ZUB DUB MAK ROK DEN HAD KŮŇ SŮL MED LED LOĎ KOS JEŽ BUK ČAJ HRA LUK
    NŮŽ OSA RYS SEN MYŠ BOR BOK BUS CÍL ČAS DAR DÍL DÝM KRB KRK KUS LAK LET LOM MÍR MOL MUŽ NOC OBR PÁR
    PAS PÁV PEC POT PŮL RAK RÁJ ROH ROD SAD SOB SOK SUD ŠÁL ŠÍP ŠOK TÓN VAL VĚK VĚŽ VIR VLK ZEĎ ŽÁR BIČ
    BOD BÝK HÁK JÍL JED KEŘ KÓD NIT SÍŤ SYN TAH TRH TUK ŽÁK RET HÁJ LIS LEN ČÁP ŠÉF GÓL HŮL KOŠ MOP
    KLÍČ KOZA RYBA LIPA VODA MOST HRAD PTÁK SOVA LIST KMEN NEBE MRAK SNÍH ŽÁBA AUTO VLAK HORA POLE ŘEKA
    MOŘE SLON STŮL PERO DORT ZIMA LÉTO JARO NOTA KOLO SÍLA MAPA OKNO DÍRA GUMA VÁHA OBĚD LYŽE TRUP KÁVA
    RUKA NOHA TYGR KRUH DRAK DEKA ÚHEL OSMA DUHA DUCH HŘÍB MECH MLÝN OHEŇ OSEL ÚČET RÝŽE PRUT UZEL VÍKO
    ZRAK TĚLO DÉŠŤ KLAS BRKO CEDR CENA ČÁRA ČELO DĚDA KAPR KAŠE KLEC KNÍR KOUŘ KRAB KRÁL KUŘE LUPA MASO
    MÍSA MLHA OCAS OKAP OREL OVCE PLÁŽ PLOT PLUH PUSA RÁNO ROLE ROSA ŘEPA SÍTO SKLO SMRK STÁJ STAN ŠNEK
    UHLÍ VÍTR VLNA VRBA ZEMĚ ZRNO ZVON BOTA BUŘT CUKR ČERV DÁMA DRÁT DŘEZ GAUČ JÍVA KINO LANO LASO PÁRA
    RŮŽE HNŮJ
    HLAVA KOČKA KRÁVA LOUKA KRTEK LÍSKA ŽIDLE KNIHA TUŽKA ŠKOLA TŘÍDA ČÍSLO CHLÉB MÁSLO MLÉKO LAMPA VČELA
    ZÁMEK KÁMEN MĚSÍC OBLAK POTOK BRÁNA SKÁLA PÍSEK TRÁVA LIŠKA MINCE DŘEVO PAPÍR BARVA SEŠIT ÚLOHA PODÍL
    DÉLKA TÝDEN MRKEV KOLÁČ RAJČE MÍČEK HRNEK LŽÍCE VIDLE DOMEK ZEBRA OPICE MOTÝL ŽELVA RYTÍŘ KOMÍN SKŘÍŇ
    OBVOD BUBEN HLÍNA HOLUB HRNEC CHATA JEDLE JELEN JÍDLO JIKRA KOBRA KOMÁR KOPEC KORÁL KŘÍDA KYTKA LÁVKA
    LEBKA LOKET MOTOR MOUKA MÝDLO OBRAZ OLIVA OVOCE PALEC PÁSKA PEKAŘ PERLA PRACH PSANÍ RÁMUS RYBÁŘ SALÁT
    SEDLO SLÁMA SOCHA SPONA STOPA SUKNĚ SVETR ŠATNA ŠIŠKA ŠROUB ŠTIKA TALÍŘ TĚSTO TOPOL ÚSMĚV VĚDRO VĚTEV
    VOZÍK VÝTAH ZÁHON ZÁPAS ZLATO ŽALUD ANDĚL BALÓN BANÁN BAZÉN BETON BLESK BLÁTO BRÝLE BŘÍZA BUDÍK CELER
    CESTA CIHLA ČOČKA DÁREK DESKA DOPIS DROZD DÝMKA FARMA HASIČ HOUBA HRACH JASAN JEHLA JEŘÁB KABÁT KANÁL
    KARTA KAVKA KONEV KOTEL KOTVA KŘOVÍ KUŽEL LAHEV LILIE MALÍŘ MAŠLE METLA MLÁDĚ MOZEK NÁPOJ NŮŽKY OBRUČ
    OŘECH PALÁC PALMA PATRO PENÁL PIANO PILOT PIRÁT PLÁŠŤ POHÁR POKOJ POŠTA PUMPA ROBOT RYBÍZ ŘETĚZ SÁŇKY
    STROM ŠACHY ŠAŠEK TÁBOR TAŠKA TUNEL ULICE ÚTERÝ VĚŠÁK VÝLET ZÁVOD ŽEBRO ŽIVOT ILUZE
    JABLKO HRUŠKA SLUNCE HVĚZDA RYBNÍK OSTROV MEDVĚD VLAJKA KORUNA ŠTĚTEC ZLOMEK SOUČET ROZDÍL SOUČIN
    MINUTA HODINA MOUCHA TABULE KYTARA HOUSLE FLÉTNA CIBULE OKURKA BUCHTA VEČEŘE BRUSLE KAMION SÝKORA
    ŽIRAFA KLOKAN DELFÍN RAKETA POSTEL PEŘINA ŽEBŘÍK STOVKA ČEPICE HNÍZDO CHVOST JAHODA KACHNA KLUBKO
    KOLENO KOSTKA KŘÍDLO LOPATA MALINA NÁDOBA NEDĚLE NOVINY PAVOUK POKLAD POLICE PRAPOR PRSTEN ROHLÍK
    SEKERA SEMENO SLIVKA STRUNA SVÍČKA ŠAPITÓ ŠKEBLE ŠPEJLE ŠUPLÍK TRUHLA TUČŇÁK VRABEC ŽRALOK ANANAS
    CITRON CVRČEK DOKTOR FAZOLE FIALKA GLÓBUS HOBLÍK HRANOL HŘEBEN HŘEBÍK CHOBOT CHODBA JABLOŇ JEZERO
    KAKTUS KAŠTAN KLAVÍR KOMPAS KOSTEL KOŠILE KOŽICH KRAJÍC KRÁLÍK KŘESLO LAVICE LEKNÍN MANDLE MEDÚZA
    MELOUN MLÝNEK MUZEUM OBLOHA PLAMEN PLÁTNO PRÁDLO PRAMEN PSTRUH PŘÍBOR PŘILBA RECEPT SIRÉNA SOUSED
    SPÁNEK STUDNA SVATBA TRUBKA TŘEŠEŇ UČITEL VÁNOCE VČELÍN VODNÍK VOLANT VRTULE ZEDNÍK ZPĚVÁK ŽÍŽALA
    ŽELEZO
    LETADLO PLANETA ČTVEREC ZAHRADA KVĚTINA VEVERKA JESKYNĚ POČÍTAČ TELEFON ZRCADLO PAPRIKA POLÉVKA
    SNÍDANĚ KOLOTOČ POLŠTÁŘ POHÁDKA ČARODĚJ ROVNICE NÁSOBEK DĚLITEL ČITATEL PŘÍKLAD ODPOVĚĎ KRYCHLE
    LEDNICE NÁRAMEK PŘÍSTAV SAMOVAR SLEPICE STŘECHA TRAKTOR TULIPÁN ZÁCLONA ZÁSTĚRA AKTOVKA DIVADLO
    FONTÁNA HÁDANKA HALENKA HLEMÝŽĎ KAMARÁD KAPUSTA KLOBOUK KOLÍBKA KRAVATA KUCHYNĚ KUKAČKA KYSELKA
    LETIŠTĚ LOŽNICE LUCERNA NÁDRAŽÍ NÁMĚSTÍ OTAZNÍK PANENKA PEKÁRNA POLÍBEK RADNICE RÁMEČEK SEMAFOR
    SKŘÍTEK SUŠENKA SÝKORKA ŠVESTKA VÁLEČEK VAJÍČKO VESNICE
    BRAMBORA PRAVÍTKO OBDÉLNÍK KRUŽNICE KALENDÁŘ VELBLOUD KROKODÝL PAPOUŠEK MRAVENEC ČOKOLÁDA ZMRZLINA
    HOUPAČKA PROCENTO DESETINA VÝSLEDEK LIMONÁDA ORCHESTR SOLNIČKA ŽEHLIČKA KILOMETR KLUZIŠTĚ KUKUŘICE
    MYSLIVEC PASTELKA PÍŠŤALKA POMERANČ RUKAVICE SLUNÍČKO SNĚHULÁK STOLIČKA TELEVIZE VIDLIČKA ZELENINA
    ŽVÝKAČKA
    AUTOBUS BAZILIKA BRUSINKA CUKRÁRNA ČERVENKA DOPRAVA HODINKY HOKEJKA HOLUBNÍK HUDEBNÍK CHALUPA CHODNÍK
    JABLÍČKO JEDLIČKA JEŘABINA JÍDELNA JEZEVEC KAMÍNEK KAPLIČKA KAPESNÍK KAŠPÁREK KLÁVESA KLUBOVNA KNIHOVNA
    KONVICE KOSATEC KOŠÍČEK KRAJINA KRMÍTKO KUCHAŘKA KVĚTINÁČ LAHŮDKA LAVIČKA LEDOVEC MALOVÁNÍ MAMINKA
    MĚSTEČKO MOTÝLEK NÁKLAĎÁK NÁPOVĚDA OBRÁZEK OCHRANA OSTRŮVEK PAPRSEK PARAŠUTA PAVILON PLAVÁNÍ PLOVÁRNA
    POKLADNA POLEDNE POMŮCKA POPELKA PRAMÍNEK PRASÁTKO PROPISKA PŘEDLOHA PŘÍRODA RECEPCE ROHLÍČEK ROSTLINA
    ŘEMESLO SKŘIVAN SLAVNOST SLEPIČKA SMETANA SOUSTAVA STŘELKA SVAČINA ŠKOLNÍK TABULKA TANEČNÍK TATÍNEK
    TEPLOMĚR TORNÁDO TRAMVAJ TRUMPETA UČEBNICE VÁNOČKA VELRYBA VĚTRNÍK VODOPÁD VOLEJBAL VYSAVAČ ZAJÍČEK
    ZÁVODNÍK ZLATNÍK ZPÍVÁNÍ MAKOVEC KLOKÁNEK ZÁPISNÍK PODKOVA PODLAHA OHNIŠTĚ KOMINÍK SVÍTILNA ŽÁROVKA
    BATERKA DÁLNICE SILNICE ZASTÁVKA PASAŽÉR LETUŠKA KAPITÁN NÁMOŘNÍK KORMIDLO PLACHTA HORIZONT SOUMRAK
    SVÍTÁNÍ DRUŽICE METEORIT TELESKOP BATERIE KRUŽÍTKO ÚHLOMĚR SČÍTÁNÍ ODČÍTÁNÍ NÁSOBENÍ JEDNOTKA DESÍTKA
    POLOMĚR HRANICE ČÍSLICE ZNAMÉNKO ZÁVORKA ROVNOST VÝPOČET
      ADRESA AMULET ANTÉNA ARÉNA ATLAS AUTOMAT BABIČKA BAČKORA BALÍČEK BALKON BAMBUS BANKA BARÁK BARIÉRA
    BARVIČKA BATOH BAVLNA BEDNA BERUŠKA BIDLO BLÁZEN BLECHA BOUDA BOULE BRÁCHA BRANKA BRANKÁŘ BRÁZDA BROUK
    BUBENÍK BUDOVA BUNDA CEDULE CHYBA CIRKUS CUKROVÍ ČEPEL ČERNICE ČERPADLO ČESNEK ČÍŠNÍK DÁLKA DATUM
    DCERA DĚDEČEK DOLINA DOMOV DRÁHA DRUŽINA DUDLÍK GARÁŽ GAZELA GEPARD GORILA GRAMOFON HADICE HARFA
    HÁZENÁ HEDVÁBÍ HERBÁŘ HLÍDKA HODINÁŘ HOKEJ HOLIČ HOMOLE HORNÍK HOSTINA HOUSKA HRABĚ HRANOLKY HRÁŠEK
    HROCH HROZEN HŘIŠTĚ HUDBA HVOZD CHLAPEC CHMEL CHOMÁČ CHRÁM CHRŮST CHŘEST JASMÍN JEHLAN JEHNĚ JEŠTĚRKA
    JEZDEC JÍZDA JOGURT KABINA KADEŘNÍK KAJAK KAKAO KALHOTY KAMNA KANÁREK KANOE KAPLE KAPSA KARAVAN KAVÁRNA
    KAZETA KEČUP KLADIVO KLÁŠTER KLEŠTĚ KLIKA KLUZÁK KNEDLÍK KNOFLÍK KOČÁR KOLEČKO KOMETA KONÍK KOPAČKA
    KORÁLEK KORMORÁN KOŠÍK KOTLÍK KOZEL KRÁLOVNA KRAJKA KRÁPNÍK KRASLICE KREJČÍ KŘÍŽOVKA KROUŽEK KŘEČEK
    KŘEMEN KUFR KUKLA KULIČKA KUNA KUPOLE KUŘÁTKO KVÍTEK KYBLÍK LABUŤ LAKOMEC LASTURA LEDOVKA LEKTVAR
    LEOPARD LEPIDLO LÉKAŘ LÉKÁRNA LIMETKA LINKA LOĎKA LOSOS LOUTNA LVÍČE LYŽAŘ MAJÁK MALÍČEK MAMUT MAŇÁSEK
    MASKA MATRACE MEDVÍDEK MELODIE MĚŘÍTKO MINUTKA MISKA MLYNÁŘ MUŠKA MYSLIVNA NÁKUP NÁRAZ NETOPÝR NUDLE
    OBÁLKA OBCHODNÍK OBLÁČEK OBLEČENÍ ODZNAK OHRADA OKÉNKO OLOVO OMÁČKA ONDATRA OPERA ORANŽÁDA ORCHIDEJ
    OSLAVA OSTRUHA OTEC OVČÁK OVEČKA PADÁK PAHOREK PALIČKA PANÁČEK PANDA PANTOFEL PASEKA PAŠTIKA PAVIÁN
    PECKA PEČIVO PERNÍČEK PIKNIK PILNÍK PIŠKOT PLACKA PLAMÍNEK PLANINA PLÁTEK PLAVEC PODIUM PODNOS POHÁREK
    POHOVKA POKLICE POLEVA POSEL POSTAVA POTÁPĚČ POUŤ PRÁCE PRAČKA PRASE PROPAST PRSTÝNEK PŘEDSÍŇ PŘÍVOZ
    PŘÍZEMÍ PTÁČEK PUDINK PYRAMIDA RADIÁTOR RÁDIO RAMENO RAZÍTKO REKORD ROHOŽ ROLNÍK ROSNIČKA ROZINKA
    RUBÍN RYBIČKA RYCHLÍK ŘEDITEL ŘEZNÍK ŘIDIČ SALÁM SEDAČKA SEKAČKA SENO SÍDLIŠTĚ SILÁK SKLENICE SKLEP
    SKOKAN SKRÝŠ SLADKOST SLAVÍK SLIMÁK SLUHA SOKOL SOUBOJ SOUTĚŽ SPÍŽ SPORÁK STÁDO STATEK STOLEK STONOŽKA
    STRAKA STRAŠÁK STROJ STUDENT SVITEK SVORKA ŠÁLEK ŠAMPON ŠATY ŠAVLE ŠTÍR ŠPAČEK ŠPENDLÍK ŠPERK ŠTĚNĚ
    ŠTĚRK TAPETA TEPLÁKY TERČ TISKÁRNA TLAČÍTKO TOPINKA TRAKAŘ TRÁVNÍK TROUBA TRPASLÍK TRUHLÁŘ TURISTA
    TVAROH TYKEV UBROUS ÚLOVEK ÚSTŘICE VAGÓN VALOUN VANILKA VĚDEC VĚNEC VĚTRÁK VLÁČEK VLASY VLÁKNO VLOČKA
    VOJÁK VRÁNA VRCHOL VÝCHOD VÝHLED VÝKRES VÝLOHA VYDRA ZÁHADA ZÁKLAD ZÁKUSEK ZÁMEČEK ZÁPAD ZÁSOBA ZÁTOKA
    ZÁVAŽÍ ZELÍ ZMIJE ZOBÁK ZPRÁVA ZUBAŘ ZVONEK ZVONICE ŽABKA ŽLOUTEK ŽOKEJ
    ANTILOPA BAGR BAHNO BALET BALVAN BAŽANT BETLÉM BOBULE BRAMBORÁK BRATR BRNĚNÍ BŘEČŤAN CEMENT CHŘIPKA
    CVIČENÍ ČELENKA ČERVÁNKY ČTENÁŘ ČTVRTEK DATEL DĚDINA DEŠTNÍK DIAMANT DÍLNA DOMINO DOUPĚ DRAČEK DRUŽSTVO
    DUDY GALAXIE GEJZÍR GRANÁT HABR HÁČEK HALDA HEJNO HLADINA HLUBINA HOLÍNKA HOLUBICE HOUSENKA HRÁBĚ
    HRADBY HVĚZDÁŘ CHUDOBKA INDIÁN JAVOR JEŘÁBEK KACHLE KALUŽ KAMZÍK KANCELÁŘ KAPKA KAPRADÍ KAPUCE KAŠNA
    KLADKA KLUBÍČKO KOBEREC KOHOUT KOLEJ KOMIKS KOMORA KONZERVA KOPŘIVA KOSA KOSTRA KOUPELNA KRÁTER KŮRA
    LANOVKA LEDŇÁČEK LEKCE LETEC LÍHEŇ LÍSTEK MAKOVICE MALBA MASOPUST MATKA MEDOVNÍK MEZEK MIKROFON MLSOUN
    MOHYLA MUŠLE NÁRUČ OBLÁZEK OKOUN OLEJ OMELETA OSIKA OVÁL PALUBA PANORAMA PARNÍK PAVUČINA PEČEŤ PEKÁČ
    PELIKÁN PILA PÍSNIČKA PLETIVO PLYŠÁK PODKROVÍ PODZEMÍ POHLED PRAVIDLO PŘÍSLOVÍ PŘÍVĚS PUSTINA RÁKOS
    RAMPA RODINA ROLETA ROZHLAS RUKOJEŤ RYBNÍČEK ŘEZBÁŘ SÁNĚ SENÍK SIRUP SKAUT SKLADBA SKŘÍŇKA SNÍLEK SPÁČ
    SPOLUŽÁK SRDÍČKO SRNA SRNEC STEZKA STOLAŘ STOPKY STRÁŽCE STŘÍBRO SUCHAR SVĚTLO ŠÁTEK ŠEPOT ŠIMPANZ
    ŠPEJCHAR ŠTAFETA TÁCEK TALISMAN TANEC TEČKA TELE TOBOLKA TOPENÍ TRNKA TRUBAČ TYČKA ÚDOLÍ ÚKOL UZENÁČ
    VÁLEC VEJCE VESLO VODÁRNA VOSA VRÁTKA VRTÁK VÝHRA ZAHRÁDKA ZÁCHOD ZÁKLADNA ZÁŘIVKA ZÁVOJ ZLATOKOP ZNAK
    ZPĚV ZRNÍČKO ŽIDLIČKA ŽLAB
`,
  en: `
CAT=kočka DOG=pes SUN=slunce SEA=moře SKY=nebe BUS=autobus CAR=auto BED=postel CUP=hrnek HAT=klobouk
BOX=krabice EGG=vejce PEN=pero MAP=mapa KEY=klíč BAG=taška FOX=liška OWL=sova BEE=včela ANT=mravenec
COW=kráva PIG=prase HEN=slepice RAT=krysa BAT=netopýr JAM=džem TEA=čaj ICE=led ARM=paže LEG=noha
EAR=ucho EYE=oko TOE=prst_na_noze LIP=ret TOY=hračka RUG=kobereček FAN=větrák NET=síť POT=hrnec
PAN=pánev JAR=sklenice LOG=poleno OAK=dub ELM=jilm GUM=žvýkačka INK=inkoust ZOO=zoo WEB=pavučina
FOG=mlha MUD=bláto JET=tryskáč VAN=dodávka CAB=taxík HUT=chatrč DEN=doupě GYM=tělocvična KID=dítě
MOM=máma DAD=táta SON=syn BOW=luk YAK=jak EMU=emu ELF=elf APE=lidoop GEM=drahokam ORE=ruda AXE=sekera
SAW=pila NUT=ořech PEA=hrášek BUN=bulka PIE=koláč OIL=olej TIN=plechovka TUB=vana WIG=paruka
BIRD=pták FISH=ryba FROG=žába LION=lev BEAR=medvěd WOLF=vlk DUCK=kachna GOAT=koza LAMB=jehně
DEER=jelen CRAB=krab SEAL=tuleň SWAN=labuť TOAD=ropucha MOLE=krtek HARE=zajíc MOTH=můra WASP=vosa
WORM=červ SNOW=sníh RAIN=déšť WIND=vítr STAR=hvězda MOON=měsíc TREE=strom LEAF=list ROSE=růže
SEED=semínko ROOT=kořen LAKE=jezero POND=rybník HILL=kopec ROCK=skála SAND=písek WAVE=vlna SHIP=loď
BOAT=lodička ROAD=silnice BELL=zvon BOOK=kniha DESK=lavice DOOR=dveře WALL=zeď ROOF=střecha LAMP=lampa
SOCK=ponožka SHOE=bota COAT=kabát BELT=pásek RING=prsten DRUM=buben HORN=roh KITE=drak_na_pouštění
BALL=míč GAME=hra CAKE=dort MILK=mléko SOUP=polévka RICE=rýže CORN=kukuřice PEAR=hruška PLUM=švestka
LIME=limetka BEAN=fazole MEAT=maso SALT=sůl FORK=vidlička BOWL=miska DISH=talíř SINK=dřez SOAP=mýdlo
BATH=vana NOSE=nos HAND=ruka FOOT=chodidlo KNEE=koleno NECK=krk HAIR=vlasy FACE=obličej KING=král
GIFT=dárek CARD=karta CLAY=hlína GOLD=zlato IRON=železo WOOD=dřevo TENT=stan FARM=farma TOWN=městečko
CITY=město PARK=park SHOP=obchod BANK=banka MAIL=pošta NOTE=poznámka PAGE=stránka WORD=slovo
SONG=píseň TIME=čas YEAR=rok WEEK=týden HOUR=hodina DOLL=panenka BIKE=kolo TAXI=taxi
APPLE=jablko GRAPE=hroznové_víno LEMON=citron MANGO=mango PEACH=broskev BREAD=chléb HONEY=med
PIZZA=pizza PASTA=těstoviny SUGAR=cukr CANDY=bonbon JUICE=džus WATER=voda TABLE=stůl CHAIR=židle
SHELF=police CLOCK=hodiny PHONE=telefon RADIO=rádio PIANO=klavír MOUSE=myš HORSE=kůň SHEEP=ovce
TIGER=tygr ZEBRA=zebra CAMEL=velbloud SNAKE=had SHARK=žralok WHALE=velryba EAGLE=orel RAVEN=havran
ROBIN=červenka STORK=čáp OTTER=vydra SKUNK=skunk PANDA=panda KOALA=koala LLAMA=lama BEACH=pláž
RIVER=řeka OCEAN=oceán CLOUD=mrak STORM=bouřka FIELD=pole GRASS=tráva PLANT=rostlina TRAIN=vlak
PLANE=letadlo TRUCK=náklaďák WHEEL=kolo HOUSE=dům TOWER=věž BRICK=cihla STONE=kámen GLASS=sklo
PAPER=papír CHALK=křída RULER=pravítko BRUSH=štětec PAINT=barva SHIRT=košile SKIRT=sukně DRESS=šaty
SCARF=šála GLOVE=rukavice BOOTS=boty HEART=srdce BRAIN=mozek TOOTH=zub THUMB=palec SMILE=úsměv
MUSIC=hudba DANCE=tanec PARTY=oslava QUEEN=královna CROWN=koruna SWORD=meč ROBOT=robot GHOST=duch
MAGIC=kouzlo DREAM=sen NIGHT=noc LIGHT=světlo SPOON=lžíce KNIFE=nůž PLATE=talíř TOWEL=ručník
CHEST=truhla TULIP=tulipán DAISY=sedmikráska MAPLE=javor CEDAR=cedr TORCH=pochodeň ONION=cibule
BANANA=banán ORANGE=pomeranč CHERRY=třešeň CARROT=mrkev POTATO=brambora TOMATO=rajče PEPPER=pepř
CHEESE=sýr BUTTER=máslo COOKIE=sušenka MUFFIN=muffin RABBIT=králík MONKEY=opice DONKEY=osel
TURTLE=želva PARROT=papoušek PIGEON=holub SPIDER=pavouk BEETLE=brouk SALMON=losos LIZARD=ještěrka
JAGUAR=jaguár FALCON=sokol FOREST=les ISLAND=ostrov DESERT=poušť JUNGLE=džungle VALLEY=údolí
GARDEN=zahrada BRIDGE=most STREET=ulice SCHOOL=škola OFFICE=kancelář MARKET=trh CASTLE=hrad
PALACE=palác CHURCH=kostel WINDOW=okno CARPET=koberec PILLOW=polštář MIRROR=zrcadlo BOTTLE=láhev
BASKET=košík BUCKET=kbelík HAMMER=kladivo LADDER=žebřík CANDLE=svíčka POCKET=kapsa BUTTON=knoflík
JACKET=bunda SOCKET=zásuvka GUITAR=kytara VIOLIN=housle TICKET=lístek PLANET=planeta ROCKET=raketa
ANCHOR=kotva WIZARD=čaroděj DRAGON=drak KNIGHT=rytíř PIRATE=pirát SAILOR=námořník DOCTOR=lékař
FARMER=farmář SUMMER=léto WINTER=zima AUTUMN=podzim SPRING=jaro SUNDAY=neděle MONDAY=pondělí
FRIDAY=pátek FLOWER=květina PENCIL=tužka PRINCE=princ CIRCLE=kruh SQUARE=čtverec NUMBER=číslo
LETTER=dopis PUZZLE=hádanka GARAGE=garáž MUSEUM=muzeum CAMERA=fotoaparát
CHICKEN=kuře PENGUIN=tučňák DOLPHIN=delfín GIRAFFE=žirafa HAMSTER=křeček LOBSTER=humr OSTRICH=pštros
PEACOCK=páv SPARROW=vrabec BLANKET=deka BISCUIT=sušenka PUMPKIN=dýně CABBAGE=zelí LETTUCE=hlávkový_salát
AVOCADO=avokádo KITCHEN=kuchyně BEDROOM=ložnice LIBRARY=knihovna STATION=nádraží THEATER=divadlo
VILLAGE=vesnice COUNTRY=země MACHINE=stroj PICTURE=obrázek TEACHER=učitel STUDENT=student
FREEDOM=svoboda RAINBOW=duha THUNDER=hrom WEATHER=počasí MORNING=ráno EVENING=večer HOLIDAY=prázdniny
PRESENT=dárek BALLOON=balónek CHAPTER=kapitola LANTERN=lucerna TRUMPET=trumpeta FEATHER=pírko
MONSTER=příšera CAPTAIN=kapitán UNIFORM=uniforma CRYSTAL=krystal DIAMOND=diamant PYRAMID=pyramida
VOLCANO=sopka GLACIER=ledovec HARBOR=přístav MESSAGE=zpráva PAINTER=malíř
ELEPHANT=slon CUCUMBER=okurka HOSPITAL=nemocnice BIRTHDAY=narozeniny SANDWICH=sendvič
DINOSAUR=dinosaurus KANGAROO=klokan SQUIRREL=veverka MOSQUITO=komár TORTOISE=želva FOOTBALL=fotbal
BASEBALL=baseball NOTEBOOK=sešit HOMEWORK=domácí_úkol UMBRELLA=deštník COMPUTER=počítač
KEYBOARD=klávesnice MOUNTAIN=hora SUNSHINE=sluneční_svit SEASHELL=mušle PAINTING=obraz
TREASURE=poklad AIRPLANE=letadlo BACKPACK=batoh FLAMINGO=plameňák HEDGEHOG=ježek DAUGHTER=dcera
LANGUAGE=jazyk QUESTION=otázka ALPHABET=abeceda MAGAZINE=časopis PRINCESS=princezna SCISSORS=nůžky
CALENDAR=kalendář TRIANGLE=trojúhelník ENVELOPE=obálka
  ACROBAT=akrobat ANTENNA=anténa AQUARIUM=akvárium BALCONY=balkon BANDAGE=obvaz BATHTUB=vana
BICYCLE=jízdní_kolo BLOSSOM=květ BRACELET=náramek BROCCOLI=brokolice BUFFALO=bizon BUTCHER=řezník
CABINET=skříňka CARAVAN=karavan CARNIVAL=karneval CEILING=strop CHAMPION=šampion CHIMNEY=komín
COCONUT=kokos COMPASS=kompas CONCERT=koncert COSTUME=kostým COTTAGE=chalupa CRICKET=cvrček
CUPCAKE=dortík CURTAIN=záclona CUSHION=polštářek DENTIST=zubař DOORBELL=zvonek DRAWING=kresba
DUSTBIN=popelnice EARRING=náušnice ECLIPSE=zatmění EMERALD=smaragd EXPLORER=objevitel FACTORY=továrna
FIREMAN=hasič FISHING=rybaření FOUNTAIN=fontána HAIRCUT=účes HAMMOCK=houpací_síť HORIZON=obzor
ICEBERG=ledovec JOURNEY=cesta JUGGLER=žonglér KETCHUP=kečup KINGDOM=království LAUNDRY=prádlo
LEOPARD=levhart LOLLIPOP=lízátko MAGICIAN=kouzelník MAILBOX=poštovní_schránka MERMAID=mořská_panna
MINERAL=minerál MUSHROOM=houba NECKLACE=náhrdelník OCTOPUS=chobotnice ORCHARD=sad PANCAKE=palačinka
PANTHER=panter PASSPORT=pas PELICAN=pelikán PLASTIC=plast POPCORN=popcorn PORTRAIT=portrét
POSTMAN=pošťák PRINTER=tiskárna PUDDING=pudink RACCOON=mýval RAILWAY=železnice RAINCOAT=pláštěnka
REINDEER=sob SAILBOAT=plachetnice SAUSAGE=klobása SCIENCE=věda SCOOTER=koloběžka SEAGULL=racek
SHAMPOO=šampon SKELETON=kostra SLIPPER=pantofel SNOWMAN=sněhulák SOLDIER=voják SPINACH=špenát
STADIUM=stadion STAPLER=sešívačka STICKER=nálepka STOMACH=žaludek SUITCASE=kufr SUNRISE=východ_slunce
SURPRISE=překvapení SWEATER=svetr TRACTOR=traktor TRAFFIC=doprava UNICORN=jednorožec VAMPIRE=upír
VANILLA=vanilka VEHICLE=vozidlo VICTORY=vítězství WARRIOR=bojovník WHISTLE=píšťalka WINDMILL=větrný_mlýn
YOGHURT=jogurt BATHROOM=koupelna BUILDING=budova CAMPFIRE=táborák CHESTNUT=kaštan COOKBOOK=kuchařka
DUMPLING=knedlík FESTIVAL=festival FIREWORK=ohňostroj GOLDFISH=zlatá_rybka HANDBALL=házená
INVENTOR=vynálezce LADYBIRD=beruška LEMONADE=limonáda MARATHON=maraton MEATBALL=karbanátek
MIDNIGHT=půlnoc MUSICIAN=hudebník NEIGHBOR=soused PLATFORM=nástupiště PLAYROOM=herna POSTCARD=pohlednice
RAINDROP=kapka_deště SCHEDULE=rozvrh SCULPTOR=sochař SEAHORSE=mořský_koník SHOELACE=tkanička
SIDEWALK=chodník SNOWBALL=sněhová_koule STARFISH=hvězdice TEASPOON=lžička TOMORROW=zítra VACATION=dovolená
ACORN=žalud ALARM=budík ALIEN=mimozemšťan ANGEL=anděl ANKLE=kotník ARROW=šíp ATTIC=půda BADGE=odznak
BAKER=pekař BANJO=bendžo BARN=stodola BEARD=vousy BENCH=lavička BERRY=bobule BLADE=čepel BLOCK=kostka
BOARD=deska BRAKE=brzda BRANCH=větev BREEZE=vánek BUNNY=zajíček CABIN=chatka CANAL=kanál CANOE=kánoe
CHAIN=řetěz CHEF=kuchař CHICK=kuřátko CHILD=dítě CIRCUS=cirkus CLOWN=klaun COAST=pobřeží COMET=kometa
CORAL=korál COUCH=gauč CRANE=jeřáb CREAM=smetana DIARY=deník DINNER=večeře DOUGH=těsto DRILL=vrtačka
EARTH=Země ENGINE=motor FAIRY=víla FENCE=plot FERRY=trajekt FLAG=vlajka FLAME=plamen FLOUR=mouka
FLUTE=flétna FRAME=rám FROST=mráz FRUIT=ovoce GIANT=obr GOOSE=husa HEDGE=živý_plot HELMET=helma
HIPPO=hroch HOTEL=hotel IGLOO=iglú JEANS=džíny JEWEL=klenot JUDGE=soudce KAYAK=kajak LADLE=naběračka
LUNCH=oběd MAGNET=magnet MEDAL=medaile MELON=meloun METAL=kov MODEL=model MOOSE=los NAIL=hřebík
NURSE=zdravotní_sestra OLIVE=oliva ORBIT=oběžná_dráha PALM=palma PEARL=perla PEDAL=pedál PILOT=pilot
POPPY=mák PRIZE=cena PUPPY=štěně QUILT=prošívaná_deka RIDER=jezdec SALAD=salát SAUCE=omáčka SCALE=váha
SCOUT=skaut SHELL=mušle SHORE=břeh SHOWER=sprcha SKATE=brusle SLIDE=skluzavka SLOTH=lenochod SNAIL=šnek
SPACE=vesmír SPICE=koření STAMP=známka STEAM=pára STICK=hůl STOOL=stolička STRAW=brčko SWING=houpačka
SYRUP=sirup THORN=trn TOAST=topinka TONGUE=jazyk TRAIL=stezka TRUNK=kmen UNCLE=strýc VOICE=hlas
WAGON=vůz WATCH=hodinky WHEAT=pšenice WITCH=čarodějnice WORLD=svět YACHT=jachta APRON=zástěra
ALMOND=mandle ANIMAL=zvíře ARTIST=umělec BADGER=jezevec BAMBOO=bambus BEAVER=bobr BUBBLE=bublina
CACTUS=kaktus CANNON=dělo CELLAR=sklep CHAPEL=kaple CLOVER=jetel COFFEE=káva COPPER=měď COUSIN=bratranec
COWBOY=kovboj CRAYON=pastelka DANCER=tanečník FAMILY=rodina FINGER=prst FLIGHT=let FOSSIL=zkamenělina
FRIEND=kamarád GALAXY=galaxie GARLIC=česnek GINGER=zázvor GOBLIN=skřet HOCKEY=hokej INSECT=hmyz
KETTLE=konvice KITTEN=koťátko LAPTOP=notebook MAGPIE=straka MARBLE=kulička MEADOW=louka MITTEN=palčák
MOTHER=matka NEEDLE=jehla NEPHEW=synovec NOODLE=nudle OYSTER=ústřice PARADE=průvod PEANUT=arašíd
PICNIC=piknik POLICE=policie PUPPET=loutka RECIPE=recept RIBBON=stuha RIDDLE=hádanka SADDLE=sedlo
SHADOW=stín SHOVEL=lopata SILVER=stříbro SISTER=sestra SLEDGE=sáně SPONGE=houba_na_mytí STABLE=stáj
STATUE=socha SUNSET=západ_slunce TEAPOT=konvička TENNIS=tenis THREAD=nit TOILET=záchod TROPHY=trofej
TUNNEL=tunel TURKEY=krocan WALNUT=vlašský_ořech WALRUS=mrož ZIPPER=zip HUNTER=lovec NAPKIN=ubrousek
PICKLE=kyselá_okurka SEASON=roční_období PUFFIN=papuchalk RAISIN=rozinka TURNIP=tuřín WEASEL=lasička
BAGGAGE=zavazadla BEEHIVE=úl CARTOON=kreslený_film CHEETAH=gepard CLIMATE=podnebí FREEZER=mrazák
GALLERY=galerie GORILLA=gorila GRANITE=žula HIGHWAY=dálnice HISTORY=dějepis JASMINE=jasmín LEATHER=kůže
MAMMOTH=mamut MUSTARD=hořčice OATMEAL=ovesná_kaše PADLOCK=visací_zámek PAJAMAS=pyžamo PARSLEY=petržel
PERFUME=parfém PHARAOH=faraon PLUMBER=instalatér REPTILE=plaz ROOSTER=kohout SHERIFF=šerif SURGEON=chirurg
TADPOLE=pulec THIMBLE=náprstek TOASTER=topinkovač TOOLBOX=kufřík_na_nářadí TORNADO=tornádo TRAILER=přívěs
VULTURE=sup THISTLE=bodlák VINEGAR=ocet HANDBAG=kabelka RADIATOR=radiátor SCORPION=štír SHEPHERD=pastýř
TEXTBOOK=učebnice WARDROBE=šatní_skříň ANTELOPE=antilopa ARMCHAIR=křeslo BARBECUE=grilování
CORRIDOR=chodba CUPBOARD=kredenc DORMOUSE=plch EGGPLANT=lilek ENGINEER=inženýr FOOTPATH=pěšina
GARDENER=zahradník HILLSIDE=stráň LIFEBOAT=záchranný_člun MARIGOLD=měsíček MEDICINE=lék MOTORWAY=dálnice
PINECONE=šiška POPSICLE=nanuk PORRIDGE=kaše RECORDER=zobcová_flétna SEASHORE=mořské_pobřeží
SEEDLING=sazenice SNOWDROP=sněženka SPELLING=pravopis STARLING=špaček TRAVELER=cestovatel UNIVERSE=vesmír
WORKSHOP=dílna ZUCCHINI=cuketa
ATLAS=atlas AUTHOR=autor BACON=slanina BAGEL=bagel BALLET=balet BANNER=prapor BARREL=sud BASIN=umyvadlo
BEACON=maják BEETROOT=červená_řepa BELLY=břicho BLIZZARD=vánice BONNET=čepeček BOUQUET=kytice BOXER=boxer
BUCKLE=přezka BUFFET=bufet BULB=žárovka BULLDOG=buldok BURROW=nora CAMPSITE=kemp CANYON=kaňon CARGO=náklad
CATTLE=dobytek CHESS=šachy CHORUS=sbor CINEMA=kino CLARINET=klarinet CLIFF=útes CLOAK=plášť COBRA=kobra
COCOA=kakao COLLAR=límec CORNER=roh COTTON=bavlna CRADLE=kolébka CRATER=kráter DAGGER=dýka DESSERT=dezert
DOMINO=domino DOORMAT=rohožka DRIZZLE=mrholení DUSTPAN=lopatka_na_smetí EASEL=malířský_stojan ELBOW=loket
EMPEROR=císař ERASER=guma FAUCET=kohoutek FIDDLE=housle FOREHEAD=čelo FRECKLE=piha FRIDGE=lednice
GAZELLE=gazela GEYSER=gejzír GOBLET=pohár GRANDMA=babička GRANDPA=děda GRAVEL=štěrk GUTTER=okap HARP=harfa
HARVEST=sklizeň HAZEL=líska HERON=volavka HIVE=úl HOODIE=mikina HOOF=kopyto HUSKY=husky ICICLE=rampouch
JIGSAW=skládačka KENNEL=psí_bouda KIWI=kiwi LAGOON=laguna LENTIL=čočka LOCKER=skříňka LUGGAGE=zavazadla
MANE=hříva MAYOR=starosta MINT=máta MONEY=peníze MOSAIC=mozaika MUSSEL=slávka NECTAR=nektar NOVEL=román
OASIS=oáza OBOE=hoboj ORCHID=orchidej OVEN=trouba PALETTE=paleta PANTRY=spíž PASTRY=pečivo PEBBLE=oblázek
PHEASANT=bažant PIGLET=sele PILLAR=sloup POETRY=poezie PRAWN=kreveta PULLEY=kladka PYTHON=krajta
QUAIL=křepelka RACKET=raketa RAFT=vor REED=rákos RHINO=nosorožec SAFARI=safari SANDAL=sandál SARDINE=sardinka
SAUCER=talířek SEESAW=houpačka_na_prkně SHIELD=štít SLEEVE=rukáv SNORKEL=šnorchl SOFA=pohovka STOVE=sporák
STRING=provázek SUMMIT=vrchol SWAMP=bažina TOUCAN=tukan TREETOP=koruna_stromu TUNA=tuňák TWIG=větvička
VELVET=samet VIOLET=fialka WAFFLE=vafle WAITER=číšník WALLET=peněženka WOOL=vlna WREATH=věnec YOLK=žloutek
`,
  de: `
ZOO=zoo BUS=autobus EIS=zmrzlina OHR=ucho ARM=paže TEE=čaj SEE=jezero TAG=den ZUG=vlak AST=větev
BAD=koupelna BAU=stavba GAS=plyn HAI=žralok KUH=kráva OPA=děda OMA=babička RAD=kolo REH=srna
TAL=údolí TOR=brána UHR=hodiny WAL=velryba WEG=cesta ZEH=prst_na_noze DOM=dóm HOF=dvůr MAI=květen
MUT=odvaha ORT=místo POL=pól RAT=rada BÄR=medvěd TÜR=dveře
HAUS=dům BAUM=strom HUND=pes BALL=míč BUCH=kniha BETT=postel MAUS=myš BROT=chléb MOND=měsíc WALD=les
BERG=hora SAND=písek WIND=vítr ROSE=růže SAFT=šťáva KÄSE=sýr NASE=nos HAND=ruka FUSS=noha KOPF=hlava
HAAR=vlasy AUGE=oko BEIN=noha MUND=ústa ZAHN=zub HERZ=srdce KNIE=koleno ARZT=lékař HOSE=kalhoty
HEMD=košile GELD=peníze BANK=banka POST=pošta DORF=vesnice PARK=park BURG=hrad BOOT=loď AUTO=auto
BAHN=železnice WAND=stěna DACH=střecha BILD=obrázek ENTE=kachna GANS=husa HUHN=slepice IGEL=ježek
LÖWE=lev WOLF=vlk AFFE=opice ESEL=osel HASE=zajíc WURM=červ FELD=pole MEER=moře GOLD=zlato GLAS=sklo
HOLZ=dřevo ERDE=země LUFT=vzduch GRAS=tráva NUSS=ořech KOHL=zelí REIS=rýže TEIG=těsto SALZ=sůl
TOPF=hrnec OFEN=trouba SOFA=pohovka ZAUN=plot ROCK=sukně RING=prsten HEXE=čarodějnice LIED=píseň
TANZ=tanec FEST=slavnost HEFT=sešit JAHR=rok KOCH=kuchař TURM=věž KINO=kino EULE=sova OBST=ovoce
NEST=hnízdo SOHN=syn TIER=zvíře ZELT=stan ELCH=los
KATZE=kočka TISCH=stůl STUHL=židle FISCH=ryba VOGEL=pták PFERD=kůň STERN=hvězda FLUSS=řeka REGEN=déšť
SONNE=slunce BLATT=list BIRNE=hruška MILCH=mléko SUPPE=polévka WURST=klobása HONIG=med BAUCH=břicho
SCHUH=bota MÜTZE=čepice JACKE=bunda STADT=město HAFEN=přístav INSEL=ostrov LAMPE=lampa BRIEF=dopis
KARTE=karta SPIEL=hra PUPPE=panenka KUGEL=koule FUCHS=liška SCHAF=ovce ZIEGE=koza BIENE=včela
KÄFER=brouk WOLKE=mrak BLITZ=blesk NEBEL=mlha WIESE=louka WELLE=vlna STEIN=kámen FEUER=oheň
BLUME=květina APFEL=jablko GURKE=okurka MÖHRE=mrkev SALAT=salát NUDEL=nudle GABEL=vidlička
TASSE=šálek DECKE=deka BLUSE=halenka KLEID=šaty KRONE=koruna KÖNIG=král PRINZ=princ ZWERG=trpaslík
RIESE=obr ENGEL=anděl GEIST=duch MUSIK=hudba KERZE=svíčka GEIGE=housle FLÖTE=flétna STIFT=tužka
TAFEL=tabule FARBE=barva WOCHE=týden MONAT=měsíc ABEND=večer NACHT=noc VATER=otec BAUER=sedlák
PILOT=pilot ADLER=orel TAUBE=holub SPATZ=vrabec MARKT=trh LADEN=obchod
KUCHEN=koláč SCHULE=škola KIRCHE=kostel ZIMMER=pokoj FROSCH=žába SCHNEE=sníh WASSER=voda BANANE=banán
TOMATE=rajče ZUCKER=cukr LÖFFEL=lžíce MESSER=nůž TELLER=talíř PFANNE=pánev KISSEN=polštář
TREPPE=schody GARTEN=zahrada GÜRTEL=pásek RITTER=rytíř DRACHE=drak SCHATZ=poklad GLOCKE=zvon
LEHRER=učitel KREIDE=křída LINEAL=pravítko SCHERE=nůžky PINSEL=štětec PAPIER=papír STUNDE=hodina
MINUTE=minuta MORGEN=ráno SOMMER=léto WINTER=zima HERBST=podzim MONTAG=pondělí MUTTER=matka
BRUDER=bratr FREUND=kamarád BÄCKER=pekař RAKETE=raketa PLANET=planeta KAMERA=kamera DELFIN=delfín
SPINNE=pavouk STORCH=čáp SCHWAN=labuť KOFFER=kufr SCHIRM=deštník BRÜCKE=most MUSEUM=muzeum
ORANGE=pomeranč TRAUBE=hrozen MELONE=meloun BUTTER=máslo
KIRSCHE=třešeň ZWIEBEL=cibule PFEFFER=pepř FLASCHE=láhev TEPPICH=koberec FENSTER=okno TROMMEL=buben
KLAVIER=klavír GITARRE=kytara SCHÜLER=žák FREITAG=pátek SONNTAG=neděle FAMILIE=rodina TOCHTER=dcera
NACHBAR=soused POLIZEI=policie BAHNHOF=nádraží FAHRRAD=jízdní_kolo ROBOTER=robot TELEFON=telefon
ELEFANT=slon GIRAFFE=žirafa PINGUIN=tučňák PAPAGEI=papoušek HAMSTER=křeček SCHWEIN=prase
SCHRANK=skříň SPIEGEL=zrcadlo SCHLOSS=zámek STRASSE=ulice THEATER=divadlo ZEITUNG=noviny
ZITRONE=citron PFLAUME=švestka
GESCHENK=dárek FRÜHLING=jaro FLUGZEUG=letadlo MASCHINE=stroj COMPUTER=počítač KROKODIL=krokodýl
SCHLANGE=had RUCKSACK=batoh ERDBEERE=jahoda HIMBEERE=malina BRÖTCHEN=rohlík
SAMSTAG=sobota SCHMUCK=šperky KAROTTE=mrkev RUTSCHE=skluzavka WÜRFEL=kostka GEMÜSE=zelenina
OSTERN=Velikonoce MITTAG=poledne KÜCHE=kuchyně
LEHRERIN=učitelka FREUNDIN=kamarádka SCHULTER=rameno HANDTUCH=ručník MITTWOCH=středa DIENSTAG=úterý
TOILETTE=záchod SCHNECKE=šnek EIDECHSE=ještěrka BAUMHAUS=domek_na_stromě FASCHING=masopust
SCHAUKEL=houpačka GEWITTER=bouřka SCHATTEN=stín
  APOTHEKE=lékárna BADEHOSE=plavky DRACHEN=papírový_drak EINHORN=jednorožec FISCHER=rybář GEMÄLDE=obraz
GESICHT=obličej KASTANIE=kaštan KELLNER=číšník KLEIDUNG=oblečení KNOCHEN=kost KRANICH=jeřáb
KRAWATTE=kravata MATRATZE=matrace NASHORN=nosorožec NILPFERD=hroch OHRRING=náušnice PALETTE=paleta
PAPRIKA=paprika PFIRSICH=broskev POSTBOTE=pošťák PULLOVER=svetr PYRAMIDE=pyramida SCHAUFEL=lopata
SCHÄFER=pastýř SCHINKEN=šunka SCHMIED=kovář SCHNABEL=zobák SCHWAMM=houba_na_mytí SPARGEL=chřest
STIEFEL=holínka STRUMPF=punčocha TEEKANNE=konvice_na_čaj TRAKTOR=traktor TRICHTER=trychtýř
UNIFORM=uniforma VORHANG=záclona WINDRAD=větrník ZAUBERER=kouzelník ZUCCHINI=cuketa AUSFLUG=výlet
BÄCKEREI=pekárna BAUSTEIN=kostka_stavebnice ERDBALL=zeměkoule FLAMINGO=plameňák FUSSBALL=fotbal
GEBIRGE=pohoří HAUSTIER=domácí_zvíře KALENDER=kalendář KAPITÄN=kapitán KASPERLE=kašpárek
LEHRBUCH=učebnice MAULWURF=krtek OSTEREI=velikonoční_vajíčko PARADIES=ráj SCHULHOF=školní_dvůr
TIERPARK=zoologická_zahrada TORWART=brankář WOHNUNG=byt ZAHNARZT=zubař ZUKUNFT=budoucnost
AUFGABE=úloha DREIECK=trojúhelník QUADRAT=čtverec RECHNUNG=výpočet HUNDERT=sto TAUSEND=tisíc
ANTWORT=odpověď ALPHABET=abeceda SPRACHE=jazyk GEDICHT=báseň MÄRCHEN=pohádka KAPITEL=kapitola
FREIZEIT=volný_čas HOCHZEIT=svatba PICKNICK=piknik COUSINE=sestřenice
AMSEL=kos BIRKE=bříza BOHNE=fazole BREZEL=preclík BÜRSTE=kartáč DRAHT=drát EIMER=kbelík ERBSE=hrášek
FAHNE=vlajka FEDER=pírko GEIER=sup GLÜCK=štěstí HECKE=živý_plot HÖHLE=jeskyně HÜGEL=kopec KAKAO=kakao
KANAL=kanál KETTE=řetěz KISTE=bedna KNOPF=knoflík KREIS=kruh LACHS=losos LINDE=lípa MAGEN=žaludek
MANTEL=kabát MOHN=mák MÖWE=racek NADEL=jehla NAGEL=hřebík OSTEN=východ PALME=palma PFEIL=šíp
PFOTE=tlapka PILZ=houba PUDEL=pudl QUARK=tvaroh RABE=havran RASEN=trávník ROBBE=tuleň SAHNE=smetana
SCHAL=šála SEIFE=mýdlo SENF=hořčice SOCKE=ponožka STALL=stáj STROH=sláma TANNE=jedle TRAUM=sen
WAAGE=váha WEIDE=pastvina WOLLE=vlna WÜSTE=poušť ZANGE=kleště AMEISE=mravenec BALKON=balkon DACHS=jezevec
ENKEL=vnuk FASAN=bažant FERIEN=prázdniny FLIEGE=moucha FOHLEN=hříbě HAMMER=kladivo HEIMAT=domov
HIMMEL=nebe HIRSCH=jelen HUMMER=humr INSEKT=hmyz KAKTUS=kaktus KANONE=dělo KÄFIG=klec KÜRBIS=dýně
LEITER=žebřík LIBELLE=vážka MÄDCHEN=dívka MARDER=kuna MÖBEL=nábytek MÜHLE=mlýn MURMEL=kulička NEFFE=synovec
ONKEL=strýc PAKET=balík PIRAT=pirát RÄTSEL=hádanka RAUPE=housenka REISE=cesta SCHAUM=pěna SESSEL=křeslo
SIEGER=vítěz SPATEN=rýč STRAND=pláž TANTE=teta TASCHE=taška TINTE=inkoust URLAUB=dovolená WECKER=budík
WIPPE=houpačka ZIRKUS=cirkus EISBÄR=lední_medvěd BAGGER=bagr BALLETT=balet BÜCHEREI=knihovna DECKEL=víčko
FÖRSTER=hajný GEPÄCK=zavazadla GORILLA=gorila HEIZUNG=topení KAMEL=velbloud KÄNGURU=klokan KAPELLE=kaple
KAPUZE=kapuce KOMPASS=kompas KRÄHE=vrána MALBUCH=omalovánky MEISTER=mistr MÜNZE=mince MUSCHEL=mušle
NUSSBAUM=ořešák OBSTBAUM=ovocný_strom PANTHER=panter PINZETTE=pinzeta RADIERER=guma REGAL=police
REITER=jezdec SÄNGER=zpěvák SEEHUND=tuleň SEGEL=plachta SEILBAHN=lanovka SPECHT=datel SPINAT=špenát
STEMPEL=razítko STRAUSS=pštros SÜDEN=jih TOASTER=topinkovač TORTE=dort TULPE=tulipán VEILCHEN=fialka
WAGEN=vůz WALNUSS=vlašský_ořech WAPPEN=erb WASCHBÄR=mýval WEIZEN=pšenice WESTEN=západ ZIRKEL=kružítko
NORDEN=sever AQUARIUM=akvárium AUTOBAHN=dálnice BIRNBAUM=hrušeň FERNROHR=dalekohled FUSSWEG=chodník
HALSBAND=obojek HANDBALL=házená HOLZHAUS=dřevěný_dům MAULTIER=mula MOTORRAD=motorka SANDALE=sandál
SEESTERN=hvězdice TAUCHER=potápěč TELESKOP=teleskop TIERARZT=veterinář TROMPETE=trumpeta WALDHORN=lesní_roh
WANDUHR=nástěnné_hodiny HAUSTÜR=domovní_dveře
ABFALL=odpad ACKER=pole ANKER=kotva ARMBAND=náramek ASCHE=popel AUSWEIS=průkaz BACKOFEN=trouba BEERE=bobule
BESEN=koště BLECH=plech BOHRER=vrtačka BONBON=bonbon BRUNNEN=studna BÜGEL=ramínko DAUMEN=palec DONNER=hrom
DRUCKER=tiskárna DUSCHE=sprcha EICHEL=žalud EISBERG=ledovec FACKEL=pochodeň FADEN=nit FÄHRE=trajekt
FELSEN=skála FINGER=prst FLOSSE=ploutev FORELLE=pstruh FRISEUR=kadeřník FÜLLER=plnicí_pero GARAGE=garáž
GEBÄCK=pečivo GESPENST=strašidlo GETREIDE=obilí GEWÜRZ=koření HAFER=oves HÄHNCHEN=kuře HALS=krk HANDY=mobil
HARFE=harfa HELM=helma HENKEL=ucho_hrnku HERD=sporák HOCKER=stolička HORN=roh HÜTTE=chata JÄGER=myslivec
JOGHURT=jogurt KAMIN=krb KANU=kánoe KARPFEN=kapr KASSE=pokladna KATER=kocour KELLER=sklep KESSEL=kotel
KINN=brada KIOSK=stánek KLEBER=lepidlo KNETE=modelína KOBOLD=skřítek KÖCHIN=kuchařka KOHLE=uhlí KOMET=kometa
KORB=koš KRAGEN=límec KRAKE=chobotnice KRÖTE=ropucha KÜKEN=kuřátko KUNST=umění KUTSCHE=kočár LAKEN=prostěradlo
LATERNE=lucerna LAUB=listí LEHM=hlína LEINE=vodítko LIPPE=ret LOCH=díra LUCHS=rys MAIS=kukuřice MANDEL=mandle
MAUER=zeď MEISE=sýkora MIKROFON=mikrofon MÖNCH=mnich MOOS=mech MÜCKE=komár MÜLL=smetí PARFÜM=parfém PFAU=páv
PFEIFE=píšťalka PFÜTZE=louže PLAKAT=plakát POKAL=pohár PONY=poník PUDDING=pudink PUMPE=pumpa QUELLE=pramen
RATTE=krysa RAUCH=kouř RENNAUTO=závodní_auto RIND=skot RINDE=kůra ROLLER=koloběžka RUDER=veslo RÜCKEN=záda
SÄGE=pila SAMEN=semeno SATTEL=sedlo SCHACH=šachy SCHEUNE=stodola SCHIFF=loď SCHILF=rákos SCHLAMM=bláto
SCHLEIFE=mašle SCHNUR=provázek SCHRAUBE=šroub SCHÜSSEL=mísa SCHWERT=meč SEIL=lano SIEB=síto SPIELER=hráč
SPITZER=ořezávátko SPRITZE=stříkačka STAUB=prach STIER=býk STIRN=čelo STRAUCH=keř STUFE=schod STURM=bouře
TEICH=rybník THRON=trůn TIGER=tygr TONNE=sud TRECKER=traktor TRUHE=truhla TUCH=šátek TÜTE=sáček UFER=břeh
VASE=váza VULKAN=sopka WAFFEL=oplatka WANNE=vana WESPE=vosa WIEGE=kolébka ZAHNRAD=ozubené_kolo ZEBRA=zebra
ZECKE=klíště ZIEL=cíl ZIMT=skořice ZOPF=cop ZUNGE=jazyk HUFEISEN=podkova MILCHKUH=dojnice OBSTKORB=košík_s_ovocem
KOCHTOPF=hrnec KÄSEBROT=chléb_se_sýrem SCHULBUS=školní_autobus LAUFBAHN=běžecká_dráha GEWINNER=vítěz
ZWILLING=dvojče LEHRLING=učeň TIERHEIM=útulek KREUZUNG=křižovatka AMPEL=semafor RATHAUS=radnice
NIKOLAUS=Mikuláš ZEUGNIS=vysvědčení PAUSE=přestávka CLOWN=klaun
`,
};
