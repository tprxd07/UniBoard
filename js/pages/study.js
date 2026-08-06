// Study Page (Pomodoro + Sessions)
const StudyPage = {
    sessions: [],
    timer: null,
    isRunning: false,
    isPaused: false,
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    mode: 'work',
    pomodoroCount: 0,
    settings: { work: 25, break: 5, longBreak: 15 },
    activeTab: 'pomodoro',
    isConcentrating: false,

    render() {
        return `
        <div class="tabs" style="max-width: 400px; margin-bottom: 20px;">
            <button class="tab active" data-tab="pomodoro">Pomodoro</button>
            <button class="tab" data-tab="sessions">Sesiones</button>
            <button class="tab" data-tab="stats">Estadísticas</button>
        </div>

        <div id="study-content"></div>

        <!-- Concentration Mode Overlay -->
        <div id="concentration-overlay" class="concentration-overlay hidden">
            <div class="concentration-time" id="concentration-time">25:00</div>
            <div class="concentration-mode-label" id="concentration-mode-label">Modo estudio</div>
            <div class="concentration-actions">
                <button class="concentration-btn" id="concentration-toggle">⏸</button>
                <button class="concentration-btn concentration-btn-exit" id="concentration-exit">✕</button>
            </div>
        </div>`;
    },

    init() {
        this.loadSettings();

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeTab = tab.dataset.tab;
                this.showTab(tab.dataset.tab);
            });
        });

        this.showTab('pomodoro');
    },

    showTab(tab) {
        const container = document.getElementById('study-content');
        if (tab === 'pomodoro') this.renderPomodoro(container);
        else if (tab === 'sessions') this.renderSessionsTab(container);
        else this.renderStatsTab(container);
    },

    // ============ POMODORO ============
    renderPomodoro(container) {
        container.innerHTML = `
        <div style="text-align: center; max-width: 500px; margin: 0 auto;">
            <div class="tabs" style="max-width: 400px; margin: 0 auto 30px;">
                <button class="tab active" data-mode="work">Pomodoro</button>
                <button class="tab" data-mode="break">Descanso</button>
                <button class="tab" data-mode="longBreak">Descanso largo</button>
            </div>

            <div class="timer-display" id="timer-display">${this.formatTime(this.timeLeft)}</div>

            <div style="margin: 24px 0; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button class="btn btn-primary" id="timer-start" style="width: 100px; height: 100px; border-radius: 50%; font-size: 16px;">
                    ▶ Iniciar
                </button>
                <button class="btn btn-ghost" id="btn-concentration" style="width: 50px; height: 50px; border-radius: 50%; font-size: 18px; align-self: center;" title="Modo concentración">
                    ${Icons.monitor}
                </button>
            </div>

            <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 30px;">
                <button class="btn btn-ghost btn-sm" id="timer-reset">↺ Resetear</button>
                <button class="btn btn-ghost btn-sm" id="timer-skip">⏭ Saltar</button>
            </div>

            <div class="grid-2" style="text-align: center; max-width: 400px; margin: 0 auto 30px;">
                <div class="card" style="text-align: center;">
                    <div style="font-size: 32px; font-weight: 800; color: var(--primary);" id="pomodoro-count">${this.pomodoroCount}</div>
                    <p style="font-size: 12px; color: var(--text-secondary);">Pomodoros hoy</p>
                </div>
                <div class="card" style="text-align: center;">
                    <div style="font-size: 32px; font-weight: 800; color: var(--primary);" id="total-focus-time">${(this.pomodoroCount * this.settings.work / 60).toFixed(1)}h</div>
                    <p style="font-size: 12px; color: var(--text-secondary);">Tiempo enfocado</p>
                </div>
            </div>

            <div class="card" style="text-align: left; max-width: 400px; margin: 0 auto 16px;">
                <div class="card-header"><span class="card-title">Asignatura actual</span></div>
                <select id="timer-subject" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; background: var(--bg-input); color: var(--text); font-family: var(--font-family);">
                    <option value="">Seleccionar asignatura</option>
                </select>
            </div>

            <div class="card" style="text-align: left; max-width: 400px; margin: 0 auto;">
                <div class="card-header"><span class="card-title">Temas</span></div>
                <textarea id="timer-topics" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-input);color:var(--text);font-family:var(--font-family);" placeholder="¿Qué estás estudiando?"></textarea>
            </div>
        </div>`;

        // Mode tabs
        container.querySelectorAll('.tab[data-mode]').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.tab[data-mode]').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.setMode(tab.dataset.mode);
            });
        });

        document.getElementById('timer-start').addEventListener('click', () => this.toggleTimer());
        document.getElementById('timer-reset').addEventListener('click', () => this.resetTimer());
        document.getElementById('timer-skip').addEventListener('click', () => this.skipToNext());
        document.getElementById('btn-concentration').addEventListener('click', () => this.enterConcentration());

        this.loadSubjectsSelect();
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    async loadSettings() {
        try {
            const settings = await DB.getSettings();
            if (settings.pomodoroWork) this.settings.work = settings.pomodoroWork;
            if (settings.pomodoroBreak) this.settings.break = settings.pomodoroBreak;
            if (settings.pomodoroLongBreak) this.settings.longBreak = settings.pomodoroLongBreak;
            this.totalTime = this.settings.work * 60;
            this.timeLeft = this.totalTime;
        } catch (e) {}
    },

    setMode(mode) {
        this.mode = mode;
        if (mode === 'work') this.totalTime = this.settings.work * 60;
        else if (mode === 'break') this.totalTime = this.settings.break * 60;
        else this.totalTime = this.settings.longBreak * 60;
        this.timeLeft = this.totalTime;
        this.updateDisplay();
    },

    toggleTimer() {
        if (this.isRunning && !this.isPaused) this.pauseTimer();
        else this.startTimer();
    },

    startTimer() {
        this.isRunning = true;
        this.isPaused = false;
        const btn = document.getElementById('timer-start');
        if (btn) btn.textContent = '⏸ Pausar';
        const cBtn = document.getElementById('concentration-toggle');
        if (cBtn) cBtn.textContent = '⏸';

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            if (this.timeLeft <= 0) this.timerComplete();
        }, 1000);
    },

    pauseTimer() {
        this.isPaused = true;
        clearInterval(this.timer);
        const btn = document.getElementById('timer-start');
        if (btn) btn.textContent = '▶ Reanudar';
        const cBtn = document.getElementById('concentration-toggle');
        if (cBtn) cBtn.textContent = '▶';
    },

    resetTimer() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;
        this.timeLeft = this.totalTime;
        const btn = document.getElementById('timer-start');
        if (btn) btn.textContent = '▶ Iniciar';
        this.updateDisplay();
    },

    skipToNext() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;
        if (this.mode === 'work') {
            this.pomodoroCount++;
            this.setMode(this.pomodoroCount % 4 === 0 ? 'longBreak' : 'break');
        } else {
            this.setMode('work');
        }
        const btn = document.getElementById('timer-start');
        if (btn) btn.textContent = '▶ Iniciar';
        this.updateStats();
    },

    timerComplete() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;

        if (this.mode === 'work') {
            this.pomodoroCount++;
            this.saveSession();
            this.setMode(this.pomodoroCount % 4 === 0 ? 'longBreak' : 'break');
            Utils.showToast('Pomodoro completado. ¡Descansa!', 'success');
        } else {
            this.setMode('work');
            Utils.showToast('Descanso terminado. ¡A estudiar!', 'info');
        }
        const btn = document.getElementById('timer-start');
        if (btn) btn.textContent = '▶ Iniciar';
        this.updateStats();
    },

    updateDisplay() {
        const display = this.formatTime(this.timeLeft);
        const el = document.getElementById('timer-display');
        if (el) el.textContent = display;
        const cEl = document.getElementById('concentration-time');
        if (cEl) cEl.textContent = display;
        document.title = `${display} - UniBoard`;
    },

    updateStats() {
        const el1 = document.getElementById('pomodoro-count');
        const el2 = document.getElementById('total-focus-time');
        if (el1) el1.textContent = this.pomodoroCount;
        if (el2) el2.textContent = (this.pomodoroCount * this.settings.work / 60).toFixed(1) + 'h';
    },

    async saveSession() {
        try {
            const subject = document.getElementById('timer-subject')?.value || '';
            const topics = document.getElementById('timer-topics')?.value || '';
            await DB.addStudySession({
                subject, topics,
                duration: this.settings.work,
                date: new Date().toISOString().split('T')[0],
                type: 'pomodoro'
            });
            DB.updateStreak().catch(() => {});
        } catch (e) {}
    },

    // ============ CONCENTRATION MODE ============
    enterConcentration() {
        this.isConcentrating = true;
        const overlay = document.getElementById('concentration-overlay');
        overlay.classList.remove('hidden');
        this.updateConcentrationModeLabel();

        document.getElementById('concentration-toggle').addEventListener('click', () => this.toggleTimer());
        document.getElementById('concentration-exit').addEventListener('click', () => this.exitConcentration());

        try { document.documentElement.requestFullscreen(); } catch (e) {}
    },

    exitConcentration() {
        this.isConcentrating = false;
        document.getElementById('concentration-overlay').classList.add('hidden');
        try { document.exitFullscreen(); } catch (e) {}
    },

    updateConcentrationModeLabel() {
        const label = document.getElementById('concentration-mode-label');
        if (!label) return;
        if (this.mode === 'work') label.textContent = 'Modo estudio';
        else if (this.mode === 'break') label.textContent = 'Descanso';
        else label.textContent = 'Descanso largo';
    },

    // ============ SESSIONS ============
    async renderSessionsTab(container) {
        try {
            this.sessions = await DB.getStudySessions();
        } catch (e) { this.sessions = []; }

        const now = new Date();
        const weekStart = Utils.getStartOfWeek(now);
        const weekSessions = this.sessions.filter(s => new Date(s.date) >= weekStart);
        const totalMinutes = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const daysWithSessions = new Set(weekSessions.map(s => new Date(s.date).toDateString())).size;

        let streak = 0;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        for (let i = 0; i < 365; i++) {
            const checkDate = Utils.addDays(today, -i);
            if (this.sessions.some(s => Utils.isSameDay(new Date(s.date), checkDate))) streak++;
            else if (i > 0) break;
        }

        container.innerHTML = `
        <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
            <button class="btn btn-primary btn-sm" id="add-study-btn">+ Nueva sesión</button>
        </div>
        <div class="grid-4" style="margin-bottom: 20px;">
            <div class="stat-card"><div class="stat-icon purple">${Icons.bookOpen}</div><div class="stat-info"><h4>${(totalMinutes / 60).toFixed(1)}h</h4><p>Total semana</p></div></div>
            <div class="stat-card"><div class="stat-icon green">${Icons.check}</div><div class="stat-info"><h4>${weekSessions.length}</h4><p>Sesiones</p></div></div>
            <div class="stat-card"><div class="stat-icon orange">${Icons.fire}</div><div class="stat-info"><h4>${streak}</h4><p>Racha</p></div></div>
            <div class="stat-card"><div class="stat-icon blue">${Icons.target}</div><div class="stat-info"><h4>${daysWithSessions > 0 ? (totalMinutes / 60 / daysWithSessions).toFixed(1) + 'h' : '0h'}</h4><p>Promedio</p></div></div>
        </div>
        <div id="sessions-list"></div>`;

        document.getElementById('add-study-btn').addEventListener('click', () => this.showAddSessionModal());
        this.renderSessionsList();
    },

    renderSessionsList() {
        const list = document.getElementById('sessions-list');
        if (!list) return;
        const recent = this.sessions.slice(0, 20);
        if (recent.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.bookOpen + '</div><h3>Sin sesiones</h3><p>Registra tu primera sesión de estudio</p></div>';
            return;
        }
        list.innerHTML = recent.map(s => `
            <div class="study-session">
                <div class="study-session-time">${s.duration || 0}min</div>
                <div class="study-session-info" style="flex: 1;">
                    <h4>${s.subject || 'Estudio general'}</h4>
                    <p>${s.topics || 'Sin temas'} · ${Utils.formatDate(s.date)}</p>
                </div>
                <button class="btn-icon" style="font-size: 14px;" onclick="StudyPage.deleteSession('${s.id}')">${Icons.trash}</button>
            </div>
        `).join('');
    },

    showAddSessionModal() {
        const html = `
            <div class="form-group"><label>Asignatura</label><select id="study-subject"><option value="">General</option></select></div>
            <div class="grid-2">
                <div class="form-group"><label>Duración (min)</label><input type="number" id="study-duration" value="25" min="5" max="480"></div>
                <div class="form-group"><label>Fecha</label><input type="date" id="study-date" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>
            <div class="form-group"><label>Temas</label><textarea id="study-topics" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-input);color:var(--text);font-family:var(--font-family);" placeholder="Capítulo 3: Derivadas..."></textarea></div>
            <div class="form-group"><label>Notas</label><textarea id="study-notes" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-input);color:var(--text);font-family:var(--font-family);" placeholder="Cómo me sentí..."></textarea></div>`;

        Utils.showModal('Nueva Sesión', html, async () => {
            const data = {
                subject: document.getElementById('study-subject').value,
                duration: parseInt(document.getElementById('study-duration').value) || 25,
                date: document.getElementById('study-date').value,
                topics: document.getElementById('study-topics').value,
                notes: document.getElementById('study-notes').value
            };
            try {
                await DB.addStudySession(data);
                DB.updateStreak().catch(() => {});
                Utils.showToast('Sesión registrada', 'success');
                this.renderSessionsTab(document.getElementById('study-content'));
            } catch (e) { Utils.showToast('Error al guardar', 'error'); }
        });
        this.loadSubjectsSelect();
    },

    async deleteSession(id) {
        if (!confirm('¿Eliminar esta sesión?')) return;
        try {
            if (DB.isDemo()) {
                const items = JSON.parse(localStorage.getItem('uniguide_studySessions') || '[]').filter(i => i.id !== id);
                localStorage.setItem('uniguide_studySessions', JSON.stringify(items));
            } else {
                await db.collection('users').doc(Auth.currentUser.uid).collection('studySessions').doc(id).delete();
            }
            Utils.showToast('Sesión eliminada', 'success');
            this.renderSessionsTab(document.getElementById('study-content'));
        } catch (e) { Utils.showToast('Error al eliminar', 'error'); }
    },

    // ============ STATS ============
    renderStatsTab(container) {
        const now = new Date();
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
            const d = Utils.addDays(now, -i);
            const mins = this.sessions.filter(s => Utils.isSameDay(new Date(s.date), d)).reduce((sum, s) => sum + (s.duration || 0), 0);
            last7.push({ day: Utils.getDayName(d, true), minutes: mins });
        }
        const maxM = Math.max(...last7.map(d => d.minutes), 1);

        container.innerHTML = `
        <div class="card">
            <h4 style="font-size: 14px; margin-bottom: 16px;">Últimos 7 días</h4>
            <div class="stat-chart">
                ${last7.map(d => `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                        <div class="stat-bar" style="width: 100%; height: ${(d.minutes / maxM) * 100}%; background: var(--primary);"></div>
                        <div class="stat-bar-label">${d.day}</div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    },

    async loadSubjectsSelect() {
        try {
            const subjects = await DB.getSubjects();
            const sel = document.getElementById('timer-subject') || document.getElementById('study-subject');
            if (sel) {
                const val = sel.value;
                sel.innerHTML = '<option value="">Seleccionar asignatura</option>' +
                    subjects.map(s => `<option value="${s.name}" ${s.name === val ? 'selected' : ''}>${s.name}</option>`).join('');
            }
        } catch (e) {}
    }
};
