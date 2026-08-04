// Main App Controller
const App = {
    currentPage: 'dashboard',
    pages: {},
    initialized: false,
    cropper: null,
    pendingPhotoCallback: null,

    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.registerPages();
        this.setupNavigation();
        this.setupSidebar();
        this.setupProfileModal();
        this.loadSidebarAvatar();
        this.startClock();
        this.loadPage('dashboard');
        this.loadSettings();
    },

    registerPages() {
        this.pages = {
            dashboard: DashboardPage,
            activities: ActivitiesPage,
            calendar: CalendarPage,
            subjects: SubjectsPage,
            tasks: TasksPage,
            exams: ExamsPage,
            study: StudyPage,
            documents: DocumentsPage,
            contacts: ContactsPage,
            friends: FriendsPage,
            settings: SettingsPage
        };
    },

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) this.loadPage(page);
            });
        });
    },

    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const openBtn = document.getElementById('open-sidebar');
        const closeBtn = document.getElementById('close-sidebar');
        const toggleBtn = document.getElementById('toggle-sidebar');

        openBtn?.addEventListener('click', () => sidebar.classList.add('open'));
        closeBtn?.addEventListener('click', () => sidebar.classList.remove('open'));

        const hamburgerSVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
        const arrowSVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

        const updateToggleIcon = () => {
            if (!toggleBtn) return;
            toggleBtn.innerHTML = sidebar.classList.contains('collapsed') ? arrowSVG : hamburgerSVG;
        };

        toggleBtn?.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
            updateToggleIcon();
        });

        // Restore sidebar state
        if (localStorage.getItem('sidebar-collapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }
        updateToggleIcon();

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => sidebar.classList.remove('open'));
        });

        document.getElementById('btn-settings')?.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.remove('open');
            this.loadPage('settings');
        });

        const userNameEl = document.getElementById('user-name');
        userNameEl?.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.remove('open');
            this.openProfileModal();
        });

        const avatarInput = document.getElementById('sidebar-avatar-input');
        const avatarEl = document.getElementById('user-avatar');

        avatarEl?.addEventListener('click', (e) => {
            e.stopPropagation();
            avatarInput?.click();
        });

        avatarInput?.addEventListener('change', (e) => {
            if (e.target.files[0]) this.openCropper(e.target.files[0], (dataURL) => this.applyAvatar(dataURL));
        });

        avatarEl?.addEventListener('dragover', (e) => { e.preventDefault(); avatarEl.classList.add('drag-over'); });
        avatarEl?.addEventListener('dragleave', () => avatarEl.classList.remove('drag-over'));
        avatarEl?.addEventListener('drop', (e) => {
            e.preventDefault();
            avatarEl.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) this.openCropper(file, (dataURL) => this.applyAvatar(dataURL));
        });
    },

    setupProfileModal() {
        const wrapper = document.getElementById('profile-photo-wrapper');
        const input = document.getElementById('profile-photo-input');

        wrapper?.addEventListener('click', () => input?.click());

        input?.addEventListener('change', (e) => {
            if (e.target.files[0]) this.openCropper(e.target.files[0], (dataURL) => this.applyProfilePhoto(dataURL));
        });

        wrapper?.addEventListener('dragover', (e) => { e.preventDefault(); wrapper.classList.add('drag-over'); });
        wrapper?.addEventListener('dragleave', () => wrapper.classList.remove('drag-over'));
        wrapper?.addEventListener('drop', (e) => {
            e.preventDefault();
            wrapper.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) this.openCropper(file, (dataURL) => this.applyProfilePhoto(dataURL));
        });

        document.getElementById('save-profile-modal')?.addEventListener('click', () => this.saveProfileFromModal());

        // Crop controls
        document.getElementById('crop-rotate-left')?.addEventListener('click', () => {
            if (this.cropper) this.cropper.rotate(-90);
        });
        document.getElementById('crop-rotate-right')?.addEventListener('click', () => {
            if (this.cropper) this.cropper.rotate(90);
        });
        document.getElementById('crop-flip-h')?.addEventListener('click', () => {
            if (this.cropper) this.cropper.scaleX(this.cropper.getData().scaleX === -1 ? 1 : -1);
        });
        document.getElementById('crop-cancel')?.addEventListener('click', () => this.closeCropper());
        document.getElementById('crop-confirm')?.addEventListener('click', () => this.confirmCrop());
    },

    openCropper(file, callback) {
        this.pendingPhotoCallback = callback;
        const reader = new FileReader();
        reader.onload = (e) => {
            const cropContainer = document.getElementById('crop-container');
            const photoSection = document.querySelector('.profile-photo-section');
            const cropImage = document.getElementById('crop-image');

            cropImage.src = e.target.result;
            cropContainer.classList.remove('hidden');
            photoSection.style.display = 'none';

            if (this.cropper) this.cropper.destroy();
            this.cropper = new Cropper(cropImage, {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 0.9,
                responsive: true,
                background: false,
                guides: false,
                highlight: false,
                cropBoxResizable: true
            });
        };
        reader.readAsDataURL(file);
    },

    confirmCrop() {
        if (!this.cropper) return;
        const canvas = this.cropper.getCroppedCanvas({ width: 400, height: 400 });
        const dataURL = canvas.toDataURL('image/jpeg', 0.85);
        if (this.pendingPhotoCallback) this.pendingPhotoCallback(dataURL);
        this.closeCropper();
    },

    closeCropper() {
        if (this.cropper) { this.cropper.destroy(); this.cropper = null; }
        this.pendingPhotoCallback = null;
        const cropContainer = document.getElementById('crop-container');
        const photoSection = document.querySelector('.profile-photo-section');
        cropContainer.classList.add('hidden');
        photoSection.style.display = '';
        // Reset file input
        const input = document.getElementById('profile-photo-input');
        if (input) input.value = '';
        const sidebarInput = document.getElementById('sidebar-avatar-input');
        if (sidebarInput) sidebarInput.value = '';
    },

    closeProfileModal() {
        this.closeCropper();
        this._pendingBanner = null;
        this._pendingBannerColorRemoval = null;
        document.getElementById('profile-modal').classList.add('hidden');
    },

    applyProfilePhoto(dataURL) {
        const display = document.getElementById('profile-photo-display');
        display.innerHTML = `<img src="${dataURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        this._pendingPhoto = dataURL;
    },

    applyAvatar(dataURL) {
        const avatarEl = document.getElementById('user-avatar');
        avatarEl.innerHTML = `<img src="${dataURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        this._pendingPhoto = dataURL;
        // Auto-save from sidebar
        this.savePhotoToProfile(dataURL);
    },

    async savePhotoToProfile(dataURL) {
        try {
            await DB.updateProfile({ photoURL: dataURL });
            Utils.showToast('Foto actualizada', 'success');
        } catch (err) {
            Utils.showToast('Error al guardar foto', 'error');
        }
    },

    async openProfileModal() {
        this._pendingPhoto = null;
        this._pendingBanner = null;
        this._pendingBannerColor = null;
        const modal = document.getElementById('profile-modal');
        modal.classList.remove('hidden');

        const [profile, friends, sessions] = await Promise.all([
            DB.getProfile(),
            DB.getFriends().catch(() => []),
            DB.getStudySessions().catch(() => [])
        ]);
        const streak = DB.calculateStreakFromSessions(sessions);

        const nameInput = document.getElementById('profile-name');
        const usernameInput = document.getElementById('profile-username');
        nameInput.value = profile.name || '';
        usernameInput.value = profile.username || '';
        document.getElementById('profile-bio').value = profile.bio || '';
        document.getElementById('profile-university').value = profile.university || '';
        document.getElementById('profile-degree').value = profile.degree || '';
        document.getElementById('profile-phone').value = profile.phone || '';

        const usernameStatus = document.getElementById('username-status');
        if (profile.username) {
            usernameStatus.textContent = '@' + profile.username;
            usernameStatus.style.color = 'var(--primary)';
        } else {
            usernameStatus.textContent = 'Obligatorio para añadir amigos';
            usernameStatus.style.color = 'var(--text-secondary)';
        }

        // 30-day cooldown for name and username
        const now = new Date();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

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

        const display = document.getElementById('profile-photo-display');
        if (profile.photoURL) {
            display.innerHTML = `<img src="${profile.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            display.innerHTML = '👤';
        }

        const bannerWrapper = document.getElementById('profile-banner-wrapper');
        const bannerColor = profile.bannerColor || '#6C5CE7';
        bannerWrapper.style.background = bannerColor;
        this._pendingBannerColor = bannerColor;

        const bannerDisplay = document.getElementById('profile-banner-display');
        const removeBtn = document.getElementById('banner-remove-photo');
        if (profile.bannerURL) {
            bannerDisplay.innerHTML = `<img src="${profile.bannerURL}" style="width:100%;height:100%;object-fit:cover;">`;
            if (removeBtn) removeBtn.style.display = '';
        } else {
            bannerDisplay.innerHTML = '';
            if (removeBtn) removeBtn.style.display = 'none';
        }

        document.querySelectorAll('#banner-color-options .color-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === bannerColor);
        });

        const statsBar = document.getElementById('profile-stats-bar');
        statsBar.innerHTML = `
            <div style="text-align:center;"><div style="font-size:18px;font-weight:700;color:var(--primary);">${friends.length}</div><div style="font-size:11px;color:var(--text-secondary);">Amigos</div></div>
            <div style="text-align:center;"><div style="font-size:18px;font-weight:700;color:var(--primary);">🔥 ${streak}</div><div style="font-size:11px;color:var(--text-secondary);">Racha</div></div>`;

        this._setupBannerUpload();
        this._setupUsernameValidation();
    },

    _setupUsernameValidation() {
        const input = document.getElementById('profile-username');
        const status = document.getElementById('username-status');
        if (!input || !input._blurSet) {
            if (input) {
                input._blurSet = true;
                input.addEventListener('blur', async () => {
                    const val = input.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
                    input.value = val;
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
            }
        }
    },

    _setupBannerUpload() {
        const wrapper = document.getElementById('profile-banner-wrapper');
        const input = document.getElementById('profile-banner-input');
        if (!wrapper || !input) return;
        wrapper.onclick = (e) => {
            if (e.target.closest('#banner-remove-photo') || e.target.closest('label')) return;
            input.click();
        };
        wrapper.onmouseenter = () => { wrapper.querySelector('.profile-banner-overlay').style.opacity = '1'; };
        wrapper.onmouseleave = () => { wrapper.querySelector('.profile-banner-overlay').style.opacity = '0'; };
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
                const bw = document.getElementById('profile-banner-wrapper');
                bw.style.background = color;
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

    async saveProfileFromModal() {
        const profile = await DB.getProfile();
        const now = new Date();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        const newName = document.getElementById('profile-name').value;
        const newUsername = document.getElementById('profile-username').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        const bio = document.getElementById('profile-bio').value;
        const university = document.getElementById('profile-university').value;
        const degree = document.getElementById('profile-degree').value;
        const phone = document.getElementById('profile-phone').value;

        // Check 30-day cooldown for name
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

        // Check 30-day cooldown for username
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
            const updates = { name: finalName, username: finalUsername, bio, university, degree, phone };

            if (newName !== profile.name) updates.nameLastChanged = new Date().toISOString();
            if (newUsername !== profile.username) updates.usernameLastChanged = new Date().toISOString();

            if (this._pendingPhoto) updates.photoURL = this._pendingPhoto;
            if (this._pendingBanner) updates.bannerURL = this._pendingBanner;
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
            this._pendingBannerColorRemoval = null;
            this.closeProfileModal();
            Utils.showToast('Perfil actualizado', 'success');
        } catch (e) {
            Utils.showToast('Error al guardar', 'error');
        }
    },

    async loadSidebarAvatar() {
        try {
            const profile = await DB.getProfile();
            if (profile.photoURL) {
                const avatarEl = document.getElementById('user-avatar');
                avatarEl.innerHTML = `<img src="${profile.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            }
        } catch (e) {}
    },

    loadPage(pageName) {
        this.currentPage = pageName;
        const page = this.pages[pageName];

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });

        const titles = {
            dashboard: 'Inicio',
            calendar: 'Calendario',
            subjects: 'Asignaturas',
            tasks: 'Tareas',
            exams: 'Exámenes',
            study: 'Estudio',
            documents: 'Documentos',
            finances: 'Finanzas',
            'uni-life': 'Vida universitaria',
            progress: 'Progreso académico',
            goals: 'Objetivos',
            reminders: 'Recordatorios',
            contacts: 'Contactos',
            friends: 'Amigos',
            settings: 'Ajustes',
            activities: 'Actividades'
        };
        document.getElementById('page-title').textContent = titles[pageName] || pageName;

        if (page && page.render) {
            document.getElementById('page-content').innerHTML = page.render();
            if (page.init) page.init();
        }
    },

    startClock() {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const updateClock = () => {
            const now = new Date();
            const dateEl = document.getElementById('current-date');
            const timeEl = document.getElementById('current-time');
            if (dateEl) {
                dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
            }
            if (timeEl) {
                timeEl.textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            }
            // Update dashboard greeting live
            const greetingEl = document.querySelector('.dashboard-greeting h2');
            if (greetingEl && this.currentPage === 'dashboard') {
                const name = greetingEl.textContent.split(', ').slice(1).join(', ');
                greetingEl.textContent = `${Utils.getGreeting()}, ${name}`;
            }
        };
        updateClock();
        setInterval(updateClock, 1000);
    },

    async loadSettings() {
        try {
            const settings = await DB.getSettings();
            if (settings.theme) {
                document.documentElement.dataset.theme = settings.theme;
            }
            if (settings.accentColor) {
                document.documentElement.style.setProperty('--primary', settings.accentColor);
            }
            if (settings.bgColor) {
                SettingsPage.applyBgColor(settings.bgColor);
            }
        } catch (e) {
            console.log('Using default settings');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
