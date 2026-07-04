import {
	computed,
	Directive,
	DOCUMENT,
	effect,
	inject,
	Injector,
	input,
	model,
	output,
	Signal,
	signal,
	untracked,
} from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';

/**
 * A single action entry in the keyboard controls map.
 */
export interface NgtsKeyboardControlsEntry<TName extends string = string> {
	/**
	 * Name of the action.
	 */
	name: TName;
	/**
	 * The keys that trigger the action. Matched against either `event.key` or `event.code`.
	 * Prefer `event.code` values (e.g. `'KeyW'`, `'Space'`) — `event.key` values are
	 * layout- and case-sensitive (`'w'` vs `'W'` with Shift held).
	 */
	keys: string[];
	/**
	 * Whether the action also responds to `keyup`. When `false`, the action state latches
	 * `true` after the first press and only `keyChange` fires on subsequent press edges —
	 * useful for discrete fire-on-press actions. Ignored when `toggle` is `true`.
	 * @default true
	 */
	up?: boolean;
	/**
	 * Whether the action acts as a toggle: each press edge flips the state between
	 * `true` and `false`; `keyup` is ignored. Takes precedence over `up`.
	 * @default false
	 */
	toggle?: boolean;
}

/**
 * The pressed state of every action in the keyboard controls map.
 */
export type NgtsKeyboardControlsState<TName extends string = string> = { [K in TName]: boolean };

/**
 * Payload emitted by the `keyChange` output whenever an action transitions.
 */
export interface NgtsKeyboardControlsChangeEvent<TName extends string = string> {
	/**
	 * Name of the action that transitioned.
	 */
	name: TName;
	/**
	 * Whether the action is now pressed.
	 */
	pressed: boolean;
	/**
	 * A snapshot of the full state after the transition.
	 */
	state: NgtsKeyboardControlsState<TName>;
}

/**
 * A renderless directive that turns a user-defined controls map into keyboard state.
 *
 * NgtsKeyboardControls attaches `keydown`/`keyup` listeners to `window` (or a custom
 * `domElement`) and distributes the pressed state of named actions to descendants via
 * dependency injection. It owns no gameplay semantics — what happens when an action is
 * pressed is entirely up to consumers of `injectKeyboardControls`.
 *
 * Multiple physical keys can map to one action; held keys are reference-counted per action,
 * so OS auto-repeat and overlapping holds of sibling keys never produce duplicate transitions.
 *
 * @example
 * ```html
 * <ngt-group [keyboardControls]="controlsMap">
 *   <app-player />
 * </ngt-group>
 * ```
 *
 * @example
 * ```ts
 * // hostDirective form: provide + configure programmatically, no template binding
 * @Component({
 *   hostDirectives: [NgtsKeyboardControls],
 * })
 * export class SceneGraph {
 *   constructor() {
 *     inject(NgtsKeyboardControls).map.set(controlsMap);
 *   }
 * }
 * ```
 */
@Directive({ selector: '[keyboardControls]' })
export class NgtsKeyboardControls<TName extends string = string> {
	map = model<ReadonlyArray<NgtsKeyboardControlsEntry<TName>>>([], { alias: 'keyboardControls' });
	/**
	 * The event source the listeners attach to.
	 * @default window
	 */
	domElement = input<HTMLElement | Document | Window | null>(null);
	/**
	 * When `true`, listeners are registered non-passively and `preventDefault()` is called
	 * for events whose key is in the map (e.g. to stop Space from scrolling the page).
	 * @default false
	 */
	preventDefault = input(false);
	/**
	 * Emits on every action transition (and on each press edge for `up: false` actions).
	 */
	keyChange = output<NgtsKeyboardControlsChangeEvent<TName>>();

	private document = inject(DOCUMENT);
	private source = signal<NgtsKeyboardControlsState<TName>>({} as NgtsKeyboardControlsState<TName>);
	private selectors = new Map<TName, Signal<boolean>>();

	/**
	 * The pressed state of every action as a readonly signal.
	 */
	state = this.source.asReadonly();

	/**
	 * A non-reactive snapshot of the current state. Use this inside `beforeRender`
	 * to poll keyboard state every frame without creating signal dependencies.
	 */
	get snapshot() {
		return untracked(this.source);
	}

	constructor() {
		effect((onCleanup) => {
			const map = this.map();
			if (!map.length) return;

			const target = this.domElement() ?? this.document.defaultView;
			if (!target) return;

			const preventDefault = this.preventDefault();

			// seed the state with every action unpressed
			this.source.set(
				map.reduce((prev, cur) => {
					prev[cur.name] = false;
					return prev;
				}, {} as NgtsKeyboardControlsState<TName>),
			);

			// each action reference-counts its currently held keys so multiple physical keys
			// and OS auto-repeat resolve to single pressed/released transitions
			const actions: Array<Omit<NgtsKeyboardControlsEntry<TName>, 'keys'> & { held: Set<string> }> = [];
			const keyMap = new Map<string, (typeof actions)[number]>();

			for (const entry of map) {
				const action: (typeof actions)[number] = {
					name: entry.name,
					up: entry.up ?? true,
					toggle: entry.toggle ?? false,
					held: new Set(),
				};
				actions.push(action);
				for (const key of entry.keys) {
					keyMap.set(key, action);
				}
			}

			const transition = (action: (typeof actions)[number], pressed: boolean) => {
				this.source.update((prev) => ({ ...prev, [action.name]: pressed }));
				this.keyChange.emit({ name: action.name, pressed, state: untracked(this.source) });
			};

			const resolve = (event: KeyboardEvent) => {
				const matched = keyMap.has(event.key) ? event.key : event.code;
				const action = keyMap.get(matched);
				if (action && preventDefault) event.preventDefault();
				return [matched, action] as const;
			};

			const downHandler = (event: KeyboardEvent) => {
				const [matched, action] = resolve(event);
				if (!action) return;
				const wasHeld = action.held.size > 0;
				action.held.add(matched);
				if (wasHeld) return;
				if (action.toggle) transition(action, !untracked(this.source)[action.name]);
				else transition(action, true);
			};

			const upHandler = (event: KeyboardEvent) => {
				const [matched, action] = resolve(event);
				if (!action) return;
				action.held.delete(matched);
				if (action.held.size === 0 && action.up && !action.toggle) transition(action, false);
			};

			const listenerOptions = { passive: !preventDefault };
			target.addEventListener('keydown', downHandler as EventListener, listenerOptions);
			target.addEventListener('keyup', upHandler as EventListener, listenerOptions);

			onCleanup(() => {
				target.removeEventListener('keydown', downHandler as EventListener);
				target.removeEventListener('keyup', upHandler as EventListener);
			});
		});
	}

	/**
	 * Returns a memoized readonly signal for a single action's pressed state.
	 * The signal only notifies when that action actually transitions.
	 */
	select(name: TName): Signal<boolean> {
		let selector = this.selectors.get(name);
		if (!selector) {
			selector = computed(() => this.state()[name] ?? false);
			this.selectors.set(name, selector);
		}
		return selector;
	}
}

/**
 * Injects the nearest NgtsKeyboardControls instance, typed to the given action names.
 *
 * @example
 * ```ts
 * const keyboardControls = injectKeyboardControls<'forward' | 'back' | 'jump'>();
 *
 * // reactive form
 * forward = keyboardControls.select('forward');
 *
 * // transient form, polled in the frame loop
 * beforeRender(() => {
 *   const { forward, back } = keyboardControls.snapshot;
 * });
 * ```
 *
 * @param options - Configuration options
 * @param options.injector - Optional injector for dependency injection context
 */
export function injectKeyboardControls<TName extends string = string>({ injector }: { injector?: Injector } = {}) {
	return assertInjector(injectKeyboardControls, injector, () => {
		const keyboardControls = inject(NgtsKeyboardControls, { optional: true });
		if (!keyboardControls) {
			throw new Error(
				'injectKeyboardControls must be used within an element with the keyboardControls directive',
			);
		}
		return keyboardControls as unknown as NgtsKeyboardControls<TName>;
	});
}

/**
 * Creates a typed keyboard controls map outside of the Angular lifecycle.
 *
 * A runtime identity function whose value is type-level: the action names are inferred
 * as literals from the entries, so the returned `injectKeyboardControls` is fully typed
 * without repeating the generic at every call site.
 *
 * @example
 * ```ts
 * export const { controlsMap, injectKeyboardControls } = createKeyboardControls([
 *   { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
 *   { name: 'back', keys: ['ArrowDown', 'KeyS'] },
 *   { name: 'jump', keys: ['Space'], up: false },
 * ]);
 *
 * // in a template: <ngt-group [keyboardControls]="controlsMap">
 * // in a consumer: const keyboardControls = injectKeyboardControls();
 * ```
 */
export function createKeyboardControls<const TEntries extends ReadonlyArray<NgtsKeyboardControlsEntry>>(
	entries: TEntries,
) {
	type TName = TEntries[number]['name'];
	return {
		controlsMap: entries as ReadonlyArray<NgtsKeyboardControlsEntry<TName>>,
		injectKeyboardControls: (options: { injector?: Injector } = {}) => injectKeyboardControls<TName>(options),
	};
}
