import { Injectable, signal } from '@angular/core';

export type PermissionAction =
  | 'View'
  | 'Create'
  | 'Add'
  | 'Edit'
  | 'Delete'
  | 'Approve'
  | 'Reject'
  | 'Export'
  | 'Import';

export interface ActivityPermission {
  activityId?: number;
  activityName?: string;
  formValue?: string;
  callingPage?: string;
  permissions?: {
    canView?: boolean;
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canApprove?: boolean;
    canReject?: boolean;
    canExport?: boolean;
    canImport?: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  readonly permissionsMap = signal<Map<string, Record<string, boolean>>>(new Map());
  readonly isSuperAdmin = signal<boolean>(false);

  setPermissions(items: any[], isSuperAdmin = false): void {
    this.isSuperAdmin.set(isSuperAdmin);
    const map = new Map<string, Record<string, boolean>>();

    const processItem = (item: any) => {
      const key = item.formValue || item.callingPage || item.activityName || item.activityId || item.menuCode || item.routePath;
      if (key && item.permissions) {
        map.set(String(key).toUpperCase(), {
          View: Boolean(item.permissions.canView ?? true),
          Create: Boolean(item.permissions.canAdd ?? true),
          Add: Boolean(item.permissions.canAdd ?? true),
          Edit: Boolean(item.permissions.canEdit ?? true),
          Delete: Boolean(item.permissions.canDelete ?? true),
          Approve: Boolean(item.permissions.canApprove ?? true),
          Reject: Boolean(item.permissions.canReject ?? true),
          Export: Boolean(item.permissions.canExport ?? true),
          Import: Boolean(item.permissions.canImport ?? true),
        });
      }

      if (Array.isArray(item.children)) {
        item.children.forEach(processItem);
      }
      if (Array.isArray(item.menus)) {
        item.menus.forEach(processItem);
      }
      if (Array.isArray(item.subMenus)) {
        item.subMenus.forEach(processItem);
      }
    };

    items.forEach(processItem);
    this.permissionsMap.set(map);
  }

  hasPermission(entityOrActivityCode: string, action: PermissionAction = 'View'): boolean {
    if (this.isSuperAdmin()) return true;
    if (!entityOrActivityCode) return true;

    const map = this.permissionsMap();
    const key = String(entityOrActivityCode).toUpperCase();
    const entityPerms = map.get(key);

    if (!entityPerms) return true; // Default fallback to allow view if unmapped

    const actKey = action === 'Add' ? 'Create' : action;
    return Boolean(entityPerms[actKey]);
  }
}
