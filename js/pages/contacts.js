const ContactsPage = {
    contacts: [],
    friends: [],
    subjects: [],
    activeTab: 'friends',

    render() {
        return `
        <div style="position:relative;min-height:400px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <div class="tabs" style="max-width: 500px;">
                    <button class="tab active" data-tab="friends" onclick="ContactsPage.switchTab('friends')">Amigos</button>
                    <button class="tab" data-tab="staff" onclick="ContactsPage.switchTab('staff')">Personal del centro</button>
                </div>
                <button class="btn btn-primary btn-sm" id="add-contact-btn">+ Añadir</button>
            </div>

            <div id="contacts-list"></div>

            <div class="coming-soon-overlay">
                <div class="coming-soon-card">
                    <span class="coming-soon-icon">${Icons.users}</span>
                    <h3>En proceso</h3>
                    <p>Esta sección estará disponible pronto</p>
                </div>
            </div>
        </div>`;
    },

    async init() {
        this.activeTab = 'friends';
        document.getElementById('add-contact-btn').addEventListener('click', () => {
            if (this.activeTab === 'friends') {
                Utils.showToast('Los amigos se añaden desde la sección Amigos', 'info');
            } else {
                this.showAddStaffModal();
            }
        });
        await this.loadData();
    },

    async loadData() {
        try {
            const [contacts, friends, subjects] = await Promise.all([
                DB.getContacts(),
                DB.getFriends(),
                DB.getSubjects()
            ]);
            this.contacts = contacts;
            this.friends = friends;
            this.subjects = subjects;
            this.renderList();
        } catch (e) {
            console.error('Error loading contacts:', e);
        }
    },

    switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        this.renderList();
    },

    renderList() {
        const container = document.getElementById('contacts-list');
        if (this.activeTab === 'friends') {
            this.renderFriends(container);
        } else {
            this.renderStaff(container);
        }
    },

    renderFriends(container) {
        if (this.friends.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.users + '</div><h3>Sin amigos en contactos</h3><p>Añade amigos desde la sección Amigos del menú</p></div>';
            return;
        }
        let html = '';
        this.friends.forEach(friend => {
            const initial = (friend.name || '?')[0].toUpperCase();
            const display = friend.nickname || friend.name || 'Sin nombre';
            const extra = [friend.note, friend.phone].filter(Boolean).join(' · ');
            html += `
            <div class="contact-card">
                <div class="contact-avatar">${friend.photoURL ? `<img src="${friend.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : initial}</div>
                <div class="contact-info" style="flex:1;">
                    <h4>${display}</h4>
                    ${friend.nickname && friend.name ? `<p style="font-size:11px;color:var(--text-secondary);margin:0;">${friend.name}</p>` : ''}
                    ${extra ? `<p>${extra}</p>` : ''}
                </div>
                <div class="contact-actions" style="display:flex;gap:4px;">
                    <button class="btn-icon" onclick="ContactsPage.editFriendContact('${friend.id || friend.uid}')" title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    ${friend.phone ? `<a href="tel:${friend.phone}" class="btn-icon" title="Llamar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></a>` : ''}
                </div>
            </div>`;
        });
        container.innerHTML = html;
    },

    renderStaff(container) {
        const allStaff = this.getStaffContacts();
        if (allStaff.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.backpack + '</div><h3>Sin personal</h3><p>Añade profesores u otro personal del centro</p></div>';
            return;
        }
        let html = '';
        allStaff.forEach(contact => {
            const isProfessor = contact.type === 'profesor';
            const icon = isProfessor ? Icons.user : Icons.user;
            const typeLabel = isProfessor ? 'Profesor' : 'Personal';
            const subjects = (contact.subjects && contact.subjects.length > 0) ? contact.subjects.join(', ') : (contact.subject || '');
            const details = [subjects, contact.email, contact.phone].filter(Boolean);
            html += `
            <div class="contact-card">
                <div class="contact-avatar">${icon}</div>
                <div class="contact-info" style="flex:1;">
                    <h4>${contact.name || 'Sin nombre'}</h4>
                    <p><span class="badge" style="font-size:10px;padding:2px 6px;">${typeLabel}</span></p>
                    ${details.length > 0 ? `<p>${details.join(' · ')}</p>` : ''}
                    ${contact.description ? `<p style="font-style:italic;font-size:11px;">${contact.description}</p>` : ''}
                </div>
                <div class="contact-actions" style="display:flex;gap:4px;">
                    <button class="btn-icon" onclick="ContactsPage.editStaffContact('${contact.id}')" title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button class="btn-icon" onclick="ContactsPage.deleteStaffContact('${contact.id}','${this.esc(contact.name)}')" title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger, #ff3b30)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    },

    getStaffContacts() {
        const manual = this.contacts.filter(c => c.type === 'profesor' || c.type === 'otro');
        const linked = this.getLinkedProfessors();
        const merged = [...manual];
        linked.forEach(lp => {
            if (!merged.find(m => m.name && m.name.toLowerCase() === lp.name.toLowerCase())) {
                merged.push(lp);
            }
        });
        return merged;
    },

    getLinkedProfessors() {
        const profMap = {};
        this.subjects.forEach(s => {
            const profs = (s.professors && s.professors.length > 0) ? s.professors : (s.professor ? [s.professor] : []);
            profs.forEach(name => {
                if (!name) return;
                const key = name.toLowerCase().trim();
                if (!profMap[key]) {
                    profMap[key] = { id: 'linked_' + key, name: name.trim(), type: 'profesor', subjects: [], isLinked: true };
                }
                if (!profMap[key].subjects.includes(s.name)) {
                    profMap[key].subjects.push(s.name);
                }
            });
        });
        return Object.values(profMap);
    },

    showAddStaffModal() {
        const html = this.getStaffModalHTML({}, false);
        Utils.showModal('Añadir personal', html, async () => {
            const data = this.readStaffModal();
            if (!data.name) { Utils.showToast('El nombre es obligatorio', 'error'); return; }
            try {
                await DB.addContact(data);
                Utils.showToast('Contacto añadido', 'success');
                await this.loadData();
            } catch (e) {
                Utils.showToast('Error al guardar', 'error');
            }
        });
        this.setupStaffModalListeners();
    },

    editStaffContact(id) {
        const contact = this.contacts.find(c => c.id === id);
        if (!contact) return;
        const html = this.getStaffModalHTML(contact, true);
        Utils.showModal('Editar personal', html, async () => {
            const data = this.readStaffModal();
            if (!data.name) { Utils.showToast('El nombre es obligatorio', 'error'); return; }
            try {
                await DB.updateContact(id, data);
                Utils.showToast('Contacto actualizado', 'success');
                await this.loadData();
            } catch (e) {
                Utils.showToast('Error al guardar', 'error');
            }
        });
        this.setupStaffModalListeners();
    },

    getStaffModalHTML(contact, isEdit) {
        const isProf = contact.type === 'profesor';
        const subjectsStr = (contact.subjects && contact.subjects.length > 0)
            ? contact.subjects.join(', ')
            : (contact.subject || '');
        const profSubjectsClass = isProf ? '' : 'hidden';
        return `
        <div class="form-group">
            <label>Nombre</label>
            <input type="text" id="staff-name" value="${contact.name || ''}" placeholder="Nombre completo" maxlength="100">
        </div>
        <div class="form-group">
            <label>Profesión</label>
            <select id="staff-type">
                <option value="profesor" ${isProf ? 'selected' : ''}>Profesor</option>
                <option value="otro" ${!isProf && contact.type ? 'selected' : ''}>Otro</option>
            </select>
        </div>
        <div class="form-group staff-professor-fields ${profSubjectsClass}">
            <label>Asignaturas (separadas por coma)</label>
            <input type="text" id="staff-subjects" value="${subjectsStr}" placeholder="Ej: Matemáticas, Física" maxlength="100">
        </div>
        <div class="form-group">
            <label>Correo electrónico</label>
            <input type="email" id="staff-email" value="${contact.email || ''}" placeholder="correo@universidad.es">
        </div>
        <div class="form-group">
            <label>Teléfono</label>
            <input type="tel" id="staff-phone" value="${contact.phone || ''}" placeholder="Opcional">
        </div>
        <div class="form-group">
            <label>Descripción (opcional)</label>
            <textarea id="staff-description" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-input);color:var(--text);font-family:var(--font-family);">${contact.description || ''}</textarea>
        </div>`;
    },

    setupStaffModalListeners() {
        const typeSelect = document.getElementById('staff-type');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                const fields = document.querySelector('.staff-professor-fields');
                if (fields) fields.classList.toggle('hidden', typeSelect.value !== 'profesor');
            });
        }
    },

    readStaffModal() {
        const subjectsStr = document.getElementById('staff-subjects')?.value || '';
        const subjects = subjectsStr.split(',').map(s => s.trim()).filter(s => s);
        return {
            name: document.getElementById('staff-name')?.value?.trim() || '',
            type: document.getElementById('staff-type')?.value || 'profesor',
            subjects: subjects,
            subject: subjects[0] || '',
            email: document.getElementById('staff-email')?.value?.trim() || '',
            phone: document.getElementById('staff-phone')?.value?.trim() || '',
            description: document.getElementById('staff-description')?.value?.trim() || ''
        };
    },

    editFriendContact(friendId) {
        const friend = this.friends.find(f => (f.id || f.uid) === friendId);
        if (!friend) return;
        const html = `
        <div class="form-group">
            <label>Nombre</label>
            <input type="text" id="fc-name" value="${friend.name || ''}" readonly style="opacity:0.6;">
        </div>
        <div class="form-group">
            <label>Mote (apodo)</label>
            <input type="text" id="fc-nickname" value="${friend.nickname || ''}" placeholder="Apodo para este amigo">
        </div>
        <div class="form-group">
            <label>Nota</label>
            <input type="text" id="fc-note" value="${friend.note || ''}" placeholder="Ej: Amigo del instituto">
        </div>
        <div class="form-group">
            <label>Teléfono</label>
            <input type="tel" id="fc-phone" value="${friend.phone || ''}" placeholder="Opcional">
        </div>`;
        Utils.showModal('Editar amigo', html, async () => {
            const nickname = document.getElementById('fc-nickname').value.trim();
            const note = document.getElementById('fc-note').value.trim();
            const phone = document.getElementById('fc-phone').value.trim();
            try {
                await DB.updateFriend(friend.id || friend.uid, { nickname, note, phone });
                Utils.showToast('Contacto actualizado', 'success');
                await this.loadData();
            } catch (e) {
                Utils.showToast('Error al guardar', 'error');
            }
        });
    },

    async deleteStaffContact(id, name) {
        if (!confirm(`¿Eliminar a ${name || 'este contacto'}?`)) return;
        try {
            await DB.deleteContact(id);
            Utils.showToast('Contacto eliminado', 'success');
            await this.loadData();
        } catch (e) {
            Utils.showToast('Error al eliminar', 'error');
        }
    },

    esc(str) {
        return Utils.escapeHTML(str);
    }
};
