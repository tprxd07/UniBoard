// Settings Page
const SettingsPage = {
    accentColors: [
        '#6C5CE7', '#0984E3', '#00B894', '#E17055'
    ],
    bgColors: [
        '#F8F9FE', '#1A1A2E', '#0D1117', '#1E272E'
    ],

    getRecentColors(type) {
        try { return JSON.parse(localStorage.getItem(`recent_${type}_colors`) || '[]'); } catch { return []; }
    },

    addRecentColor(type, color) {
        let recent = this.getRecentColors(type);
        recent = recent.filter(c => c !== color);
        recent.unshift(color);
        if (recent.length > 4) recent = recent.slice(0, 4);
        localStorage.setItem(`recent_${type}_colors`, JSON.stringify(recent));
    },

    render() {
        const recentAccent = this.getRecentColors('accent');
        const recentBg = this.getRecentColors('bg');

        const accentHTML = this.accentColors.map(c =>
            `<div class="color-option" style="background:${c};" data-color="${c}" title="${c}"></div>`
        ).join('');
        const accentRecentHTML = recentAccent.map(c =>
            `<div class="color-option color-option-recent" style="background:${c};" data-color="${c}" title="${c} (reciente)"></div>`
        ).join('');

        const bgHTML = this.bgColors.map(c =>
            `<div class="color-option color-option-bg" style="background:${c};${this.isLight(c) ? 'border:2px solid #ccc;' : ''}" data-color="${c}" title="${c}"></div>`
        ).join('');
        const bgRecentHTML = recentBg.map(c =>
            `<div class="color-option color-option-bg color-option-recent" style="background:${c};${this.isLight(c) ? 'border:2px solid #ccc;' : ''}" data-color="${c}" title="${c} (reciente)"></div>`
        ).join('');

        return `
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <span class="card-title">${Icons.palette} Apariencia</span>
            </div>

            <div class="settings-item">
                <div class="settings-item-info">
                    <h4>Modo lectura</h4>
                    <p>Filtro suave para facilitar la lectura</p>
                </div>
                <div class="pill-selector">
                    <button class="pill" data-reading="off">${Icons.x} Desactivado</button>
                    <button class="pill" data-reading="warm">${Icons.sun} Cálido</button>
                    <button class="pill" data-reading="sepia">${Icons.bookOpen} Sepia</button>
                </div>
            </div>

            <div class="settings-item">
                <div class="settings-item-info">
                    <h4>Iconos</h4>
                    <p>Cambia entre iconos SVG y emojis</p>
                </div>
                <div class="pill-selector">
                    <button class="pill" data-icon-mode="icons">${Icons.home} Iconos</button>
                    <button class="pill" data-icon-mode="emojis">🎓 Emojis</button>
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
                        ${accentRecentHTML}
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
                        ${bgRecentHTML}
                        <div class="color-option color-option-custom" title="Color personalizado">
                            <input type="color" id="bg-color-picker" value="#F8F9FE" style="opacity:0;width:100%;height:100%;cursor:pointer;border:none;">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <span class="card-title">${Icons.smartphone} Sincronización</span>
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
                <span class="card-title">${Icons.barChart} Datos</span>
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
                <span class="card-title">${Icons.info} Acerca de</span>
            </div>
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 32px; margin-bottom: 8px;">${Icons.graduationCap}</div>
                <h3 style="font-size: 18px; font-weight: 700; color: var(--primary);">UniBoard</h3>
                <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Planificador universitario</p>
                <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Versión 1.0.0</p>
            </div>
        </div>

        <div class="card">
            <button class="btn btn-danger" id="btn-logout-settings" style="width: 100%;">
                ${Icons.logOut} Cerrar sesión
            </button>
        </div>`;
    },

    init() {
        this.loadSettings();

        // Reading mode pills
        document.querySelectorAll('.pill[data-reading]').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.pill[data-reading]').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const mode = pill.dataset.reading;
                this.applyReadingMode(mode);
                this.saveSetting('readingMode', mode);
            });
        });

        // Icon mode pills
        document.querySelectorAll('.pill[data-icon-mode]').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.pill[data-icon-mode]').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const mode = pill.dataset.iconMode;
                Icons.setMode(mode);
                this.saveSetting('iconMode', mode);
                this.reloadCurrentPage();
            });
        });

        // Set initial icon mode active state
        const currentIconMode = Icons.getMode();
        document.querySelector(`.pill[data-icon-mode="${currentIconMode}"]`)?.classList.add('active');

        // Accent color presets
        document.querySelectorAll('.color-option[data-color]:not(.color-option-bg):not(.color-option-custom)').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.color-options:not(.color-options-bg) .color-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                const color = opt.dataset.color;
                this.applyAccentColor(color);
                this.saveSetting('accentColor', color);
                this.addRecentColor('accent', color);
            });
        });

        // Accent custom picker
        const accentPicker = document.getElementById('accent-color-picker');
        if (accentPicker) {
            accentPicker.addEventListener('input', (e) => {
                document.querySelectorAll('.color-options:not(.color-options-bg) .color-option').forEach(o => o.classList.remove('active'));
                this.applyAccentColor(e.target.value);
                this.saveSetting('accentColor', e.target.value);
                this.addRecentColor('accent', e.target.value);
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
                this.addRecentColor('bg', color);
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
        document.documentElement.style.setProperty('--text-secondary', isLight ? '#4A5568' : '#B0B8C4');
        document.documentElement.style.setProperty('--text-muted', isLight ? '#718096' : '#7A8599');
        document.documentElement.style.setProperty('--border', isLight ? '#E8ECF0' : '#2A2A4A');
        document.documentElement.style.setProperty('--border-light', isLight ? '#F1F3F8' : '#2A2A4A');
    },

    applyReadingMode(mode) {
        const overlay = document.getElementById('reading-mode-overlay');
        if (mode === 'off') {
            if (overlay) overlay.remove();
            return;
        }
        let el = overlay;
        if (!el) {
            el = document.createElement('div');
            el.id = 'reading-mode-overlay';
            el.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;transition:background 0.3s;';
            document.body.appendChild(el);
        }
        if (mode === 'warm') {
            el.style.background = 'rgba(255, 200, 100, 0.06)';
        } else if (mode === 'sepia') {
            el.style.background = 'rgba(112, 66, 20, 0.08)';
        }
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

    reloadCurrentPage() {
        const pageName = App.currentPage || 'dashboard';
        const page = App.pages?.[pageName];
        if (page && page.render) {
            const container = document.getElementById('page-content');
            container.innerHTML = page.render();
            if (page.init) page.init();
        }
        App.updateNavIcons();
    },

    async loadSettings() {
        try {
            const settings = await DB.getSettings();

            // Apply reading mode
            if (settings.readingMode) {
                this.applyReadingMode(settings.readingMode);
                document.querySelector(`.pill[data-reading="${settings.readingMode}"]`)?.classList.add('active');
            } else {
                document.querySelector('.pill[data-reading="off"]')?.classList.add('active');
            }

            // Apply icon mode
            const iconMode = settings.iconMode || localStorage.getItem('iconMode') || 'icons';
            document.querySelector(`.pill[data-icon-mode="${iconMode}"]`)?.classList.add('active');

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
