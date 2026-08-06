const FriendsPage = {
    friends: [],
    requests: [],
    sentRequests: [],
    suggestions: [],
    searchResults: [],
    streak: 0,
    activeTab: 'friends',

    render() {
        return `
        <div class="friends-stats" id="friends-stats"></div>

        <div class="uni-life-tabs" style="margin-bottom:16px;">
            <button class="tab active" data-tab="friends" onclick="FriendsPage.switchTab('friends',this)">Amigos</button>
            <button class="tab" data-tab="requests" onclick="FriendsPage.switchTab('requests',this)">
                Solicitudes ${this.requests.length > 0 ? `(${this.requests.length})` : ''}
            </button>
        </div>
        <div id="friends-tab-content"></div>`;
    },

    async init() {
        this.activeTab = 'friends';
        await this.loadData();
    },

    switchTab(tab, btn) {
        document.querySelectorAll('.uni-life-tabs .tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = tab;
        this.renderCurrentTab();
    },

    async loadData() {
        try {
            const [friends, requests, sentRequests, sessions, profile] = await Promise.all([
                DB.getFriends(),
                DB.getFriendRequests(),
                DB.getSentRequests(),
                DB.getStudySessions(),
                DB.getProfile()
            ]);
            this.friends = friends;
            this.requests = requests;
            this.sentRequests = sentRequests;
            this.streak = DB.calculateStreakFromSessions(sessions);
            await DB.updateProfile({ studyStreak: this.streak }).catch(() => {});
            this.renderStats(profile);

            if (this.activeTab === 'requests') {
                await this.loadSuggestions();
            }
            this.renderCurrentTab();
        } catch (e) {
            console.error('Error loading friends:', e);
        }
    },

    renderStats(profile) {
        const el = document.getElementById('friends-stats');
        el.innerHTML = `
        <div class="friends-stat-card">
            <div class="friends-stat-icon">${Icons.fire}</div>
            <div class="friends-stat-value">${this.streak}</div>
            <div class="friends-stat-label">Racha</div>
        </div>
        <div class="friends-stat-card">
            <div class="friends-stat-icon">${Icons.userPlus}</div>
            <div class="friends-stat-value">${this.friends.length}</div>
            <div class="friends-stat-label">Amigos</div>
        </div>
        <div class="friends-stat-card">
            <div class="friends-stat-icon">${Icons.inbox}</div>
            <div class="friends-stat-value">${this.requests.length}</div>
            <div class="friends-stat-label">Solicitudes</div>
        </div>`;
    },

    renderCurrentTab() {
        if (this.activeTab === 'friends') {
            this.renderFriendsTab();
        } else {
            this.renderRequestsTab();
        }
    },

    // ========== AMIGOS TAB ==========
    renderFriendsTab() {
        const container = document.getElementById('friends-tab-content');
        container.innerHTML = `
        <div class="friends-search-bar">
            <input type="text" id="friend-search-input" placeholder="Buscar por usuario, email o teléfono..." class="input-field" style="flex:1;">
            <button class="btn btn-primary btn-sm" id="friend-search-btn">Buscar</button>
        </div>
        <div id="friends-search-results" class="friends-search-results"></div>
        <div class="section-header" style="margin-top:20px;">
            <span class="section-title">Mis Amigos (${this.friends.length})</span>
        </div>
        <div id="friends-list"></div>`;

        document.getElementById('friend-search-btn').addEventListener('click', () => this.search());
        document.getElementById('friend-search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
        });

        this.renderFriendsList();
    },

    async search() {
        const query = document.getElementById('friend-search-input').value.trim();
        const container = document.getElementById('friends-search-results');
        if (!query || query.length < 2) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:16px;font-size:13px;">Escribe al menos 2 caracteres</p>';
            return;
        }
        container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:16px;font-size:13px;">Buscando...</p>';
        try {
            const results = await DB.searchUsers(query);
            this.searchResults = results;
            this.renderSearchResults();
        } catch (e) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:16px;font-size:13px;">Error al buscar</p>';
        }
    },

    renderSearchResults() {
        const container = document.getElementById('friends-search-results');
        if (this.searchResults.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:16px;font-size:13px;">No se encontraron usuarios</p>';
            return;
        }
        const friendIds = this.friends.map(f => f.id || f.uid);
        const sentIds = this.sentRequests.map(r => r.toUid);
        let html = '<div class="friends-search-list">';
        this.searchResults.forEach(user => {
            const isFriend = friendIds.includes(user.uid);
            const requestSent = sentIds.includes(user.uid);
            let actionBtn = '';
            if (isFriend) {
                actionBtn = '<span class="badge badge-primary">Amigo</span>';
            } else if (requestSent) {
                actionBtn = '<span class="badge" style="background:var(--border);color:var(--text-secondary);">Solicitud enviada</span>';
            } else {
                actionBtn = `<button class="btn btn-primary btn-sm" onclick="FriendsPage.sendRequest('${user.uid}','${this.esc(user.name)}','${this.esc(user.email)}','${this.esc(user.photoURL || '')}','${this.esc(user.username || '')}')">Enviar solicitud</button>`;
            }
            const initial = (user.name || user.email || '?')[0].toUpperCase();
            html += `
            <div class="friend-card friend-card-search">
                <div class="friend-avatar">${user.photoURL ? `<img src="${user.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : initial}</div>
                <div class="friend-info">
                    <h4>${user.name || 'Sin nombre'}</h4>
                    ${user.username ? `<p style="color:var(--primary);font-size:12px;">@${user.username}</p>` : `<p>${user.email || ''}</p>`}
                </div>
                <div class="friend-actions">${actionBtn}</div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    },

    renderFriendsList() {
        const container = document.getElementById('friends-list');
        if (this.friends.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">' + Icons.userPlus + '</div><h3>Sin amigos</h3><p>Busca usuarios o revisa las sugerencias</p></div>';
            return;
        }
        let html = '<div class="friends-list">';
        this.friends.forEach(friend => {
            const initial = (friend.name || '?')[0].toUpperCase();
            const display = friend.nickname || friend.name || 'Sin nombre';
            const streak = friend.studyStreak || 0;
            const fireClass = streak > 0 ? 'friend-streak-fire active' : 'friend-streak-fire';
            html += `
            <div class="friend-card friend-card-full">
                <div class="friend-avatar friend-avatar-lg">${friend.photoURL ? `<img src="${friend.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : initial}</div>
                <div class="friend-info">
                    <h4>${display}</h4>
                    ${friend.nickname && friend.name ? `<p class="friend-real-name">${friend.name}</p>` : ''}
                    ${friend.username ? `<p class="friend-email" style="color:var(--primary);">@${friend.username}</p>` : `<p class="friend-email">${friend.email || ''}</p>`}
                </div>
                <div class="friend-streak ${fireClass}">
                    <span class="friend-streak-icon">${Icons.fire}</span>
                    <span class="friend-streak-num">${streak}</span>
                </div>
                <div class="friend-actions">
                    <button class="btn-icon" onclick="FriendsPage.showFriendProfile('${friend.id || friend.uid}')" title="Ver perfil">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                    </button>
                    <button class="btn-icon" onclick="FriendsPage.removeFriend('${friend.id || friend.uid}','${this.esc(friend.name)}')" title="Eliminar amigo">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger, #ff3b30)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="11" x2="22" y2="11"/></svg>
                    </button>
                </div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    },

    async sendRequest(uid, name, email, photoURL, username) {
        try {
            await DB.sendFriendRequest({ uid, name, email, photoURL, username });
            Utils.showToast('Solicitud enviada', 'success');
            const sent = await DB.getSentRequests();
            this.sentRequests = sent;
            if (this.activeTab === 'friends') this.renderSearchResults();
            else this.renderRequestsTab();
        } catch (e) {
            Utils.showToast('Error al enviar solicitud', 'error');
        }
    },

    async cancelSentRequest(requestId) {
        try {
            await DB.cancelFriendRequest(requestId);
            Utils.showToast('Solicitud cancelada', 'success');
            const sent = await DB.getSentRequests();
            this.sentRequests = sent;
            this.renderRequestsTab();
        } catch (e) {
            Utils.showToast('Error al cancelar', 'error');
        }
    },

    // ========== SOLICITUDES TAB ==========
    async loadSuggestions() {
        try {
            const friendIds = this.friends.map(f => f.id || f.uid);
            const sentIds = this.sentRequests.map(r => r.toUid);
            const requestIds = this.requests.map(r => r.fromUid);
            const excludeIds = [...friendIds, ...sentIds, ...requestIds];
            console.log('Suggestions debug:', {
                friends: friendIds,
                sent: sentIds,
                received: requestIds,
                exclude: excludeIds
            });
            this.suggestions = await DB.getRandomUsers(3, excludeIds);
            console.log('Suggestions result:', this.suggestions.length, 'users');
        } catch (e) {
            console.error('Error loading suggestions:', e);
            this.suggestions = [];
        }
    },

    renderRequestsTab() {
        const container = document.getElementById('friends-tab-content');
        let html = '<div class="requests-scroll">';

        // 1. Solicitudes recibidas
        html += `<div class="section-header collapsible" onclick="FriendsPage.toggleSection(this)">
            <span class="section-title">Solicitudes recibidas (${this.requests.length})</span>
            <span class="section-chevron">${Icons.chevronDown}</span>
        </div>`;
        html += '<div class="section-body' + (this.requests.length > 0 ? ' open' : '') + '">';
        if (this.requests.length === 0) {
            html += '<p class="section-empty">No hay solicitudes recibidas</p>';
        } else {
            html += '<div class="requests-list">';
            this.requests.forEach(req => {
                const initial = (req.fromName || '?')[0].toUpperCase();
                html += `
                <div class="request-card">
                    <div class="request-avatar">${req.fromPhotoURL ? `<img src="${req.fromPhotoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : initial}</div>
                    <div class="request-info">
                        <div class="request-name">${req.fromName || 'Sin nombre'}</div>
                        ${req.fromUsername ? `<div class="request-username">@${req.fromUsername}</div>` : ''}
                    </div>
                    <div class="request-actions">
                        <button class="btn btn-primary btn-sm" onclick="FriendsPage.acceptRequest('${req.id}')">Aceptar</button>
                        <button class="btn btn-ghost btn-sm" onclick="FriendsPage.rejectRequest('${req.id}')">Rechazar</button>
                    </div>
                </div>`;
            });
            html += '</div>';
        }
        html += '</div>';

        // 2. Solicitudes enviadas
        html += `<div class="section-header${(this.requests.length > 0 || this.sentRequests.length > 0) ? '' : ''} collapsible" onclick="FriendsPage.toggleSection(this)">
            <span class="section-title">Solicitudes enviadas (${this.sentRequests.length})</span>
            <span class="section-chevron">${Icons.chevronDown}</span>
        </div>`;
        html += '<div class="section-body">';
        if (this.sentRequests.length === 0) {
            html += '<p class="section-empty">No hay solicitudes enviadas</p>';
        } else {
            html += '<div class="requests-list">';
            this.sentRequests.forEach(req => {
                const name = req.toName || req.toEmail || 'Usuario';
                const initial = name[0].toUpperCase();
                html += `
                <div class="request-card">
                    <div class="request-avatar">${initial}</div>
                    <div class="request-info">
                        <div class="request-name">${name}</div>
                    </div>
                    <div class="request-actions">
                        <button class="btn btn-ghost btn-sm" onclick="FriendsPage.cancelSentRequest('${req.id}')">Cancelar</button>
                    </div>
                </div>`;
            });
            html += '</div>';
        }
        html += '</div>';

        // 3. Sugerencias
        const hasRequests = this.requests.length > 0 || this.sentRequests.length > 0;
        html += `<div class="section-header${hasRequests ? '' : ''} collapsible" onclick="FriendsPage.toggleSection(this)">
            <span class="section-title">Sugerencias de amistad</span>
            <span class="section-chevron">${Icons.chevronDown}</span>
        </div>`;
        html += '<div class="section-body' + (this.suggestions.length > 0 ? ' open' : '') + '">';
        if (this.suggestions.length === 0) {
            html += `
            <div class="empty-state" style="padding:32px 16px;">
                <div class="empty-state-icon">${Icons.search}</div>
                <h3>Esto está muy vacío...</h3>
                <p>¡Invita a más personas!</p>
                <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="FriendsPage.copyInviteLink()">Compartir enlace de registro</button>
            </div>`;
        } else {
            html += '<div class="suggestions-grid">';
            const sentIds = this.sentRequests.map(r => r.toUid);
            this.suggestions.forEach(user => {
                const initial = (user.name || user.email || '?')[0].toUpperCase();
                const requestSent = sentIds.includes(user.uid);
                html += `
                <div class="suggestion-card" onclick="FriendsPage.showSuggestionProfile('${user.uid}','${this.esc(user.name)}','${this.esc(user.email || '')}','${this.esc(user.photoURL || '')}','${this.esc(user.username || '')}')">
                    <div class="suggestion-avatar">${user.photoURL ? `<img src="${user.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : initial}</div>
                    <div class="suggestion-name">${user.name || 'Sin nombre'}</div>
                    ${user.username ? `<div class="suggestion-username">@${user.username}</div>` : ''}
                    <button class="btn ${requestSent ? 'btn-ghost' : 'btn-primary'} btn-sm suggestion-btn"
                        onclick="event.stopPropagation(); ${requestSent ? `FriendsPage.cancelSuggestion('${user.uid}','${this.esc(user.name)}','${this.esc(user.email || '')}','${this.esc(user.photoURL || '')}','${this.esc(user.username || '')}')` : `FriendsPage.sendSuggestion('${user.uid}','${this.esc(user.name)}','${this.esc(user.email || '')}','${this.esc(user.photoURL || '')}','${this.esc(user.username || '')}')`}">
                        ${requestSent ? 'Solicitud enviada' : 'Enviar solicitud'}
                    </button>
                </div>`;
            });
            html += '</div>';
        }
        html += '</div>';

        // Empty state si no hay nada
        if (this.requests.length === 0 && this.sentRequests.length === 0 && this.suggestions.length === 0) {
            html += '<div class="empty-state"><div class="empty-state-icon">' + Icons.inboxEmpty + '</div><h3>Sin solicitudes</h3><p>No hay solicitudes pendientes</p></div>';
        }

        html += '</div>';
        container.innerHTML = html;
    },

    toggleSection(header) {
        const body = header.nextElementSibling;
        const chevron = header.querySelector('.section-chevron');
        if (body.classList.contains('open')) {
            body.classList.remove('open');
            chevron.classList.remove('rotated');
        } else {
            body.classList.add('open');
            chevron.classList.add('rotated');
        }
    },

    showSuggestionProfile(uid, name, email, photoURL, username) {
        const initial = (name || '?')[0].toUpperCase();
        const html = `
        <div style="text-align:center;">
            <div style="width:80px;height:80px;border-radius:50%;margin:0 auto 12px;background:var(--primary-bg);display:flex;align-items:center;justify-content:center;font-size:32px;overflow:hidden;">
                ${photoURL ? `<img src="${photoURL}" style="width:100%;height:100%;object-fit:cover;">` : initial}
            </div>
            <h3 style="margin:0 0 4px;">${name || 'Sin nombre'}</h3>
            ${username ? `<p style="color:var(--primary);font-size:13px;margin:0;">@${username}</p>` : ''}
            ${email ? `<p style="color:var(--text-secondary);font-size:12px;margin:4px 0 0;">${email}</p>` : ''}
        </div>`;
        Utils.showModal('Perfil', html);
    },

    async sendSuggestion(uid, name, email, photoURL, username) {
        await this.sendRequest(uid, name, email, photoURL, username);
        await this.loadSuggestions();
        this.renderRequestsTab();
    },

    async cancelSuggestion(uid, name, email, photoURL, username) {
        const req = this.sentRequests.find(r => r.toUid === uid);
        if (req) {
            await this.cancelSentRequest(req.id);
            await this.loadSuggestions();
        }
    },

    // ========== COMMON ==========
    async acceptRequest(requestId) {
        const req = this.requests.find(r => r.id === requestId);
        if (!req) return;
        try {
            await DB.acceptFriendRequest(requestId, req);
            Utils.showToast('¡Ahora sois amigos!', 'success');
            await this.loadData();
        } catch (e) {
            Utils.showToast('Error al aceptar', 'error');
        }
    },

    async rejectRequest(requestId) {
        try {
            await DB.rejectFriendRequest(requestId);
            Utils.showToast('Solicitud rechazada', 'success');
            await this.loadData();
        } catch (e) {
            Utils.showToast('Error al rechazar', 'error');
        }
    },

    showFriendProfile(friendId) {
        const friend = this.friends.find(f => (f.id || f.uid) === friendId);
        if (!friend) return;
        const initial = (friend.name || '?')[0].toUpperCase();
        const html = `
        <div class="friend-profile-detail">
            <div class="friend-profile-avatar">
                ${friend.photoURL ? `<img src="${friend.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : `<span style="font-size:36px;">${initial}</span>`}
            </div>
            <h3 style="text-align:center;margin:8px 0 2px;">${friend.name || 'Sin nombre'}</h3>
            <p style="text-align:center;color:var(--text-secondary);font-size:13px;margin:0;">${friend.email || ''}</p>
            <div class="friend-profile-stats" style="display:flex;justify-content:center;gap:24px;margin:16px 0;">
                <div style="text-align:center;">
                    <div style="font-size:20px;font-weight:700;color:var(--primary);">${friend.studyStreak || 0}</div>
                    <div style="font-size:11px;color:var(--text-secondary);">${Icons.fire} Racha</div>
                </div>
            </div>
            <div class="friend-profile-fields">
                <div class="form-group"><label>Mote</label><input type="text" id="fp-nickname" value="${friend.nickname || ''}" placeholder="Apodo para este amigo"></div>
                <div class="form-group"><label>Nota</label><input type="text" id="fp-note" value="${friend.note || ''}" placeholder="Ej: Amigo del instituto"></div>
                <div class="form-group"><label>Teléfono</label><input type="tel" id="fp-phone" value="${friend.phone || ''}" placeholder="Opcional"></div>
            </div>
        </div>`;
        Utils.showModal('Perfil de amigo', html, async () => {
            const nickname = document.getElementById('fp-nickname').value.trim();
            const note = document.getElementById('fp-note').value.trim();
            const phone = document.getElementById('fp-phone').value.trim();
            try {
                await DB.updateFriend(friend.id || friend.uid, { nickname, note, phone });
                Utils.showToast('Perfil actualizado', 'success');
                await this.loadData();
            } catch (e) {
                Utils.showToast('Error al guardar', 'error');
            }
        });
    },

    async removeFriend(friendId, name) {
        if (!confirm(`¿Eliminar a ${name || 'este amigo'} de tu lista de amigos?`)) return;
        try {
            await DB.removeFriend(friendId);
            Utils.showToast('Amigo eliminado', 'success');
            await this.loadData();
        } catch (e) {
            Utils.showToast('Error al eliminar', 'error');
        }
    },

    esc(str) {
        return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    },

    copyInviteLink() {
        const url = window.location.origin + window.location.pathname;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                Utils.showToast('Enlace copiado al portapapeles', 'success');
            }).catch(() => {
                Utils.showToast('Error al copiar', 'error');
            });
        } else {
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            Utils.showToast('Enlace copiado al portapapeles', 'success');
        }
    }
};
