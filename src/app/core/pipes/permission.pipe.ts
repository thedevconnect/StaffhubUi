import { Pipe, PipeTransform, inject } from '@angular/core';
import { PermissionAction, PermissionService } from '../services/permission.service';

@Pipe({
  name: 'hasPermission',
  standalone: true,
  pure: false
})
export class PermissionPipe implements PipeTransform {
  private readonly permissionService = inject(PermissionService);

  transform(entityCode: string, action: PermissionAction = 'View'): boolean {
    return this.permissionService.hasPermission(entityCode, action);
  }
}
