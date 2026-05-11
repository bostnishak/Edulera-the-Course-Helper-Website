/* ============= profile.js — User Profile Page ============= */
(function () {
    document.addEventListener('DOMContentLoaded', function () {
        LHAuth.initNavbar();
        LHAuth.requireAuth();
        let user = LHAuth.getCurrentUser();

        // Avatar color from name
        function avatarColor(name) {
            const colors = [
                'linear-gradient(135deg,#6c2bff,#ec4899)',
                'linear-gradient(135deg,#10b981,#3b82f6)',
                'linear-gradient(135deg,#f59e0b,#ef4444)',
                'linear-gradient(135deg,#06b6d4,#6c2bff)',
                'linear-gradient(135deg,#ec4899,#f59e0b)',
            ];
            const idx = (name || 'U').charCodeAt(0) % colors.length;
            return colors[idx];
        }

        function renderSidebar() {
            user = LHAuth.getCurrentUser();
            const letter = (user.name || 'U')[0].toUpperCase();
            const bigAvatar = document.getElementById('profile-avatar-big');
            if (bigAvatar) { bigAvatar.style.background = avatarColor(user.name); }
            setText('profile-avatar-letter', letter);
            setText('profile-display-name', user.name || 'User');
            setText('profile-display-email', user.email || '');

            // Interest chips
            const chipsEl = document.getElementById('profile-interests-chips');
            if (chipsEl) {
                const interests = user.interests || [];
                chipsEl.innerHTML = interests.length
                    ? interests.map(i => `<span class="profile-interest-badge">${i}</span>`).join('')
                    : '<span style="font-size:.8rem;color:var(--text-muted)">No interests added</span>';
            }

            // Stats
            const enrollments = LHData.getEnrollments(user.id);
            const certs = LHData.getCerts(user.id);
            let completedLessons = 0;
            enrollments.forEach(cid => {
                const prog = LHData.getProgress(user.id, cid);
                completedLessons += prog.completedLessons.length;
            });
            setText('stat-courses', enrollments.length);
            setText('stat-certs', certs.length);
            setText('stat-completed', completedLessons);

            // Nav wishlist badge
            const wlCount = LHData.getWishlist(user.id).length;
            const navBadge = document.getElementById('nav-wishlist-count');
            if (navBadge) {
                navBadge.textContent = wlCount;
                navBadge.classList.toggle('show', wlCount > 0);
            }
        }

        function renderOverview() {
            const enrolledIds = LHData.getEnrollments(user.id);
            const certs = LHData.getCerts(user.id);

            // Courses preview (max 3)
            const overviewCourses = document.getElementById('overview-courses-list');
            if (overviewCourses) {
                if (!enrolledIds.length) {
                    overviewCourses.innerHTML = `<div style="text-align:center;padding:28px;color:var(--text-muted)">
                        <i class="fas fa-book-open" style="font-size:2rem;margin-bottom:10px;display:block;opacity:.4"></i>
                        You have no enrolled courses yet. <a href="catalog.html" style="color:var(--accent)">Explore courses</a></div>`;
                } else {
                    overviewCourses.innerHTML = enrolledIds.slice(0, 3).map(cid => {
                        const c = LHData.getCourse(cid); if (!c) return '';
                        const prog = LHData.getProgress(user.id, cid);
                        const pct = Math.round((prog.completedLessons.length / c.lessons.length) * 100);
                        return `<div class="enrolled-course-row" onclick="location.href='player.html?id=${cid}'">
                            <div class="enrolled-thumb" style="background:${c.gradient}">${c.emoji}</div>
                            <div class="enrolled-info">
                                <div class="enrolled-title">${c.title}</div>
                                <div class="enrolled-progress-row">
                                    <div style="flex:1;height:5px;background:var(--bg-secondary);border-radius:99px;overflow:hidden">
                                        <div style="height:100%;background:var(--accent);border-radius:99px;width:${pct}%"></div>
                                    </div>
                                    <span class="enrolled-pct">${pct}%</span>
                                </div>
                            </div>
                            <a href="player.html?id=${cid}" class="btn btn-primary btn-sm" onclick="event.stopPropagation()"><i class="fas fa-play"></i></a>
                        </div>`;
                    }).join('');
                }
            }

            // Certs preview (max 3)
            const overviewCerts = document.getElementById('overview-certs-list');
            if (overviewCerts) {
                if (!certs.length) {
                    overviewCerts.innerHTML = `<div style="text-align:center;padding:28px;color:var(--text-muted)">
                        <i class="fas fa-certificate" style="font-size:2rem;margin-bottom:10px;display:block;opacity:.4"></i>
                        You have no certificates yet. Complete a course!</div>`;
                } else {
                    overviewCerts.innerHTML = certs.slice(0, 3).map(cert => certRowHTML(cert)).join('');
                }
            }
        }

        function renderMyCourses() {
            const enrolledIds = LHData.getEnrollments(user.id);
            const listEl = document.getElementById('my-courses-list');
            if (!listEl) return;
            if (!enrolledIds.length) {
                listEl.innerHTML = `<div class="settings-section" style="text-align:center;padding:40px">
                    <i class="fas fa-book-open" style="font-size:2.5rem;margin-bottom:12px;display:block;opacity:.3;color:var(--text-muted)"></i>
                    <h3 style="margin-bottom:8px;color:var(--text-secondary)">No enrolled courses</h3>
                    <p style="color:var(--text-muted);margin-bottom:20px">Purchase your first course to start learning.</p>
                    <a href="catalog.html" class="btn btn-primary"><i class="fas fa-search"></i> Browse Courses</a></div>`;
                return;
            }
            listEl.innerHTML = enrolledIds.map(cid => {
                const c = LHData.getCourse(cid); if (!c) return '';
                const prog = LHData.getProgress(user.id, cid);
                const pct = Math.round((prog.completedLessons.length / c.lessons.length) * 100);
                const allDone = prog.completedLessons.length === c.lessons.length;
                return `<div class="settings-section" style="padding:20px">
                    <div class="enrolled-course-row" style="cursor:default;background:none;padding:0;margin-bottom:16px" >
                        <div class="enrolled-thumb" style="background:${c.gradient};width:72px;height:56px;font-size:1.6rem">${c.emoji}</div>
                        <div class="enrolled-info">
                            <div class="enrolled-title" style="font-size:1rem">${c.title}</div>
                            <div style="font-size:.82rem;color:var(--text-muted);margin-bottom:6px"><i class="fas fa-user-tie" style="margin-right:4px"></i>${c.instructor} &nbsp;•&nbsp; <span class="badge badge-${prog.quizPassed ? 'success' : 'accent'}">${prog.quizPassed ? 'Quiz Passed' : allDone ? 'Lessons Done' : 'In Progress'}</span></div>
                            <div style="display:flex;align-items:center;gap:8px">
                                <div style="flex:1;height:6px;background:var(--bg-secondary);border-radius:99px;overflow:hidden">
                                    <div style="height:100%;background:var(--accent);border-radius:99px;width:${pct}%"></div>
                                </div>
                                <span style="font-size:.78rem;color:var(--accent);font-weight:700">${pct}%</span>
                                <span style="font-size:.75rem;color:var(--text-muted)">${prog.completedLessons.length}/${c.lessons.length} lessons</span>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <a href="player.html?id=${cid}" class="btn btn-primary btn-sm"><i class="fas fa-play"></i> ${allDone ? 'Watch Again' : 'Continue'}</a>
                        ${allDone ? `<a href="quiz.html?id=${cid}" class="btn btn-outline btn-sm"><i class="fas fa-pencil-alt"></i> Take Quiz</a>` : ''}
                    </div>
                </div>`;
            }).join('');
        }

        function certRowHTML(cert) {
            const isAchiev = cert.type === 'achievement';
            return `<div class="cert-row" onclick="location.href='certificate.html?id=${cert.id}'">
                <div class="cert-row-icon ${isAchiev ? 'cert-achievement-icon' : 'cert-participation-icon'}">${isAchiev ? '🏆' : '📜'}</div>
                <div class="cert-row-info">
                    <div class="cert-row-type" style="color:${isAchiev ? '#f59e0b' : 'var(--accent)'}">${isAchiev ? 'Certificate of Achievement' : 'Certificate of Completion'}</div>
                    <div class="cert-row-course">${cert.courseName}</div>
                    <div class="cert-row-date">${new Date(cert.date).toLocaleDateString('en-US')}${cert.score ? ` • ${cert.score}%` : ''}</div>
                </div>
                <a href="certificate.html?id=${cert.id}" class="btn btn-outline btn-sm" onclick="event.stopPropagation()"><i class="fas fa-eye"></i> View</a>
            </div>`;
        }

        function renderMyCerts() {
            const certs = LHData.getCerts(user.id);
            const listEl = document.getElementById('my-certs-list');
            if (!listEl) return;
            if (!certs.length) {
                listEl.innerHTML = `<div class="settings-section" style="text-align:center;padding:40px">
                    <div style="font-size:3rem;margin-bottom:12px">🏆</div>
                    <h3 style="margin-bottom:8px;color:var(--text-secondary)">No certificates yet</h3>
                    <p style="color:var(--text-muted);margin-bottom:20px">Complete courses and pass quizzes to earn certificates!</p>
                    <a href="catalog.html" class="btn btn-primary"><i class="fas fa-rocket"></i> Get Started</a></div>`;
                return;
            }
            listEl.innerHTML = certs.map(cert => `<div class="settings-section" style="padding:16px">${certRowHTML(cert)}</div>`).join('');
        }

        /* FR-07: Order History */
        function renderOrders() {
            const orders = LHData.getOrders(user.id);
            const listEl = document.getElementById('my-orders-list');
            if (!listEl) return;
            if (!orders.length) {
                listEl.innerHTML = `<div class="settings-section" style="text-align:center;padding:40px">
                    <div style="font-size:3rem;margin-bottom:12px">🛒</div>
                    <h3 style="margin-bottom:8px;color:var(--text-secondary)">No orders yet</h3>
                    <p style="color:var(--text-muted);margin-bottom:20px">Your purchase history will appear here after you buy a course.</p>
                    <a href="catalog.html" class="btn btn-primary"><i class="fas fa-search"></i> Browse Courses</a></div>`;
                return;
            }
            listEl.innerHTML = orders.map(ord => `
                <div class="settings-section" style="padding:20px;margin-bottom:16px">
                    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
                        <div style="width:60px;height:48px;border-radius:var(--radius-md);background:${ord.courseGradient};display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0">${ord.courseEmoji}</div>
                        <div style="flex:1;min-width:0">
                            <div style="font-weight:700;font-size:.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ord.courseName}</div>
                            <div style="font-size:.8rem;color:var(--text-muted);margin-top:2px"><i class="fas fa-calendar-alt" style="margin-right:4px"></i>${new Date(ord.date).toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' })}</div>
                        </div>
                        <div style="text-align:right;flex-shrink:0">
                            <div style="font-weight:800;font-size:1.05rem;color:var(--accent)">$${ord.amount.toFixed(2)}</div>
                            <span style="font-size:.75rem;background:var(--success-soft);color:var(--success);padding:2px 10px;border-radius:99px;font-weight:600"><i class="fas fa-check-circle"></i> Completed</span>
                        </div>
                    </div>
                    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);display:flex;gap:8px">
                        <a href="player.html?id=${ord.courseId}" class="btn btn-primary btn-sm"><i class="fas fa-play"></i> Go to Course</a>
                        <span style="font-size:.78rem;color:var(--text-muted);align-self:center">Order ID: ${ord.id}</span>
                    </div>
                </div>
            `).join('');
        }

        /* FR-12: Notifications */
        function updateNotifBadge() {
            const count = LHData.getUnreadCount(user.id);
            const badge = document.getElementById('notif-badge');
            if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline' : 'none'; }
        }

        /* FR-13: Wishlist badge */
        function updateWishlistBadge() {
            const count = LHData.getWishlist(user.id).length;
            const badge = document.getElementById('wishlist-badge');
            if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline' : 'none'; }
        }

        /* FR-13: Wishlist */
        function renderWishlist() {
            const wishlistIds = LHData.getWishlist(user.id);
            const listEl = document.getElementById('my-wishlist-list');
            if (!listEl) return;
            if (!wishlistIds.length) {
                listEl.innerHTML = `<div class="settings-section" style="text-align:center;padding:48px">
                    <div style="font-size:3rem;margin-bottom:12px;opacity:.4">💔</div>
                    <h3 style="margin-bottom:8px;color:var(--text-secondary)">No courses in wishlist</h3>
                    <p style="color:var(--text-muted);margin-bottom:20px">Browse courses and add your favorites!</p>
                    <a href="catalog.html" class="btn btn-primary"><i class="fas fa-search"></i> Browse Courses</a>
                </div>`;
                return;
            }
            listEl.innerHTML = '<div class="wishlist-grid">' + wishlistIds.map(cid => {
                const c = LHData.getCourse(cid);
                if (!c) return '';
                const enrolled = LHData.isEnrolled(user.id, cid);
                return `<div class="card course-card" style="position:relative">
                    <div class="course-card-thumb" onclick="location.href='course-detail.html?id=${cid}'" style="cursor:pointer">
                        <div class="course-card-thumb-grad" style="background:${c.gradient}">${c.emoji}</div>
                        <span class="course-card-badge">${c.category}</span>
                    </div>
                    <div class="course-card-body">
                        <div class="course-card-title" style="cursor:pointer" onclick="location.href='course-detail.html?id=${cid}'">${c.title}</div>
                        <div class="course-card-instructor"><i class="fas fa-user-tie" style="opacity:.6;margin-right:4px"></i>${c.instructor}</div>
                        <div class="rating-row mt-2">
                            <span class="stars">${LHData.starHTML(c.rating)}</span>
                            <span class="rating-val">${c.rating}</span>
                        </div>
                        <div class="course-card-footer">
                            <div class="course-card-price"><span class="old-price">$${c.oldPrice}</span>$${c.price}</div>
                        </div>
                        <div style="display:flex;gap:8px;margin-top:12px">
                            ${enrolled
                                ? `<a href="player.html?id=${cid}" class="btn btn-success btn-sm flex-1"><i class="fas fa-play"></i> Go to Course</a>`
                                : `<a href="course-detail.html?id=${cid}" class="btn btn-primary btn-sm flex-1"><i class="fas fa-shopping-cart"></i> Buy Now</a>`
                            }
                            <button class="btn btn-ghost btn-sm" style="color:#ef4444;border:1px solid rgba(239,68,68,.3)" onclick="_removeFromWishlist('${cid}',this)"><i class="fas fa-heart-broken"></i></button>
                        </div>
                    </div>
                </div>`;
            }).join('') + '</div>';

            // Inline remove handler
            window._removeFromWishlist = function(courseId, btn) {
                LHData.removeFromWishlist(user.id, courseId);
                updateWishlistBadge();
                renderWishlist();
                LHData.toast('Removed from Wishlist', 'info');
            };
        }

        /* FR-15: Recommendations */
        function renderRecommendations() {
            const recsEl = document.getElementById('my-recs-grid');
            if (!recsEl) return;
            const recs = LHData.getRecommendations(user.id);
            if (!recs.length) {
                recsEl.innerHTML = `<div style="text-align:center;padding:48px;color:var(--text-muted);grid-column:1/-1">
                    <div style="font-size:3rem;margin-bottom:12px;opacity:.4">🔮</div>
                    <h3 style="margin-bottom:8px">No recommendations yet</h3>
                    <p>Enroll in a course or add interests to get personalized recommendations.</p>
                    <a href="catalog.html" class="btn btn-primary" style="margin-top:16px">Browse Courses</a>
                </div>`;
                return;
            }
            recsEl.innerHTML = recs.map(c => `
                <div class="card course-card" onclick="location.href='course-detail.html?id=${c.id}'" style="cursor:pointer;position:relative">
                    <div class="course-card-thumb">
                        <div class="course-card-thumb-grad" style="background:${c.gradient}">${c.emoji}</div>
                        <span class="course-card-badge">${c.category}</span>
                    </div>
                    <div class="course-card-body">
                        <div class="course-card-cat">${c.category}</div>
                        <div class="course-card-title">${c.title}</div>
                        <div class="course-card-instructor"><i class="fas fa-user-tie" style="opacity:.6;margin-right:4px"></i>${c.instructor}</div>
                        <div class="rating-row mt-2">
                            <span class="stars">${LHData.starHTML(c.rating)}</span>
                            <span class="rating-val">${c.rating}</span>
                        </div>
                        <div class="course-card-footer">
                            <div class="course-card-price"><span class="old-price">$${c.oldPrice}</span>$${c.price}</div>
                        </div>
                        ${c._reason ? `<div class="rec-reason-tag"><i class="fas fa-magic"></i> ${c._reason}</div>` : ''}
                    </div>
                </div>`).join('');
        }
        function renderNotifications() {
            const notifs = LHData.getNotifications(user.id);
            const listEl = document.getElementById('my-notifications-list');
            if (!listEl) return;
            if (!notifs.length) {
                listEl.innerHTML = `<div class="settings-section" style="text-align:center;padding:40px">
                    <div style="font-size:3rem;margin-bottom:12px">🔔</div>
                    <h3 style="margin-bottom:8px;color:var(--text-secondary)">No notifications</h3>
                    <p style="color:var(--text-muted)">System notifications will appear here.</p></div>`;
                return;
            }
            const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
            const colors = { success: 'var(--success)', error: 'var(--danger,#ef4444)', info: 'var(--accent)', warning: 'var(--warning,#f59e0b)' };
            listEl.innerHTML = notifs.map(n => `
                <div class="settings-section" style="padding:16px;margin-bottom:12px;${!n.read ? 'border-left:3px solid var(--accent)' : 'opacity:.8'}">
                    <div style="display:flex;align-items:flex-start;gap:14px">
                        <div style="width:40px;height:40px;border-radius:50%;background:${colors[n.type]}22;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                            <i class="fas ${icons[n.type] || icons.info}" style="color:${colors[n.type]}"></i>
                        </div>
                        <div style="flex:1">
                            <div style="font-weight:700;margin-bottom:2px">${n.title}</div>
                            <div style="font-size:.85rem;color:var(--text-secondary);margin-bottom:6px">${n.message}</div>
                            <div style="font-size:.75rem;color:var(--text-muted)">${new Date(n.date).toLocaleString('en-US')}</div>
                        </div>
                        ${n.link ? `<a href="${n.link}" class="btn btn-outline btn-sm" style="flex-shrink:0"><i class="fas fa-arrow-right"></i></a>` : ''}
                    </div>
                </div>
            `).join('');
        }

        function renderEditProfile() {
            const nameInput = document.getElementById('edit-name');
            const emailInput = document.getElementById('edit-email');
            const bioInput = document.getElementById('edit-bio');
            const jobInput = document.getElementById('edit-job');
            if (nameInput) nameInput.value = user.name || '';
            if (emailInput) emailInput.value = user.email || '';
            if (bioInput) bioInput.value = user.bio || '';
            if (jobInput) jobInput.value = user.job || '';

            // Interest checkboxes
            const intCont = document.getElementById('interest-checkboxes');
            if (intCont) {
                const cats = LHData.CATEGORIES;
                intCont.innerHTML = cats.map(cat => {
                    const checked = (user.interests || []).includes(cat);
                    return `<label style="display:flex;align-items:center;gap:8px;padding:10px 16px;border:2px solid ${checked ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius-lg);cursor:pointer;transition:all .2s;background:${checked ? 'var(--accent-soft)' : 'var(--bg-secondary)'}">
                        <input type="checkbox" value="${cat}" ${checked ? 'checked' : ''} style="display:none">
                        <span>${cat}</span></label>`;
                }).join('');
                intCont.querySelectorAll('label').forEach(label => {
                    label.addEventListener('click', () => {
                        const cb = label.querySelector('input');
                        cb.checked = !cb.checked;
                        label.style.borderColor = cb.checked ? 'var(--accent)' : 'var(--border)';
                        label.style.background = cb.checked ? 'var(--accent-soft)' : 'var(--bg-secondary)';
                    });
                });
            }
        }

        // Tab switching
        document.querySelectorAll('.sidebar-nav-link[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sidebar-nav-link').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                const tabEl = document.getElementById('tab-' + btn.dataset.tab);
                if (tabEl) tabEl.classList.add('active');
                // Render on demand
                if (btn.dataset.tab === 'courses') renderMyCourses();
                else if (btn.dataset.tab === 'certs') renderMyCerts();
                else if (btn.dataset.tab === 'edit') renderEditProfile();
                else if (btn.dataset.tab === 'orders') renderOrders();
                else if (btn.dataset.tab === 'wishlist') { renderWishlist(); }
                else if (btn.dataset.tab === 'recs') { renderRecommendations(); }
                else if (btn.dataset.tab === 'notifications') {
                    LHData.markNotificationsRead(user.id);
                    updateNotifBadge();
                    renderNotifications();
                }
            });
        });

        // Save profile form
        const editForm = document.getElementById('edit-profile-form');
        if (editForm) {
            editForm.addEventListener('submit', e => {
                e.preventDefault();
                const name = (document.getElementById('edit-name').value || '').trim();
                const bio = (document.getElementById('edit-bio').value || '').trim();
                const job = (document.getElementById('edit-job').value || '').trim();
                const errName = document.getElementById('err-edit-name');
                if (!name) { if (errName) errName.textContent = 'Name cannot be empty'; return; }
                if (errName) errName.textContent = '';
                LHAuth.updateUser({ name, bio, job });
                user = LHAuth.getCurrentUser();
                renderSidebar();
                LHData.toast('Profile updated! ✅', 'success');
            });
        }

        // Save interests
        const saveIntBtn = document.getElementById('btn-save-interests');
        if (saveIntBtn) {
            saveIntBtn.addEventListener('click', () => {
                const interests = [...document.querySelectorAll('#interest-checkboxes input:checked')].map(cb => cb.value);
                LHAuth.updateUser({ interests });
                user = LHAuth.getCurrentUser();
                renderSidebar();
                LHData.toast('Interests updated! ✅', 'success');
            });
        }

        // Change password
        const pwForm = document.getElementById('change-password-form');
        if (pwForm) {
            pwForm.addEventListener('submit', e => {
                e.preventDefault();
                const curr = (document.getElementById('current-password').value || '').trim();
                const newPw = (document.getElementById('new-password').value || '').trim();
                const confPw = (document.getElementById('confirm-new-password').value || '').trim();
                const errCurr = document.getElementById('err-current-password');
                const errNew = document.getElementById('err-new-password');
                const errConf = document.getElementById('err-confirm-new-password');
                [errCurr, errNew, errConf].forEach(e => { if (e) e.textContent = ''; });
                if (!curr || curr !== user.password) { if (errCurr) errCurr.textContent = 'Current password is incorrect'; return; }
                if (newPw.length < 6) { if (errNew) errNew.textContent = 'Password must be at least 6 characters'; return; }
                if (newPw !== confPw) { if (errConf) errConf.textContent = 'Passwords do not match'; return; }
                LHAuth.updateUser({ password: newPw });
                LHData.toast('Password changed! 🔑', 'success');
                pwForm.reset();
            });
        }

        // Theme buttons
        const themeBtns = {
            light: document.getElementById('theme-light-btn'),
            dark: document.getElementById('theme-dark-btn'),
            system: document.getElementById('theme-system-btn'),
        };
        function updateThemeBtns() {
            const curr = localStorage.getItem('lh_theme') || 'dark';
            Object.keys(themeBtns).forEach(k => {
                if (themeBtns[k]) {
                    themeBtns[k].style.background = curr === k ? 'var(--accent)' : '';
                    themeBtns[k].style.color = curr === k ? '#fff' : '';
                    themeBtns[k].style.borderColor = curr === k ? 'var(--accent)' : '';
                }
            });
        }
        if (themeBtns.light) themeBtns.light.addEventListener('click', () => { LHTheme.setTheme('light'); updateThemeBtns(); });
        if (themeBtns.dark) themeBtns.dark.addEventListener('click', () => { LHTheme.setTheme('dark'); updateThemeBtns(); });
        if (themeBtns.system) themeBtns.system.addEventListener('click', () => { LHTheme.setTheme('system'); updateThemeBtns(); });
        updateThemeBtns();

        // Logout buttons
        ['logout-btn-sidebar', 'logout-btn-main'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', () => { LHAuth.logout(); location.href = 'index.html'; });
        });

        function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

        // Initial render
        renderSidebar();
        renderOverview();
        updateNotifBadge();
        updateWishlistBadge();

        // Mark all notifications read button
        const markAllBtn = document.getElementById('mark-all-read-btn');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => {
                LHData.markNotificationsRead(user.id);
                updateNotifBadge();
                renderNotifications();
                LHData.toast('All notifications marked as read.', 'info');
            });
        }

        // Hash-based direct tab navigation (supports #wishlist, #recs, #notifications etc.)
        function navigateToHash() {
            const hash = location.hash.replace('#', '').trim();
            if (!hash) return;
            const tabBtn = document.querySelector(`.sidebar-nav-link[data-tab="${hash}"]`);
            if (tabBtn) {
                tabBtn.click();
                // Scroll sidebar link into view on mobile
                tabBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
        // Run on load (after render)
        setTimeout(navigateToHash, 50);
        // Run on browser back/forward or anchor change
        window.addEventListener('hashchange', navigateToHash);
    });
})();
