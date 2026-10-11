<?php
// JSON API. Volá se POST /api.php?action=... s JSON tělem.
// Bez přihlášení a bez databáze: aktuální příklad drží PHP session,
// správnou odpověď klient dostane, jen když si o ni řekne (reveal).
declare(strict_types=1);

require __DIR__ . '/lib/generators.php';
require __DIR__ . '/lib/explain.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out($data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $msg, int $code = 400): never
{
    out(['error' => $msg], $code);
}

function body(): array
{
    $raw = file_get_contents('php://input');
    $data = $raw ? json_decode($raw, true) : [];
    return is_array($data) ? $data : [];
}

function current_ex(): array
{
    return $_SESSION['ex'] ?? fail('Příklad vypršel, načti další.', 404);
}

$action = $_GET['action'] ?? '';
$in = body();
session_start(['cookie_httponly' => true, 'cookie_samesite' => 'Lax']);

switch ($action) {
    case 'modules':
        out(['modules' => MODULES]);

    case 'next':
        try {
            $ex = generate_exercise((string) ($in['module'] ?? ''), (string) ($in['level'] ?? ''));
        } catch (InvalidArgumentException $e) {
            fail($e->getMessage());
        }
        $_SESSION['ex'] = $ex;
        out(['q' => $ex['q'], 'kind' => $ex['kind'], 'keys' => extra_keys($ex)]);

    case 'hint':
        // další krok nápovědy; každé kliknutí odkryje o jeden víc
        $ex = current_ex();
        $steps = hint_steps($ex);
        $shown = min(count($steps), (int) ($ex['hints'] ?? 0) + 1);
        $_SESSION['ex']['hints'] = $shown;
        out(['steps' => array_slice($steps, 0, $shown), 'total' => count($steps)]);

    case 'answer':
        $ex = current_ex();
        $given = $in['answer'] ?? '';
        [$ok, $note] = check_answer($ex, $given);
        $res = ['correct' => $ok, 'note' => $note];
        if (!$ok) {
            // jen co je špatně, výsledek ne: dítě má další pokus
            $res['why'] = $note !== '' ? '' : diagnose($ex, $given);   // u nečitelné odpovědi stačí poznámka
        }
        out($res);

    case 'reveal':
        $ex = current_ex();
        out(['answer' => answer_str($ex), 'steps' => explain($ex)]);

    default:
        fail('Neznámá akce.', 404);
}
