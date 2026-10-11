<?php
// Konfigurace. Bez jakéhokoli nastavování appka běží nad SQLite: databáze je
// jeden soubor v data/, tabulky se založí samy. Na běžném hostingu tedy stačí
// nahrát soubory a otevřít web.
//
// Vlastní nastavení zapisuje install.php do config.local.php (není v gitu).
// Přednost mají proměnné prostředí MATIKA_DSN, MATIKA_DB_USER, MATIKA_DB_PASS.
$local = is_file(__DIR__ . '/config.local.php') ? require __DIR__ . '/config.local.php' : [];

$env = array_filter([
    'dsn'  => getenv('MATIKA_DSN') ?: null,
    'user' => getenv('MATIKA_DB_USER') ?: null,
    'pass' => getenv('MATIKA_DB_PASS') ?: null,
], fn($v) => $v !== null);

return array_merge([
    'dsn'  => 'sqlite:' . __DIR__ . '/data/matika.sqlite',
    'user' => null,
    'pass' => null,
    // kolik příkladů má jedno kolo
    'round_size' => 10,
    // hash přístupového hesla (password_hash); prázdné = appka je přístupná bez hesla
    'access_hash' => '',
], is_array($local) ? $local : [], $env);
