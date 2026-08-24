// public/js/arrayConfig.js

import { ARRAY_GENERATORS, getGeneratorById } from './arrayGenerators.js';
import { initArrayConfigModal, openArrayConfigModal } from './arrayConfigModal.js';

const arrayConfigSelectEl = document.getElementById('array-config-select');
const arrayConfigEditBtn = document.getElementById('array-config-edit-btn');
const sizeSlider = document.getElementById('size-slider');
const sizeNumber = document.getElementById('size-number');

let selectedGeneratorId = 'random';
let customArrayValues = null;

export function initArrayConfig() {
    populateArrayConfigSelect();
    arrayConfigSelectEl.addEventListener('change', handleArrayConfigChange);
    arrayConfigEditBtn.addEventListener('click', () => openArrayConfigModal(customArrayValues));
    initArrayConfigModal({
        onConfirmValues: handleCustomArrayConfirm,
        maxValueCount: Number(sizeSlider.max),
    });
}

export function generateArrayForCurrentConfig(size) {
    if (selectedGeneratorId === 'custom') {
        return customArrayValues ? [...customArrayValues] : getGeneratorById('random').generate(size);
    }
    return getGeneratorById(selectedGeneratorId).generate(size);
}

// --- internals ---

function populateArrayConfigSelect() {
    arrayConfigSelectEl.innerHTML = '';
    ARRAY_GENERATORS.forEach((gen) => {
        const option = document.createElement('option');
        option.value = gen.id;
        option.textContent = gen.name;
        arrayConfigSelectEl.appendChild(option);
    });
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Custom';
    arrayConfigSelectEl.appendChild(customOption);
    arrayConfigSelectEl.value = selectedGeneratorId;
}

function handleArrayConfigChange() {
    const id = arrayConfigSelectEl.value;
    if (id === 'custom') {
        arrayConfigSelectEl.value = selectedGeneratorId;
        openArrayConfigModal(customArrayValues);
        return;
    }
    selectedGeneratorId = id;
    setSizeSliderDisabled(false);
    arrayConfigEditBtn.classList.add('hidden');
}

function handleCustomArrayConfirm(values) {
    customArrayValues = values;
    selectedGeneratorId = 'custom';
    arrayConfigSelectEl.value = 'custom';
    arrayConfigEditBtn.classList.remove('hidden');
    sizeSlider.value = values.length;
    sizeNumber.value = values.length;
    setSizeSliderDisabled(true);
}

function setSizeSliderDisabled(disabled) {
    sizeSlider.disabled = disabled;
    sizeNumber.disabled = disabled;
}
