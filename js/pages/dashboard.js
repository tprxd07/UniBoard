// Dashboard Page
const DashboardPage = {
    async render() {
        return `
        <div class="dashboard-greeting">
            <h2>${Utils.getGreeting()}! 👋</h2>
            <p id="greeting-name">Aquí tienes tu resumen del día</p>
        </div>

        <div class="dashboard-grid">
            <div class="dashboard-main">
                <div class="next-class-card" id="next-class-card">
                    <h3>PRÓXIMA CLASE</h3>
                    <div class="class-name" id="next-class-name">Cargando...</div>
                    <div class="class-details" id="next-class-details"></div>
                    <div class="next-class-timer">
                        <p>Empieza en</p>
                        <div class="time-value" id="next-class-countdown">--:--</div>
                    </div>
                </div>

                <div class="quote-card">
                    <p class="quote-text">"${Utils.getQuote()}"</p>
                </div>

                <div class="grid-2">
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">Tareas pendientes</span>
                            <a href="#" onclick="App.loadPage('tasks'); return false;" class="badge badge-primary">Ver todas</a>
                        </div>
                        <div id="dashboard-tasks"></div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">Próximos exámenes</span>
                            <a href="#" onclick="App.loadPage('exams'); return false;" class="badge badge-primary">Ver todos</a>
                        </div>
                        <div id="dashboard-exams"></div>
                    </div>
                </div>

                <div class="card" style="margin-top: 16px;">
                    <div class="card-header">
                        <span class="card-title">Horario de hoy</span>
                    </div>
                    <div id="dashboard-schedule"></div>
                </div>
            </div>

            <div class="dashboard-sidebar">
                <div class="weather-card card">
                    <div class="weather-icon" id="weather-icon">🌤️</div>
                    <div class="weather-info">
                        <h4 id="weather-temp">--°C</h4>
                        <p id="weather-desc">Cargando tiempo...</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Cómo ir vestida</span>
                    </div>
                    <div class="outfit-suggestion">
                        <p id="outfit-text">${Utils.getSeasonOutfit()}</p>
                    </div>
                </div>

                <div class="card" style="margin-top: 16px;">
                    <div class="card-header">
                        <span class="card-title">Accesos rápidos</span>
                    </div>
                    <div class="quick-actions">
                        <a href="https://www.google.com" target="_blank" class="quick-action">
                            <span class="quick-action-icon">🌐</span>
                            <span class="quick-action-label">Web</span>
                        </a>
                        <a href="https://mail.google.com" target="_blank" class="quick-action">
                            <span class="quick-action-icon">📧</span>
                            <span class="quick-action-label">Correo</span>
                        </a>
                        <a href="#" onclick="App.loadPage('study'); return false;" class="quick-action">
                            <span class="quick-action-icon">📖</span>
                            <span class="quick-action-label">Estudiar</span>
                        </a>
                        <a href="#" onclick="App.loadPage('timer'); return false;" class="quick-action">
                            <span class="quick-action-icon">⏱️</span>
                            <span class="quick-action-label">Pomodoro</span>
                        </a>
                    </div>
                </div>

                <div class="card" style="margin-top: 16px;">
                    <div class="card-header">
                        <span class="card-title">Progreso semanal</span>
                    </div>
                    <div style="text-align: center; padding: 10px;">
                        <div class="countdown-value" id="weekly-hours" style="font-size: 36px; color: var(--primary);">0h</div>
                        <p style="font-size: 12px; color: var(--text-secondary);">Horas estudiadas esta semana</p>
                    </div>
                </div>
            </div>
        </div>`;
    },

    async init() {
        this.loadNextClass();
        this.loadTasks();
        this.loadExams();
        this.loadSchedule();
        this.loadStudyHours();

        // Update countdown every second
        this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
    },

    async loadNextClass() {
        try {
            const schedule = await DB.getSchedule();
            const now = new Date();
            const currentDay = now.getDay();
            const currentHour = now.getHours() * 60 + now.getMinutes();

            // Find next class today
            const todayClasses = schedule
                .filter(c => c.day === currentDay)
                .sort((a, b) => a.startHour.localeCompare(b.startHour));

            let nextClass = null;
            for (const cls of todayClasses) {
                const [h, m] = cls.startHour.split(':').map(Number);
                const classTime = h * 60 + m;
                if (classTime > currentHour) {
                    nextClass = cls;
                    break;
                }
            }

            if (nextClass) {
                document.getElementById('next-class-name').textContent = nextClass.subject || nextClass.name;
                document.getElementById('next-class-details').textContent =
                    `${nextClass.startHour} - ${nextClass.endHour} | ${nextClass.room || 'Sin aula'}`;

                // Calculate countdown
                const [h, m] = nextClass.startHour.split(':').map(Number);
                const classDate = new Date();
                classDate.setHours(h, m, 0, 0);
                this.nextClassTime = classDate;
            } else {
                document.getElementById('next-class-name').textContent = 'No hay más clases hoy';
                document.getElementById('next-class-details').textContent = '¡A descansar! 😴';
                document.getElementById('next-class-countdown').textContent = '--:--';
            }
        } catch (e) {
            document.getElementById('next-class-name').textContent = 'Añade tu horario';
        }
    },

    updateCountdown() {
        if (!this.nextClassTime) return;
        const now = new Date();
        const diff = this.nextClassTime - now;

        if (diff <= 0) {
            document.getElementById('next-class-countdown').textContent = '¡Ya empezó!';
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('next-class-countdown').textContent =
            `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    async loadTasks() {
        try {
            const tasks = await DB.getTasks();
            const pending = tasks.filter(t => !t.completed).slice(0, 5);
            const container = document.getElementById('dashboard-tasks');

            if (pending.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 13px;">No hay tareas pendientes</p>';
                return;
            }

            container.innerHTML = pending.map(task => `
                <div class="list-item" style="margin-bottom: 8px;">
                    <div class="list-item-content">
                        <div class="list-item-title">${task.title}</div>
                        <div class="list-item-subtitle">${task.subject || 'Sin asignatura'} · ${task.dueDate ? Utils.formatDate(task.dueDate) : 'Sin fecha'}</div>
                    </div>
                    <span class="badge badge-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}">
                        ${task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                    </span>
                </div>
            `).join('');
        } catch (e) {
            console.error('Error loading tasks:', e);
        }
    },

    async loadExams() {
        try {
            const exams = await DB.getExams();
            const upcoming = exams.filter(e => Utils.daysUntil(e.date) >= 0).slice(0, 3);
            const container = document.getElementById('dashboard-exams');

            if (upcoming.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 13px;">No hay exámenes próximos</p>';
                return;
            }

            container.innerHTML = upcoming.map(exam => `
                <div class="list-item" style="margin-bottom: 8px;">
                    <div class="list-item-content">
                        <div class="list-item-title">${exam.subject || exam.name}</div>
                        <div class="list-item-subtitle">${Utils.formatDate(exam.date)} · ${exam.room || 'Sin aula'}</div>
                    </div>
                    <span class="badge badge-danger">${Utils.daysUntil(exam.date)}d</span>
                </div>
            `).join('');
        } catch (e) {
            console.error('Error loading exams:', e);
        }
    },

    async loadSchedule() {
        try {
            const schedule = await DB.getSchedule();
            const today = new Date().getDay();
            const todayClasses = schedule
                .filter(c => c.day === today)
                .sort((a, b) => a.startHour.localeCompare(b.startHour));

            const container = document.getElementById('dashboard-schedule');

            if (todayClasses.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 13px;">No hay clases hoy</p>';
                return;
            }

            container.innerHTML = todayClasses.map(cls => `
                <div class="list-item">
                    <div class="list-item-icon" style="background: ${Utils.getSubjectColor(cls.day)}15; color: ${Utils.getSubjectColor(cls.day)};">
                        📚
                    </div>
                    <div class="list-item-content">
                        <div class="list-item-title">${cls.subject || cls.name}</div>
                        <div class="list-item-subtitle">${cls.startHour} - ${cls.endHour} · ${cls.room || 'Sin aula'}</div>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            console.error('Error loading schedule:', e);
        }
    },

    async loadStudyHours() {
        try {
            const sessions = await DB.getStudySessions();
            const now = new Date();
            const weekStart = Utils.getStartOfWeek(now);
            const weekSessions = sessions.filter(s => new Date(s.date) >= weekStart);
            const totalMinutes = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
            const hours = Math.floor(totalMinutes / 60);
            document.getElementById('weekly-hours').textContent = `${hours}h`;
        } catch (e) {
            console.error('Error loading study hours:', e);
        }
    },

    destroy() {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
    }
};
