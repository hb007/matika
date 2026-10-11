<?php
// Přezdívka pro název aplikace na ploše.
$db = db_open('sqlite::memory:');
check(kid_name($db, 'holka') === 'Holka' && kid_name($db, 'kluk') === 'Kluk', 'vychozi prezdivky');
rename_user($db, 1, 'Anička');
check(kid_name($db, 'holka') === 'Anička', 'nazev podle nastavene prezdivky');
check(kid_name($db, 'nikdo') === '', 'nezname dite: prazdne');
