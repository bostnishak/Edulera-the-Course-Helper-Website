/* catalog.js — FR-03 Listeleme, FR-04 Arama, FR-13 Wishlist, FR-14 Kategori, NFR-02 Hız */
(function () {
    document.addEventListener('DOMContentLoaded', function () {
        LHAuth.initNavbar();
        const user = LHAuth.getCurrentUser();
        const courses = LHData.getAllCourses();

        let selectedCategory = 'all';
        let maxPrice = 500;
        let sortBy = 'popular';
        let searchQuery = '';
        let searchTimer = null;

        // ── Dynamic category counts ──────────────────────────────────────
        function updateCategoryCounts() {
            const total = courses.length;
            const countAll = document.querySelector('.filter-btn[data-cat="all"] .count');
            if (countAll) countAll.textContent = total;
            LHData.CATEGORIES.forEach(cat => {
                const btn = document.querySelector(`.filter-btn[data-cat="${cat}"] .count`);
                if (btn) btn.textContent = courses.filter(c => c.category === cat).length;
            });
        }

        // ── Course card HTML ─────────────────────────────────────────────
        function courseCardHTML(c) {
            const enrolled = user && LHData.isEnrolled(user.id, c.id);
            const wishlisted = user && LHData.isWishlisted(user.id, c.id);
            return `<div class="card course-card" style="cursor:pointer;position:relative" id="card-${c.id}">
        <div class="course-card-thumb" onclick="location.href='course-detail.html?id=${c.id}'">
          <div class="course-card-thumb-grad" style="background:${c.gradient}"><i class="fas ${c.icon || c.emoji} course-thumb-icon"></i></div>
          <span class="course-card-badge">${c.category}</span>
          ${enrolled ? '<span class="course-card-badge" style="left:auto;right:12px;background:var(--success)">Enrolled</span>' : ''}
        </div>
        <div class="course-card-body" onclick="location.href='course-detail.html?id=${c.id}'">
          <div class="course-card-cat">${c.category}</div>
          <div class="course-card-title">${c.title}</div>
          <div class="course-card-instructor"><i class="fas fa-user-tie" style="margin-right:4px;opacity:.6"></i>${c.instructor}</div>
          <div class="rating-row mt-2">
            <span class="stars">${LHData.starHTML(c.rating)}</span>
            <span class="rating-val">${c.rating}</span>
            <span class="rating-count">(${c.ratingCount.toLocaleString('en')})</span>
          </div>
          <div class="course-card-footer">
            <div class="course-card-price">
              <span class="old-price">$${c.oldPrice}</span>
              $${c.price}
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <div class="badge badge-accent"><i class="fas fa-book"></i> ${c.lessons.length} lessons</div>
              <button class="wishlist-btn-card ${wishlisted ? 'active' : ''}" data-course-id="${c.id}" title="${wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}" onclick="event.stopPropagation();window._toggleWishlist('${c.id}',this)">
                <i class="${wishlisted ? 'fas' : 'far'} fa-heart"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;
        }

        // ── Global wishlist toggle handler ───────────────────────────────
        window._toggleWishlist = function (courseId, btn) {
            if (!user) {
                location.href = 'login.html?redirect=' + encodeURIComponent(location.href);
                return;
            }
            const added = LHData.toggleWishlist(user.id, courseId);
            btn.className = 'wishlist-btn-card ' + (added ? 'active' : '');
            btn.title = added ? 'Remove from Wishlist' : 'Add to Wishlist';
            btn.innerHTML = `<i class="${added ? 'fas' : 'far'} fa-heart"></i>`;
            LHData.toast(added ? '❤️ Added to Wishlist!' : 'Removed from Wishlist', added ? 'success' : 'info');
            updateNavWishlistCount();
        };

        function updateNavWishlistCount() {
            if (!user) return;
            const cnt = LHData.getWishlist(user.id).length;
            const countEl = document.getElementById('nav-wishlist-count');
            if (countEl) {
                countEl.textContent = cnt;
                countEl.classList.toggle('show', cnt > 0);
            }
        }

        // ── Search speed badge ────────────────────────────────────────────
        const speedBadge = document.getElementById('search-speed-badge');
        function showSpeedBadge(count, ms) {
            if (!speedBadge) return;
            // Show a human-friendly simulated time: real perf + overhead floor of 30ms for demo realism
            const displayMs = Math.max(ms + 30, 35);
            speedBadge.textContent = `⚡ ${count} result${count !== 1 ? 's' : ''} found in < ${displayMs}ms`;
            speedBadge.classList.add('visible');
        }
        function hideSpeedBadge() {
            if (speedBadge) speedBadge.classList.remove('visible');
        }

        // ── Render ────────────────────────────────────────────────────────
        function render() {
            const t0 = performance.now();
            let list = [...courses];
            if (selectedCategory !== 'all') list = list.filter(c => c.category === selectedCategory);
            if (searchQuery) list = list.filter(c =>
                c.title.toLowerCase().includes(searchQuery) ||
                c.instructor.toLowerCase().includes(searchQuery) ||
                c.category.toLowerCase().includes(searchQuery)
            );
            list = list.filter(c => c.price <= maxPrice);
            if (sortBy === 'price-low') list.sort((a, b) => a.price - b.price);
            else if (sortBy === 'price-high') list.sort((a, b) => b.price - a.price);
            else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
            else list.sort((a, b) => b.students - a.students);
            const ms = Math.round(performance.now() - t0);

            const grid = LHData.qs('courses-grid');
            const count = LHData.qs('courses-count');
            if (count) count.textContent = list.length + ' courses found';
            if (grid) {
                if (list.length === 0) {
                    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔍</div><h3>No courses found</h3><p>Try a different search or filter.</p></div>`;
                    hideSpeedBadge();
                } else {
                    grid.innerHTML = list.map(courseCardHTML).join('');
                    if (searchQuery) showSpeedBadge(list.length, ms < 1 ? 1 : ms);
                    else hideSpeedBadge();
                }
            }
            document.querySelectorAll('.filter-btn[data-cat]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.cat === selectedCategory);
            });
        }

        // ── Search ────────────────────────────────────────────────────────
        const searchInput = LHData.qs('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', e => {
                clearTimeout(searchTimer);
                searchQuery = e.target.value.toLowerCase().trim();
                searchTimer = setTimeout(render, 50); // near-instant, tiny debounce
            });
        }

        // ── Category URL param support ────────────────────────────────────
        const params = new URLSearchParams(location.search);
        const catParam = params.get('cat');
        if (catParam && LHData.CATEGORIES.includes(catParam)) {
            selectedCategory = catParam;
        }

        // ── Category filters ───────────────────────────────────────────────
        document.querySelectorAll('.filter-btn[data-cat]').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedCategory = btn.dataset.cat;
                render();
            });
        });

        // ── Price slider ───────────────────────────────────────────────────
        const priceSlider = LHData.qs('price-slider');
        const priceVal = LHData.qs('price-val');
        if (priceSlider) {
            priceSlider.addEventListener('input', () => {
                maxPrice = parseInt(priceSlider.value);
                if (priceVal) priceVal.textContent = '$' + maxPrice;
                render();
            });
        }

        // ── Sort ───────────────────────────────────────────────────────────
        const sortSelect = LHData.qs('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                sortBy = sortSelect.value;
                render();
            });
        }

        // ── Recommendations chip ───────────────────────────────────────────
        const recSection = LHData.qs('rec-section');
        if (recSection && user && user.interests && user.interests.length) {
            recSection.classList.remove('hidden');
        }

        // ── Mobile sidebar toggle ──────────────────────────────────────────
        const sidebarToggle = document.getElementById('sidebar-toggle-btn');
        const sidebarBody = document.getElementById('catalog-sidebar-body');
        if (sidebarToggle && sidebarBody) {
            sidebarToggle.addEventListener('click', () => {
                const collapsed = sidebarBody.classList.toggle('collapsed');
                sidebarToggle.querySelector('.toggle-icon').textContent = collapsed ? '▼' : '▲';
            });
        }

        updateCategoryCounts();
        updateNavWishlistCount();
        render();
    });
})();
