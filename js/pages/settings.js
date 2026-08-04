// Settings Page
const SettingsPage = {
    accentColors: [
        '#6C5CE7', '#A29BFE', '#0984E3', '#74B9FF',
        '#00B894', '#00CEC9', '#55EFC4',
        '#E17055', '#FDCB6E', '#F39C12',
        '#E84393', '#D63031', '#FF6348',
        '#636E72', '#2D3436', '#000000'
    ],
    bgColors: [
        '#F8F9FE', '#F0F2F5', '#FFF8F0', '#F0FFF4',
        '#FFF0F6', '#F0F8FF', '#FFFBF0', '#F5F5F5',
        '#1A1A2E', '#0D1117', '#1E272E', '#2C3A47',
        '#192A56', '#0A3D62', '#1B1464', '#0C0C0C'
    ],

    render() {
        const accentHTML = this.accentColors.map(c =>
            `<div class="color-option" style="background:${c};" data-color="${c}" title="${c}"></div>`
        ).join('');
        const bgHTML = this.bgColors.map(c =>
            `<div class="color-option color-option-bg" style="background:${c};${this.isLight(c) ? 'border:2px solid #ccc;' : ''}" data-color="${c}" title="${c}"></div>`
        ).join('');

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
                </div>
            </div>

            <div class="settings-item">
                <div class="settings-item-info">
                    <h4>Color de acento</h4>
                    <p>Color principal de la app</p>
                </div>
                <div>
                    <div class="color-options" style="flex-wrap:wrap;">
                        ${accentHTML}
                        <div class="color-option color-option-custom" title="Color personalizado">
                            <input type="color" id="accent-color-picker" value="#6C5CE7" style="opacity:0;width:100%;height:100%;cursor:pointer;border:none;">
                        </div>
                    </div>
                </div>
            </div>

            <div class="settings-item" style="border-bottom:none;">
                <div class="settings-item-info">
                    <h4>Color de fondo</h4>
                    <p>Color de fondo de la aplicación</p>
                </div>
                <div>
                    <div class="color-options" style="flex-wrap:wrap;">
                        ${bgHTML}
                        <div class="color-option color-option-custom" title="Color personalizado">
                            <input type="color" id="bg-color-picker" value="#F8F9FE" style="opacity:0;width:100%;height:100%;cursor:pointer;border:none;">
                        </div>
                    </div>
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

        // Accent color presets
        document.querySelectorAll('.color-option[data-color]:not(.color-option-bg):not(.color-option-custom)').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.color-options:not(.color-options-bg) .color-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                const color = opt.dataset.color;
                this.applyAccentColor(color);
                this.saveSetting('accentColor', color);
            });
        });

        // Accent custom picker
        const accentPicker = document.getElementById('accent-color-picker');
        if (accentPicker) {
            accentPicker.addEventListener('input', (e) => {
                document.querySelectorAll('.color-options:not(.color-options-bg) .color-option').forEach(o => o.classList.remove('active'));
                this.applyAccentColor(e.target.value);
                this.saveSetting('accentColor', e.target.value);
            });
        }

        // BG color presets
        document.querySelectorAll('.color-option-bg[data-color]').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.color-option-bg').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                const color = opt.dataset.color;
                this.applyBgColor(color);
                this.saveSetting('bgColor', color);
            });
        });

        // BG custom picker
        const bgPicker = document.getElementById('bg-color-picker');
        if (bgPicker) {
            bgPicker.addEventListener('input', (e) => {
                document.querySelectorAll('.color-option-bg').forEach(o => o.classList.remove('active'));
                this.applyBgColor(e.target.value);
                this.saveSetting('bgColor', e.target.value);
            });
        }

        document.getElementById('save-timer').addEventListener('click', () => this.saveTimerSettings());
        document.getElementById('export-data').addEventListener('click', () => this.exportData());
        document.getElementById('btn-logout-settings').addEventListener('click', () => Auth.logout());
    },

    applyAccentColor(color) {
        document.documentElement.style.setProperty('--primary', color);
        const light = this.lighten(color, 0.35);
        const dark = this.darken(color, 0.15);
        document.documentElement.style.setProperty('--primary-light', light);
        document.documentElement.style.setProperty('--primary-dark', dark);
        document.documentElement.style.setProperty('--primary-bg', this.hexToRgba(color, 0.1));
        document.documentElement.style.setProperty('--primary-bg-hover', this.hexToRgba(color, 0.15));
    },

    applyBgColor(color) {
        const isLight = this.isLight(color);
        document.documentElement.style.setProperty('--bg', color);
        document.documentElement.style.setProperty('--bg-card', this.lighten(color, isLight ? 0.02 : -0.05));
        document.documentElement.style.setProperty('--bg-sidebar', this.lighten(color, isLight ? 0.01 : -0.08));
        document.documentElement.style.setProperty('--bg-input', this.lighten(color, isLight ? -0.03 : 0.05));
        document.documentElement.style.setProperty('--text', isLight ? '#2D3436' : '#EAEAEA');
        document.documentElement.style.setProperty('--text-secondary', isLight ? '#636E72' : '#A0A0B0');
        document.documentElement.style.setProperty('--text-muted', isLight ? '#B2BEC3' : '#5A5A7A');
        document.documentElement.style.setProperty('--border', isLight ? '#E8ECF0' : '#2A2A4A');
        document.documentElement.style.setProperty('--border-light', isLight ? '#F1F3F8' : '#2A2A4A');
    },

    isLight(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return (r * 299 + g * 587 + b * 114) / 1000 > 150;
    },

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    },

    lighten(hex, amount) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.min(255, Math.round(r + (255 - r) * amount));
        g = Math.min(255, Math.round(g + (255 - g) * amount));
        b = Math.min(255, Math.round(b + (255 - b) * amount));
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    },

    darken(hex, amount) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.max(0, Math.round(r * (1 - amount)));
        g = Math.max(0, Math.round(g * (1 - amount)));
        b = Math.max(0, Math.round(b * (1 - amount)));
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    },

    async loadSettings() {
        try {
            const settings = await DB.getSettings();

            // Apply theme
            if (settings.theme) {
                document.documentElement.dataset.theme = settings.theme;
                document.querySelector(`.pill[data-theme="${settings.theme}"]`)?.classList.add('active');
            }

            // Apply accent color
            if (settings.accentColor) {
                this.applyAccentColor(settings.accentColor);
                document.querySelector(`.color-option[data-color="${settings.accentColor}"]`)?.classList.add('active');
                const picker = document.getElementById('accent-color-picker');
                if (picker && !this.accentColors.includes(settings.accentColor)) {
                    picker.value = settings.accentColor;
                }
            }

            // Apply bg color
            if (settings.bgColor) {
                this.applyBgColor(settings.bgColor);
                document.querySelector(`.color-option-bg[data-color="${settings.bgColor}"]`)?.classList.add('active');
                const picker = document.getElementById('bg-color-picker');
                if (picker && !this.bgColors.includes(settings.bgColor)) {
                    picker.value = settings.bgColor;
                }
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
