// Google Drive module - OAuth (drive.file scope), upload, picker, trash
// Configure these two values from Google Cloud Console (see README):
//   DRIVE_CLIENT_ID: OAuth 2.0 Client ID (web application)
//   DRIVE_API_KEY:   API key (only needed for the Drive file Picker)
const Drive = {
    CLIENT_ID: '772007794127-5rqhdusi5f9t7h3a1fbjgg5osj7m22l2.apps.googleusercontent.com',
    API_KEY: 'AIzaSyBQ4f-13AE5Iw2Bj8YVfeJD--2ANmzbe5I',
    SCOPE: 'https://www.googleapis.com/auth/drive.file',
    FOLDER_NAME: 'UniBoard',

    _tokenClient: null,
    _token: null,
    _expiresAt: 0,
    _folderId: null,
    _pickerLoaded: false,

    // ---------- Status / connection ----------

    isConfigured() {
        return !!this.CLIENT_ID;
    },

    isConnected() {
        return !!(this._token && Date.now() < this._expiresAt);
    },

    _loadStoredToken() {
        if (this.isConnected()) return true;
        try {
            const stored = JSON.parse(localStorage.getItem('uniguide_drive') || 'null');
            if (stored && stored.token && Date.now() < stored.expiresAt) {
                this._token = stored.token;
                this._expiresAt = stored.expiresAt;
                return true;
            }
        } catch (e) {}
        this._token = null;
        return false;
    },

    _saveToken(token, expiresInSeconds) {
        this._token = token;
        this._expiresAt = Date.now() + (expiresInSeconds - 60) * 1000;
        localStorage.setItem('uniguide_drive', JSON.stringify({ token, expiresAt: this._expiresAt }));
    },

    _loadGsi() {
        return new Promise((resolve, reject) => {
            if (window.google?.accounts?.oauth2) return resolve();
            const existing = document.getElementById('gsi-script');
            if (existing) {
                existing.addEventListener('load', () => resolve());
                existing.addEventListener('error', reject);
                return;
            }
            const s = document.createElement('script');
            s.id = 'gsi-script';
            s.src = 'https://accounts.google.com/gsi/client';
            s.async = true;
            s.defer = true;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
            document.head.appendChild(s);
        });
    },

    async connect() {
        if (!this.isConfigured()) {
            throw new Error('Falta configurar el Client ID de Google en js/drive.js');
        }
        await this._loadGsi();
        return new Promise((resolve, reject) => {
            try {
                this._tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: this.CLIENT_ID,
                    scope: this.SCOPE,
                    callback: (resp) => {
                        if (resp.error) {
                            reject(new Error(resp.error_description || resp.error));
                            return;
                        }
                        this._saveToken(resp.access_token, resp.expires_in || 3600);
                        resolve(true);
                    },
                    error_callback: (err) => {
                        reject(new Error(err.type === 'popup_closed' ? 'Cancelado' : (err.message || 'Error de conexión')));
                    }
                });
                this._tokenClient.requestAccessToken({ prompt: this._loadStoredToken() ? '' : 'consent' });
            } catch (e) {
                reject(e);
            }
        });
    },

    disconnect() {
        if (this._token && window.google?.accounts?.oauth2) {
            try { google.accounts.oauth2.revoke(this._token, () => {}); } catch (e) {}
        }
        this._token = null;
        this._expiresAt = 0;
        this._folderId = null;
        localStorage.removeItem('uniguide_drive');
    },

    // Ensures a valid token; reconnects silently if possible
    async ensureToken() {
        if (this._loadStoredToken()) return this._token;
        await this.connect();
        return this._token;
    },

    // ---------- Drive API helpers ----------

    async _api(url, options = {}) {
        const token = await this.ensureToken();
        const resp = await fetch(url, {
            ...options,
            headers: { 'Authorization': 'Bearer ' + token, ...(options.headers || {}) }
        });
        if (resp.status === 401) {
            this.disconnect();
            throw new Error('Sesión de Drive caducada. Vuelve a conectarla en Ajustes.');
        }
        if (!resp.ok) {
            const body = await resp.text().catch(() => '');
            throw new Error('Error de Drive (' + resp.status + '): ' + body.slice(0, 120));
        }
        return resp;
    },

    async ensureFolder() {
        if (this._folderId) return this._folderId;
        const q = encodeURIComponent(`name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false and 'root' in parents`);
        const resp = await this._api(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`);
        const data = await resp.json();
        if (data.files && data.files.length > 0) {
            this._folderId = data.files[0].id;
            return this._folderId;
        }
        const created = await this._api('https://www.googleapis.com/drive/v3/files?fields=id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: this.FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' })
        });
        const folder = await created.json();
        this._folderId = folder.id;
        return this._folderId;
    },

    // Upload a local File object into the UniBoard folder. Returns metadata.
    async uploadFile(file) {
        await this.ensureFolder();
        const metadata = { name: file.name, parents: [this._folderId] };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);
        const resp = await this._api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,iconLink', {
            method: 'POST',
            body: form
        });
        return await resp.json();
    },

    // Metadata for a Drive file id (used after picking an existing file)
    async getFileMeta(fileId) {
        const resp = await this._api(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink,mimeType`);
        return await resp.json();
    },

    // Move a Drive file to the trash (does not permanently delete)
    async trashFile(fileId) {
        await this._api(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trashed: true })
        });
    },

    // ---------- Picker (select existing Drive files) ----------

    _loadPicker() {
        return new Promise((resolve, reject) => {
            if (this._pickerLoaded && window.google?.picker) return resolve();
            const s = document.createElement('script');
            s.src = 'https://docs.google.com/picker.js';
            s.onload = () => { this._pickerLoaded = true; resolve(); };
            s.onerror = () => reject(new Error('No se pudo cargar el selector de Drive'));
            document.head.appendChild(s);
        });
    },

    canPick() {
        return this.isConfigured() && !!this.API_KEY;
    },

    // Opens the Google Picker. Resolves with the picked file metadata or null.
    async pickFile() {
        if (!this.canPick()) throw new Error('El selector necesita una API key de Google en js/drive.js');
        const token = await this.ensureToken();
        await this._loadPicker();
        return new Promise((resolve, reject) => {
            try {
                new google.picker.PickerBuilder()
                    .setOAuthToken(token)
                    .setDeveloperKey(this.API_KEY)
                    .addView(new google.picker.DocsView().setIncludeFolders(false).setSelectFolderEnabled(false))
                    .setTitle('Elegir archivo de Drive')
                    .setCallback((data) => {
                        if (data.action === google.picker.Action.CANCELED) { resolve(null); return; }
                        if (data.action === google.picker.Action.PICKED && data.docs && data.docs.length > 0) {
                            resolve(this.getFileMeta(data.docs[0].id));
                        }
                    })
                    .build()
                    .setVisible(true);
            } catch (e) {
                reject(e);
            }
        });
    }
};
