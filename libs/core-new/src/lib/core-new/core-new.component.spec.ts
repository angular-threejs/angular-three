import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoreNewComponent } from './core-new.component';

describe('CoreNewComponent', () => {
	let component: CoreNewComponent;
	let fixture: ComponentFixture<CoreNewComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [CoreNewComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(CoreNewComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
