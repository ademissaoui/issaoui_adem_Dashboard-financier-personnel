<?php
session_start();
require_once __DIR__ . '/db.php';

// Simple authentication: check users table for username and password
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: login.php');
    exit;
}

$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

if ($username === '' || $password === '') {
    header('Location: login.php?error=1');
    exit;
}

// Allow a local hardcoded admin/admin login for quick access
if ($username === 'admin' && $password === 'admin') {
    $_SESSION['user_id'] = 0;
    $_SESSION['username'] = 'admin';
    $_SESSION['role'] = 'admin';
    $base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
    header("Location: {$base}/dashboard/index.html");
    exit;
}

// Allow a local hardcoded user1/user login for quick access (non-admin)
if ($username === 'user1' && $password === 'user') {
    $_SESSION['user_id'] = 1;
    $_SESSION['username'] = 'user1';
    $_SESSION['role'] = 'user';
    $base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
    header("Location: {$base}/dashboard/index.html");
    exit;
}

// If DB connection failed, stop here and show generic error (only admin bypasses DB)
if (!isset($pdo) || !$pdo) {
    header('Location: login.php?error=1');
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, username, password, role FROM users WHERE username = ? LIMIT 1');
    $stmt->execute([$username]);
    $user = $stmt->fetch();
} catch (Exception $e) {
    header('Location: login.php?error=1');
    exit;
}

if (!$user) {
    // No user found
    header('Location: login.php?error=1');
    exit;
}

// If passwords are stored hashed by password_hash()
if (password_verify($password, $user['password'])) {
    // Auth OK
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    // Redirect depending on role (customize as needed)
    $base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
    if ($user['role'] === 'admin') {
        header("Location: {$base}/dashboard/index.html");
    } else {
        header("Location: {$base}/dashboard/index.html");
    }
    exit;
} else {
    header('Location: login.php?error=1');
    exit;
}
