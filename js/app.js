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
        this.setupCropControls();
        this.loadSidebarAvatar();
        this.updateNavIcons();
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
            settings: SettingsPage,
            'uni-life': UniLifePage,
            profile: ProfilePage
        };
    },

    updateNavIcons() {
        const navIcons = {
            dashboard: 'home',
            calendar: 'calendar',
            subjects: 'book',
            activities: 'clipboard',
            study: 'bookOpen',
            documents: 'file',
            'uni-life': 'backpack',
            contacts: 'users',
            friends: 'userPlus'
        };
        Object.entries(navIcons).forEach(([page, icon]) => {
            const navItem = document.querySelector(`.nav-item[data-page="${page}"] .nav-icon`);
            if (navItem) navItem.innerHTML = Icons[icon];
        });
        const logoSm = document.querySelector('.logo-icon-sm');
        if (logoSm) logoSm.innerHTML = Icons.graduationCap;
        const logoLg = document.querySelector('.logo-icon');
        if (logoLg) logoLg.innerHTML = Icons.graduationCap;
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar && !userAvatar.querySelector('img')) userAvatar.innerHTML = Icons.user;
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

        const backdrop = document.getElementById('sidebar-backdrop');
        backdrop?.addEventListener('click', () => sidebar.classList.remove('open'));

        // Swipe to close sidebar on mobile
        let touchStartX = 0;
        sidebar.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        sidebar.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            if (touchStartX - touchEndX > 60) {
                sidebar.classList.remove('open');
            }
        }, { passive: true });

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
            this.loadPage('profile');
        });

        const avatarInput = document.getElementById('sidebar-avatar-input');
        const avatarEl = document.getElementById('user-avatar');

        avatarEl?.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.remove('open');
            this.loadPage('profile');
        });
    },

    setupCropControls() {
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
        if (cropContainer) cropContainer.classList.add('hidden');
        if (photoSection) photoSection.style.display = '';
        const input = document.getElementById('profile-photo-input');
        if (input) input.value = '';
        const sidebarInput = document.getElementById('sidebar-avatar-input');
        if (sidebarInput) sidebarInput.value = '';
    },

    async loadSidebarAvatar() {
        try {
            const profile = await DB.getProfile();
            if (profile.photoURL && Utils.isValidURL(profile.photoURL)) {
                const avatarEl = document.getElementById('user-avatar');
                avatarEl.innerHTML = Utils.sanitize(`<img src="${Utils.escapeHTML(profile.photoURL)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`);
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
            contacts: 'Contactos',
            friends: 'Amigos',
            settings: 'Ajustes',
            activities: 'Actividades',
            'uni-life': 'Mi Universidad',
            profile: 'Perfil'
        };
        document.getElementById('page-title').textContent = titles[pageName] || pageName;
        document.title = `${titles[pageName] || pageName} - UniBoard`;

        const container = document.getElementById('page-content');

        if (page && page.render) {
            container.classList.add('page-exit');
            setTimeout(() => {
                container.scrollTop = 0;
                container.innerHTML = page.render();
                container.classList.remove('page-exit');
                container.classList.add('page-enter');
                setTimeout(() => container.classList.remove('page-enter'), 150);
                if (page.init) page.init();
            }, 100);
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
            if (settings.accentColor) {
                document.documentElement.style.setProperty('--primary', settings.accentColor);
            }
            if (settings.bgColor) {
                SettingsPage.applyBgColor(settings.bgColor);
            }
            if (settings.readingMode && settings.readingMode !== 'off') {
                SettingsPage.applyReadingMode(settings.readingMode);
            }
        } catch (e) {
            console.log('Using default settings');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
