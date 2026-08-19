// public/js/commandPalette.js

import { algorithms, CATEGORY_ORDER } from './registry.js';

// --- DOM ---
const algoPickerToggleEl = document.getElementById('algo-picker-toggle');
const algoPickerCurrentEl = document.getElementById('algo-picker-current');
const algoPickerToggleBEl = document.getElementById('algo-picker-toggle-b');
const algoPickerCurrentBEl = document.getElementById('algo-picker-current-b');

const commandPaletteBackdropEl = document.getElementById('command-palette-backdrop');
const commandPaletteSearchEl = document.getElementById('command-palette-search');
const commandPaletteListEl = document.getElementById('command-palette-list');
const categoryFilterSelectEl = document.getElementById('category-filter-select');
const sortSelectEl = document.getElementById('sort-select');

// --- selection state ---
let selectedAlgorithmId = algorithms[0].id;
let selectedAlgorithmIdB = algorithms[1]?.id ?? algorithms[0].id;

// --- palette open / nav state ---
let isCommandPaletteOpen = false;
let activeOptionIndex = 0;
let pickerTargetSlot = 'A';

// --- filter / sort state ---
let activeCategoryFilter = 'All';
let sortMode = 'category'; // 'category' | 'name-asc' | 'name-dsc'

// called as onAlgorithmChange(slot) whenever a pick actually changes that slot's selection
let onAlgorithmChange = () => {};

// --- public API ---

export function initCommandPalette({ onSelect } = {}) {
	onAlgorithmChange = onSelect ?? (() => {});

	populateCategoryFilterSelect();
	syncPickerLabel('A');

	algoPickerToggleEl.addEventListener('click', () => openCommandPalette('A'));
	algoPickerToggleBEl.addEventListener('click', () => openCommandPalette('B'));
	commandPaletteSearchEl.addEventListener('input', handleCommandPaletteSearchInput);
	commandPaletteBackdropEl.addEventListener('click', handleBackdropClick);
	categoryFilterSelectEl.addEventListener('change', handleCategoryFilterChange);
	sortSelectEl.addEventListener('change', handleSortSelectChange);
}

export function getAlgorithmForSlot(slot) {
	const id = slot === 'A' ? selectedAlgorithmId : selectedAlgorithmIdB;
	return algorithms.find((a) => a.id === id);
}

export function syncPickerLabel(slot) {
	const el = slot === 'A' ? algoPickerCurrentEl : algoPickerCurrentBEl;
	el.textContent = getAlgorithmForSlot(slot).name;
}

export function isPaletteOpen() {
	return isCommandPaletteOpen;
}

export function openCommandPalette(slot = 'A') {
	pickerTargetSlot = slot;
	isCommandPaletteOpen = true;
	commandPaletteBackdropEl.classList.remove('hidden');
	(slot === 'A' ? algoPickerToggleEl : algoPickerToggleBEl).setAttribute('aria-expanded', 'true');
	commandPaletteSearchEl.value = '';
	renderCommandPaletteList('');
	commandPaletteSearchEl.focus();
}

export function closeCommandPalette() {
	isCommandPaletteOpen = false;
	commandPaletteBackdropEl.classList.add('hidden');
	algoPickerToggleEl.setAttribute('aria-expanded', 'false');
	algoPickerToggleBEl.setAttribute('aria-expanded', 'false');
}

export function moveActiveIndex(delta) {
	const visible = getVisibleOptions();
	if (visible.length === 0) return;
	const nextIndex = (activeOptionIndex + delta + visible.length) % visible.length;
	setActiveIndex(nextIndex, visible);
}

export function selectActiveOption() {
	const visible = getVisibleOptions();
	const el = visible[activeOptionIndex];
	if (el) handleAlgorithmPick(el.dataset.id);
}

// --- internals ---

function populateCategoryFilterSelect() {
	const presentCategories = new Set(algorithms.map((a) => a.category));
	const orderedPresent = [
		...CATEGORY_ORDER.filter((c) => presentCategories.has(c)),
		...[...presentCategories].filter((c) => !CATEGORY_ORDER.includes(c)),
	];

	categoryFilterSelectEl.innerHTML = '';
	['All', ...orderedPresent].forEach((category) => {
		const option = document.createElement('option');
		option.value = category;
		option.textContent = category;
		categoryFilterSelectEl.appendChild(option);
	});
	categoryFilterSelectEl.value = activeCategoryFilter;
}

function handleCategoryFilterChange() {
	activeCategoryFilter = categoryFilterSelectEl.value;
	renderCommandPaletteList(commandPaletteSearchEl.value);
}

function handleSortSelectChange() {
	sortMode = sortSelectEl.value;
	renderCommandPaletteList(commandPaletteSearchEl.value);
}

function createOptionElement(algo) {
	const option = document.createElement('button');
	option.type = 'button';
	option.className = 'algo-picker-option';
	option.dataset.id = algo.id;
	option.setAttribute('role', 'option');
	option.innerHTML = `<span>${algo.name}</span><span class="algo-picker-option-complexity">${algo.complexity}</span>`;
	option.addEventListener('click', () => handleAlgorithmPick(algo.id));
	option.addEventListener('mouseenter', () => {
		const visible = getVisibleOptions();
		const hoveredIndex = visible.indexOf(option);
		if (hoveredIndex !== -1) setActiveIndex(hoveredIndex, visible);
	});
	return option;
}

function renderCommandPaletteList(query) {
	const normalizedQuery = query.trim().toLowerCase();

	const filtered = algorithms.filter((algo) => {
		const matchesQuery = algo.name.toLowerCase().includes(normalizedQuery);
		const matchesCategory = activeCategoryFilter === 'All' || algo.category === activeCategoryFilter;
		return matchesQuery && matchesCategory;
	});

	commandPaletteListEl.innerHTML = '';

	if (filtered.length === 0) {
		const empty = document.createElement('p');
		empty.className = 'command-palette-empty';
		empty.textContent = 'No algorithms match.';
		commandPaletteListEl.appendChild(empty);
		setActiveIndex(0, []);
		return;
	}

	if (sortMode === 'name-asc' || sortMode === 'name-dsc') {
		const direction = sortMode === 'name-asc' ? 1 : -1;
		[...filtered]
			.sort((a, b) => direction * a.name.localeCompare(b.name))
			.forEach((algo) => commandPaletteListEl.appendChild(createOptionElement(algo)));
	} else {
		const grouped = new Map();
		filtered.forEach((algo) => {
			if (!grouped.has(algo.category)) grouped.set(algo.category, []);
			grouped.get(algo.category).push(algo);
		});

		// sort category keys by their pos in CATEGORY_ORDER
		// categories not listed there fallback to infinity so they sort after
		// every listed category but relative to each other unlisted categories
		// keep the order they were encountered in
		const orderedCategories = [...grouped.keys()].sort((a, b) => {
			const rankA = CATEGORY_ORDER.indexOf(a) === -1 ? Infinity : CATEGORY_ORDER.indexOf(a);
			const rankB = CATEGORY_ORDER.indexOf(b) === -1 ? Infinity : CATEGORY_ORDER.indexOf(b);
			return rankA - rankB;
		});

		orderedCategories.forEach((category) => {
			const groupLabel = document.createElement('p');
			groupLabel.className = 'algo-picker-group-label';
			groupLabel.textContent = category;
			commandPaletteListEl.appendChild(groupLabel);

			grouped.get(category).forEach((algo) => commandPaletteListEl.appendChild(createOptionElement(algo)));
		});
	}

	setActiveIndex(0, getVisibleOptions());
}

function getVisibleOptions() {
	return Array.from(commandPaletteListEl.querySelectorAll('.algo-picker-option'));
}

function setActiveIndex(index, visible) {
	activeOptionIndex = index;
	visible.forEach((el, i) => el.classList.toggle('active', i === activeOptionIndex));
	visible[activeOptionIndex]?.scrollIntoView({ block: 'nearest' });
}

function handleCommandPaletteSearchInput() {
	renderCommandPaletteList(commandPaletteSearchEl.value);
}

function handleBackdropClick(e) {
	if (e.target === commandPaletteBackdropEl) closeCommandPalette();
}

function handleAlgorithmPick(id) {
	if (pickerTargetSlot === 'B') {
		if (id !== selectedAlgorithmIdB) {
			selectedAlgorithmIdB = id;
			syncPickerLabel('B');
			onAlgorithmChange('B');
		}
	} else {
		if (id !== selectedAlgorithmId) {
			selectedAlgorithmId = id;
			syncPickerLabel('A');
			onAlgorithmChange('A');
		}
	}
	closeCommandPalette();
}
