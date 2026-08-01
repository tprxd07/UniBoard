// Auth Module
const Auth = {
    currentUser: null,

    init() {
        // Form listeners
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('register-form').classList.remove('hidden');
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
        });

        document.getElementById('btn-login').addEventListener('click', () => this.login());
        document.getElementById('btn-register').addEventListener('click', () => this.register());
        document.getElementById('btn-logout').addEventListener('click', () => this.logout());

        // Enter key support
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        document.getElementById('reg-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.register();
        });

        // Listen for auth state changes
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Load profile from Firestore to get name
                try {
                    const doc = await db.collection('users').doc(user.uid).get();
                    const profile = doc.data();
                    this.currentUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: profile?.name || user.email.split('@')[0]
                    };
                } catch (e) {
                    this.currentUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.email.split('@')[0]
                    };
                }
                this.onLogin(this.currentUser);
            } else {
                this.currentUser = null;
                this.onLogout();
            }
        });
    },

    async login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        if (!email || !password) {
            errorEl.textContent = 'Por favor, rellena todos los campos';
            errorEl.classList.remove('hidden');
            return;
        }

        try {
            errorEl.classList.add('hidden');
            document.getElementById('btn-login').disabled = true;
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            let msg = 'Error al iniciar sesión';
            if (error.code === 'auth/user-not-found') msg = 'Usuario no encontrado';
            if (error.code === 'auth/wrong-password') msg = 'Contraseña incorrecta';
            if (error.code === 'auth/invalid-email') msg = 'Email no válido';
            if (error.code === 'auth/too-many-requests') msg = 'Demasiados intentos. Espera un momento';
            if (error.code === 'auth/invalid-credential') msg = 'Email o contraseña incorrectos';
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        } finally {
            document.getElementById('btn-login').disabled = false;
        }
    },

    async register() {
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const university = document.getElementById('reg-university').value;
        const degree = document.getElementById('reg-degree').value;
        const errorEl = document.getElementById('register-error');

        if (!name || !email || !password) {
            errorEl.textContent = 'Por favor, rellena nombre, email y contraseña';
            errorEl.classList.remove('hidden');
            return;
        }

        if (password.length < 6) {
            errorEl.textContent = 'La contraseña debe tener al menos 6 caracteres';
            errorEl.classList.remove('hidden');
            return;
        }

        try {
            errorEl.classList.add('hidden');
            document.getElementById('btn-register').disabled = true;

            const cred = await auth.createUserWithEmailAndPassword(email, password);

            // Create user profile in Firestore
            await db.collection('users').doc(cred.user.uid).set({
                name: name,
                email: email,
                university: university || '',
                degree: degree || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                settings: {
                    theme: 'light',
                    accentColor: '#6C5CE7',
                    pomodoroWork: 25,
                    pomodoroBreak: 5,
                    pomodoroLongBreak: 15
                }
            });

        } catch (error) {
            let msg = 'Error al crear la cuenta';
            if (error.code === 'auth/email-already-in-use') msg = 'Este email ya está registrado';
            if (error.code === 'auth/invalid-email') msg = 'Email no válido';
            if (error.code === 'auth/weak-password') msg = 'Contraseña demasiado débil';
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        } finally {
            document.getElementById('btn-register').disabled = false;
        }
    },

    async logout() {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    onLogin(user) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('user-name').textContent = user.displayName || user.email.split('@')[0];
        App.init();
    },

    onLogout() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }
};
