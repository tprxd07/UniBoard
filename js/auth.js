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
        document.getElementById('btn-google-login').addEventListener('click', () => this.loginWithGoogle());
        document.getElementById('btn-apple-login').addEventListener('click', () => this.loginWithApple());

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
                // Load profile from Firestore, create if first social login
                try {
                    const doc = await db.collection('users').doc(user.uid).get();
                    let profile = doc.data();

                    // First time social login - create profile
                    if (!profile) {
                        const defaultProfile = {
                            name: user.displayName || user.email.split('@')[0],
                            email: user.email || '',
                            provider: user.providerData[0]?.providerId || 'password',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            settings: {
                                theme: 'light',
                                accentColor: '#6C5CE7',
                                pomodoroWork: 25,
                                pomodoroBreak: 5,
                                pomodoroLongBreak: 15
                            }
                        };
                        await db.collection('users').doc(user.uid).set(defaultProfile);
                        await DB.initDefaultGroups();
                        profile = defaultProfile;
                    }

                    this.currentUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: profile?.name || user.displayName || user.email.split('@')[0]
                    };
                } catch (e) {
                    this.currentUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || user.email.split('@')[0]
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
        const errorEl = document.getElementById('register-error');

        if (!name || !email || !password) {
            errorEl.textContent = 'Por favor, rellena todos los campos';
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
                provider: 'password',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                settings: {
                    theme: 'light',
                    accentColor: '#6C5CE7',
                    pomodoroWork: 25,
                    pomodoroBreak: 5,
                    pomodoroLongBreak: 15
                }
            });

            await DB.initDefaultGroups();

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

    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithPopup(provider);
        } catch (error) {
            let msg = 'Error al iniciar sesión con Google';
            if (error.code === 'auth/popup-closed-by-user') msg = 'Cancelado';
            if (error.code === 'auth/popup-blocked') msg = 'Popup bloqueado. Permite popups para este sitio';
            if (error.code === 'auth/account-exists-with-different-credential') {
                msg = 'Ya existe una cuenta con este email usando otro método de inicio de sesión';
            }
            if (msg !== 'Cancelado') {
                const errorEl = document.getElementById('login-error');
                errorEl.textContent = msg;
                errorEl.classList.remove('hidden');
            }
        }
    },

    async loginWithApple() {
        try {
            const provider = new firebase.auth.OAuthProvider('apple.com');
            provider.addScope('email');
            provider.addScope('name');
            await auth.signInWithPopup(provider);
        } catch (error) {
            let msg = 'Error al iniciar sesión con Apple';
            if (error.code === 'auth/popup-closed-by-user') msg = 'Cancelado';
            if (error.code === 'auth/popup-blocked') msg = 'Popup bloqueado. Permite popups para este sitio';
            if (error.code === 'auth/account-exists-with-different-credential') {
                msg = 'Ya existe una cuenta con este email usando otro método de inicio de sesión';
            }
            if (msg !== 'Cancelado') {
                const errorEl = document.getElementById('login-error');
                errorEl.textContent = msg;
                errorEl.classList.remove('hidden');
            }
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
