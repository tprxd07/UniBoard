const ActivitiesPage = {
    tasks: [],
    exams: [],
    subjects: [],
    filter: 'all',
    collapsedDays: {},
    activeTab: 'tasks',

    render() {
        const skeletonTasks = Array.from({length: 4}, () => `
            <div class="skeleton-task-card">
                <div class="skeleton skeleton-circle"></div>
                <div style="flex:1;">
                    <div class="skeleton skeleton-text-sm" style="width:30%;"></div>
                    <div class="skeleton skeleton-text" style="width:75%;"></div>
                    <div class="skeleton skeleton-text-sm" style="width:45%;"></div>
                </div>
                <div class="skeleton skeleton-badge"></div>
            </div>`).join('');

        return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <div class="tabs" style="max-width: 400px;">
                <button class="tab active" data-tab="tasks" onclick="ActivitiesPage.switchTab('tasks')">Tareas</button>
                <button class="tab" data-tab="exams" onclick="ActivitiesPage.switchTab('exams')">Exámenes</button>
            </div>
            <button class="btn btn-primary btn-sm" id="add-activity-btn">+ Añadir</button>
        </div>

        <div id="tasks-tab">
            <div class="tabs" style="max-width: 400px; margin-bottom: 12px;">
                <button class="tab active" data-filter="all" onclick="ActivitiesPage.setFilter('all', this)">Todas</button>
                <button class="tab" data-filter="pending" onclick="ActivitiesPage.setFilter('pending', this)">Pendientes</button>
                <button class="tab" data-filter="completed" onclick="ActivitiesPage.setFilter('completed', this)">Completadas</button>
            </div>
            <div id="tasks-list">${skeletonTasks}</div>
        </div>

        <div id="exams-tab" style="display:none;">
            <div id="exams-list">${skeletonTasks}</div>
        </div>`;
    },

    async init() {
        this.activeTab = 'tasks';
        this.filter = 'all';
        this.collapsedDays = {};
        document.getElementById('add-activity-btn').addEventListener('click', () => {
            if (this.activeTab === 'tasks') this.showAddTaskModal();
            else this.showAddExamModal();
        });
        await this.loadData();
    },

    switchTab(tab) {
        this.activeTab = tab;
        const tabsContainer = document.querySelector('#page-content > div > .tabs');
        if (tabsContainer) {
            tabsContainer.querySelectorAll('.tab').forEach(t => {
                t.classList.toggle('active', t.dataset.tab === tab);
            });
        }
        document.getElementById('tasks-tab').style.display = tab === 'tasks' ? '' : 'none';
        document.getElementById('exams-tab').style.display = tab === 'exams' ? '' : 'none';
        const addBtn = document.getElementById('add-activity-btn');
        if (addBtn) addBtn.textContent = tab === 'tasks' ? '+ Añadir tarea' : '+ Añadir examen';
    },

    setFilter(filter, el) {
        this.filter = filter;
        document.querySelectorAll('#tasks-tab .tab').forEach(t => t.classList.remove('active'));
        if (el) el.classList.add('active');
        this.renderTasks();
    },

    async loadData() {
        try {
            const [tasks, exams, subjects] = await Promise.all([
                DB.getTasks(), DB.getExams(), DB.getSubjects()
            ]);
            this.tasks = tasks;
            this.exams = exams;
            this.subjects = subjects;
            this.renderTasks();
            this.renderExams();
        } catch (e) {
            console.error('Error loading activities:', e);
        }
    },

    getSubjectColor(name) {
        const s = this.subjects.find(s => s.name === name);
        return s ? s.color || '#6C5CE7' : '#6C5CE7';
    },

    // ============ TASKS ============
    renderTasks() {
        const container = document.getElementById('tasks-list');
        let filtered = [...this.tasks];
        if (this.filter === 'pending') filtered = filtered.filter(t => !t.completed);
        if (this.filter === 'completed') filtered = filtered.filter(t => t.completed);

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.check + '</div><h3>Sin tareas</h3><p>Añade tu primera tarea</p></div>';
            return;
        }

        const grouped = this.groupTasksByDay(filtered);
        let html = '';
        grouped.forEach(group => {
            const isCollapsed = this.collapsedDays[group.label];
            const arrowSvg = isCollapsed
                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>';

            html += `<div class="task-group">
                <div class="task-group-header" onclick="ActivitiesPage.toggleGroup('${group.label}')">
                    <span class="task-group-label">${group.label}</span>
                    <span class="task-group-count">${group.tasks.length}</span>
                    <span class="task-group-arrow">${arrowSvg}</span>
                </div>`;

            if (!isCollapsed) {
                html += '<div class="task-group-items">';
                group.tasks.forEach(task => {
                    const color = this.getSubjectColor(task.subject);
                    const completedStyle = task.completed ? 'opacity: 0.5;' : '';
                    const lineStyle = task.completed ? 'text-decoration: line-through;' : '';
                    const timeStr = task.dueTime || '';
                    const priorityColors = { low: '#00b894', medium: '#fdcb6e', high: '#e17055' };
                    const priorityDot = task.priority ? `<span class="priority-dot" style="background:${priorityColors[task.priority] || priorityColors.medium};" title="${task.priority === 'low' ? 'Baja' : task.priority === 'high' ? 'Alta' : 'Media'}"></span>` : '';
                    html += `
                    <div class="task-card" style="${completedStyle} border-left: 4px solid ${color};">
                        <div class="task-card-top">
                            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="ActivitiesPage.toggleTask('${task.id}')">${task.completed ? '✓' : ''}</div>
                            <div class="task-card-info">
                                <div class="task-card-subject" style="color: ${color};">${task.subject || 'Sin asignatura'}</div>
                                <div class="task-card-title" style="${lineStyle}">${priorityDot}${task.title}</div>
                                ${timeStr ? `<div class="task-card-time">Hora de entrega: ${timeStr}</div>` : ''}
                            </div>
                        </div>
                        <div class="task-card-actions">
                            <button class="btn-icon" onclick="ActivitiesPage.showEditTaskModal('${task.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                            <button class="btn-icon" onclick="ActivitiesPage.deleteTask('${task.id}')">${Icons.trash}</button>
                        </div>
                    </div>`;
                });
                html += '</div>';
            }
            html += '</div>';
        });
        container.innerHTML = Utils.sanitize(html);
    },

    groupTasksByDay(tasks) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayMs = 1000 * 60 * 60 * 24;
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const monthNames = ['de Enero', 'de Febrero', 'de Marzo', 'de Abril', 'de Mayo', 'de Junio', 'de Julio', 'de Agosto', 'de Septiembre', 'de Octubre', 'de Noviembre', 'de Diciembre'];

        const expanded = [];
        const maxDays = 30;
        tasks.forEach(task => {
            if (task.repeat) {
                for (let i = 0; i < maxDays; i++) {
                    const d = new Date(today);
                    d.setDate(d.getDate() + i);
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    const taskDate = new Date(task.dueDate + 'T00:00:00');
                    const diffFromStart = Math.round((d - taskDate) / dayMs);
                    if (diffFromStart < 0) continue;
                    let match = false;
                    if (task.repeat === 'daily') match = true;
                    else if (task.repeat === 'weekly') match = d.getDay() === taskDate.getDay();
                    else if (task.repeat === 'monthly') match = d.getDate() === taskDate.getDate();
                    else if (task.repeat === 'custom' && task.repeatDays) match = task.repeatDays.includes(d.getDay());
                    if (match) expanded.push({ ...task, _displayDate: dateStr });
                }
            } else {
                expanded.push(task);
            }
        });

        const groups = {};
        expanded.forEach(task => {
            const dateStr = task._displayDate || task.dueDate;
            if (!dateStr) {
                if (!groups['no-date']) groups['no-date'] = { label: 'Sin fecha', order: 9999, tasks: [] };
                groups['no-date'].tasks.push(task);
                return;
            }
            const due = new Date(dateStr + 'T00:00:00');
            const diffDays = Math.round((due - today) / dayMs);
            let label, order;
            if (diffDays < 0) { label = 'Atrasadas'; order = -1; }
            else if (diffDays === 0) { label = 'Hoy'; order = 0; }
            else if (diffDays === 1) { label = 'Mañana'; order = 1; }
            else { label = `${dayNames[due.getDay()]}, ${due.getDate()} ${monthNames[due.getMonth()]}`; order = diffDays; }
            if (!groups[dateStr]) groups[dateStr] = { label, order, tasks: [] };
            groups[dateStr].tasks.push(task);
        });

        const pOrder = { high: 0, medium: 1, low: 2 };
        return Object.entries(groups)
            .map(([key, g]) => {
                g.tasks.sort((a, b) => {
                    if ((pOrder[a.priority] || 1) !== (pOrder[b.priority] || 1)) return (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1);
                    return (a.subject || 'zzz').localeCompare(b.subject || 'zzz');
                });
                return g;
            })
            .sort((a, b) => a.order - b.order);
    },

    toggleGroup(label) {
        this.collapsedDays[label] = !this.collapsedDays[label];
        this.renderTasks();
    },

    getSubjectsSelect(selected = '') {
        return '<option value="">Sin asignatura</option>' +
            this.subjects.map(s => `<option value="${s.name}" ${s.name === selected ? 'selected' : ''}>${s.name}</option>`).join('');
    },

    showAddTaskModal(task = null) {
        const isEdit = !!task;
        const ev = task || {};
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayChecks = [1, 2, 3, 4, 5, 6, 0].map(d => {
            const checked = ev.repeatDays && ev.repeatDays.includes(d) ? 'checked' : '';
            return `<label class="day-check"><input type="checkbox" value="${d}" class="repeat-day" ${checked}><span>${dayNames[d]}</span></label>`;
        }).join('');
        const repeatOptions = ['none', 'daily', 'weekly', 'monthly', 'custom'];
        const repeatLabels = { none: 'No repetir', daily: 'Diariamente', weekly: 'Semanalmente', monthly: 'Mensualmente', custom: 'Personalizado' };
        const repeatSelect = repeatOptions.map(r => `<option value="${r}" ${ev.repeat === r ? 'selected' : ''}>${repeatLabels[r]}</option>`).join('');

        const html = `
            <div class="form-group">
                <label>Título</label>
                <input type="text" id="task-title" value="${ev.title || ''}" placeholder="Ej: Hacer ejercicios del tema 3">
            </div>
            <div class="form-group">
                <label>Asignatura</label>
                <select id="task-subject">${this.getSubjectsSelect(ev.subject || '')}</select>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Fecha límite</label>
                    <input type="date" id="task-due" value="${ev.dueDate || ''}">
                </div>
                <div class="form-group">
                    <label>Hora de entrega</label>
                    <input type="time" id="task-due-time" value="${ev.dueTime || ''}">
                </div>
            </div>
            <div class="form-group">
                <label>Prioridad</label>
                <select id="task-priority">
                    <option value="low" ${ev.priority === 'low' ? 'selected' : ''}>Baja</option>
                    <option value="medium" ${ev.priority === 'medium' || !task ? 'selected' : ''}>Media</option>
                    <option value="high" ${ev.priority === 'high' ? 'selected' : ''}>Alta</option>
                </select>
            </div>
            <div class="form-group">
                <label>Repetir</label>
                <select id="task-repeat">${repeatSelect}</select>
            </div>
            <div class="form-group day-checks-container hidden" id="day-checks-group">
                <label>Días de la semana</label>
                <div class="day-checks">${dayChecks}</div>
            </div>
            <div class="form-group">
                <label>Notas</label>
                <textarea id="task-notes" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-input);color:var(--text);font-family:var(--font-family);">${ev.notes || ''}</textarea>
            </div>`;

        Utils.showModal(isEdit ? 'Editar Tarea' : 'Nueva Tarea', html, async () => {
            const repeat = document.getElementById('task-repeat').value;
            const repeatDays = repeat === 'custom'
                ? Array.from(document.querySelectorAll('.repeat-day:checked')).map(cb => parseInt(cb.value)) : [];
            const data = {
                title: document.getElementById('task-title').value,
                subject: document.getElementById('task-subject').value,
                dueDate: document.getElementById('task-due').value,
                dueTime: document.getElementById('task-due-time').value,
                priority: document.getElementById('task-priority').value,
                repeat: repeat === 'none' ? null : repeat,
                repeatDays: repeatDays.length > 0 ? repeatDays : null,
                notes: document.getElementById('task-notes').value
            };
            if (!data.title) { Utils.showToast('El título es obligatorio', 'error'); return; }
            try {
                if (isEdit) { await DB.updateTask(task.id, data); Utils.showToast('Tarea actualizada', 'success'); }
                else { await DB.addTask(data); Utils.showToast('Tarea creada', 'success'); }
                this.loadData();
            } catch (e) { Utils.showToast('Error al guardar', 'error'); }
        });

        const repeatSel = document.getElementById('task-repeat');
        const dayChecksGroup = document.getElementById('day-checks-group');
        const toggleDayChecks = () => { dayChecksGroup.classList.toggle('hidden', repeatSel.value !== 'custom'); };
        repeatSel.addEventListener('change', toggleDayChecks);
        toggleDayChecks();
    },

    showEditTaskModal(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) this.showAddTaskModal(task);
    },

    async toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        try {
            await DB.updateTask(id, { completed: !task.completed });
            this.loadData();
        } catch (e) { Utils.showToast('Error al actualizar', 'error'); }
    },

    async deleteTask(id) {
        if (!confirm('¿Eliminar esta tarea?')) return;
        try {
            await DB.deleteTask(id);
            Utils.showToast('Tarea eliminada', 'success');
            this.loadData();
        } catch (e) { Utils.showToast('Error al eliminar', 'error'); }
    },

    // ============ EXAMS ============
    renderExams() {
        const container = document.getElementById('exams-list');
        if (this.exams.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.edit + '</div><h3>Sin exámenes</h3><p>Añade tu primer examen</p></div>';
            return;
        }
        const sorted = [...this.exams].sort((a, b) => new Date(a.date) - new Date(b.date));
        container.innerHTML = Utils.sanitize(sorted.map(exam => {
            const days = Utils.daysUntil(exam.date);
            const isPast = days < 0;
            const color = this.getSubjectColor(exam.subject);
            return `
            <div class="task-card" style="${isPast ? 'opacity: 0.5;' : ''} border-left: 4px solid ${color};">
                <div class="task-card-top">
                    <div style="font-size:20px;flex-shrink:0;">${Icons.edit}</div>
                    <div class="task-card-info">
                        <div class="task-card-subject" style="color: ${color};">${exam.subject || ''}</div>
                        <div class="task-card-title">${exam.topics || exam.name || 'Examen'}</div>
                        <div class="task-card-time">${Utils.formatDate(exam.date, 'long')} ${exam.startTime ? '· ' + exam.startTime + (exam.endTime ? ' - ' + exam.endTime : '') : ''} · ${exam.room || 'Sin aula'}</div>
                        ${exam.description ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${exam.description}</div>` : ''}
                    </div>
                </div>
                <div class="task-card-actions">
                    ${!isPast ? `<span class="badge badge-primary" style="font-size:11px;">${days}d</span>` : '<span class="badge" style="font-size:11px;background:var(--border);">Finalizado</span>'}
                    <span style="font-size:13px;font-weight:700;color:${exam.grade != null ? Utils.getGradeColor(exam.grade) : 'var(--text-secondary)'};">${exam.grade != null ? exam.grade.toFixed(2) : '-.--'}</span>
                    <button class="btn-icon" onclick="ActivitiesPage.showEditExamModal('${exam.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                    <button class="btn-icon" onclick="ActivitiesPage.deleteExam('${exam.id}')">${Icons.trash}</button>
                </div>
            </div>`;
        }).join(''));
    },

    showAddExamModal(exam = null) {
        const isEdit = !!exam;
        const html = `
            <div class="form-group">
                <label>Asignatura</label>
                <select id="exam-subject">${this.getSubjectsSelect(exam?.subject || '')}</select>
            </div>
            <div class="form-group">
                <label>Temas</label>
                <input type="text" id="exam-topics" value="${exam?.topics || ''}" placeholder="Ej: Temas 1-3">
            </div>
            <div class="form-group">
                <label>Fecha</label>
                <input type="date" id="exam-date" value="${exam?.date || ''}">
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Hora inicio</label>
                    <input type="time" id="exam-start-time" value="${exam?.startTime || ''}">
                </div>
                <div class="form-group">
                    <label>Hora fin</label>
                    <input type="time" id="exam-end-time" value="${exam?.endTime || ''}">
                </div>
            </div>
            <div class="form-group">
                <label>Aula</label>
                <input type="text" id="exam-room" value="${exam?.room || ''}" placeholder="Ej: Aula 201">
            </div>
            <div class="form-group">
                <label>Descripción (opcional)</label>
                <textarea id="exam-description" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-input);color:var(--text);font-family:var(--font-family);">${exam?.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Nota</label>
                <input type="number" id="exam-grade" value="${exam?.grade != null ? exam.grade : ''}" placeholder="-.--" min="0" max="10" step="0.1">
            </div>`;

        Utils.showModal(isEdit ? 'Editar Examen' : 'Nuevo Examen', html, async () => {
            const gradeVal = document.getElementById('exam-grade').value;
            const data = {
                subject: document.getElementById('exam-subject').value,
                topics: document.getElementById('exam-topics').value,
                date: document.getElementById('exam-date').value,
                startTime: document.getElementById('exam-start-time').value,
                endTime: document.getElementById('exam-end-time').value,
                room: document.getElementById('exam-room').value,
                description: document.getElementById('exam-description').value,
                grade: gradeVal !== '' ? parseFloat(gradeVal) : null
            };
            if (!data.subject || !data.date) { Utils.showToast('Asignatura y fecha son obligatorios', 'error'); return; }
            try {
                if (isEdit) { await DB.updateExam(exam.id, data); Utils.showToast('Examen actualizado', 'success'); }
                else { await DB.addExam(data); Utils.showToast('Examen añadido', 'success'); }
                if (data.grade != null) {
                    await this.syncGradeToSubject(data.subject, data.grade);
                }
                this.loadData();
            } catch (e) { Utils.showToast('Error al guardar', 'error'); }
        });
    },

    showEditExamModal(id) {
        const exam = this.exams.find(e => e.id === id);
        if (exam) this.showAddExamModal(exam);
    },

    async deleteExam(id) {
        if (!confirm('¿Eliminar este examen?')) return;
        try {
            await DB.deleteExam(id);
            Utils.showToast('Examen eliminado', 'success');
            this.loadData();
        } catch (e) { Utils.showToast('Error al eliminar', 'error'); }
    },

    async syncGradeToSubject(subjectName, grade) {
        try {
            const subjects = await DB.getSubjects();
            const subject = subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
            if (!subject) return;
            const gt = subject.gradeTable || { items: [], usePeriods: false, periodWeights: [] };
            if (!gt.items) gt.items = [];
            const existingIdx = gt.items.findIndex(i => i.name === subjectName && i.type === 'exam');
            if (existingIdx >= 0) {
                gt.items[existingIdx].grade = grade;
            } else {
                gt.items.push({ name: subjectName, type: 'exam', weight: 0, grade: grade, period: null });
            }
            await DB.updateSubject(subject.id, { gradeTable: gt });
        } catch (e) {
            console.error('Error syncing grade to subject:', e);
        }
    }
};
