const SubjectsPage = {
    subjects: [],
    selectedSubject: null,
    currentDetailTab: 'info',
    _delegationSetup: false,

    render() {
        return `
        <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
            <button class="btn btn-primary btn-sm" id="add-subject-btn">+ Añadir</button>
        </div>
        <div id="subjects-grid" class="grid-3">
            ${Array.from({length: 6}, () => `
            <div class="skeleton-subject-card">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                    <div class="skeleton skeleton-circle"></div>
                    <div class="skeleton skeleton-text" style="flex:1;margin:0;"></div>
                    <div class="skeleton skeleton-badge"></div>
                </div>
                <div class="skeleton skeleton-text-lg" style="width:70%;"></div>
                <div class="skeleton skeleton-text-sm" style="width:50%;"></div>
                <div class="skeleton skeleton-text-sm" style="width:30%;margin-top:12px;"></div>
            </div>`).join('')}
        </div>`;
    },

    init() {
        document.getElementById('add-subject-btn').addEventListener('click', () => this.showAddModal());
        if (!this._delegationSetup) {
            this._delegationSetup = true;
            this.setupEventDelegation();
        }
        this.loadSubjects();
    },

    setupEventDelegation() {
        document.getElementById('subjects-grid').addEventListener('click', (e) => {
            const editBtn = e.target.closest('[data-click="edit-subject"]');
            if (editBtn) {
                e.stopPropagation();
                const id = editBtn.dataset.subjectId;
                const subject = this.subjects.find(x => x.id === id);
                this.showAddModal(subject);
                return;
            }
            const card = e.target.closest('[data-click="show-detail"]');
            if (card) {
                this.showDetail(card.dataset.subjectId);
            }
        });

        document.getElementById('modal-body').addEventListener('click', (e) => {
            const tab = e.target.closest('[data-detail-tab]');
            if (tab) {
                this.switchDetailTab(tab.dataset.detailTab);
                return;
            }
            const colorOpt = e.target.closest('[data-click="select-color"]');
            if (colorOpt) {
                document.querySelectorAll('#subj-colors .color-option').forEach(o => o.classList.remove('active'));
                colorOpt.classList.add('active');
                return;
            }
            const action = e.target.closest('[data-click]');
            if (!action) return;
            switch(action.dataset.click) {
                case 'open-guide':
                    Utils.openExternalLink(decodeURIComponent(action.dataset.url));
                    break;
                case 'edit-from-detail':
                    Utils.closeModal();
                    setTimeout(() => this.showAddModal(this.selectedSubject), 200);
                    break;
                case 'delete-subject':
                    this.deleteSubject(action.dataset.subjectId);
                    break;
                case 'add-grade-item':
                    this.addGradeItem();
                    break;
                case 'remove-grade-item':
                    this.removeGradeItem(parseInt(action.dataset.idx));
                    break;
            }
        });

        document.getElementById('modal-body').addEventListener('change', (e) => {
            const target = e.target;
            if (target.id === 'gt-use-periods') {
                this.togglePeriods();
            } else if (target.closest('#gt-items-body')) {
                this.saveGradeTable();
            }
        });
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
            grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.book + '</div><h3>No tienes asignaturas</h3><p>Añade tu primera asignatura para empezar</p></div>';
            return;
        }
        grid.innerHTML = Utils.sanitize(this.subjects.map(s => {
            const periodLabel = this.getPeriodLabel(s);
            const gradeInfo = this.getSubjectGradeInfo(s);
            return `
            <div class="subject-card" data-click="show-detail" data-subject-id="${s.id}">
                <div class="subject-card-header">
                    <div class="subject-color" style="background: ${s.color || '#6C5CE7'};"></div>
                    <div style="display:flex;gap:4px;">
                        <span class="badge badge-primary">${s.credits || 0} créditos</span>
                        <button class="btn-icon btn-sm" data-click="edit-subject" data-subject-id="${s.id}" title="Editar">
                            ${Icons.edit}
                        </button>
                    </div>
                </div>
                <h4>${s.name}</h4>
                <p style="font-size:12px;color:var(--text-secondary);">${s.professors && s.professors.length > 0 ? s.professors.join(', ') : (s.professor || 'Sin profesor')}</p>
                ${periodLabel ? `<p style="font-size:11px;color:var(--text-muted);margin-top:4px;">${periodLabel}</p>` : ''}
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px;">
                    ${gradeInfo ? `<p style="font-size:13px;font-weight:700;color:${Utils.getGradeColor(gradeInfo.avg)};">${gradeInfo.avg.toFixed(2)} · ${gradeInfo.count} eval</p>` : ''}
                    ${s.studyMinutes ? `<span style="font-size:11px;color:var(--text-secondary);">${Icons.clock} ${(s.studyMinutes / 60).toFixed(1)}h</span>` : ''}
                </div>
            </div>`;
        }).join(''));
    },

    getSubjectGradeInfo(subject) {
        const gt = subject.gradeTable;
        if (!gt || !gt.items || gt.items.length === 0) return null;
        const graded = gt.items.filter(i => i.grade !== null && i.grade !== undefined && i.grade !== '');
        if (graded.length === 0) return null;

        if (gt.usePeriods && gt.periodWeights && gt.periodWeights.length > 0) {
            const periodAvgs = {};
            graded.forEach(item => {
                const p = item.period || 1;
                if (!periodAvgs[p]) periodAvgs[p] = { sum: 0, weight: 0 };
                periodAvgs[p].sum += (parseFloat(item.grade) || 0) * (parseFloat(item.weight) || 0);
                periodAvgs[p].weight += parseFloat(item.weight) || 0;
            });

            let totalWeighted = 0;
            let totalPeriodWeight = 0;
            gt.periodWeights.forEach(pw => {
                const pa = periodAvgs[pw.period];
                if (pa && pa.weight > 0) {
                    const avg = pa.sum / pa.weight;
                    totalWeighted += avg * (parseFloat(pw.weight) || 0);
                    totalPeriodWeight += parseFloat(pw.weight) || 0;
                }
            });

            if (totalPeriodWeight > 0) {
                return { avg: totalWeighted / totalPeriodWeight, count: graded.length };
            }
        }

        let sum = 0, totalW = 0;
        graded.forEach(item => {
            const g = parseFloat(item.grade) || 0;
            const w = parseFloat(item.weight) || 0;
            sum += g * w;
            totalW += w;
        });

        return totalW > 0 ? { avg: sum / totalW, count: graded.length } : null;
    },

    getPeriodLabel(s) {
        if (!s.periodType) return '';
        const typeLabel = s.periodType === 'trimestre' ? 'Trimestre' : 'Cuatrimestre';
        return s.periodNumber ? `${typeLabel} ${s.periodNumber}` : typeLabel;
    },

    // ========== DETAIL VIEW ==========
    async showDetail(id) {
        const subject = this.subjects.find(s => s.id === id);
        if (!subject) return;
        this.selectedSubject = subject;
        this.currentDetailTab = 'info';
        this.renderDetail();
    },

    renderDetail() {
        const s = this.selectedSubject;
        if (!s) return;
        const profList = (s.professors && s.professors.length > 0) ? s.professors : (s.professor ? [s.professor] : []);
        const periodLabel = this.getPeriodLabel(s) || '—';
        const gradeInfo = this.getSubjectGradeInfo(s);

        let headerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">
            <div style="width:14px;height:14px;border-radius:50%;background:${s.color};flex-shrink:0;"></div>
            <h3 style="font-size:20px;font-weight:700;">${s.name}</h3>
        </div>`;

        if (gradeInfo) {
            headerHTML += `
            <div style="text-align:center;margin:12px 0 16px;padding:12px;background:var(--bg-input);border-radius:var(--radius-sm);">
                <div style="font-size:32px;font-weight:800;color:${Utils.getGradeColor(gradeInfo.avg)};">${gradeInfo.avg.toFixed(2)}</div>
                <div style="font-size:12px;color:var(--text-secondary);">${gradeInfo.count} evaluaciones · Nota actual</div>
            </div>`;
        }

        headerHTML += `
        <div class="uni-life-tabs" style="margin-bottom:16px;">
            <button class="tab ${this.currentDetailTab === 'info' ? 'active' : ''}" data-detail-tab="info">Info</button>
            <button class="tab ${this.currentDetailTab === 'grades' ? 'active' : ''}" data-detail-tab="grades">Calificaciones</button>
        </div>`;

        let bodyHTML = '';
        if (this.currentDetailTab === 'info') {
            bodyHTML = `
            <div class="grid-2" style="gap:10px;margin-bottom:16px;">
                <div class="stat-card"><div class="stat-icon purple">${Icons.user}</div><div class="stat-info"><h4 style="font-size:13px;">${profList.length > 0 ? profList.join(', ') : '—'}</h4><p>Profesor${profList.length > 1 ? 'es' : ''}</p></div></div>
                <div class="stat-card"><div class="stat-icon green">${Icons.backpack}</div><div class="stat-info"><h4 style="font-size:13px;">${s.room || '—'}</h4><p>Aula</p></div></div>
                <div class="stat-card"><div class="stat-icon blue">${Icons.calendar}</div><div class="stat-info"><h4 style="font-size:13px;">${periodLabel}</h4><p>Período</p></div></div>
                <div class="stat-card"><div class="stat-icon orange">${Icons.clock}</div><div class="stat-info"><h4 style="font-size:13px;">${s.studyMinutes ? (s.studyMinutes / 60).toFixed(1) + 'h' : '0h'}</h4><p>Estudiado</p></div></div>
            </div>
            ${s.guideUrl ? `<button class="btn btn-ghost btn-full" style="margin-bottom:12px;" data-click="open-guide" data-url="${encodeURIComponent(s.guideUrl)}">${Icons.file} Ver guía docente</button>` : ''}
            <div style="display:flex;gap:8px;">
                <button class="btn btn-ghost" style="flex:1;" data-click="edit-from-detail">
                    ${Icons.edit} Editar
                </button>
                <button class="btn btn-danger" style="flex:1;" data-click="delete-subject" data-subject-id="${s.id}">${Icons.trash} Eliminar</button>
            </div>`;
        } else {
            bodyHTML = this.renderGradeTable(s);
        }

        Utils.showModal(s.name, headerHTML + bodyHTML, async () => {
            await this.saveGradeTable();
            Utils.showToast('Calificaciones guardadas', 'success');
        });
    },

    switchDetailTab(tab) {
        this.currentDetailTab = tab;
        this.renderDetail();
    },

    // ========== GRADE TABLE ==========
    renderGradeTable(subject) {
        const gt = subject.gradeTable || { items: [], usePeriods: false, periodWeights: [] };
        const hasPeriods = subject.periodType;
        const usePeriods = gt.usePeriods || false;

        let html = '';

        // Period weights toggle
        if (hasPeriods) {
            const periodCount = subject.periodType === 'trimestre' ? 3 : 2;
            const typeLabel = subject.periodType === 'trimestre' ? 'Trimestres' : 'Cuatrimestres';
            html += `
            <div class="card" style="margin-bottom:12px;">
                <div class="card-header" style="padding:12px 14px;">
                    <span class="card-title" style="font-size:13px;">${Icons.percent} Peso por ${subject.periodType}</span>
                    <label class="toggle" style="flex-shrink:0;">
                        <input type="checkbox" id="gt-use-periods" ${usePeriods ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div id="period-weights-section" style="display:${usePeriods ? '' : 'none'};padding:0 14px 12px;">
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${Array.from({length: periodCount}, (_, i) => {
                            const pw = (gt.periodWeights || []).find(p => p.period === i + 1);
                            return `<div style="flex:1;min-width:80px;">
                                <label style="font-size:11px;color:var(--text-secondary);">${typeLabel.slice(0, -1)} ${i + 1}</label>
                                <input type="number" class="input-field gt-period-weight" data-period="${i + 1}"
                                    value="${pw ? pw.weight : Math.round(100 / periodCount)}"
                                    min="0" max="100" style="width:100%;padding:8px;font-size:13px;text-align:center;">
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>`;
        }

        // Grade items table
        html += `
        <div class="card">
            <div class="card-header" style="padding:12px 14px;">
                <span class="card-title" style="font-size:13px;">${Icons.clipboard} Evaluaciones</span>
                <button class="btn btn-primary btn-sm" data-click="add-grade-item" style="font-size:12px;padding:5px 10px;">+ Añadir</button>
            </div>
            <div class="grade-table-wrapper">
                <table class="grade-table">
                    <thead>
                        <tr>
                            <th style="width:35%;"></th>
                            <th style="width:20%;">Tipo</th>
                            <th style="width:15%;">Peso %</th>
                            ${usePeriods ? '<th style="width:15%;">Período</th>' : ''}
                            <th style="width:${usePeriods ? '15%' : '30%'};">Nota</th>
                            <th style="width:30px;"></th>
                        </tr>
                    </thead>
                    <tbody id="gt-items-body">
                        ${(gt.items || []).map((item, idx) => this.renderGradeRow(item, idx, usePeriods, subject)).join('')}
                    </tbody>
                </table>
            </div>
            ${(!gt.items || gt.items.length === 0) ? '<p style="text-align:center;color:var(--text-secondary);padding:16px;font-size:12px;">Añade exámenes, trabajos, etc.</p>' : ''}
            <div style="padding:12px 14px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:13px;color:var(--text-secondary);">Nota actual:</span>
                <span id="gt-calculated-grade" style="font-size:20px;font-weight:800;color:var(--primary);">${this.calculateGrade(subject).toFixed(2)}</span>
            </div>
        </div>`;

        return html;
    },

    renderGradeRow(item, idx, usePeriods, subject) {
        const periodCount = subject.periodType === 'trimestre' ? 3 : 2;
        const typeLabel = subject.periodType === 'trimestre' ? 'Trimestre' : 'Cuatrimestre';
        const types = [
            { value: 'exam', label: 'Examen' },
            { value: 'assignment', label: 'Trabajo' },
            { value: 'project', label: 'Proyecto' },
            { value: 'participation', label: 'Participación' },
            { value: 'other', label: 'Otro' }
        ];

        return `
        <tr class="grade-row">
            <td><input type="text" class="gt-name" value="${item.name || ''}" placeholder="Nombre"></td>
            <td>
                <select class="gt-type" style="padding:6px 8px;font-size:12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-input);color:var(--text);width:100%;">
                    ${types.map(t => `<option value="${t.value}" ${item.type === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
                </select>
            </td>
            <td><input type="number" class="gt-weight" value="${item.weight || ''}" min="0" max="100" placeholder="%" style="width:100%;text-align:center;"></td>
            ${usePeriods ? `<td>
                <select class="gt-period" style="padding:6px 8px;font-size:12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-input);color:var(--text);width:100%;">
                    ${Array.from({length: periodCount}, (_, i) => `<option value="${i + 1}" ${item.period == i + 1 ? 'selected' : ''}>${typeLabel.charAt(0)}${i + 1}</option>`).join('')}
                </select>
            </td>` : ''}
            <td><input type="number" class="gt-grade" value="${item.grade !== null && item.grade !== undefined ? item.grade : ''}" min="0" max="10" step="0.1" placeholder="—" style="width:100%;text-align:center;font-weight:700;"></td>
            <td><button class="btn-icon" data-click="remove-grade-item" data-idx="${idx}" style="font-size:14px;padding:4px;" title="Eliminar">✕</button></td>
        </tr>`;
    },

    addGradeItem() {
        const gt = this.selectedSubject.gradeTable || { items: [], usePeriods: false, periodWeights: [] };
        if (!gt.items) gt.items = [];
        gt.items.push({ name: '', type: 'exam', weight: '', grade: null, period: 1 });
        this.selectedSubject.gradeTable = gt;
        this.renderDetail();
    },

    removeGradeItem(idx) {
        const gt = this.selectedSubject.gradeTable;
        if (!gt || !gt.items) return;
        gt.items.splice(idx, 1);
        this.saveGradeTable();
        this.renderDetail();
    },

    togglePeriods() {
        const gt = this.selectedSubject.gradeTable || { items: [], usePeriods: false, periodWeights: [] };
        const checkbox = document.getElementById('gt-use-periods');
        gt.usePeriods = checkbox.checked;
        if (checkbox.checked && (!gt.periodWeights || gt.periodWeights.length === 0)) {
            const periodCount = this.selectedSubject.periodType === 'trimestre' ? 3 : 2;
            gt.periodWeights = Array.from({length: periodCount}, (_, i) => ({ period: i + 1, weight: Math.round(100 / periodCount) }));
        }
        this.selectedSubject.gradeTable = gt;
        this.renderDetail();
    },

    async saveGradeTable() {
        const s = this.selectedSubject;
        if (!s) return;
        const gt = s.gradeTable || { items: [], usePeriods: false, periodWeights: [] };

        // Read items from DOM
        const rows = document.querySelectorAll('#gt-items-body .grade-row');
        gt.items = [];
        rows.forEach(row => {
            gt.items.push({
                name: row.querySelector('.gt-name')?.value || '',
                type: row.querySelector('.gt-type')?.value || 'exam',
                weight: parseFloat(row.querySelector('.gt-weight')?.value) || 0,
                grade: row.querySelector('.gt-grade')?.value !== '' ? parseFloat(row.querySelector('.gt-grade')?.value) : null,
                period: row.querySelector('.gt-period')?.value ? parseInt(row.querySelector('.gt-period')?.value) : null
            });
        });

        // Read period weights from DOM
        const periodInputs = document.querySelectorAll('.gt-period-weight');
        if (periodInputs.length > 0) {
            gt.periodWeights = [];
            periodInputs.forEach(input => {
                gt.periodWeights.push({
                    period: parseInt(input.dataset.period),
                    weight: parseFloat(input.value) || 0
                });
            });
        }

        s.gradeTable = gt;

        // Update calculated grade display
        const gradeEl = document.getElementById('gt-calculated-grade');
        if (gradeEl) {
            const avg = this.calculateGrade(s);
            gradeEl.textContent = avg.toFixed(2);
            gradeEl.style.color = Utils.getGradeColor(avg);
        }

        // Save to DB
        try {
            await DB.updateSubject(s.id, { gradeTable: gt });
        } catch (e) {
            console.error('Error saving grade table:', e);
        }

        // Update grid card grade display
        this.renderGrid();
    },

    calculateGrade(subject) {
        const gt = subject.gradeTable;
        if (!gt || !gt.items || gt.items.length === 0) return 0;
        const graded = gt.items.filter(i => i.grade !== null && i.grade !== undefined && i.grade !== '');
        if (graded.length === 0) return 0;

        if (gt.usePeriods && gt.periodWeights && gt.periodWeights.length > 0) {
            const periodAvgs = {};
            graded.forEach(item => {
                const p = item.period || 1;
                if (!periodAvgs[p]) periodAvgs[p] = { sum: 0, weight: 0 };
                periodAvgs[p].sum += (parseFloat(item.grade) || 0) * (parseFloat(item.weight) || 0);
                periodAvgs[p].weight += parseFloat(item.weight) || 0;
            });

            let totalWeighted = 0;
            let totalPeriodWeight = 0;
            gt.periodWeights.forEach(pw => {
                const pa = periodAvgs[pw.period];
                if (pa && pa.weight > 0) {
                    const avg = pa.sum / pa.weight;
                    totalWeighted += avg * (parseFloat(pw.weight) || 0);
                    totalPeriodWeight += parseFloat(pw.weight) || 0;
                }
            });

            return totalPeriodWeight > 0 ? totalWeighted / totalPeriodWeight : 0;
        }

        let sum = 0, totalW = 0;
        graded.forEach(item => {
            sum += (parseFloat(item.grade) || 0) * (parseFloat(item.weight) || 0);
            totalW += parseFloat(item.weight) || 0;
        });

        return totalW > 0 ? sum / totalW : 0;
    },

    // ========== ADD/EDIT MODAL ==========
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
                <input type="text" id="subj-name" value="${s.name || ''}" placeholder="Ej: Matemáticas II" maxlength="100">
            </div>
            <div class="form-group">
                <label>Profesores (separados por coma)</label>
                <input type="text" id="subj-professors" value="${professors}" placeholder="Ej: Juan Pérez, María López" maxlength="100">
            </div>
            <div class="form-group">
                <label>Aula</label>
                <input type="text" id="subj-room" value="${s.room || ''}" placeholder="Ej: Aula 301" maxlength="50">
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
                    ${(() => {
                        const type = document.getElementById('subj-period-type')?.value || s.periodType;
                        if (type === 'trimestre') {
                            return ['Primero','Segundo','Tercero'].map((label, i) => `<option value="${i+1}" ${s.periodNumber == i+1 ? 'selected' : ''}>${label}</option>`).join('');
                        } else if (type === 'cuatrimestre') {
                            return Array.from({length:8}, (_, i) => `<option value="${i+1}" ${s.periodNumber == i+1 ? 'selected' : ''}>${i+1}º</option>`).join('');
                        }
                        return '';
                    })()}
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
                              style="background:${c};"
                              data-click="select-color"
                              data-color="${c}"></div>`
                    ).join('')}
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
                    <label style="font-size:12px;color:var(--text-secondary);">Custom:</label>
                    <input type="color" id="subj-color-picker" value="${isPreset ? '#6C5CE7' : currentColor}"
                        style="width:32px;height:32px;border:none;border-radius:50%;cursor:pointer;padding:0;">
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

            if (!data.name) { Utils.showToast('El nombre es obligatorio', 'error'); return; }

            try {
                if (isEdit) {
                    await DB.updateSubject(subject.id, data);
                    Utils.showToast('Asignatura actualizada', 'success');
                } else {
                    await DB.addSubject(data);
                    Utils.showToast('Asignatura añadida', 'success');
                }
                this.loadSubjects();
            } catch (e) { Utils.showToast('Error al guardar', 'error'); }
        });

        document.getElementById('subj-period-type').addEventListener('change', function() {
            document.getElementById('period-number-group').style.display = this.value ? '' : 'none';
            const select = document.getElementById('subj-period-number');
            const current = select.value;
            let options = '<option value="">—</option>';
            if (this.value === 'trimestre') {
                options += ['Primero','Segundo','Tercero'].map((label, i) => `<option value="${i+1}" ${current == i+1 ? 'selected' : ''}>${label}</option>`).join('');
            } else if (this.value === 'cuatrimestre') {
                options += Array.from({length:8}, (_, i) => `<option value="${i+1}" ${current == i+1 ? 'selected' : ''}>${i+1}º</option>`).join('');
            }
            select.innerHTML = options;
        });
        document.getElementById('subj-color-picker').addEventListener('input', () => {
            document.querySelectorAll('#subj-colors .color-option').forEach(o => o.classList.remove('active'));
        });
    },

    async deleteSubject(id) {
        if (confirm('¿Eliminar esta asignatura?')) {
            try {
                await DB.deleteSubject(id);
                Utils.showToast('Asignatura eliminada', 'success');
                Utils.closeModal();
                this.loadSubjects();
            } catch (e) { Utils.showToast('Error al eliminar', 'error'); }
        }
    }
};
