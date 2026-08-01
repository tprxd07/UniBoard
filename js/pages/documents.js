// Documents Page
const DocumentsPage = {
    documents: [],

    render() {
        return `
        <div class="section-header">
            <span class="section-title">Documentos</span>
            <button class="btn btn-primary btn-sm" id="add-doc-btn">+ Añadir</button>
        </div>

        <div class="tabs" style="max-width: 400px; margin-bottom: 20px;">
            <button class="tab active" data-view="folders">Carpetas</button>
            <button class="tab" data-view="all">Todos</button>
        </div>

        <div id="docs-content"></div>`;
    },

    init() {
        document.getElementById('add-doc-btn').addEventListener('click', () => this.showAddModal());

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderContent(tab.dataset.view);
            });
        });

        this.loadDocuments();
    },

    async loadDocuments() {
        try {
            this.documents = await DB.getDocuments();
            this.renderContent('folders');
        } catch (e) {
            console.error('Error loading documents:', e);
        }
    },

    renderContent(view) {
        const container = document.getElementById('docs-content');

        if (view === 'folders') {
            // Group by subject
            const groups = {};
            this.documents.forEach(doc => {
                const key = doc.subject || 'Sin asignatura';
                if (!groups[key]) groups[key] = [];
                groups[key].push(doc);
            });

            if (Object.keys(groups).length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📄</div><h3>Sin documentos</h3><p>Añade tu primer documento o carpeta</p></div>';
                return;
            }

            container.innerHTML = `<div class="doc-grid">
                ${Object.entries(groups).map(([name, docs]) => `
                    <div class="doc-folder" onclick="DocumentsPage.showFolder('${name}')">
                        <div class="doc-folder-icon">📁</div>
                        <div class="doc-folder-name">${name}</div>
                        <div class="doc-folder-count">${docs.length} archivos</div>
                    </div>
                `).join('')}
            </div>`;
        } else {
            if (this.documents.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📄</div><h3>Sin documentos</h3></div>';
                return;
            }

            container.innerHTML = this.documents.map(doc => {
                const icon = doc.type === 'pdf' ? '📕' : doc.type === 'presentation' ? '📊' : '📝';
                return `
                <div class="list-item">
                    <div class="list-item-icon">${icon}</div>
                    <div class="list-item-content">
                        <div class="list-item-title">${doc.name}</div>
                        <div class="list-item-subtitle">${doc.subject || 'Sin asignatura'} · ${doc.type || 'Documento'}</div>
                    </div>
                    <div class="list-item-actions">
                        ${doc.url ? `<a href="${doc.url}" target="_blank" class="btn btn-ghost btn-sm">🔗 Abrir</a>` : ''}
                        <button class="btn-icon" style="font-size: 14px;" onclick="DocumentsPage.deleteDocument('${doc.id}')">🗑️</button>
                    </div>
                </div>`;
            }).join('');
        }
    },

    showFolder(name) {
        const docs = this.documents.filter(d => (d.subject || 'Sin asignatura') === name);
        const container = document.getElementById('docs-content');

        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <button class="btn btn-ghost btn-sm" onclick="DocumentsPage.renderContent('folders')">← Volver</button>
                <h3 style="display: inline; margin-left: 12px;">${name}</h3>
            </div>
            ${docs.map(doc => {
                const icon = doc.type === 'pdf' ? '📕' : doc.type === 'presentation' ? '📊' : '📝';
                return `
                <div class="list-item">
                    <div class="list-item-icon">${icon}</div>
                    <div class="list-item-content">
                        <div class="list-item-title">${doc.name}</div>
                        <div class="list-item-subtitle">${doc.type || 'Documento'}</div>
                    </div>
                    <div class="list-item-actions">
                        ${doc.url ? `<a href="${doc.url}" target="_blank" class="btn btn-ghost btn-sm">🔗 Abrir</a>` : ''}
                        <button class="btn-icon" style="font-size: 14px;" onclick="DocumentsPage.deleteDocument('${doc.id}')">🗑️</button>
                    </div>
                </div>`;
            }).join('')}`;
    },

    showAddModal() {
        const html = `
            <div class="form-group">
                <label>Nombre</label>
                <input type="text" id="doc-name" placeholder="Ej: Apuntes tema 3">
            </div>
            <div class="form-group">
                <label>Asignatura</label>
                <select id="doc-subject"><option value="">Sin asignatura</option></select>
            </div>
            <div class="form-group">
                <label>Tipo</label>
                <select id="doc-type">
                    <option value="notes">Apuntes</option>
                    <option value="pdf">PDF</option>
                    <option value="presentation">Presentación</option>
                    <option value="other">Otro</option>
                </select>
            </div>
            <div class="form-group">
                <label>URL (enlace al documento)</label>
                <input type="url" id="doc-url" placeholder="https://...">
            </div>`;

        Utils.showModal('Nuevo Documento', html, async () => {
            const data = {
                name: document.getElementById('doc-name').value,
                subject: document.getElementById('doc-subject').value,
                type: document.getElementById('doc-type').value,
                url: document.getElementById('doc-url').value
            };

            if (!data.name) {
                Utils.showToast('El nombre es obligatorio', 'error');
                return;
            }

            try {
                await DB.addDocument(data);
                Utils.showToast('Documento añadido', 'success');
                this.loadDocuments();
            } catch (e) {
                Utils.showToast('Error al guardar', 'error');
            }
        });

        this.loadSubjectsSelect();
    },

    async loadSubjectsSelect() {
        try {
            const subjects = await DB.getSubjects();
            const select = document.getElementById('doc-subject');
            if (select) {
                select.innerHTML = '<option value="">Sin asignatura</option>' +
                    subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
            }
        } catch (e) {}
    },

    async deleteDocument(id) {
        if (confirm('¿Eliminar este documento?')) {
            try {
                await DB.deleteDocument(id);
                Utils.showToast('Documento eliminado', 'success');
                this.loadDocuments();
            } catch (e) {
                Utils.showToast('Error al eliminar', 'error');
            }
        }
    }
};
