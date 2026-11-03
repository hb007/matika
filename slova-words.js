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
  `,
};
