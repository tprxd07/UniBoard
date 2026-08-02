// Calendar Page
const CalendarPage = {
    currentDate: new Date(),
    view: 'month',
    events: [],
    groups: [],
    editingEvent: null,
    editingGroup: null,

    render() {
        return `
        <div class="calendar-page">
            <div class="calendar-topbar">
                <div class="tabs">
                    <button class="tab active" data-view="month">Mes</button>
                    <button class="tab" data-view="week">Semana</button>
                    <button class="tab" data-view="day">Día</button>
                </div>
                <div class="calendar-topbar-right">
                    <div class="calendar-topbar-buttons">
                        <button class="btn btn-ghost btn-sm" id="btn-add-event">+ Añadir evento</button>
                        <button class="btn btn-ghost btn-sm" id="btn-manage-groups">Modificar grupo</button>
                    </div>
                    <button class="btn btn-primary btn-sm" id="cal-today">Hoy</button>
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
        </div>

        <div id="calendar-modal-container"></div>`;
    },

    async init() {
        this.currentDate = new Date();
        await DB.initDefaultGroups();

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
        document.getElementById('btn-add-event').addEventListener('click', () => this.openEventModal());
        document.getElementById('btn-manage-groups').addEventListener('click', () => this.openGroupModal());

        await this.renderCalendar();
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

        try {
            [this.events, this.groups] = await Promise.all([
                DB.getEvents(),
                DB.getGroups()
            ]);
        } catch (e) {
            console.error('Error loading calendar data:', e);
        }

        if (this.view === 'month') {
            this.renderMonth(container, title);
        } else if (this.view === 'week') {
            this.renderWeek(container, title);
        } else {
            this.renderDay(container, title);
        }
    },

    getGroupForEvent(event) {
        if (!event.groupId) return null;
        return this.groups.find(g => g.id === event.groupId);
    },

    eventOnDate(event, date) {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        if (event.repeat === 'daily') return true;
        if (event.repeat === 'weekly') return event.repeatDays && event.repeatDays.includes(date.getDay());
        if (event.repeat === 'monthly') {
            const eventDate = new Date(event.date);
            return date.getDate() === eventDate.getDate();
        }
        if (event.repeat === 'yearly') {
            const eventDate = new Date(event.date);
            return date.getDate() === eventDate.getDate() && date.getMonth() === eventDate.getMonth();
        }
        if (event.repeat === 'custom') {
            return event.repeatDays && event.repeatDays.includes(date.getDay());
        }
        return event.date === dateStr;
    },

    eventsOnDate(date) {
        return this.events.filter(e => this.eventOnDate(e, date));
    },

    renderMonth(container, title) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        title.textContent = `${Utils.getMonthName(this.currentDate)} ${year}`;

        const daysInMonth = Utils.getDaysInMonth(year, month);
        const firstDay = Utils.getFirstDayOfMonth(year, month);
        const startDay = firstDay === 0 ? 6 : firstDay - 1;

        let html = '<div class="calendar-grid">';
        ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(d => {
            html += `<div class="calendar-day-header">${d}</div>`;
        });

        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = Utils.getDaysInMonth(prevYear, prevMonth);

        for (let i = startDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            html += `<div class="calendar-day other-month">${day}</div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const date = new Date(year, month, day);
            const isToday = Utils.isToday(date);
            const dayEvents = this.eventsOnDate(date);

            let classes = 'calendar-day';
            if (isToday) classes += ' today';

            let eventsHtml = '';
            dayEvents.forEach(e => {
                const group = this.getGroupForEvent(e);
                const color = group ? group.color : 'var(--primary)';
                const emoji = group && group.emoji ? group.emoji + ' ' : '';
                eventsHtml += `<div class="calendar-event" style="background: ${color}20; color: ${color}; border-left: 3px solid ${color};" title="${e.title}">
                    <span class="calendar-event-text">${emoji}${e.title}</span>
                    <button class="calendar-event-edit" onclick="event.stopPropagation(); CalendarPage.openEventModal('${e.id}')">✏️</button>
                </div>`;
            });

            html += `<div class="${classes}" data-date="${dateStr}"><div class="calendar-day-number">${day}</div><div class="calendar-day-events">${eventsHtml}</div></div>`;
        }

        const totalCells = startDay + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remaining; i++) {
            html += `<div class="calendar-day other-month">${i}</div>`;
        }

        html += '</div>';
        container.innerHTML = html;
    },

    renderWeek(container, title) {
        const weekStart = Utils.getStartOfWeek(this.currentDate);
        const weekEnd = Utils.addDays(weekStart, 6);
        title.textContent = `${Utils.formatDate(weekStart, 'short')} - ${Utils.formatDate(weekEnd, 'short')}`;

        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(Utils.addDays(weekStart, i));
        }

        const hours = [];
        for (let h = 0; h <= 23; h++) hours.push(h);

        let html = '<div class="calendar-scroll-container"><div class="table-container"><table class="table"><thead><tr><th>Hora</th>';
        days.forEach(d => {
            const isToday = Utils.isToday(d);
            html += `<th style="${isToday ? 'color: var(--primary); font-weight: 700;' : ''}">${Utils.getDayName(d, true)} ${d.getDate()}</th>`;
        });
        html += '</tr></thead><tbody>';

        hours.forEach(h => {
            html += `<tr><td style="font-weight: 600;">${String(h).padStart(2, '0')}:00</td>`;
            days.forEach(d => {
                const hourEvents = this.eventsOnDate(d).filter(e => {
                    if (!e.startTime) return false;
                    const [eh] = e.startTime.split(':').map(Number);
                    return eh === h;
                });
                html += '<td style="padding: 4px;">';
                hourEvents.forEach(e => {
                    const group = this.getGroupForEvent(e);
                    const color = group ? group.color : 'var(--primary)';
                    const emoji = group && group.emoji ? group.emoji + ' ' : '';
                    html += `<div class="calendar-event-inline" style="background: ${color}20; color: ${color}; padding: 4px 8px; border-radius: 4px; font-size: 11px; margin-bottom: 2px; cursor: pointer; position: relative;" onclick="CalendarPage.openEventModal('${e.id}')">${emoji}${e.title}<button class="calendar-event-edit-inline" onclick="event.stopPropagation(); CalendarPage.openEventModal('${e.id}')">✏️</button></div>`;
                });
                html += '</td>';
            });
            html += '</tr>';
        });

        html += '</tbody></table></div></div>';
        container.innerHTML = html;
    },

    renderDay(container, title) {
        title.textContent = Utils.formatDate(this.currentDate, 'long');
        const dayEvents = this.eventsOnDate(this.currentDate);
        const hours = [];
        for (let h = 0; h <= 23; h++) hours.push(h);

        let html = '<div class="calendar-scroll-container"><div class="table-container"><table class="table"><thead><tr><th>Hora</th><th>Eventos</th></tr></thead><tbody>';

        hours.forEach(h => {
            const hourEvents = dayEvents.filter(e => {
                if (!e.startTime) return false;
                const [eh] = e.startTime.split(':').map(Number);
                return eh === h;
            });
            html += `<tr><td style="font-weight: 600; white-space: nowrap;">${String(h).padStart(2, '0')}:00</td>`;
            html += '<td style="padding: 4px;">';
            hourEvents.forEach(e => {
                const group = this.getGroupForEvent(e);
                const color = group ? group.color : 'var(--primary)';
                const emoji = group && group.emoji ? group.emoji + ' ' : '';
                html += `<div class="calendar-event-inline" style="background: ${color}20; color: ${color}; padding: 6px 10px; border-radius: 6px; font-size: 12px; margin-bottom: 4px; cursor: pointer; position: relative;" onclick="CalendarPage.openEventModal('${e.id}')">${emoji}${e.title} (${e.startTime} - ${e.endTime || ''})<button class="calendar-event-edit-inline" onclick="event.stopPropagation(); CalendarPage.openEventModal('${e.id}')">✏️</button></div>`;
            });
            html += '</td></tr>';
        });

        html += '</tbody></table></div></div>';
        container.innerHTML = html;
    },

    // ============ EVENT MODAL ============
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

        const html = `
        <div class="modal-overlay" onclick="CalendarPage.closeModal()"></div>
        <div class="modal-content modal-lg">
            <div class="modal-header">
                <h3>${isEdit ? 'Editar evento' : 'Añadir evento'}</h3>
                <button class="btn-icon modal-close" onclick="CalendarPage.closeModal()">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" id="ev-title" value="${ev.title || ''}" placeholder="Nombre del evento" ${isEdit ? '' : ''}>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha</label>
                        <input type="date" id="ev-date" value="${ev.date || ''}">
                    </div>
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
            </div>
            <div class="modal-footer">
                ${deleteBtn}
                <div class="modal-footer-right">
                    <button class="btn btn-ghost" onclick="CalendarPage.closeModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="CalendarPage.saveEvent()">Guardar</button>
                </div>
            </div>
        </div>`;

        document.getElementById('calendar-modal-container').innerHTML = html;
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
        const date = document.getElementById('ev-date').value;
        const startTime = document.getElementById('ev-start').value;
        const endTime = document.getElementById('ev-end').value;
        const groupId = document.getElementById('ev-group').value || null;
        const notes = document.getElementById('ev-notes').value.trim();
        const repeat = document.getElementById('ev-repeat').value;
        const repeatDays = repeat === 'custom'
            ? Array.from(document.querySelectorAll('.repeat-day:checked')).map(c => parseInt(c.value))
            : [];

        if (!title) { Utils.showToast('Introduce un título', 'error'); return; }
        if (!date) { Utils.showToast('Introduce una fecha', 'error'); return; }

        const data = { title, date, startTime, endTime, groupId, notes, repeat, repeatDays };

        try {
            if (this.editingEvent) {
                await DB.updateEvent(this.editingEvent.id, data);
                Utils.showToast('Evento actualizado', 'success');
            } else {
                await DB.addEvent(data);
                Utils.showToast('Evento creado', 'success');
            }
            this.closeModal();
            await this.renderCalendar();
        } catch (e) {
            Utils.showToast('Error al guardar', 'error');
        }
    },

    confirmDeleteEvent(eventId) {
        const html = `
        <div class="modal-overlay" onclick="CalendarPage.closeModal()"></div>
        <div class="modal-content modal-sm">
            <div class="modal-header">
                <h3>Eliminar evento</h3>
                <button class="btn-icon modal-close" onclick="CalendarPage.closeModal()">✕</button>
            </div>
            <div class="modal-body" style="text-align: center;">
                <p>¿Estás seguro de que quieres eliminar este evento?</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="CalendarPage.closeModal()">Cancelar</button>
                <button class="btn btn-danger" onclick="CalendarPage.deleteEvent('${eventId}')">Eliminar</button>
            </div>
        </div>`;
        document.getElementById('calendar-modal-container').innerHTML = html;
    },

    async deleteEvent(id) {
        try {
            await DB.deleteEvent(id);
            Utils.showToast('Evento eliminado', 'success');
            this.closeModal();
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
                <button class="btn-icon btn-sm" onclick="CalendarPage.openGroupForm('${g.id}')">✏️</button>
            </div>
        `).join('');

        const html = `
        <div class="modal-overlay" onclick="CalendarPage.closeModal()"></div>
        <div class="modal-content modal-lg">
            <div class="modal-header">
                <h3>Modificar grupo</h3>
                <button class="btn-icon modal-close" onclick="CalendarPage.closeModal()">✕</button>
            </div>
            <div class="modal-body">
                <button class="btn btn-primary btn-sm" style="margin-bottom: 16px;" onclick="CalendarPage.openGroupForm()">+ Añadir grupo</button>
                <div class="group-list">${groupList}</div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="CalendarPage.closeModal()">Cerrar</button>
            </div>
        </div>`;

        document.getElementById('calendar-modal-container').innerHTML = html;
    },

    openGroupForm(groupId) {
        this.editingGroup = groupId ? this.groups.find(g => g.id === groupId) : null;
        const isEdit = !!this.editingGroup;
        const gr = this.editingGroup || {};
        const colors = ['#6C5CE7', '#E84393', '#00B894', '#74B9FF', '#E17055', '#FDCB6E'];
        const colorOptions = colors.map(c => `<div class="color-option ${gr.color === c ? 'active' : ''}" style="background: ${c};" data-color="${c}" onclick="CalendarPage.selectGroupColor('${c}')"></div>`).join('');

        const hasEmoji = gr.emoji ? 'yes' : 'no';
        const emojis = ['📚', '🎉', '🎂', '💪', '❤️', '⭐', '🔥', '🎯', '✈️', '🏃', '🎵', '💡', '📌', '🏆', '🌟', '🎓'];
        const emojiGrid = emojis.map(e => `<button class="emoji-option ${gr.emoji === e ? 'active' : ''}" onclick="CalendarPage.selectEmoji('${e}')">${e}</button>`).join('');

        const repeatOptions = ['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'];
        const repeatLabels = { none: 'No repetir', daily: 'Diariamente', weekly: 'Semanalmente', monthly: 'Mensualmente', yearly: 'Anualmente', custom: 'Personalizado' };
        const repeatSelect = repeatOptions.map(r => `<option value="${r}" ${gr.defaultRepeat === r ? 'selected' : ''}>${repeatLabels[r]}</option>`).join('');

        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayChecks = [1, 2, 3, 4, 5, 6, 0].map(d => {
            const checked = gr.defaultRepeatDays && gr.defaultRepeatDays.includes(d) ? 'checked' : '';
            return `<label class="day-check"><input type="checkbox" value="${d}" class="group-repeat-day" ${checked}><span>${dayNames[d]}</span></label>`;
        }).join('');

        const deleteBtn = isEdit && !gr.isDefault ? `<button class="btn btn-danger btn-sm" onclick="CalendarPage.confirmDeleteGroup('${gr.id}')">Eliminar</button>` : '';

        const html = `
        <div class="modal-overlay" onclick="CalendarPage.closeModal()"></div>
        <div class="modal-content modal-lg">
            <div class="modal-header">
                <h3>${isEdit ? 'Editar grupo' : 'Añadir grupo'}</h3>
                <button class="btn-icon modal-close" onclick="CalendarPage.closeModal()">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Nombre del grupo</label>
                    <input type="text" id="grp-name" value="${gr.name || ''}" placeholder="Nombre del grupo">
                </div>
                <div class="form-group">
                    <label>Color</label>
                    <div class="color-options" id="grp-colors">${colorOptions}</div>
                    <input type="hidden" id="grp-color" value="${gr.color || colors[0]}">
                </div>
                <div class="form-group">
                    <label>Opcionales</label>
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
                </div>
                <input type="hidden" id="grp-emoji" value="${gr.emoji || ''}">
                <div class="form-group">
                    <label>Repetición por defecto</label>
                    <select id="grp-repeat" onchange="CalendarPage.toggleGroupRepeatDays()">${repeatSelect}</select>
                </div>
                <div class="form-group" id="group-repeat-days-wrapper" style="display: ${gr.defaultRepeat === 'custom' ? 'flex' : 'none'};">
                    ${dayChecks}
                </div>
            </div>
            <div class="modal-footer">
                ${deleteBtn}
                <div class="modal-footer-right">
                    <button class="btn btn-ghost" onclick="CalendarPage.openGroupModal()">Volver</button>
                    <button class="btn btn-primary" onclick="CalendarPage.saveGroup()">Guardar</button>
                </div>
            </div>
        </div>`;

        document.getElementById('calendar-modal-container').innerHTML = html;
    },

    selectGroupColor(color) {
        document.querySelectorAll('#grp-colors .color-option').forEach(o => o.classList.remove('active'));
        document.querySelector(`#grp-colors .color-option[data-color="${color}"]`).classList.add('active');
        document.getElementById('grp-color').value = color;
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
    },

    toggleGroupRepeatDays() {
        const val = document.getElementById('grp-repeat').value;
        document.getElementById('group-repeat-days-wrapper').style.display = val === 'custom' ? 'flex' : 'none';
    },

    async saveGroup() {
        const name = document.getElementById('grp-name').value.trim();
        const color = document.getElementById('grp-color').value;
        const emoji = document.getElementById('grp-emoji').value || null;
        const defaultRepeat = document.getElementById('grp-repeat').value;
        const defaultRepeatDays = defaultRepeat === 'custom'
            ? Array.from(document.querySelectorAll('.group-repeat-day:checked')).map(c => parseInt(c.value))
            : [];

        if (!name) { Utils.showToast('Introduce un nombre', 'error'); return; }

        const data = { name, color, emoji, defaultRepeat, defaultRepeatDays };

        try {
            if (this.editingGroup) {
                await DB.updateGroup(this.editingGroup.id, data);
                const events = this.events.filter(e => e.groupId === this.editingGroup.id);
                for (const e of events) {
                    await DB.updateEvent(e.id, { groupId: e.groupId });
                }
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
        const html = `
        <div class="modal-overlay" onclick="CalendarPage.closeModal()"></div>
        <div class="modal-content modal-sm">
            <div class="modal-header">
                <h3>Eliminar grupo</h3>
                <button class="btn-icon modal-close" onclick="CalendarPage.closeModal()">✕</button>
            </div>
            <div class="modal-body" style="text-align: center;">
                <p>¿Estás seguro de que quieres eliminar el grupo "<strong>${group.name}</strong>"?</p>
                ${eventCount > 0 ? `<p style="color: var(--danger); font-size: 13px; margin-top: 8px;">Se eliminarán ${eventCount} evento(s) asociado(s).</p>` : ''}
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="CalendarPage.openGroupForm('${groupId}')">Cancelar</button>
                <button class="btn btn-danger" onclick="CalendarPage.deleteGroup('${groupId}')">Eliminar</button>
            </div>
        </div>`;
        document.getElementById('calendar-modal-container').innerHTML = html;
    },

    async deleteGroup(id) {
        try {
            await DB.deleteGroup(id);
            Utils.showToast('Grupo eliminado', 'success');
            this.groups = await DB.getGroups();
            this.events = await DB.getEvents();
            this.closeModal();
            await this.renderCalendar();
        } catch (e) {
            Utils.showToast('Error al eliminar', 'error');
        }
    },

    closeModal() {
        document.getElementById('calendar-modal-container').innerHTML = '';
    }
};
