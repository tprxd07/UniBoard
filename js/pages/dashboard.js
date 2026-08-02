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
            const events = await DB.getEvents();
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            const upcoming = events.filter(e => {
                const eventDate = new Date(e.date);
                return eventDate >= today && eventDate < nextWeek;
            }).sort((a, b) => new Date(a.date) - new Date(b.date));

            const container = document.getElementById('dashboard-events');
            if (!container) return;

            if (upcoming.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 13px;">No hay eventos próximos</p>';
                return;
            }

            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const dayLabels = { 0: 'Hoy', 1: 'Mañana' };

            let html = '';
            let lastDate = '';

            upcoming.forEach(event => {
                const eventDate = new Date(event.date);
                const dateKey = eventDate.toDateString();
                const diffDays = Math.round((eventDate - today) / (1000 * 60 * 60 * 24));
                const label = dayLabels[diffDays] || dayNames[eventDate.getDay()];

                if (dateKey !== lastDate) {
                    html += `<div class="event-date-label">${label} · ${eventDate.getDate()} de ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][eventDate.getMonth()]}</div>`;
                    lastDate = dateKey;
                }

                const timeStr = event.startTime || '';
                const groupColor = event.groupColor || 'var(--primary)';
                html += `
                    <div class="list-item" style="margin-bottom: 6px;">
                        <div style="width: 4px; height: 32px; border-radius: 2px; background: ${groupColor}; flex-shrink: 0; margin-right: 10px;"></div>
                        <div class="list-item-content">
                            <div class="list-item-title" style="font-size: 14px;">${event.title}</div>
                            <div class="list-item-subtitle" style="font-size: 12px;">${timeStr ? timeStr + ' · ' : ''}${event.group || ''}</div>
                        </div>
                    </div>`;
            });

            container.innerHTML = html;
        } catch (e) {
            console.error('Error loading events:', e);
        }
    },

    async loadTodayTasks() {
        try {
            const tasks = await DB.getTasks();
            const today = new Date().toISOString().split('T')[0];

            const todayTasks = tasks.filter(t => {
                if (t.completed) return false;
                if (!t.dueDate) return true;
                return t.dueDate <= today;
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
