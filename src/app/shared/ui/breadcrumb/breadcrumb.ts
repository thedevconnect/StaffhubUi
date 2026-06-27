import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, Breadcrumb],
  template: `
    <div class="-mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-4 overflow-x-auto overflow-y-hidden" style="scrollbar-width: none;">
      <p-breadcrumb [model]="items"
        styleClass="!border-0 !border-b !border-slate-200 !rounded-none !bg-white !px-4 md:!px-6 !py-2.5 text-xs md:text-sm !w-max !min-w-full"></p-breadcrumb>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppBreadcrumb {
  @Input() items: any[] = [];
}
