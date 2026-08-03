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
            const tasks = await DB.getTasks();
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            const todayTasks = tasks.filter(t => {
                if (t.completed) return false;
                if (!t.dueDate) return false;
                const due = typeof t.dueDate === 'string' ? t.dueDate : new Date(t.dueDate.seconds ? t.dueDate.seconds * 1000 : t.dueDate).toISOString().split('T')[0];
                return due <= todayStr;
            }).slice(0, 5);

            const container = document.getElementById('dashboard-tasks');
            if (!container) return;

            if (todayTasks.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 13px;">¡Tienes el día libre! 🎉</p>';
                return;
            }

            container.innerHTML = todayTasks.map(task => `
                <div class="list-item" style="margin-bottom: 6px;">
                    <div class="list-item-content">
                        <div class="list-item-title" style="font-size: 14px;">${task.title}</div>
                        <div class="list-item-subtitle" style="font-size: 12px;">${task.subject || 'Sin asignatura'}${task.dueDate ? ' · ' + Utils.formatDate(task.dueDate) : ''}</div>
                    </div>
                    <span class="badge badge-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}" style="font-size: 11px;">
                        ${task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                    </span>
                </div>
            `).join('');
        } catch (e) {
            console.error('Error loading tasks:', e);
        }
    },

    destroy() {}
};
