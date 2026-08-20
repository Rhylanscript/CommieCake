// public/js/statsPopup.js

const VIEWPORT_MARGIN = 12;

const popups = ['A', 'B'].map((slot) => ({
	slot,
	btn: document.getElementById(slot === 'A' ? 'stats-details-btn' : 'stats-details-btn-b'),
	popup: document.getElementById(slot === 'A' ? 'stats-details-popup' : 'stats-details-popup-b'),
}));

export function initStatsPopup() {
	popups.forEach(({ btn, popup }) => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			setStatsPopupOpen(btn, popup, !popup.classList.contains('open'));
		});
	});
	document.addEventListener('click', handleDocumentClick);
	window.addEventListener('resize', closeAllStatsPopups);
	window.addEventListener('scroll', closeAllStatsPopups, true); // capture: also catches `main`'s internal scroll
}

export function closeAllStatsPopups() {
	popups.forEach(({ btn, popup }) => setStatsPopupOpen(btn, popup, false));
}

function setStatsPopupOpen(btn, popup, open) {
	popup.classList.toggle('open', open);
	btn.setAttribute('aria-expanded', String(open));
	if (open) positionPopup(btn, popup);
}

function positionPopup(btn, popup) {
	const btnRect = btn.getBoundingClientRect();
	const popupRect = popup.getBoundingClientRect();

	let top = btnRect.bottom + 6;
	let left = btnRect.left;

	if (top + popupRect.height > window.innerHeight - VIEWPORT_MARGIN) {
		top = btnRect.top - popupRect.height - 6;
	}

	top = Math.max(VIEWPORT_MARGIN, Math.min(top, window.innerHeight - popupRect.height - VIEWPORT_MARGIN));

	const maxLeft = window.innerWidth - popupRect.width - VIEWPORT_MARGIN;
	left = Math.max(VIEWPORT_MARGIN, Math.min(left, maxLeft));

	popup.style.top = `${top}px`;
	popup.style.left = `${left}px`;
}

function handleDocumentClick(e) {
	popups.forEach(({ btn, popup }) => {
		if (e.target !== btn && !popup.contains(e.target)) {
			setStatsPopupOpen(btn, popup, false);
		}
	});
}
