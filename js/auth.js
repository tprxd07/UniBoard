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
        document.getElementById('btn-google-login').addEventListener('click', () => this.loginWithGoogle());
        document.getElementById('btn-apple-login').addEventListener('click', () => this.loginWithApple());

        // Enter key support
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        document.getElementById('reg-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.register();
        });

        // Complete profile modal
        const completeUsernameInput = document.getElementById('complete-username');
        completeUsernameInput?.addEventListener('input', () => {
            const val = completeUsernameInput.value.replace(/\s/g, '');
            completeUsernameInput.value = val;
            document.getElementById('complete-username-status').textContent = '';
        });

        // Register username validation
        const regUsernameInput = document.getElementById('reg-username');
        regUsernameInput?.addEventListener('input', () => {
            const val = regUsernameInput.value.replace(/\s/g, '');
            regUsernameInput.value = val;
            document.getElementById('reg-username-status').textContent = '';
        });

        // Listen for auth state changes
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const doc = await db.collection('users').doc(user.uid).get();
                    let profile = doc.data();

                    if (!profile) {
                        const defaultProfile = {
                            name: user.displayName || (user.email || '').split('@')[0] || 'Usuario',
                            username: '',
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
                        displayName: profile?.name || user.displayName || (user.email || '').split('@')[0] || 'Usuario'
                    };

                    // Force username completion for social logins
                    if (!profile.username) {
                        this.showCompleteProfile(user.displayName || (user.email || '').split('@')[0] || 'Usuario');
                        return;
                    }
                } catch (e) {
                    this.currentUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || (user.email || '').split('@')[0] || 'Usuario'
                    };
                }
                this.onLogin(this.currentUser);
            } else {
                this.currentUser = null;
                this.onLogout();
            }
        });
    },

    showCompleteProfile(defaultName) {
        const modal = document.getElementById('complete-profile-modal');
        modal.classList.remove('hidden');
        document.getElementById('complete-name').value = defaultName;
        document.getElementById('complete-username').value = '';
        document.getElementById('complete-username-status').textContent = '';

        const btn = document.getElementById('complete-profile-btn');
        btn.onclick = () => this.completeProfile();
    },

    async completeProfile() {
        const name = document.getElementById('complete-name').value.trim();
        const username = document.getElementById('complete-username').value.trim();

        if (!name) {
            Utils.showToast('Introduce tu nombre', 'error');
            return;
        }
        if (!username || username.length < 3) {
            Utils.showToast('El usuario debe tener al menos 3 caracteres', 'error');
            return;
        }

        try {
            const available = await DB.checkUsernameAvailable(username);
            if (!available) {
                Utils.showToast('Ese usuario ya está en uso', 'error');
                return;
            }

            await DB.updateProfile({
                name: name,
                username: username,
                usernameLower: username.toLowerCase(),
                nameLastChanged: new Date().toISOString(),
                usernameLastChanged: new Date().toISOString()
            });
            document.getElementById('complete-profile-modal').classList.add('hidden');
            this.currentUser.displayName = name;
            this.onLogin(this.currentUser);
            Utils.showToast('¡Perfil completado!', 'success');
        } catch (e) {
            console.error('Error completing profile:', e);
            Utils.showToast('Error al guardar: ' + e.message, 'error');
        }
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
        const username = document.getElementById('reg-username')?.value?.trim() || '';
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const errorEl = document.getElementById('register-error');

        if (!name || !username || !email || !password) {
            errorEl.textContent = 'Por favor, rellena todos los campos';
            errorEl.classList.remove('hidden');
            return;
        }

        if (username.length < 3) {
            errorEl.textContent = 'El usuario debe tener al menos 3 caracteres';
            errorEl.classList.remove('hidden');
            return;
        }

        if (password.length < 8) {
            errorEl.textContent = 'La contraseña debe tener al menos 8 caracteres';
            errorEl.classList.remove('hidden');
            return;
        }

        if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
            errorEl.textContent = 'La contraseña debe contener al menos una letra y un número';
            errorEl.classList.remove('hidden');
            return;
        }

        try {
            errorEl.classList.add('hidden');
            document.getElementById('btn-register').disabled = true;

            const available = await DB.checkUsernameAvailable(username);
            if (!available) {
                errorEl.textContent = 'Ese nombre de usuario ya está en uso';
                errorEl.classList.remove('hidden');
                document.getElementById('btn-register').disabled = false;
                return;
            }

            const cred = await auth.createUserWithEmailAndPassword(email, password);

            await db.collection('users').doc(cred.user.uid).set({
                name: name,
                username: username,
                usernameLower: username.toLowerCase(),
                email: email,
                provider: 'password',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                nameLastChanged: new Date().toISOString(),
                usernameLastChanged: new Date().toISOString(),
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
        document.getElementById('user-name').textContent = user.displayName || (user.email || '').split('@')[0] || 'Usuario';
        App.init();
    },

    onLogout() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }
};
