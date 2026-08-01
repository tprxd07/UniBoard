// Database Module - Firestore operations (with localStorage fallback for demo mode)
const DB = {
    // Check if using Firebase or localStorage
    isDemo() {
        return !db || !Auth.currentUser;
    },

    // localStorage helpers
    _getStore(collection) {
        const key = `uniguide_${collection}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    },

    _setStore(collection, data) {
        localStorage.setItem(`uniguide_${collection}`, JSON.stringify(data));
    },

    // Get user document reference
    userDoc() {
        return db.collection('users').doc(Auth.currentUser.uid);
    },

    // Get a collection reference
    collection(name) {
        return this.userDoc().collection(name);
    },

    // ============ SUBJECTS ============
    async getSubjects() {
        if (this.isDemo()) return this._getStore('subjects');
        const snap = await this.collection('subjects').orderBy('name').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addSubject(subject) {
        if (this.isDemo()) {
            const items = this._getStore('subjects');
            const id = Utils.generateId();
            items.push({ id, ...subject, createdAt: new Date().toISOString() });
            this._setStore('subjects', items);
            return id;
        }
        const ref = await this.collection('subjects').add({
            ...subject,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return ref.id;
    },

    async updateSubject(id, data) {
        if (this.isDemo()) {
            const items = this._getStore('subjects');
            const idx = items.findIndex(i => i.id === id);
            if (idx > -1) items[idx] = { ...items[idx], ...data };
            this._setStore('subjects', items);
            return;
        }
        await this.collection('subjects').doc(id).update(data);
    },

    async deleteSubject(id) {
        if (this.isDemo()) {
            const items = this._getStore('subjects').filter(i => i.id !== id);
            this._setStore('subjects', items);
            return;
        }
        await this.collection('subjects').doc(id).delete();
    },

    // ============ TASKS ============
    async getTasks() {
        if (this.isDemo()) return this._getStore('tasks');
        const snap = await this.collection('tasks').orderBy('dueDate').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addTask(task) {
        if (this.isDemo()) {
            const items = this._getStore('tasks');
            const id = Utils.generateId();
            items.push({ id, ...task, completed: false, createdAt: new Date().toISOString() });
            this._setStore('tasks', items);
            return id;
        }
        const ref = await this.collection('tasks').add({
            ...task,
            completed: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return ref.id;
    },

    async updateTask(id, data) {
        if (this.isDemo()) {
            const items = this._getStore('tasks');
            const idx = items.findIndex(i => i.id === id);
            if (idx > -1) items[idx] = { ...items[idx], ...data };
            this._setStore('tasks', items);
            return;
        }
        await this.collection('tasks').doc(id).update(data);
    },

    async deleteTask(id) {
        if (this.isDemo()) {
            const items = this._getStore('tasks').filter(i => i.id !== id);
            this._setStore('tasks', items);
            return;
        }
        await this.collection('tasks').doc(id).delete();
    },

    // ============ EXAMS ============
    async getExams() {
        if (this.isDemo()) return this._getStore('exams');
        const snap = await this.collection('exams').orderBy('date').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addExam(exam) {
        if (this.isDemo()) {
            const items = this._getStore('exams');
            const id = Utils.generateId();
            items.push({ id, ...exam, createdAt: new Date().toISOString() });
            this._setStore('exams', items);
            return id;
        }
        const ref = await this.collection('exams').add({
            ...exam,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return ref.id;
    },

    async updateExam(id, data) {
        if (this.isDemo()) {
            const items = this._getStore('exams');
            const idx = items.findIndex(i => i.id === id);
            if (idx > -1) items[idx] = { ...items[idx], ...data };
            this._setStore('exams', items);
            return;
        }
        await this.collection('exams').doc(id).update(data);
    },

    async deleteExam(id) {
        if (this.isDemo()) {
            const items = this._getStore('exams').filter(i => i.id !== id);
            this._setStore('exams', items);
            return;
        }
        await this.collection('exams').doc(id).delete();
    },

    // ============ CLASSES / SCHEDULE ============
    async getSchedule() {
        if (this.isDemo()) return this._getStore('schedule');
        const snap = await this.collection('schedule').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addClass(cls) {
        if (this.isDemo()) {
            const items = this._getStore('schedule');
            const id = Utils.generateId();
            items.push({ id, ...cls });
            this._setStore('schedule', items);
            return id;
        }
        const ref = await this.collection('schedule').add(cls);
        return ref.id;
    },

    async updateClass(id, data) {
        if (this.isDemo()) {
            const items = this._getStore('schedule');
            const idx = items.findIndex(i => i.id === id);
            if (idx > -1) items[idx] = { ...items[idx], ...data };
            this._setStore('schedule', items);
            return;
        }
        await this.collection('schedule').doc(id).update(data);
    },

    async deleteClass(id) {
        if (this.isDemo()) {
            const items = this._getStore('schedule').filter(i => i.id !== id);
            this._setStore('schedule', items);
            return;
        }
        await this.collection('schedule').doc(id).delete();
    },

    // ============ STUDY SESSIONS ============
    async getStudySessions() {
        if (this.isDemo()) return this._getStore('studySessions');
        const snap = await this.collection('studySessions').orderBy('date', 'desc').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addStudySession(session) {
        if (this.isDemo()) {
            const items = this._getStore('studySessions');
            const id = Utils.generateId();
            items.push({ id, ...session, createdAt: new Date().toISOString() });
            this._setStore('studySessions', items);
            return id;
        }
        const ref = await this.collection('studySessions').add({
            ...session,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return ref.id;
    },

    // ============ DOCUMENTS ============
    async getDocuments() {
        if (this.isDemo()) return this._getStore('documents');
        const snap = await this.collection('documents').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addDocument(doc) {
        if (this.isDemo()) {
            const items = this._getStore('documents');
            const id = Utils.generateId();
            items.push({ id, ...doc, createdAt: new Date().toISOString() });
            this._setStore('documents', items);
            return id;
        }
        const ref = await this.collection('documents').add({
            ...doc,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return ref.id;
    },

    async deleteDocument(id) {
        if (this.isDemo()) {
            const items = this._getStore('documents').filter(i => i.id !== id);
            this._setStore('documents', items);
            return;
        }
        await this.collection('documents').doc(id).delete();
    },

    // ============ TRANSACTIONS ============
    async getTransactions() {
        if (this.isDemo()) return this._getStore('transactions');
        const snap = await this.collection('transactions').orderBy('date', 'desc').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addTransaction(transaction) {
        if (this.isDemo()) {
            const items = this._getStore('transactions');
            const id = Utils.generateId();
            items.push({ id, ...transaction, createdAt: new Date().toISOString() });
            this._setStore('transactions', items);
            return id;
        }
        const ref = await this.collection('transactions').add({
            ...transaction,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return ref.id;
    },

    async deleteTransaction(id) {
        if (this.isDemo()) {
            const items = this._getStore('transactions').filter(i => i.id !== id);
            this._setStore('transactions', items);
            return;
        }
        await this.collection('transactions').doc(id).delete();
    },

    // ============ CONTACTS ============
    async getContacts() {
        if (this.isDemo()) return this._getStore('contacts');
        const snap = await this.collection('contacts').orderBy('name').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addContact(contact) {
        if (this.isDemo()) {
            const items = this._getStore('contacts');
            const id = Utils.generateId();
            items.push({ id, ...contact });
            this._setStore('contacts', items);
            return id;
        }
        const ref = await this.collection('contacts').add(contact);
        return ref.id;
    },

    async updateContact(id, data) {
        if (this.isDemo()) {
            const items = this._getStore('contacts');
            const idx = items.findIndex(i => i.id === id);
            if (idx > -1) items[idx] = { ...items[idx], ...data };
            this._setStore('contacts', items);
            return;
        }
        await this.collection('contacts').doc(id).update(data);
    },

    async deleteContact(id) {
        if (this.isDemo()) {
            const items = this._getStore('contacts').filter(i => i.id !== id);
            this._setStore('contacts', items);
            return;
        }
        await this.collection('contacts').doc(id).delete();
    },

    // ============ GOALS ============
    async getGoals() {
        if (this.isDemo()) return this._getStore('goals');
        const snap = await this.collection('goals').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addGoal(goal) {
        if (this.isDemo()) {
            const items = this._getStore('goals');
            const id = Utils.generateId();
            items.push({ id, ...goal, progress: 0, createdAt: new Date().toISOString() });
            this._setStore('goals', items);
            return id;
        }
        const ref = await this.collection('goals').add({
            ...goal,
            progress: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return ref.id;
    },

    async updateGoal(id, data) {
        if (this.isDemo()) {
            const items = this._getStore('goals');
            const idx = items.findIndex(i => i.id === id);
            if (idx > -1) items[idx] = { ...items[idx], ...data };
            this._setStore('goals', items);
            return;
        }
        await this.collection('goals').doc(id).update(data);
    },

    async deleteGoal(id) {
        if (this.isDemo()) {
            const items = this._getStore('goals').filter(i => i.id !== id);
            this._setStore('goals', items);
            return;
        }
        await this.collection('goals').doc(id).delete();
    },

    // ============ REMINDERS ============
    async getReminders() {
        if (this.isDemo()) return this._getStore('reminders');
        const snap = await this.collection('reminders').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addReminder(reminder) {
        if (this.isDemo()) {
            const items = this._getStore('reminders');
            const id = Utils.generateId();
            items.push({ id, ...reminder });
            this._setStore('reminders', items);
            return id;
        }
        const ref = await this.collection('reminders').add(reminder);
        return ref.id;
    },

    async updateReminder(id, data) {
        if (this.isDemo()) {
            const items = this._getStore('reminders');
            const idx = items.findIndex(i => i.id === id);
            if (idx > -1) items[idx] = { ...items[idx], ...data };
            this._setStore('reminders', items);
            return;
        }
        await this.collection('reminders').doc(id).update(data);
    },

    async deleteReminder(id) {
        if (this.isDemo()) {
            const items = this._getStore('reminders').filter(i => i.id !== id);
            this._setStore('reminders', items);
            return;
        }
        await this.collection('reminders').doc(id).delete();
    },

    // ============ SETTINGS ============
    async getSettings() {
        if (this.isDemo()) return JSON.parse(localStorage.getItem('uniguide_settings') || '{}');
        const doc = await this.userDoc().get();
        return doc.data()?.settings || {};
    },

    async updateSettings(settings) {
        if (this.isDemo()) {
            localStorage.setItem('uniguide_settings', JSON.stringify(settings));
            return;
        }
        await this.userDoc().update({ settings });
    },

    // ============ USER PROFILE ============
    async getProfile() {
        if (this.isDemo()) return JSON.parse(localStorage.getItem('uniguide_profile') || '{}');
        const doc = await this.userDoc().get();
        return doc.data() || {};
    },

    async updateProfile(data) {
        if (this.isDemo()) {
            const profile = JSON.parse(localStorage.getItem('uniguide_profile') || '{}');
            localStorage.setItem('uniguide_profile', JSON.stringify({ ...profile, ...data }));
            return;
        }
        await this.userDoc().update(data);
    }
};
