// Exams Page
const ExamsPage = {
    exams: [],

    render() {
        return `
        <div class="section-header">
            <span class="section-title">Exámenes</span>
            <button class="btn btn-primary btn-sm" id="add-exam-btn">+ Añadir</button>
        </div>
        <div id="exams-list"></div>`;
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
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><h3>Sin exámenes</h3><p>Añade tu primer examen</p></div>';
            return;
        }

        // Sort by date
        const sorted = [...this.exams].sort((a, b) => new Date(a.date) - new Date(b.date));

        container.innerHTML = sorted.map(exam => {
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
                        <button class="btn-icon" style="font-size: 14px;" onclick="ExamsPage.showAddModal(ExamsPage.exams.find(e=>e.id==='${exam.id}'))">✏️</button>
                        <button class="btn-icon" style="font-size: 14px;" onclick="ExamsPage.deleteExam('${exam.id}')">🗑️</button>
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
                    ${exam.topics ? `
                    <div style="padding: 10px; background: var(--bg-input); border-radius: 8px;">
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Temario:</div>
                        <div style="font-size: 13px;">${exam.topics}</div>
                    </div>` : ''}
                </div>

                ${exam.studyPlan ? `
                <div style="margin-top: 12px; padding: 12px; background: var(--primary-bg); border-radius: 8px;">
                    <div style="font-size: 12px; color: var(--primary); font-weight: 600; margin-bottom: 4px;">📋 Plan de estudio:</div>
                    <div style="font-size: 13px;">${exam.studyPlan}</div>
                </div>` : ''}
            </div>`;
        }).join('');
    },

    showAddModal(exam = null) {
        const isEdit = !!exam;
        const html = `
            <div class="form-group">
                <label>Asignatura</label>
                <input type="text" id="exam-subject" value="${exam?.subject || ''}" placeholder="Nombre de la asignatura">
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" id="exam-date" value="${exam?.date || ''}">
                </div>
                <div class="form-group">
                    <label>Lugar</label>
                    <input type="text" id="exam-room" value="${exam?.room || ''}" placeholder="Ej: Aula Magna">
                </div>
            </div>
            <div class="form-group">
                <label>Porcentaje (%)</label>
                <input type="number" id="exam-percentage" value="${exam?.percentage || ''}" placeholder="30" min="0" max="100">
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
            const data = {
                subject: document.getElementById('exam-subject').value,
                date: document.getElementById('exam-date').value,
                room: document.getElementById('exam-room').value,
                percentage: parseInt(document.getElementById('exam-percentage').value) || null,
                topics: document.getElementById('exam-topics').value,
                studyPlan: document.getElementById('exam-study-plan').value
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
    }
};
