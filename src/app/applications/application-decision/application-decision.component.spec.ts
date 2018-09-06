import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationDecisionComponent } from './application-decision.component';

describe('ApplicationDecisionComponent', () => {
  let component: ApplicationDecisionComponent;
  let fixture: ComponentFixture<ApplicationDecisionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApplicationDecisionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationDecisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
