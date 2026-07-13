import { TestBed } from '@angular/core/testing';
import { NGT_LOOP } from './loop';
import { NGT_STORE, storeFactory } from './store';

describe('before-render subscriptions', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				{ provide: NGT_LOOP, useValue: { advance: vi.fn(), invalidate: vi.fn(), loop: vi.fn() } },
				{ provide: NGT_STORE, useFactory: storeFactory },
			],
		});
	});

	it('owns duplicate callback registrations independently with idempotent priority cleanup', () => {
		const store = TestBed.inject(NGT_STORE);
		const callback = vi.fn();
		const firstCleanup = store.snapshot.internal.subscribe(callback, 1, store);
		const secondCleanup = store.snapshot.internal.subscribe(callback, 1, store);

		expect(store.snapshot.internal.subscribers).toHaveLength(2);
		expect(store.snapshot.internal.priority).toBe(2);

		firstCleanup();
		firstCleanup();
		expect(store.snapshot.internal.subscribers).toHaveLength(1);
		expect(store.snapshot.internal.priority).toBe(1);

		secondCleanup();
		secondCleanup();
		expect(store.snapshot.internal.subscribers).toHaveLength(0);
		expect(store.snapshot.internal.priority).toBe(0);
	});

	it('preserves registration order among equal priorities', () => {
		const store = TestBed.inject(NGT_STORE);
		const callbacks = [vi.fn(), vi.fn(), vi.fn()];
		for (const callback of callbacks) store.snapshot.internal.subscribe(callback, 0, store);

		expect(store.snapshot.internal.subscribers.map(({ callback }) => callback)).toEqual(callbacks);
	});
});
