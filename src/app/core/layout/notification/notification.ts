import { Component, signal, inject, ViewChild, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { PopoverModule, Popover } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primeng/accordion';
import { NotificationService, NotificationItem } from '../../../shared/services/notification.service';
import { AuthService } from '../../../shared/services/services/auth.service';
import { SocketService } from '../../../shared/services/socket.service';
import { UserService } from '../../../shared/services/user-service';
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
  templateUrl: './notification.html',
  styleUrl: './notification.scss'
})
export class NotificationComponent implements OnInit, OnDestroy {
  @ViewChild('op') op!: Popover;

  private readonly notificationService = inject(NotificationService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private routerSub?: Subscription;
  private pollSub?: Subscription;
  private socketSub?: Subscription;
  private attendanceSocketSub?: Subscription;
  private refreshSub?: Subscription;

  isSuperAdminView = signal<boolean>(false);
  isHrView = signal<boolean>(false);
  categories = signal<NotificationCategory[]>([]);
  totalPending = signal<number>(0);

  // Animation signals & count change tracking state
  hasNewNotification = signal<boolean>(false);
  private isInitialLoad = true;
  private prevTotalCount: number | null = null;
  private animTimeout?: any;

  // Detailed items arrays
  pendingCompanies = signal<NotificationItem[]>([]);
  missingSwipes = signal<NotificationItem[]>([]);
  pendingRequests = signal<NotificationItem[]>([]);
  pendingLeaves = signal<NotificationItem[]>([]);
  pendingTickets = signal<NotificationItem[]>([]);
  pendingAssets = signal<NotificationItem[]>([]);

  ngOnInit(): void {
    this.updatePortalViewMode();
    this.loadNotifications(true);

    // Connect to WebSocket room for real-time instant notification updates (100% event-driven, zero polling)
    const user = this.authService.user();
    const companyId = user?.companyId || user?.company_id || 1;
    this.socketService.connect(companyId);

    this.socketSub = this.socketService.onNotificationUpdated().subscribe(() => {
      this.loadNotifications(true);
    });

    this.attendanceSocketSub = this.socketService.onAttendanceUpdated().subscribe(() => {
      this.loadNotifications(true);
    });

    this.refreshSub = this.notificationService.refresh$.subscribe(() => {
      this.loadNotifications(true);
    });

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePortalViewMode();
      this.loadNotifications(true);
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.socketSub?.unsubscribe();
    this.attendanceSocketSub?.unsubscribe();
    this.refreshSub?.unsubscribe();
    if (this.animTimeout) {
      clearTimeout(this.animTimeout);
    }
  }

  private updatePortalViewMode(): void {
    const currentUrl = this.router.url || '';
    if (currentUrl.includes('/superadmin')) {
      this.isSuperAdminView.set(true);
      this.isHrView.set(false);
    } else if (currentUrl.includes('/hradmin')) {
      this.isSuperAdminView.set(false);
      this.isHrView.set(true);
    } else if (currentUrl.includes('/ess')) {
      this.isSuperAdminView.set(false);
      this.isHrView.set(false);
    } else {
      const selectedRole = (this.authService.selectedRoleId() || '').toUpperCase();
      const userRole = (this.authService.user()?.role || '').toUpperCase();
      if (selectedRole.includes('SUPER_ADMIN') || userRole.includes('SUPER_ADMIN') || selectedRole.includes('SUPERADMIN')) {
        this.isSuperAdminView.set(true);
        this.isHrView.set(false);
      } else {
        const isHr = selectedRole.includes('HR_ADMIN') || selectedRole.includes('ADMIN');
        this.isSuperAdminView.set(false);
        this.isHrView.set(isHr);
      }
    }
  }

  loadNotifications(force = false): void {
    if (this.isSuperAdminView()) {
      this.userService.getPendingCompanies().subscribe({
        next: (res: any) => {
          const rawCompanies = res?.data || [];
          const pendingCompanies: NotificationItem[] = rawCompanies.map((c: any) => ({
            id: c.id,
            type: 'company_approval',
            date: c.company_name || c.name || 'Company Registration',
            reason: c.admin_name ? `Admin: ${c.admin_name} (${c.admin_email || ''})` : (c.company_email || ''),
            message: `Company registration pending approval: ${c.company_name || c.name}`,
            targetUrl: '/superadmin/company-management'
          }));

          this.pendingCompanies.set(pendingCompanies);
          this.missingSwipes.set([]);
          this.pendingRequests.set([]);
          this.pendingLeaves.set([]);
          this.pendingTickets.set([]);
          this.pendingAssets.set([]);

          const newCategories: NotificationCategory[] = [];
          if (pendingCompanies.length > 0) {
            newCategories.push({
              title: 'Pending Company Approvals',
              count: pendingCompanies.length
            });
          }

          this.categories.set(newCategories);
          const total = pendingCompanies.length;

          if (!this.isInitialLoad && this.prevTotalCount !== null && total > this.prevTotalCount) {
            this.triggerNotificationAnimation();
          }

          this.totalPending.set(total);
          this.prevTotalCount = total;
          this.isInitialLoad = false;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error('Failed to load pending companies for superadmin:', err);
          this.cdr.markForCheck();
        }
      });
      return;
    }

    const portal = this.isHrView() ? 'hradmin' : 'ess';
    this.notificationService.getNotifications(portal).subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          this.pendingCompanies.set([]);

          let rawMissingSwipes = res.data.missingSwipes || [];
          let rawRequests = res.data.pendingRequests || [];

          // Filter notifications by employee joining date for ESS view
          if (!this.isHrView()) {
            const joiningStr = localStorage.getItem('joiningDate');
            if (joiningStr) {
              const joiningDate = new Date(joiningStr);
              joiningDate.setHours(0, 0, 0, 0);

              rawMissingSwipes = rawMissingSwipes.filter((item: any) => {
                const itemDateStr = item.date || item.attendance_date;
                if (!itemDateStr) return true;
                const itemDate = new Date(itemDateStr);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate >= joiningDate;
              });

              rawRequests = rawRequests.filter((item: any) => {
                const itemDateStr = item.date || item.attendance_date;
                if (!itemDateStr) return true;
                const itemDate = new Date(itemDateStr);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate >= joiningDate;
              });
            }
          }

          this.missingSwipes.set(rawMissingSwipes);
          this.pendingRequests.set(rawRequests);
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
          this.cdr.markForCheck();
        }
      },
      error: (err: any) => {
        console.error('Failed to load notifications:', err);
        this.cdr.markForCheck();
      }
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
    if (title.includes('Company')) {
      return this.pendingCompanies();
    } else if (title === 'Missing Swipes') {
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

    if (this.isSuperAdminView() || item.type === 'company_approval') {
      this.router.navigate(['/superadmin/company-management']);
      return;
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

    if (this.isSuperAdminView()) {
      this.router.navigate(['/superadmin/company-management']);
      return;
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
