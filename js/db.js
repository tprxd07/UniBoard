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
        try {
            const snap = await this.collection('tasks').get();
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.error('Error getting tasks:', e);
            return [];
        }
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

    // ============ CALENDAR EVENTS ============
    async getEvents() {
        if (this.isDemo()) return this._getStore('events');
        const snap = await this.collection('events').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addEvent(event) {
        if (this.isDemo()) {
            const items = this._getStore('events');
            const id = Utils.generateId();
            items.push({ id, ...event, createdAt: new Date().toISOString() });
            this._setStore('events', items);
            return id;
        }
        const ref = await this.collection('events').add({
            ...event,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return ref.id;
    },

    async updateEvent(id, data) {
        if (this.isDemo()) {
            const items = this._getStore('events');
            const idx = items.findIndex(i => i.id === id);
            if (idx > -1) items[idx] = { ...items[idx], ...data };
            this._setStore('events', items);
            return;
        }
        await this.collection('events').doc(id).update(data);
    },

    async deleteEvent(id) {
        if (this.isDemo()) {
            const items = this._getStore('events').filter(i => i.id !== id);
            this._setStore('events', items);
            return;
        }
        await this.collection('events').doc(id).delete();
    },

    async deleteEventsByGroup(groupId) {
        const events = await this.getEvents();
        const toDelete = events.filter(e => e.groupId === groupId);
        for (const e of toDelete) {
            await this.deleteEvent(e.id);
        }
    },

    // ============ CALENDAR GROUPS ============
    async getGroups() {
        if (this.isDemo()) return this._getStore('groups');
        const snap = await this.collection('groups').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addGroup(group) {
        if (this.isDemo()) {
            const items = this._getStore('groups');
            const id = Utils.generateId();
            items.push({ id, ...group, createdAt: new Date().toISOString() });
            this._setStore('groups', items);
            return id;
        }
        const ref = await this.collection('groups').add({
            ...group,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return ref.id;
    },

    async updateGroup(id, data) {
        if (this.isDemo()) {
            const items = this._getStore('groups');
            const idx = items.findIndex(i => i.id === id);
            if (idx > -1) items[idx] = { ...items[idx], ...data };
            this._setStore('groups', items);
            return;
        }
        await this.collection('groups').doc(id).update(data);
    },

    async deleteGroup(id) {
        await this.deleteEventsByGroup(id);
        if (this.isDemo()) {
            const items = this._getStore('groups').filter(i => i.id !== id);
            this._setStore('groups', items);
            return;
        }
        await this.collection('groups').doc(id).delete();
    },

    async initDefaultGroups() {
        const existing = await this.getGroups();
        if (existing.length > 0) return;
        const defaults = [
            { name: 'Cumpleaños', color: '#E84393', emoji: '🎂', isDefault: true },
            { name: 'Festivos', color: '#00B894', emoji: '🎉', isDefault: true }
        ];
        for (const g of defaults) {
            await this.addGroup(g);
        }
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
    },

    // ============ USER SEARCH ============
    async searchUsers(query) {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase().trim();
        if (this.isDemo()) return [];
        const results = new Map();
        const addResult = (doc) => {
            if (doc.id !== Auth.currentUser.uid && !results.has(doc.id)) {
                const d = doc.data();
                results.set(doc.id, { uid: doc.id, name: d.name || '', email: d.email || '', photoURL: d.photoURL || '', username: d.username || '' });
            }
        };
        const usernameSnap = await db.collection('users')
            .where('usernameLower', '>=', q).where('usernameLower', '<=', q + '\uf8ff')
            .limit(10).get();
        usernameSnap.docs.forEach(addResult);
        const nameSnap = await db.collection('users')
            .where('name', '>=', q).where('name', '<=', q + '\uf8ff')
            .limit(10).get();
        nameSnap.docs.forEach(addResult);
        const emailSnap = await db.collection('users')
            .where('email', '>=', q).where('email', '<=', q + '\uf8ff')
            .limit(10).get();
        emailSnap.docs.forEach(addResult);
        return Array.from(results.values());
    },

    async searchByUsername(username) {
        if (!username) return null;
        const q = username.toLowerCase().trim();
        if (this.isDemo()) return null;
        const snap = await db.collection('users').where('usernameLower', '==', q).limit(1).get();
        if (snap.empty) return null;
        const doc = snap.docs[0];
        return { uid: doc.id, ...doc.data() };
    },

    async checkUsernameAvailable(username, currentUid) {
        if (!username) return false;
        const q = username.toLowerCase().trim();
        if (this.isDemo()) return true;
        const snap = await db.collection('users').where('usernameLower', '==', q).limit(1).get();
        if (snap.empty) return true;
        return snap.docs[0].id === currentUid;
    },

    // ============ FRIENDS ============
    async getFriends() {
        if (this.isDemo()) return this._getStore('friends');
        const snap = await this.collection('friends').orderBy('addedAt', 'desc').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addFriend(friendData) {
        if (this.isDemo()) {
            const items = this._getStore('friends');
            items.push({ id: friendData.uid, ...friendData, addedAt: new Date().toISOString() });
            this._setStore('friends', items);
            return;
        }
        await this.collection('friends').doc(friendData.uid).set({
            uid: friendData.uid,
            name: friendData.name || '',
            email: friendData.email || '',
            photoURL: friendData.photoURL || '',
            username: friendData.username || '',
            nickname: friendData.nickname || '',
            note: friendData.note || '',
            phone: friendData.phone || '',
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    async updateFriend(friendUid, data) {
        if (this.isDemo()) {
            const items = this._getStore('friends');
            const idx = items.findIndex(f => f.id === friendUid);
            if (idx !== -1) items[idx] = { ...items[idx], ...data };
            this._setStore('friends', items);
            return;
        }
        await this.collection('friends').doc(friendUid).update(data);
    },

    async removeFriend(friendUid) {
        if (this.isDemo()) {
            this._setStore('friends', this._getStore('friends').filter(f => f.id !== friendUid));
            return;
        }
        await this.collection('friends').doc(friendUid).delete();
    },

    async areFriends(uid) {
        if (this.isDemo()) return this._getStore('friends').some(f => f.id === uid);
        const doc = await this.collection('friends').doc(uid).get();
        return doc.exists;
    },

    // ============ FRIEND REQUESTS ============
    async getFriendRequests() {
        if (this.isDemo()) return this._getStore('friendRequests');
        const snap = await db.collection('friendRequests')
            .where('toUid', '==', Auth.currentUser.uid)
            .where('status', '==', 'pending').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getSentRequests() {
        if (this.isDemo()) return this._getStore('sentFriendRequests');
        const snap = await db.collection('friendRequests')
            .where('fromUid', '==', Auth.currentUser.uid)
            .where('status', '==', 'pending').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async sendFriendRequest(toUser) {
        const profile = await this.getProfile();
        const data = {
            fromUid: Auth.currentUser.uid,
            fromName: profile.name || Auth.currentUser.displayName || '',
            fromEmail: Auth.currentUser.email || '',
            fromPhotoURL: profile.photoURL || '',
            fromUsername: profile.username || '',
            toUid: toUser.uid,
            toName: toUser.name || '',
            toEmail: toUser.email || '',
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        if (this.isDemo()) {
            const items = this._getStore('sentFriendRequests');
            items.push({ id: 'req_' + Date.now(), ...data });
            this._setStore('sentFriendRequests', items);
            return;
        }
        await db.collection('friendRequests').add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    async acceptFriendRequest(requestId, fromUser) {
        await this.addFriend({
            uid: fromUser.fromUid,
            name: fromUser.fromName,
            email: fromUser.fromEmail,
            photoURL: fromUser.fromPhotoURL || '',
            username: fromUser.fromUsername || ''
        });
        if (this.isDemo()) {
            this._setStore('friendRequests', this._getStore('friendRequests').filter(r => r.id !== requestId));
            return;
        }
        await db.collection('friendRequests').doc(requestId).delete();
    },

    async rejectFriendRequest(requestId) {
        if (this.isDemo()) {
            this._setStore('friendRequests', this._getStore('friendRequests').filter(r => r.id !== requestId));
            return;
        }
        await db.collection('friendRequests').doc(requestId).delete();
    },

    async cancelFriendRequest(requestId) {
        if (this.isDemo()) {
            this._setStore('sentFriendRequests', this._getStore('sentFriendRequests').filter(r => r.id !== requestId));
            return;
        }
        await db.collection('friendRequests').doc(requestId).delete();
    },

    // ============ STUDY STREAK ============
    calculateStreakFromSessions(sessions) {
        if (!sessions || sessions.length === 0) return 0;
        const dayMinutes = {};
        sessions.forEach(s => {
            const date = s.date || '';
            if (!date) return;
            if (!dayMinutes[date]) dayMinutes[date] = 0;
            dayMinutes[date] += s.duration || 0;
        });
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            if (dayMinutes[dateStr] && dayMinutes[dateStr] >= 10) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    },

    async updateStreak() {
        const sessions = await this.getStudySessions();
        const streak = this.calculateStreakFromSessions(sessions);
        await this.updateProfile({ studyStreak: streak });
        return streak;
    }
};
