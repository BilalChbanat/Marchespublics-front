import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsComponentComponent } from './applications-component.component';

describe('ApplicationsComponentComponent', () => {
  let component: ApplicationsComponentComponent;
  let fixture: ComponentFixture<ApplicationsComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplicationsComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
