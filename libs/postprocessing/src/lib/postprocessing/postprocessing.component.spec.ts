import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostprocessingComponent } from './postprocessing.component';

describe('PostprocessingComponent', () => {
    let component: PostprocessingComponent;
    let fixture: ComponentFixture<PostprocessingComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PostprocessingComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PostprocessingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
