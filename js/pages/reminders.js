// Reminders Page
const RemindersPage = {
    reminders: [],

    render() {
        return `
        <div class="section-header">
            <span class="section-title">Recordatorios</span>
            <button class="btn btn-primary btn-sm" id="add-reminder-btn">+ Nuevo</button>
        </div>

        <div id="reminders-list"></div>`;
    },

    init() {
        document.getElementById('add-reminder-btn').addEventListener('click', () => this.showAddModal());
        this.loadReminders();
    },

    async loadReminders() {
        try {
            this.reminders = await DB.getReminders();
            this.renderList();
        } catch (e) {
            console.error('Error loading reminders:', e);
        }
    },

    renderList() {
        const container = document.getElementById('reminders-list');

        if (this.reminders.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.bell + '</div><h3>Sin recordatorios</h3><p>Crea tu primer recordatorio</p></div>';
            return;
        }

        const iconMap = {
            study: Icons.bookOpen,
            water: Icons.droplet,
            task: Icons.check,
            exam: Icons.edit,
            class: Icons.book,
            other: Icons.bell
        };

        container.innerHTML = Utils.sanitize(this.reminders.map(r => `
            <div class="reminder-item">
                <div class="reminder-icon">${iconMap[r.type] || Icons.bell}</div>
                <div class="list-item-content">
                    <div class="list-item-title">${r.title}</div>
                    <div class="list-item-subtitle">
                        ${r.time ? Icons.clock + ' ' + r.time : ''}
                        ${r.days ? ' · ' + this.formatDays(r.days) : ''}
                        ${r.recurring ? ' · recurrente' : ''}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label class="toggle">
                        <input type="checkbox" ${r.enabled !== false ? 'checked' : ''} onchange="RemindersPage.toggleReminder('${r.id}', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <button class="btn-icon" style="font-size: 14px;" onclick="RemindersPage.deleteReminder('${r.id}')">${Icons.trash}</button>
                </div>
            </div>
        `).join(''));
    },

    formatDays(days) {
        if (!days) return '';
        const dayNames = { mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom' };
        if (Array.isArray(days)) return days.map(d => dayNames[d] || d).join(', ');
        return days;
    },

    showAddModal() {
        const html = `
            <div class="form-group">
                <label>Tipo</label>
                <select id="reminder-type">
                    <option value="study">${Icons.bookOpen} Estudio</option>
                    <option value="water">${Icons.droplet} Beber agua</option>
                    <option value="task">${Icons.check} Entrega</option>
                    <option value="exam">${Icons.edit} Examen</option>
                    <option value="class">${Icons.book} Clase</option>
                    <option value="other">${Icons.bell} Otro</option>
                </select>
            </div>
            <div class="form-group">
                <label>Título</label>
                <input type="text" id="reminder-title" placeholder="Ej: Beber agua cada 2 horas">
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Hora</label>
                    <input type="time" id="reminder-time">
                </div>
                <div class="form-group">
                    <label>Repetir</label>
                    <select id="reminder-recurring">
                        <option value="daily">Diariamente</option>
                        <option value="weekly">Semanalmente</option>
                        <option value="once">Una vez</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Días</label>
                <div class="pill-selector" id="reminder-days">
                    <button class="pill" data-day="mon">Lun</button>
                    <button class="pill" data-day="tue">Mar</button>
                    <button class="pill" data-day="wed">Mié</button>
                    <button class="pill" data-day="thu">Jue</button>
                    <button class="pill" data-day="fri">Vie</button>
                    <button class="pill" data-day="sat">Sáb</button>
                    <button class="pill" data-day="sun">Dom</button>
                </div>
            </div>`;

        Utils.showModal('Nuevo Recordatorio', html, async () => {
            const selectedDays = [];
            document.querySelectorAll('#reminder-days .pill.active').forEach(p => {
                selectedDays.push(p.dataset.day);
            });

            const data = {
                type: document.getElementById('reminder-type').value,
                title: document.getElementById('reminder-title').value,
                time: document.getElementById('reminder-time').value,
                recurring: document.getElementById('reminder-recurring').value,
                days: selectedDays.length > 0 ? selectedDays : null,
                enabled: true
            };

            if (!data.title) {
                Utils.showToast('El título es obligatorio', 'error');
                return;
            }

            try {
                await DB.addReminder(data);
                Utils.showToast('Recordatorio creado', 'success');
                this.loadReminders();
            } catch (e) {
                Utils.showToast('Error al guardar', 'error');
            }
        });

        // Day pills
        document.querySelectorAll('#reminder-days .pill').forEach(pill => {
            pill.addEventListener('click', () => pill.classList.toggle('active'));
        });
    },

    async toggleReminder(id, enabled) {
        try {
            await DB.updateReminder(id, { enabled });
        } catch (e) {}
    },

    async deleteReminder(id) {
        if (confirm('¿Eliminar este recordatorio?')) {
            try {
                await DB.deleteReminder(id);
                Utils.showToast('Recordatorio eliminado', 'success');
                this.loadReminders();
            } catch (e) {
                Utils.showToast('Error al eliminar', 'error');
            }
        }
    }
};
