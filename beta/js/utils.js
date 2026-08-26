// Utility Functions
const Utils = {
    // Security: Sanitize HTML with DOMPurify
    sanitize(html) {
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b','i','em','strong','span','br','p','div','a','ul','ol','li','h1','h2','h3','h4','h5','h6','label','button','input','select','option','textarea','svg','path','polyline','line','circle','rect','img','table','thead','tbody','tr','td','th'], ALLOWED_ATTR: ['class','style','id','href','target','src','alt','width','height','viewBox','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','d','points','x','y','cx','cy','r','rx','ry','x1','y1','x2','y2','data-id','data-color','data-page','data-tab','data-filter','data-mode','data-view','data-reading','data-icon-mode','data-period','data-emoji-toggle','data-color-bg','data-click','data-subject-id','data-task-id','data-exam-id','data-url','data-idx','data-group','data-detail-tab','data-stab','data-day','data-music','data-group-toggle','data-open-event','data-goto-day','placeholder','value','type','min','max','step','rows','checked','selected','disabled','accept','for','rel','title','onclick','onchange'] });
        }
        return html;
    },

    // Security: Escape HTML entities for safe innerHTML/attribute injection
    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/`/g, '&#96;');
    },

    // Default event color: complementary to the accent color chosen in settings
    // (hue + 180), tuned for readability on the current theme
    getComplementaryColor() {
        const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
        let hex = primary;
        if (primary.startsWith('rgb')) {
            const m = primary.match(/\d+/g);
            if (m && m.length >= 3) {
                hex = '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
            }
        }
        const m = /^#?([0-9a-f]{6})$/i.exec(hex);
        if (!m) return '#E17055';

        const num = parseInt(m[1], 16);
        let r = ((num >> 16) & 255) / 255;
        let g = ((num >> 8) & 255) / 255;
        let b = (num & 255) / 255;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const l = (max + min) / 2;
        let h = 0, s = 0;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h /= 6;
        }

        // Complementary hue; soften so it looks good as a chip color
        h = (h + 0.5) % 1;
        s = Math.min(s * 0.85, 0.7);
        const isDark = document.documentElement.dataset.theme === 'dark';
        const nl = isDark ? Math.min(Math.max(l, 0.62), 0.74) : Math.min(Math.max(l, 0.34), 0.44);

        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = nl < 0.5 ? nl * (1 + s) : nl + s - nl * s;
        const p = 2 * nl - q;
        const toHex = v => Math.round(v * 255).toString(16).padStart(2, '0');
        return '#' + toHex(hue2rgb(p, q, h + 1 / 3)) + toHex(hue2rgb(p, q, h)) + toHex(hue2rgb(p, q, h - 1 / 3));
    },

    // Security: Validate URL scheme (reject javascript:, data: except images, vbscript:)
    isValidURL(url) {
        if (!url) return false;
        const trimmed = url.trim().toLowerCase();
        if (trimmed.startsWith('javascript:') || trimmed.startsWith('vbscript:') || trimmed.startsWith('data:text/html')) return false;
        return true;
    },

    // Security: Safe URL for href/src attributes
    safeURL(url) {
        if (!url) return '';
        if (!this.isValidURL(url)) return '#';
        return url;
    },

    // Security: Validate photo URL (only http/https/data:image)
    isValidPhotoURL(url) {
        if (!url) return false;
        const trimmed = url.trim();
        if (trimmed.startsWith('data:image/')) return true;
        if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return true;
        return false;
    },

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
        if (hour >= 13 && hour < 21) return 'Buenas tardes';
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
            "Organizar bien el tiempo es ganar tiempo.",
            "Estudiar no es perder tiempo, es invertir en ti.",
            "Un buen plan ahorra muchos malos ratos.",
            "La constancia supera al talento cuando el talento no es constante.",
            "Pequeños avances todos los días llegan lejos.",
            "Prepararse reduce la ansiedad.",
            "Lo hecho, hecho está. Pa'lante.",
            "No es por saber mucho, sino por entender lo necesario.",
            "El que planifica, controla.",
            "A veces solo hay que sentarse y hacerlo."
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
        document.getElementById('modal-body').innerHTML = this.sanitize(bodyHTML);
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

    // External link confirmation
    _getApprovedLinks() {
        try { return JSON.parse(localStorage.getItem('approved_external_links') || '[]'); } catch { return []; }
    },

    openExternalLink(url) {
        if (!url || !this.isValidURL(url)) {
            this.showToast('URL no válida', 'error');
            return;
        }
        const approved = this._getApprovedLinks();
        if (approved.includes(url)) {
            window.open(url, '_blank');
            return;
        }
        const modal = document.getElementById('external-link-modal');
        const urlEl = document.getElementById('external-link-url');
        const confirmBtn = document.getElementById('external-link-confirm');
        const dontShow = document.getElementById('external-link-dont-show');
        urlEl.textContent = url;
        dontShow.checked = false;
        modal.classList.remove('hidden');

        const newConfirm = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
        newConfirm.id = 'external-link-confirm';

        newConfirm.addEventListener('click', () => {
            if (dontShow.checked) {
                const list = this._getApprovedLinks();
                list.push(url);
                localStorage.setItem('approved_external_links', JSON.stringify(list));
            }
            modal.classList.add('hidden');
            window.open(url, '_blank');
        });

        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => modal.classList.add('hidden'));
        });
        modal.querySelector('.modal-overlay').addEventListener('click', () => modal.classList.add('hidden'));
    },

    closeExternalLinkModal() {
        document.getElementById('external-link-modal').classList.add('hidden');
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
