const UniLifePage = {
    goals: [],
    activeTab: 'overview',

    render() {
        return `
        <div class="uni-life-tabs">
            <button class="tab active" data-tab="overview">Resumen</button>
            <button class="tab" data-tab="goals">Metas</button>
            <button class="tab" data-tab="schedule">Horario</button>
            <button class="tab" data-tab="progress">Progreso</button>
        </div>
        <div id="uni-life-content"></div>`;
    },

    init() {
        this.activeTab = 'overview';
        document.querySelectorAll('.uni-life-tabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.uni-life-tabs .tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeTab = tab.dataset.tab;
                this.renderTab();
            });
        });
        this.loadData();
    },

    async loadData() {
        try {
            const [goals, subjects, profile] = await Promise.all([
                DB.getGoals(),
                DB.getSubjects(),
                DB.getProfile()
            ]);
            this.goals = goals;
            this._subjects = subjects;
            this._profile = profile;
            this.renderTab();
        } catch (e) {
            console.error('Error loading uni-life data:', e);
            this.renderTab();
        }
    },

    renderTab() {
        const container = document.getElementById('uni-life-content');
        if (!container) return;
        switch (this.activeTab) {
            case 'overview': this.renderOverview(container); break;
            case 'goals': this.renderGoals(container); break;
            case 'schedule': this.renderSchedule(container); break;
            case 'progress': this.renderProgress(container); break;
        }
    },

    // ========== OVERVIEW ==========
    renderOverview(container) {
        const profile = this._profile || {};
        const goalsDone = this.goals.filter(g => g.completed).length;
        const goalsTotal = this.goals.length;
        const subjects = this._subjects || [];
        const saved = JSON.parse(localStorage.getItem('academicProgress') || '{}');
        const pct = saved.totalCredits > 0 ? Math.round((saved.approvedCredits / saved.totalCredits) * 100) : 0;

        let gpaDisplay = '—';
        let gpaColor = 'var(--text-secondary)';
        const withGrades = subjects.filter(s => {
            if (s.gradeTable && s.gradeTable.items && s.gradeTable.items.length > 0) {
                return s.gradeTable.items.some(i => i.grade !== null && i.grade !== undefined && i.grade !== '');
            }
            return s.currentGrade > 0;
        });
        if (withGrades.length > 0) {
            const totalC = withGrades.reduce((s, x) => s + (x.credits || 0), 0);
            const weighted = withGrades.reduce((s, x) => s + (this._getSubjectGrade(x) * (x.credits || 0)), 0);
            if (totalC > 0) { gpaDisplay = (weighted / totalC).toFixed(2); gpaColor = Utils.getGradeColor(weighted / totalC); }
        }

        container.innerHTML = `
        <div class="uni-overview-stats">
            <div class="uni-stat-card">
                <div class="uni-stat-icon">${Icons.graduationCap}</div>
                <div class="uni-stat-value">${saved.approvedCredits || 0}</div>
                <div class="uni-stat-label">Créditos</div>
            </div>
            <div class="uni-stat-card">
                <div class="uni-stat-icon">${Icons.pieChart}</div>
                <div class="uni-stat-value">${pct}%</div>
                <div class="uni-stat-label">Grado</div>
            </div>
            <div class="uni-stat-card">
                <div class="uni-stat-icon">${Icons.trendUp}</div>
                <div class="uni-stat-value" style="color:${gpaColor}">${gpaDisplay}</div>
                <div class="uni-stat-label">Nota media</div>
            </div>
            <div class="uni-stat-card">
                <div class="uni-stat-icon">${Icons.target}</div>
                <div class="uni-stat-value">${goalsDone}/${goalsTotal}</div>
                <div class="uni-stat-label">Metas</div>
            </div>
        </div>

        <div class="grid-2">
            <div class="card">
                <div class="card-header">
                    <span class="card-title">${Icons.graduationCap} Mi Universidad</span>
                </div>
                <div class="form-group">
                    <label>Universidad</label>
                    <input type="text" id="uni-name" placeholder="Ej: Universidad de Madrid" value="${profile.university || ''}">
                </div>
                <div class="form-group">
                    <label>Grado</label>
                    <input type="text" id="uni-degree" placeholder="Ej: Ingeniería Informática" value="${profile.degree || ''}">
                </div>
                <div class="form-group">
                    <label>Curso actual</label>
                    <select id="uni-year">
                        <option value="1" ${profile.year === '1' ? 'selected' : ''}>1º</option>
                        <option value="2" ${profile.year === '2' ? 'selected' : ''}>2º</option>
                        <option value="3" ${profile.year === '3' ? 'selected' : ''}>3º</option>
                        <option value="4" ${profile.year === '4' ? 'selected' : ''}>4º</option>
                        <option value="5" ${profile.year === '5' ? 'selected' : ''}>5º</option>
                    </select>
                </div>
                <button class="btn btn-primary btn-full" onclick="UniLifePage.saveProfileUni()">Guardar</button>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">${Icons.link} Enlaces útiles</span>
                </div>
                <div class="list-item" onclick="window.open('https://www.google.com', '_blank')">
                    <div class="list-item-icon">${Icons.globe}</div>
                    <div class="list-item-content">
                        <div class="list-item-title">Web de la universidad</div>
                    </div>
                </div>
                <div class="list-item" onclick="window.open('https://mail.google.com', '_blank')">
                    <div class="list-item-icon">${Icons.mail}</div>
                    <div class="list-item-content">
                        <div class="list-item-title">Correo universitario</div>
                    </div>
                </div>
                <div class="list-item" onclick="window.open('https://www.google.com', '_blank')">
                    <div class="list-item-icon">${Icons.bookOpen}</div>
                    <div class="list-item-content">
                        <div class="list-item-title">Campus virtual</div>
                    </div>
                </div>
                <div class="list-item" onclick="window.open('https://www.google.com', '_blank')">
                    <div class="list-item-icon">${Icons.library}</div>
                    <div class="list-item-content">
                        <div class="list-item-title">Biblioteca</div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    async saveProfileUni() {
        try {
            await DB.updateProfile({
                university: document.getElementById('uni-name').value,
                degree: document.getElementById('uni-degree').value,
                year: document.getElementById('uni-year').value
            });
            this._profile.university = document.getElementById('uni-name').value;
            this._profile.degree = document.getElementById('uni-degree').value;
            this._profile.year = document.getElementById('uni-year').value;
            Utils.showToast('Perfil actualizado', 'success');
        } catch (e) {
            Utils.showToast('Error al guardar', 'error');
        }
    },

    // ========== GOALS ==========
    renderGoals(container) {
        const goals = this.goals.filter(g => g.type !== 'habit');
        const habits = this.goals.filter(g => g.type === 'habit');

        container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <div class="uni-life-subtabs">
                <button class="tab active" data-stab="metas" onclick="UniLifePage._subTab('metas',this)">Metas</button>
                <button class="tab" data-stab="habits" onclick="UniLifePage._subTab('habits',this)">Hábitos</button>
            </div>
            <button class="btn btn-primary btn-sm" id="add-goal-btn">+ Nuevo</button>
        </div>
        <div id="goals-tab-content"></div>`;

        document.getElementById('add-goal-btn').addEventListener('click', () => this.showAddGoalModal());
        this._showGoalsSubTab('metas', goals, habits);
    },

    _subTab(tab, btn) {
        document.querySelectorAll('.uni-life-subtabs .tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const goals = this.goals.filter(g => g.type !== 'habit');
        const habits = this.goals.filter(g => g.type === 'habit');
        this._showGoalsSubTab(tab, goals, habits);
    },

    _showGoalsSubTab(tab, goals, habits) {
        const container = document.getElementById('goals-tab-content');
        if (!container) return;

        if (tab === 'metas') {
            if (goals.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.target + '</div><h3>Sin metas</h3><p>Crea tu primer objetivo semanal</p></div>';
                return;
            }
            container.innerHTML = goals.map(goal => `
                <div class="goal-card">
                    <div class="goal-header">
                        <span class="goal-title">${goal.title}</span>
                        <div style="display:flex;gap:6px;align-items:center;">
                            <span class="badge badge-${goal.completed ? 'success' : 'primary'}">${goal.completed ? 'Hecho' : `${goal.progress || 0}%`}</span>
                            <button class="btn-icon" onclick="UniLifePage.deleteGoal('${goal.id}')" title="Eliminar">${Icons.trash}</button>
                        </div>
                    </div>
                    ${goal.description ? `<p style="font-size:13px;color:var(--text-secondary);margin-bottom:10px;">${goal.description}</p>` : ''}
                    <div class="progress-bar" style="margin-bottom:10px;">
                        <div class="progress-fill purple" style="width:${goal.progress || 0}%;"></div>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-ghost btn-sm" onclick="UniLifePage.updateGoalProgress('${goal.id}',${Math.min((goal.progress||0)+10,100)})">+10%</button>
                        <button class="btn btn-ghost btn-sm" onclick="UniLifePage.updateGoalProgress('${goal.id}',100)">Completar</button>
                    </div>
                </div>`).join('');
        } else {
            const allHabits = habits.length > 0 ? habits : [
                { id: '_d1', title: 'Beber agua', completedDays: [] },
                { id: '_d2', title: 'Estudiar 2h', completedDays: [] }
            ];
            const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

            container.innerHTML = `
                <div class="card">
                    <div class="card-header"><span class="card-title">Hábitos semanales</span></div>
                    ${allHabits.map(h => `
                        <div class="habit-row">
                            <span class="habit-name">${h.title}</span>
                            <div class="habit-tracker">
                                ${days.map((d, i) => {
                                    const done = h.completedDays?.includes(i);
                                    return `<div class="habit-day ${done ? 'completed' : ''}" onclick="UniLifePage.toggleHabitDay('${h.id}',${i})">${d}</div>`;
                                }).join('')}
                            </div>
                        </div>`).join('')}
                </div>
                <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="UniLifePage.addHabit()">+ Añadir hábito</button>`;
        }
    },

    showAddGoalModal() {
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
            if (!data.title) { Utils.showToast('El título es obligatorio', 'error'); return; }
            try {
                await DB.addGoal(data);
                Utils.showToast('Objetivo creado', 'success');
                this.loadData();
            } catch (e) { Utils.showToast('Error al guardar', 'error'); }
        });
    },

    async updateGoalProgress(id, progress) {
        try {
            await DB.updateGoal(id, { progress, completed: progress >= 100 });
            Utils.showToast(progress >= 100 ? '¡Meta completada!' : 'Progreso actualizado', 'success');
            this.loadData();
        } catch (e) { Utils.showToast('Error', 'error'); }
    },

    async toggleHabitDay(id, dayIndex) {
        const habit = this.goals.find(g => g.id === id);
        if (!habit) return;
        const days = habit.completedDays || [];
        const idx = days.indexOf(dayIndex);
        if (idx > -1) days.splice(idx, 1); else days.push(dayIndex);
        try { await DB.updateGoal(id, { completedDays: days }); this.loadData(); } catch (e) {}
    },

    addHabit() {
        const html = `<div class="form-group"><label>Nombre del hábito</label><input type="text" id="habit-name" placeholder="Ej: Meditar 10 min"></div>`;
        Utils.showModal('Nuevo Hábito', html, async () => {
            const data = { type: 'habit', title: document.getElementById('habit-name').value, progress: 0, completed: false, completedDays: [] };
            if (!data.title) { Utils.showToast('El nombre es obligatorio', 'error'); return; }
            try { await DB.addGoal(data); Utils.showToast('Hábito creado', 'success'); this.loadData(); } catch (e) { Utils.showToast('Error', 'error'); }
        });
    },

    async deleteGoal(id) {
        if (!confirm('¿Eliminar este objetivo?')) return;
        try { await DB.deleteGoal(id); Utils.showToast('Eliminado', 'success'); this.loadData(); } catch (e) { Utils.showToast('Error', 'error'); }
    },

    // ========== SCHEDULE ==========
    async renderSchedule(container) {
        container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3 style="font-size:16px;font-weight:700;">Horario semanal</h3>
            <button class="btn btn-primary btn-sm" id="add-class-btn">+ Clase</button>
        </div>
        <div id="schedule-content"></div>`;

        document.getElementById('add-class-btn').addEventListener('click', () => this.showAddClassModal());

        try {
            const schedule = await DB.getSchedule();
            const sc = document.getElementById('schedule-content');
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const grouped = {};
            schedule.forEach(c => {
                const day = dayNames[c.day] || 'Otro';
                if (!grouped[day]) grouped[day] = [];
                grouped[day].push(c);
            });

            if (schedule.length === 0) {
                sc.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.calendar + '</div><h3>Sin clases</h3><p>Añade tu primer horario</p></div>';
                return;
            }

            let html = '';
            Object.entries(grouped).forEach(([day, classes]) => {
                classes.sort((a, b) => (a.startHour || '').localeCompare(b.startHour || ''));
                html += `<div class="schedule-day"><h4 class="schedule-day-title">${day}</h4>`;
                classes.forEach(c => {
                    html += `
                    <div class="schedule-class">
                        <div class="schedule-class-time">${c.startHour} - ${c.endHour}</div>
                        <div class="schedule-class-info">
                            <span class="schedule-class-name">${c.subject || c.name}</span>
                            <span class="schedule-class-room">${c.room || ''}</span>
                        </div>
                        <button class="btn-icon" onclick="UniLifePage.deleteClass('${c.id}')" title="Eliminar">${Icons.trash}</button>
                    </div>`;
                });
                html += '</div>';
            });
            sc.innerHTML = html;
        } catch (e) {
            document.getElementById('schedule-content').innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">Error al cargar horario</p>';
        }
    },

    showAddClassModal() {
        const html = `
            <div class="form-group"><label>Asignatura</label><select id="class-subject"><option value="">Seleccionar</option></select></div>
            <div class="form-group"><label>Día</label>
                <select id="class-day"><option value="1">Lunes</option><option value="2">Martes</option><option value="3">Miércoles</option><option value="4">Jueves</option><option value="5">Viernes</option></select>
            </div>
            <div class="grid-2">
                <div class="form-group"><label>Hora inicio</label><input type="time" id="class-start"></div>
                <div class="form-group"><label>Hora fin</label><input type="time" id="class-end"></div>
            </div>
            <div class="form-group"><label>Aula</label><input type="text" id="class-room" placeholder="Ej: Aula 301"></div>`;

        Utils.showModal('Nueva Clase', html, async () => {
            const data = {
                subject: document.getElementById('class-subject').value,
                day: parseInt(document.getElementById('class-day').value),
                startHour: document.getElementById('class-start').value,
                endHour: document.getElementById('class-end').value,
                room: document.getElementById('class-room').value
            };
            if (!data.subject || !data.startHour) { Utils.showToast('Asignatura y hora son obligatorios', 'error'); return; }
            try { await DB.addClass(data); Utils.showToast('Clase añadida', 'success'); this.renderSchedule(document.getElementById('uni-life-content')); } catch (e) { Utils.showToast('Error', 'error'); }
        });

        this.loadSubjectsSelect();
    },

    async loadSubjectsSelect() {
        try {
            const subjects = await DB.getSubjects();
            const select = document.getElementById('class-subject');
            if (select) select.innerHTML = '<option value="">Seleccionar</option>' + subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        } catch (e) {}
    },

    async deleteClass(id) {
        if (!confirm('¿Eliminar esta clase?')) return;
        try { await DB.deleteClass(id); Utils.showToast('Eliminada', 'success'); this.renderSchedule(document.getElementById('uni-life-content')); } catch (e) { Utils.showToast('Error', 'error'); }
    },

    // ========== PROGRESS ==========
    renderProgress(container) {
        const saved = JSON.parse(localStorage.getItem('academicProgress') || '{}');
        const subjects = this._subjects || [];
        const withGrades = subjects.filter(s => {
            if (s.gradeTable && s.gradeTable.items && s.gradeTable.items.length > 0) {
                return s.gradeTable.items.some(i => i.grade !== null && i.grade !== undefined && i.grade !== '');
            }
            return s.currentGrade > 0;
        });
        let gpa = '—';
        let gpaColor = 'var(--text-secondary)';
        if (withGrades.length > 0) {
            const totalC = withGrades.reduce((s, x) => s + (x.credits || 0), 0);
            const weighted = withGrades.reduce((s, x) => {
                const grade = UniLifePage._getSubjectGrade(x);
                return s + (grade * (x.credits || 0));
            }, 0);
            if (totalC > 0) { gpa = (weighted / totalC).toFixed(2); gpaColor = Utils.getGradeColor(weighted / totalC); }
        }
        const pct = saved.totalCredits > 0 ? Math.round((saved.approvedCredits / saved.totalCredits) * 100) : 0;

        container.innerHTML = `
        <div class="uni-overview-stats" style="margin-bottom:20px;">
            <div class="uni-stat-card">
                <div class="uni-stat-icon">${Icons.graduationCap}</div>
                <div class="uni-stat-value">${saved.approvedCredits || 0}</div>
                <div class="uni-stat-label">Créditos aprobados</div>
            </div>
            <div class="uni-stat-card">
                <div class="uni-stat-icon">${Icons.pieChart}</div>
                <div class="uni-stat-value">${pct}%</div>
                <div class="uni-stat-label">Grado completado</div>
            </div>
            <div class="uni-stat-card">
                <div class="uni-stat-icon">${Icons.trendUp}</div>
                <div class="uni-stat-value" style="color:${gpaColor}">${gpa}</div>
                <div class="uni-stat-label">Nota media</div>
            </div>
        </div>

        <div class="card" style="margin-bottom:16px;">
            <div class="card-header"><span class="card-title">Configurar créditos</span></div>
            <div class="grid-2">
                <div class="form-group"><label>Total créditos del grado</label><input type="number" id="total-credits" placeholder="240" value="${saved.totalCredits || ''}"></div>
                <div class="form-group"><label>Créditos aprobados</label><input type="number" id="approved-credits" placeholder="60" value="${saved.approvedCredits || ''}"></div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="UniLifePage.saveCredits()">Guardar</button>
        </div>

        <div class="card">
            <div class="card-header"><span class="card-title">Progreso por asignatura</span></div>
            <div id="subject-progress-list">
                ${subjects.length === 0 ? '<p style="text-align:center;color:var(--text-secondary);padding:20px;font-size:13px;">Añade asignaturas en Asignaturas</p>' :
                subjects.map(s => {
                    const grade = this._getSubjectGrade(s);
                    const pctS = grade * 10;
                    const color = grade >= 9 ? 'green' : grade >= 7 ? 'blue' : grade >= 5 ? 'orange' : 'red';
                    return `
                    <div class="subject-progress-row">
                        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                            <span style="font-size:14px;font-weight:600;">${s.name}</span>
                            <span style="font-size:14px;font-weight:700;color:${Utils.getGradeColor(grade)};">${grade > 0 ? grade.toFixed(2) : '—'}</span>
                        </div>
                        <div class="progress-bar"><div class="progress-fill ${color}" style="width:${pctS}%;"></div></div>
                        <div style="display:flex;justify-content:space-between;margin-top:4px;">
                            <span style="font-size:11px;color:var(--text-secondary);">${s.credits || 0} créditos</span>
                            <span style="font-size:11px;color:var(--text-secondary);">${Math.round(pctS)}%</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    },

    saveCredits() {
        const total = parseInt(document.getElementById('total-credits').value) || 0;
        const approved = parseInt(document.getElementById('approved-credits').value) || 0;
        localStorage.setItem('academicProgress', JSON.stringify({ totalCredits: total, approvedCredits: approved }));
        Utils.showToast('Progreso guardado', 'success');
        this.renderProgress(document.getElementById('uni-life-content'));
    },

    _getSubjectGrade(subject) {
        if (subject.gradeTable && subject.gradeTable.items && subject.gradeTable.items.length > 0) {
            return SubjectsPage.calculateGrade(subject);
        }
        return subject.currentGrade || 0;
    }
};
