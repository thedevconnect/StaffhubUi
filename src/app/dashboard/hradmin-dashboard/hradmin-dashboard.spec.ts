import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HradminDashboard } from './hradmin-dashboard';

describe('HradminDashboard', () => {
  let component: HradminDashboard;
  let fixture: ComponentFixture<HradminDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HradminDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HradminDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
