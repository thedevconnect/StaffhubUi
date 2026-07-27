import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionAction, PermissionService } from '../services/permission.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  const permission = route.data?.['permission'] as string;
  const action = (route.data?.['action'] as PermissionAction) || 'View';

  if (!permission) return true;

  const hasAccess = permissionService.hasPermission(permission, action);
  if (!hasAccess) {
    router.navigate(['/landing']);
    return false;
  }

  return true;
};
