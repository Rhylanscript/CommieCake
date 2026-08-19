// public/js/descriptionPopup.js

const algorithmDescEl = document.getElementById('algorithm-description');
const infoBtn = document.getElementById('info-btn');
const descriptionPopupEl = document.getElementById('description-popup');

// supplied via initDescriptionPopup so this module can ask main.js what
// the currently selected algorithm is without owning it itself
let getSelectedAlgorithm = () => null;

export function initDescriptionPopup({ getSelectedAlgorithm: getAlgoFn }) {
	getSelectedAlgorithm = getAlgoFn;
	infoBtn.addEventListener('click', handleInfoBtnClick);
	document.addEventListener('click', handleDocumentClick);
}

export function updateDescription() {
	const text = getSelectedAlgorithm().description;
	algorithmDescEl.textContent = text;
	descriptionPopupEl.textContent = text;
}

export function setPopupOpen(open) {
	descriptionPopupEl.classList.toggle('open', open);
	infoBtn.setAttribute('aria-expanded', String(open));
}

function handleInfoBtnClick(e) {
	e.stopPropagation();
	setPopupOpen(!descriptionPopupEl.classList.contains('open'));
}

function handleDocumentClick(e) {
	if (e.target !== infoBtn && !descriptionPopupEl.contains(e.target)) {
		setPopupOpen(false);
	}
}
