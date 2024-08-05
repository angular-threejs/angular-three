import { TestBed } from '@angular/core/testing';
import { Mesh } from 'three';
import { extend, injectCatalogue } from './catalogue';

describe('renderer/catalogue', () => {
	test('should extend properly', () => {
		TestBed.runInInjectionContext(() => {
			const catalogue = injectCatalogue();
			expect(catalogue).toEqual({});

			extend({ Mesh });
			expect(catalogue).toEqual({ Mesh });
		});
	});
});
