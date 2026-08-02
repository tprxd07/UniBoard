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

        // Close sidebar on page load (mobile)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => sidebar.classList.remove('open'));
        });
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
