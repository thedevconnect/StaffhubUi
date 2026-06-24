import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleActivityMapping } from './role-activity-mapping';

describe('RoleActivityMapping', () => {
  let component: RoleActivityMapping;
  let fixture: ComponentFixture<RoleActivityMapping>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleActivityMapping]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleActivityMapping);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
