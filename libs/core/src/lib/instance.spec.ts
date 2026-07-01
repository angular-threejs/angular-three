import { uuidv4Fallback, prepare, getInstanceState } from './instance';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('uuidv4Fallback', () => {
	it('should return a valid RFC 4122 v4 UUID', () => {
		const id = uuidv4Fallback();
		expect(id).toMatch(UUID_V4_REGEX);
	});

	it('should return unique values on each call', () => {
		const ids = new Set(Array.from({ length: 100 }, () => uuidv4Fallback()));
		expect(ids.size).toBe(100);
	});
});

describe('prepare', () => {
	beforeEach(() => {
		if (typeof crypto.randomUUID !== 'function') {
			(crypto as any).randomUUID = () => '00000000-0000-4000-8000-000000000000';
		}
	});

	it('should set __ngt_id__ to a valid UUID', () => {
		const obj = {};
		prepare(obj, 'ngt-test');
		expect((obj as any).__ngt_id__).toMatch(UUID_V4_REGEX);
	});

	it('should fall back to uuidv4Fallback when crypto.randomUUID is undefined', () => {
		const original = (crypto as any).randomUUID;
		delete (crypto as any).randomUUID;

		const obj = {};
		prepare(obj, 'ngt-test');
		expect((obj as any).__ngt_id__).toMatch(UUID_V4_REGEX);

		(crypto as any).randomUUID = original;
	});

	it('should return the instance state with correct type', () => {
		const obj = {};
		const prepared = prepare(obj, 'ngt-mesh');
		const state = getInstanceState(prepared);
		expect(state?.type).toBe('ngt-mesh');
	});

	it('should not reassign __ngt_id__ for already prepared non-primitive objects', () => {
		const obj = {};
		prepare(obj, 'ngt-first');
		const firstId = (obj as any).__ngt_id__;

		prepare(obj, 'ngt-second');
		expect((obj as any).__ngt_id__).toBe(firstId);
	});

	it('should reassign __ngt_id__ for ngt-primitive objects', () => {
		const obj = {};
		prepare(obj, 'ngt-primitive', { type: 'ngt-primitive' });
		const firstId = (obj as any).__ngt_id__;

		prepare(obj, 'ngt-primitive', { type: 'ngt-primitive' });
		expect((obj as any).__ngt_id__).not.toBe(firstId);
	});
});
