<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

// Expect JSON payload
$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$userId = (int) $_SESSION['user_id'];
$type = isset($data['type']) && $data['type'] === 'income' ? 'income' : 'expense';
$amount = isset($data['amount']) ? (float) $data['amount'] : 0;
$date = isset($data['date']) && $data['date'] !== '' ? $data['date'] : null;
$category = isset($data['category']) ? $data['category'] : null;

try {
    $stmt = $pdo->prepare('INSERT INTO transactions (user_id, type, amount, date, category, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
    $stmt->execute([$userId, $type, $amount, $date, $category]);
    $insertedId = $pdo->lastInsertId();
    echo json_encode(['success' => true, 'id' => $insertedId]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
