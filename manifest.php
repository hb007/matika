<?php
// Manifest pro přidání na plochu: ikona z /holka nebo /kluk otevře rovnou to dítě
// a jmenuje se podle jeho přezdívky v okamžiku instalace. Každé dítě má vlastní
// scope: se společným „/“ by Android nainstaloval jen jednu aplikaci a druhá
// adresa by se otevírala v ní. Kořen „/“ vlastní aplikaci nenabízí.
require __DIR__ . '/lib/db.php';

$kid = in_array($_GET['kdo'] ?? '', ['holka', 'kluk'], true) ? $_GET['kdo'] : '';
$nick = '';
if ($kid) {
    try {
        $nick = kid_name(db(), $kid);
    } catch (PDOException $e) {
        // bez databáze aspoň výchozí jméno
    }
    $nick = $nick !== '' ? $nick : ucfirst($kid);
}
$icon = $kid ? "icon-$kid" : 'icon';
$color = ['holka' => '#d6336c', 'kluk' => '#0c7c8c', '' => '#1f45b5'][$kid];
header('Content-Type: application/manifest+json; charset=utf-8');
header('Cache-Control: no-cache');   // po přejmenování hned nový název
echo json_encode([
    'id' => './' . $kid,
    'name' => 'Matika' . ($nick !== '' ? " $nick" : ''),
    'short_name' => 'Matika' . ($nick !== '' ? " $nick" : ''),
    'start_url' => './' . $kid,
    'scope' => './' . $kid,
    'display' => 'standalone',
    'background_color' => '#fbfcfa',
    'theme_color' => $color,
    'icons' => [
        ['src' => "$icon-512.png", 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any maskable'],
        ['src' => "$icon-180.png", 'sizes' => '180x180', 'type' => 'image/png'],
        ['src' => "$icon.svg", 'sizes' => 'any', 'type' => 'image/svg+xml'],
    ],
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
