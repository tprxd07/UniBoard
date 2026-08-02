// Dashboard Page
const DashboardPage = {
    async render() {
        const userName = (await DB.getProfile()).name || Auth.currentUser?.displayName || '';
        const greeting = Utils.getGreeting();
        return `
        <div class="dashboard-greeting">
            <h2>${greeting}, ${userName}</h2>
            <p>Aquí tienes tu resumen de los próximos días</p>
        </div>

        <div class="dashboard-events-section">
            <div class="card" style="margin-bottom: 16px;">
                <div class="card-header">
                    <span class="card-title">📅 Calendario</span>
                </div>
                <div id="mini-calendar"></div>
            </div>

            <div class="card" style="margin-bottom: 16px;">
                <div class="card-header">
                    <span class="card-title">📌 Eventos</span>
                </div>
                <div id="dashboard-events"></div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">✅ Tareas de hoy</span>
                    <a href="#" onclick="App.loadPage('tasks'); return false;" class="badge badge-primary">Ver todas</a>
                </div>
                <div id="dashboard-tasks"></div>
            </div>
        </div>`;
    },

    async init() {
        this.loadMiniCalendar();
        this.loadEvents();
        this.loadTodayTasks();
    },

    loadMiniCalendar() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const dayNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

        let html = `
            <div class="mini-cal-header">
                <span class="mini-cal-title">${monthNames[month]} ${year}</span>
            </div>
            <div class="mini-cal-grid">
                ${dayNames.map(d => `<div class="mini-cal-day-name">${d}</div>`).join('')}
        `;

        // Fill empty cells (Monday = 0)
        const startOffset = (firstDay + 6) % 7;
        for (let i = 0; i < startOffset; i++) {
            html += `<div class="mini-cal-day empty"></div>`;
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === today;
            html += `<div class="mini-cal-day${isToday ? ' today' : ''}">${d}</div>`;
        }

        html += `</div>`;
        document.getElementById('mini-calendar').innerHTML = html;
    },

    async loadEvents() {
        try {
            const events = await DB.getEvents();
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const twoDaysLater = new Date(today);
            twoDaysLater.setDate(twoDaysLater.getDate() + 3);

            const upcoming = events.filter(e => {
                const eventDate = new Date(e.date);
                return eventDate >= today && eventDate < twoDaysLater;
            }).sort((a, b) => new Date(a.date) - new Date(b.date));

            const container = document.getElementById('dashboard-events');

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

                const timeStr = event.startTime ? `${event.startTime}` : '';
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

            if (todayTasks.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 13px;">¡Todo al día! 🎉</p>';
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
