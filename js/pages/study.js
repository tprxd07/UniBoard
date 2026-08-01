// Study Planner Page
const StudyPage = {
    sessions: [],

    render() {
        return `
        <div class="section-header">
            <span class="section-title">Planificador de Estudio</span>
            <button class="btn btn-primary btn-sm" id="add-study-btn">+ Nueva sesión</button>
        </div>

        <div class="grid-4" style="margin-bottom: 20px;">
            <div class="stat-card">
                <div class="stat-icon purple">📖</div>
                <div class="stat-info">
                    <h4 id="total-hours">0h</h4>
                    <p>Total esta semana</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">✅</div>
                <div class="stat-info">
                    <h4 id="total-sessions">0</h4>
                    <p>Sesiones completadas</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">🔥</div>
                <div class="stat-info">
                    <h4 id="streak-count">0</h4>
                    <p>Racha de días</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue">🎯</div>
                <div class="stat-info">
                    <h4 id="avg-hours">0h</h4>
                    <p>Promedio diario</p>
                </div>
            </div>
        </div>

        <div class="tabs" style="max-width: 300px;">
            <button class="tab active" data-tab="sessions">Sesiones</button>
            <button class="tab" data-tab="goals">Objetivos</button>
            <button class="tab" data-tab="stats">Estadísticas</button>
        </div>

        <div id="study-content"></div>`;
    },

    init() {
        document.getElementById('add-study-btn').addEventListener('click', () => this.showAddSessionModal());

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.showTab(tab.dataset.tab);
            });
        });

        this.loadSessions();
    },

    async loadSessions() {
        try {
            this.sessions = await DB.getStudySessions();
            this.updateStats();
            this.showTab('sessions');
        } catch (e) {
            console.error('Error loading study sessions:', e);
        }
    },

    updateStats() {
        const now = new Date();
        const weekStart = Utils.getStartOfWeek(now);

        const weekSessions = this.sessions.filter(s => new Date(s.date) >= weekStart);
        const totalMinutes = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const totalHours = (totalMinutes / 60).toFixed(1);
        const daysWithSessions = new Set(weekSessions.map(s => new Date(s.date).toDateString())).size;

        document.getElementById('total-hours').textContent = totalHours + 'h';
        document.getElementById('total-sessions').textContent = weekSessions.length;
        document.getElementById('avg-hours').textContent = daysWithSessions > 0 ? (totalMinutes / 60 / daysWithSessions).toFixed(1) + 'h' : '0h';

        // Calculate streak
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 365; i++) {
            const checkDate = Utils.addDays(today, -i);
            const hasSession = this.sessions.some(s => Utils.isSameDay(new Date(s.date), checkDate));
            if (hasSession) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        document.getElementById('streak-count').textContent = streak;
    },

    showTab(tab) {
        const container = document.getElementById('study-content');

        if (tab === 'sessions') {
            this.renderSessions(container);
        } else if (tab === 'goals') {
            this.renderGoals(container);
        } else {
            this.renderStats(container);
        }
    },

    renderSessions(container) {
        const weekSessions = this.sessions.slice(0, 20);

        if (weekSessions.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📖</div><h3>Sin sesiones</h3><p>Registra tu primera sesión de estudio</p></div>';
            return;
        }

        container.innerHTML = weekSessions.map(s => `
            <div class="study-session">
                <div class="study-session-time">${s.duration || 0}min</div>
                <div class="study-session-info" style="flex: 1;">
                    <h4>${s.subject || 'Estudio general'}</h4>
                    <p>${s.topics || 'Sin temas específicos'} · ${Utils.formatDate(s.date)}</p>
                </div>
                <button class="btn-icon" style="font-size: 14px;" onclick="StudyPage.deleteSession('${s.id}')">🗑️</button>
            </div>
        `).join('');
    },

    renderGoals(container) {
        const todayGoals = this.sessions.filter(s => Utils.isSameDay(new Date(s.date), new Date()));
        const totalToday = todayGoals.reduce((sum, s) => sum + (s.duration || 0), 0);
        const goalMinutes = 120; // 2 hour daily goal

        container.innerHTML = `
            <div class="card" style="margin-bottom: 16px;">
                <h4 style="font-size: 14px; margin-bottom: 12px;">Objetivo diario: 2 horas</h4>
                <div class="progress-bar">
                    <div class="progress-fill purple" style="width: ${Math.min((totalToday / goalMinutes) * 100, 100)}%;"></div>
                </div>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                    ${totalToday} / ${goalMinutes} minutos (${Math.min(Math.round((totalToday / goalMinutes) * 100), 100)}%)
                </p>
            </div>

            <div class="card">
                <h4 style="font-size: 14px; margin-bottom: 12px;">Horas por asignatura esta semana</h4>
                <div id="subject-hours"></div>
            </div>`;
    },

    renderStats(container) {
        const now = new Date();
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = Utils.addDays(now, -i);
            const dayMinutes = this.sessions
                .filter(s => Utils.isSameDay(new Date(s.date), d))
                .reduce((sum, s) => sum + (s.duration || 0), 0);
            last7Days.push({
                day: Utils.getDayName(d, true),
                minutes: dayMinutes
            });
        }

        const maxMinutes = Math.max(...last7Days.map(d => d.minutes), 1);

        container.innerHTML = `
            <div class="card">
                <h4 style="font-size: 14px; margin-bottom: 16px;">Últimos 7 días</h4>
                <div class="stat-chart">
                    ${last7Days.map(d => `
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                            <div class="stat-bar" style="width: 100%; height: ${(d.minutes / maxMinutes) * 100}%; background: var(--primary);"></div>
                            <div class="stat-bar-label">${d.day}</div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    },

    showAddSessionModal() {
        const html = `
            <div class="form-group">
                <label>Asignatura</label>
                <select id="study-subject">
                    <option value="">General</option>
                </select>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Duración (minutos)</label>
                    <input type="number" id="study-duration" value="25" min="5" max="480">
                </div>
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" id="study-date" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div class="form-group">
                <label>Temas estudiados</label>
                <textarea id="study-topics" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-input);color:var(--text);font-family:var(--font-family);" placeholder="Ej: Capítulo 3: Derivadas parciales"></textarea>
            </div>
            <div class="form-group">
                <label>Notas</label>
                <textarea id="study-notes" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-input);color:var(--text);font-family:var(--font-family);" placeholder="Cómo me sentí, dificultad..."></textarea>
            </div>`;

        Utils.showModal('Nueva Sesión de Estudio', html, async () => {
            const data = {
                subject: document.getElementById('study-subject').value,
                duration: parseInt(document.getElementById('study-duration').value) || 25,
                date: document.getElementById('study-date').value,
                topics: document.getElementById('study-topics').value,
                notes: document.getElementById('study-notes').value
            };

            try {
                await DB.addStudySession(data);
                Utils.showToast('Sesión registrada', 'success');
                this.loadSessions();
            } catch (e) {
                Utils.showToast('Error al guardar', 'error');
            }
        });

        // Load subjects
        this.loadSubjectsSelect();
    },

    async loadSubjectsSelect() {
        try {
            const subjects = await DB.getSubjects();
            const select = document.getElementById('study-subject');
            select.innerHTML = '<option value="">General</option>' +
                subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        } catch (e) {}
    },

    async deleteSession(id) {
        if (confirm('¿Eliminar esta sesión?')) {
            try {
                if (DB.isDemo()) {
                    const items = JSON.parse(localStorage.getItem('uniguide_studySessions') || '[]')
                        .filter(i => i.id !== id);
                    localStorage.setItem('uniguide_studySessions', JSON.stringify(items));
                } else {
                    await db.collection('users').doc(Auth.currentUser.uid).collection('studySessions').doc(id).delete();
                }
                Utils.showToast('Sesión eliminada', 'success');
                this.loadSessions();
            } catch (e) {
                Utils.showToast('Error al eliminar', 'error');
            }
        }
    }
};
