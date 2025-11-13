document.addEventListener('DOMContentLoaded', function () {
	const formulaire = document.getElementById('formulaireTransaction');
	const listeEl = document.getElementById('listeTransactions');
	const totalBalanceEl = document.getElementById('totalBalance');
	const totalIncomeEl = document.getElementById('totalIncome');
	const totalExpenseEl = document.getElementById('totalExpense');
	const canvas = document.getElementById('graphiqueFinance');
	const boutonTheme = document.getElementById('boutonTheme');

	let transactions = [];
	let graphique = null;
	let themeActuel = 'dark';

	function chargerTransactions() {
		try {
			const raw = localStorage.getItem('transactions');
			return raw ? JSON.parse(raw) : [];
		} catch (err) {
			console.error('Erreur lecture transactions', err);
			return [];
		}
	}

	function sauvegarderTransactions() {
		try {
			localStorage.setItem('transactions', JSON.stringify(transactions));
		} catch (err) {
			console.error('Erreur sauvegarde transactions', err);
		}
	}

	function formaterMontant(valeur) {
		return Number(valeur).toLocaleString('fr-FR', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}) + ' TND';
	}

	function initialiserGraphique() {
		if (!canvas) return;
		if (typeof Chart === 'undefined') {
			console.warn('Chart.js non présent — le graphique ne sera pas affiché');
			return;
		}

		try {
			const ctx = canvas.getContext('2d');
			graphique = new Chart(ctx, {
				type: 'bar',
				data: {
					labels: ['Revenu', 'Dépense'],
					datasets: [{
						label: 'Montants (TND)',
						data: [0, 0],
						backgroundColor: ['#22c55e', '#ef4444']
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: true,
					scales: { y: { beginAtZero: true } }
				}
			});
		} catch (err) {
			console.error('Erreur lors de l\'initialisation du graphique', err);
		}
	}

	function mettreAJourGraphique(revenu, depense) {
		if (!graphique || !graphique.data || !graphique.data.datasets) return;
		graphique.data.datasets[0].data = [revenu, depense];
		graphique.update();
	}

	function mettreAJourTotaux() {
		const revenu = transactions
			.filter(t => t.type === 'income')
			.reduce((s, t) => s + Number(t.amount), 0);

		const depense = transactions
			.filter(t => t.type === 'expense')
			.reduce((s, t) => s + Number(t.amount), 0);

		const total = revenu - depense;

		if (totalIncomeEl) totalIncomeEl.textContent = formaterMontant(revenu);
		if (totalExpenseEl) totalExpenseEl.textContent = formaterMontant(depense);
		if (totalBalanceEl) totalBalanceEl.textContent = formaterMontant(total);

		mettreAJourGraphique(revenu, depense);
	}

	function afficherTransactions() {
		if (!listeEl) return;
		listeEl.innerHTML = '';

		if (!transactions || transactions.length === 0) {
			const vide = document.createElement('li');
			vide.className = 'empty';
			vide.textContent = 'Aucune transaction pour le moment.';
			listeEl.appendChild(vide);
			mettreAJourTotaux();
			return;
		}

		transactions.forEach(t => {
			const li = document.createElement('li');
			li.className = 'element-transaction ' + (t.type === 'income' ? 'income' : 'expense');

			const icone = document.createElement('div');
			icone.className = 'icone-transaction ' + (t.type === 'income' ? 'income' : 'expense');
			icone.textContent = t.type === 'income' ? '＋' : '−';

			const details = document.createElement('div');
			details.className = 'details-transaction';

			const nom = document.createElement('div');
			nom.className = 'nom-transaction';
			nom.textContent = t.category || (t.type === 'income' ? 'Revenu' : 'Dépense');

			const date = document.createElement('div');
			date.className = 'date-transaction';
			date.textContent = t.date || '';

			details.appendChild(nom);
			details.appendChild(date);

			const montantWrap = document.createElement('div');
			montantWrap.style.display = 'flex';
			montantWrap.style.alignItems = 'center';
			montantWrap.style.gap = '12px';

			const montant = document.createElement('div');
			montant.className = 'montant-transaction ' + (t.type === 'income' ? 'income' : 'expense');
			montant.textContent = formaterMontant(t.amount);

			const btnSuppr = document.createElement('button');
			btnSuppr.type = 'button';
			btnSuppr.className = 'transaction-delete delete-btn';
			btnSuppr.setAttribute('aria-label', 'Supprimer la transaction');
			btnSuppr.textContent = '❌';
			btnSuppr.addEventListener('click', function (ev) {
				ev.preventDefault();
				ev.stopPropagation();
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
		transactions.unshift(tx);
		sauvegarderTransactions();
		afficherTransactions();
	}

	function supprimerTransaction(id) {
		transactions = transactions.filter(t => t.id !== id);
		sauvegarderTransactions();
		afficherTransactions();
	}

	if (formulaire) {
		formulaire.addEventListener('submit', function (e) {
			e.preventDefault();

			const typeEl = formulaire.querySelector('#type');
			const amountEl = formulaire.querySelector('#amount');
			const dateEl = formulaire.querySelector('#date');
			const categoryEl = formulaire.querySelector('#category');

			const type = typeEl ? typeEl.value : 'expense';
			const montant = amountEl ? parseFloat(amountEl.value) : 0;
			const date = dateEl ? dateEl.value : '';
			const category = categoryEl ? categoryEl.value.trim() : '';

			if (isNaN(montant) || montant <= 0) {
				alert('Veuillez saisir un montant valide supérieur à 0');
				return;
			}

			const tx = {
				id: Date.now().toString(),
				type: type === 'income' ? 'income' : 'expense',
				amount: Math.abs(montant),
				date: date,
				category: category
			};

			ajouterTransaction(tx);
			formulaire.reset();
		});
	} else {
		console.warn('Formulaire non trouvé (id="formulaireTransaction")');
	}

	function chargerTheme() {
		try { return localStorage.getItem('theme') === 'light' ? 'light' : 'dark'; }
		catch (e) { return 'dark'; }
	}

	function sauvegarderTheme(t) {
		try { localStorage.setItem('theme', t); } catch (e) { }
	}

	function appliquerTheme(t) {
		themeActuel = t === 'light' ? 'light' : 'dark';
		if (themeActuel === 'light') {
			document.body.classList.add('light-theme');
			if (boutonTheme) boutonTheme.textContent = '☀️';
		} else {
			document.body.classList.remove('light-theme');
			if (boutonTheme) boutonTheme.textContent = '🌙';
		}
	}

	if (boutonTheme) {
		boutonTheme.addEventListener('click', function (e) {
			e.preventDefault();
			const suivant = themeActuel === 'light' ? 'dark' : 'light';
			appliquerTheme(suivant);
			sauvegarderTheme(suivant);
		});
	}

	transactions = chargerTransactions();
	initialiserGraphique();
	appliquerTheme(chargerTheme());
	afficherTransactions();
});

