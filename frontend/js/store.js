/* store.js — app state & localStorage (no sensitive data stored) */
const STORAGE_KEY = 'DigiTwoApp';

const appData = _loadAppData();

const ROLE_KEY = 'DigiTwoRole';

const state = {
    view: 'home',
    currentUser: appData.currentUser || null,
    role: localStorage.getItem(ROLE_KEY) || null,   // 'student' | 'admin' | null
    grade: null,
    topic: null,
    gameType: null,
    session: null,
    feedback: null,
    loginError: null,
    profileGrade: null,
    loginLockedUntil: null,
    loginFailedAttempts: 0,
    adminView: 'dashboard',                           // 'dashboard' | 'users' | 'userDetail' | 'content'
    admin: null,                                      // dashboard analytics
    adminUsers: null,                                 // { loading, error, list }
    adminDetail: null,                                // { loading, error, userId, username, sessions }
    adminContent: null                                // { loading, error, grades, topics, gameTypes, form }
};

function setRole(role) {
    state.role = role || null;
    if (role) localStorage.setItem(ROLE_KEY, role);
    else      localStorage.removeItem(ROLE_KEY);
}

function _loadAppData() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { users: {}, currentUser: null };
    } catch {
        return { users: {}, currentUser: null };
    }
}

function saveAppData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function getCurrentUserData() {
    return state.currentUser ? (appData.users[state.currentUser] || null) : null;
}

// Store only non-sensitive profile data — NO passwords
function upsertUser(username, parentEmail, reports) {
    appData.users[username] = {
        username,
        parentEmail: parentEmail || appData.users[username]?.parentEmail || '',
        reports: reports ?? appData.users[username]?.reports ?? []
    };
    appData.currentUser = username;
    saveAppData();
}

function setCurrentUser(username) {
    state.currentUser = username;
    appData.currentUser = username;
    saveAppData();
}
