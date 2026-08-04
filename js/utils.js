// Utility Functions
const Utils = {
    // Format date
    formatDate(date, format = 'short') {
        const d = new Date(date);
        const options = {
            short: { day: 'numeric', month: 'short' },
            medium: { day: 'numeric', month: 'short', year: 'numeric' },
            long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            datetime: { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
        };
        return d.toLocaleDateString('es-ES', options[format] || options.short);
    },

    // Format time
    formatTime(date) {
        return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    },

    // Get days until date
    daysUntil(date) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);
        return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    },

    // Get countdown object
    getCountdown(date) {
        const now = new Date();
        const target = new Date(date);
        const diff = target - now;

        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000),
            expired: false
        };
    },

    // Format countdown
    formatCountdown(date) {
        const cd = this.getCountdown(date);
        if (cd.expired) return 'Ya pasó';
        if (cd.days > 0) return `${cd.days}d ${cd.hours}h`;
        if (cd.hours > 0) return `${cd.hours}h ${cd.minutes}m`;
        return `${cd.minutes}m ${cd.seconds}s`;
    },

    // Get day name
    getDayName(date, short = false) {
        return new Date(date).toLocaleDateString('es-ES', {
            weekday: short ? 'short' : 'long'
        });
    },

    // Get month name
    getMonthName(date) {
        return new Date(date).toLocaleDateString('es-ES', { month: 'long' });
    },

    // Is same day
    isSameDay(d1, d2) {
        const a = new Date(d1);
        const b = new Date(d2);
        return a.getFullYear() === b.getFullYear() &&
               a.getMonth() === b.getMonth() &&
               a.getDate() === b.getDate();
    },

    // Is today
    isToday(date) {
        return this.isSameDay(date, new Date());
    },

    // Get week number
    getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
        const week1 = new Date(d.getFullYear(), 0, 4);
        return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    },

    // Get start of week (Monday)
    getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    },

    // Get days in month
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    },

    // Get first day of month (0 = Sunday)
    getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    },

    // Add days to date
    addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    },

    // Get greeting based on time
    getGreeting() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 13) return 'Buenos días';
        if (hour >= 13 && hour < 20) return 'Buenas tardes';
        return 'Buenas noches';
    },

    // Get weather suggestion based on month (Spain)
    getSeasonOutfit() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return '🧥 Puede hacer fresco, lleva una chaqueta ligera';
        if (month >= 5 && month <= 7) return '👕 Ropa ligera y protege el sol';
        if (month >= 8 && month <= 10) return '🧣 Empieza a refrescar, ponte una muda extra';
        return '🧤 ¡Abrígate bien! Hace mucho frío';
    },

    // Get motivational quote
    getQuote() {
        const quotes = [
            "El éxito es la suma de pequeños esfuerzos, repetidos día tras día.",
            "La educación es el arma más poderosa que puedes usar para cambiar el mundo.",
            "No importa lo lento que vayas, siempre y cuando no te detengas.",
            "El futuro pertenece a quienes creen en la belleza de sus sueños.",
            "La mejor manera de predecir el futuro es creándolo.",
            "Cada día es una nueva oportunidad para ser mejor que ayer.",
            "El conocimiento es la única riqueza que nadie te puede quitar.",
            "Los sueños no se cumplen solos, hay que trabajar por ellos.",
            "La persistencia es el camino del éxito.",
            "Tu futuro es creado por lo que haces hoy, no mañana."
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    },

    // Get color for subject
    getSubjectColor(index) {
        const colors = ['#6C5CE7', '#00B894', '#E17055', '#74B9FF', '#FDCB6E', '#A29BFE', '#FD79A8', '#00CEC9'];
        return colors[index % colors.length];
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Debounce
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    // Show modal
    showModal(title, bodyHTML, onConfirm) {
        const modal = document.getElementById('modal');
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHTML;
        modal.classList.remove('hidden');

        const confirmBtn = document.getElementById('modal-confirm');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.id = 'modal-confirm';

        if (onConfirm) {
            newConfirmBtn.addEventListener('click', () => {
                onConfirm();
                modal.classList.add('hidden');
            });
        }

        // Close handlers
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => modal.classList.add('hidden'));
        });
        modal.querySelector('.modal-overlay').addEventListener('click', () => modal.classList.add('hidden'));
    },

    // Close modal
    closeModal() {
        document.getElementById('modal').classList.add('hidden');
    },

    // Format currency
    formatCurrency(amount) {
        return parseFloat(amount).toFixed(2) + ' €';
    },

    // Get grade color
    getGradeColor(grade) {
        if (grade >= 9) return 'var(--success)';
        if (grade >= 7) return 'var(--info)';
        if (grade >= 5) return 'var(--warning)';
        return 'var(--danger)';
    }
};
