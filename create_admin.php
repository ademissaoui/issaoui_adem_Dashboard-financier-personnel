<?php
// Small helper to create an admin user via web (for initial setup).
// Use once, then remove or protect the file.
require_once __DIR__ . '/db.php';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = isset($_POST['username']) ? trim($_POST['username']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    if ($username === '' || $password === '') {
        $error = 'Username and password required.';
    } else {
        // Check if exists
        $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            $error = 'User already exists.';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $ins = $pdo->prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ? )');
            $ins->execute([$username, $hash, 'admin']);
            $success = true;
        }
    }
}
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Create admin</title>
  <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}form{max-width:420px}label{display:block;margin:8px 0}</style>
</head>
<body>
  <h2>Créer un administrateur</h2>
  <?php if (!empty($error)): ?>
    <div style="color:#b00"><?= htmlspecialchars($error) ?></div>
  <?php endif; ?>
  <?php if (!empty($success)): ?>
    <div style="color:green">Administrateur créé. Vous pouvez supprimer ce fichier maintenant.</div>
  <?php else: ?>
    <form method="post">
      <label>Utilisateur<br><input name="username" required></label>
      <label>Mot de passe<br><input type="password" name="password" required></label>
      <button type="submit">Créer</button>
    </form>
  <?php endif; ?>
</body>
</html>
