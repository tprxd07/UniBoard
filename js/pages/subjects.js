// Subjects Page
const SubjectsPage = {
    subjects: [],
    selectedSubject: null,

    render() {
        return `
        <div class="section-header">
            <span class="section-title">Mis Asignaturas</span>
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

        grid.innerHTML = this.subjects.map((s, i) => `
            <div class="subject-card" onclick="SubjectsPage.showDetail('${s.id}')">
                <div class="subject-card-header">
                    <div class="subject-color" style="background: ${s.color || Utils.getSubjectColor(i)};"></div>
                    <span class="badge badge-primary">${s.credits || 0} créditos</span>
                </div>
                <h4>${s.name}</h4>
                <p>${s.professor || 'Sin profesor'}</p>
                <div class="subject-grade">
                    <span style="color: ${Utils.getGradeColor(s.currentGrade || 0)}">${(s.currentGrade || 0).toFixed(1)}</span>
                    <span style="font-size: 12px; color: var(--text-secondary);">Nota actual</span>
                </div>
            </div>
        `).join('');
    },

    showAddModal(subject = null) {
        const isEdit = !!subject;
        const html = `
            <div class="form-group">
                <label>Nombre</label>
                <input type="text" id="subj-name" value="${subject?.name || ''}" placeholder="Ej: Matemáticas II">
            </div>
            <div class="form-group">
                <label>Profesor</label>
                <input type="text" id="subj-professor" value="${subject?.professor || ''}" placeholder="Nombre del profesor">
            </div>
            <div class="form-group">
                <label>Aula</label>
                <input type="text" id="subj-room" value="${subject?.room || ''}" placeholder="Ej: Aula 301">
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Créditos</label>
                    <input type="number" id="subj-credits" value="${subject?.credits || ''}" placeholder="6">
                </div>
                <div class="form-group">
                    <label>Nota actual</label>
                    <input type="number" id="subj-grade" value="${subject?.currentGrade || ''}" placeholder="7.5" step="0.1" min="0" max="10">
                </div>
            </div>
            <div class="form-group">
                <label>Guía docente (URL)</label>
                <input type="url" id="subj-guide" value="${subject?.guideUrl || ''}" placeholder="https://...">
            </div>
            <div class="form-group">
                <label>Color</label>
                <div class="color-options" id="subj-colors">
                    ${['#6C5CE7','#00B894','#E17055','#74B9FF','#FDCB6E','#FD79A8','#00CEC9','#A29BFE'].map(c =>
                        `<div class="color-option ${(subject?.color || '#6C5CE7') === c ? 'active' : ''}"
                              style="background: ${c};"
                              onclick="document.querySelectorAll('#subj-colors .color-option').forEach(e=>e.classList.remove('active')); this.classList.add('active');"
                              data-color="${c}"></div>`
                    ).join('')}
                </div>
            </div>`;

        Utils.showModal(isEdit ? 'Editar Asignatura' : 'Nueva Asignatura', html, async () => {
            const colorEl = document.querySelector('#subj-colors .color-option.active');
            const data = {
                name: document.getElementById('subj-name').value,
                professor: document.getElementById('subj-professor').value,
                room: document.getElementById('subj-room').value,
                credits: parseInt(document.getElementById('subj-credits').value) || 0,
                currentGrade: parseFloat(document.getElementById('subj-grade').value) || 0,
                guideUrl: document.getElementById('subj-guide').value,
                color: colorEl?.dataset.color || '#6C5CE7'
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
    },

    async showDetail(id) {
        const subject = this.subjects.find(s => s.id === id);
        if (!subject) return;
        this.selectedSubject = subject;

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
                        <h4 style="font-size: 14px;">${subject.professor || '—'}</h4>
                        <p>Profesor</p>
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
                    <div class="stat-icon blue">📊</div>
                    <div class="stat-info">
                        <h4 style="font-size: 14px;">${(subject.currentGrade || 0).toFixed(1)}</h4>
                        <p>Nota actual</p>
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

        <div style="margin-bottom: 16px;">
            <h4 style="font-size: 14px; margin-bottom: 8px; color: var(--text-secondary);">Calculadora de nota final</h4>
            <div id="grade-calculator">
                <div id="grade-inputs"></div>
                <button class="btn btn-ghost btn-sm" onclick="SubjectsPage.addGradeInput()">+ Añadir evaluación</button>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); display: flex; justify-content: space-between;">
                    <span style="font-weight: 600;">Nota final:</span>
                    <span id="final-grade" style="font-weight: 700; color: var(--primary); font-size: 18px;">—</span>
                </div>
            </div>
        </div>

        ${subject.guideUrl ? `<a href="${subject.guideUrl}" target="_blank" class="btn btn-ghost btn-full" style="margin-top: 8px;">📄 Ver guía docente</a>` : ''}

        <div style="display: flex; gap: 8px; margin-top: 16px;">
            <button class="btn btn-ghost" style="flex: 1;" onclick="SubjectsPage.showAddModal(SubjectsPage.selectedSubject); Utils.closeModal();">✏️ Editar</button>
            <button class="btn btn-danger" style="flex: 1;" onclick="SubjectsPage.deleteSubject('${id}')">🗑️ Eliminar</button>
        </div>`;

        Utils.showModal(subject.name, html);

        // Initialize grade calculator
        this.initGradeCalculator();
    },

    gradeInputs: [],

    addGradeInput(name = '', grade = '', weight = '') {
        const id = Utils.generateId();
        this.gradeInputs.push({ id, name, grade, weight });
        this.renderGradeInputs();
    },

    initGradeCalculator() {
        this.gradeInputs = [];
        this.addGradeInput('Evaluación 1', '', '');
    },

    renderGradeInputs() {
        const container = document.getElementById('grade-inputs');
        if (!container) return;

        container.innerHTML = this.gradeInputs.map(g => `
            <div style="display: grid; grid-template-columns: 1fr 80px 80px 30px; gap: 8px; margin-bottom: 8px; align-items: center;">
                <input type="text" value="${g.name}" placeholder="Nombre" style="padding: 8px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; background: var(--bg-input); color: var(--text);"
                    onchange="SubjectsPage.updateGrade('${g.id}', 'name', this.value)">
                <input type="number" value="${g.grade}" placeholder="Nota" min="0" max="10" step="0.1" style="padding: 8px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; background: var(--bg-input); color: var(--text);"
                    onchange="SubjectsPage.updateGrade('${g.id}', 'grade', this.value)">
                <input type="number" value="${g.weight}" placeholder="%" min="0" max="100" style="padding: 8px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; background: var(--bg-input); color: var(--text);"
                    onchange="SubjectsPage.updateGrade('${g.id}', 'weight', this.value)">
                <button class="btn-icon" style="font-size: 14px;" onclick="SubjectsPage.removeGrade('${g.id}')">✕</button>
            </div>
        `).join('');

        this.calculateFinalGrade();
    },

    updateGrade(id, field, value) {
        const grade = this.gradeInputs.find(g => g.id === id);
        if (grade) {
            grade[field] = value;
            this.calculateFinalGrade();
        }
    },

    removeGrade(id) {
        this.gradeInputs = this.gradeInputs.filter(g => g.id !== id);
        this.renderGradeInputs();
    },

    calculateFinalGrade() {
        const valid = this.gradeInputs.filter(g => g.grade !== '' && g.weight !== '');
        if (valid.length === 0) {
            document.getElementById('final-grade').textContent = '—';
            return;
        }

        const totalWeight = valid.reduce((sum, g) => sum + parseFloat(g.weight), 0);
        if (totalWeight === 0) {
            document.getElementById('final-grade').textContent = '—';
            return;
        }

        const weightedSum = valid.reduce((sum, g) => sum + (parseFloat(g.grade) * parseFloat(g.weight)), 0);
        const finalGrade = weightedSum / totalWeight;
        document.getElementById('final-grade').textContent = finalGrade.toFixed(2);
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
