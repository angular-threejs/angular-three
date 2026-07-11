import { TestBed } from '@angular/core/testing';
import { Mesh } from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import type { NgtConstructorRepresentation } from '../types';
import { extend, injectCatalogue, remove } from './catalogue';

class Original {}
class First {}
class Second {}

const testKeys = ['Mesh', 'OwnedConstructor', 'ExistingConstructor', 'RemovedConstructor'];

describe('renderer/catalogue', () => {
	afterEach(() => remove(...testKeys));

	it('registers constructors and restores an empty baseline on cleanup', () => {
		TestBed.runInInjectionContext(() => {
			const catalogue = injectCatalogue();
			remove('Mesh');

			const cleanup = extend({ Mesh });
			expect(catalogue.Mesh).toBe(Mesh);

			cleanup();
			expect(catalogue).not.toHaveProperty('Mesh');
		});
	});

	it('keeps the newest active owner when overlapping cleanups run out of order', () => {
		TestBed.runInInjectionContext(() => {
			const catalogue = injectCatalogue();
			const cleanupFirst = extend({ OwnedConstructor: First });
			const cleanupSecond = extend({ OwnedConstructor: Second });

			cleanupFirst();
			expect(catalogue.OwnedConstructor).toBe(Second);

			cleanupSecond();
			expect(catalogue).not.toHaveProperty('OwnedConstructor');
		});
	});

	it('restores the previous active owner when the newest owner cleans up first', () => {
		TestBed.runInInjectionContext(() => {
			const catalogue = injectCatalogue();
			const cleanupFirst = extend({ OwnedConstructor: First });
			const cleanupSecond = extend({ OwnedConstructor: Second });

			cleanupSecond();
			expect(catalogue.OwnedConstructor).toBe(First);

			cleanupFirst();
			expect(catalogue).not.toHaveProperty('OwnedConstructor');
		});
	});

	it('coalesces identical owners while retaining independent cleanup tokens', () => {
		TestBed.runInInjectionContext(() => {
			const catalogue = injectCatalogue();
			const cleanupFirst = extend({ OwnedConstructor: First });
			const cleanupSecond = extend({ OwnedConstructor: First });

			cleanupFirst();
			expect(catalogue.OwnedConstructor).toBe(First);

			cleanupSecond();
			expect(catalogue).not.toHaveProperty('OwnedConstructor');
		});
	});

	it('restores a pre-existing auto-filled value and makes cleanup idempotent', () => {
		TestBed.runInInjectionContext(() => {
			const catalogue = injectCatalogue();
			catalogue.ExistingConstructor = Original as NgtConstructorRepresentation;
			const cleanup = extend({ ExistingConstructor: First });

			expect(catalogue.ExistingConstructor).toBe(First);
			cleanup();
			cleanup();

			expect(catalogue.ExistingConstructor).toBe(Original);
		});
	});

	it('treats public remove as authoritative over old and future ownership eras', () => {
		TestBed.runInInjectionContext(() => {
			const catalogue = injectCatalogue();
			catalogue.RemovedConstructor = Original as NgtConstructorRepresentation;
			const cleanupOld = extend({ RemovedConstructor: First });

			remove('RemovedConstructor');
			expect(catalogue).not.toHaveProperty('RemovedConstructor');

			const cleanupNew = extend({ RemovedConstructor: Second });
			cleanupOld();
			expect(catalogue.RemovedConstructor).toBe(Second);

			cleanupNew();
			expect(catalogue).not.toHaveProperty('RemovedConstructor');
		});
	});
});
