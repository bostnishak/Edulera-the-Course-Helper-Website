/* ============= auth.js — Authentication & Session (Multi-Role) ============= */
(function () {
    const USERS_KEY = 'lh_users';
    const SESSION_KEY = 'lh_session';

    /* ---- Version-based full reset ---- */
    /* Change SEED_VERSION to force-wipe all localStorage and re-seed fresh accounts */
    const SEED_VERSION = 'v5';
    if (localStorage.getItem('lh_seed_version') !== SEED_VERSION) {
        // Clear all Edulera data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('lh_')) keysToRemove.push(key);
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        localStorage.setItem('lh_seed_version', SEED_VERSION);
    }

    function getUsers() { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
    function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

    function getCurrentUser() {
        const id = localStorage.getItem(SESSION_KEY);
        if (!id) return null;
        return getUsers().find(u => u.id === id) || null;
    }
    function setSession(id) { localStorage.setItem(SESSION_KEY, id); }
    function clearSession() { localStorage.removeItem(SESSION_KEY); }

    /* ---- Seed default accounts on first load ---- */
    function seedAccounts() {
        const users = getUsers();

        /* 3 Demo Hesap — her rol için birer tane hazır */
        const seedList = [
            /* 👤 Normal Kullanıcı */
            {
                id: 'demo_user_001',
                name: 'Demo Kullanıcı',
                email: 'demo@edulera.com',
                password: 'Demo123!',
                role: 'user',
                interests: ['Web Development', 'Design'],
                bio: 'Edulera demo kullanıcısı — online öğrenmeye hevesli bir yazılım geliştiricisi.',
                job: 'Junior Developer',
                createdAt: '2026-01-01T10:00:00Z'
            },
            /* 🏢 Kurumsal Hesap */
            {
                id: 'corp_001',
                name: 'TechCorp Training',
                email: 'corp@techcorp.com',
                password: 'Corp123!',
                role: 'corporate',
                companyName: 'TechCorp Inc.',
                createdAt: '2026-01-01T10:00:00Z'
            },
            /* 🛡️ Admin Hesabı */
            {
                id: 'admin_001',
                name: 'Edulera Admin',
                email: 'admin@edulera.com',
                password: 'Admin123!',
                role: 'admin',
                createdAt: '2026-01-01T10:00:00Z'
            },
            /* Extra mock kullanıcılar — FR-09 için admin panelinde görünsün */
            { id: 'mock_u1', name: 'Ahmet Yilmaz', email: 'ahmet@example.com', password: 'Pass123!', role: 'user', interests: ['Web Development'], bio: 'Frontend developer', createdAt: '2025-11-15T09:00:00Z' },
            { id: 'mock_u2', name: 'Zeynep Kara',  email: 'zeynep@example.com', password: 'Pass123!', role: 'user', interests: ['Data Science'], bio: 'Data analyst', createdAt: '2025-12-02T14:00:00Z' },
            { id: 'mock_u3', name: 'Emre Celik',   email: 'emre@example.com',   password: 'Pass123!', role: 'user', interests: ['Marketing'], bio: 'Digital marketer', createdAt: '2026-01-10T11:00:00Z' },
        ];

        let changed = false;
        seedList.forEach(s => {
            if (!users.find(u => u.id === s.id)) { users.push(s); changed = true; }
        });
        if (changed) saveUsers(users);

        /* ── Demo kullanıcısı için mock veri seed (FR-05/07/12/13) ── */
        seedDemoUserData();
    }

    /* Demo kullanıcısına gerçekçi mock veriler seed eder.
       Yalnızca ilk kez çalışır (lh_demo_seeded kontrolü). */
    function seedDemoUserData() {
        if (localStorage.getItem('lh_demo_seeded') === 'v2') return;

        const uid = 'demo_user_001';

        /* FR-05: 3 kursa kayıt */
        const enrollments = JSON.parse(localStorage.getItem('lh_enrollments') || '{}');
        enrollments[uid] = ['c1', 'c5', 'c7'];
        localStorage.setItem('lh_enrollments', JSON.stringify(enrollments));

        /* İlerleme — c1: %62, c5: %43, c7: %100 tamamlandı */
        const progress = JSON.parse(localStorage.getItem('lh_progress') || '{}');
        if (!progress[uid]) progress[uid] = {};
        progress[uid]['c1'] = { completedLessons: ['l1','l2','l3','l4','l5'], quizPassed: false, quizScore: null, certEarned: false };
        progress[uid]['c5'] = { completedLessons: ['l1','l2','l3'], quizPassed: false, quizScore: null, certEarned: false };
        progress[uid]['c7'] = { completedLessons: ['l1','l2','l3','l4','l5','l6','l7','l8'], quizPassed: true, quizScore: 85, certEarned: true };
        localStorage.setItem('lh_progress', JSON.stringify(progress));

        /* Sertifika — c7 tamamlandı (achievement) */
        const certs = JSON.parse(localStorage.getItem('lh_certs') || '[]');
        const certExists = certs.find(c => c.userId === uid && c.courseId === 'c7');
        if (!certExists) {
            certs.push({
                id: 'cert_demo_001',
                userId: uid,
                courseId: 'c7',
                courseName: 'Digital Marketing & SEO Mastery',
                type: 'achievement',
                score: 85,
                date: '2026-03-15T14:30:00Z'
            });
            localStorage.setItem('lh_certs', JSON.stringify(certs));
        }

        /* FR-07: Sipariş geçmişi — 3 sipariş */
        const orders = JSON.parse(localStorage.getItem('lh_orders') || '{}');
        orders[uid] = [
            {
                id: 'ord_demo_001',
                courseId: 'c1',
                courseName: 'Modern Web Development: HTML, CSS & JavaScript',
                courseIcon: 'fa-code',
                courseGradient: 'linear-gradient(135deg,#4263eb,#3b82f6)',
                amount: 269.10,
                date: '2026-01-20T11:00:00Z',
                status: 'completed'
            },
            {
                id: 'ord_demo_002',
                courseId: 'c5',
                courseName: 'UI/UX Design: Professional Interfaces with Figma',
                courseIcon: 'fa-pencil-ruler',
                courseGradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                amount: 314.10,
                date: '2026-02-10T09:30:00Z',
                status: 'completed'
            },
            {
                id: 'ord_demo_003',
                courseId: 'c7',
                courseName: 'Digital Marketing & SEO Mastery',
                courseIcon: 'fa-bullhorn',
                courseGradient: 'linear-gradient(135deg,#10b981,#f59e0b)',
                amount: 299,
                date: '2026-03-01T16:00:00Z',
                status: 'completed'
            }
        ];
        localStorage.setItem('lh_orders', JSON.stringify(orders));

        /* FR-12: Bildirimler — 2 okunmamış */
        const notifs = JSON.parse(localStorage.getItem('lh_notifications') || '{}');
        notifs[uid] = [
            {
                id: 'notif_demo_001',
                type: 'success',
                title: '🎉 Certificate Earned!',
                message: 'You passed the Digital Marketing & SEO Mastery quiz with 85%! Your certificate is ready.',
                link: 'certificate.html?id=cert_demo_001',
                read: false,
                date: '2026-03-15T14:35:00Z'
            },
            {
                id: 'notif_demo_002',
                type: 'info',
                title: '📚 New Course Recommendation',
                message: 'Based on your interests, we recommend "Graphic Design: Adobe Photoshop & Illustrator".',
                link: 'course-detail.html?id=c6',
                read: false,
                date: '2026-03-20T10:00:00Z'
            },
            {
                id: 'notif_demo_003',
                type: 'warning',
                title: '⏰ Continue Your Course',
                message: 'You are 62% through Modern Web Development. Don\'t lose your momentum — keep going!',
                link: 'player.html?id=c1',
                read: true,
                date: '2026-03-18T08:00:00Z'
            }
        ];
        localStorage.setItem('lh_notifications', JSON.stringify(notifs));

        /* FR-13: Wishlist — 2 kurs */
        const wishlist = JSON.parse(localStorage.getItem('lh_wishlist') || '{}');
        wishlist[uid] = ['c2', 'c9'];
        localStorage.setItem('lh_wishlist', JSON.stringify(wishlist));

        localStorage.setItem('lh_demo_seeded', 'v2');
    }

    function register(data) {
        const users = getUsers();
        if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
            return { ok: false, msg: 'This email address is already registered.' };
        }
        const user = {
            id: 'u_' + Date.now() + Math.random().toString(36).slice(2, 8),
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            password: data.password,
            role: 'user',
            interests: data.interests || [],
            bio: '',
            createdAt: new Date().toISOString()
        };
        users.push(user);
        saveUsers(users);
        setSession(user.id);
        return { ok: true, user };
    }

    function login(email, password, expectedRole) {
        const users = getUsers();
        const user = users.find(u => u.email === email.trim().toLowerCase() && u.password === password);
        if (!user) return { ok: false, msg: 'Incorrect email or password.' };
        if (expectedRole && user.role !== expectedRole) {
            const roleNames = { user: 'User', corporate: 'Corporate', admin: 'Admin' };
            return { ok: false, msg: `This account has the "${roleNames[user.role]}" role. Please select the correct tab.` };
        }
        setSession(user.id);
        return { ok: true, user };
    }

    function logout() {
        clearSession();
        window.location.href = 'index.html';
    }

    function updateUser(fields) {
        const users = getUsers();
        const idx = users.findIndex(u => u.id === localStorage.getItem(SESSION_KEY));
        if (idx === -1) return false;
        Object.assign(users[idx], fields);
        saveUsers(users);
        return true;
    }

    function requireAuth() {
        if (!getCurrentUser()) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }
    }

    function requireRole(role) {
        const user = getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        if (user.role !== role) {
            // Redirect to appropriate panel
            const redirectMap = { admin: 'admin.html', corporate: 'corporate.html', user: 'index.html' };
            window.location.href = redirectMap[user.role] || 'index.html';
        }
    }

    function avatarColor(name) {
        const colors = [
            'linear-gradient(135deg,#4263eb,#5c7cfa)',
            'linear-gradient(135deg,#3b82f6,#06b6d4)',
            'linear-gradient(135deg,#10b981,#34d399)',
            'linear-gradient(135deg,#f59e0b,#ef4444)',
            'linear-gradient(135deg,#8b5cf6,#6366f1)',
        ];
        let n = 0; for (const c of (name || 'A')) n += c.charCodeAt(0);
        return colors[n % colors.length];
    }

    function initNavbar() {
        const user = getCurrentUser();
        const guestNav = document.getElementById('nav-guest');
        const userNav = document.getElementById('nav-user');
        const avatarEl = document.getElementById('nav-avatar-text');
        const avatarWrap = document.getElementById('nav-avatar-wrap');
        const dropdownEl = document.getElementById('nav-dropdown');
        const logoutBtn = document.getElementById('nav-logout');

        if (user) {
            if (guestNav) guestNav.classList.add('hidden');
            if (userNav) userNav.classList.remove('hidden');
            if (avatarEl) avatarEl.textContent = (user.name || 'U')[0].toUpperCase();
            if (avatarWrap) avatarWrap.style.background = avatarColor(user.name);
            // Show standalone wishlist button (now outside nav-user)
            const wlBtn = document.getElementById('nav-wishlist-btn');
            if (wlBtn) wlBtn.style.display = '';
            // Update wishlist count badge
            try {
                const wlData = JSON.parse(localStorage.getItem('lh_wishlist') || '{}');
                const wlCount = (wlData[user.id] || []).length;
                const wlCountEl = document.getElementById('nav-wishlist-count');
                if (wlCountEl) {
                    wlCountEl.textContent = wlCount;
                    wlCountEl.style.display = wlCount > 0 ? '' : 'none';
                }
            } catch (e) {}
        } else {
            if (guestNav) guestNav.classList.remove('hidden');
            if (userNav) userNav.classList.add('hidden');
        }

        if (avatarWrap && dropdownEl) {
            avatarWrap.addEventListener('click', e => {
                e.stopPropagation();
                dropdownEl.classList.toggle('open');
            });
            document.addEventListener('click', () => dropdownEl.classList.remove('open'));
        }

        if (logoutBtn) logoutBtn.addEventListener('click', logout);

        // hamburger
        const ham = document.getElementById('hamburger');
        const navLinks = document.getElementById('navbar-links');
        if (ham && navLinks) {
            ham.addEventListener('click', () => navLinks.classList.toggle('open'));
        }
    }

    // Initialize seed accounts
    seedAccounts();

    window.LHAuth = { register, login, logout, getCurrentUser, updateUser, requireAuth, requireRole, avatarColor, initNavbar, getUsers };
})();
