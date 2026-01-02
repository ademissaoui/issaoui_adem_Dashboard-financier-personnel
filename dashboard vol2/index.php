<?php
session_start();
// Require login
if (empty($_SESSION['user_id'])) {
    header('Location: ../login.php');
    exit;
}
$username = htmlspecialchars($_SESSION['username'] ?? '');
$userId = (int) ($_SESSION['user_id'] ?? 0);
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Dashboard - <?php echo $username; ?></title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;margin:20px}
    .card{max-width:900px;padding:18px;border:1px solid #ddd;border-radius:8px}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{padding:8px;border:1px solid #eee;text-align:left}
    form>div{margin:8px 0}
  </style>
</head>
<body>
  <div class="card">
    <h1>Dashboard</h1>
    <p>Welcome, <strong><?php echo $username; ?></strong> — <a href="../logout.php">Logout</a></p>

    <h3>Add transaction</h3>
    <form id="txForm">
      <div>
        <label>Type: <select name="type"><option value="expense">Expense</option><option value="income">Income</option></select></label>
      </div>
      <div>
        <label>Amount: <input name="amount" type="number" step="0.01" required></label>
      </div>
      <div>
        <label>Date: <input name="date" type="date"></label>
      </div>
      <div>
        <label>Category: <input name="category" type="text"></label>
      </div>
      <div>
        <button type="submit">Save</button>
      </div>
    </form>

    <h3>Your transactions</h3>
    <div id="txList">Loading…</div>
  </div>

  <script>
    async function loadTx(){
      const res = await fetch('../get_transactions.php');
      if (!res.ok) return document.getElementById('txList').textContent = 'Failed to load transactions';
      const rows = await res.json();
      if (!rows || rows.length === 0) return document.getElementById('txList').innerHTML = '<em>No transactions yet</em>';
      let html = '<table><thead><tr><th>ID</th><th>Type</th><th>Amount</th><th>Date</th><th>Category</th><th>Created</th></tr></thead><tbody>';
      for(const r of rows){
        html += `<tr><td>${r.id}</td><td>${r.type}</td><td>${r.amount}</td><td>${r.date||''}</td><td>${r.category||''}</td><td>${r.created_at}</td></tr>`;
      }
      html += '</tbody></table>';
      document.getElementById('txList').innerHTML = html;
    }

    document.getElementById('txForm').addEventListener('submit', async function(e){
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = {
        type: fd.get('type'),
        amount: fd.get('amount'),
        date: fd.get('date'),
        category: fd.get('category')
      };
      const res = await fetch('../save_transaction.php', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        alert('Failed to save');
        return;
      }
      const data = await res.json();
      if (data && data.success) {
        e.target.reset();
        loadTx();
      } else {
        alert('Error: ' + (data.error || 'unknown'));
      }
    });

    loadTx();
  </script>
</body>
</html>
