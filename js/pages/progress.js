// Progress Page
const ProgressPage = {
    render() {
        return `
        <div class="section-header">
            <span class="section-title">Progreso Académico</span>
        </div>

        <div class="grid-3" style="margin-bottom: 24px;">
            <div class="stat-card">
                <div class="stat-icon purple">${Icons.graduationCap}</div>
                <div class="stat-info">
                    <h4 id="credits-approved">0</h4>
                    <p>Créditos aprobados</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">${Icons.pieChart}</div>
                <div class="stat-info">
                    <h4 id="degree-progress">0%</h4>
                    <p>Grado completado</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">${Icons.trendUp}</div>
                <div class="stat-info">
                    <h4 id="predicted-gpa">—</h4>
                    <p>Predicción nota media</p>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
                <span class="card-title">Configurar progreso</span>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Total de créditos del grado</label>
                    <input type="number" id="total-credits" placeholder="240">
                </div>
                <div class="form-group">
                    <label>Créditos aprobados</label>
                    <input type="number" id="approved-credits" placeholder="60">
                </div>
            </div>
            <button class="btn btn-primary btn-sm" id="save-progress">Guardar</button>
        </div>

        <div class="card">
            <div class="card-header">
                <span class="card-title">Progreso por asignatura</span>
            </div>
            <div id="subject-progress"></div>
        </div>`;
    },

    init() {
        document.getElementById('save-progress').addEventListener('click', () => this.saveProgress());
        this.loadProgress();
    },

    async loadProgress() {
        try {
            // Load saved progress
            const saved = JSON.parse(localStorage.getItem('academicProgress') || '{}');
            document.getElementById('total-credits').value = saved.totalCredits || '';
            document.getElementById('approved-credits').value = saved.approvedCredits || '';

            if (saved.totalCredits && saved.approvedCredits) {
                this.updateDisplay(saved.totalCredits, saved.approvedCredits);
            }

            // Load subjects for detailed progress
            const subjects = await DB.getSubjects();
            this.renderSubjectProgress(subjects);
        } catch (e) {
            console.error('Error loading progress:', e);
        }
    },

    updateDisplay(total, approved) {
        document.getElementById('credits-approved').textContent = approved;
        const percentage = total > 0 ? Math.round((approved / total) * 100) : 0;
        document.getElementById('degree-progress').textContent = percentage + '%';

        // Predict GPA from subjects
        this.predictGPA();
    },

    async predictGPA() {
        try {
            const subjects = await DB.getSubjects();
            const withGrades = subjects.filter(s => s.currentGrade > 0);

            if (withGrades.length === 0) {
                document.getElementById('predicted-gpa').textContent = '—';
                return;
            }

            const totalCredits = withGrades.reduce((sum, s) => sum + (s.credits || 0), 0);
            const weightedSum = withGrades.reduce((sum, s) => sum + (s.currentGrade * (s.credits || 0)), 0);

            if (totalCredits > 0) {
                const gpa = weightedSum / totalCredits;
                const el = document.getElementById('predicted-gpa');
                el.textContent = gpa.toFixed(2);
                el.style.color = Utils.getGradeColor(gpa);
            }
        } catch (e) {}
    },

    renderSubjectProgress(subjects) {
        const container = document.getElementById('subject-progress');

        if (subjects.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 13px;">Añade asignaturas para ver el progreso</p>';
            return;
        }

        container.innerHTML = subjects.map(s => {
            const grade = s.currentGrade || 0;
            const percentage = grade * 10;
            const color = grade >= 9 ? 'green' : grade >= 7 ? 'blue' : grade >= 5 ? 'orange' : 'red';

            return `
            <div style="padding: 12px 0; border-bottom: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 14px; font-weight: 600;">${s.name}</span>
                    <span style="font-size: 14px; font-weight: 700; color: ${Utils.getGradeColor(grade)};">${grade.toFixed(1)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${color}" style="width: ${percentage}%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                    <span style="font-size: 11px; color: var(--text-secondary);">${s.credits || 0} créditos</span>
                    <span style="font-size: 11px; color: var(--text-secondary);">${Math.round(percentage)}%</span>
                </div>
            </div>`;
        }).join('');
    },

    saveProgress() {
        const total = parseInt(document.getElementById('total-credits').value) || 0;
        const approved = parseInt(document.getElementById('approved-credits').value) || 0;

        localStorage.setItem('academicProgress', JSON.stringify({
            totalCredits: total,
            approvedCredits: approved
        }));

        this.updateDisplay(total, approved);
        Utils.showToast('Progreso guardado', 'success');
    }
};
