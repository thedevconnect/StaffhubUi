import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinner } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../shared/services/user-service';

@Component({
  selector: 'app-role-activity-mapping',
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    ToastModule,
    ProgressSpinner
  ],
  providers: [MessageService],
  templateUrl: './role-activity-mapping.html',
  styleUrl: './role-activity-mapping.scss'
})
export class RoleActivityMapping implements OnInit {
  roles: any[] = [];
  selectedRoleId: number | null = null;
  permissionsData: any[] = [];
  isLoading: boolean = false;
  isSaving: boolean = false;

  constructor(
    private userService: UserService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.fetchRoles();
  }

  fetchRoles() {
    this.userService.getActiveRoles().subscribe({
      next: (res: any) => {
        this.roles = res.data || [];
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load roles' });
      }
    });
  }

  onRoleChange() {
    if (!this.selectedRoleId) {
      this.permissionsData = [];
      return;
    }
    this.isLoading = true;
    this.userService.getPermissions(this.selectedRoleId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.data && res.data.permissions) {
          // Convert 1/0 to true/false for checkboxes
          this.permissionsData = res.data.permissions.map((menu: any) => {
            menu.activities = menu.activities.map((act: any) => ({
              ...act,
              can_view: act.can_view === 1 || act.can_view === true,
              can_add: act.can_add === 1 || act.can_add === true,
              can_edit: act.can_edit === 1 || act.can_edit === true,
              can_delete: act.can_delete === 1 || act.can_delete === true
            }));
            return menu;
          });
        } else {
          this.permissionsData = [];
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load permissions' });
      }
    });
  }

  savePermissions() {
    if (!this.selectedRoleId) return;
    
    this.isSaving = true;
    const flatPermissions: any[] = [];

    this.permissionsData.forEach(menu => {
      menu.activities.forEach((act: any) => {
        flatPermissions.push({
          activityId: act.activityId,
          can_view: act.can_view ? 1 : 0,
          can_add: act.can_add ? 1 : 0,
          can_edit: act.can_edit ? 1 : 0,
          can_delete: act.can_delete ? 1 : 0,
        });
      });
    });

    const payload = {
      roleId: this.selectedRoleId,
      permissions: flatPermissions
    };

    this.userService.saveBulkPermissions(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Permissions saved successfully' });
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save permissions' });
      }
    });
  }
}
