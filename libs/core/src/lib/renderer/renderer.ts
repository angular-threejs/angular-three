import { DOCUMENT } from '@angular/common';
import {
	DebugNode,
	inject,
	Injectable,
	makeEnvironmentProviders,
	Renderer2,
	RendererFactory2,
	RendererStyleFlags2,
	RendererType2,
	Type,
} from '@angular/core';
import { ɵDomRendererFactory2 as DomRendererFactory2 } from '@angular/platform-browser';
import { NgtArgs } from '../directives/args';
import { NgtParent } from '../directives/parent';
import { getInstanceState, prepare } from '../instance';
import { NGT_STORE } from '../store';
import { NgtAnyRecord, NgtConstructorRepresentation, NgtInstanceState, NgtState } from '../types';
import { applyProps } from '../utils/apply-props';
import { is } from '../utils/is';
import { SignalState } from '../utils/signal-state';
import { injectCatalogue } from './catalogue';
import {
	CANVAS_CONTENT_FLAG,
	NGT_RENDERER_NODE_FLAG,
	SPECIAL_INTERNAL_ADD_COMMENT_FLAG,
	SPECIAL_INTERNAL_SET_PARENT_COMMENT_FLAG,
} from './constants';
import {
	addRendererChildNode,
	createRendererNode,
	isRendererNode,
	NgtRendererNode,
	setRendererParentNode,
} from './state';
import { attachThreeNodes, kebabToPascal, NgtRendererClassId } from './utils';

@Injectable()
export class NgtRendererFactory2 implements RendererFactory2 {
	private catalogue = injectCatalogue();
	private document = inject(DOCUMENT);
	private rendererMap = new Map<string, Renderer2>();

	/**
	 * NOTE: We use `useFactory` to instantiate `NgtRendererFactory2`
	 */
	constructor(private delegateRendererFactory: RendererFactory2) {}

	createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
		const delegateRenderer = this.delegateRendererFactory.createRenderer(hostElement, type);

		console.log('createRenderer', hostElement, type);

		if (!type) return delegateRenderer;

		let renderer = this.rendererMap.get(type.id);

		if (!renderer) {
			const debugNode = hostElement ? new DebugNode(hostElement) : null;
			const store = debugNode?.injector?.get(NGT_STORE, null, { optional: true }) || null;

			// NOTE: if we have a store but hostElement isn't a renderer node,
			// this means the element was created in a context outside of NgtCanvas
			// but is _embedded_ in the NgtCanvas context later on via ng-template
			// we'll make the hostElement a RendererNode here
			if (store && hostElement && !(NGT_RENDERER_NODE_FLAG in hostElement)) {
				createRendererNode('platform', store, hostElement, this.document);
			}

			renderer = new NgtRenderer2(delegateRenderer, this.catalogue, this.document, store, hostElement);
		}

		console.log('created renderer', renderer, hostElement, type);

		return renderer;
	}
}

export class NgtRenderer2 implements Renderer2 {
	private argsCommentNodes: Array<NgtRendererNode> = [];
	private parentCommentNodes: Array<NgtRendererNode> = [];

	constructor(
		private delagateRenderer: Renderer2,
		private catalogue: Record<string, NgtConstructorRepresentation>,
		private document: Document,
		private store: SignalState<NgtState> | null,
		private hostElement: HTMLElement | null,
	) {}

	get data(): { [key: string]: any } {
		return {
			...this.delagateRenderer.data,
			__ngt_renderer__: true,
		};
	}

	destroy(): void {
		throw new Error('Method not implemented.');
	}

	createElement(name: string, namespace?: string | null) {
		console.log('createElement', name, namespace);

		const platformElement = this.delagateRenderer.createElement(name, namespace);

		if (!this.store) return platformElement;

		const [injectedArgs, injectedParent] = [
			this.getNgtDirective(NgtArgs, this.argsCommentNodes)?.value || [],
			this.getNgtDirective(NgtParent, this.parentCommentNodes)?.value,
		];

		const threeName = kebabToPascal(name.startsWith('ngt-') ? name.slice(4) : name);
		const threeTarget = this.catalogue[threeName];

		if (threeTarget) {
			const threeInstance = prepare(new threeTarget(...injectedArgs), this.store, name);
			const rendererNode = createRendererNode('three', this.store, threeInstance, this.document);
			const instanceState = getInstanceState(threeInstance) as NgtInstanceState;

			// auto-attach for geometry and material
			if (is.geometry(threeInstance)) {
				instanceState.attach = ['geometry'];
			} else if (is.material(threeInstance)) {
				instanceState.attach = ['material'];
			}

			if (injectedParent) {
				rendererNode.__ngt_renderer__[NgtRendererClassId.parent] = injectedParent as unknown as NgtRendererNode;
			}

			return rendererNode;
		}

		return createRendererNode('platform', this.store, platformElement, this.document);
	}

	createComment(value: string) {
		const commentNode = this.delagateRenderer.createComment(value);
		if (!this.store) return commentNode;

		const commentRendererNode = createRendererNode('comment', this.store, commentNode, this.document);

		// NOTE: we attach an arrow function to the Comment node
		//  In our directives, we can call this function to then start tracking the RendererNode
		//  this is done to limit the amount of Nodes we need to process for getCreationState
		commentRendererNode[SPECIAL_INTERNAL_ADD_COMMENT_FLAG] = (node: NgtAnyRecord | 'args' | 'parent') => {
			if (node === 'args') {
				this.argsCommentNodes.push(commentRendererNode);
			} else if (node === 'parent') {
				commentRendererNode[SPECIAL_INTERNAL_SET_PARENT_COMMENT_FLAG] = (ngtParent: NgtRendererNode) => {
					this.parentCommentNodes.push(commentRendererNode);
					commentRendererNode.__ngt_renderer__[NgtRendererClassId.parent] = ngtParent;
				};
			} else if (typeof node === 'object') {
				// this.portalCommentsNodes.push(node);
			}
		};

		return commentRendererNode;
	}

	createText(value: string) {
		console.log('createText', value);
		return this.delagateRenderer.createText(value);
	}

	destroyNode: ((node: any) => void) | null = (node) => {
		console.log('destroyNode', node);
	};

	appendChild(parent: any, newChild: any): void {
		if (!this.store) return this.delagateRenderer.appendChild(parent, newChild);

		const pRS = (parent as NgtRendererNode).__ngt_renderer__;
		const cRS = (newChild as NgtRendererNode).__ngt_renderer__;

		if (!pRS) {
			console.log('case pRS undefined', { parent, newChild, cRS });
		}

		if (!cRS) {
			console.log('case cRS undefined', { parent, newChild, pRS });
		}

		console.log('true appendChlid', { parent, newChild, pRS, cRS });

		//  if the child is a comment, we'll set the parent then bail
		if (cRS?.[NgtRendererClassId.type] === 'comment') {
			setRendererParentNode(newChild, parent);
			return;
		}

		if (cRS?.[NgtRendererClassId.type] === 'three') {
			//  if child is three and parent is platform
			if (pRS?.[NgtRendererClassId.type] === 'platform') {
				// first check if there's a parent on the parent
				const grandParent = pRS[NgtRendererClassId.parent];
				// if there is, we'll recurse with the grandparent
				if (grandParent) {
					return this.appendChild(grandParent, newChild);
				}

				// if not, then we'll set the relationship between these two for later stages
				this.setNodeRelationship(parent, newChild);
				return;
			}

			// if child is three and parent is also three, straight-forward case
			if (pRS?.[NgtRendererClassId.type] === 'three') {
				return this.appendThreeRendererNodes(parent, newChild);
			}
		}

		if (pRS?.[NgtRendererClassId.type] === 'three') {
			// if parent is three and child is platform
			if (cRS?.[NgtRendererClassId.type] === 'platform') {
				if (!cRS[NgtRendererClassId.parent] || cRS[NgtRendererClassId.parent] !== parent) {
					setRendererParentNode(newChild, parent);
				}

				for (const rendererChildNode of cRS[NgtRendererClassId.children]) {
					this.appendChild(parent, rendererChildNode);
				}

				return;
			}

			// if parent is three and child is also three, straight-forward case
			if (cRS?.[NgtRendererClassId.type] === 'three') {
				return this.appendThreeRendererNodes(parent, newChild);
			}
		}

		return this.delagateRenderer.appendChild(parent, newChild);
	}

	insertBefore(parent: any, newChild: any, refChild: any, isMove?: boolean): void {
		console.log('insertBefore', { parent, newChild, refChild, isMove, renderer: this });

		// if both are comments and the reference child is NgtCanvasContent, we'll assign the same flag to the newChild
		// this means that the NgtCanvas component is embedding. This flag allows the Renderer to get the root scene
		// when it tries to attach the template under `ng-template[canvasContent]`
		if (refChild && refChild[CANVAS_CONTENT_FLAG] && refChild instanceof Comment && newChild instanceof Comment) {
			Object.assign(newChild, { [CANVAS_CONTENT_FLAG]: true });
		}

		// if there is no parent, we delegate
		if (!parent) {
			return this.delagateRenderer.insertBefore(parent, newChild, refChild, isMove);
		}

		if (this.store || NGT_RENDERER_NODE_FLAG in parent || (newChild && NGT_RENDERER_NODE_FLAG in newChild)) {
			return this.appendChild(parent, newChild);
		}

		return this.delagateRenderer.insertBefore(parent, newChild, refChild, isMove);
	}

	removeChild(parent: any, oldChild: any, isHostElement?: boolean): void {
		console.log('removeChild', parent, oldChild, isHostElement);
		return this.delagateRenderer.removeChild(parent, oldChild, isHostElement);
	}

	selectRootElement(selectorOrNode: string | any, preserveContent?: boolean) {
		console.log('selectRootElement', selectorOrNode, preserveContent);
		return this.delagateRenderer.selectRootElement(selectorOrNode, preserveContent);
	}

	parentNode(node: any) {
		console.log('parentNode', node, this);

		// NOTE: if we don't have both the store and the node is not a renderer node, delegate
		if (!this.store && !(NGT_RENDERER_NODE_FLAG in node)) {
			return this.delagateRenderer.parentNode(node);
		}

		if (node && node[CANVAS_CONTENT_FLAG] && node instanceof Comment && isRendererNode(node)) {
			const store = node.__ngt_renderer__[NgtRendererClassId.store];

			// NOTE: if the current renderer instance does not have a store but the comment
			// has it. we assign the store to the renderer instance
			if (!this.store) {
				this.store = store;
			}

			const rootScene = store.snapshot.scene;

			if (!(NGT_RENDERER_NODE_FLAG in rootScene)) {
				createRendererNode('three', store, rootScene, this.document);
			}

			return rootScene;
		}

		if (isRendererNode(node)) {
			return node.__ngt_renderer__[NgtRendererClassId.parent];
		}

		return this.delagateRenderer.parentNode(node);
	}

	nextSibling(node: any) {
		console.log('nextSibling', node);
		return this.delagateRenderer.nextSibling(node);
	}

	setAttribute(el: any, name: string, value: string, namespace?: string | null): void {
		if (!this.store) return this.delagateRenderer.setAttribute(el, name, value, namespace);

		console.log('true setAttribute', el, name, value, namespace);
		const rS = (el as NgtRendererNode).__ngt_renderer__;
		if (!rS || rS[NgtRendererClassId.destroyed]) {
			console.log('case setAttribute but renderer state is undefined or destroyed', { el, name, value });
			return;
		}

		if (rS[NgtRendererClassId.type] === 'three') {
			if (name === 'attach') {
				const paths = value.split('.');
				if (paths.length) {
					const instanceState = getInstanceState(el);
					if (instanceState) instanceState.attach = paths;
				}
			} else {
				// coercion for primitive values
				let maybeCoerced: string | number | boolean = value;

				if (maybeCoerced === '' || maybeCoerced === 'true' || maybeCoerced === 'false') {
					maybeCoerced = maybeCoerced === 'true' || maybeCoerced === '';
				} else {
					const maybeNumber = Number(maybeCoerced);
					if (!isNaN(maybeNumber)) maybeCoerced = maybeNumber;
				}

				if (name === 'rawValue') {
					rS[NgtRendererClassId.rawValue] = maybeCoerced;
				} else {
					applyProps(el, { [name]: maybeCoerced });
				}
			}

			return;
		}

		return this.delagateRenderer.setAttribute(el, name, value, namespace);
	}

	removeAttribute(el: any, name: string, namespace?: string | null): void {
		console.log('removeAttribute', el, name, namespace);
		return this.delagateRenderer.removeAttribute(el, name, namespace);
	}

	addClass(el: any, name: string): void {
		console.log('addClass', el, name);
		return this.delagateRenderer.addClass(el, name);
	}

	removeClass(el: any, name: string): void {
		console.log('removeClass', el, name);
		return this.delagateRenderer.removeClass(el, name);
	}

	setStyle(el: any, style: string, value: any, flags?: RendererStyleFlags2): void {
		console.log('setStyle', el, style, value, flags);
		return this.delagateRenderer.setStyle(el, style, value, flags);
	}

	removeStyle(el: any, style: string, flags?: RendererStyleFlags2): void {
		console.log('removeStyle', el, style, flags);
		return this.delagateRenderer.removeStyle(el, style, flags);
	}

	setProperty(el: any, name: string, value: any): void {
		if (!this.store) return this.delagateRenderer.setProperty(el, name, value);

		console.log('setProperty', el, name, value);

		const rS = (el as NgtRendererNode).__ngt_renderer__;
		if (!rS || rS[NgtRendererClassId.destroyed]) {
			console.log('case setProperty but renderer state is undefined or destroyed', { el, name, value });
			return;
		}

		if (rS[NgtRendererClassId.type] === 'three') {
			const instanceState = getInstanceState(el);

			if (name === 'parameters') {
				// NOTE: short-cut for null raycast to prevent upstream from creating a nullRaycast property
				if ('raycast' in value && value['raycast'] === null) {
					value['raycast'] = () => null;
				}

				applyProps(el, value);

				if ('geometry' in value && value['geometry'].isBufferGeometry) {
					instanceState?.updateGeometryStamp();
				}

				return;
			}

			const parent = instanceState?.hierarchyStore.snapshot.parent || rS[NgtRendererClassId.parent];

			// [rawValue]
			if (instanceState?.type === 'ngt-value' && name === 'rawValue') {
				rS[NgtRendererClassId.rawValue] = value;
				if (parent) this.appendChild(parent, el);
				return;
			}

			// [attach]
			if (name === 'attach') {
				if (instanceState)
					instanceState.attach = Array.isArray(value)
						? value.map((v) => v.toString())
						: typeof value === 'function'
							? value
							: typeof value === 'string'
								? value.split('.')
								: [value];
				if (parent) this.appendChild(parent, el);
				return;
			}

			// NOTE: short-cut for null raycast to prevent upstream from creating a nullRaycast property
			if (name === 'raycast' && value === null) {
				value = () => null;
			}

			applyProps(el, { [name]: value });

			if (name === 'geometry' && value.isBufferGeometry) {
				instanceState?.updateGeometryStamp();
			}

			return;
		}

		return this.delagateRenderer.setProperty(el, name, value);
	}

	setValue(node: any, value: string): void {
		console.log('setValue', node, value);
		return this.delagateRenderer.setValue(node, value);
	}

	listen(
		target: 'window' | 'document' | 'body' | any,
		eventName: string,
		callback: (event: any) => boolean | void,
	): () => void {
		console.log('listen', target, eventName, callback);
		return this.delagateRenderer.listen(target, eventName, callback);
	}

	private appendThreeRendererNodes(parent: any, child: any) {
		// if parent and chlid are the same, skip
		if (parent === child) {
			console.log('case three renderer node but parent and child are the same', { parent, child });
			return;
		}

		const cIS = getInstanceState(child);

		// if child is already attached to a parent, skip
		if (cIS?.hierarchyStore.snapshot.parent) {
			console.log('case three renderer node but child already attached', { parent, child });
			return;
		}

		// set the relationship
		this.setNodeRelationship(parent, child);

		// attach THREE child
		attachThreeNodes(parent, child);
		return;
	}

	private setNodeRelationship(parent: any, child: any) {
		setRendererParentNode(child, parent);
		addRendererChildNode(parent, child);
	}

	private getNgtDirective<TDirective>(directive: Type<TDirective>, commentNodes: Array<NgtRendererNode>) {
		let directiveInstance: TDirective | undefined;

		const destroyed = [];

		let i = commentNodes.length - 1;
		while (i >= 0) {
			const comment = commentNodes[i];
			if (comment.__ngt_renderer__[NgtRendererClassId.destroyed]) {
				destroyed.push(i);
				i--;
				continue;
			}
			const injector = comment.__ngt_renderer__[NgtRendererClassId.debugNodeFactory]?.()?.injector;
			if (!injector) {
				i--;
				continue;
			}
			const instance = injector.get(directive, null);
			if (
				instance &&
				typeof instance === 'object' &&
				'validate' in instance &&
				typeof instance.validate === 'function' &&
				instance.validate()
			) {
				directiveInstance = instance;
				break;
			}
			i--;
		}
		destroyed.forEach((index) => {
			commentNodes.splice(index, 1);
		});
		return directiveInstance;
	}
}

export function provideNgtRenderer() {
	return makeEnvironmentProviders([
		{
			provide: RendererFactory2,
			useFactory: (domRendererFactory: RendererFactory2) => new NgtRendererFactory2(domRendererFactory),
			deps: [DomRendererFactory2],
		},
	]);
}
