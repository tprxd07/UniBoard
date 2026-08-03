// Tasks Page
const TasksPage = {
    tasks: [],
    filter: 'all',

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

    renderList() {
        const container = document.getElementById('tasks-list');
        let filtered = [...this.tasks];

        if (this.filter === 'pending') filtered = filtered.filter(t => !t.completed);
        if (this.filter === 'completed') filtered = filtered.filter(t => t.completed);

        // Sort: incomplete first, then by priority, then by due date
        filtered.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            const pOrder = { high: 0, medium: 1, low: 2 };
            if (pOrder[a.priority] !== pOrder[b.priority]) return (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1);
            return new Date(a.dueDate || '2099-01-01') - new Date(b.dueDate || '2099-01-01');
        });

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><h3>Sin tareas</h3><p>Añade tu primera tarea</p></div>';
            return;
        }

        container.innerHTML = filtered.map(task => {
            const priorityClass = task.priority === 'high' ? 'priority-high' : task.priority === 'medium' ? 'priority-medium' : 'priority-low';
            const daysLeft = task.dueDate ? Utils.daysUntil(task.dueDate) : null;
            const overdue = daysLeft !== null && daysLeft < 0 && !task.completed;

            return `
            <div class="task-item ${priorityClass}" style="${task.completed ? 'opacity: 0.6;' : ''} ${overdue ? 'border-color: var(--danger);' : ''}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="TasksPage.toggleTask('${task.id}')">
                    ${task.completed ? '✓' : ''}
                </div>
                <div class="task-content">
                    <div class="task-title" style="${task.completed ? 'text-decoration: line-through;' : ''}">${task.title}</div>
                    <div class="task-meta">
                        ${task.subject ? `<span>📚 ${task.subject}</span>` : ''}
                        ${task.dueDate ? `<span style="${overdue ? 'color: var(--danger); font-weight: 600;' : ''}">📅 ${Utils.formatDate(task.dueDate)}${daysLeft !== null && daysLeft >= 0 ? ' (' + daysLeft + 'd)' : ''}</span>` : ''}
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="btn-icon" style="font-size: 14px;" onclick="TasksPage.showEditModal('${task.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                    <button class="btn-icon" style="font-size: 14px;" onclick="TasksPage.deleteTask('${task.id}')">🗑️</button>
                </div>
            </div>`;
        }).join('');
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
                    <label>Prioridad</label>
                    <select id="task-priority">
                        <option value="low" ${task?.priority === 'low' ? 'selected' : ''}>Baja</option>
                        <option value="medium" ${task?.priority === 'medium' || !task ? 'selected' : ''}>Media</option>
                        <option value="high" ${task?.priority === 'high' ? 'selected' : ''}>Alta</option>
                    </select>
                </div>
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

        // Load subjects into select
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
