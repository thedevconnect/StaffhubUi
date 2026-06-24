import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityMaster } from './activity-master';

describe('ActivityMaster', () => {
  let component: ActivityMaster;
  let fixture: ComponentFixture<ActivityMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
