// Documents Page
const DocumentsPage = {
    documents: [],

    render() {
        return `
        <div class="section-header">
            <span class="section-title">Documentos</span>
            <button class="btn btn-primary btn-sm" id="add-doc-btn">+ Añadir</button>
        </div>

        <div class="doc-dropzone" id="doc-dropzone">
            <div class="doc-dropzone-content">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p>Arrastra archivos aquí para añadirlos</p>
            </div>
            <input type="file" id="doc-file-input" multiple class="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.rar,image/*">
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

        this.setupDropzone();
        this.loadDocuments();
    },

    setupDropzone() {
        const dropzone = document.getElementById('doc-dropzone');
        const input = document.getElementById('doc-file-input');

        if (!dropzone) return;

        dropzone.addEventListener('click', () => input?.click());

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) this.handleDroppedFiles(files);
        });

        input?.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) this.handleDroppedFiles(files);
        });
    },

    async handleDroppedFiles(files) {
        let added = 0;
        for (const file of files) {
            try {
                const data = {
                    name: file.name.replace(/\.[^.]+$/, ''),
                    subject: '',
                    type: this.guessType(file.name),
                    url: '',
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type
                };
                await DB.addDocument(data);
                added++;
            } catch (e) {
                console.error('Error adding file:', e);
            }
        }
        if (added > 0) {
            Utils.showToast(`${added} archivo(s) añadido(s)`, 'success');
            this.loadDocuments();
        }
    },

    guessType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (ext === 'pdf') return 'pdf';
        if (['ppt', 'pptx'].includes(ext)) return 'presentation';
        return 'notes';
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
            const groups = {};
            this.documents.forEach(doc => {
                const key = doc.subject || 'Sin asignatura';
                if (!groups[key]) groups[key] = [];
                groups[key].push(doc);
            });

            if (Object.keys(groups).length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📄</div><h3>Sin documentos</h3><p>Añade tu primer documento o arrastra archivos aquí</p></div>';
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
