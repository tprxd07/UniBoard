const ProfilePage = {
    _pendingPhoto: null,
    _pendingBanner: null,
    _pendingBannerColor: null,
    _pendingBannerColorRemoval: false,

    render() {
        return `
        <div class="profile-page">
            <div class="profile-banner-section" id="profile-banner-wrapper" style="position:relative;width:100%;height:160px;background:#6C5CE7;cursor:pointer;overflow:hidden;border-radius:var(--radius-lg);margin-bottom:16px;">
                <div id="profile-banner-display" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"></div>
                <div class="profile-banner-overlay" style="position:absolute;inset:0;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;gap:12px;opacity:0;transition:opacity 0.2s;color:#fff;font-size:13px;">
                    <label for="profile-banner-input" style="cursor:pointer;padding:6px 14px;background:rgba(255,255,255,0.2);border-radius:6px;backdrop-filter:blur(4px);" onclick="event.stopPropagation();">${Icons.camera} Foto</label>
                    <span id="banner-remove-photo" style="cursor:pointer;padding:6px 14px;background:rgba(255,255,255,0.2);border-radius:6px;display:none;backdrop-filter:blur(4px);" onclick="event.stopPropagation(); ProfilePage.removeBannerPhoto();">${Icons.x} Quitar foto</span>
                </div>
                <input type="file" id="profile-banner-input" accept="image/*" class="hidden">
            </div>

            <div class="profile-page-body">
                <div class="profile-photo-section" style="margin-top:-50px;">
                    <div class="profile-photo-wrapper" id="profile-photo-wrapper" style="border:3px solid var(--bg-card);">
                        <div class="profile-photo" id="profile-photo-display" style="width:80px;height:80px;font-size:32px;">${Icons.user}</div>
                        <div class="profile-photo-overlay">${Icons.camera}</div>
                    </div>
                    <p class="profile-photo-hint">Arrastra una imagen o haz clic para cambiar</p>
                    <input type="file" id="profile-photo-input" accept="image/*" class="hidden">
                </div>

                <div class="card" style="margin-bottom:16px;">
                    <div class="card-header">
                        <span class="card-title">${Icons.palette} Banner</span>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <div class="color-options" id="banner-color-options">
                            <div class="color-option" style="background:#6C5CE7;" data-color="#6C5CE7"></div>
                            <div class="color-option" style="background:#00B894;" data-color="#00B894"></div>
                            <div class="color-option" style="background:#E17055;" data-color="#E17055"></div>
                            <div class="color-option" style="background:#74B9FF;" data-color="#74B9FF"></div>
                            <div class="color-option" style="background:#E84393;" data-color="#E84393"></div>
                            <div class="color-option" style="background:#00CEC9;" data-color="#00CEC9"></div>
                            <div class="color-option" style="background:#FDCB6E;" data-color="#FDCB6E"></div>
                            <div class="color-option" style="background:#636E72;" data-color="#636E72"></div>
                            <div class="color-option" style="background:#2D3436;" data-color="#2D3436"></div>
                            <div class="color-option" style="background:#D63031;" data-color="#D63031"></div>
                        </div>
                    </div>
                </div>

                <div id="profile-stats-bar" style="display:flex;justify-content:center;gap:24px;margin:12px 0 16px;"></div>

                <div class="card" style="margin-bottom:16px;">
                    <div class="card-header">
                        <span class="card-title">${Icons.user} Información personal</span>
                    </div>
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" id="profile-name" placeholder="Tu nombre" maxlength="50">
                    </div>
                    <div class="form-group">
                        <label>Usuario</label>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="color:var(--text-secondary);font-size:14px;">@</span>
                            <input type="text" id="profile-username" placeholder="usuario_unico" style="flex:1;" maxlength="20">
                        </div>
                        <p id="username-status" style="font-size:11px;margin:4px 0 0;color:var(--text-secondary);"></p>
                    </div>
                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea id="profile-bio" rows="2" maxlength="200" placeholder="Cuéntanos algo sobre ti..." style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg-input);color:var(--text);font-family:var(--font-family);resize:none;"></textarea>
                    </div>
                    <div class="grid-2">
                        <div class="form-group">
                            <label>Universidad</label>
                            <input type="text" id="profile-university" placeholder="Tu universidad" maxlength="100">
                        </div>
                        <div class="form-group">
                            <label>Grado</label>
                            <input type="text" id="profile-degree" placeholder="Ej: Ingeniería" maxlength="100">
                        </div>
                    </div>
                    <button class="btn btn-primary" id="save-profile-page">Guardar perfil</button>
                </div>
            </div>
        </div>`;
    },

    async init() {
        this._pendingPhoto = null;
        this._pendingBanner = null;
        this._pendingBannerColor = null;
        this._pendingBannerColorRemoval = false;

        document.getElementById('save-profile-page')?.addEventListener('click', () => this.saveProfile());

        const [profile, friends, sessions] = await Promise.all([
            DB.getProfile(),
            DB.getFriends().catch(() => []),
            DB.getStudySessions().catch(() => [])
        ]);
        const streak = DB.calculateStreakFromSessions(sessions);

        document.getElementById('profile-name').value = profile.name || '';
        document.getElementById('profile-username').value = profile.username || '';
        document.getElementById('profile-bio').value = profile.bio || '';
        document.getElementById('profile-university').value = profile.university || '';
        document.getElementById('profile-degree').value = profile.degree || '';

        const usernameStatus = document.getElementById('username-status');
        if (profile.username) {
            usernameStatus.textContent = '@' + profile.username;
            usernameStatus.style.color = 'var(--primary)';
        } else {
            usernameStatus.textContent = 'Obligatorio para añadir amigos';
            usernameStatus.style.color = 'var(--text-secondary)';
        }

        // 30-day cooldown
        const now = new Date();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const nameInput = document.getElementById('profile-name');
        const usernameInput = document.getElementById('profile-username');

        const nameLastChanged = profile.nameLastChanged ? new Date(profile.nameLastChanged) : null;
        if (nameLastChanged && (now - nameLastChanged) < thirtyDaysMs) {
            const daysLeft = Math.ceil((thirtyDaysMs - (now - nameLastChanged)) / (24 * 60 * 60 * 1000));
            nameInput.disabled = true;
            nameInput.title = `Puedes cambiarlo en ${daysLeft} días`;
            nameInput.style.opacity = '0.6';
        } else {
            nameInput.disabled = false;
            nameInput.title = '';
            nameInput.style.opacity = '1';
        }

        const usernameLastChanged = profile.usernameLastChanged ? new Date(profile.usernameLastChanged) : null;
        if (usernameLastChanged && (now - usernameLastChanged) < thirtyDaysMs) {
            const daysLeft = Math.ceil((thirtyDaysMs - (now - usernameLastChanged)) / (24 * 60 * 60 * 1000));
            usernameInput.disabled = true;
            usernameInput.title = `Puedes cambiarlo en ${daysLeft} días`;
            usernameInput.style.opacity = '0.6';
        } else {
            usernameInput.disabled = false;
            usernameInput.title = '';
            usernameInput.style.opacity = '1';
        }

        // Photo display
        const display = document.getElementById('profile-photo-display');
        if (profile.photoURL && Utils.isValidPhotoURL(profile.photoURL)) {
            display.innerHTML = Utils.sanitize(`<img src="${Utils.escapeHTML(profile.photoURL)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`);
        }

        // Banner
        const bannerWrapper = document.getElementById('profile-banner-wrapper');
        const bannerColor = profile.bannerColor || '#6C5CE7';
        bannerWrapper.style.background = bannerColor;
        this._pendingBannerColor = bannerColor;

        const bannerDisplay = document.getElementById('profile-banner-display');
        const removeBtn = document.getElementById('banner-remove-photo');
        if (profile.bannerURL && Utils.isValidPhotoURL(profile.bannerURL)) {
            bannerDisplay.innerHTML = Utils.sanitize(`<img src="${Utils.escapeHTML(profile.bannerURL)}" style="width:100%;height:100%;object-fit:cover;">`);
            if (removeBtn) removeBtn.style.display = '';
        } else {
            bannerDisplay.innerHTML = '';
            if (removeBtn) removeBtn.style.display = 'none';
        }

        document.querySelectorAll('#banner-color-options .color-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === bannerColor);
        });

        // Stats
        const statsBar = document.getElementById('profile-stats-bar');
        statsBar.innerHTML = `
            <div style="text-align:center;"><div style="font-size:18px;font-weight:700;color:var(--primary);">${friends.length}</div><div style="font-size:11px;color:var(--text-secondary);">Amigos</div></div>
            <div style="text-align:center;"><div style="font-size:18px;font-weight:700;color:var(--primary);">${Icons.fire} ${streak}</div><div style="font-size:11px;color:var(--text-secondary);">Racha</div></div>`;

        this._setupBannerUpload();
        this._setupPhotoUpload();
        this._setupUsernameValidation();
    },

    _setupPhotoUpload() {
        const wrapper = document.getElementById('profile-photo-wrapper');
        const input = document.getElementById('profile-photo-input');
        if (!wrapper || !input) return;
        wrapper.onclick = () => input.click();
        input.onchange = (e) => {
            if (e.target.files[0]) App.openCropper(e.target.files[0], (dataURL) => this.applyPhoto(dataURL));
        };
    },

    applyPhoto(dataURL) {
        this._pendingPhoto = dataURL;
        document.getElementById('profile-photo-display').innerHTML = `<img src="${dataURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    },

    _setupBannerUpload() {
        const wrapper = document.getElementById('profile-banner-wrapper');
        const input = document.getElementById('profile-banner-input');
        if (!wrapper || !input) return;
        wrapper.onclick = (e) => {
            if (e.target.closest('#banner-remove-photo') || e.target.closest('label')) return;
            input.click();
        };
        wrapper.onmouseenter = () => { const o = wrapper.querySelector('.profile-banner-overlay'); if (o) o.style.opacity = '1'; };
        wrapper.onmouseleave = () => { const o = wrapper.querySelector('.profile-banner-overlay'); if (o) o.style.opacity = '0'; };
        input.onchange = (e) => {
            if (e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    this._pendingBanner = ev.target.result;
                    document.getElementById('profile-banner-display').innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
                    const removeBtn = document.getElementById('banner-remove-photo');
                    if (removeBtn) removeBtn.style.display = '';
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        };

        document.querySelectorAll('#banner-color-options .color-option').forEach(opt => {
            opt.onclick = () => {
                document.querySelectorAll('#banner-color-options .color-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                const color = opt.dataset.color;
                this._pendingBannerColor = color;
                document.getElementById('profile-banner-wrapper').style.background = color;
            };
        });
    },

    removeBannerPhoto() {
        this._pendingBanner = null;
        this._pendingBannerColorRemoval = true;
        document.getElementById('profile-banner-display').innerHTML = '';
        const removeBtn = document.getElementById('banner-remove-photo');
        if (removeBtn) removeBtn.style.display = 'none';
        const input = document.getElementById('profile-banner-input');
        if (input) input.value = '';
    },

    _setupUsernameValidation() {
        const input = document.getElementById('profile-username');
        const status = document.getElementById('username-status');
        if (!input || input._blurSet) return;
        input._blurSet = true;
        input.addEventListener('blur', async () => {
            const val = input.value.trim();
            if (!val) {
                status.textContent = 'Obligatorio para añadir amigos';
                status.style.color = 'var(--text-secondary)';
                return;
            }
            if (val.length < 3) {
                status.textContent = 'Mínimo 3 caracteres';
                status.style.color = 'var(--danger, #ff3b30)';
                return;
            }
            status.textContent = 'Comprobando...';
            status.style.color = 'var(--text-secondary)';
            const available = await DB.checkUsernameAvailable(val, Auth.currentUser.uid);
            if (available) {
                status.textContent = '@' + val + ' — Disponible';
                status.style.color = 'var(--success, #00b894)';
            } else {
                status.textContent = '@' + val + ' — Ya está en uso';
                status.style.color = 'var(--danger, #ff3b30)';
            }
        });
    },

    async saveProfile() {
        const profile = await DB.getProfile();
        const now = new Date();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        const newName = document.getElementById('profile-name').value;
        const newUsername = document.getElementById('profile-username').value.trim();
        const bio = document.getElementById('profile-bio').value;
        const university = document.getElementById('profile-university').value;
        const degree = document.getElementById('profile-degree').value;

        if (newName.length > 50) { Utils.showToast('El nombre no puede tener más de 50 caracteres', 'error'); return; }
        if (bio.length > 200) { Utils.showToast('La bio no puede tener más de 200 caracteres', 'error'); return; }
        if (university.length > 100) { Utils.showToast('La universidad no puede tener más de 100 caracteres', 'error'); return; }
        if (degree.length > 100) { Utils.showToast('El grado no puede tener más de 100 caracteres', 'error'); return; }

        let finalName = profile.name;
        const nameLastChanged = profile.nameLastChanged ? new Date(profile.nameLastChanged) : null;
        if (newName !== profile.name) {
            if (nameLastChanged && (now - nameLastChanged) < thirtyDaysMs) {
                const daysLeft = Math.ceil((thirtyDaysMs - (now - nameLastChanged)) / (24 * 60 * 60 * 1000));
                Utils.showToast(`Solo puedes cambiar el nombre cada 30 días. Disponible en ${daysLeft} días`, 'error');
                return;
            }
            finalName = newName;
        }

        let finalUsername = profile.username;
        if (newUsername !== profile.username) {
            const usernameLastChanged = profile.usernameLastChanged ? new Date(profile.usernameLastChanged) : null;
            if (usernameLastChanged && (now - usernameLastChanged) < thirtyDaysMs) {
                const daysLeft = Math.ceil((thirtyDaysMs - (now - usernameLastChanged)) / (24 * 60 * 60 * 1000));
                Utils.showToast(`Solo puedes cambiar el usuario cada 30 días. Disponible en ${daysLeft} días`, 'error');
                return;
            }
            if (!newUsername || newUsername.length < 3) {
                Utils.showToast('El usuario debe tener al menos 3 caracteres', 'error');
                return;
            }
            const available = await DB.checkUsernameAvailable(newUsername, Auth.currentUser.uid);
            if (!available) {
                Utils.showToast('Ese usuario ya está en uso', 'error');
                return;
            }
            finalUsername = newUsername;
        }

        try {
            const updates = { name: finalName, username: finalUsername, usernameLower: finalUsername.toLowerCase(), bio, university, degree };
            if (newName !== profile.name) updates.nameLastChanged = new Date().toISOString();
            if (newUsername !== profile.username) updates.usernameLastChanged = new Date().toISOString();
            if (this._pendingPhoto && Utils.isValidPhotoURL(this._pendingPhoto)) updates.photoURL = this._pendingPhoto;
            if (this._pendingBanner && Utils.isValidPhotoURL(this._pendingBanner)) updates.bannerURL = this._pendingBanner;
            if (this._pendingBannerColor) updates.bannerColor = this._pendingBannerColor;
            if (this._pendingBannerColorRemoval) updates.bannerURL = '';

            await DB.updateProfile(updates);

            document.getElementById('user-name').textContent = finalName || Auth.currentUser?.email.split('@')[0];
            if (this._pendingPhoto) {
                const avatarEl = document.getElementById('user-avatar');
                avatarEl.innerHTML = `<img src="${this._pendingPhoto}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            }
            this._pendingPhoto = null;
            this._pendingBanner = null;
            this._pendingBannerColorRemoval = false;
            Utils.showToast('Perfil actualizado', 'success');
        } catch (e) {
            Utils.showToast('Error al guardar', 'error');
        }
    },

    destroy() {
        this._pendingPhoto = null;
        this._pendingBanner = null;
        this._pendingBannerColorRemoval = false;
    }
};
