// Exams Page
const ExamsPage = {
    exams: [],

    render() {
        const skel = Array.from({length: 3}, () => `
            <div class="skeleton-card" style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
                    <div style="flex:1;">
                        <div class="skeleton skeleton-text-lg" style="width:60%;"></div>
                        <div class="skeleton skeleton-text-sm" style="width:80%;"></div>
                    </div>
                    <div class="skeleton" style="width:50px;height:50px;border-radius:12px;"></div>
                </div>
                <div style="display:flex;gap:12px;">
                    <div class="skeleton" style="flex:1;height:50px;border-radius:8px;"></div>
                    <div class="skeleton" style="flex:1;height:50px;border-radius:8px;"></div>
                </div>
            </div>`).join('');

        return `
        <div class="section-header">
            <span class="section-title">Exámenes</span>
            <button class="btn btn-primary btn-sm" id="add-exam-btn">+ Añadir</button>
        </div>
        <div id="exams-list">${skel}</div>`;
    },

    init() {
        document.getElementById('add-exam-btn').addEventListener('click', () => this.showAddModal());
        this.loadExams();
    },

    async loadExams() {
        try {
            this.exams = await DB.getExams();
            this.renderList();
        } catch (e) {
            console.error('Error loading exams:', e);
        }
    },

    renderList() {
        const container = document.getElementById('exams-list');

        if (this.exams.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.edit + '</div><h3>Sin exámenes</h3><p>Añade tu primer examen</p></div>';
            return;
        }

        // Sort by date
        const sorted = [...this.exams].sort((a, b) => new Date(a.date) - new Date(b.date));

        container.innerHTML = Utils.sanitize(sorted.map(exam => {
            const days = Utils.daysUntil(exam.date);
            const isPast = days < 0;
            const countdown = isPast ? 'Finalizado' : `${days} días`;

            return `
            <div class="exam-card" style="${isPast ? 'opacity: 0.5;' : ''}">
                <div class="exam-card-header">
                    <div>
                        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">${exam.subject || exam.name}</h3>
                        <p style="font-size: 13px; color: var(--text-secondary);">
                            ${Utils.formatDate(exam.date, 'long')} · ${exam.room || 'Sin aula'}
                        </p>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn-icon" style="font-size: 14px;" onclick="ExamsPage.showAddModal(ExamsPage.exams.find(e=>e.id==='${exam.id}'))"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                        <button class="btn-icon" style="font-size: 14px;" onclick="ExamsPage.deleteExam('${exam.id}')">${Icons.trash}</button>
                    </div>
                </div>

                ${!isPast ? `
                <div class="exam-countdown">
                    <div class="days">${days}</div>
                    <div class="label">días restantes</div>
                </div>` : ''}

                <div class="grid-2" style="gap: 12px; margin-top: 12px;">
                    ${exam.percentage ? `
                    <div style="text-align: center; padding: 10px; background: var(--bg-input); border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 700; color: var(--primary);">${exam.percentage}%</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">Peso</div>
                    </div>` : ''}
                    <div style="text-align: center; padding: 10px; background: var(--bg-input); border-radius: 8px;">
                        <div style="font-size: 20px; font-weight: 700; color: ${exam.grade != null ? Utils.getGradeColor(exam.grade) : 'var(--text-secondary)'};">${exam.grade != null ? exam.grade.toFixed(2) : '-.--'}</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">Nota</div>
                    </div>
                    ${exam.topics ? `
                    <div style="padding: 10px; background: var(--bg-input); border-radius: 8px; grid-column: 1 / -1;">
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Temario:</div>
                        <div style="font-size: 13px;">${exam.topics}</div>
                    </div>` : ''}
                </div>

                ${exam.studyPlan ? `
                <div style="margin-top: 12px; padding: 12px; background: var(--primary-bg); border-radius: 8px;">
                    <div style="font-size: 12px; color: var(--primary); font-weight: 600; margin-bottom: 4px;">${Icons.clipboard} Plan de estudio:</div>
                    <div style="font-size: 13px;">${exam.studyPlan}</div>
                </div>` : ''}
            </div>`;
        }).join(''));
    },

    showAddModal(exam = null) {
        const isEdit = !!exam;
        const html = `
            <div class="form-group">
                <label>Asignatura</label>
                <input type="text" id="exam-subject" value="${exam?.subject || ''}" placeholder="Nombre de la asignatura" maxlength="100">
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" id="exam-date" value="${exam?.date || ''}">
                </div>
                <div class="form-group">
                    <label>Lugar</label>
                    <input type="text" id="exam-room" value="${exam?.room || ''}" placeholder="Ej: Aula Magna" maxlength="50">
                </div>
            </div>
            <div class="form-group">
                <label>Porcentaje (%)</label>
                <input type="number" id="exam-percentage" value="${exam?.percentage || ''}" placeholder="30" min="0" max="100">
            </div>
            <div class="form-group">
                <label>Nota</label>
                <input type="number" id="exam-grade" value="${exam?.grade != null ? exam.grade : ''}" placeholder="-.--" min="0" max="10" step="0.1">
            </div>
            <div class="form-group">
                <label>Temario</label>
                <textarea id="exam-topics" rows="3" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-input);color:var(--text);font-family:var(--font-family);">${exam?.topics || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Plan de estudio</label>
                <textarea id="exam-study-plan" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-input);color:var(--text);font-family:var(--font-family);">${exam?.studyPlan || ''}</textarea>
            </div>`;

        Utils.showModal(isEdit ? 'Editar Examen' : 'Nuevo Examen', html, async () => {
            const gradeVal = document.getElementById('exam-grade').value;
            const data = {
                subject: document.getElementById('exam-subject').value,
                date: document.getElementById('exam-date').value,
                room: document.getElementById('exam-room').value,
                percentage: parseInt(document.getElementById('exam-percentage').value) || null,
                topics: document.getElementById('exam-topics').value,
                studyPlan: document.getElementById('exam-study-plan').value,
                grade: gradeVal !== '' ? parseFloat(gradeVal) : null
            };

            if (!data.subject || !data.date) {
                Utils.showToast('Asignatura y fecha son obligatorios', 'error');
                return;
            }

            try {
                if (isEdit) {
                    await DB.updateExam(exam.id, data);
                    Utils.showToast('Examen actualizado', 'success');
                } else {
                    await DB.addExam(data);
                    Utils.showToast('Examen añadido', 'success');
                }
                if (data.grade != null) {
                    await this.syncGradeToSubject(data.subject, data.grade);
                }
                this.loadExams();
            } catch (e) {
                Utils.showToast('Error al guardar', 'error');
            }
        });
    },

    async deleteExam(id) {
        if (confirm('¿Eliminar este examen?')) {
            try {
                await DB.deleteExam(id);
                Utils.showToast('Examen eliminado', 'success');
                this.loadExams();
            } catch (e) {
                Utils.showToast('Error al eliminar', 'error');
            }
        }
    },

    async syncGradeToSubject(subjectName, grade) {
        try {
            const subjects = await DB.getSubjects();
            const subject = subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
            if (!subject) return;
            const gt = subject.gradeTable || { items: [], usePeriods: false, periodWeights: [] };
            if (!gt.items) gt.items = [];
            const existingIdx = gt.items.findIndex(i => i.name === subjectName && i.type === 'exam');
            if (existingIdx >= 0) {
                gt.items[existingIdx].grade = grade;
            } else {
                gt.items.push({ name: subjectName, type: 'exam', weight: 0, grade: grade, period: null });
            }
            await DB.updateSubject(subject.id, { gradeTable: gt });
        } catch (e) {
            console.error('Error syncing grade to subject:', e);
        }
    }
};
