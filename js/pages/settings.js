// Settings Page
const SettingsPage = {
    render() {
        return `
        <div class="section-header">
            <span class="section-title">Ajustes</span>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <span class="card-title">🎨 Apariencia</span>
            </div>

            <div class="settings-item">
                <div class="settings-item-info">
                    <h4>Tema</h4>
                    <p>Cambia entre claro y oscuro</p>
                </div>
                <div class="pill-selector">
                    <button class="pill" data-theme="light">☀️ Claro</button>
                    <button class="pill" data-theme="dark">🌙 Oscuro</button>
                    <button class="pill" data-theme="pink">💗 Rosa</button>
                </div>
            </div>

            <div class="settings-item">
                <div class="settings-item-info">
                    <h4>Color de acento</h4>
                    <p>Color principal de la app</p>
                </div>
                <div class="color-options">
                    <div class="color-option" style="background: #6C5CE7;" data-color="#6C5CE7"></div>
                    <div class="color-option" style="background: #00B894;" data-color="#00B894"></div>
                    <div class="color-option" style="background: #E17055;" data-color="#E17055"></div>
                    <div class="color-option" style="background: #74B9FF;" data-color="#74B9FF"></div>
                    <div class="color-option" style="background: #E84393;" data-color="#E84393"></div>
                    <div class="color-option" style="background: #00CEC9;" data-color="#00CEC9"></div>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <span class="card-title">⏱️ Pomodoro</span>
            </div>
            <div class="grid-3">
                <div class="form-group">
                    <label>Estudio (min)</label>
                    <input type="number" id="settings-pomodoro-work" value="25" min="5" max="120">
                </div>
                <div class="form-group">
                    <label>Descanso (min)</label>
                    <input type="number" id="settings-pomodoro-break" value="5" min="1" max="30">
                </div>
                <div class="form-group">
                    <label>Descanso largo (min)</label>
                    <input type="number" id="settings-pomodoro-long" value="15" min="5" max="60">
                </div>
            </div>
            <button class="btn btn-primary btn-sm" id="save-timer">Guardar temporizador</button>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <span class="card-title">📱 Sincronización</span>
            </div>
            <div class="settings-item">
                <div class="settings-item-info">
                    <h4>Firebase</h4>
                    <p>Los datos se sincronizan automáticamente con tu cuenta</p>
                </div>
                <span class="badge badge-success" id="firebase-status">Conectado</span>
            </div>
            <div class="settings-item">
                <div class="settings-item-info">
                    <h4>Última sincronización</h4>
                    <p id="last-sync">Ahora mismo</p>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <span class="card-title">📊 Datos</span>
            </div>
            <div class="settings-item">
                <div class="settings-item-info">
                    <h4>Exportar datos</h4>
                    <p>Descarga todos tus datos en JSON</p>
                </div>
                <button class="btn btn-ghost btn-sm" id="export-data">Exportar</button>
            </div>
            <div class="settings-item">
                <div class="settings-item-info">
                    <h4>Email</h4>
                    <p id="user-email">—</p>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <span class="card-title">ℹ️ Acerca de</span>
            </div>
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 32px; margin-bottom: 8px;">🎓</div>
                <h3 style="font-size: 18px; font-weight: 700; color: var(--primary);">UniBoard</h3>
                <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Tu compañera universitaria</p>
                <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Versión 1.0.0</p>
            </div>
        </div>

        <div class="card">
            <button class="btn btn-danger" id="btn-logout-settings" style="width: 100%;">
                🚪 Cerrar sesión
            </button>
        </div>`;
    },

    init() {
        this.loadSettings();

        // Theme pills
        document.querySelectorAll('.pill[data-theme]').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.pill[data-theme]').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const theme = pill.dataset.theme;
                document.documentElement.dataset.theme = theme;
                this.saveSetting('theme', theme);
            });
        });

        // Color options
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                const color = opt.dataset.color;
                document.documentElement.style.setProperty('--primary', color);
                this.saveSetting('accentColor', color);
            });
        });

        document.getElementById('save-timer').addEventListener('click', () => this.saveTimerSettings());
        document.getElementById('export-data').addEventListener('click', () => this.exportData());
        document.getElementById('btn-logout-settings').addEventListener('click', () => Auth.logout());
    },

    async loadSettings() {
        try {
            const settings = await DB.getSettings();
            const profile = await DB.getProfile();

            // Apply theme
            if (settings.theme) {
                document.documentElement.dataset.theme = settings.theme;
                document.querySelector(`.pill[data-theme="${settings.theme}"]`)?.classList.add('active');
            }

            // Apply accent color
            if (settings.accentColor) {
                document.documentElement.style.setProperty('--primary', settings.accentColor);
                document.querySelector(`.color-option[data-color="${settings.accentColor}"]`)?.classList.add('active');
            }

            // Load email
            document.getElementById('user-email').textContent = Auth.currentUser?.email || '—';

            // Firebase status
            const statusEl = document.getElementById('firebase-status');
            if (db && Auth.currentUser) {
                statusEl.textContent = 'Conectado';
                statusEl.className = 'badge badge-success';
            } else {
                statusEl.textContent = 'Modo demo';
                statusEl.className = 'badge badge-warning';
            }

            // Load timer settings
            document.getElementById('settings-pomodoro-work').value = settings.pomodoroWork || 25;
            document.getElementById('settings-pomodoro-break').value = settings.pomodoroBreak || 5;
            document.getElementById('settings-pomodoro-long').value = settings.pomodoroLongBreak || 15;
        } catch (e) {
            console.log('Error loading settings:', e);
        }
    },

    async saveSetting(key, value) {
        try {
            const settings = await DB.getSettings();
            settings[key] = value;
            await DB.updateSettings(settings);
        } catch (e) {
            console.error('Error saving setting:', e);
        }
    },

    async saveTimerSettings() {
        try {
            const settings = await DB.getSettings();
            settings.pomodoroWork = parseInt(document.getElementById('settings-pomodoro-work').value) || 25;
            settings.pomodoroBreak = parseInt(document.getElementById('settings-pomodoro-break').value) || 5;
            settings.pomodoroLongBreak = parseInt(document.getElementById('settings-pomodoro-long').value) || 15;
            await DB.updateSettings(settings);
            Utils.showToast('Temporizador actualizado', 'success');
        } catch (e) {
            Utils.showToast('Error al guardar', 'error');
        }
    },

    async exportData() {
        try {
            const [subjects, tasks, exams, sessions, documents, transactions, contacts, goals, reminders] = await Promise.all([
                DB.getSubjects(),
                DB.getTasks(),
                DB.getExams(),
                DB.getStudySessions(),
                DB.getDocuments(),
                DB.getTransactions(),
                DB.getContacts(),
                DB.getGoals(),
                DB.getReminders()
            ]);

            const data = {
                exportDate: new Date().toISOString(),
                subjects, tasks, exams, sessions, documents, transactions, contacts, goals, reminders
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `uniboard-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            Utils.showToast('Datos exportados', 'success');
        } catch (e) {
            Utils.showToast('Error al exportar', 'error');
        }
    }
};
