// Goals Page
const GoalsPage = {
    goals: [],

    render() {
        return `
        <div class="section-header">
            <span class="section-title">Objetivos</span>
            <button class="btn btn-primary btn-sm" id="add-goal-btn">+ Nuevo objetivo</button>
        </div>

        <div class="tabs" style="max-width: 300px; margin-bottom: 20px;">
            <button class="tab active" data-tab="goals">Metas</button>
            <button class="tab" data-tab="habits">Hábitos</button>
        </div>

        <div id="goals-content"></div>`;
    },

    init() {
        document.getElementById('add-goal-btn').addEventListener('click', () => this.showAddModal());

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.showTab(tab.dataset.tab);
            });
        });

        this.loadGoals();
    },

    async loadGoals() {
        try {
            this.goals = await DB.getGoals();
            this.showTab('goals');
        } catch (e) {
            console.error('Error loading goals:', e);
        }
    },

    showTab(tab) {
        const container = document.getElementById('goals-content');

        if (tab === 'goals') {
            if (this.goals.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.target + '</div><h3>Sin objetivos</h3><p>Crea tu primer objetivo semanal</p></div>';
                return;
            }

            container.innerHTML = Utils.sanitize(this.goals.map(goal => `
                <div class="goal-card">
                    <div class="goal-header">
                        <span class="goal-title">${goal.title}</span>
                        <div style="display: flex; gap: 6px;">
                            <span class="badge badge-${goal.completed ? 'success' : 'primary'}">${goal.completed ? 'Completado' : 'En progreso'}</span>
                            <button class="btn-icon" style="font-size: 14px;" onclick="GoalsPage.deleteGoal('${goal.id}')">${Icons.trash}</button>
                        </div>
                    </div>
                    ${goal.description ? `<p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">${goal.description}</p>` : ''}
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="progress-bar" style="flex: 1; margin-right: 12px;">
                            <div class="progress-fill purple" style="width: ${goal.progress || 0}%;"></div>
                        </div>
                        <span style="font-size: 13px; font-weight: 600;">${goal.progress || 0}%</span>
                    </div>
                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                        <button class="btn btn-ghost btn-sm" onclick="GoalsPage.updateProgress('${goal.id}', ${Math.min((goal.progress || 0) + 10, 100)})">+10%</button>
                        <button class="btn btn-ghost btn-sm" onclick="GoalsPage.updateProgress('${goal.id}', 100)">Completar</button>
                    </div>
                </div>
            `).join(''));
        } else {
            // Habits tracker
            const habits = this.goals.filter(g => g.type === 'habit');
            const defaultHarms = ['Beber agua', 'Estudiar 2h', 'Dormir 8h', 'Hacer ejercicio'];

            container.innerHTML = `
                <div class="card" style="margin-bottom: 16px;">
                    <div class="card-header">
                        <span class="card-title">Rastreador de hábitos semanal</span>
                    </div>
                    <div id="habit-tracker"></div>
                </div>`;

            this.renderHabitTracker(habits);
        }
    },

    renderHabitTracker(habits) {
        const container = document.getElementById('habit-tracker');
        if (!container) return;

        if (habits.length === 0) {
            habits = [{ id: 'default1', title: 'Beber agua', completedDays: [] },
                      { id: 'default2', title: 'Estudiar 2h', completedDays: [] }];
        }

        const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
        const now = new Date();

        container.innerHTML = Utils.sanitize(habits.map(habit => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border);">
                <span style="font-size: 13px; font-weight: 600; min-width: 100px;">${habit.title}</span>
                <div class="habit-tracker">
                    ${days.map((d, i) => {
                        const completed = habit.completedDays?.includes(i);
                        return `<div class="habit-day ${completed ? 'completed' : ''}" onclick="GoalsPage.toggleHabitDay('${habit.id}', ${i})">${d}</div>`;
                    }).join('')}
                </div>
            </div>
        `).join(''));
    },

    showAddModal() {
        const html = `
            <div class="form-group">
                <label>Tipo</label>
                <select id="goal-type">
                    <option value="goal">Meta semanal</option>
                    <option value="habit">Hábito</option>
                </select>
            </div>
            <div class="form-group">
                <label>Título</label>
                <input type="text" id="goal-title" placeholder="Ej: Estudiar tema 5">
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea id="goal-desc" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-input);color:var(--text);font-family:var(--font-family);"></textarea>
            </div>`;

        Utils.showModal('Nuevo Objetivo', html, async () => {
            const data = {
                type: document.getElementById('goal-type').value,
                title: document.getElementById('goal-title').value,
                description: document.getElementById('goal-desc').value,
                progress: 0,
                completed: false,
                completedDays: []
            };

            if (!data.title) {
                Utils.showToast('El título es obligatorio', 'error');
                return;
            }

            try {
                await DB.addGoal(data);
                Utils.showToast('Objetivo creado', 'success');
                this.loadGoals();
            } catch (e) {
                Utils.showToast('Error al guardar', 'error');
            }
        });
    },

    async updateProgress(id, progress) {
        try {
            await DB.updateGoal(id, {
                progress,
                completed: progress >= 100
            });
            Utils.showToast(progress >= 100 ? '¡Objetivo completado!' : 'Progreso actualizado', 'success');
            this.loadGoals();
        } catch (e) {
            Utils.showToast('Error al actualizar', 'error');
        }
    },

    async toggleHabitDay(id, dayIndex) {
        const habit = this.goals.find(g => g.id === id);
        if (!habit) return;

        const days = habit.completedDays || [];
        const idx = days.indexOf(dayIndex);
        if (idx > -1) {
            days.splice(idx, 1);
        } else {
            days.push(dayIndex);
        }

        try {
            await DB.updateGoal(id, { completedDays: days });
            this.loadGoals();
        } catch (e) {}
    },

    async deleteGoal(id) {
        if (confirm('¿Eliminar este objetivo?')) {
            try {
                await DB.deleteGoal(id);
                Utils.showToast('Objetivo eliminado', 'success');
                this.loadGoals();
            } catch (e) {
                Utils.showToast('Error al eliminar', 'error');
            }
        }
    }
};
