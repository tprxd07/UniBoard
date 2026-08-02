// Main App Controller
const App = {
    currentPage: 'dashboard',
    pages: {},
    initialized: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.registerPages();
        this.setupNavigation();
        this.setupSidebar();
        this.setupProfileModal();
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
            timer: TimerPage,
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

        openBtn?.addEventListener('click', () => sidebar.classList.add('open'));
        closeBtn?.addEventListener('click', () => sidebar.classList.remove('open'));

        // Close sidebar on nav click (mobile)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => sidebar.classList.remove('open'));
        });

        // Settings gear button
        document.getElementById('btn-settings')?.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.remove('open');
            this.loadPage('settings');
        });

        // Profile click opens modal
        document.getElementById('btn-profile')?.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.remove('open');
            this.openProfileModal();
        });
    },

    setupProfileModal() {
        const wrapper = document.getElementById('profile-photo-wrapper');
        const input = document.getElementById('profile-photo-input');
        const display = document.getElementById('profile-photo-display');

        // Click to upload
        wrapper?.addEventListener('click', () => input?.click());

        // File input change
        input?.addEventListener('change', (e) => {
            if (e.target.files[0]) this.handleProfilePhoto(e.target.files[0]);
        });

        // Drag & drop on photo
        wrapper?.addEventListener('dragover', (e) => { e.preventDefault(); wrapper.classList.add('drag-over'); });
        wrapper?.addEventListener('dragleave', () => wrapper.classList.remove('drag-over'));
        wrapper?.addEventListener('drop', (e) => {
            e.preventDefault();
            wrapper.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) this.handleProfilePhoto(file);
        });

        // Save profile
        document.getElementById('save-profile-modal')?.addEventListener('click', () => this.saveProfileFromModal());
    },

    async openProfileModal() {
        const modal = document.getElementById('profile-modal');
        modal.classList.remove('hidden');

        const profile = await DB.getProfile();
        document.getElementById('profile-name').value = profile.name || '';
        document.getElementById('profile-university').value = profile.university || '';
        document.getElementById('profile-degree').value = profile.degree || '';

        // Load photo
        const display = document.getElementById('profile-photo-display');
        if (profile.photoURL) {
            display.innerHTML = `<img src="${profile.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            display.innerHTML = '👤';
        }
    },

    handleProfilePhoto(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataURL = e.target.result;
            const display = document.getElementById('profile-photo-display');
            display.innerHTML = `<img src="${dataURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;

            // Save to Firestore
            try {
                await DB.updateProfile({ photoURL: dataURL });
                Utils.showToast('Foto actualizada', 'success');
            } catch (err) {
                Utils.showToast('Error al guardar foto', 'error');
            }
        };
        reader.readAsDataURL(file);
    },

    async saveProfileFromModal() {
        const name = document.getElementById('profile-name').value;
        const university = document.getElementById('profile-university').value;
        const degree = document.getElementById('profile-degree').value;

        try {
            await DB.updateProfile({ name, university, degree });
            document.getElementById('user-name').textContent = name || Auth.currentUser?.email.split('@')[0];
            document.getElementById('profile-modal').classList.add('hidden');
            Utils.showToast('Perfil actualizado', 'success');
        } catch (e) {
            Utils.showToast('Error al guardar', 'error');
        }
    },

    loadPage(pageName) {
        this.currentPage = pageName;
        const page = this.pages[pageName];

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });

        // Update title
        const titles = {
            dashboard: 'Inicio',
            calendar: 'Calendario',
            subjects: 'Asignaturas',
            tasks: 'Tareas',
            exams: 'Exámenes',
            study: 'Planificador de estudio',
            timer: 'Temporizador',
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

        // Render page
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

// Initialize auth on load
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
