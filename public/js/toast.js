// public/js/toast.js

const toastContainerEl = document.getElementById('toast-container');

export function showToast(message, { variant = 'default', duration = 2000 } = {}) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${variant}`;
    toast.textContent = message;
    toastContainerEl.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));

    setTimeout(() => {
        toast.classList.remove('visible');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
}
