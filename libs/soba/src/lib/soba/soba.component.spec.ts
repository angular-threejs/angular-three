import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SobaComponent } from './soba.component';

describe('SobaComponent', () => {
    let component: SobaComponent;
    let fixture: ComponentFixture<SobaComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SobaComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SobaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
