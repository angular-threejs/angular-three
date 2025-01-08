import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	signal,
	viewChild,
} from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Object3D } from 'three';
import { NgtParent } from './parent';

describe('parent', () => {
	it('should not render if value parent that is not resolved', () => {
		const fixture = createTestFixture(`<div *parent="null"></div>`);
		fixture.detectChanges();
		expect(fixture.debugElement.queryAll(By.css('div')).length).toEqual(0);
	});

	it('should not render with signal parent that is not resolved', () => {
		const fixture = createTestFixture(`<div *parent="nullParent"></div>`);
		fixture.detectChanges();
		expect(fixture.debugElement.queryAll(By.css('div')).length).toEqual(0);
	});

	it('should render with element ref parent', () => {
		const fixture = createTestFixture(`
<div #parent></div>
<div *parent="parent"></div>
`);
		fixture.detectChanges();

		expect(fixture.debugElement.queryAll(By.css('div')).length).toEqual(2);
	});

	it('should render with signal element ref parent', () => {
		const fixture = createTestFixture(`
<div #parent></div>
<div *parent="parentRef"></div>
`);
		fixture.detectChanges();

		expect(fixture.debugElement.queryAll(By.css('div')).length).toEqual(2);
	});

	it('should render with signal parent that resolves later', fakeAsync(() => {
		const fixture = createTestFixture(`<div *parent="signalParent"></div>`);
		fixture.detectChanges();

		tick(101);
		fixture.detectChanges();

		expect(fixture.debugElement.queryAll(By.css('div')).length).toEqual(1);
	}));

	it('should only able to access value once ', () => {
		const fixture = createTestFixture(`
<div #parent></div>
<div *parent="parentRef"></div>
`);
		fixture.detectChanges();

		expect(fixture.debugElement.queryAll(By.css('div')).length).toEqual(2);
		const parent = fixture.componentInstance.parent();
		expect(parent?.value).toEqual(fixture.componentInstance.parentRef());
		expect(parent?.value).toEqual(null);
	});
});

@Component({
	template: '',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtParent],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Test {
	parent = viewChild(NgtParent);
	parentRef = viewChild<ElementRef<Object3D>>('parent');

	nullParent = () => null;
	signalParent = signal<Object3D | null>(null);

	constructor() {
		effect(() => {
			setTimeout(() => {
				this.signalParent.set(new Object3D());
			}, 100);
		});
	}
}

function createTestFixture(template: string) {
	return TestBed.overrideComponent(Test, { set: { template } }).createComponent(Test);
}
