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
            calendar: CalendarPage,
            subjects: SubjectsPage,
            tasks: TasksPage,
            exams: ExamsPage,
            study: StudyPage,
            documents: DocumentsPage,
            finances: FinancesPage,
            'uni-life': UniLifePage,
            progress: ProgressPage,
            goals: GoalsPage,
            reminders: RemindersPage,
            contacts: ContactsPage,
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

        toggleBtn?.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
        });

        // Restore sidebar state
        if (localStorage.getItem('sidebar-collapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }

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
        const modal = document.getElementById('profile-modal');
        modal.classList.remove('hidden');

        const profile = await DB.getProfile();
        document.getElementById('profile-name').value = profile.name || '';
        document.getElementById('profile-university').value = profile.university || '';
        document.getElementById('profile-degree').value = profile.degree || '';

        const display = document.getElementById('profile-photo-display');
        if (profile.photoURL) {
            display.innerHTML = `<img src="${profile.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            display.innerHTML = '👤';
        }
    },

    async saveProfileFromModal() {
        const name = document.getElementById('profile-name').value;
        const university = document.getElementById('profile-university').value;
        const degree = document.getElementById('profile-degree').value;

        try {
            const updates = { name, university, degree };
            if (this._pendingPhoto) updates.photoURL = this._pendingPhoto;
            await DB.updateProfile(updates);

            document.getElementById('user-name').textContent = name || Auth.currentUser?.email.split('@')[0];
            if (this._pendingPhoto) {
                const avatarEl = document.getElementById('user-avatar');
                avatarEl.innerHTML = `<img src="${this._pendingPhoto}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            }
            this._pendingPhoto = null;
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
            settings: 'Ajustes'
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
        } catch (e) {
            console.log('Using default settings');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        Auth.init();
    } catch(e) {
        var el = document.getElementById('error-banner');
        if (el) { el.style.display='block'; el.textContent='INIT ERROR: ' + e.message + '\n' + e.stack; }
    }
});
