// Calendar Page
const CalendarPage = {
    currentDate: new Date(),
    view: 'month',

    render() {
        return `
        <div class="calendar-page">
            <div class="tabs" style="max-width: 300px;">
                <button class="tab active" data-view="month">Mes</button>
                <button class="tab" data-view="week">Semana</button>
                <button class="tab" data-view="day">Día</button>
            </div>

            <div class="calendar-header">
                <div class="calendar-nav">
                    <button class="btn-icon" id="cal-prev">◀</button>
                    <h3 id="cal-title"></h3>
                    <button class="btn-icon" id="cal-next">▶</button>
                </div>
                <button class="btn btn-primary btn-sm" id="cal-today">Hoy</button>
            </div>

            <div id="calendar-container" class="calendar-container"></div>
        </div>`;
    },

    init() {
        this.currentDate = new Date();

        // Tab listeners
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.view = tab.dataset.view;
                this.renderCalendar();
            });
        });

        document.getElementById('cal-prev').addEventListener('click', () => this.navigate(-1));
        document.getElementById('cal-next').addEventListener('click', () => this.navigate(1));
        document.getElementById('cal-today').addEventListener('click', () => {
            this.currentDate = new Date();
            this.renderCalendar();
        });

        this.renderCalendar();
    },

    navigate(dir) {
        if (this.view === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + dir);
        } else if (this.view === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() + (dir * 7));
        } else {
            this.currentDate.setDate(this.currentDate.getDate() + dir);
        }
        this.renderCalendar();
    },

    async renderCalendar() {
        const container = document.getElementById('calendar-container');
        const title = document.getElementById('cal-title');

        // Get events
        let events = [];
        try {
            const [schedule, exams, tasks] = await Promise.all([
                DB.getSchedule(),
                DB.getExams(),
                DB.getTasks()
            ]);

            schedule.forEach(s => events.push({ type: 'class', ...s }));
            exams.forEach(e => events.push({ type: 'exam', ...e }));
            tasks.filter(t => t.dueDate).forEach(t => events.push({ type: 'task', ...t }));
        } catch (e) {
            console.error('Error loading events:', e);
        }

        if (this.view === 'month') {
            this.renderMonth(container, title, events);
        } else if (this.view === 'week') {
            this.renderWeek(container, title, events);
        } else {
            this.renderDay(container, title, events);
        }
    },

    renderMonth(container, title, events) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        title.textContent = `${Utils.getMonthName(this.currentDate)} ${year}`;

        const daysInMonth = Utils.getDaysInMonth(year, month);
        const firstDay = Utils.getFirstDayOfMonth(year, month);
        const startDay = firstDay === 0 ? 6 : firstDay - 1; // Monday start

        let html = '<div class="calendar-grid">';
        ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(d => {
            html += `<div class="calendar-day-header">${d}</div>`;
        });

        // Previous month days
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = Utils.getDaysInMonth(prevYear, prevMonth);

        for (let i = startDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            html += `<div class="calendar-day other-month" data-date="${prevYear}-${prevMonth + 1}-${day}">${day}</div>`;
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const date = new Date(year, month, day);
            const isToday = Utils.isToday(date);
            const hasEvent = events.some(e => this.eventOnDate(e, date));

            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (hasEvent) classes += ' has-event';

            html += `<div class="${classes}" data-date="${dateStr}" onclick="CalendarPage.selectDate('${dateStr}')">${day}</div>`;
        }

        // Next month days
        const totalCells = startDay + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remaining; i++) {
            html += `<div class="calendar-day other-month">${i}</div>`;
        }

        html += '</div>';
        container.innerHTML = html;
    },

    renderWeek(container, title, events) {
        const weekStart = Utils.getStartOfWeek(this.currentDate);
        const weekEnd = Utils.addDays(weekStart, 6);

        title.textContent = `${Utils.formatDate(weekStart, 'short')} - ${Utils.formatDate(weekEnd, 'short')}`;

        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(Utils.addDays(weekStart, i));
        }

        const hours = [];
        for (let h = 0; h <= 23; h++) {
            hours.push(h);
        }

        let html = '<div class="calendar-scroll-container"><div class="table-container"><table class="table"><thead><tr><th>Hora</th>';
        days.forEach(d => {
            const isToday = Utils.isToday(d);
            html += `<th style="${isToday ? 'color: var(--primary); font-weight: 700;' : ''}">${Utils.getDayName(d, true)} ${d.getDate()}</th>`;
        });
        html += '</tr></thead><tbody>';

        hours.forEach(h => {
            html += `<tr><td style="font-weight: 600;">${String(h).padStart(2, '0')}:00</td>`;
            days.forEach(d => {
                const dayEvents = events.filter(e => this.eventOnDate(e, d) && this.eventAtHour(e, h));
                html += `<td style="padding: 4px;">`;
                dayEvents.forEach(e => {
                    const color = e.type === 'class' ? 'var(--primary)' : e.type === 'exam' ? 'var(--danger)' : 'var(--success)';
                    html += `<div style="background: ${color}20; color: ${color}; padding: 4px 8px; border-radius: 4px; font-size: 11px; margin-bottom: 2px; cursor: pointer;">${e.subject || e.name || e.title}</div>`;
                });
                html += '</td>';
            });
            html += '</tr>';
        });

        html += '</tbody></table></div></div>';
        container.innerHTML = html;
    },

    renderDay(container, title, events) {
        title.textContent = Utils.formatDate(this.currentDate, 'long');

        const dayEvents = events.filter(e => this.eventOnDate(e, this.currentDate));
        const hours = [];
        for (let h = 0; h <= 23; h++) {
            hours.push(h);
        }

        let html = '<div class="calendar-scroll-container"><div class="table-container"><table class="table"><thead><tr><th>Hora</th><th>Eventos</th></tr></thead><tbody>';

        hours.forEach(h => {
            const hourEvents = dayEvents.filter(e => this.eventAtHour(e, h));
            html += `<tr><td style="font-weight: 600; white-space: nowrap;">${String(h).padStart(2, '0')}:00</td>`;
            html += '<td style="padding: 4px;">';
            hourEvents.forEach(e => {
                const icon = e.type === 'class' ? '📚' : e.type === 'exam' ? '📝' : '✅';
                const color = e.type === 'class' ? 'var(--primary)' : e.type === 'exam' ? 'var(--danger)' : 'var(--success)';
                html += `<div style="background: ${color}20; color: ${color}; padding: 4px 8px; border-radius: 4px; font-size: 11px; margin-bottom: 2px; cursor: pointer;">${icon} ${e.subject || e.name || e.title}</div>`;
            });
            html += '</td></tr>';
        });

        html += '</tbody></table></div></div>';
        container.innerHTML = html;
    },

    eventOnDate(event, date) {
        if (event.type === 'class') {
            return event.day === date.getDay();
        }
        if (event.type === 'exam' || event.type === 'task') {
            return Utils.isSameDay(event.date, date);
        }
        return false;
    },

    eventAtHour(event, hour) {
        if (!event.startHour) return false;
        const [h] = event.startHour.split(':').map(Number);
        return h === hour;
    },

    selectDate(dateStr) {
        this.currentDate = new Date(dateStr + 'T00:00:00');
        this.view = 'day';
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.tab[data-view="day"]').classList.add('active');
        this.renderCalendar();
    }
};
