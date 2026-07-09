import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primeng/accordion';
import { NotificationService } from '../../../shared/services/notification.service';

interface NotificationCategory {
  title: string;
  count: number;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, OverlayBadgeModule,
    PopoverModule, ButtonModule, Accordion, AccordionPanel, AccordionHeader, AccordionContent],
  template: `
    <div class="flex items-center">
      <button
        type="button"
        class="relative flex items-center justify-center rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        (click)="op.toggle($event)"
      >
        <p-overlayBadge [value]="totalPending().toString()" severity="danger" size="small">
          <i class="pi pi-bell text-xl"></i>
        </p-overlayBadge>
      </button>

      <p-popover #op>
        <div class="flex w-[350px] flex-col overflow-hidden rounded-lg bg-white shadow-xl">
          <!-- Header -->
          <div class="bg-blue-600 p-4 text-white flex justify-between items-start">
            <div>
              <div class="flex items-center gap-2 font-semibold">
                <i class="pi pi-bell"></i>
                <span>Notifications</span>
              </div>
              <div class="mt-1 text-xs text-blue-100">{{ totalPending() }} pending</div>
            </div>
            <button class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 hover:bg-blue-800 transition" (click)="op.hide()">
              <i class="pi pi-times text-xs"></i>
            </button>
          </div>

          <!-- Body with Accordion -->
          <div class="max-h-[400px] overflow-y-auto bg-slate-50 p-3">
            <p-accordion [multiple]="true" styleClass="flex flex-col gap-2">
              <p-accordion-panel *ngFor="let cat of categories(); let i = index" [value]="i.toString()">
                <p-accordion-header>
                  <div class="flex w-full items-center gap-3 py-1">
                    <div class="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                      <i class="pi pi-list"></i>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-medium text-slate-800">{{ cat.title }}</span>
                      <span class="text-xs text-slate-500">{{ cat.count }} items</span>
                    </div>
                  </div>
                </p-accordion-header>
                <p-accordion-content>
                  <div class="flex flex-col">
                    <div *ngFor="let item of getItemsForCategory(cat.title)" class="p-3 text-sm text-slate-600 border-t border-slate-100 flex items-start gap-2 hover:bg-slate-50 transition">
                      <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                      <span>{{ item.message }}</span>
                    </div>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>
            </p-accordion>
          </div>

          <!-- Footer -->
          <div class="border-t border-slate-100 p-3 bg-slate-50">
            <button class="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 flex justify-center items-center gap-2 shadow-sm">
              View All Notifications
              <i class="pi pi-arrow-right text-xs"></i>
            </button>
          </div>
        </div>
      </p-popover>
    </div>
  `,
  styles: [`
    :host ::ng-deep .p-popover {
      padding: 0 !important;
      border-radius: 0.5rem;
      border: none;
    }
    :host ::ng-deep .p-popover-content {
      padding: 0;
    }
    :host ::ng-deep .p-accordion-header-link {
      background: white !important;
      border-radius: 0.5rem !important;
      border: 1px solid #f1f5f9 !important;
      padding: 0.75rem 1rem !important;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
    }
    :host ::ng-deep .p-accordion-tab {
      margin-bottom: 0.5rem;
    }
    :host ::ng-deep .p-accordion-tab-active .p-accordion-header-link {
      border-bottom-left-radius: 0 !important;
      border-bottom-right-radius: 0 !important;
    }
    :host ::ng-deep .p-accordion-content {
      background: white;
      border: 1px solid #e2e8f0;
      border-top: none;
      border-bottom-left-radius: 0.5rem;
      border-bottom-right-radius: 0.5rem;
      padding: 0;
    }
  `]
})
export class NotificationComponent {
  private notificationService = inject(NotificationService);

  categories = signal<NotificationCategory[]>([]);
  totalPending = signal<number>(0);
  
  // Store detailed lists
  missingSwipes = signal<any[]>([]);
  pendingRequests = signal<any[]>([]);

  constructor() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.missingSwipes.set(res.data.missingSwipes || []);
          this.pendingRequests.set(res.data.pendingRequests || []);
          
          const newCategories: NotificationCategory[] = [];
          
          if (this.missingSwipes().length > 0) {
            newCategories.push({
              title: 'Missing Swipes',
              count: this.missingSwipes().length
            });
          }
          
          if (this.pendingRequests().length > 0) {
            newCategories.push({
              title: 'Pending Regularizations',
              count: this.pendingRequests().length
            });
          }
          
          this.categories.set(newCategories);
          
          const total = this.missingSwipes().length + this.pendingRequests().length;
          this.totalPending.set(total);
        }
      },
      error: (err: any) => console.error('Failed to load notifications:', err)
    });
  }

  getItemsForCategory(title: string): any[] {
    if (title === 'Missing Swipes') {
      return this.missingSwipes();
    } else if (title === 'Pending Regularizations') {
      return this.pendingRequests();
    }
    return [];
  }
}
