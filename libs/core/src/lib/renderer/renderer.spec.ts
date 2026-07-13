import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
	Renderer2,
	RendererFactory2,
	RendererStyleFlags2,
	RendererType2,
	signal,
	TemplateRef,
	Type,
	viewChild,
	viewChildren,
	ViewContainerRef,
	ViewEncapsulation,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgtTestBed } from 'angular-three/testing';
import { BoxGeometry, Color, Group, Layers, Mesh, MeshStandardMaterial, Raycaster } from 'three';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { NgtArgs } from '../directives/args';
import { NgtHTML, provideHTMLDomElement } from '../html';
import { getInstanceState, prepare } from '../instance';
import { elementEvents } from '../utils/element-events';
import { objectEvents } from '../utils/object-events';
import { extend } from './catalogue';
import { NgtRenderer2, NgtRendererFactory2 } from './renderer';
import { createRendererNode, insertRendererChildNode, markRendererViewHost, NgtRendererClassId } from './state';
import { attachThreeNodes, removeThreeChild } from './utils';

class RecordingRenderer implements Renderer2 {
	data: Record<string, any> = {};
	destroy = vi.fn();
	createElement = vi.fn((name: string) => document.createElement(name));
	createComment = vi.fn((value: string) => document.createComment(value));
	createText = vi.fn((value: string) => document.createTextNode(value));
	destroyNode = vi.fn();
	appendChild = vi.fn();
	insertBefore = vi.fn();
	removeChild = vi.fn();
	selectRootElement = vi.fn((selectorOrNode: string | any) => selectorOrNode);
	parentNode = vi.fn((node: Node) => node.parentNode);
	nextSibling = vi.fn((node: Node) => node.nextSibling);
	setAttribute = vi.fn();
	removeAttribute = vi.fn();
	addClass = vi.fn();
	removeClass = vi.fn();
	setStyle = vi.fn();
	removeStyle = vi.fn();
	setProperty = vi.fn();
	setValue = vi.fn();
	listen = vi.fn(() => vi.fn());
}

class RecordingRendererFactory implements RendererFactory2 {
	renderers: RecordingRenderer[] = [];
	done = Promise.resolve('done');
	createRenderer = vi.fn(() => {
		const renderer = this.sharedRenderer ?? new RecordingRenderer();
		this.renderers.push(renderer);
		return renderer;
	});
	begin = vi.fn();
	end = vi.fn();
	whenRenderingDone = vi.fn(() => this.done);

	constructor(private sharedRenderer?: RecordingRenderer) {}
}

class DisposableGroup extends Group {
	disposeSpy = vi.fn();
	dispose: (() => void) | null = () => this.disposeSpy();
}

class ArgGroup extends DisposableGroup {
	constructor(readonly argument: number) {
		super();
	}
}

const removeTestClasses = extend({ DisposableGroup, ArgGroup });

describe('NgtRenderer2 integration', () => {
	afterAll(removeTestClasses);

	it('keeps logical and Three child order aligned for keyed moves without disposing live instances', () => {
		@Component({
			template: `
				@for (item of items(); track item) {
					<ngt-disposable-group [name]="item" />
				}
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			items = signal(['a', 'b', 'c']);
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const instances = new Map(scene.children.map((child) => [child.name, child as DisposableGroup]));

		expect(scene.children.map((child) => child.name)).toEqual(['a', 'b', 'c']);

		sceneGraphComponentRef.instance.items.set(['c', 'a', 'b']);
		fixture.detectChanges();

		expect(scene.children.map((child) => child.name)).toEqual(['c', 'a', 'b']);
		expect(scene.children).toEqual([instances.get('c'), instances.get('a'), instances.get('b')]);
		for (const instance of instances.values()) {
			expect(instance.disposeSpy).not.toHaveBeenCalled();
		}
	});

	it('keeps static component roots between their surrounding Three siblings', () => {
		@Component({
			selector: 'app-middle-root',
			template: `
				<ngt-group name="middle" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class MiddleRoot {}

		@Component({
			template: `
				<ngt-group name="before" />
				<app-middle-root />
				<ngt-group name="after" />
			`,
			imports: [MiddleRoot],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {}

		const { scene } = NgtTestBed.create(SceneGraph);
		expect(scene.children.map((child) => child.name)).toEqual(['before', 'middle', 'after']);
	});

	it('looks past attached resources when inserting an Object3D before their logical position', () => {
		@Component({
			template: `
				<ngt-mesh name="parent">
					@if (visible()) {
						<ngt-group name="inserted" />
					}
					<ngt-box-geometry />
					<ngt-group name="after" />
				</ngt-mesh>
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			visible = signal(false);
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const parent = scene.getObjectByName('parent')!;
		expect(parent.children.map((child) => child.name)).toEqual(['after']);

		sceneGraphComponentRef.instance.visible.set(true);
		fixture.detectChanges();
		expect(parent.children.map((child) => child.name)).toEqual(['inserted', 'after']);
	});

	it('treats inserting a child before itself as a physical and logical no-op', () => {
		@Component({
			template: `
				<ngt-group name="first" />
				<ngt-group name="second" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			renderer = inject(Renderer2);
		}

		const { scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const first = scene.getObjectByName('first')!;
		sceneGraphComponentRef.instance.renderer.insertBefore(scene, first, first);
		expect(scene.children.map((child) => child.name)).toEqual(['first', 'second']);
	});

	it('does not re-run same-parent attachments or retain a stale custom cleanup', () => {
		const parent = prepare(new Group(), 'ngt-group');
		const child = prepare(new Group(), 'ngt-group');
		const cleanup = vi.fn();
		const firstAttach = vi.fn(() => cleanup);
		const secondAttach = vi.fn(() => undefined);
		const childState = getInstanceState(child)!;
		childState.attach = firstAttach;

		attachThreeNodes(parent, child);
		attachThreeNodes(parent, child);
		expect(firstAttach).toHaveBeenCalledOnce();
		expect(cleanup).not.toHaveBeenCalled();

		removeThreeChild(child, parent, false);
		expect(cleanup).toHaveBeenCalledOnce();
		childState.attach = secondAttach;
		attachThreeNodes(parent, child);
		removeThreeChild(child, parent, false);
		expect(secondAttach).toHaveBeenCalledOnce();
		expect(cleanup).toHaveBeenCalledOnce();
	});

	it('disposes an owned Three instance exactly once when its Angular view is destroyed', async () => {
		@Component({
			template: `
				@if (visible()) {
					<ngt-disposable-group name="owned" />
				}
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			visible = signal(true);
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const instance = scene.getObjectByName('owned') as DisposableGroup;

		sceneGraphComponentRef.instance.visible.set(false);
		fixture.detectChanges();
		await Promise.resolve();

		expect(scene.getObjectByName('owned')).toBeUndefined();
		expect(instance.disposeSpy).toHaveBeenCalledOnce();
	});

	it('preserves surviving identities through keyed insertion and removal', async () => {
		@Component({
			template: `
				@for (item of items(); track item) {
					<ngt-disposable-group [name]="item" />
				}
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			items = signal(['a', 'c']);
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const a = scene.getObjectByName('a') as DisposableGroup;
		const c = scene.getObjectByName('c') as DisposableGroup;

		sceneGraphComponentRef.instance.items.set(['a', 'b', 'c']);
		fixture.detectChanges();
		const b = scene.getObjectByName('b') as DisposableGroup;
		expect(scene.children).toEqual([a, b, c]);

		sceneGraphComponentRef.instance.items.set(['c', 'a']);
		fixture.detectChanges();
		await Promise.resolve();

		expect(scene.children).toEqual([c, a]);
		expect(a.disposeSpy).not.toHaveBeenCalled();
		expect(c.disposeSpy).not.toHaveBeenCalled();
		expect(b.disposeSpy).toHaveBeenCalledOnce();
	});

	it('reports synchronous logical parents and siblings', () => {
		@Component({
			template: `
				<ngt-group name="a" />
				<ngt-group name="b" />
				<ngt-group name="c" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {}

		const { scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const renderer = sceneGraphComponentRef.injector.get(Renderer2);
		const [a, b, c] = scene.children;

		expect(renderer.parentNode(a)).toBe(sceneGraphComponentRef.location.nativeElement);
		expect(renderer.nextSibling(a)).toBe(b);
		expect(renderer.nextSibling(b)).toBe(c);
		expect(renderer.nextSibling(c)).toBeNull();
	});

	it('keeps same-name lifecycle listeners independent and cleanup idempotent', () => {
		@Component({
			template: `
				<ngt-group />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {}

		const { scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const group = scene.children[0];
		const renderer = sceneGraphComponentRef.injector.get(Renderer2);
		const first = vi.fn();
		const second = vi.fn();
		const removeFirst = renderer.listen(group, 'updated', first);
		const removeSecond = renderer.listen(group, 'updated', second);
		const state = getInstanceState(group)!;

		state.onUpdate?.(group as any);
		expect(first).toHaveBeenCalledOnce();
		expect(second).toHaveBeenCalledOnce();

		removeFirst();
		removeFirst();
		state.onUpdate?.(group as any);
		expect(first).toHaveBeenCalledOnce();
		expect(second).toHaveBeenCalledTimes(2);

		removeSecond();
		removeSecond();
		expect(state.onUpdate).toBeUndefined();
	});

	it('honors once semantics for Three listeners without synthesizing removed events', () => {
		@Component({
			template: `
				<ngt-group #target />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			target = viewChild.required<ElementRef<Group>>('target');
			renderer = inject(Renderer2);
		}

		const { sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const target = sceneGraphComponentRef.instance.target().nativeElement;
		const renderer = sceneGraphComponentRef.instance.renderer;
		const pointer = vi.fn();
		const updated = vi.fn();
		const removed = vi.fn();
		const pointerCleanup = renderer.listen(target, 'click', pointer, { once: true });
		const updatedCleanup = renderer.listen(target, 'updated', updated, { once: true });
		const removedCleanup = renderer.listen(target, 'removed', removed, { once: true });
		const pointerDispatch = getInstanceState(target)!.handlers.click!;

		pointerDispatch({} as never);
		pointerDispatch({} as never);
		renderer.setProperty(target, 'name', 'first');
		renderer.setProperty(target, 'name', 'second');
		expect(removed).not.toHaveBeenCalled();
		target.dispatchEvent({ type: 'removed' });
		target.dispatchEvent({ type: 'removed' });

		expect(pointer).toHaveBeenCalledOnce();
		expect(updated).toHaveBeenCalledOnce();
		expect(removed).toHaveBeenCalledOnce();
		pointerCleanup();
		pointerCleanup();
		updatedCleanup();
		removedCleanup();
	});

	it('cleans reactive object and element listeners exactly once when their target changes', () => {
		@Component({
			template: `
				<ngt-group name="first" />
				<ngt-group name="second" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			target = signal<Group | null>(null);
			click = vi.fn();
			updated = vi.fn();

			constructor() {
				objectEvents(this.target, { click: this.click });
				elementEvents(this.target, { updated: this.updated });
			}
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const [first, second] = scene.children;
		const firstState = getInstanceState(first)!;
		const secondState = getInstanceState(second)!;

		sceneGraphComponentRef.instance.target.set(first);
		TestBed.flushEffects();
		expect(firstState.eventCount).toBe(1);
		expect(firstState.handlers?.click).toBeDefined();
		expect(firstState.onUpdate).toBeDefined();

		sceneGraphComponentRef.instance.target.set(second);
		TestBed.flushEffects();
		expect(firstState.eventCount).toBe(0);
		expect(firstState.handlers?.click).toBeUndefined();
		expect(firstState.onUpdate).toBeUndefined();
		expect(secondState.eventCount).toBe(1);
		expect(secondState.onUpdate).toBeDefined();

		sceneGraphComponentRef.instance.target.set(null);
		TestBed.flushEffects();
		fixture.destroy();
		expect(secondState.eventCount).toBe(0);
		expect(secondState.handlers?.click).toBeUndefined();
		expect(secondState.onUpdate).toBeUndefined();
	});

	it('disposes remaining owned nodes once when the fixture is destroyed repeatedly', async () => {
		@Component({
			template: `
				<ngt-disposable-group name="a" />
				<ngt-disposable-group name="b" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const instances = [...scene.children] as DisposableGroup[];
		const host = sceneGraphComponentRef.location.nativeElement as any;
		expect([...(host.__ngt_renderer__?.[NgtRendererClassId.ownedNodes] ?? [])]).toEqual(
			expect.arrayContaining(instances),
		);

		fixture.destroy();
		fixture.destroy();
		await Promise.resolve();
		for (const instance of instances) expect(instance.disposeSpy).toHaveBeenCalledOnce();
	});

	it('does not dispose externally owned primitive instances', async () => {
		@Component({
			template: `
				@if (visible()) {
					<ngt-primitive *args="[object]" />
				}
			`,
			imports: [NgtArgs],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			visible = signal(true);
			object = new DisposableGroup();
		}

		const { fixture, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const instance = sceneGraphComponentRef.instance.object;

		sceneGraphComponentRef.instance.visible.set(false);
		fixture.detectChanges();
		await Promise.resolve();

		expect(instance.parent).toBeNull();
		expect(instance.disposeSpy).not.toHaveBeenCalled();
	});

	it('honors disposal opt-out on renderer-owned instances', async () => {
		@Component({
			template: `
				@if (visible()) {
					<ngt-disposable-group name="opted-out" [dispose]="null" />
				}
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			visible = signal(true);
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const instance = scene.getObjectByName('opted-out') as DisposableGroup;

		sceneGraphComponentRef.instance.visible.set(false);
		fixture.detectChanges();
		await Promise.resolve();

		expect(instance.disposeSpy).not.toHaveBeenCalled();
	});

	it('applies every pierced and ordinary property in one parameters update', () => {
		@Component({
			template: `
				<ngt-group [parameters]="{ 'position.x': 1, name: 'updated' }" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {}

		const { scene } = NgtTestBed.create(SceneGraph);
		const group = scene.children[0] as Group;

		expect(group.position.x).toBe(1);
		expect(group.name).toBe('updated');
	});

	it('restores defaults when parameters are removed', () => {
		@Component({
			template: `
				<ngt-group [parameters]="parameters()" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			parameters = signal<Record<string, unknown>>({ visible: false, name: 'initial' });
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const group = scene.children[0] as Group;
		expect(group.visible).toBe(false);

		sceneGraphComponentRef.instance.parameters.set({ name: 'updated' });
		fixture.detectChanges();

		expect(group.visible).toBe(true);
		expect(group.name).toBe('updated');
	});

	it('restores mutable values and resource identities while refreshing removed geometry', () => {
		@Component({
			template: `
				<ngt-mesh [parameters]="parameters()" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			parameters = signal<Record<string, unknown>>({});
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const mesh = scene.children[0] as Mesh;
		const defaultGeometry = mesh.geometry;
		const defaultMaterial = mesh.material;
		const defaultLayersMask = mesh.layers.mask;
		const geometryStamp = vi.spyOn(getInstanceState(mesh)!, 'updateGeometryStamp');
		const overrideGeometry = new BoxGeometry();
		const overrideMaterial = new MeshStandardMaterial();
		const overrideLayers = new Layers();
		overrideLayers.set(3);

		sceneGraphComponentRef.instance.parameters.set({
			geometry: overrideGeometry,
			material: overrideMaterial,
			layers: overrideLayers,
		});
		fixture.detectChanges();
		expect(mesh.geometry).toBe(overrideGeometry);
		expect(mesh.material).toBe(overrideMaterial);
		expect(mesh.layers.mask).toBe(overrideLayers.mask);
		expect(geometryStamp).toHaveBeenCalledOnce();

		geometryStamp.mockClear();
		sceneGraphComponentRef.instance.parameters.set({});
		fixture.detectChanges();
		expect(mesh.geometry).toBe(defaultGeometry);
		expect(mesh.material).toBe(defaultMaterial);
		expect(mesh.layers.mask).toBe(defaultLayersMask);
		expect(geometryStamp).toHaveBeenCalledOnce();
	});

	it('refreshes geometry tracking when a direct geometry binding is restored', () => {
		@Component({
			template: `
				<ngt-mesh [geometry]="geometry()" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			geometry = signal<BoxGeometry | undefined>(undefined);
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const mesh = scene.children[0] as Mesh;
		const defaultGeometry = mesh.geometry;
		const geometryStamp = vi.spyOn(getInstanceState(mesh)!, 'updateGeometryStamp');
		const overrideGeometry = new BoxGeometry();

		sceneGraphComponentRef.instance.geometry.set(overrideGeometry);
		fixture.detectChanges();
		expect(mesh.geometry).toBe(overrideGeometry);

		sceneGraphComponentRef.instance.geometry.set(undefined);
		fixture.detectChanges();
		expect(mesh.geometry).toBe(defaultGeometry);
		expect(geometryStamp).toHaveBeenCalledTimes(2);
	});

	it('normalizes a frozen raycast parameter without mutating the caller object', () => {
		const parameters = Object.freeze({ raycast: null });

		@Component({
			template: `
				<ngt-mesh [parameters]="parameters" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			parameters = parameters;
		}

		const { scene } = NgtTestBed.create(SceneGraph);
		const mesh = scene.children[0] as Mesh;
		expect(mesh.raycast(new Raycaster(), [])).toBeNull();
		expect(parameters.raycast).toBeNull();
	});

	it('updates attached raw values without writing hierarchy signals during template rendering', () => {
		@Component({
			template: `
				<ngt-mesh name="raw-value-host">
					<ngt-mesh-standard-material>
						<ngt-value attach="roughness" [rawValue]="roughness()" />
					</ngt-mesh-standard-material>
				</ngt-mesh>
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			roughness = signal(0.25);
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const material = (scene.getObjectByName('raw-value-host') as Mesh).material as MeshStandardMaterial;
		expect(material.roughness).toBe(0.25);

		sceneGraphComponentRef.instance.roughness.set(0.75);
		expect(() => fixture.detectChanges()).not.toThrow();
		expect(material.roughness).toBe(0.75);
	});

	it('preserves typed targets when an attached raw value receives its first binding', () => {
		@Component({
			template: `
				<ngt-mesh name="raw-color-host">
					<ngt-value attach="material.color" [rawValue]="'lightgreen'" />
				</ngt-mesh>
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {}

		const { scene } = NgtTestBed.create(SceneGraph);
		const material = (scene.getObjectByName('raw-color-host') as Mesh).material as MeshStandardMaterial;
		expect(material.color).toBeInstanceOf(Color);
		expect(material.color.getHex()).toBe(new Color('lightgreen').getHex());
	});

	it('resolves raw-value attachment parents across component wrappers', () => {
		@Component({
			selector: 'test-attached-color',
			template: `
				<ngt-value attach="material.color" [rawValue]="color()" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class AttachedColor {
			color = input.required<string>();
		}

		@Component({
			template: `
				<ngt-mesh name="wrapped-raw-color-host">
					<test-attached-color [color]="color()" />
				</ngt-mesh>
			`,
			imports: [AttachedColor],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			color = signal('lightgreen');
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const material = (scene.getObjectByName('wrapped-raw-color-host') as Mesh).material as MeshStandardMaterial;
		expect(material.color.getHex()).toBe(new Color('lightgreen').getHex());

		sceneGraphComponentRef.instance.color.set('hotpink');
		fixture.detectChanges();
		expect(material.color.getHex()).toBe(new Color('hotpink').getHex());
	});

	it('preserves attachment targets while an attached raw value is undefined', () => {
		@Component({
			template: `
				<ngt-mesh name="undefined-raw-value-host">
					<ngt-value attach="material.color" [rawValue]="undefined" />
				</ngt-mesh>
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {}

		const { scene } = NgtTestBed.create(SceneGraph);
		const material = (scene.getObjectByName('undefined-raw-value-host') as Mesh).material as MeshStandardMaterial;
		expect(material.color).toBeInstanceOf(Color);
		expect(material.color.getHex()).toBe(new Color().getHex());
	});

	it('preserves every indexed material when component bindings replace auto-attachment', () => {
		@Component({
			selector: 'test-face-material',
			template: `
				<ngt-mesh-standard-material [attach]="['material', index()]" [name]="'face-' + index()" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class FaceMaterial {
			index = input.required<number>();
		}

		@Component({
			template: `
				<ngt-mesh name="indexed-material-host">
					<ngt-box-geometry />
					@for (index of indices; track index) {
						<test-face-material [index]="index" />
					}
				</ngt-mesh>
			`,
			imports: [FaceMaterial],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			indices = [0, 1, 2, 3, 4, 5];
		}

		const { scene } = NgtTestBed.create(SceneGraph);
		const mesh = scene.getObjectByName('indexed-material-host') as Mesh;
		expect(Array.isArray(mesh.material)).toBe(true);
		expect((mesh.material as MeshStandardMaterial[]).map((material) => material?.name)).toEqual([
			'face-0',
			'face-1',
			'face-2',
			'face-3',
			'face-4',
			'face-5',
		]);
	});

	it('moves a reactive attachment while restoring the previous slot', () => {
		@Component({
			template: `
				<ngt-group name="parent">
					<ngt-disposable-group name="child" [attach]="attachment()" />
				</ngt-group>
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			attachment = signal('first');
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const parent = scene.getObjectByName('parent') as Group & {
			first?: DisposableGroup;
			second?: DisposableGroup;
		};
		const child = parent.first;
		expect(child).toBeInstanceOf(DisposableGroup);
		expect(parent.second).toBeUndefined();

		sceneGraphComponentRef.instance.attachment.set('second');
		fixture.detectChanges();

		expect(parent.first).toBeUndefined();
		expect(parent.second).toBe(child);
		expect(child?.disposeSpy).not.toHaveBeenCalled();
	});

	it('removes an attachment omitted from a later parameters object', () => {
		@Component({
			template: `
				<ngt-group name="parent">
					<ngt-disposable-group name="child" [parameters]="parameters()" />
				</ngt-group>
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			parameters = signal<Record<string, unknown>>({ attach: 'slot' });
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const parent = scene.getObjectByName('parent') as Group & { slot?: DisposableGroup };
		const child = parent.slot!;

		expect(child).toBeInstanceOf(DisposableGroup);
		expect(parent.children).not.toContain(child);

		sceneGraphComponentRef.instance.parameters.set({});
		fixture.detectChanges();

		expect(parent.slot).toBeUndefined();
		expect(parent.children).toContain(child);
		expect(child.parent).toBe(parent);
		expect(child.disposeSpy).not.toHaveBeenCalled();
	});

	it('reconstructs changed args in place and removes the view when args become invalid', async () => {
		@Component({
			template: `
				<ngt-group name="before" />
				<ngt-arg-group *args="args()" name="target" />
				<ngt-group name="after" />
			`,
			imports: [NgtArgs],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			args = signal<[number] | null>([1]);
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const first = scene.getObjectByName('target') as ArgGroup;
		expect(first.argument).toBe(1);

		sceneGraphComponentRef.instance.args.set([2]);
		fixture.detectChanges();
		await Promise.resolve();
		const second = scene.getObjectByName('target') as ArgGroup;

		expect(scene.children.map((child) => child.name)).toEqual(['before', 'target', 'after']);
		expect(second).not.toBe(first);
		expect(second.argument).toBe(2);
		expect(first.disposeSpy).toHaveBeenCalledOnce();

		sceneGraphComponentRef.instance.args.set(null);
		fixture.detectChanges();
		await Promise.resolve();
		expect(scene.children.map((child) => child.name)).toEqual(['before', 'after']);
		expect(second.disposeSpy).toHaveBeenCalledOnce();

		sceneGraphComponentRef.instance.args.set([3]);
		fixture.detectChanges();
		expect(scene.children.map((child) => child.name)).toEqual(['before', 'target', 'after']);
		expect((scene.getObjectByName('target') as ArgGroup).argument).toBe(3);
	});

	it('preserves template-defined order across content projection', () => {
		@Component({
			selector: 'test-wrapper',
			template: `
				<ngt-group name="wrapper">
					<ngt-group name="before" />
					<ng-content />
					<ngt-group name="after" />
				</ngt-group>
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class Wrapper {}

		@Component({
			template: `
				<test-wrapper>
					<ngt-group name="projected" />
				</test-wrapper>
			`,
			imports: [Wrapper],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {}

		const { scene } = NgtTestBed.create(SceneGraph);
		const wrapper = scene.getObjectByName('wrapper');
		expect(wrapper.children.map((child) => child.name)).toEqual(['before', 'projected', 'after']);
	});

	it('inserts NgTemplateOutlet content at its logical anchor', () => {
		@Component({
			template: `
				<ngt-group name="before" />
				<ng-container [ngTemplateOutlet]="content" />
				<ngt-group name="after" />
				<ng-template #content>
					<ngt-group name="outlet" />
				</ng-template>
			`,
			imports: [NgTemplateOutlet],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {}

		const { scene } = NgtTestBed.create(SceneGraph);
		expect(scene.children.map((child) => child.name)).toEqual(['before', 'outlet', 'after']);
	});

	it('distinguishes ViewContainerRef detach/move from final removal', async () => {
		@Component({
			template: `
				<ngt-group name="before" />
				<ng-container #outlet />
				<ngt-group name="after" />
				<ng-template #item let-name>
					<ngt-disposable-group [name]="name" />
				</ng-template>
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			outlet = viewChild.required('outlet', { read: ViewContainerRef });
			item = viewChild.required<TemplateRef<{ $implicit: string }>>('item');
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const outlet = sceneGraphComponentRef.instance.outlet();
		const template = sceneGraphComponentRef.instance.item();
		const aView = outlet.createEmbeddedView(template, { $implicit: 'a' });
		const bView = outlet.createEmbeddedView(template, { $implicit: 'b' });
		fixture.detectChanges();
		const a = scene.getObjectByName('a') as DisposableGroup;
		const b = scene.getObjectByName('b') as DisposableGroup;

		expect(scene.children.map((child) => child.name)).toEqual(['before', 'a', 'b', 'after']);

		outlet.move(bView, 0);
		fixture.detectChanges();
		expect(scene.children).toEqual([scene.getObjectByName('before'), b, a, scene.getObjectByName('after')]);
		expect(b.disposeSpy).not.toHaveBeenCalled();

		const detached = outlet.detach(0);
		fixture.detectChanges();
		expect(scene.children.map((child) => child.name)).toEqual(['before', 'a', 'after']);
		expect(b.disposeSpy).not.toHaveBeenCalled();

		outlet.insert(detached!, 1);
		fixture.detectChanges();
		expect(scene.children.map((child) => child.name)).toEqual(['before', 'a', 'b', 'after']);
		expect(scene.getObjectByName('b')).toBe(b);

		outlet.remove(outlet.indexOf(aView));
		fixture.detectChanges();
		await Promise.resolve();
		expect(scene.children.map((child) => child.name)).toEqual(['before', 'b', 'after']);
		expect(a.disposeSpy).toHaveBeenCalledOnce();
	});

	it('replaces NgComponentOutlet content in place', async () => {
		@Component({
			template: `
				<ngt-disposable-group name="dynamic-a" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class DynamicA {
			host = inject<ElementRef<HTMLElement>>(ElementRef);
		}

		@Component({
			template: `
				<ngt-disposable-group name="dynamic-b" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class DynamicB {}

		@Component({
			template: `
				<ngt-group name="before" />
				<ng-container [ngComponentOutlet]="component()" />
				<ngt-group name="after" />
			`,
			imports: [NgComponentOutlet],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
			changeDetection: ChangeDetectionStrategy.OnPush,
		})
		class SceneGraph {
			component = signal<Type<unknown>>(DynamicA);
			outlet = viewChild.required(NgComponentOutlet);
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const dynamicInstance = sceneGraphComponentRef.instance.outlet().componentInstance as DynamicA;
		const dynamicHost = dynamicInstance.host.nativeElement as any;
		expect(dynamicHost.__ngt_renderer__).toBeDefined();
		expect(dynamicHost.__ngt_renderer__[NgtRendererClassId.parent]).toBeDefined();
		const dynamicChildren = dynamicHost.__ngt_renderer__[NgtRendererClassId.children] as any[];
		expect(dynamicChildren.map((child) => child.name)).toContain('dynamic-a');
		expect(
			dynamicChildren.find((child) => child.name === 'dynamic-a')?.__ngt_renderer__?.[NgtRendererClassId.owner],
		).toBe(dynamicHost);
		const first = scene.getObjectByName('dynamic-a') as DisposableGroup;
		expect(scene.children.map((child) => child.name)).toEqual(['before', 'dynamic-a', 'after']);

		sceneGraphComponentRef.instance.component.set(DynamicB);
		fixture.detectChanges();
		await Promise.resolve();

		expect(scene.children.map((child) => child.name)).toEqual(['before', 'dynamic-b', 'after']);
		expect(first.disposeSpy).toHaveBeenCalledOnce();
	});

	it('keeps a detached component view alive and finalizes it only when removed', async () => {
		@Component({
			template: `
				<ngt-disposable-group name="dynamic" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class Dynamic {}

		@Component({
			template: `
				<ngt-group name="before" />
				<ng-container #outlet />
				<ngt-group name="after" />
			`,
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		})
		class SceneGraph {
			outlet = viewChild.required('outlet', { read: ViewContainerRef });
		}

		const { fixture, scene, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const outlet = sceneGraphComponentRef.instance.outlet();
		outlet.createComponent(Dynamic);
		fixture.detectChanges();

		const dynamic = scene.getObjectByName('dynamic') as DisposableGroup;
		expect(scene.children.map((child) => child.name)).toEqual(['before', 'dynamic', 'after']);

		const detached = outlet.detach(0);
		fixture.detectChanges();
		expect(scene.children.map((child) => child.name)).toEqual(['before', 'after']);
		expect(dynamic.disposeSpy).not.toHaveBeenCalled();

		outlet.insert(detached!);
		fixture.detectChanges();
		expect(scene.children.map((child) => child.name)).toEqual(['before', 'dynamic', 'after']);
		expect(scene.getObjectByName('dynamic')).toBe(dynamic);

		outlet.remove(0);
		fixture.detectChanges();
		await Promise.resolve();
		expect(scene.children.map((child) => child.name)).toEqual(['before', 'after']);
		expect(dynamic.disposeSpy).toHaveBeenCalledOnce();
	});

	it('hands NgtHTML views to Angular while preserving Emulated encapsulation and delegate reuse', () => {
		@Component({
			selector: 'app-html-probe',
			template: `
				<span class="probe">DOM content</span>
			`,
			styles: `
				.probe {
					color: red;
				}
			`,
			encapsulation: ViewEncapsulation.Emulated,
		})
		class HtmlProbe extends NgtHTML {
			host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
			renderer = inject(Renderer2);
		}

		@Component({
			template: `
				<app-html-probe />
				<app-html-probe />
			`,
			imports: [HtmlProbe],
		})
		class SceneGraph {
			probes = viewChildren(HtmlProbe);
		}

		const { sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const [first, second] = sceneGraphComponentRef.instance.probes();

		expect(first.renderer).toBe(second.renderer);
		expect(first.renderer).not.toBeInstanceOf(NgtRenderer2);
		expect(first.renderer.data['__ngt_renderer__']).toBeUndefined();
		for (const probe of [first, second]) {
			const content = probe.host.querySelector('.probe');
			expect(content?.textContent).toBe('DOM content');
			expect([...probe.host.attributes].some(({ name }) => name.startsWith('_nghost-'))).toBe(true);
			expect(content && [...content.attributes].some(({ name }) => name.startsWith('_ngcontent-'))).toBe(true);
		}
	});

	it('relocates a custom NgtHTML host to its provided DOM parent and removes it independently', () => {
		const target = document.createElement('section');
		document.body.append(target);

		@Component({
			selector: 'app-relocated-html',
			template: `
				<span>relocated</span>
			`,
			providers: [provideHTMLDomElement(() => target)],
		})
		class RelocatedHtml extends NgtHTML {}

		@Component({
			template: `
				@if (visible()) {
					<app-relocated-html />
				}
			`,
			imports: [RelocatedHtml],
		})
		class SceneGraph {
			visible = signal(true);
		}

		const { fixture, sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const host = target.querySelector('app-relocated-html');
		expect(host?.textContent).toContain('relocated');

		sceneGraphComponentRef.instance.visible.set(false);
		fixture.detectChanges();
		expect(target.querySelector('app-relocated-html')).toBeNull();
		fixture.destroy();
		target.remove();
	});

	it('preserves one host-bound Angular renderer and ShadowRoot per NgtHTML view', () => {
		@Component({
			selector: 'app-shadow-html-probe',
			template: `
				<span>shadow content</span>
			`,
			encapsulation: ViewEncapsulation.ShadowDom,
		})
		class ShadowHtmlProbe extends NgtHTML {
			host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
			renderer = inject(Renderer2);
		}

		@Component({
			template: `
				<app-shadow-html-probe />
				<app-shadow-html-probe />
			`,
			imports: [ShadowHtmlProbe],
		})
		class SceneGraph {
			probes = viewChildren(ShadowHtmlProbe);
		}

		const { sceneGraphComponentRef } = NgtTestBed.create(SceneGraph);
		const [first, second] = sceneGraphComponentRef.instance.probes();

		expect(first.renderer).not.toBe(second.renderer);
		expect(first.renderer).not.toBeInstanceOf(NgtRenderer2);
		expect(second.renderer).not.toBeInstanceOf(NgtRenderer2);
		expect(first.host.shadowRoot?.textContent).toContain('shadow content');
		expect(second.host.shadowRoot?.textContent).toContain('shadow content');
		expect(first.host.shadowRoot).not.toBe(second.host.shadowRoot);
	});
});

describe('NgtRendererFactory2 contract', () => {
	function createFactory() {
		const delegate = new RecordingRendererFactory();
		const factory = TestBed.runInInjectionContext(() => new NgtRendererFactory2(delegate));
		return { delegate, factory };
	}

	function rendererType(id = 'test'): RendererType2 {
		return { id, encapsulation: ViewEncapsulation.None, styles: [], data: {} };
	}

	it('forwards render transaction hooks and completion', async () => {
		const { delegate, factory } = createFactory();

		factory.begin();
		factory.end();

		expect(delegate.begin).toHaveBeenCalledOnce();
		expect(delegate.end).toHaveBeenCalledOnce();
		expect(factory.whenRenderingDone()).toBe(delegate.done);
		await expect(factory.whenRenderingDone()).resolves.toBe('done');
	});

	it('creates independent per-host wrappers with stable delegate data', () => {
		const { delegate, factory } = createFactory();
		const firstHost = document.createElement('first-host');
		const secondHost = document.createElement('second-host');

		const first = factory.createRenderer(firstHost, rendererType()) as NgtRenderer2;
		const second = factory.createRenderer(secondHost, rendererType()) as NgtRenderer2;

		expect(first).not.toBe(second);
		expect(first.delegateRenderer).toBe(delegate.renderers[0]);
		expect(second.delegateRenderer).toBe(delegate.renderers[1]);
		expect(first.data).not.toBe(delegate.renderers[0].data);
		expect(first.data).toBe(first.data);
		expect(first.data['__ngt_renderer__']).toBe(true);
		expect(delegate.renderers[0].data['__ngt_renderer__']).toBeUndefined();

		const firstElement = document.createElement('div');
		const secondElement = document.createElement('div');
		first.addClass(firstElement as any, 'first');
		second.addClass(secondElement as any, 'second');
		expect(delegate.renderers[0].addClass).toHaveBeenCalledWith(firstElement, 'first');
		expect(delegate.renderers[1].addClass).toHaveBeenCalledWith(secondElement, 'second');
	});

	it('reuses the Three renderer when Angular reuses the delegate identity', () => {
		const sharedDelegate = new RecordingRenderer();
		const delegate = new RecordingRendererFactory(sharedDelegate);
		const factory = TestBed.runInInjectionContext(() => new NgtRendererFactory2(delegate));

		const first = factory.createRenderer(document.createElement('first-host'), rendererType());
		const second = factory.createRenderer(document.createElement('second-host'), rendererType());

		expect(first).toBe(second);
		expect(first).toBeInstanceOf(NgtRenderer2);
	});

	it('returns the delegate unchanged for an NgtHTML renderer type', () => {
		class HtmlView extends NgtHTML {}

		const sharedDelegate = new RecordingRenderer();
		const delegate = new RecordingRendererFactory(sharedDelegate);
		const factory = TestBed.runInInjectionContext(() => new NgtRendererFactory2(delegate));
		const type = { ...rendererType('html'), type: HtmlView } as RendererType2;

		const renderer = factory.createRenderer(document.createElement('html-host'), type);

		expect(renderer).toBe(sharedDelegate);
		expect(sharedDelegate.data['__ngt_renderer__']).toBeUndefined();
		expect(sharedDelegate.destroyNode).not.toHaveBeenCalled();
	});

	it('keeps text and portal hosts logical when their parent is a Three node', () => {
		const { delegate, factory } = createFactory();
		const renderer = factory.createRenderer(document.createElement('host'), rendererType()) as NgtRenderer2;
		const parent = renderer.createElement('ngt-group');
		const text = renderer.createText('logical text');
		const portal = renderer.createElement('ngt-portal');

		renderer.appendChild(parent, text);
		renderer.appendChild(parent, portal);
		renderer.removeChild(parent, portal);

		expect(delegate.renderers[0].appendChild).not.toHaveBeenCalled();
		expect(delegate.renderers[0].removeChild).not.toHaveBeenCalled();
	});

	it('delegates sibling lookup for an unattached platform renderer node', () => {
		const { delegate, factory } = createFactory();
		const renderer = factory.createRenderer(document.createElement('host'), rendererType()) as NgtRenderer2;
		const node = renderer.createElement('div');
		const sibling = document.createElement('span');
		delegate.renderers[0].nextSibling.mockReturnValue(sibling);

		expect(renderer.nextSibling(node)).toBe(sibling);
		expect(delegate.renderers[0].nextSibling).toHaveBeenCalledWith(node);
	});

	it('does not finalize a projected node owned by another live view', async () => {
		const { factory } = createFactory();
		const renderer = factory.createRenderer(document.createElement('host'), rendererType()) as NgtRenderer2;
		const receivingHost = createRendererNode('platform', document.createElement('receiving-host'), document);
		const declaringHost = createRendererNode('platform', document.createElement('declaring-host'), document);
		markRendererViewHost(receivingHost);
		markRendererViewHost(declaringHost);
		const receivingRoot = renderer.createElement('ngt-group') as Group;
		const projected = renderer.createElement('ngt-group') as Group;
		const receivingDispose = vi.fn();
		const projectedDispose = vi.fn();
		Object.assign(receivingRoot, { dispose: receivingDispose });
		Object.assign(projected, { dispose: projectedDispose });
		insertRendererChildNode(receivingHost, receivingRoot as never);
		insertRendererChildNode(declaringHost, projected as never);
		renderer.appendChild(receivingRoot as never, projected as never);

		renderer.destroyNode(receivingRoot as never);
		await Promise.resolve();
		expect(receivingDispose).toHaveBeenCalledOnce();
		expect(projectedDispose).not.toHaveBeenCalled();
		expect((projected as any).__ngt_renderer__[NgtRendererClassId.destroyed]).toBe(false);

		renderer.destroyNode(declaringHost);
		await Promise.resolve();
		expect(projectedDispose).toHaveBeenCalledOnce();
	});

	it('forwards complete delegated arguments and every per-view destroy call', () => {
		const { delegate, factory } = createFactory();
		const renderer = factory.createRenderer(document.createElement('host'), rendererType()) as NgtRenderer2;
		const recording = delegate.renderers[0];
		const parent = document.createElement('div');
		const child = document.createElement('span');
		const reference = document.createElement('i');
		const listener = vi.fn();
		const listenerOptions = { capture: true, once: true, passive: true };
		const delegatedPropertyTarget = document.createElement('input');
		const createdElement = renderer.createElement('div');

		renderer.insertBefore(parent as any, child as any, reference as any, true);
		renderer.removeChild(parent as any, child as any, true, true);
		renderer.selectRootElement(parent, true);
		renderer.setStyle(child as any, 'color', 'red', RendererStyleFlags2.Important);
		renderer.removeStyle(child as any, 'color', RendererStyleFlags2.DashCase);
		renderer.setProperty(delegatedPropertyTarget as any, 'value', 'delegated');
		renderer.listen(child as any, 'click', listener, listenerOptions);
		renderer.destroyNode(createdElement);
		renderer.destroy();
		renderer.destroy();

		expect(recording.insertBefore).toHaveBeenCalledWith(parent, child, reference, true);
		expect(recording.removeChild).toHaveBeenCalledWith(parent, child, true, true);
		expect(recording.selectRootElement).toHaveBeenCalledWith(parent, true);
		expect(recording.setStyle).toHaveBeenCalledWith(child, 'color', 'red', RendererStyleFlags2.Important);
		expect(recording.removeStyle).toHaveBeenCalledWith(child, 'color', RendererStyleFlags2.DashCase);
		expect(recording.setProperty).toHaveBeenCalledWith(delegatedPropertyTarget, 'value', 'delegated');
		expect(recording.listen).toHaveBeenCalledWith(child, 'click', listener, listenerOptions);
		expect(recording.destroyNode).toHaveBeenCalledWith(createdElement);
		expect(recording.destroy).toHaveBeenCalledTimes(2);
	});
});
