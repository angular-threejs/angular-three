import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RapierComponent } from './rapier.component';

describe('RapierComponent', () => {
	let component: RapierComponent;
	let fixture: ComponentFixture<RapierComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RapierComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(RapierComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
