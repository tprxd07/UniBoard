// Dashboard Page
const DashboardPage = {
    userName: '',

    render() {
        const name = this.userName;
        const greeting = Utils.getGreeting();
        return `
        <div class="dashboard-greeting">
            <h2>${greeting}, ${name}</h2>
            <p>Aquí tienes tu resumen de la semana</p>
        </div>

        <div class="dashboard-events-section">
            <div class="card" style="margin-bottom: 16px;">
                <div class="card-header">
                    <span class="card-title">✅ Tareas de hoy</span>
                    <a href="#" onclick="App.loadPage('tasks'); return false;" class="badge badge-primary">Ver todas</a>
                </div>
                <div id="dashboard-tasks"></div>
            </div>

            <div class="card dashboard-events-scroll">
                <div class="card-header">
                    <span class="card-title">📌 Eventos de la semana</span>
                </div>
                <div id="dashboard-events"></div>
            </div>
        </div>`;
    },

    async init() {
        try {
            const profile = await DB.getProfile();
            this.userName = profile.name || Auth.currentUser?.displayName || '';
        } catch (e) {
            this.userName = Auth.currentUser?.displayName || '';
        }
        // Re-render with name
        document.getElementById('page-content').innerHTML = this.render();
        this.loadEvents();
        this.loadTodayTasks();
    },

    async loadEvents() {
        try {
            const [events, groups] = await Promise.all([DB.getEvents(), DB.getGroups()]);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            const dayMs = 1000 * 60 * 60 * 24;

            // Expand recurring events for the next 7 days
            const expanded = [];
            events.forEach(event => {
                for (let d = new Date(today); d < nextWeek; d.setDate(d.getDate() + 1)) {
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    const eventDate = new Date(event.date);
                    const diffFromStart = Math.round((d - eventDate) / dayMs);
                    if (diffFromStart < 0) continue;

                    let match = false;
                    if (event.repeat === 'daily') match = true;
                    else if (event.repeat === 'weekly') match = d.getDay() === eventDate.getDay();
                    else if (event.repeat === 'monthly') match = d.getDate() === eventDate.getDate();
                    else if (event.repeat === 'yearly') match = d.getDate() === eventDate.getDate() && d.getMonth() === eventDate.getMonth();
                    else if (event.repeat === 'custom' && event.repeatDays) match = event.repeatDays.includes(d.getDay());
                    else match = dateStr === event.date;

                    if (match) {
                        expanded.push({ ...event, _displayDate: dateStr });
                    }
                }
            });

            const container = document.getElementById('dashboard-events');
            if (!container) return;

            if (expanded.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 13px;">No hay eventos próximos</p>';
                return;
            }

            const dayLabels = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
            const todayLabel = 'Hoy';
            const tomorrowLabel = 'Mañana';

            let html = '';
            let lastDate = '';

            expanded.forEach(event => {
                const dateKey = event._displayDate;
                if (dateKey === lastDate) return;

                const d = new Date(dateKey + 'T00:00:00');
                const diffDays = Math.round((d - today) / dayMs);
                let label;
                if (diffDays === 0) label = todayLabel;
                else if (diffDays === 1) label = tomorrowLabel;
                else label = dayLabels[d.getDay()];

                html += `<div class="event-date-label">${label} · ${d.getDate()} de ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][d.getMonth()]}</div>`;
                lastDate = dateKey;

                const dayEvents = expanded.filter(e => e._displayDate === dateKey);
                dayEvents.forEach(ev => {
                    const timeStr = ev.startTime || '';
                    const group = groups.find(g => g.id === ev.groupId);
                    const color = group ? group.color : 'var(--primary)';
                    const groupName = group ? group.name : '';

                    html += `
                        <div class="list-item" style="margin-bottom: 6px;">
                            <div style="width: 4px; height: 32px; border-radius: 2px; background: ${color}; flex-shrink: 0; margin-right: 10px;"></div>
                            <div class="list-item-content">
                                <div class="list-item-title" style="font-size: 14px;">${ev.title}</div>
                                <div class="list-item-subtitle" style="font-size: 12px;">${timeStr ? timeStr + ' · ' : ''}${groupName}</div>
                            </div>
                        </div>`;
                });
            });

            container.innerHTML = html;
        } catch (e) {
            console.error('Error loading events:', e);
        }
    },

    async loadTodayTasks() {
        try {
            const [tasks, subjects] = await Promise.all([DB.getTasks(), DB.getSubjects()]);
            const subjectColors = {};
            subjects.forEach(s => { subjectColors[s.name] = s.color || '#6C5CE7'; });

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const dayMs = 1000 * 60 * 60 * 24;
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const monthNames = ['de Enero', 'de Febrero', 'de Marzo', 'de Abril', 'de Mayo', 'de Junio', 'de Julio', 'de Agosto', 'de Septiembre', 'de Octubre', 'de Noviembre', 'de Diciembre'];

            const pending = tasks.filter(t => !t.completed);

            // Expand recurring tasks for next 7 days
            const expanded = [];
            const maxDays = 7;
            pending.forEach(task => {
                if (task.repeat && task.dueDate) {
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

            const grouped = Object.entries(groups)
                .map(([key, g]) => {
                    g.tasks.sort((a, b) => {
                        if ((pOrder[a.priority] || 1) !== (pOrder[b.priority] || 1)) return (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1);
                        return (a.subject || 'zzz').localeCompare(b.subject || 'zzz');
                    });
                    return g;
                })
                .sort((a, b) => a.order - b.order)
                .slice(0, 5);

            const container = document.getElementById('dashboard-tasks');
            if (!container) return;

            if (grouped.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 13px;">¡Tienes el día libre! 🎉</p>';
                return;
            }

            let html = '';
            grouped.forEach(group => {
                const isCollapsed = DashboardPage._collapsedDays && DashboardPage._collapsedDays[group.label];
                const arrowSvg = isCollapsed
                    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'
                    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>';

                html += `<div class="task-group">
                    <div class="task-group-header" onclick="DashboardPage.toggleTaskGroup('${group.label}')">
                        <span class="task-group-label">${group.label}</span>
                        <span class="task-group-count">${group.tasks.length}</span>
                        <span class="task-group-arrow">${arrowSvg}</span>
                    </div>`;

                if (!isCollapsed) {
                    html += '<div class="task-group-items">';
                    group.tasks.forEach(task => {
                        const color = subjectColors[task.subject] || '#6C5CE7';
                        const timeStr = task.dueTime || '';
                        html += `
                        <div class="task-card" style="border-left: 4px solid ${color};">
                            <div class="task-card-info">
                                <div class="task-card-subject" style="color: ${color};">${task.subject || 'Sin asignatura'}</div>
                                <div class="task-card-title">${task.title}</div>
                                ${timeStr ? `<div class="task-card-time">Hora de entrega: ${timeStr}</div>` : ''}
                            </div>
                        </div>`;
                    });
                    html += '</div>';
                }

                html += '</div>';
            });

            container.innerHTML = html;
        } catch (e) {
            console.error('Error loading tasks:', e);
        }
    },

    _collapsedDays: {},

    toggleTaskGroup(label) {
        this._collapsedDays[label] = !this._collapsedDays[label];
        this.loadTodayTasks();
    },

    destroy() {}
};
