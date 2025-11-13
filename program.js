

document.addEventListener('DOMContentLoaded', function () {

  const form = document.getElementById('transactionForm');
  const listEl = document.getElementById('transactionList');
  const totalBalanceEl = document.getElementById('totalBalance');
  const totalIncomeEl = document.getElementById('totalIncome');
  const totalExpenseEl = document.getElementById('totalExpense');
  const canvas = document.getElementById('financeChart');
  const themeToggleBtn = document.getElementById('themeToggle');


  let transactions = [];
  let financeChart = null;


  function loadTransactions() {
    try {
      const raw = localStorage.getItem('transactions');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Erreur lecture transactions', e);
      return [];
    }
  }

  function saveTransactions() {
    try {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error('Erreur sauvegarde transactions', e);
    }
  }


  function formatAmount(amount) {
    return Number(amount).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' TND';
  }

  function updateTotals() {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const total = income - expense;

    totalIncomeEl.textContent = formatAmount(income);
    totalExpenseEl.textContent = formatAmount(expense);
    totalBalanceEl.textContent = formatAmount(total);

    // Mettre à jour le graphique si disponible
    updateChart(income, expense);
  }


  function renderTransactions() {
    listEl.innerHTML = '';

    if (!transactions.length) {
      const empty = document.createElement('li');
      empty.textContent = 'Aucune transaction pour le moment.';
      empty.className = 'empty';
      listEl.appendChild(empty);
      updateTotals();
      return;
    }

    transactions.forEach(t => {
      const li = document.createElement('li');
      li.className = 'transaction-item ' + (t.type === 'income' ? 'income' : 'expense');

      // Section gauche : catégorie et date
      const left = document.createElement('div');
      left.className = 'transaction-left';
      left.innerHTML = '<strong>' +
        (t.category || (t.type === 'income' ? 'Revenu' : 'Dépense')) +
        '</strong>' +
        '<div class="tx-date">' + (t.date || '') + '</div>';

      // Section droite : montant et bouton supprimer
      const right = document.createElement('div');
      right.className = 'transaction-right';
      right.innerHTML = '<div class="tx-amount">' + formatAmount(t.amount) + '</div>';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = '❌ Supprimer';
      deleteBtn.type = 'button';
      deleteBtn.style.fontSize = '12px';
      deleteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        deleteTransaction(t.id);
      });

      right.appendChild(deleteBtn);
      li.appendChild(left);
      li.appendChild(right);
      listEl.appendChild(li);
    });

    updateTotals();
  }

  function addTransaction(transaction) {
    transactions.unshift(transaction); // plus récente en premier
    saveTransactions();
    renderTransactions();
  }

  function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    renderTransactions();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const type = form.type.value;
    const amount = parseFloat(form.amount.value);
    const date = form.date.value;
    const category = form.category.value.trim();

    if (isNaN(amount) || amount <= 0) {
      alert('Veuillez saisir un montant valide supérieur à 0');
      return;
    }

    const tx = {
      id: Date.now().toString(),
      type: type === 'income' ? 'income' : 'expense',
      amount: Math.abs(amount),
      date: date,
      category: category
    };

    addTransaction(tx);
    form.reset();
  });

  function initChart() {
    if (!canvas) return;
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js non disponible');
      return;
    }

    try {
      const ctx = canvas.getContext('2d');
      financeChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Revenu', 'Dépense'],
          datasets: [{
            label: 'Montants (TND)',
            data: [0, 0],
            backgroundColor: ['#00c48c', '#ff5c5c']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    } catch (err) {
      console.error('Erreur initialisation Chart.js', err);
    }
  }

  function updateChart(income, expense) {
    if (!financeChart || !financeChart.data || !financeChart.data.datasets) return;
    financeChart.data.datasets[0].data = [income, expense];
    financeChart.update();
  }

  let currentTheme = 'dark';

  function applyTheme(theme) {
    currentTheme = theme;
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      if (themeToggleBtn) {
        themeToggleBtn.textContent = '☀️';
        themeToggleBtn.setAttribute('data-theme', 'light');
      }
    } else {
      document.body.classList.remove('light-theme');
      if (themeToggleBtn) {
        themeToggleBtn.textContent = '🌙';
        themeToggleBtn.setAttribute('data-theme', 'dark');
      }
    }
  }

  function loadTheme() {
    try {
      const t = localStorage.getItem('theme');
      return t === 'light' ? 'light' : 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.error('Erreur sauvegarde thème', e);
    }
  }


  currentTheme = loadTheme();
  applyTheme(currentTheme);

e
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const next = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      saveTheme(next);
      console.log('Thème basculé vers:', next);
    });
  } else {
    console.warn('themeToggle button non trouvé');
  }

  transactions = loadTransactions();
  initChart();
  renderTransactions();
});
