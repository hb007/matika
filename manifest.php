<?php
// Manifest pro přidání na plochu: ikona z /holka nebo /kluk otevře rovnou to dítě.
$kid = in_array($_GET['kdo'] ?? '', ['holka', 'kluk'], true) ? $_GET['kdo'] : '';
$name = 'Matika' . ($kid ? ' ' . ($kid === 'holka' ? 'Holka' : 'Kluk') : '');
$icon = $kid ? "icon-$kid" : 'icon';
$color = ['holka' => '#d6336c', 'kluk' => '#0c7c8c', '' => '#1f45b5'][$kid];
header('Content-Type: application/manifest+json; charset=utf-8');
echo json_encode([
    'id' => './' . $kid,
    'name' => $name,
    'short_name' => $name,
    'start_url' => './' . $kid,
    'display' => 'standalone',
    'background_color' => '#fbfcfa',
    'theme_color' => $color,
    'icons' => [
        ['src' => "$icon-512.png", 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any maskable'],
        ['src' => "$icon-180.png", 'sizes' => '180x180', 'type' => 'image/png'],
        ['src' => "$icon.svg", 'sizes' => 'any', 'type' => 'image/svg+xml'],
    ],
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
