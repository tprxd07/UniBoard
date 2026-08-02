// Timer Page (Pomodoro)
const TimerPage = {
    timer: null,
    isRunning: false,
    isPaused: false,
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    mode: 'work', // work, break, longBreak
    pomodoroCount: 0,
    settings: { work: 25, break: 5, longBreak: 15 },

    render() {
        return `
        <div style="text-align: center; max-width: 500px; margin: 0 auto;">
            <div class="tabs" style="max-width: 400px; margin: 0 auto 30px;">
                <button class="tab active" data-mode="work">Pomodoro</button>
                <button class="tab" data-mode="break">Descanso</button>
                <button class="tab" data-mode="longBreak">Descanso largo</button>
            </div>

            <div class="timer-display" id="timer-display">25:00</div>

            <div style="margin: 30px 0;">
                <button class="btn btn-primary" id="timer-start" style="width: 120px; height: 120px; border-radius: 50%; font-size: 18px;">
                    ▶ Iniciar
                </button>
            </div>

            <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 30px;">
                <button class="btn btn-ghost btn-sm" id="timer-reset">↺ Resetear</button>
                <button class="btn btn-ghost btn-sm" id="timer-skip">⏭ Saltar</button>
            </div>

            <div class="grid-2" style="text-align: left; max-width: 400px; margin: 0 auto 30px;">
                <div class="card" style="text-align: center;">
                    <div style="font-size: 32px; font-weight: 800; color: var(--primary);" id="pomodoro-count">0</div>
                    <p style="font-size: 12px; color: var(--text-secondary);">Pomodoros hoy</p>
                </div>
                <div class="card" style="text-align: center;">
                    <div style="font-size: 32px; font-weight: 800; color: var(--primary);" id="total-focus-time">0h</div>
                    <p style="font-size: 12px; color: var(--text-secondary);">Tiempo enfocada</p>
                </div>
            </div>

            <div class="card" style="text-align: left; max-width: 400px; margin: 0 auto 20px;">
                <div class="card-header">
                    <span class="card-title">Asignatura actual</span>
                </div>
                <select id="timer-subject" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; background: var(--bg-input); color: var(--text); font-family: var(--font-family);">
                    <option value="">Seleccionar asignatura</option>
                </select>
            </div>

            <div class="card" style="text-align: left; max-width: 400px; margin: 0 auto 20px;">
                <div class="card-header">
                    <span class="card-title">Temas</span>
                </div>
                <textarea id="timer-topics" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-input);color:var(--text);font-family:var(--font-family);" placeholder="¿Qué estás estudiando?"></textarea>
            </div>

            <div class="card" style="text-align: left; max-width: 400px; margin: 0 auto 20px;">
                <div class="card-header">
                    <span class="card-title">Música ambiente</span>
                </div>
                <div class="pill-selector">
                    <button class="pill active" data-music="none">Silencio</button>
                    <button class="pill" data-music="rain">🌧️ Lluvia</button>
                    <button class="pill" data-music="forest">🌲 Bosque</button>
                    <button class="pill" data-music="cafe">☕ Café</button>
                    <button class="pill" data-music="lofi">🎵 Lo-fi</button>
                </div>
            </div>

            <div class="card" style="text-align: left; max-width: 400px; margin: 0 auto;">
                <div class="card-header">
                    <span class="card-title">Estimaciones</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
                    <span style="font-size: 13px; color: var(--text-secondary);">Estudio de hoy</span>
                    <span style="font-size: 13px; font-weight: 600;" id="est-today">0 min</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
                    <span style="font-size: 13px; color: var(--text-secondary);">Restante hoy (2h objetivo)</span>
                    <span style="font-size: 13px; font-weight: 600;" id="est-remaining">120 min</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                    <span style="font-size: 13px; color: var(--text-secondary);">Sesiones para completar</span>
                    <span style="font-size: 13px; font-weight: 600;" id="est-sessions">~4 pomodoros</span>
                </div>
            </div>
        </div>`;
    },

    init() {
        this.loadSettings();

        // Tab listeners for mode
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.setMode(tab.dataset.mode);
            });
        });

        // Music pills
        document.querySelectorAll('.pill[data-music]').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.pill[data-music]').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
            });
        });

        document.getElementById('timer-start').addEventListener('click', () => this.toggleTimer());
        document.getElementById('timer-reset').addEventListener('click', () => this.resetTimer());
        document.getElementById('timer-skip').addEventListener('click', () => this.skipToNext());

        this.loadSubjectsSelect();
    },

    async loadSettings() {
        try {
            const settings = await DB.getSettings();
            if (settings.pomodoroWork) this.settings.work = settings.pomodoroWork;
            if (settings.pomodoroBreak) this.settings.break = settings.pomodoroBreak;
            if (settings.pomodoroLongBreak) this.settings.longBreak = settings.pomodoroLongBreak;
            this.totalTime = this.settings.work * 60;
            this.timeLeft = this.totalTime;
            this.updateDisplay();
        } catch (e) {
            console.log('Using default timer settings');
        }
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
        if (this.isRunning && !this.isPaused) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    },

    startTimer() {
        this.isRunning = true;
        this.isPaused = false;
        document.getElementById('timer-start').textContent = '⏸ Pausar';

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.timerComplete();
            }
        }, 1000);
    },

    pauseTimer() {
        this.isPaused = true;
        clearInterval(this.timer);
        document.getElementById('timer-start').textContent = '▶ Reanudar';
    },

    resetTimer() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;
        this.timeLeft = this.totalTime;
        document.getElementById('timer-start').textContent = '▶ Iniciar';
        this.updateDisplay();
    },

    skipToNext() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;

        if (this.mode === 'work') {
            this.pomodoroCount++;
            if (this.pomodoroCount % 4 === 0) {
                this.setMode('longBreak');
            } else {
                this.setMode('break');
            }
        } else {
            this.setMode('work');
        }

        document.getElementById('timer-start').textContent = '▶ Iniciar';
        this.updateStats();
    },

    timerComplete() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;

        if (this.mode === 'work') {
            this.pomodoroCount++;
            this.saveSession();

            if (this.pomodoroCount % 4 === 0) {
                this.setMode('longBreak');
            } else {
                this.setMode('break');
            }
            Utils.showToast('Pomodoro completado. ¡Descansa!', 'success');
        } else {
            this.setMode('work');
            Utils.showToast('Descanso terminado. ¡A estudiar!', 'info');
        }

        document.getElementById('timer-start').textContent = '▶ Iniciar';
        this.updateStats();
    },

    updateDisplay() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        const display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        const el = document.getElementById('timer-display');
        if (el) el.textContent = display;

        // Update page title
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
                subject: subject,
                duration: this.settings.work,
                date: new Date().toISOString().split('T')[0],
                topics: topics,
                type: 'pomodoro'
            });
        } catch (e) {
            console.error('Error saving session:', e);
        }
    },

    async loadSubjectsSelect() {
        try {
            const subjects = await DB.getSubjects();
            const select = document.getElementById('timer-subject');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar asignatura</option>' +
                    subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
            }
        } catch (e) {}
    }
};
