<?php
// Ikona na plochu v barvě dítěte: icon.php?barva=ruzova&size=512 (PNG přes GD)
// nebo &svg=1. Stejný motiv jako icon.svg (dělítko: dvě tečky a čára).
// Bez GD se místo PNG pošle modrá ikona z repa.
require __DIR__ . '/lib/db.php';

$key = isset(COLORS[$_GET['barva'] ?? '']) ? $_GET['barva'] : 'modra';
$hex = COLORS[$key]['light'];
header('Cache-Control: public, max-age=86400');

if (!empty($_GET['svg'])) {
    header('Content-Type: image/svg+xml');
    echo '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
        . "<rect width=\"512\" height=\"512\" rx=\"112\" fill=\"$hex\"/>"
        . '<circle cx="256" cy="150" r="38" fill="#fff"/><rect x="110" y="232" width="292" height="48" rx="24" fill="#fff"/>'
        . '<circle cx="256" cy="362" r="38" fill="#fff"/></svg>';
    exit;
}

$size = in_array((int) ($_GET['size'] ?? 0), [180, 512], true) ? (int) $_GET['size'] : 512;
if (!function_exists('imagecreatetruecolor')) {
    header('Content-Type: image/png');
    readfile(__DIR__ . "/icon-$size.png");
    exit;
}
// kreslí se 4× větší a zmenší (hladké hrany)
$s = 2048;
$im = imagecreatetruecolor($s, $s);
imagesavealpha($im, true);
imagefill($im, 0, 0, imagecolorallocatealpha($im, 0, 0, 0, 127));
[$r, $g, $b] = sscanf($hex, '#%02x%02x%02x');
$bg = imagecolorallocate($im, $r, $g, $b);
$white = imagecolorallocate($im, 255, 255, 255);
$rad = (int) ($s * 112 / 512);
// zaoblený čtverec: dva obdélníky a čtyři kruhy v rozích
imagefilledrectangle($im, $rad, 0, $s - $rad - 1, $s - 1, $bg);
imagefilledrectangle($im, 0, $rad, $s - 1, $s - $rad - 1, $bg);
foreach ([[$rad, $rad], [$s - $rad - 1, $rad], [$rad, $s - $rad - 1], [$s - $rad - 1, $s - $rad - 1]] as [$cx, $cy]) {
    imagefilledellipse($im, $cx, $cy, $rad * 2, $rad * 2, $bg);
}
$k = $s / 512;
imagefilledellipse($im, (int) (256 * $k), (int) (150 * $k), (int) (76 * $k), (int) (76 * $k), $white);
imagefilledellipse($im, (int) (256 * $k), (int) (362 * $k), (int) (76 * $k), (int) (76 * $k), $white);
imagefilledrectangle($im, (int) (134 * $k), (int) (232 * $k), (int) (378 * $k), (int) (280 * $k), $white);
imagefilledellipse($im, (int) (134 * $k), (int) (256 * $k), (int) (48 * $k), (int) (48 * $k), $white);
imagefilledellipse($im, (int) (378 * $k), (int) (256 * $k), (int) (48 * $k), (int) (48 * $k), $white);
$out = imagecreatetruecolor($size, $size);
imagesavealpha($out, true);
imagealphablending($out, false);
imagefill($out, 0, 0, imagecolorallocatealpha($out, 0, 0, 0, 127));
imagecopyresampled($out, $im, 0, 0, 0, 0, $size, $size, $s, $s);
header('Content-Type: image/png');
imagepng($out);
