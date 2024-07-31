import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgtArgs } from 'angular-three';

describe('args', () => {
	it('should not render if first item is null', () => {
		const fixture = createTestFixture(`<div *args="[null]"></div>`);
		fixture.detectChanges();

		expect(fixture.debugElement.queryAll(By.css('div')).length).toEqual(0);
	});

	it('should not render if args is null', () => {
		const fixture = createTestFixture(`<div *args="null"></div>`);
		fixture.detectChanges();

		expect(fixture.debugElement.queryAll(By.css('div')).length).toEqual(0);
	});

	it('should not render if args is not an array', () => {
		const fixture = createTestFixture(`<div *args="1"></div>`);
		fixture.detectChanges();

		expect(fixture.debugElement.queryAll(By.css('div')).length).toEqual(0);
	});

	it('should render if args is validated', () => {
		const fixture = createTestFixture(`<div *args="[1, 2, 3]"></div>`);
		fixture.detectChanges();

		expect(fixture.debugElement.queryAll(By.css('div')).length).toEqual(1);
	});

	it('should only able to access value once ', () => {
		const fixture = createTestFixture(`<div *args="[1, 2, 3]"></div>`);
		fixture.detectChanges();

		expect(fixture.debugElement.queryAll(By.css('div')).length).toEqual(1);
		const args = fixture.componentInstance.args();
		expect(args!.value).toEqual([1, 2, 3]);
		expect(args!.value).toEqual(null);
	});
});

@Component({
	standalone: true,
	template: '',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Test {
	args = viewChild(NgtArgs);
}

function createTestFixture(template: string) {
	return TestBed.overrideComponent(Test, { set: { template } }).createComponent(Test);
}
