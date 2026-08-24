// public/js/arrayConfigModal.js

const arrayConfigBackdropEl = document.getElementById('array-config-backdrop');
const arrayConfigInputEl = document.getElementById('array-config-input');
const arrayConfigConfirmBtn = document.getElementById('array-config-confirm-btn');
const arrayConfigErrorEl = document.getElementById('array-config-error');

let onConfirm = () => {};
let maxValues = 1000;

export function initArrayConfigModal({ onConfirmValues, maxValueCount } = {}) {
    onConfirm = onConfirmValues ?? (() => {});
    maxValues = maxValueCount ?? 1000;

    arrayConfigConfirmBtn.addEventListener('click', handleConfirm);
    arrayConfigBackdropEl.addEventListener('click', handleBackdropClick);
}

export function openArrayConfigModal(existingValues = null) {
    arrayConfigBackdropEl.classList.remove('hidden');
    arrayConfigInputEl.value = existingValues ? existingValues.join(', ') : '';
    arrayConfigErrorEl.textContent = '';
    arrayConfigInputEl.focus();
}

export function closeArrayConfigModal() {
    arrayConfigBackdropEl.classList.add('hidden');
}

// --- internals ---

function handleConfirm() {
    const parsed = parseCustomArrayInput(arrayConfigInputEl.value);
    if (!parsed.ok) {
        arrayConfigErrorEl.textContent = parsed.error;
        return;
    }
    onConfirm(parsed.values);
    closeArrayConfigModal();
}

function handleBackdropClick(e) {
    if (e.target === arrayConfigBackdropEl) closeArrayConfigModal();
}

function parseCustomArrayInput(raw) {
    const values = raw
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number);

    if (values.length === 0) return { ok: false, error: 'Enter at least one number.' };
    if (values.some((v) => !Number.isFinite(v))) return { ok: false, error: 'All values must be numbers.' };
    if (values.length > maxValues) return { ok: false, error: `Max ${maxValues} values.` };

    return { ok: true, values };
}
