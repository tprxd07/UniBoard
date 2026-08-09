// Documents Page
const DocumentsPage = {
    documents: [],
    activeView: 'archivos',

    render() {
        const skeletonFolders = Array.from({length: 4}, () => `
            <div class="skeleton-folder">
                <div class="skeleton skeleton-icon" style="width:40px;height:40px;"></div>
                <div class="skeleton skeleton-text" style="width:60%;"></div>
                <div class="skeleton skeleton-text-sm" style="width:40%;"></div>
            </div>`).join('');

        return `
        <div class="tabs" style="max-width: 400px; margin-bottom: 20px;">
            <button class="tab active" data-view="archivos">Archivos</button>
            <button class="tab" data-view="enlaces">Enlaces</button>
        </div>

        <div id="docs-actions-bar" style="display:flex;justify-content:flex-end;margin-bottom:16px;"></div>
        <div id="docs-content"><div class="doc-grid">${skeletonFolders}</div></div>`;
    },

    init() {
        this.activeView = 'archivos';
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeView = tab.dataset.view;
                this.renderContent();
            });
        });
        this.loadDocuments();
    },

    async loadDocuments() {
        try {
            this.documents = await DB.getDocuments();
            this.renderContent();
        } catch (e) {
            console.error('Error loading documents:', e);
        }
    },

    renderContent() {
        const container = document.getElementById('docs-content');
        const actionsBar = document.getElementById('docs-actions-bar');

        if (this.activeView === 'archivos') {
            actionsBar.innerHTML = `<button class="btn btn-primary btn-sm" onclick="DocumentsPage.showAddFileModal()">+ Añadir</button>`;
            this.renderFiles(container);
        } else {
            actionsBar.innerHTML = `<button class="btn btn-primary btn-sm" onclick="DocumentsPage.showAddLinkModal()">+ Añadir</button>`;
            this.renderLinks(container);
        }
    },

    renderFiles(container) {
        const files = this.documents.filter(d => !d.url || d.docType === 'file');

        if (files.length === 0) {
            container.innerHTML = `
                <div class="doc-dropzone" id="doc-dropzone" style="margin-bottom:20px;">
                    <div class="doc-dropzone-content">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <p>Arrastra archivos aquí o haz clic para añadir</p>
                    </div>
                    <input type="file" id="doc-file-input" multiple class="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.rar,image/*">
                </div>
                <div class="empty-state"><div class="empty-state-icon">${Icons.file}</div><h3>Sin archivos</h3><p>Añade tu primer archivo</p></div>`;
            this.setupDropzone();
            return;
        }

        container.innerHTML = `
            <div class="doc-dropzone" id="doc-dropzone" style="margin-bottom:20px;">
                <div class="doc-dropzone-content">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <p>Arrastra archivos aquí</p>
                </div>
                <input type="file" id="doc-file-input" multiple class="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.rar,image/*">
            </div>
            ${this.renderFileGroups(files)}`;
        this.setupDropzone();
    },

    renderFileGroups(files) {
        const groups = {};
        files.forEach(doc => {
            const key = doc.subject || 'Sin asignatura';
            if (!groups[key]) groups[key] = [];
            groups[key].push(doc);
        });

        return `<div class="doc-grid">
            ${Object.entries(groups).map(([name, docs]) => `
                <div class="doc-folder" onclick="DocumentsPage.showFolder('${name}')">
                    <div class="doc-folder-icon">${Icons.folder}</div>
                    <div class="doc-folder-name">${name}</div>
                    <div class="doc-folder-count">${docs.length} archivos</div>
                </div>
            `).join('')}
        </div>`;
    },

    renderLinks(container) {
        const links = this.documents.filter(d => d.url && d.docType !== 'file');

        if (links.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.externalLink + '</div><h3>Sin enlaces</h3><p>Añade enlaces a documentos online</p></div>';
            return;
        }

        container.innerHTML = Utils.sanitize(links.map(doc => `
            <div class="list-item">
                <div class="list-item-icon">${Icons.externalLink}</div>
                <div class="list-item-content">
                    <div class="list-item-title">${doc.name}</div>
                    <div class="list-item-subtitle">${doc.subject || 'Sin asignatura'} · ${doc.type || 'Enlace'}</div>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-ghost btn-sm" onclick="Utils.openExternalLink('${doc.url}')">${Icons.externalLink} Abrir</button>
                    <button class="btn-icon" style="font-size: 14px;" onclick="DocumentsPage.deleteDocument('${doc.id}')">${Icons.trash}</button>
                </div>
            </div>
        `).join(''));
    },

    showFolder(name) {
        const docs = this.documents.filter(d => (d.subject || 'Sin asignatura') === name && (!d.url || d.docType === 'file'));
        const container = document.getElementById('docs-content');

        container.innerHTML = Utils.sanitize(`
            <div style="margin-bottom: 16px;">
                <button class="btn btn-ghost btn-sm" onclick="DocumentsPage.renderContent()">← Volver</button>
                <h3 style="display: inline; margin-left: 12px;">${name}</h3>
            </div>
            ${docs.map(doc => {
                const icon = doc.type === 'pdf' ? Icons.fileText : doc.type === 'presentation' ? Icons.presentation : Icons.edit;
                return `
                <div class="list-item">
                    <div class="list-item-icon">${icon}</div>
                    <div class="list-item-content">
                        <div class="list-item-title">${doc.name}</div>
                        <div class="list-item-subtitle">${doc.type || 'Documento'}</div>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn-icon" style="font-size: 14px;" onclick="DocumentsPage.deleteDocument('${doc.id}')">${Icons.trash}</button>
                    </div>
                </div>`;
            }).join('')}`);
    },

    setupDropzone() {
        const dropzone = document.getElementById('doc-dropzone');
        const input = document.getElementById('doc-file-input');
        if (!dropzone) return;

        dropzone.addEventListener('click', () => input?.click());
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
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
                    docType: 'file',
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

    showAddFileModal() {
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
                <label>URL (opcional, enlace al archivo)</label>
                <input type="url" id="doc-url" placeholder="https://...">
            </div>`;

        Utils.showModal('Nuevo Archivo', html, async () => {
            const data = {
                name: document.getElementById('doc-name').value,
                subject: document.getElementById('doc-subject').value,
                type: document.getElementById('doc-type').value,
                docType: 'file',
                url: document.getElementById('doc-url').value
            };
            if (!data.name) { Utils.showToast('El nombre es obligatorio', 'error'); return; }
            try {
                await DB.addDocument(data);
                Utils.showToast('Archivo añadido', 'success');
                this.loadDocuments();
            } catch (e) { Utils.showToast('Error al guardar', 'error'); }
        });
        this.loadSubjectsSelect();
    },

    showAddLinkModal() {
        const html = `
            <div class="form-group">
                <label>Nombre</label>
                <input type="text" id="doc-name" placeholder="Ej: Apuntes clase">
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
                <label>URL</label>
                <input type="url" id="doc-url" placeholder="https://...">
            </div>`;

        Utils.showModal('Nuevo Enlace', html, async () => {
            const data = {
                name: document.getElementById('doc-name').value,
                subject: document.getElementById('doc-subject').value,
                type: document.getElementById('doc-type').value,
                docType: 'link',
                url: document.getElementById('doc-url').value
            };
            if (!data.name) { Utils.showToast('El nombre es obligatorio', 'error'); return; }
            if (!data.url) { Utils.showToast('La URL es obligatoria', 'error'); return; }
            try {
                await DB.addDocument(data);
                Utils.showToast('Enlace añadido', 'success');
                this.loadDocuments();
            } catch (e) { Utils.showToast('Error al guardar', 'error'); }
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
