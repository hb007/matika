<?php
// Manifest pro přidání na plochu: ikona ze stránky dítěte otevře rovnou jeho
// sešit, má jeho barvu a jmenuje se podle přezdívky v okamžiku instalace.
// Každé dítě má vlastní scope: se společným „/“ by Android nainstaloval jen
// jednu aplikaci a ostatní adresy by se otevíraly v ní. Kořen „/“ vlastní
// aplikaci nenabízí. Holka a kluk mají adresy ze starší verze (/holka, /kluk),
// ať už nainstalované aplikace fungují dál; ostatní /u/<přezdívka>.
require __DIR__ . '/lib/db.php';

$slug = preg_match('/^[a-z0-9-]{1,24}$/', $_GET['kdo'] ?? '') ? $_GET['kdo'] : '';
$kid = null;
if ($slug !== '') {
    try {
        $kid = user_by_slug(db(), $slug);
    } catch (PDOException $e) {
        // bez databáze aspoň výchozí
    }
}
if (!$kid) {
    http_response_code(404);
    exit;
}
$path = in_array($slug, ['holka', 'kluk'], true) ? './' . $slug : './u/' . $slug;
$color = COLORS[$kid['color']] ?? COLORS['modra'];
$icon = 'icon.php?barva=' . $kid['color'];
header('Content-Type: application/manifest+json; charset=utf-8');
header('Cache-Control: no-cache');   // po přejmenování hned nový název
echo json_encode([
    'id' => $path,
    'name' => 'Matika ' . $kid['name'],
    'short_name' => 'Matika ' . $kid['name'],
    'start_url' => $path,
    'scope' => $path,
    'display' => 'standalone',
    'background_color' => '#fbfcfa',
    'theme_color' => $color['light'],
    'icons' => [
        ['src' => "$icon&size=512", 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any maskable'],
        ['src' => "$icon&size=180", 'sizes' => '180x180', 'type' => 'image/png'],
        ['src' => "$icon&svg=1", 'sizes' => 'any', 'type' => 'image/svg+xml'],
    ],
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
