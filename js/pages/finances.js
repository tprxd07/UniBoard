// Finances Page
const FinancesPage = {
    transactions: [],

    render() {
        return `
        <div class="section-header">
            <span class="section-title">Finanzas</span>
            <button class="btn btn-primary btn-sm" id="add-transaction-btn">+ Añadir gasto</button>
        </div>

        <div class="finance-summary" id="finance-summary"></div>

        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <span class="card-title">Presupuesto mensual</span>
            </div>
            <div class="form-group">
                <label>Presupuesto mensual (€)</label>
                <input type="number" id="monthly-budget" placeholder="500" step="0.01">
            </div>
            <div id="budget-progress"></div>
        </div>

        <div class="card">
            <div class="card-header">
                <span class="card-title">Últimos gastos</span>
            </div>
            <div id="transactions-list"></div>
        </div>`;
    },

    init() {
        document.getElementById('add-transaction-btn').addEventListener('click', () => this.showAddModal());

        document.getElementById('monthly-budget').addEventListener('change', (e) => {
            this.saveBudget(parseFloat(e.target.value) || 0);
        });

        this.loadTransactions();
    },

    async loadTransactions() {
        try {
            this.transactions = await DB.getTransactions();
            this.renderSummary();
            this.renderList();
            this.loadBudget();
        } catch (e) {
            console.error('Error loading transactions:', e);
        }
    },

    renderSummary() {
        const now = new Date();
        const monthTransactions = this.transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });

        const categories = { photocopies: 0, transport: 0, cafeteria: 0, other: 0 };
        monthTransactions.forEach(t => {
            const cat = t.category || 'other';
            categories[cat] = (categories[cat] || 0) + (t.amount || 0);
        });

        const total = Object.values(categories).reduce((a, b) => a + b, 0);

        document.getElementById('finance-summary').innerHTML = `
            <div class="finance-item">
                <div class="amount" style="color: var(--danger);">-${Utils.formatCurrency(total)}</div>
                <div class="label">Total del mes</div>
            </div>
            <div class="finance-item">
                <div class="amount">-${Utils.formatCurrency(categories.photocopies)}</div>
                <div class="label">${Icons.file} Fotocopias</div>
            </div>
            <div class="finance-item">
                <div class="amount">-${Utils.formatCurrency(categories.transport)}</div>
                <div class="label">${Icons.backpack} Transporte</div>
            </div>`;

        // Update budget progress
        const budget = this.getMonthlyBudget();
        if (budget > 0) {
            const percentage = (total / budget) * 100;
            const color = percentage > 100 ? 'red' : percentage > 80 ? 'orange' : 'green';
            document.getElementById('budget-progress').innerHTML = `
                <div class="progress-bar" style="margin-top: 12px;">
                    <div class="progress-fill ${color}" style="width: ${Math.min(percentage, 100)}%;"></div>
                </div>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                    ${Utils.formatCurrency(total)} / ${Utils.formatCurrency(budget)} (${Math.round(percentage)}%)
                    ${percentage > 100 ? ` ${Icons.alertTriangle} Presupuesto superado` : ''}
                </p>`;
        }
    },

    renderList() {
        const container = document.getElementById('transactions-list');
        const recent = this.transactions.slice(0, 20);

        if (recent.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 13px;">Sin gastos registrados</p>';
            return;
        }

        const categoryIcons = { photocopies: Icons.file, transport: Icons.backpack, cafeteria: Icons.coffee, other: Icons.zap };
        const categoryNames = { photocopies: 'Fotocopias', transport: 'Transporte', cafeteria: 'Cafetería', other: 'Otro' };

        container.innerHTML = Utils.sanitize(recent.map(t => `
            <div class="list-item">
                <div class="list-item-icon">${categoryIcons[t.category] || Icons.zap}</div>
                <div class="list-item-content">
                    <div class="list-item-title">${t.description || categoryNames[t.category] || 'Gasto'}</div>
                    <div class="list-item-subtitle">${Utils.formatDate(t.date)}</div>
                </div>
                <span style="font-weight: 700; color: var(--danger);">-${Utils.formatCurrency(t.amount)}</span>
                <button class="btn-icon" style="font-size: 14px;" onclick="FinancesPage.deleteTransaction('${t.id}')">${Icons.trash}</button>
            </div>
        `).join(''));
    },

    showAddModal() {
        const html = `
            <div class="form-group">
                <label>Categoría</label>
                <select id="tx-category">
                    <option value="photocopies">${Icons.file} Fotocopias</option>
                    <option value="transport">${Icons.backpack} Transporte</option>
                    <option value="cafeteria">${Icons.coffee} Cafetería</option>
                    <option value="other">${Icons.zap} Otro</option>
                </select>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Importe (€)</label>
                    <input type="number" id="tx-amount" placeholder="0.00" step="0.01" min="0">
                </div>
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" id="tx-date" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <input type="text" id="tx-desc" placeholder="Ej: Fotocopias tema 4">
            </div>`;

        Utils.showModal('Nuevo Gasto', html, async () => {
            const data = {
                category: document.getElementById('tx-category').value,
                amount: parseFloat(document.getElementById('tx-amount').value) || 0,
                date: document.getElementById('tx-date').value,
                description: document.getElementById('tx-desc').value
            };

            if (!data.amount) {
                Utils.showToast('Introduce un importe', 'error');
                return;
            }

            try {
                await DB.addTransaction(data);
                Utils.showToast('Gasto registrado', 'success');
                this.loadTransactions();
            } catch (e) {
                Utils.showToast('Error al guardar', 'error');
            }
        });
    },

    async deleteTransaction(id) {
        if (confirm('¿Eliminar este gasto?')) {
            try {
                await DB.deleteTransaction(id);
                Utils.showToast('Gasto eliminado', 'success');
                this.loadTransactions();
            } catch (e) {
                Utils.showToast('Error al eliminar', 'error');
            }
        }
    },

    getMonthlyBudget() {
        return parseFloat(localStorage.getItem('monthlyBudget') || '0');
    },

    saveBudget(amount) {
        localStorage.setItem('monthlyBudget', amount);
        this.renderSummary();
    },

    loadBudget() {
        const budget = this.getMonthlyBudget();
        document.getElementById('monthly-budget').value = budget || '';
    }
};
