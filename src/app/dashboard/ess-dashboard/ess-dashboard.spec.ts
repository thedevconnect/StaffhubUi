import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EssDashboard } from './ess-dashboard';

describe('EssDashboard', () => {
  let component: EssDashboard;
  let fixture: ComponentFixture<EssDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EssDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EssDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
