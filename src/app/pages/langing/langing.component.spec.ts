import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LangingComponent } from './langing.component';

describe('LangingComponent', () => {
  let component: LangingComponent;
  let fixture: ComponentFixture<LangingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LangingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LangingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
