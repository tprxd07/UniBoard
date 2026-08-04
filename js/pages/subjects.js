// Subjects Page
const SubjectsPage = {
    subjects: [],
    selectedSubject: null,

    render() {
        return `
        <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
            <button class="btn btn-primary btn-sm" id="add-subject-btn">+ Añadir</button>
        </div>
        <div id="subjects-grid" class="grid-3"></div>`;
    },

    init() {
        document.getElementById('add-subject-btn').addEventListener('click', () => this.showAddModal());
        this.loadSubjects();
    },

    async loadSubjects() {
        try {
            this.subjects = await DB.getSubjects();
            this.renderGrid();
        } catch (e) {
            console.error('Error loading subjects:', e);
        }
    },

    renderGrid() {
        const grid = document.getElementById('subjects-grid');

        if (this.subjects.length === 0) {
            grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><h3>No tienes asignaturas</h3><p>Añade tu primera asignatura para empezar</p></div>';
            return;
        }

        grid.innerHTML = this.subjects.map(s => {
            const periodLabel = this.getPeriodLabel(s);
            return `
            <div class="subject-card" onclick="SubjectsPage.showDetail('${s.id}')">
                <div class="subject-card-header">
                    <div class="subject-color" style="background: ${s.color || '#6C5CE7'};"></div>
                    <span class="badge badge-primary">${s.credits || 0} créditos</span>
                </div>
                <h4>${s.name}</h4>
                <p style="font-size: 12px; color: var(--text-secondary);">${s.professors && s.professors.length > 0 ? s.professors.join(', ') : (s.professor || 'Sin profesor')}</p>
                ${periodLabel ? `<p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${periodLabel}</p>` : ''}
            </div>`;
        }).join('');
    },

    getPeriodLabel(s) {
        if (!s.periodType) return '';
        const typeLabel = s.periodType === 'trimestre' ? 'Trimestre' : 'Cuatrimestre';
        return s.periodNumber ? `${typeLabel} ${s.periodNumber}` : typeLabel;
    },

    showAddModal(subject = null) {
        const isEdit = !!subject;
        const s = subject || {};
        const professors = (s.professors && s.professors.length > 0) ? s.professors.join(', ') : (s.professor || '');

        const presetColors = ['#6C5CE7','#00B894','#E17055','#74B9FF','#FDCB6E','#FD79A8','#00CEC9','#A29BFE','#FF6B6B','#48DBFB','#FF9FF3','#54A0FF'];
        const currentColor = s.color || '#6C5CE7';
        const isPreset = presetColors.includes(currentColor);

        const html = `
            <div class="form-group">
                <label>Nombre</label>
                <input type="text" id="subj-name" value="${s.name || ''}" placeholder="Ej: Matemáticas II">
            </div>
            <div class="form-group">
                <label>Profesores (separados por coma)</label>
                <input type="text" id="subj-professors" value="${professors}" placeholder="Ej: Juan Pérez, María López">
            </div>
            <div class="form-group">
                <label>Aula</label>
                <input type="text" id="subj-room" value="${s.room || ''}" placeholder="Ej: Aula 301">
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Créditos</label>
                    <input type="number" id="subj-credits" value="${s.credits || ''}" placeholder="6">
                </div>
                <div class="form-group">
                    <label>Período</label>
                    <select id="subj-period-type">
                        <option value="">Ninguno</option>
                        <option value="trimestre" ${s.periodType === 'trimestre' ? 'selected' : ''}>Trimestre</option>
                        <option value="cuatrimestre" ${s.periodType === 'cuatrimestre' ? 'selected' : ''}>Cuatrimestre</option>
                    </select>
                </div>
            </div>
            <div class="form-group" id="period-number-group" style="${s.periodType ? '' : 'display:none;'}">
                <label>Número de período</label>
                <select id="subj-period-number">
                    <option value="">—</option>
                    <option value="1" ${s.periodNumber == '1' ? 'selected' : ''}>Primero</option>
                    <option value="2" ${s.periodNumber == '2' ? 'selected' : ''}>Segundo</option>
                    <option value="3" ${s.periodNumber == '3' ? 'selected' : ''}>Tercero</option>
                </select>
            </div>
            <div class="form-group">
                <label>Guía docente (URL)</label>
                <input type="url" id="subj-guide" value="${s.guideUrl || ''}" placeholder="https://...">
            </div>
            <div class="form-group">
                <label>Color</label>
                <div class="color-options" id="subj-colors">
                    ${presetColors.map(c =>
                        `<div class="color-option ${currentColor === c ? 'active' : ''}"
                              style="background: ${c};"
                              onclick="document.querySelectorAll('#subj-colors .color-option').forEach(e=>e.classList.remove('active')); this.classList.add('active');"
                              data-color="${c}"></div>`
                    ).join('')}
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                    <label style="font-size: 12px; color: var(--text-secondary);">Custom:</label>
                    <input type="color" id="subj-color-picker" value="${isPreset ? '#6C5CE7' : currentColor}"
                        style="width: 32px; height: 32px; border: none; border-radius: 50%; cursor: pointer; padding: 0;">
                </div>
            </div>`;

        Utils.showModal(isEdit ? 'Editar Asignatura' : 'Nueva Asignatura', html, async () => {
            const pickerVal = document.getElementById('subj-color-picker').value;
            const activeColor = document.querySelector('#subj-colors .color-option.active');
            const color = activeColor ? activeColor.dataset.color : pickerVal;

            const professorsStr = document.getElementById('subj-professors').value;
            const professorsList = professorsStr.split(',').map(p => p.trim()).filter(p => p);

            const data = {
                name: document.getElementById('subj-name').value,
                professor: professorsList[0] || '',
                professors: professorsList,
                room: document.getElementById('subj-room').value,
                credits: parseInt(document.getElementById('subj-credits').value) || 0,
                periodType: document.getElementById('subj-period-type').value || null,
                periodNumber: document.getElementById('subj-period-number').value || null,
                guideUrl: document.getElementById('subj-guide').value,
                color: color
            };

            if (!data.name) {
                Utils.showToast('El nombre es obligatorio', 'error');
                return;
            }

            try {
                if (isEdit) {
                    await DB.updateSubject(subject.id, data);
                    Utils.showToast('Asignatura actualizada', 'success');
                } else {
                    await DB.addSubject(data);
                    Utils.showToast('Asignatura añadida', 'success');
                }
                this.loadSubjects();
            } catch (e) {
                Utils.showToast('Error al guardar', 'error');
            }
        });

        // Toggle period number visibility
        const periodType = document.getElementById('subj-period-type');
        periodType.addEventListener('change', () => {
            document.getElementById('period-number-group').style.display = periodType.value ? '' : 'none';
        });

        // Color picker deselects preset colors
        document.getElementById('subj-color-picker').addEventListener('input', (e) => {
            document.querySelectorAll('#subj-colors .color-option').forEach(o => o.classList.remove('active'));
        });
    },

    async showDetail(id) {
        const subject = this.subjects.find(s => s.id === id);
        if (!subject) return;
        this.selectedSubject = subject;

        const periodLabel = this.getPeriodLabel(subject) || '—';
        const profList = (subject.professors && subject.professors.length > 0) ? subject.professors : (subject.professor ? [subject.professor] : []);

        const html = `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <div style="width: 16px; height: 16px; border-radius: 50%; background: ${subject.color};"></div>
                <h3 style="font-size: 20px;">${subject.name}</h3>
            </div>
            <div class="grid-2" style="gap: 12px;">
                <div class="stat-card">
                    <div class="stat-icon purple">👨‍🏫</div>
                    <div class="stat-info">
                        <h4 style="font-size: 14px;">${profList.length > 0 ? profList.join(', ') : '—'}</h4>
                        <p>Profesor${profList.length > 1 ? 'es' : ''}</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">🏫</div>
                    <div class="stat-info">
                        <h4 style="font-size: 14px;">${subject.room || '—'}</h4>
                        <p>Aula</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue">📅</div>
                    <div class="stat-info">
                        <h4 style="font-size: 14px;">${periodLabel}</h4>
                        <p>Período</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">📜</div>
                    <div class="stat-info">
                        <h4 style="font-size: 14px;">${subject.credits || 0}</h4>
                        <p>Créditos</p>
                    </div>
                </div>
            </div>
        </div>

        ${subject.guideUrl ? `<a href="${subject.guideUrl}" target="_blank" class="btn btn-ghost btn-full" style="margin-top: 8px;">📄 Ver guía docente</a>` : ''}

        <div style="display: flex; gap: 8px; margin-top: 16px;">
            <button class="btn btn-ghost" style="flex: 1;" onclick="SubjectsPage.showAddModal(SubjectsPage.selectedSubject); Utils.closeModal();"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> Editar</button>
            <button class="btn btn-danger" style="flex: 1;" onclick="SubjectsPage.deleteSubject('${id}')">🗑️ Eliminar</button>
        </div>`;

        Utils.showModal(subject.name, html);
    },

    async deleteSubject(id) {
        if (confirm('¿Eliminar esta asignatura?')) {
            try {
                await DB.deleteSubject(id);
                Utils.showToast('Asignatura eliminada', 'success');
                Utils.closeModal();
                this.loadSubjects();
            } catch (e) {
                Utils.showToast('Error al eliminar', 'error');
            }
        }
    }
};
