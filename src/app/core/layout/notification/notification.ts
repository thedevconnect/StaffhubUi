import { Component, signal, inject, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { PopoverModule, Popover } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primeng/accordion';
import { NotificationService, NotificationItem } from '../../../shared/services/notification.service';
import { AuthService } from '../../../shared/services/services/auth.service';
import { Subscription, timer } from 'rxjs';
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
  templateUrl: './notification.html',
  styleUrl: './notification.scss'
})
export class NotificationComponent implements OnInit, OnDestroy {
  @ViewChild('op') op!: Popover;

  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private routerSub?: Subscription;
  private pollSub?: Subscription;

  isHrView = signal<boolean>(false);
  categories = signal<NotificationCategory[]>([]);
  totalPending = signal<number>(0);

  // Animation signals & count change tracking state
  hasNewNotification = signal<boolean>(false);
  private isInitialLoad = true;
  private prevTotalCount: number | null = null;
  private animTimeout?: any;

  // Detailed items arrays
  missingSwipes = signal<NotificationItem[]>([]);
  pendingRequests = signal<NotificationItem[]>([]);
  pendingLeaves = signal<NotificationItem[]>([]);
  pendingTickets = signal<NotificationItem[]>([]);
  pendingAssets = signal<NotificationItem[]>([]);

  ngOnInit(): void {
    this.updatePortalViewMode();
    this.loadNotifications();

    // Poll for updated notification counts every 15 seconds
    this.pollSub = timer(15000, 15000).subscribe(() => {
      this.loadNotifications();
    });

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePortalViewMode();
      this.loadNotifications();
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.pollSub?.unsubscribe();
    if (this.animTimeout) {
      clearTimeout(this.animTimeout);
    }
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
          this.pendingAssets.set(res.data.pendingAssets || []);

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

          if (this.pendingAssets().length > 0) {
            newCategories.push({
              title: this.isHrView() ? 'Pending Asset Approvals' : 'My Asset Requests',
              count: this.pendingAssets().length
            });
          }

          this.categories.set(newCategories);

          const total = this.missingSwipes().length +
            this.pendingRequests().length +
            this.pendingLeaves().length +
            this.pendingTickets().length +
            this.pendingAssets().length;

          if (!this.isInitialLoad && this.prevTotalCount !== null && total > this.prevTotalCount) {
            this.triggerNotificationAnimation();
          }

          this.totalPending.set(total);
          this.prevTotalCount = total;
          this.isInitialLoad = false;
        }
      },
      error: (err: any) => console.error('Failed to load notifications:', err)
    });
  }

  public triggerNotificationAnimation(): void {
    if (this.animTimeout) {
      clearTimeout(this.animTimeout);
    }
    this.hasNewNotification.set(true);
    this.animTimeout = setTimeout(() => {
      this.hasNewNotification.set(false);
    }, 1200);
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
    } else if (title.includes('Asset')) {
      return this.pendingAssets();
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
      if (item.type?.includes('asset')) {
        this.router.navigate(['/hradmin/asset-approval']);
      } else if (item.type?.includes('leave')) {
        this.router.navigate(['/hradmin/leave-approval']);
      } else {
        this.router.navigate(['/hradmin/approval-attendance-regularization']);
      }
    } else {
      if (item.type?.includes('asset')) {
        this.router.navigate(['/ess/my-assets']);
      } else if (item.type?.includes('leave')) {
        this.router.navigate(['/ess/leave-application']);
      } else {
        const targetDate = item.date;
        if (targetDate) {
          this.router.navigate(['/ess/attendance-regularization'], { queryParams: { date: targetDate } });
        } else {
          this.router.navigate(['/ess/attendance-regularization']);
        }
      }
    }
  }

  onViewAllClick(): void {
    if (this.op) {
      this.op.hide();
    }
    if (this.isHrView()) {
      if (this.pendingAssets().length > 0 && this.pendingRequests().length === 0) {
        this.router.navigate(['/hradmin/asset-approval']);
      } else {
        this.router.navigate(['/hradmin/approval-attendance-regularization']);
      }
    } else {
      this.router.navigate(['/ess/attendance-regularization']);
    }
  }
}
