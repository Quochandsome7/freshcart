/**
 * FreshCart - Main JavaScript
 */
document.addEventListener('DOMContentLoaded', function () {
    // Toast auto-close
    const toast = document.querySelector('.toast');
    if (toast) {
        setTimeout(() => { toast.remove(); }, 5000);
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) closeBtn.addEventListener('click', () => toast.remove());
    }

    // Add to cart AJAX
    document.querySelectorAll('.add-to-cart-form').forEach(form => {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Check if user is logged in before adding to cart
            if (!window.__isAuthenticated) {
                showToast('error', 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
                return;
            }

            const formData = new FormData(form);
            try {
                const response = await fetch('/cart/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId: formData.get('productId'),
                        quantity: parseInt(formData.get('quantity')) || 1
                    })
                });
                const result = await response.json();

                // Handle server-side login requirement (fallback)
                if (result.requireLogin) {
                    showToast('error', result.error);
                    setTimeout(() => {
                        window.location.href = result.loginUrl || '/login';
                    }, 1000);
                    return;
                }

                if (result.success) {
                    const cartCount = document.querySelector('.cart-count');
                    if (cartCount) cartCount.textContent = result.cart.totalItems;
                    showToast('success', result.message);
                } else {
                    showToast('error', result.error);
                }
            } catch (error) {
                showToast('error', 'Có lỗi xảy ra');
            }
        });
    });
});

function showToast(type, message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${message}</span><button class="toast-close">&times;</button>`;
    document.body.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), 5000);
}
