<?php
// Konfigurace databáze. Hodnoty jdou přednostně z proměnných prostředí,
// aby se do gitu nedostala hesla. Pro MySQL:
//   MATIKA_DSN="mysql:host=localhost;dbname=matika;charset=utf8mb4"
//   MATIKA_DB_USER=matika  MATIKA_DB_PASS=tajne
// Pro lokální zkoušení bez MySQL stačí SQLite:
//   MATIKA_DSN="sqlite:/cesta/k/matika.sqlite"
return [
    'dsn'  => getenv('MATIKA_DSN') ?: 'mysql:host=localhost;dbname=matika;charset=utf8mb4',
    'user' => getenv('MATIKA_DB_USER') ?: 'matika',
    'pass' => getenv('MATIKA_DB_PASS') ?: '',
    // kolik příkladů má jedno kolo
    'round_size' => 10,
];
