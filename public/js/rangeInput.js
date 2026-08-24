// public/js/rangeInput.js

export function bindRangeToNumber(rangeEl, numberEl, onChange) {
	const min = Number(rangeEl.min);
	const max = Number(rangeEl.max);

	rangeEl.addEventListener('input', () => {
		numberEl.value = rangeEl.value;
		onChange();
	});

	numberEl.addEventListener('change', () => {
		let value = Number(numberEl.value);
		if (Number.isNaN(value)) value = min;
		value = Math.min(max, Math.max(min, value));
		numberEl.value = value;
		rangeEl.value = value;
		onChange();
	});
}
