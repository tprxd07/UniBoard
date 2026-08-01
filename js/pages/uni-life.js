// University Life Page
const UniLifePage = {
    render() {
        return `
        <div class="section-header">
            <span class="section-title">Vida Universitaria</span>
        </div>

        <div class="grid-2">
            <div class="card">
                <div class="card-header">
                    <span class="card-title">🎒 Mi Universidad</span>
                </div>
                <div class="form-group">
                    <label>Nombre de la universidad</label>
                    <input type="text" id="uni-name" placeholder="Ej: Universidad de Madrid">
                </div>
                <div class="form-group">
                    <label>Grado</label>
                    <input type="text" id="uni-degree" placeholder="Ej: Ingeniería Informática">
                </div>
                <div class="form-group">
                    <label>Curso actual</label>
                    <select id="uni-year">
                        <option value="1">1º</option>
                        <option value="2">2º</option>
                        <option value="3">3º</option>
                        <option value="4">4º</option>
                        <option value="5">5º</option>
                    </select>
                </div>
                <button class="btn btn-primary btn-full" id="uni-save">Guardar</button>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">🔗 Enlaces útiles</span>
                </div>
                <div class="list-item" onclick="window.open('https://www.google.com', '_blank')">
                    <div class="list-item-icon">🌐</div>
                    <div class="list-item-content">
                        <div class="list-item-title">Web de la universidad</div>
                        <div class="list-item-subtitle">Página principal</div>
                    </div>
                </div>
                <div class="list-item" onclick="window.open('https://mail.google.com', '_blank')">
                    <div class="list-item-icon">📧</div>
                    <div class="list-item-content">
                        <div class="list-item-title">Correo universitario</div>
                        <div class="list-item-subtitle">Email institucional</div>
                    </div>
                </div>
                <div class="list-item" onclick="window.open('https://www.google.com', '_blank')">
                    <div class="list-item-icon">📖</div>
                    <div class="list-item-content">
                        <div class="list-item-title">Campus virtual</div>
                        <div class="list-item-subtitle">Plataforma de aprendizaje</div>
                    </div>
                </div>
                <div class="list-item" onclick="window.open('https://www.google.com', '_blank')">
                    <div class="list-item-icon">📚</div>
                    <div class="list-item-content">
                        <div class="list-item-title">Biblioteca</div>
                        <div class="list-item-subtitle">Catálogo y reservas</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: 20px;">
            <div class="card-header">
                <span class="card-title">📅 Horario de la semana</span>
                <button class="btn btn-primary btn-sm" id="add-class-btn">+ Añadir clase</button>
            </div>
            <div id="uni-schedule"></div>
        </div>`;
    },

    init() {
        this.loadProfile();
        this.loadSchedule();

        document.getElementById('uni-save').addEventListener('click', () => this.saveProfile());
        document.getElementById('add-class-btn').addEventListener('click', () => this.showAddClassModal());
    },

    async loadProfile() {
        try {
            const profile = await DB.getProfile();
            document.getElementById('uni-name').value = profile.university || '';
            document.getElementById('uni-degree').value = profile.degree || '';
            if (profile.year) document.getElementById('uni-year').value = profile.year;
        } catch (e) {}
    },

    async saveProfile() {
        try {
            await DB.updateProfile({
                university: document.getElementById('uni-name').value,
                degree: document.getElementById('uni-degree').value,
                year: document.getElementById('uni-year').value
            });
            Utils.showToast('Perfil actualizado', 'success');
        } catch (e) {
            Utils.showToast('Error al guardar', 'error');
        }
    },

    async loadSchedule() {
        try {
            const schedule = await DB.getSchedule();
            const container = document.getElementById('uni-schedule');

            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const grouped = {};
            schedule.forEach(c => {
                const day = dayNames[c.day] || 'Otro';
                if (!grouped[day]) grouped[day] = [];
                grouped[day].push(c);
            });

            if (schedule.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 13px;">Añade tu primer horario</p>';
                return;
            }

            let html = '';
            Object.entries(grouped).forEach(([day, classes]) => {
                classes.sort((a, b) => (a.startHour || '').localeCompare(b.startHour || ''));
                html += `<h4 style="font-size: 14px; font-weight: 600; margin: 16px 0 8px; color: var(--primary);">${day}</h4>`;
                classes.forEach(c => {
                    html += `
                    <div class="list-item">
                        <div class="list-item-content">
                            <div class="list-item-title">${c.subject || c.name}</div>
                            <div class="list-item-subtitle">${c.startHour} - ${c.endHour} · ${c.room || 'Sin aula'}</div>
                        </div>
                        <button class="btn-icon" style="font-size: 14px;" onclick="UniLifePage.deleteClass('${c.id}')">🗑️</button>
                    </div>`;
                });
            });

            container.innerHTML = html;
        } catch (e) {
            console.error('Error loading schedule:', e);
        }
    },

    showAddClassModal() {
        const html = `
            <div class="form-group">
                <label>Asignatura</label>
                <select id="class-subject"><option value="">Seleccionar</option></select>
            </div>
            <div class="form-group">
                <label>Día de la semana</label>
                <select id="class-day">
                    <option value="1">Lunes</option>
                    <option value="2">Martes</option>
                    <option value="3">Miércoles</option>
                    <option value="4">Jueves</option>
                    <option value="5">Viernes</option>
                </select>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Hora inicio</label>
                    <input type="time" id="class-start">
                </div>
                <div class="form-group">
                    <label>Hora fin</label>
                    <input type="time" id="class-end">
                </div>
            </div>
            <div class="form-group">
                <label>Aula</label>
                <input type="text" id="class-room" placeholder="Ej: Aula 301">
            </div>`;

        Utils.showModal('Nueva Clase', html, async () => {
            const data = {
                subject: document.getElementById('class-subject').value,
                day: parseInt(document.getElementById('class-day').value),
                startHour: document.getElementById('class-start').value,
                endHour: document.getElementById('class-end').value,
                room: document.getElementById('class-room').value
            };

            if (!data.subject || !data.startHour) {
                Utils.showToast('Asignatura y hora son obligatorios', 'error');
                return;
            }

            try {
                await DB.addClass(data);
                Utils.showToast('Clase añadida', 'success');
                this.loadSchedule();
            } catch (e) {
                Utils.showToast('Error al guardar', 'error');
            }
        });

        this.loadSubjectsSelect();
    },

    async loadSubjectsSelect() {
        try {
            const subjects = await DB.getSubjects();
            const select = document.getElementById('class-subject');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar</option>' +
                    subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
            }
        } catch (e) {}
    },

    async deleteClass(id) {
        if (confirm('¿Eliminar esta clase?')) {
            try {
                await DB.deleteClass(id);
                Utils.showToast('Clase eliminada', 'success');
                this.loadSchedule();
            } catch (e) {
                Utils.showToast('Error al eliminar', 'error');
            }
        }
    }
};
