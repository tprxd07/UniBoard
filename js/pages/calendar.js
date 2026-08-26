const CalendarPage = {
    currentDate: new Date(),
    view: 'month',
    events: [],
    groups: [],
    tasks: [],
    exams: [],
    editingEvent: null,
    editingGroup: null,
    _collapsedTodos: {},

    render() {
        return `
        <div class="calendar-page">
            <div class="calendar-topbar">
                <div class="tabs">
                    <button class="tab active" data-view="month">Mes</button>
                    <button class="tab" data-view="week">Semana</button>
                    <button class="tab" data-view="day">Día</button>
                    <button class="tab" data-view="all">Todos</button>
                </div>
                <div class="calendar-topbar-right">
                    <button class="btn btn-primary btn-sm" id="cal-today">Hoy</button>
                    <div class="calendar-topbar-buttons">
                        <button class="btn btn-primary btn-sm" id="btn-add-event">+ Añadir evento</button>
                        <button class="btn btn-primary btn-sm" id="btn-manage-groups">Modificar grupo</button>
                    </div>
                </div>
            </div>

            <div class="calendar-header">
                <div class="calendar-nav">
                    <button class="btn-icon" id="cal-prev">◀</button>
                    <h3 id="cal-title"></h3>
                    <button class="btn-icon" id="cal-next">▶</button>
                </div>
            </div>

            <div id="calendar-container" class="calendar-container"></div>
        </div>`;
    },

    async init() {
        this.currentDate = new Date();
        this.view = 'month';
        await DB.initDefaultGroups();

        document.querySelectorAll('.calendar-topbar .tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === 'month');
        });

        document.getElementById('cal-prev').style.display = '';
        document.getElementById('cal-next').style.display = '';

        document.querySelectorAll('.calendar-topbar .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.calendar-topbar .tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.view = tab.dataset.view;
                if (this.view === 'all') {
                    document.getElementById('cal-prev').style.display = 'none';
                    document.getElementById('cal-next').style.display = 'none';
                } else {
                    document.getElementById('cal-prev').style.display = '';
                    document.getElementById('cal-next').style.display = '';
                }
                this.renderCalendar();
            });
        });

        document.getElementById('cal-prev').addEventListener('click', () => this.navigate(-1));
        document.getElementById('cal-next').addEventListener('click', () => this.navigate(1));
        document.getElementById('cal-today').addEventListener('click', () => {
            this.currentDate = new Date();
            this.renderCalendar();
        });
        document.getElementById('btn-add-event').addEventListener('click', () => this.openEventModal());
        document.getElementById('btn-manage-groups').addEventListener('click', () => this.openGroupModal());

        // Delegated clicks for rendered grids (DOMPurify strips inline onclick)
        document.getElementById('calendar-container').addEventListener('click', (e) => {
            const evEl = e.target.closest('[data-open-event]');
            if (evEl) {
                e.stopPropagation();
                this.openEventModal(evEl.dataset.openEvent);
                return;
            }
            const dayEl = e.target.closest('[data-goto-day]');
            if (dayEl) this.goToDay(dayEl.dataset.gotoDay);
        });

        await this.renderCalendar();
    },

    navigate(dir) {
        if (this.view === 'month') this.currentDate.setMonth(this.currentDate.getMonth() + dir);
        else if (this.view === 'week') this.currentDate.setDate(this.currentDate.getDate() + (dir * 7));
        else this.currentDate.setDate(this.currentDate.getDate() + dir);
        this.renderCalendar();
    },

    goToDay(dateStr) {
        const parts = dateStr.split('-');
        this.currentDate = new Date(parts[0], parts[1] - 1, parts[2]);
        this.view = 'day';
        document.querySelectorAll('.calendar-topbar .tab').forEach(t => {
            t.classList.toggle('active', t.dataset.view === 'day');
        });
        document.getElementById('cal-prev').style.display = '';
        document.getElementById('cal-next').style.display = '';
        this.renderCalendar();
    },

    async renderCalendar() {
        const container = document.getElementById('calendar-container');
        const title = document.getElementById('cal-title');

        try {
            [this.events, this.groups, this.tasks, this.exams] = await Promise.all([
                DB.getEvents(), DB.getGroups(), DB.getTasks(), DB.getExams()
            ]);
            this.subjects_cache = await DB.getSubjects().catch(() => []);
        } catch (e) {
            console.error('Error loading calendar data:', e);
        }

        if (this.view === 'month') this.renderMonth(container, title);
        else if (this.view === 'week') this.renderWeek(container, title);
        else if (this.view === 'day') this.renderDay(container, title);
        else this.renderAll(container, title);
    },

    getGroupForEvent(event) {
        if (!event.groupId) return null;
        return this.groups.find(g => g.id === event.groupId);
    },

    eventOnDate(event, date) {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        if (event.repeat === 'daily') return dateStr >= event.date;
        if (event.repeat === 'weekly') { const ed = new Date(event.date); return date.getDay() === ed.getDay() && dateStr >= event.date; }
        if (event.repeat === 'monthly') { const ed = new Date(event.date); return date.getDate() === ed.getDate() && dateStr >= event.date; }
        if (event.repeat === 'yearly') { const ed = new Date(event.date); return date.getDate() === ed.getDate() && date.getMonth() === ed.getMonth() && dateStr >= event.date; }
        if (event.repeat === 'custom') return event.repeatDays && event.repeatDays.includes(date.getDay()) && dateStr >= event.date;
        if (event.endDate && event.endDate > event.date) {
            return dateStr >= event.date && dateStr <= event.endDate;
        }
        return event.date === dateStr;
    },

    eventStartsOnDate(event, date) {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return event.date === dateStr;
    },

    eventEndsOnDate(event, date) {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const endDate = event.endDate || event.date;
        return endDate === dateStr;
    },

    eventSpansMultipleDays(event) {
        return event.endDate && event.endDate > event.date;
    },

    eventsOnDate(date) { return this.events.filter(e => this.eventOnDate(e, date)); },

    tasksOnDate(date) {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayMs = 1000 * 60 * 60 * 24;
        return this.tasks.filter(t => {
            if (!t.dueDate || t.completed) return false;
            const due = typeof t.dueDate === 'string' ? t.dueDate : new Date(t.dueDate.seconds ? t.dueDate.seconds * 1000 : t.dueDate).toISOString().split('T')[0];
            if (t.repeat) {
                const taskDate = new Date(due + 'T00:00:00');
                const diffFromStart = Math.round((date - taskDate) / dayMs);
                if (diffFromStart < 0) return false;
                if (t.repeat === 'daily') return true;
                if (t.repeat === 'weekly') return date.getDay() === taskDate.getDay();
                if (t.repeat === 'monthly') return date.getDate() === taskDate.getDate();
                if (t.repeat === 'custom' && t.repeatDays) return t.repeatDays.includes(date.getDay());
                return false;
            }
            return due === dateStr;
        });
    },

    examsOnDate(date) {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return this.exams.filter(e => e.date === dateStr);
    },

    getSubjectColor(name) {
        const s = this.subjects_cache && this.subjects_cache.find(s => s.name === name);
        return s ? s.color || '#6C5CE7' : '#6C5CE7';
    },

    getTaskColor(priority) {
        if (priority === 'high') return '#e74c3c';
        if (priority === 'medium') return '#f39c12';
        return '#a8e6cf';
    },

    _parseTime(str) {
        if (!str) return null;
        const parts = str.split(':').map(Number);
        return parts[0] + (parts[1] || 0) / 60;
    },

    _layoutOverlapping(items) {
        if (items.length === 0) return [];
        items.sort((a, b) => a.start - b.start);
        const columns = [];
        let currentCol = [];
        let colEnd = -1;

        items.forEach(item => {
            if (item.start >= colEnd) {
                if (currentCol.length > 0) columns.push(currentCol);
                currentCol = [item];
                colEnd = item.end;
            } else {
                currentCol.push(item);
                colEnd = Math.max(colEnd, item.end);
            }
        });
        if (currentCol.length > 0) columns.push(currentCol);

        columns.forEach(col => {
            const totalCols = col.length;
            col.forEach((ev, i) => {
                ev._colIndex = i;
                ev._totalCols = totalCols;
            });
        });

        return columns;
    },

    _scrollToCurrentTime(container) {
        const scroll = container.querySelector('.calendar-scroll-container');
        if (!scroll) return;
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const top = (hour + minute / 60) * 60;
        setTimeout(() => { scroll.scrollTop = Math.max(0, top - 100); }, 50);
    },

    // ============ MONTH VIEW ============
    renderMonth(container, title) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        title.textContent = `${Utils.getMonthName(this.currentDate)} ${year}`;

        const daysInMonth = Utils.getDaysInMonth(year, month);
        const firstDay = Utils.getFirstDayOfMonth(year, month);
        const startDay = firstDay === 0 ? 6 : firstDay - 1;

        const allDays = [];
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = Utils.getDaysInMonth(prevYear, prevMonth);
        for (let i = startDay - 1; i >= 0; i--) {
            allDays.push({ day: daysInPrevMonth - i, current: false, dateStr: '' });
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            allDays.push({ day, current: true, dateStr, date: new Date(year, month, day) });
        }
        const remaining = allDays.length % 7 === 0 ? 0 : 7 - (allDays.length % 7);
        for (let i = 1; i <= remaining; i++) {
            allDays.push({ day: i, current: false, dateStr: '' });
        }

        const multiDayEvents = this.events.filter(e => this.eventSpansMultipleDays(e));
        const defaultColor = Utils.getComplementaryColor();

        let html = '<div class="calendar-grid">';
        ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(d => {
            html += `<div class="calendar-day-header">${d}</div>`;
        });

        const MAX_CHIPS = 3;

        for (let w = 0; w < allDays.length; w += 7) {
            const weekDays = allDays.slice(w, w + 7);
            const firstVisible = weekDays.find(d => d.current && d.dateStr);
            const lastVisible = [...weekDays].reverse().find(d => d.current && d.dateStr);
            const weekMultiDay = multiDayEvents.filter(e => {
                if (!firstVisible || !lastVisible) return false;
                const eEnd = e.endDate || e.date;
                return e.date <= lastVisible.dateStr && eEnd >= firstVisible.dateStr;
            });

            weekDays.forEach((d, i) => {
                if (!d.current) {
                    html += `<div class="calendar-day other-month"><div class="calendar-day-number">${d.day}</div></div>`;
                    return;
                }
                const date = d.date;
                const isToday = Utils.isToday(date);

                let classes = 'calendar-day';
                if (isToday) classes += ' today';

                // Build event chips: number stays at the top, chips flow below
                // sorted chronologically. Max MAX_CHIPS per day - anything that
                // does not fit is not added.
                const chips = [];
                const push = (key, html) => chips.push({ key, html });

                weekMultiDay.forEach(e => {
                    const eEnd = e.endDate || e.date;
                    // One chip on every day the event covers
                    if (d.dateStr < e.date || d.dateStr > eEnd) return;
                    const group = this.getGroupForEvent(e);
                    const color = group ? group.color : defaultColor;
                    const emoji = group && group.emoji ? group.emoji + ' ' : '';
                    push(-2, `<div class="calendar-event" style="background:${color}28; color:${color}; border-left:3px solid ${color};" data-open-event="${e.id}" title="${Utils.escapeHTML(e.title)}">
                        <span class="calendar-event-text">${emoji}${Utils.escapeHTML(e.title)}</span>
                    </div>`);
                });

                this.eventsOnDate(date).forEach(e => {
                    if (this.eventSpansMultipleDays(e)) return; // already added above
                    const group = this.getGroupForEvent(e);
                    const color = group ? group.color : defaultColor;
                    const emoji = group && group.emoji ? group.emoji + ' ' : '';
                    const key = (e.startTime || e.endTime) ? (this._parseTime(e.startTime) || 0) : -1;
                    push(key, `<div class="calendar-event" style="background: ${color}20; color: ${color}; border-left: 3px solid ${color};" data-open-event="${e.id}" title="${Utils.escapeHTML(e.title)}">
                        <span class="calendar-event-text">${emoji}${Utils.escapeHTML(e.title)}</span>
                    </div>`);
                });

                this.tasksOnDate(date).forEach(t => {
                    const color = this.getTaskColor(t.priority);
                    push(100 + (this._parseTime(t.dueTime) || 9), `<div class="calendar-event" style="background: ${color}20; color: ${color}; border-left: 3px solid ${color};" title="${Utils.escapeHTML(t.title)}">
                        <span class="calendar-event-text"><span class="priority-dot" style="background:${color};"></span>${Utils.escapeHTML(t.title)}</span>
                    </div>`);
                });

                this.examsOnDate(date).forEach(ex => {
                    const color = this.getSubjectColor(ex.subject);
                    push(200 + (this._parseTime(ex.startTime) || 8), `<div class="calendar-event" style="background: ${color}20; color: ${color}; border-left: 3px solid ${color};" title="${Utils.escapeHTML(ex.subject)}">
                        <span class="calendar-event-text">${Icons.edit} ${Utils.escapeHTML(ex.topics || ex.subject)}</span>
                    </div>`);
                });

                chips.sort((a, b) => a.key - b.key);
                const eventsHtml = chips.slice(0, MAX_CHIPS).map(c => c.html).join('');

                html += `<div class="${classes}" data-date="${d.dateStr}" data-goto-day="${d.dateStr}">
                    <div class="calendar-day-number"><span class="calendar-day-num">${d.day}</span></div>
                    <div class="calendar-day-events">${eventsHtml}</div>
                </div>`;
            });
        }

        html += '</div>';
        container.innerHTML = Utils.sanitize(html);
    },

    // ============ WEEK VIEW ============
    renderWeek(container, title) {
        const weekStart = Utils.getStartOfWeek(this.currentDate);
        const weekEnd = Utils.addDays(weekStart, 6);
        title.textContent = `${Utils.formatDate(weekStart, 'short')} - ${Utils.formatDate(weekEnd, 'short')}`;

        const days = [];
        for (let i = 0; i < 7; i++) days.push(Utils.addDays(weekStart, i));

        const HOUR_HEIGHT = 60;

        // Lane bars at the top: only for multi-day events WITH times.
        // All-day (no-time) multi-day events render as full-day blocks instead.
        const multiDayEvents = this.events.filter(e => {
            if (!this.eventSpansMultipleDays(e)) return false;
            if (!e.startTime && !e.endTime) return false;
            const eEnd = e.endDate;
            const wStart = days[0];
            const wEnd = days[6];
            const wStartStr = `${wStart.getFullYear()}-${String(wStart.getMonth()+1).padStart(2,'0')}-${String(wStart.getDate()).padStart(2,'0')}`;
            const wEndStr = `${wEnd.getFullYear()}-${String(wEnd.getMonth()+1).padStart(2,'0')}-${String(wEnd.getDate()).padStart(2,'0')}`;
            return e.date <= wEndStr && eEnd >= wStartStr;
        });

        const lanes = [];
        multiDayEvents.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        multiDayEvents.forEach(e => {
            let placed = false;
            for (let l = 0; l < lanes.length; l++) {
                const conflict = lanes[l].some(existing => {
                    const exEnd = existing.endDate || existing.date;
                    const eEnd = e.endDate || e.date;
                    return e.date <= exEnd && eEnd >= existing.date;
                });
                if (!conflict) {
                    e._lane = l;
                    lanes[l].push(e);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                e._lane = lanes.length;
                lanes.push([e]);
            }
        });

        const dayColumns = days.map(d => {
            const items = [];
            const defaultColor = Utils.getComplementaryColor();
            this.eventsOnDate(d).forEach(e => {
                const group = this.getGroupForEvent(e);
                const color = group ? group.color : defaultColor;
                const emoji = group && group.emoji ? group.emoji + ' ' : '';
                const isMultiDay = this.eventSpansMultipleDays(e);
                if (isMultiDay) {
                    // No-time multi-day events occupy the full day, every day they cover
                    if (!e.startTime && !e.endTime) {
                        items.push({ color, title: emoji + e.title, subtitle: '', start: 0, end: 24, type: 'event', id: e.id });
                    }
                    return; // timed multi-day events use the lane bars above
                }
                let start, end;
                if (!e.startTime && !e.endTime) {
                    // No times -> all-day: occupy the whole day
                    start = 0;
                    end = 24;
                } else {
                    start = this._parseTime(e.startTime) || 0;
                    end = this._parseTime(e.endTime) || Math.min(start + 1, 24);
                }
                items.push({ color, title: emoji + e.title, subtitle: e.startTime || '', start, end, type: 'event', id: e.id });
            });
            this.tasksOnDate(d).forEach(t => {
                const color = this.getTaskColor(t.priority);
                const start = this._parseTime(t.dueTime) || 9;
                items.push({ color, title: t.title, subtitle: '', start, end: start + 1, type: 'task', id: t.id });
            });
            this.examsOnDate(d).forEach(ex => {
                const color = this.getSubjectColor(ex.subject);
                const start = this._parseTime(ex.startTime) || 8;
                const end = this._parseTime(ex.endTime) || start + 1;
                items.push({ color, title: ex.topics || ex.subject, subtitle: '', start, end: Math.max(end, start + 1), type: 'exam', id: ex.id });
            });
            return this._layoutOverlapping(items);
        });

        const dayDateStrs = days.map(d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);

        let html = '<div class="calendar-scroll-container"><div class="calendar-grid-container week-view">';
        html += '<div class="calendar-grid-header-corner" style="border-bottom:1px solid var(--border);"></div>';
        days.forEach(d => {
            const isToday = Utils.isToday(d);
            html += `<div class="calendar-grid-header-day${isToday ? ' today' : ''}" style="border-bottom:1px solid var(--border);">${Utils.getDayName(d, true)} ${d.getDate()}</div>`;
        });

        if (multiDayEvents.length > 0) {
            const laneHeight = 24;
            const totalHeight = lanes.length * laneHeight;
            html += `<div class="calendar-grid-header-corner" style="height:${totalHeight}px;"></div>`;
            days.forEach((d, di) => {
                const dateStr = dayDateStrs[di];
                let barsHtml = '';
                multiDayEvents.forEach(e => {
                    const eEnd = e.endDate || e.date;
                    // One segment per covered day (a single wide bar would be
                    // clipped by the cell's overflow:hidden)
                    if (dateStr < e.date || dateStr > eEnd) return;
                    const isStart = e.date === dateStr;
                    const isEnd = eEnd === dateStr;
                    const group = this.getGroupForEvent(e);
                    const color = group ? group.color : Utils.getComplementaryColor();
                    const emoji = group && group.emoji ? group.emoji + ' ' : '';
                    let barClasses = 'calendar-multiday-bar';
                    if (isStart) barClasses += ' bar-start';
                    if (isEnd) barClasses += ' bar-end';
                    if (!isStart && !isEnd) barClasses += ' bar-mid';
                    barsHtml += `<div class="${barClasses}" style="background:${color}28; color:${color}; border-color:${color}; top:${e._lane * laneHeight}px; height:${laneHeight - 2}px; z-index:${10 + e._lane};" onclick="event.stopPropagation(); CalendarPage.openEventModal('${e.id}')" title="${Utils.escapeHTML(e.title)}">
                        <span class="calendar-multiday-text">${isStart ? Utils.escapeHTML(emoji + e.title) : ''}</span>
                    </div>`;
                });
                html += `<div class="calendar-multiday-week-cell" style="height:${totalHeight}px; border-left:1px solid var(--border); position:relative;">${barsHtml}</div>`;
            });
        }

        html += '<div class="calendar-grid-hours">';
        for (let h = 0; h <= 23; h++) {
            html += `<div class="calendar-grid-hour-label">${String(h).padStart(2, '0')}:00</div>`;
        }
        html += '</div>';

        days.forEach((d, di) => {
            const isToday = Utils.isToday(d);
            html += `<div class="calendar-grid-body" style="border-left:1px solid var(--border); ${isToday ? 'background:var(--primary-bg);' : ''}">`;
            for (let h = 0; h <= 23; h++) {
                html += `<div class="calendar-grid-row" data-hour="${h}"></div>`;
            }
            dayColumns[di].forEach(col => {
                col.forEach(ev => {
                    const top = ev.start * HOUR_HEIGHT;
                    const height = Math.max((ev.end - ev.start) * HOUR_HEIGHT, 16);
                    const widthPct = (100 / (ev._totalCols || 1));
                    const leftPct = (ev._colIndex || 0) * widthPct;
                    const clickAction = ev.type === 'event'
                        ? `event.stopPropagation(); CalendarPage.openEventModal('${ev.id}')`
                        : ev.type === 'task'
                            ? `event.stopPropagation(); CalendarPage.goToTask('${ev.id}')`
                            : `event.stopPropagation(); CalendarPage.goToExam('${ev.id}')`;
                    html += `<div class="calendar-event-block" style="top:${top}px; height:${height}px; left:calc(${leftPct}% + 2px); width:calc(${widthPct}% - 4px); background:${ev.color}22; color:${ev.color}; border-left:3px solid ${ev.color}; font-size:11px; padding:3px 6px;" onclick="${clickAction}">
                        <div class="event-title" style="font-size:11px;">${Utils.escapeHTML(ev.title)}</div>
                    </div>`;
                });
            });
            html += '</div>';
        });

        html += '</div></div>';
        container.innerHTML = Utils.sanitize(html);
        this._scrollToCurrentTime(container);
    },

    // ============ DAY VIEW ============
    renderDay(container, title) {
        title.textContent = Utils.formatDate(this.currentDate, 'long');
        const dayEvents = this.eventsOnDate(this.currentDate);
        const dayTasks = this.tasksOnDate(this.currentDate);
        const dayExams = this.examsOnDate(this.currentDate);
        const HOUR_HEIGHT = 60;

        const items = [];
        const defaultColor = Utils.getComplementaryColor();
        dayEvents.forEach(e => {
            const group = this.getGroupForEvent(e);
            const color = group ? group.color : defaultColor;
            const emoji = group && group.emoji ? group.emoji + ' ' : '';
            const isMultiDay = this.eventSpansMultipleDays(e);
            const isStart = e.date === `${this.currentDate.getFullYear()}-${String(this.currentDate.getMonth()+1).padStart(2,'0')}-${String(this.currentDate.getDate()).padStart(2,'0')}`;
            const isEnd = (e.endDate || e.date) === `${this.currentDate.getFullYear()}-${String(this.currentDate.getMonth()+1).padStart(2,'0')}-${String(this.currentDate.getDate()).padStart(2,'0')}`;

            let start, end;
            if (isMultiDay && !isStart) {
                start = 0;
                end = 24;
            } else if (isMultiDay && isStart && !isEnd) {
                start = this._parseTime(e.startTime) || 0;
                end = 24;
            } else if (isMultiDay && isStart && isEnd) {
                start = this._parseTime(e.startTime) || 0;
                end = this._parseTime(e.endTime) || 24;
            } else {
                if (!e.startTime && !e.endTime) {
                    // No times -> all-day: occupy the whole day
                    start = 0;
                    end = 24;
                } else {
                    start = this._parseTime(e.startTime) || 0;
                    end = this._parseTime(e.endTime) || Math.min(start + 1, 24);
                }
            }

            let subtitle = '';
            if (isMultiDay) {
                const dateObj = new Date(this.currentDate);
                const endDateObj = new Date(e.endDate || e.date);
                const startDateObj = new Date(e.date);
                if (isStart) {
                    subtitle = `${e.startTime || 'Todo el día'} → ${Utils.formatDate(endDateObj, 'short')}`;
                } else if (isEnd) {
                    subtitle = `${Utils.formatDate(startDateObj, 'short')} → ${e.endTime || 'Todo el día'}`;
                } else {
                    subtitle = `${Utils.formatDate(startDateObj, 'short')} → ${Utils.formatDate(endDateObj, 'short')}`;
                }
            } else {
                subtitle = (e.startTime || e.endTime) ? `${e.startTime || ''} - ${e.endTime || ''}` : 'Todo el día';
            }

            items.push({ color, title: (isMultiDay && !isStart ? '↳ ' : '') + emoji + e.title, subtitle, start, end, type: 'event', id: e.id });
        });
        dayTasks.forEach(t => {
            const color = this.getTaskColor(t.priority);
            const start = this._parseTime(t.dueTime) || 9;
            items.push({ color, title: t.title, subtitle: 'Fecha límite', start, end: start + 1, type: 'task', id: t.id });
        });
        dayExams.forEach(ex => {
            const color = this.getSubjectColor(ex.subject);
            const start = this._parseTime(ex.startTime) || 8;
            const end = this._parseTime(ex.endTime) || start + 1;
            items.push({ color, title: ex.topics || ex.subject, subtitle: [ex.subject, ex.room].filter(Boolean).join(' · '), start, end: Math.max(end, start + 1), type: 'exam', id: ex.id });
        });

        const columns = this._layoutOverlapping(items);

        let html = '<div class="calendar-scroll-container"><div class="calendar-grid-container">';
        html += '<div class="calendar-grid-hours">';
        for (let h = 0; h <= 23; h++) {
            html += `<div class="calendar-grid-hour-label">${String(h).padStart(2, '0')}:00</div>`;
        }
        html += '</div><div class="calendar-grid-body">';
        for (let h = 0; h <= 23; h++) {
            html += `<div class="calendar-grid-row" data-hour="${h}"></div>`;
        }

        columns.forEach(col => {
            col.forEach(ev => {
                const top = ev.start * HOUR_HEIGHT;
                const height = Math.max((ev.end - ev.start) * HOUR_HEIGHT, 20);
                const widthPct = (100 / (ev._totalCols || 1));
                const leftPct = (ev._colIndex || 0) * widthPct;
                const clickAction = ev.type === 'event'
                    ? `CalendarPage.openEventModal('${ev.id}')`
                    : ev.type === 'task'
                        ? `CalendarPage.goToTask('${ev.id}')`
                        : `CalendarPage.goToExam('${ev.id}')`;
                html += `<div class="calendar-event-block" style="top:${top}px; height:${height}px; left:calc(${leftPct}% + 2px); width:calc(${widthPct}% - 4px); background:${ev.color}22; color:${ev.color}; border-left:4px solid ${ev.color};" onclick="${clickAction}">
                    <div class="event-title">${Utils.escapeHTML(ev.title)}</div>
                    ${ev.subtitle ? `<div class="event-time">${Utils.escapeHTML(ev.subtitle)}</div>` : ''}
                </div>`;
            });
        });

        html += '</div></div></div>';
        container.innerHTML = Utils.sanitize(html);
        this._scrollToCurrentTime(container);
    },

    // ============ ALL (TODOS) VIEW ============
    async renderAll(container, title) {
        title.textContent = 'Todos';

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayMs = 1000 * 60 * 60 * 24;
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        const items = [];

        this.events.forEach(e => {
            if (!e.date) return;
            const evDate = new Date(e.date + 'T00:00:00');
            const diff = Math.round((evDate - today) / dayMs);
            if (diff < 0 && !e.repeat && !(e.endDate && e.endDate >= `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`)) return;
            let displayDate;
            if (e.repeat) {
                for (let i = 0; i < 365; i++) {
                    const d = new Date(today);
                    d.setDate(d.getDate() + i);
                    if (this.eventOnDate(e, d)) { displayDate = d; break; }
                }
            } else {
                if (e.endDate && e.endDate >= `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`) {
                    displayDate = today;
                } else {
                    displayDate = evDate;
                }
            }
            if (!displayDate) return;
            const dateStr = `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, '0')}-${String(displayDate.getDate()).padStart(2, '0')}`;
            const group = this.getGroupForEvent(e);
            let subtitle;
            if (this.eventSpansMultipleDays(e)) {
                const sd = new Date(e.date);
                const ed = new Date(e.endDate);
                subtitle = `${Utils.formatDate(sd, 'short')} → ${Utils.formatDate(ed, 'short')}${e.startTime ? ' · ' + e.startTime : ''}`;
            } else {
                subtitle = e.startTime ? `${e.startTime} - ${e.endTime || ''}` : '';
            }
            items.push({
                type: 'event', date: displayDate, dateStr, order: displayDate.getTime(),
                data: e, color: group ? group.color : 'var(--primary)',
                title: e.title, subtitle
            });
        });

        this.tasks.forEach(t => {
            if (!t.dueDate || t.completed) return;
            const due = typeof t.dueDate === 'string' ? t.dueDate : new Date(t.dueDate.seconds ? t.dueDate.seconds * 1000 : t.dueDate).toISOString().split('T')[0];
            const dueDate = new Date(due + 'T00:00:00');
            const diff = Math.round((dueDate - today) / dayMs);
            if (diff < 0 && !t.repeat) return;
            let displayDate = dueDate;
            if (t.repeat) {
                for (let i = 0; i < 365; i++) {
                    const d = new Date(today);
                    d.setDate(d.getDate() + i);
                    const dTasks = this.tasksOnDate(d);
                    if (dTasks.find(dt => dt.id === t.id)) { displayDate = d; break; }
                }
            }
            const dateStr = `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, '0')}-${String(displayDate.getDate()).padStart(2, '0')}`;
            items.push({
                type: 'task', date: displayDate, dateStr, order: displayDate.getTime(),
                data: t, color: this.getTaskColor(t.priority),
                title: t.title, subtitle: t.subject || ''
            });
        });

        this.exams.forEach(ex => {
            if (!ex.date) return;
            const exDate = new Date(ex.date + 'T00:00:00');
            if (exDate < today) return;
            const dateStr = `${exDate.getFullYear()}-${String(exDate.getMonth() + 1).padStart(2, '0')}-${String(exDate.getDate()).padStart(2, '0')}`;
            items.push({
                type: 'exam', date: exDate, dateStr, order: exDate.getTime(),
                data: ex, color: this.getSubjectColor(ex.subject),
                title: ex.topics || ex.subject || 'Examen', subtitle: `${ex.subject || ''} ${ex.startTime ? '· ' + ex.startTime + (ex.endTime ? ' - ' + ex.endTime : '') : ''} ${ex.room ? '· ' + ex.room : ''}`
            });
        });

        items.sort((a, b) => a.order - b.order);

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.calendar + '</div><h3>Sin contenido</h3><p>No hay eventos, tareas ni exámenes próximos</p></div>';
            return;
        }

        const grouped = {};
        items.forEach(item => {
            if (!grouped[item.dateStr]) {
                const d = item.date;
                const diffDays = Math.round((d - today) / dayMs);
                let label;
                if (diffDays === 0) label = 'Hoy';
                else if (diffDays === 1) label = 'Mañana';
                else label = `${dayNames[d.getDay()]}, ${d.getDate()} de ${monthNames[d.getMonth()]}`;
                grouped[item.dateStr] = { label, items: [] };
            }
            grouped[item.dateStr].items.push(item);
        });

        let html = '<div class="todos-list">';
        Object.entries(grouped).forEach(([dateStr, group]) => {
            const events = group.items.filter(i => i.type === 'event');
            const exams = group.items.filter(i => i.type === 'exam');
            const tasks = group.items.filter(i => i.type === 'task');
            const total = group.items.length;
            const isCollapsed = this._collapsedTodos[dateStr];

            html += `<div class="todos-day-group">
                <div class="todos-day-header" onclick="CalendarPage.toggleTodosDay('${dateStr}')">
                    <div class="todos-day-left">
                        <span class="todos-arrow">${isCollapsed
                            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>'
                            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>'}</span>
                        <span class="todos-day-label">${group.label}</span>
                        <span class="todos-day-count">${total}</span>
                    </div>
                </div>`;

            if (!isCollapsed) {
                html += '<div class="todos-day-items">';

                if (events.length > 0) {
                    html += `<div class="todos-section">
                        <div class="todos-section-header">
                            <span class="todos-section-title">Eventos</span>
                            <div class="todos-section-line"></div>
                        </div>`;
                    events.forEach(item => {
                        html += `<div class="todos-item" style="border-left: 3px solid ${item.color};">
                            <div class="todos-item-content">
                                <div class="todos-item-title">${item.title}</div>
                                <div class="todos-item-subtitle">${item.subtitle}</div>
                            </div>
                            <button class="btn-icon btn-sm" onclick="event.stopPropagation(); CalendarPage.openEventModal('${item.data.id}')" title="Editar">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </button>
                        </div>`;
                    });
                    html += '</div>';
                }

                if (exams.length > 0) {
                    html += `<div class="todos-section">
                        <div class="todos-section-header">
                            <span class="todos-section-title">Exámenes</span>
                            <div class="todos-section-line"></div>
                        </div>`;
                    exams.forEach(item => {
                        html += `<div class="todos-item" style="border-left: 3px solid ${item.color};">
                            <div class="todos-item-content">
                                <div class="todos-item-title">${Icons.edit} ${item.title}</div>
                                <div class="todos-item-subtitle">${item.subtitle}</div>
                            </div>
                            <button class="btn-icon btn-sm" onclick="event.stopPropagation(); CalendarPage.goToExam('${item.data.id}')" title="Editar">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </button>
                        </div>`;
                    });
                    html += '</div>';
                }

                if (tasks.length > 0) {
                    html += `<div class="todos-section">
                        <div class="todos-section-header">
                            <span class="todos-section-title">Tareas</span>
                            <div class="todos-section-line"></div>
                        </div>`;
                    tasks.forEach(item => {
                        html += `<div class="todos-item" style="border-left: 3px solid ${item.color};">
                            <div class="todos-item-content">
                                <div class="todos-item-title">${Icons.clipboard} ${item.title}</div>
                                <div class="todos-item-subtitle">${item.subtitle}</div>
                            </div>
                            <button class="btn-icon btn-sm" onclick="event.stopPropagation(); CalendarPage.goToTask('${item.data.id}')" title="Editar">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </button>
                        </div>`;
                    });
                    html += '</div>';
                }

                html += '</div>';
            }

            html += '</div>';
        });

        html += '</div>';
        container.innerHTML = Utils.sanitize(html);
    },
    toggleTodosDay(dateStr) {
        this._collapsedTodos[dateStr] = !this._collapsedTodos[dateStr];
        this.renderCalendar();
    },

    goToTask(taskId) {
        App.loadPage('activities');
        setTimeout(() => {
            if (typeof ActivitiesPage !== 'undefined') {
                ActivitiesPage.switchTab('tasks');
                setTimeout(() => {
                    const task = ActivitiesPage.tasks && ActivitiesPage.tasks.find(t => t.id === taskId);
                    if (task) ActivitiesPage.showEditTaskModal(taskId);
                }, 300);
            }
        }, 200);
    },

    goToExam(examId) {
        App.loadPage('activities');
        setTimeout(() => {
            if (typeof ActivitiesPage !== 'undefined') {
                ActivitiesPage.switchTab('exams');
                setTimeout(() => {
                    const exam = ActivitiesPage.exams && ActivitiesPage.exams.find(e => e.id === examId);
                    if (exam) ActivitiesPage.showEditExamModal(examId);
                }, 300);
            }
        }, 200);
    },

    // ============ EVENT MODAL ============
    _rangePickerDate: null,
    _rangeStart: null,
    _rangeEnd: null,
    _rangeStep: 0,

    _initRangePicker(initialDate, initialEndDate) {
        const d = initialDate || new Date().toISOString().split('T')[0];
        this._rangePickerDate = new Date(d + 'T00:00:00');
        this._rangeStart = initialDate || null;
        this._rangeEnd = (initialEndDate && initialEndDate > initialDate) ? initialEndDate : null;
        this._rangeStep = this._rangeEnd ? 2 : (this._rangeStart ? 1 : 0);
        this._renderRangePicker();
    },

    _renderRangePicker() {
        const container = document.getElementById('range-calendar');
        if (!container) return;
        const year = this._rangePickerDate.getFullYear();
        const month = this._rangePickerDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const startDay = firstDay === 0 ? 6 : firstDay - 1;
        const today = new Date().toISOString().split('T')[0];
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        let html = `<div class="range-picker-header">
            <button class="range-picker-nav" onclick="event.stopPropagation(); CalendarPage._rangeNav(-1)">◀</button>
            <span class="range-picker-title">${monthNames[month]} ${year}</span>
            <button class="range-picker-nav" onclick="event.stopPropagation(); CalendarPage._rangeNav(1)">▶</button>
        </div>`;
        html += '<div class="range-picker-grid">';
        ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].forEach(d => {
            html += `<div class="range-picker-weekday">${d}</div>`;
        });

        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const daysInPrev = new Date(prevYear, prevMonth + 1, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            html += `<div class="range-picker-day other-month">${daysInPrev - i}</div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            let classes = 'range-picker-day';
            if (dateStr === today) classes += ' today';
            if (this._rangeStart && dateStr === this._rangeStart) classes += ' range-start';
            if (this._rangeEnd && dateStr === this._rangeEnd) classes += ' range-end';
            if (this._rangeStart && this._rangeEnd && dateStr > this._rangeStart && dateStr < this._rangeEnd) classes += ' in-range';
            if (this._rangeStart && !this._rangeEnd && this._rangeStep === 1 && dateStr === this._rangeStart) classes += ' range-start';
            html += `<div class="${classes}" onclick="event.stopPropagation(); CalendarPage._rangeSelect('${dateStr}')">${day}</div>`;
        }

        const totalCells = startDay + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remaining; i++) {
            html += `<div class="range-picker-day other-month">${i}</div>`;
        }
        html += '</div>';

        const hint = this._rangeStep === 0 ? 'Toca para seleccionar la fecha' :
                     this._rangeStep === 1 ? 'Toca la fecha de fin' : '';
        const isMultiDay = this._rangeStart && this._rangeEnd && this._rangeStart !== this._rangeEnd;
        const displayText = this._rangeStart ? (isMultiDay ? `${this._rangeStart} → ${this._rangeEnd}` : this._rangeStart) : 'Sin fecha';

        html += `<div class="range-picker-footer">
            <span class="range-picker-hint">${hint}</span>
            <span class="range-picker-selection">${displayText}</span>
            ${isMultiDay ? '<span class="badge badge-primary" style="font-size:10px;">Varios días</span>' : ''}
            ${this._rangeStart ? '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); CalendarPage._rangeClear()" style="font-size:11px;">Limpiar</button>' : ''}
        </div>`;

        container.innerHTML = html;
    },

    _rangeNav(dir) {
        this._rangePickerDate.setMonth(this._rangePickerDate.getMonth() + dir);
        this._renderRangePicker();
    },

    _rangeSelect(dateStr) {
        if (this._rangeStep === 0 || (this._rangeStep === 2 && !this._rangeEnd)) {
            this._rangeStart = dateStr;
            this._rangeEnd = null;
            this._rangeStep = 1;
        } else if (this._rangeStep === 1) {
            if (dateStr < this._rangeStart) {
                this._rangeEnd = this._rangeStart;
                this._rangeStart = dateStr;
            } else {
                this._rangeEnd = dateStr;
            }
            this._rangeStep = 2;
        } else {
            this._rangeStart = dateStr;
            this._rangeEnd = null;
            this._rangeStep = 1;
        }
        this._renderRangePicker();
    },

    _rangeClear() {
        this._rangeStart = null;
        this._rangeEnd = null;
        this._rangeStep = 0;
        this._renderRangePicker();
    },

    openEventModal(eventId) {
        this.editingEvent = eventId ? this.events.find(e => e.id === eventId) : null;
        const isEdit = !!this.editingEvent;
        const ev = this.editingEvent || {};
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayChecks = [1, 2, 3, 4, 5, 6, 0].map(d => {
            const checked = ev.repeatDays && ev.repeatDays.includes(d) ? 'checked' : '';
            return `<label class="day-check"><input type="checkbox" value="${d}" class="repeat-day" ${checked}><span>${dayNames[d]}</span></label>`;
        }).join('');

        const groupOptions = this.groups.map(g => `<option value="${g.id}" ${ev.groupId === g.id ? 'selected' : ''}>${g.emoji ? g.emoji + ' ' : ''}${g.name}</option>`).join('');
        const repeatOptions = ['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'];
        const repeatLabels = { none: 'No repetir', daily: 'Diariamente', weekly: 'Semanalmente', monthly: 'Mensualmente', yearly: 'Anualmente', custom: 'Personalizado' };
        const repeatSelect = repeatOptions.map(r => `<option value="${r}" ${ev.repeat === r ? 'selected' : ''}>${repeatLabels[r]}</option>`).join('');

        const groupEnabled = ev.groupId ? 'yes' : 'no';
        const deleteBtn = isEdit ? `<button class="btn btn-danger btn-sm" onclick="CalendarPage.confirmDeleteEvent('${ev.id}')">Eliminar</button>` : '';

        const bodyHtml = `
            <div class="form-group">
                <label>Título</label>
                <input type="text" id="ev-title" value="${Utils.escapeHTML(ev.title || '')}" placeholder="Nombre del evento" maxlength="100">
            </div>
            <div class="form-group">
                <label>Fecha</label>
                <div class="range-picker" id="range-calendar"></div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Hora inicio</label>
                    <input type="time" id="ev-start" value="${ev.startTime || ''}">
                </div>
                <div class="form-group">
                    <label>Hora fin</label>
                    <input type="time" id="ev-end" value="${ev.endTime || ''}">
                </div>
            </div>
            <div class="form-group">
                <label>¿Agrupar?</label>
                <div class="pill-selector">
                    <button class="pill ${groupEnabled === 'no' ? 'active' : ''}" data-group-toggle="no" onclick="CalendarPage.toggleGroupSection('no')">No</button>
                    <button class="pill ${groupEnabled === 'yes' ? 'active' : ''}" data-group-toggle="yes" onclick="CalendarPage.toggleGroupSection('yes')">Sí</button>
                </div>
            </div>
            <div class="form-group" id="group-select-wrapper" style="display: ${groupEnabled === 'yes' ? 'block' : 'none'};">
                <label>Grupo</label>
                <select id="ev-group"><option value="">Sin grupo</option>${groupOptions}</select>
            </div>
            <div class="form-group">
                <label>Notas</label>
                <textarea id="ev-notes" rows="3" placeholder="Detalles del evento...">${ev.notes || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Repetir</label>
                <select id="ev-repeat" onchange="CalendarPage.toggleRepeatDays()">${repeatSelect}</select>
            </div>
            <div class="form-group" id="repeat-days-wrapper" style="display: ${ev.repeat === 'custom' ? 'flex' : 'none'};">
                ${dayChecks}
            </div>
            <div class="modal-custom-footer">
                ${deleteBtn}
                <div class="modal-footer-right">
                    <button class="btn btn-ghost modal-close" onclick="Utils.closeModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="CalendarPage.saveEvent()">Guardar</button>
                </div>
            </div>`;

        const modal = document.getElementById('modal');
        document.getElementById('modal-title').textContent = isEdit ? 'Editar evento' : 'Añadir evento';
        document.getElementById('modal-body').innerHTML = Utils.sanitize(bodyHtml);
        document.getElementById('modal-confirm').classList.add('hidden');
        document.querySelector('.modal-footer .btn-ghost').classList.add('hidden');
        modal.classList.remove('hidden');

        this._initRangePicker(ev.date, ev.endDate);

        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => { modal.classList.add('hidden'); this.resetModalFooter(); });
        });
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            modal.classList.add('hidden'); this.resetModalFooter();
        });
    },

    resetModalFooter() {
        document.getElementById('modal-confirm').classList.remove('hidden');
        document.querySelector('.modal-footer .btn-ghost').classList.remove('hidden');
    },

    toggleGroupSection(val) {
        document.querySelectorAll('[data-group-toggle]').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-group-toggle="${val}"]`).classList.add('active');
        document.getElementById('group-select-wrapper').style.display = val === 'yes' ? 'block' : 'none';
        if (val === 'no') document.getElementById('ev-group').value = '';
    },

    toggleRepeatDays() {
        const val = document.getElementById('ev-repeat').value;
        document.getElementById('repeat-days-wrapper').style.display = val === 'custom' ? 'flex' : 'none';
    },

    async saveEvent() {
        const title = document.getElementById('ev-title').value.trim();
        const startTime = document.getElementById('ev-start').value;
        const endTime = document.getElementById('ev-end').value;
        const groupId = document.getElementById('ev-group').value || null;
        const notes = document.getElementById('ev-notes').value.trim();
        const repeat = document.getElementById('ev-repeat').value;
        const repeatDays = repeat === 'custom'
            ? Array.from(document.querySelectorAll('.repeat-day:checked')).map(c => parseInt(c.value))
            : [];

        const date = this._rangeStart;
        const endDate = this._rangeEnd && this._rangeEnd > this._rangeStart ? this._rangeEnd : null;

        if (!title) { Utils.showToast('Introduce un título', 'error'); return; }
        if (!date) { Utils.showToast('Selecciona una fecha', 'error'); return; }

        const data = { title, date, endDate, startTime, endTime, groupId, notes, repeat, repeatDays };

        try {
            if (this.editingEvent) {
                await DB.updateEvent(this.editingEvent.id, data);
                Utils.showToast('Evento actualizado', 'success');
            } else {
                await DB.addEvent(data);
                Utils.showToast('Evento creado', 'success');
            }
            document.getElementById('modal').classList.add('hidden');
            this.resetModalFooter();
            await this.renderCalendar();
        } catch (e) {
            Utils.showToast('Error al guardar', 'error');
        }
    },

    confirmDeleteEvent(eventId) {
        const modal = document.getElementById('modal');
        document.getElementById('modal-title').textContent = 'Eliminar evento';
        document.getElementById('modal-body').innerHTML = `
            <p style="text-align: center;">¿Estás seguro de que quieres eliminar este evento?</p>
            <div class="modal-custom-footer">
                <div class="modal-footer-right">
                    <button class="btn btn-ghost modal-close" onclick="Utils.closeModal(); CalendarPage.openEventModal('${eventId}')">Cancelar</button>
                    <button class="btn btn-danger" onclick="CalendarPage.deleteEvent('${eventId}')">Eliminar</button>
                </div>
            </div>`;
        document.getElementById('modal-confirm').classList.add('hidden');
        document.querySelector('.modal-footer .btn-ghost').classList.add('hidden');
    },

    async deleteEvent(id) {
        try {
            await DB.deleteEvent(id);
            Utils.showToast('Evento eliminado', 'success');
            document.getElementById('modal').classList.add('hidden');
            this.resetModalFooter();
            await this.renderCalendar();
        } catch (e) {
            Utils.showToast('Error al eliminar', 'error');
        }
    },

    // ============ GROUP MODAL ============
    openGroupModal() {
        const groupList = this.groups.map(g => `
            <div class="group-list-item">
                <div class="group-list-color" style="background: ${g.color};"></div>
                <span class="group-list-emoji">${g.emoji || ''}</span>
                <span class="group-list-name">${g.name}</span>
                ${g.isDefault ? '<span class="badge badge-ghost" style="margin-left: auto; font-size: 11px;">Por defecto</span>' : ''}
                <button class="btn-icon btn-sm" onclick="CalendarPage.openGroupForm('${g.id}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
            </div>
        `).join('');

        const bodyHtml = `
            <button class="btn btn-primary btn-sm" style="margin-bottom: 16px;" onclick="CalendarPage.openGroupForm()">+ Añadir grupo</button>
            <div class="group-list">${groupList}</div>
            <div class="modal-custom-footer">
                <div class="modal-footer-right">
                    <button class="btn btn-ghost modal-close" onclick="Utils.closeModal()">Cerrar</button>
                </div>
            </div>`;

        const modal = document.getElementById('modal');
        document.getElementById('modal-title').textContent = 'Modificar grupo';
        document.getElementById('modal-body').innerHTML = Utils.sanitize(bodyHtml);
        document.getElementById('modal-confirm').classList.add('hidden');
        document.querySelector('.modal-footer .btn-ghost').classList.add('hidden');
        modal.classList.remove('hidden');

        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => { modal.classList.add('hidden'); this.resetModalFooter(); });
        });
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            modal.classList.add('hidden'); this.resetModalFooter();
        });
    },

    openGroupForm(groupId) {
        this.editingGroup = groupId ? this.groups.find(g => g.id === groupId) : null;
        const isEdit = !!this.editingGroup;
        const gr = this.editingGroup || {};
        const colors = ['#6C5CE7', '#E84393', '#00B894', '#74B9FF', '#E17055', '#FDCB6E'];
        const colorOptions = colors.map(c => `<div class="color-option ${gr.color === c ? 'active' : ''}" style="background: ${c};" data-color="${c}" onclick="CalendarPage.selectGroupColor('${c}')"></div>`).join('');

        const hasEmoji = gr.emoji ? 'yes' : 'no';
        const defaultEmojis = ['📚','📝','🔬','📐','🎨','💻','🎵','🏃','🌍','🧪','📊','✏️','🎓','📐','🧮','📖'];
        const emojiGrid = defaultEmojis.map(e => `<div class="emoji-option ${gr.emoji === e ? 'active' : ''}" onclick="CalendarPage.selectEmoji('${e}')">${e}</div>`).join('');

        const deleteBtn = isEdit && !gr.isDefault ? `<button class="btn btn-danger btn-sm" onclick="CalendarPage.confirmDeleteGroup('${gr.id}')">Eliminar</button>` : '';

        const bodyHtml = `
            <div class="form-group">
                <label>Nombre del grupo</label>
                <input type="text" id="grp-name" value="${gr.name || ''}" placeholder="Nombre del grupo" maxlength="100">
            </div>
            <div class="form-group">
                <label>Color</label>
                <div class="color-options" id="grp-colors">${colorOptions}</div>
                <div class="color-custom">
                    <input type="color" id="grp-color-picker" value="${gr.color || colors[0]}" onchange="CalendarPage.selectGroupColor(this.value)">
                    <span style="font-size: 13px; color: var(--text-secondary);">Color personalizado</span>
                </div>
                <input type="hidden" id="grp-color" value="${gr.color || colors[0]}">
            </div>
            <div class="form-group">
                <label style="font-size: 12px; color: var(--text-muted);">Opcionales</label>
            </div>
            <div class="form-group">
                <label>¿Emoji representativo?</label>
                <div class="pill-selector">
                    <button class="pill ${hasEmoji === 'no' ? 'active' : ''}" data-emoji-toggle="no" onclick="CalendarPage.toggleEmojiSection('no')">No</button>
                    <button class="pill ${hasEmoji === 'yes' ? 'active' : ''}" data-emoji-toggle="yes" onclick="CalendarPage.toggleEmojiSection('yes')">Sí</button>
                </div>
            </div>
            <div class="form-group" id="emoji-select-wrapper" style="display: ${hasEmoji === 'yes' ? 'flex' : 'none'}; flex-wrap: wrap; gap: 6px;">
                ${emojiGrid}
                <input type="text" id="grp-emoji-custom" maxlength="2" placeholder="😀" value="${gr.emoji && !defaultEmojis.includes(gr.emoji) ? gr.emoji : ''}" oninput="CalendarPage.selectCustomEmoji(this.value)" style="width:36px;height:36px;border:2px dashed var(--border);border-radius:var(--radius-sm);background:var(--bg-card);font-size:18px;text-align:center;cursor:pointer;padding:0;">
            </div>
            <input type="hidden" id="grp-emoji" value="${gr.emoji || ''}">
            <div class="modal-custom-footer">
                ${deleteBtn}
                <div class="modal-footer-right">
                    <button class="btn btn-ghost modal-close" onclick="CalendarPage.openGroupModal()">Volver</button>
                    <button class="btn btn-primary" onclick="CalendarPage.saveGroup()">Guardar</button>
                </div>
            </div>`;

        const modal = document.getElementById('modal');
        document.getElementById('modal-title').textContent = isEdit ? 'Editar grupo' : 'Añadir grupo';
        document.getElementById('modal-body').innerHTML = Utils.sanitize(bodyHtml);
        document.getElementById('modal-confirm').classList.add('hidden');
        document.querySelector('.modal-footer .btn-ghost').classList.add('hidden');
        modal.classList.remove('hidden');

        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => { modal.classList.add('hidden'); this.resetModalFooter(); });
        });
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            modal.classList.add('hidden'); this.resetModalFooter();
        });
    },

    selectGroupColor(color) {
        document.querySelectorAll('#grp-colors .color-option').forEach(o => o.classList.remove('active'));
        const match = document.querySelector(`#grp-colors .color-option[data-color="${color}"]`);
        if (match) match.classList.add('active');
        document.getElementById('grp-color').value = color;
        document.getElementById('grp-color-picker').value = color;
    },

    toggleEmojiSection(val) {
        document.querySelectorAll('[data-emoji-toggle]').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-emoji-toggle="${val}"]`).classList.add('active');
        document.getElementById('emoji-select-wrapper').style.display = val === 'yes' ? 'flex' : 'none';
        if (val === 'no') document.getElementById('grp-emoji').value = '';
    },

    selectEmoji(emoji) {
        document.querySelectorAll('.emoji-option').forEach(e => e.classList.remove('active'));
        event.target.classList.add('active');
        document.getElementById('grp-emoji').value = emoji;
        const customInput = document.getElementById('grp-emoji-custom');
        if (customInput) customInput.value = '';
    },

    selectCustomEmoji(emoji) {
        document.querySelectorAll('.emoji-option').forEach(e => e.classList.remove('active'));
        document.getElementById('grp-emoji').value = emoji;
    },

    async saveGroup() {
        const name = document.getElementById('grp-name').value.trim();
        const color = document.getElementById('grp-color').value;
        const emoji = document.getElementById('grp-emoji').value || null;
        if (!name) { Utils.showToast('Introduce un nombre', 'error'); return; }

        const data = { name, color, emoji };

        try {
            if (this.editingGroup) {
                await DB.updateGroup(this.editingGroup.id, data);
                Utils.showToast('Grupo actualizado', 'success');
            } else {
                await DB.addGroup(data);
                Utils.showToast('Grupo creado', 'success');
            }
            this.groups = await DB.getGroups();
            this.events = await DB.getEvents();
            this.openGroupModal();
        } catch (e) {
            Utils.showToast('Error al guardar', 'error');
        }
    },

    confirmDeleteGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        const eventCount = this.events.filter(e => e.groupId === groupId).length;

        const bodyHtml = `
            <p style="text-align: center;">¿Estás seguro de que quieres eliminar el grupo "<strong>${group.name}</strong>"?</p>
            ${eventCount > 0 ? `<p style="color: var(--danger); font-size: 13px; margin-top: 8px; text-align: center;">Se eliminarán ${eventCount} evento(s) asociado(s).</p>` : ''}
            <div class="modal-custom-footer">
                <div class="modal-footer-right">
                    <button class="btn btn-ghost modal-close" onclick="CalendarPage.openGroupForm('${groupId}')">Cancelar</button>
                    <button class="btn btn-danger" onclick="CalendarPage.deleteGroup('${groupId}')">Eliminar</button>
                </div>
            </div>`;

        const modal = document.getElementById('modal');
        document.getElementById('modal-title').textContent = 'Eliminar grupo';
        document.getElementById('modal-body').innerHTML = Utils.sanitize(bodyHtml);
        document.getElementById('modal-confirm').classList.add('hidden');
        document.querySelector('.modal-footer .btn-ghost').classList.add('hidden');
    },

    async deleteGroup(id) {
        try {
            await DB.deleteGroup(id);
            Utils.showToast('Grupo eliminado', 'success');
            this.groups = await DB.getGroups();
            this.events = await DB.getEvents();
            document.getElementById('modal').classList.add('hidden');
            this.resetModalFooter();
            await this.renderCalendar();
        } catch (e) {
            Utils.showToast('Error al eliminar', 'error');
        }
    }
};
