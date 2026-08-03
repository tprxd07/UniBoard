// Tasks Page
const TasksPage = {
    tasks: [],
    filter: 'all',
    collapsedDays: {},

    render() {
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

        <div id="tasks-list"></div>`;
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

    async loadTasks() {
        try {
            this.tasks = await DB.getTasks();
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

        const groups = {};

        tasks.forEach(task => {
            if (!task.dueDate) {
                const key = 'no-date';
                if (!groups[key]) groups[key] = { label: 'Sin fecha', order: 9999, tasks: [] };
                groups[key].tasks.push(task);
                return;
            }

            const due = new Date(task.dueDate + 'T00:00:00');
            const diffDays = Math.round((due - today) / dayMs);

            let label, order;
            if (diffDays < 0) {
                label = 'Atrasadas';
                order = -1;
            } else if (diffDays === 0) {
                label = 'Hoy';
                order = 0;
            } else if (diffDays === 1) {
                label = 'Mañana';
                order = 1;
            } else {
                label = `${dayNames[due.getDay()]}, ${due.getDate()} ${monthNames[due.getMonth()]}`;
                order = diffDays;
            }

            if (!groups[task.dueDate]) groups[task.dueDate] = { label, order, tasks: [] };
            groups[task.dueDate].tasks.push(task);
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
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><h3>Sin tareas</h3><p>Añade tu primera tarea</p></div>';
            return;
        }

        const grouped = this.groupTasksByDay(filtered);

        const priorityColors = { high: '#e74c3c', medium: '#f39c12', low: '#a8e6cf' };
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
                    const color = priorityColors[task.priority] || priorityColors.medium;
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
                            <button class="btn-icon" onclick="TasksPage.deleteTask('${task.id}')">🗑️</button>
                        </div>
                    </div>`;
                });
                html += '</div>';
            }

            html += '</div>';
        });

        container.innerHTML = html;
    },

    toggleGroup(label) {
        this.collapsedDays[label] = !this.collapsedDays[label];
        this.renderList();
    },

    showAddModal(task = null) {
        const isEdit = !!task;
        const html = `
            <div class="form-group">
                <label>Título</label>
                <input type="text" id="task-title" value="${task?.title || ''}" placeholder="Ej: Hacer ejercicios del tema 3">
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
                    <input type="date" id="task-due" value="${task?.dueDate || ''}">
                </div>
                <div class="form-group">
                    <label>Hora de entrega</label>
                    <input type="time" id="task-due-time" value="${task?.dueTime || ''}">
                </div>
            </div>
            <div class="form-group">
                <label>Prioridad</label>
                <select id="task-priority">
                    <option value="low" ${task?.priority === 'low' ? 'selected' : ''}>Baja</option>
                    <option value="medium" ${task?.priority === 'medium' || !task ? 'selected' : ''}>Media</option>
                    <option value="high" ${task?.priority === 'high' ? 'selected' : ''}>Alta</option>
                </select>
            </div>
            <div class="form-group">
                <label>Notas</label>
                <textarea id="task-notes" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-input);color:var(--text);font-family:var(--font-family);">${task?.notes || ''}</textarea>
            </div>`;

        Utils.showModal(isEdit ? 'Editar Tarea' : 'Nueva Tarea', html, async () => {
            const data = {
                title: document.getElementById('task-title').value,
                subject: document.getElementById('task-subject').value,
                dueDate: document.getElementById('task-due').value,
                dueTime: document.getElementById('task-due-time').value,
                priority: document.getElementById('task-priority').value,
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
