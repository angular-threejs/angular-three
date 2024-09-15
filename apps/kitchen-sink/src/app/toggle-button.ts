import { computed, Directive, model } from '@angular/core';

@Directive({
	selector: 'button[toggleButton]',
	standalone: true,
	host: {
		class: 'border rounded px-2 py-1',
		'(click)': 'onClick()',
		'[class]': 'hbClass()',
	},
})
export class ToggleButton {
	value = model.required<boolean>({ alias: 'toggleButton' });

	hbClass = computed(() => {
		return this.value() ? ['text-white', 'bg-red-600', 'border-red-400'] : ['text-black', 'border-black'];
	});

	onClick() {
		this.value.update((prev) => !prev);
	}
}
