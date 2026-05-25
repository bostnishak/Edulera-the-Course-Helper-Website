/* checkout.js — FR-05 Add to Cart, FR-06 Mock Payment, FR-07 Order History, FR-12 Notifications, BR-02 Discount */
(function () {
    document.addEventListener('DOMContentLoaded', function () {
        LHAuth.initNavbar();
        LHAuth.requireAuth();
        const user = LHAuth.getCurrentUser();
        const params = new URLSearchParams(location.search);
        const courseId = params.get('id');
        const course = LHData.getCourse(courseId);
        if (!course) { location.href = 'catalog.html'; return; }

        // Breadcrumb
        setText('bc-course', course.title);

        // Order summary
        setText('order-title', course.title);
        setText('order-instructor', course.instructor);
        setText('order-meta', `${course.lessons.length} lessons • ${course.category}`);
        setText('order-old-price', '$' + course.oldPrice);

        const baseDiscount = course.oldPrice - course.price;
        setText('order-discount', '-$' + baseDiscount);

        const thumbEl = document.getElementById('order-thumb');
        if (thumbEl) { thumbEl.style.background = course.gradient; thumbEl.innerHTML = `<i class="fas ${course.icon || course.emoji} course-thumb-icon" style="font-size:2.5rem"></i>`; }

        // BR-02: Coupon / Discount calculation — 10% off with code "EDULERA10"
        let appliedCoupon = false;
        let finalPrice = course.price;

        function updateFinalPrice() {
            const priceEl = document.getElementById('order-price');
            if (priceEl) priceEl.textContent = '$' + finalPrice.toFixed(2);
        }
        updateFinalPrice();

        const couponInput = document.getElementById('coupon-input');
        const couponBtn = document.getElementById('coupon-apply-btn');
        const couponMsg = document.getElementById('coupon-msg');
        const couponDiscRow = document.getElementById('coupon-discount-row');
        const couponDiscEl = document.getElementById('order-coupon-discount');

        if (couponBtn) {
            couponBtn.addEventListener('click', () => {
                const code = (couponInput ? couponInput.value : '').trim().toUpperCase();
                if (code === 'EDULERA10') {
                    if (appliedCoupon) {
                        if (couponMsg) { couponMsg.textContent = 'Coupon already applied!'; couponMsg.style.color = 'var(--text-muted)'; }
                        return;
                    }
                    appliedCoupon = true;
                    const extraDiscount = Math.round(course.price * 0.10 * 100) / 100;
                    finalPrice = Math.round((course.price - extraDiscount) * 100) / 100;
                    updateFinalPrice();
                    if (couponDiscEl) couponDiscEl.textContent = '-$' + extraDiscount.toFixed(2);
                    if (couponDiscRow) couponDiscRow.style.display = 'flex';
                    if (couponMsg) { couponMsg.textContent = '✅ 10% discount applied! (EDULERA10)'; couponMsg.style.color = 'var(--success)'; }
                    LHData.toast('Coupon applied! 10% discount unlocked 🎉', 'success');
                } else if (code) {
                    if (couponMsg) { couponMsg.textContent = '❌ Invalid coupon code.'; couponMsg.style.color = 'var(--error,#ef4444)'; }
                } else {
                    if (couponMsg) { couponMsg.textContent = 'Please enter a coupon code.'; couponMsg.style.color = 'var(--text-muted)'; }
                }
            });
        }

        // Card input formatting
        const cardInput = document.getElementById('card-number');
        if (cardInput) {
            cardInput.addEventListener('input', e => {
                let v = e.target.value.replace(/\D/g, '').slice(0, 16);
                e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
            });
        }
        const expiryInput = document.getElementById('card-expiry');
        if (expiryInput) {
            expiryInput.addEventListener('input', e => {
                let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
                e.target.value = v;
            });
        }
        const cvvInput = document.getElementById('card-cvv');
        if (cvvInput) {
            cvvInput.addEventListener('input', e => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
            });
        }

        const form = document.getElementById('checkout-form');
        if (form) {
            form.addEventListener('submit', e => {
                e.preventDefault();
                const name = (document.getElementById('card-name').value || '').trim();
                const card = cardInput ? cardInput.value.replace(/\s/g, '') : '';
                const expiry = expiryInput ? expiryInput.value : '';
                const cvv = cvvInput ? cvvInput.value : '';
                let valid = true;

                const errName = document.getElementById('err-card-name');
                const errCard = document.getElementById('err-card-number');
                const errExpiry = document.getElementById('err-card-expiry');
                const errCvv = document.getElementById('err-card-cvv');
                [errName, errCard, errExpiry, errCvv].forEach(e => { if (e) e.textContent = ''; });

                if (!name) { if (errName) errName.textContent = 'Enter cardholder name'; valid = false; }
                if (card.length < 16) { if (errCard) errCard.textContent = 'Enter a valid card number'; valid = false; }
                if (expiry.length < 5) { if (errExpiry) errExpiry.textContent = 'Enter expiry date (MM/YY)'; valid = false; }
                if (cvv.length < 3) { if (errCvv) errCvv.textContent = 'Enter CVV code'; valid = false; }
                if (!valid) return;

                // Process payment
                const btn = document.getElementById('pay-btn');
                if (btn) btn.disabled = true;
                if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

                setTimeout(() => {
                    // FR-05: Enroll user in course
                    LHData.enroll(user.id, courseId);

                    // FR-07: Save to order history
                    LHData.addOrder(user.id, courseId, finalPrice);

                    // FR-12: Create post-purchase notification
                    LHData.addNotification(user.id, {
                        type: 'success',
                        title: 'Payment Successful! 🎉',
                        message: `You have been enrolled in "${course.title}". Start learning now!`,
                        link: `player.html?id=${courseId}`
                    });

                    // FR-06: Show "Payment Successful" modal
                    const modal = document.getElementById('success-modal');
                    if (modal) modal.classList.remove('hidden');
                    LHData.toast('Payment Successful! 🎉', 'success');

                    const goCourseBtn = document.getElementById('go-to-course-btn');
                    if (goCourseBtn) {
                        goCourseBtn.addEventListener('click', () => location.href = `player.html?id=${courseId}`);
                    }
                }, 1800);
            });
        }

        function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
    });
})();
