import { Component, signal, inject, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { PopoverModule, Popover } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primeng/accordion';
import { NotificationService, NotificationItem } from '../../../shared/services/notification.service';
import { AuthService } from '../../../shared/services/services/auth.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface NotificationCategory {
  title: string;
  count: number;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    CommonModule,
    OverlayBadgeModule,
    PopoverModule,
    ButtonModule,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent
  ],
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
        <div class="flex w-[360px] flex-col overflow-hidden rounded-lg bg-white shadow-xl">
          <!-- Header -->
          <div [ngClass]="isHrView() ? 'bg-indigo-600' : 'bg-blue-600'" class="p-4 text-white flex justify-between items-start">
            <div>
              <div class="flex items-center gap-2 font-semibold text-sm">
                <i class="pi pi-bell"></i>
                <span>{{ isHrView() ? 'HR Admin Notifications' : 'Employee Notifications' }}</span>
              </div>
              <div class="mt-1 text-xs opacity-90">{{ totalPending() }} pending action(s)</div>
            </div>
            <button class="flex h-6 w-6 items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition" (click)="op.hide()">
              <i class="pi pi-times text-xs"></i>
            </button>
          </div>

          <!-- Body with Accordion -->
          <div class="max-h-[400px] overflow-y-auto bg-slate-50 p-3">
            <div *ngIf="categories().length === 0" class="py-8 text-center text-slate-500 text-xs">
              <i class="pi pi-check-circle text-2xl text-emerald-500 mb-2"></i>
              <div>No pending notifications</div>
            </div>

            <p-accordion *ngIf="categories().length > 0" [multiple]="true" styleClass="flex flex-col gap-2">
              <p-accordion-panel *ngFor="let cat of categories(); let i = index" [value]="i.toString()">
                <p-accordion-header>
                  <div class="flex w-full items-center gap-3 py-1">
                    <div class="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold"
                      [ngClass]="isHrView() ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'">
                      <i [ngClass]="cat.title.includes('Leave') ? 'pi pi-calendar' : (cat.title.includes('Ticket') ? 'pi pi-ticket' : 'pi pi-user-edit')"></i>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-xs font-bold text-slate-800">{{ cat.title }}</span>
                      <span class="text-[11px] text-slate-500 font-medium">{{ cat.count }} item(s)</span>
                    </div>
                  </div>
                </p-accordion-header>
                <p-accordion-content>
                  <div class="flex flex-col">
                    <div *ngFor="let item of getItemsForCategory(cat.title)" 
                         (click)="onNotificationClick(item)"
                         class="p-3 text-xs text-slate-700 border-t border-slate-100 flex items-start gap-2.5 hover:bg-slate-100/70 transition cursor-pointer group">
                      <i class="pi pi-info-circle text-slate-400 mt-0.5 text-sm group-hover:text-blue-600 transition"></i>
                      <div class="flex-1">
                        <div class="font-bold text-slate-900 text-xs mb-0.5 flex items-center justify-between">
                          <span>{{ item.date || item.employeeName || 'Pending Action' }}</span>
                          <span class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
                            [ngClass]="isHrView() ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'">
                            View &rarr;
                          </span>
                        </div>
                        <div class="text-[11px] text-slate-600 leading-relaxed">{{ item.message }}</div>
                      </div>
                    </div>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>
            </p-accordion>
          </div>

          <!-- Footer -->
          <div class="border-t border-slate-100 p-3 bg-slate-50" *ngIf="categories().length > 0">
            <button (click)="onViewAllClick()" 
              [ngClass]="isHrView() ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'"
              class="w-full rounded-lg py-2.5 text-xs font-bold text-white transition flex justify-center items-center gap-2 shadow-xs">
              {{ isHrView() ? 'Go to Pending Approvals' : 'View All Regularizations' }}
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
      padding: 0.6rem 0.85rem !important;
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
export class NotificationComponent implements OnInit, OnDestroy {
  @ViewChild('op') op!: Popover;

  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private routerSub?: Subscription;

  isHrView = signal<boolean>(false);
  categories = signal<NotificationCategory[]>([]);
  totalPending = signal<number>(0);
  
  // Detailed items arrays
  missingSwipes = signal<NotificationItem[]>([]);
  pendingRequests = signal<NotificationItem[]>([]);
  pendingLeaves = signal<NotificationItem[]>([]);
  pendingTickets = signal<NotificationItem[]>([]);

  ngOnInit(): void {
    this.updatePortalViewMode();
    this.loadNotifications();

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePortalViewMode();
      this.loadNotifications();
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private updatePortalViewMode(): void {
    const currentUrl = this.router.url || '';
    if (currentUrl.includes('/hradmin')) {
      this.isHrView.set(true);
    } else if (currentUrl.includes('/ess')) {
      this.isHrView.set(false);
    } else {
      const selectedRole = (this.authService.selectedRoleId() || '').toUpperCase();
      const isHr = selectedRole.includes('HR_ADMIN') || selectedRole.includes('ADMIN') || selectedRole.includes('SUPER_ADMIN');
      this.isHrView.set(isHr);
    }
  }

  loadNotifications(): void {
    const portal = this.isHrView() ? 'hradmin' : 'ess';
    this.notificationService.getNotifications(portal).subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          this.missingSwipes.set(res.data.missingSwipes || []);
          this.pendingRequests.set(res.data.pendingRequests || []);
          this.pendingLeaves.set(res.data.pendingLeaves || []);
          this.pendingTickets.set(res.data.pendingTickets || []);
          
          const newCategories: NotificationCategory[] = [];
          
          if (this.missingSwipes().length > 0) {
            newCategories.push({
              title: 'Missing Swipes',
              count: this.missingSwipes().length
            });
          }
          
          if (this.pendingRequests().length > 0) {
            newCategories.push({
              title: this.isHrView() ? 'Pending Regularizations' : 'My Regularizations',
              count: this.pendingRequests().length
            });
          }

          if (this.pendingLeaves().length > 0) {
            newCategories.push({
              title: this.isHrView() ? 'Pending Leave Applications' : 'My Leave Applications',
              count: this.pendingLeaves().length
            });
          }

          if (this.pendingTickets().length > 0) {
            newCategories.push({
              title: 'Pending Helpdesk Tickets',
              count: this.pendingTickets().length
            });
          }
          
          this.categories.set(newCategories);
          
          const total = this.missingSwipes().length + 
                        this.pendingRequests().length + 
                        this.pendingLeaves().length + 
                        this.pendingTickets().length;
          this.totalPending.set(total);
        }
      },
      error: (err: any) => console.error('Failed to load notifications:', err)
    });
  }

  getItemsForCategory(title: string): NotificationItem[] {
    if (title === 'Missing Swipes') {
      return this.missingSwipes();
    } else if (title.includes('Regularization')) {
      return this.pendingRequests();
    } else if (title.includes('Leave')) {
      return this.pendingLeaves();
    } else if (title.includes('Ticket')) {
      return this.pendingTickets();
    }
    return [];
  }

  onNotificationClick(item: NotificationItem): void {
    if (this.op) {
      this.op.hide();
    }

    if (item.targetUrl) {
      if (item.date && item.targetUrl.includes('attendance-regularization')) {
        this.router.navigate([item.targetUrl], { queryParams: { date: item.date } });
      } else {
        this.router.navigate([item.targetUrl]);
      }
      return;
    }

    if (this.isHrView()) {
      this.router.navigate(['/hradmin/approval-attendance-regularization']);
    } else {
      const targetDate = item.date;
      if (targetDate) {
        this.router.navigate(['/ess/attendance-regularization'], { queryParams: { date: targetDate } });
      } else {
        this.router.navigate(['/ess/attendance-regularization']);
      }
    }
  }

  onViewAllClick(): void {
    if (this.op) {
      this.op.hide();
    }
    if (this.isHrView()) {
      this.router.navigate(['/hradmin/approval-attendance-regularization']);
    } else {
      this.router.navigate(['/ess/attendance-regularization']);
    }
  }
}
