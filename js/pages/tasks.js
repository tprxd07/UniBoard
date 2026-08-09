// Tasks Page
const TasksPage = {
    tasks: [],
    filter: 'all',
    collapsedDays: {},

    render() {
        const skel = Array.from({length: 4}, () => `
            <div class="skeleton-task-card">
                <div class="skeleton skeleton-circle"></div>
                <div style="flex:1;">
                    <div class="skeleton skeleton-text-sm" style="width:30%;"></div>
                    <div class="skeleton skeleton-text" style="width:75%;"></div>
                </div>
                <div class="skeleton skeleton-badge"></div>
            </div>`).join('');

        return `
        <div class="section-header">
            <span class="section-title">Tareas</span>
            <button class="btn btn-primary btn-sm" id="add-task-btn">+ Añadir</button>
        </div>

        <div class="tabs" style="max-width: 500px;">
            <button class="tab active" data-filter="all">Todas</button>
            <button class="tab" data-filter="pending">Pendientes</button>
            <button class="tab" data-filter="completed">Completadas</button>
        </div>

        <div id="tasks-list">${skel}</div>`;
    },

    init() {
        document.getElementById('add-task-btn').addEventListener('click', () => this.showAddModal());

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.filter = tab.dataset.filter;
                this.renderList();
            });
        });

        this.loadTasks();
    },

    subjects: {},

    async loadTasks() {
        try {
            const [tasks, subjects] = await Promise.all([DB.getTasks(), DB.getSubjects()]);
            this.tasks = tasks;
            this.subjects = {};
            subjects.forEach(s => { this.subjects[s.name] = s.color || '#6C5CE7'; });
            this.renderList();
        } catch (e) {
            console.error('Error loading tasks:', e);
        }
    },

    groupTasksByDay(tasks) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayMs = 1000 * 60 * 60 * 24;
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const monthNames = ['de Enero', 'de Febrero', 'de Marzo', 'de Abril', 'de Mayo', 'de Junio', 'de Julio', 'de Agosto', 'de Septiembre', 'de Octubre', 'de Noviembre', 'de Diciembre'];

        // Expand recurring tasks for next 30 days
        const expanded = [];
        const maxDays = 30;

        tasks.forEach(task => {
            if (!task.dueDate || task.repeat) {
                if (task.repeat) {
                    for (let i = 0; i < maxDays; i++) {
                        const d = new Date(today);
                        d.setDate(d.getDate() + i);
                        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        const taskDate = new Date(task.dueDate + 'T00:00:00');
                        const diffFromStart = Math.round((d - taskDate) / dayMs);
                        if (diffFromStart < 0) continue;

                        let match = false;
                        if (task.repeat === 'daily') match = true;
                        else if (task.repeat === 'weekly') match = d.getDay() === taskDate.getDay();
                        else if (task.repeat === 'monthly') match = d.getDate() === taskDate.getDate();
                        else if (task.repeat === 'custom' && task.repeatDays) match = task.repeatDays.includes(d.getDay());

                        if (match) {
                            expanded.push({ ...task, _displayDate: dateStr });
                        }
                    }
                } else {
                    expanded.push(task);
                }
            } else {
                expanded.push(task);
            }
        });

        const groups = {};
        expanded.forEach(task => {
            const dateStr = task._displayDate || task.dueDate;
            if (!dateStr) {
                const key = 'no-date';
                if (!groups[key]) groups[key] = { label: 'Sin fecha', order: 9999, tasks: [] };
                groups[key].tasks.push(task);
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
                    if ((pOrder[a.priority] || 1) !== (pOrder[b.priority] || 1)) {
                        return (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1);
                    }
                    return (a.subject || 'zzz').localeCompare(b.subject || 'zzz');
                });
                return g;
            })
            .sort((a, b) => a.order - b.order);
    },

    renderList() {
        const container = document.getElementById('tasks-list');
        let filtered = [...this.tasks];

        if (this.filter === 'pending') filtered = filtered.filter(t => !t.completed);
        if (this.filter === 'completed') filtered = filtered.filter(t => t.completed);

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.check + '</div><h3>Sin tareas</h3><p>Añade tu primera tarea</p></div>';
            return;
        }

        const grouped = this.groupTasksByDay(filtered);

        const priorityLabels = { high: 'Alta', medium: 'Media', low: 'Baja' };

        let html = '';
        grouped.forEach(group => {
            const isCollapsed = this.collapsedDays[group.label];
            const arrowSvg = isCollapsed
                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>';

            html += `<div class="task-group">
                <div class="task-group-header" onclick="TasksPage.toggleGroup('${group.label}')">
                    <span class="task-group-label">${group.label}</span>
                    <span class="task-group-count">${group.tasks.length}</span>
                    <span class="task-group-arrow">${arrowSvg}</span>
                </div>`;

            if (!isCollapsed) {
                html += '<div class="task-group-items">';
                group.tasks.forEach(task => {
                    const color = this.subjects[task.subject] || '#6C5CE7';
                    const completedStyle = task.completed ? 'opacity: 0.5;' : '';
                    const lineStyle = task.completed ? 'text-decoration: line-through;' : '';
                    const timeStr = task.dueTime || '';

                    html += `
                    <div class="task-card" style="${completedStyle} border-left: 4px solid ${color};">
                        <div class="task-card-top">
                            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="TasksPage.toggleTask('${task.id}')">
                                ${task.completed ? '✓' : ''}
                            </div>
                            <div class="task-card-info">
                                <div class="task-card-subject" style="color: ${color};">${task.subject || 'Sin asignatura'}</div>
                                <div class="task-card-title" style="${lineStyle}">${task.title}</div>
                                ${timeStr ? `<div class="task-card-time">Hora de entrega: ${timeStr}</div>` : ''}
                            </div>
                        </div>
                        <div class="task-card-actions">
                            <button class="btn-icon" onclick="TasksPage.showEditModal('${task.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                            <button class="btn-icon" onclick="TasksPage.deleteTask('${task.id}')">${Icons.trash}</button>
                        </div>
                    </div>`;
                });
                html += '</div>';
            }

            html += '</div>';
        });

        container.innerHTML = Utils.sanitize(html);
    },

    toggleGroup(label) {
        this.collapsedDays[label] = !this.collapsedDays[label];
        this.renderList();
    },

    showAddModal(task = null) {
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
                <input type="text" id="task-title" value="${ev.title || ''}" placeholder="Ej: Hacer ejercicios del tema 3" maxlength="100">
            </div>
            <div class="form-group">
                <label>Asignatura</label>
                <select id="task-subject">
                    <option value="">Sin asignatura</option>
                </select>
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
                <select id="task-repeat">
                    ${repeatSelect}
                </select>
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
                ? Array.from(document.querySelectorAll('.repeat-day:checked')).map(cb => parseInt(cb.value))
                : [];

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

            if (!data.title) {
                Utils.showToast('El título es obligatorio', 'error');
                return;
            }

            try {
                if (isEdit) {
                    await DB.updateTask(task.id, data);
                    Utils.showToast('Tarea actualizada', 'success');
                } else {
                    await DB.addTask(data);
                    Utils.showToast('Tarea creada', 'success');
                }
                this.loadTasks();
            } catch (e) {
                Utils.showToast('Error al guardar', 'error');
            }
        });

        this.loadSubjectsSelect(task?.subject);

        // Toggle day checks visibility
        const repeatSelectEl = document.getElementById('task-repeat');
        const dayChecksGroup = document.getElementById('day-checks-group');
        const toggleDayChecks = () => {
            dayChecksGroup.classList.toggle('hidden', repeatSelectEl.value !== 'custom');
        };
        repeatSelectEl.addEventListener('change', toggleDayChecks);
        toggleDayChecks();
    },

    async loadSubjectsSelect(selected = '') {
        try {
            const subjects = await DB.getSubjects();
            const select = document.getElementById('task-subject');
            select.innerHTML = '<option value="">Sin asignatura</option>' +
                subjects.map(s => `<option value="${s.name}" ${s.name === selected ? 'selected' : ''}>${s.name}</option>`).join('');
        } catch (e) {}
    },

    showEditModal(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) this.showAddModal(task);
    },

    async toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        try {
            await DB.updateTask(id, { completed: !task.completed });
            this.loadTasks();
        } catch (e) {
            Utils.showToast('Error al actualizar', 'error');
        }
    },

    async deleteTask(id) {
        if (confirm('¿Eliminar esta tarea?')) {
            try {
                await DB.deleteTask(id);
                Utils.showToast('Tarea eliminada', 'success');
                this.loadTasks();
            } catch (e) {
                Utils.showToast('Error al eliminar', 'error');
            }
        }
    }
};
