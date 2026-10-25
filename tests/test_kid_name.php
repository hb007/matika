<?php
// Dítě podle adresy (slug) a přezdívka pro název aplikace na ploše.
$db = test_db();
check(kid_name($db, 'holka') === 'Holka' && kid_name($db, 'kluk') === 'Kluk', 'vychozi prezdivky');
rename_user($db, 1, 'Anička');
check(kid_name($db, 'holka') === 'Anička', 'nazev podle nastavene prezdivky');
check(kid_name($db, 'nikdo') === '', 'nezname dite: prazdne');
$u = user_by_slug($db, 'kluk');
check($u['id'] === 2 && $u['color'] === 'petrolejova' && $u['has_pin'] === false, 'kluk: petrolejova, bez PINu');
