import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { PermissionAction, PermissionService } from '../services/permission.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class PermissionDirective {
  private readonly permissionService = inject(PermissionService);
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);

  private entityCode = '';
  private action: PermissionAction = 'View';
  private hasView = false;

  @Input() set hasPermission(val: string | { code: string; action?: PermissionAction }) {
    if (typeof val === 'string') {
      this.entityCode = val;
    } else if (val && typeof val === 'object') {
      this.entityCode = val.code;
      if (val.action) this.action = val.action;
    }
    this.updateView();
  }

  @Input() set hasPermissionAction(action: PermissionAction) {
    this.action = action;
    this.updateView();
  }

  constructor() {
    effect(() => {
      // Re-evaluate when permissions map changes
      this.permissionService.permissionsMap();
      this.updateView();
    });
  }

  private updateView(): void {
    const isAllowed = this.permissionService.hasPermission(this.entityCode, this.action);

    if (isAllowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isAllowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
