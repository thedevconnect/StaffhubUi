import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalAttendanceRegularization } from './approval-attendance-regularization';

describe('ApprovalAttendanceRegularization', () => {
  let component: ApprovalAttendanceRegularization;
  let fixture: ComponentFixture<ApprovalAttendanceRegularization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalAttendanceRegularization]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovalAttendanceRegularization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
