document.addEventListener('DOMContentLoaded', function () {
  // Elements DOM principaux
  const formulaire = document.getElementById('formulaireTransaction');
  const listeEl = document.getElementById('listeTransactions');
  const totalBalanceEl = document.getElementById('totalBalance');
  const totalIncomeEl = document.getElementById('totalIncome');
  const totalExpenseEl = document.getElementById('totalExpense');
  const canvas = document.getElementById('graphiqueFinance');
  const boutonTheme = document.getElementById('boutonTheme');

  // Variables de stockage
  let transactions = [];
  let graphique = null;
  let themeActuel = 'dark';

  // Charger les transactions depuis localStorage
  function chargerTransactions() {
    try {
      const raw = localStorage.getItem('transactions');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Erreur lecture transactions', e);
      return [];
    }
  }

  // Sauvegarder les transactions dans localStorage
  function sauvegarderTransactions() {
    try {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error('Erreur sauvegarde transactions', e);
    }
  }

  // Formater un montant en format localise
  function formaterMontant(montant) {
    return Number(montant).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' TND';
  }

  function mettreAJourTotaux() {
    // Calculer revenu total
    const revenu = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculer depense totale
    const depense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculer solde = revenu - depense
    const total = revenu - depense;

    // Afficher les montants formatos
    totalIncomeEl.textContent = formaterMontant(revenu);
    totalExpenseEl.textContent = formaterMontant(depense);
    totalBalanceEl.textContent = formaterMontant(total);

    // Mettre a jour le graphique
    mettreAJourGraphique(revenu, depense);
  }

  function afficherTransactions() {
    // Vider la liste
    listeEl.innerHTML = '';

    // Si aucune transaction, afficher message
    if (!transactions.length) {
      const empty = document.createElement('li');
      empty.textContent = 'Aucune transaction pour le moment.';
      empty.className = 'empty';
      listeEl.appendChild(empty);
      mettreAJourTotaux();
      return;
    }

    // Boucler sur chaque transaction et creer un element liste
    transactions.forEach(t => {
      const li = document.createElement('li');
      li.className = 'element-transaction ' + (t.type === 'income' ? 'income' : 'expense');

      // Icone (gauche)
      const icone = document.createElement('div');
      icone.className = 'icone-transaction ' + (t.type === 'income' ? 'income' : 'expense');
      icone.textContent = t.type === 'income' ? '＋' : '−';

      // Details (centre: categorie et date)
      const details = document.createElement('div');
      details.className = 'details-transaction';

      const nom = document.createElement('div');
      nom.className = 'nom-transaction';
      nom.textContent = t.category || (t.type === 'income' ? 'Revenu' : 'Depense');

      const dateElem = document.createElement('div');
      dateElem.className = 'date-transaction';
      dateElem.textContent = t.date || '';

      details.appendChild(nom);
      details.appendChild(dateElem);

      // Montant et bouton supprimer (droite)
      const montantWrap = document.createElement('div');
      montantWrap.style.display = 'flex';
      montantWrap.style.alignItems = 'center';
      montantWrap.style.gap = '12px';

      const montant = document.createElement('div');
      montant.className = 'montant-transaction ' + (t.type === 'income' ? 'income' : 'expense');
      montant.textContent = formaterMontant(t.amount);

      // Bouton supprimer
      const btnSuppr = document.createElement('button');
      btnSuppr.type = 'button';
      btnSuppr.className = 'transaction-delete';
      btnSuppr.setAttribute('aria-label', 'Supprimer la transaction');
      btnSuppr.textContent = '❌';
      btnSuppr.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        supprimerTransaction(t.id);
      });

      montantWrap.appendChild(montant);
      montantWrap.appendChild(btnSuppr);

      li.appendChild(icone);
      li.appendChild(details);
      li.appendChild(montantWrap);

      listeEl.appendChild(li);
    });

    mettreAJourTotaux();
  }

  function ajouterTransaction(tx) {
    // Ajouter au debut de la liste localement
    transactions.unshift(tx);
    sauvegarderTransactions();

    // Tenter d'envoyer la transaction au serveur (si connecté)
    saveTransactionServer(tx).catch(function (err) {
      // En cas d'erreur, conserver en local (fallback)
      console.warn('Envoi transaction au serveur annulé :', err);
    });

    // Rafraichir l'affichage
    afficherTransactions();
  }

  // Envoie une transaction au serveur via POST JSON
  async function saveTransactionServer(tx) {
    try {
      const res = await fetch('save_transaction.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(tx)
      });
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      return await res.json();
    } catch (e) {
      throw e;
    }
  }

  // Tente de charger les transactions depuis le serveur pour l'utilisateur connecté
  async function chargerTransactionsServer() {
    try {
      const res = await fetch('get_transactions.php', { credentials: 'same-origin' });
      if (!res.ok) {
        // Not authenticated or other error
        throw new Error('HTTP ' + res.status);
      }
      const data = await res.json();
      return data; // tableau d'objets {id,type,amount,date,category,created_at}
    } catch (e) {
      // Echec -> null pour indiquer fallback
      console.warn('Chargement transactions serveur failed', e);
      return null;
    }
  }

  function supprimerTransaction(id) {
    // Filtrer et retirer la transaction
    transactions = transactions.filter(t => t.id !== id);
    // Sauvegarder
    sauvegarderTransactions();
    // Rafraichir l'affichage
    afficherTransactions();
  }

  // Gestion du formulaire d'ajout
  formulaire.addEventListener('submit', function (e) {
    e.preventDefault();

    // Recuperer les donnees du formulaire
    const type = formulaire.type.value;
    const montant = parseFloat(formulaire.amount.value);
    const date = formulaire.date.value;
    const category = formulaire.category.value.trim();

    // Verifier le montant
    if (isNaN(montant) || montant <= 0) {
      alert('Veuillez saisir un montant valide superieur a 0');
      return;
    }

    // Creer la transaction
    const tx = {
      id: Date.now().toString(),
      type: type === 'income' ? 'income' : 'expense',
      amount: Math.abs(montant),
      date: date,
      category: category
    };

    // Ajouter et reinitialiser le formulaire
    ajouterTransaction(tx);
    formulaire.reset();
  });

  function initialiserGraphique() {
    // Verifier que le canvas existe
    if (!canvas) return;
    // Verifier que Chart.js est charge
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js non disponible');
      return;
    }

    try {
      const ctx = canvas.getContext('2d');
      // Creer le graphique en barres
      graphique = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Revenu', 'Depense'],
          datasets: [{
            label: 'Montants (TND)',
            data: [0, 0],
            backgroundColor: ['#22c55e', '#ef4444']
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

  // Mettre a jour les donnees du graphique
  function mettreAJourGraphique(revenu, depense) {
    if (!graphique || !graphique.data || !graphique.data.datasets) return;
    graphique.data.datasets[0].data = [revenu, depense];
    graphique.update();
  }

  // Charger le theme depuis localStorage
  function chargerTheme() {
    try {
      const t = localStorage.getItem('theme');
      return t === 'light' ? 'light' : 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  // Sauvegarder le choix de theme
  function sauvegarderTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.error('Erreur sauvegarde theme', e);
    }
  }

  // Appliquer le theme a l'interface
  function appliquerTheme(theme) {
    themeActuel = theme;
    if (theme === 'light') {
      // Activer le mode clair
      document.body.classList.add('light-theme');
      if (boutonTheme) {
        boutonTheme.textContent = '☀️';
      }
    } else {
      // Activer le mode sombre
      document.body.classList.remove('light-theme');
      if (boutonTheme) {
        boutonTheme.textContent = '🌙';
      }
    }
  }

  // Charger et appliquer le theme initial
  themeActuel = chargerTheme();
  appliquerTheme(themeActuel);

  // Ecouter le clic sur le bouton theme
  if (boutonTheme) {
    boutonTheme.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      // Basculer entre sombre et clair
      const next = themeActuel === 'light' ? 'dark' : 'light';
      appliquerTheme(next);
      sauvegarderTheme(next);
    });
  }

  // Initialisation complete
  initialiserGraphique();
  // Essayer de charger depuis le serveur ; si echec, utiliser localStorage
  chargerTransactionsServer().then(function (serverTx) {
    if (serverTx && serverTx.length) {
      // Convertir au format utilisé par l'app
      transactions = serverTx.map(function (t) {
        return {
          id: (t.id ? t.id.toString() : Date.now().toString()),
          type: t.type,
          amount: Number(t.amount),
          date: t.date || '',
          category: t.category || ''
        };
      });
      sauvegarderTransactions();
    } else {
      transactions = chargerTransactions();
    }
    afficherTransactions();
  }).catch(function (err) {
    console.warn('Impossible charger transactions serveur', err);
    transactions = chargerTransactions();
    afficherTransactions();
  });
});
