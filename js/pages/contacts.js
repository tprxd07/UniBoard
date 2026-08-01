// Contacts Page
const ContactsPage = {
    contacts: [],

    render() {
        return `
        <div class="section-header">
            <span class="section-title">Contactos</span>
            <button class="btn btn-primary btn-sm" id="add-contact-btn">+ Nuevo</button>
        </div>

        <div class="tabs" style="max-width: 500px; margin-bottom: 20px;">
            <button class="tab active" data-filter="all">Todos</button>
            <button class="tab" data-filter="professor">Profesores</button>
            <button class="tab" data-filter="tutor">Tutor</button>
            <button class="tab" data-filter="classmate">Compañeros</button>
        </div>

        <div id="contacts-list"></div>`;
    },

    init() {
        document.getElementById('add-contact-btn').addEventListener('click', () => this.showAddModal());

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderList(tab.dataset.filter);
            });
        });

        this.loadContacts();
    },

    async loadContacts() {
        try {
            this.contacts = await DB.getContacts();
            this.renderList('all');
        } catch (e) {
            console.error('Error loading contacts:', e);
        }
    },

    renderList(filter = 'all') {
        const container = document.getElementById('contacts-list');
        let filtered = this.contacts;

        if (filter !== 'all') {
            filtered = filtered.filter(c => c.type === filter);
        }

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><h3>Sin contactos</h3><p>Añade profesores, tutores o compañeros</p></div>';
            return;
        }

        const typeIcons = { professor: '👨‍🏫', tutor: '🎓', classmate: '👤' };
        const typeNames = { professor: 'Profesor', tutor: 'Tutor', classmate: 'Compañero' };

        container.innerHTML = filtered.map(c => `
            <div class="contact-card">
                <div class="contact-avatar">${typeIcons[c.type] || '👤'}</div>
                <div class="contact-info" style="flex: 1;">
                    <h4>${c.name}</h4>
                    <p>${typeNames[c.type] || c.type} ${c.subject ? '· ' + c.subject : ''}</p>
                </div>
                <div style="text-align: right;">
                    ${c.email ? `<div style="font-size: 12px; color: var(--text-secondary);">${c.email}</div>` : ''}
                    ${c.phone ? `<div style="font-size: 12px; color: var(--text-secondary);">${c.phone}</div>` : ''}
                    ${c.officeHours ? `<div style="font-size: 11px; color: var(--primary); margin-top: 4px;">🕐 ${c.officeHours}</div>` : ''}
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <button class="btn-icon" style="font-size: 14px;" onclick="ContactsPage.showAddModal(ContactsPage.contacts.find(x=>x.id==='${c.id}'))">✏️</button>
                    <button class="btn-icon" style="font-size: 14px;" onclick="ContactsPage.deleteContact('${c.id}')">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    showAddModal(contact = null) {
        const isEdit = !!contact;
        const html = `
            <div class="form-group">
                <label>Nombre</label>
                <input type="text" id="contact-name" value="${contact?.name || ''}" placeholder="Nombre completo">
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Tipo</label>
                    <select id="contact-type">
                        <option value="professor" ${contact?.type === 'professor' ? 'selected' : ''}>Profesor</option>
                        <option value="tutor" ${contact?.type === 'tutor' ? 'selected' : ''}>Tutor</option>
                        <option value="classmate" ${contact?.type === 'classmate' ? 'selected' : ''}>Compañero</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Asignatura</label>
                    <input type="text" id="contact-subject" value="${contact?.subject || ''}" placeholder="Opcional">
                </div>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="contact-email" value="${contact?.email || ''}" placeholder="email@universidad.es">
                </div>
                <div class="form-group">
                    <label>Teléfono</label>
                    <input type="tel" id="contact-phone" value="${contact?.phone || ''}" placeholder="Opcional">
                </div>
            </div>
            <div class="form-group">
                <label>Horario de tutorías</label>
                <input type="text" id="contact-office" value="${contact?.officeHours || ''}" placeholder="Ej: Martes 10:00-12:00">
            </div>`;

        Utils.showModal(isEdit ? 'Editar Contacto' : 'Nuevo Contacto', html, async () => {
            const data = {
                name: document.getElementById('contact-name').value,
                type: document.getElementById('contact-type').value,
                subject: document.getElementById('contact-subject').value,
                email: document.getElementById('contact-email').value,
                phone: document.getElementById('contact-phone').value,
                officeHours: document.getElementById('contact-office').value
            };

            if (!data.name) {
                Utils.showToast('El nombre es obligatorio', 'error');
                return;
            }

            try {
                if (isEdit) {
                    await DB.updateContact(contact.id, data);
                    Utils.showToast('Contacto actualizado', 'success');
                } else {
                    await DB.addContact(data);
                    Utils.showToast('Contacto añadido', 'success');
                }
                this.loadContacts();
            } catch (e) {
                Utils.showToast('Error al guardar', 'error');
            }
        });
    },

    async deleteContact(id) {
        if (confirm('¿Eliminar este contacto?')) {
            try {
                await DB.deleteContact(id);
                Utils.showToast('Contacto eliminado', 'success');
                this.loadContacts();
            } catch (e) {
                Utils.showToast('Error al eliminar', 'error');
            }
        }
    }
};
