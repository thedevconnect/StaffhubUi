import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleActivityMaster } from './role-activity-master';

describe('RoleActivityMaster', () => {
  let component: RoleActivityMaster;
  let fixture: ComponentFixture<RoleActivityMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleActivityMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleActivityMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
