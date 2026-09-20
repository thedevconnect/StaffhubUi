import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TableColumn, TableTemplate } from '../../shared/ui/table-template/table-template';
import { AttendanceService } from '../../shared/services/attendance.service';
import { LeaveService } from '../../shared/services/leave.service';
import { forkJoin, Subscription } from 'rxjs';
import { SocketService } from '../../shared/services/socket.service';
import { AuthService } from '../../shared/services/services/auth.service';
import { EmployeeManagementService } from '../../shared/services/employee-management.service';
import { CelebrationFeedItem } from '../ess-dashboard/ess-dashboard';

interface AttendanceCard {
  label: string;
  count: number;
  icon: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  category: string;
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
  strokeDashArray: string;
  strokeDashOffset: number;
}

interface StackedBarData {
  day: string;
  onTime: number;
  late: number;
  total: number;
}

interface PendingRequestItem {
  id: string;
  employeeName: string;
  type: string;
  details: string;
  date: string;
  status: string;
}

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    BreadcrumbModule,
    ButtonModule,
    DatePickerModule,
    ConfirmDialogModule,
    DialogModule,
    TableTemplate
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './hr-dashboard.html',
  styleUrl: './hr-dashboard.scss',
})
export class HrDashboard implements OnInit, OnDestroy {
  // Navigation tabs: 'dashboard' | 'pendency' | 'feed'
  activeTab: 'dashboard' | 'pendency' | 'feed' = 'dashboard';

  // Date Filter
  selectedDate: Date = new Date();
  formattedSelectedDate: string = this.formatDate(new Date());

  get isTodaySelected(): boolean {
    const todayStr = this.formatDate(new Date());
    return this.formattedSelectedDate === todayStr;
  }

  formatDate(d: Date): string {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onDateChange(): void {
    if (!this.selectedDate) {
      this.selectedDate = new Date();
    }
    this.formattedSelectedDate = this.formatDate(new Date(this.selectedDate));
    this.loadDashboardSummary(this.formattedSelectedDate);
  }

  previousDay(): void {
    const current = this.selectedDate ? new Date(this.selectedDate) : new Date();
    current.setDate(current.getDate() - 1);
    this.selectedDate = current;
    this.onDateChange();
  }

  nextDay(): void {
    const current = this.selectedDate ? new Date(this.selectedDate) : new Date();
    current.setDate(current.getDate() + 1);
    this.selectedDate = current;
    this.onDateChange();
  }

  resetToToday(): void {
    this.selectedDate = new Date();
    this.formattedSelectedDate = this.formatDate(this.selectedDate);
    this.loadDashboardSummary(this.formattedSelectedDate);
  }

  constructor(private router: Router) { }

  // Total headcount in statistics
  totalEmployees = 0;

  breadcrumbItems: MenuItem[] = [{ label: 'HR Dashboard' }];
  isLoading = false;

  // KPI cards
  attendanceCards: AttendanceCard[] = [
    {
      label: '(On Time / Late) Swipe In',
      count: 0,
      icon: 'pi-check-circle',
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-100 hover:border-emerald-300',
      category: 'swipe_in'
    },
    {
      label: 'Not Swipe In',
      count: 0,
      icon: 'pi-exclamation-triangle',
      colorClass: 'text-rose-600',
      bgClass: 'bg-rose-50',
      borderClass: 'border-rose-100 hover:border-rose-300',
      category: 'not_swipe_in'
    },
    {
      label: 'On Leave',
      count: 0,
      icon: 'pi-calendar',
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-100 hover:border-blue-300',
      category: 'on_leave'
    },
    {
      label: 'OD',
      count: 0,
      icon: 'pi-briefcase',
      colorClass: 'text-amber-700',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-100 hover:border-amber-300',
      category: 'od'
    },
    {
      label: 'Short Leave',
      count: 0,
      icon: 'pi-clock',
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-50',
      borderClass: 'border-purple-100 hover:border-purple-300',
      category: 'short_leave'
    },
    {
      label: 'Swipe Out',
      count: 0,
      icon: 'pi-sign-out',
      colorClass: 'text-orange-600',
      bgClass: 'bg-orange-50',
      borderClass: 'border-orange-100 hover:border-orange-300',
      category: 'swipe_out'
    },
  ];

  // Raw statistics for the donut chart
  donutRawData = [
    { label: 'Swipe In', value: 0, color: '#10b981' },
    { label: 'Not Swipe In', value: 0, color: '#f43f5e' },
    { label: 'OD', value: 0, color: '#b45309' },
    { label: 'On Leave', value: 0, color: '#3b82f6' },
    { label: 'Short Leave', value: 0, color: '#a855f7' },
    { label: 'Swipe Out', value: 0, color: '#f97316' },
  ];

  donutSegments: DonutSegment[] = [];

  // Stacked Bar Chart data
  barChartData: StackedBarData[] = [];

  maxBarValue = 120; // Y-axis max value

  // Source distribution
  sources = [
    { label: 'Desktop Swipe In', count: 0, percentage: 0, color: 'bg-slate-400', category: 'desktop_swipe_in' },
    { label: 'Mobile Swipe In', count: 0, percentage: 0, color: 'bg-blue-600', category: 'mobile_swipe_in' },
    { label: 'AI Swipe In', count: 0, percentage: 0, color: 'bg-indigo-600', category: 'ai_swipe_in' },
  ];

  // Exceptions list
  exceptions = [
    { label: 'Late Coming  ', count: 0, severity: 'danger', icon: 'pi-clock' },
    { label: 'Early Logout ', count: 0, severity: 'warning', icon: 'pi-sign-out' },
  ];

  // Pendency numbers
  pendingCounts = {
    regularization: 0,
    leave: 0,
    attendance: 0,
    expense: 0,
    gatepass: 0,
    total: 0
  };

  activePendencyTab: string = 'All';
  pendencyTabs = [
    { label: 'Pending', value: 'Pending', icon: 'pi pi-clock' },
    { label: 'Processed', value: 'Processed', icon: 'pi pi-check-circle' },
    { label: 'All', value: 'All', icon: 'pi pi-list' }
  ];

  // Detailed requests (for Pendency Tab)
  allPendencyRequests: (PendingRequestItem & { raw?: any })[] = [];

  get filteredPendencyRequests() {
    return this.allPendencyRequests.filter(req => {
      if (this.activePendencyTab === 'All') return true;
      const isPending = req.status === 'Pending Approval' || req.status === 'PENDING' || req.status === 'Pending';
      if (this.activePendencyTab === 'Pending') {
        return isPending;
      } else {
        return !isPending;
      }
    });
  }

  onPendencyTabChange(tab: string) {
    this.activePendencyTab = tab;
    this.cdr.markForCheck();
  }

  attendanceService = inject(AttendanceService);
  leaveService = inject(LeaveService);
  messageService = inject(MessageService);
  cdr = inject(ChangeDetectorRef);
  socketService = inject(SocketService);
  authService = inject(AuthService);
  employeeManagementService = inject(EmployeeManagementService);

  // Celebration My Feed State
  activeFeedFilter: 'all' | 'anniversary' | 'birthday' | 'newhire' = 'all';
  activeFeedView: 'all' | 'today' | 'upcoming' = 'all';
  celebrationFeeds: CelebrationFeedItem[] = [];
  loadingFeeds = false;

  showCelebrationModal = false;
  celebrationModalData: {
    name: string;
    isBirthday: boolean;
    isAnniversary: boolean;
    isNewHire?: boolean;
    years?: number;
    profilePicture?: string | null;
  } | null = null;
  userCelebrationInfo: {
    name: string;
    isBirthday: boolean;
    isAnniversary: boolean;
    isNewHire?: boolean;
    years?: number;
    profilePicture?: string | null;
  } | null = null;
  userCelebrationDismissed = false;
  toastWishMessage: string | null = null;

  get todayCelebrationsCount(): number {
    return this.celebrationFeeds.filter(i => i.isToday).length;
  }

  get upcomingCelebrationsCount(): number {
    return this.celebrationFeeds.filter(i => !i.isToday).length;
  }

  get filteredCelebrationFeeds(): CelebrationFeedItem[] {
    return this.celebrationFeeds.filter(item => {
      if (this.activeFeedFilter !== 'all' && item.type !== this.activeFeedFilter) return false;
      if (this.activeFeedView === 'today' && !item.isToday) return false;
      if (this.activeFeedView === 'upcoming' && item.isToday) return false;
      return true;
    });
  }

  socketSubscription?: Subscription;

  isDetailsModalVisible = false;
  detailsCategoryLabel = '';
  detailsTableData: any[] = [];
  isLoadingDetails = false;

  detailsColumns: TableColumn[] = [
    { key: 'employee_code', header: 'Employee Code' },
    { key: 'employee_name', header: 'Employee Name' },
    { key: 'swipe_in', header: 'Swipe In', pipe: 'date', pipeArgs: 'mediumTime' },
    { key: 'swipe_out', header: 'Swipe Out', pipe: 'date', pipeArgs: 'mediumTime' },
    { key: 'total_time', header: 'Total Time', formatter: (val: any) => (val !== null && val !== undefined) ? (Number(val) >= 60 ? Math.floor(Number(val) / 60) + 'h ' + (Number(val) % 60) + 'm' : Number(val) + 'm') : '-' },
    { key: 'late_coming', header: 'Late Coming' },
    { key: 'early_going', header: 'Early Going' },
    { key: 'swipe_in_device', header: 'Swipe In Device' },
    { key: 'swipe_out_device', header: 'Swipe Out Device' },
    { key: 'department', header: 'Department' },
    { key: 'designation', header: 'Designation' },
    { key: 'location_address', header: 'Location / Status' },
  ];

  pendingRequestColumns: TableColumn[] = [
    { key: 'actions', header: 'Actions' },
    { key: 'id', header: 'Request ID', isSortable: true },
    { key: 'employeeName', header: 'Employee Name', isSortable: true },
    { key: 'employeeCode', header: 'Employee Code', isSortable: true },
    { key: 'type', header: 'Request Type' },
    { key: 'details', header: 'Description / Details' },
    { key: 'date', header: 'Requested Date', isSortable: true },
    { key: 'status', header: 'Status' },
  ];

  ngOnInit(): void {
    this.loadPendencyData();
    this.loadDashboardSummary(this.formattedSelectedDate);
    this.loadCelebrationFeeds();

    const user = this.authService.user();
    if (user?.companyId) {
      this.socketService.connect(user.companyId);
      this.socketSubscription = this.socketService.onAttendanceUpdated().subscribe(() => {
        this.loadDashboardSummary(this.formattedSelectedDate);
        this.loadPendencyData();

        if (this.isDetailsModalVisible && this.detailsCategoryLabel) {
          const matchingCard = this.attendanceCards.find(c => c.label === this.detailsCategoryLabel);
          if (matchingCard) {
            this.attendanceService.getHRDashboardDetails(matchingCard.category, this.formattedSelectedDate).subscribe(res => {
              this.detailsTableData = res.data || [];
              this.cdr.detectChanges();
            });
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
    this.socketService.disconnect();
  }

  onRefresh(): void {
    this.isLoading = true;
    this.loadDashboardSummary(this.formattedSelectedDate);
    this.loadPendencyData();

    setTimeout(() => {
      this.isLoading = false;
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Dashboard synchronized successfully' });
    }, 600);
  }

  onCardClick(card: AttendanceCard): void {
    if (card.count === 0) {
      this.messageService.add({ severity: 'info', summary: 'Info', detail: `No records found for ${card.label} on ${this.formattedSelectedDate}.` });
      return;
    }

    this.detailsCategoryLabel = card.label;
    this.isDetailsModalVisible = true;
    this.isLoadingDetails = true;
    this.detailsTableData = [];

    this.attendanceService.getHRDashboardDetails(card.category, this.formattedSelectedDate).subscribe({
      next: (res) => {
        this.detailsTableData = res.data || [];
        this.isLoadingDetails = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching details:', err);
        this.isLoadingDetails = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch details.' });
        this.cdr.detectChanges();
      }
    });
  }

  onSourceClick(source: any): void {
    if (source.count === 0) {
      this.messageService.add({ severity: 'info', summary: 'Info', detail: `No records found for ${source.label} on ${this.formattedSelectedDate}.` });
      return;
    }

    this.detailsCategoryLabel = source.label;
    this.isDetailsModalVisible = true;
    this.isLoadingDetails = true;
    this.detailsTableData = [];

    this.attendanceService.getHRDashboardDetails(source.category, this.formattedSelectedDate).subscribe({
      next: (res) => {
        this.detailsTableData = res.data || [];
        this.isLoadingDetails = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching details:', err);
        this.isLoadingDetails = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch details.' });
        this.cdr.detectChanges();
      }
    });
  }

  onExceptionClick(ex: any): void {
    if (ex.count === 0) {
      this.messageService.add({ severity: 'info', summary: 'Info', detail: `No records found for ${ex.label} on ${this.formattedSelectedDate}.` });
      return;
    }

    this.detailsCategoryLabel = ex.label;
    this.isDetailsModalVisible = true;
    this.isLoadingDetails = true;
    this.detailsTableData = [];

    this.attendanceService.getHRDashboardDetails('swipe_in', this.formattedSelectedDate).subscribe({
      next: (res) => {
        const data = res.data || [];
        if (ex.label.includes('Late')) {
          this.detailsTableData = data.filter((r: any) => r.late_coming === 'Yes');
        } else {
          this.detailsTableData = data.filter((r: any) => r.early_going === 'Yes');
        }
        this.isLoadingDetails = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingDetails = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch details.' });
        this.cdr.detectChanges();
      }
    });
  }

  calculateDonutSegments(): void {
    const total = this.totalEmployees || 1;
    let currentOffset = 0;
    const circumference = 314.16;

    this.donutSegments = this.donutRawData.map((item) => {
      const percentage = item.value / total;
      const strokeLength = percentage * circumference;
      const strokeOffset = circumference - strokeLength + currentOffset;
      currentOffset -= strokeLength;

      return {
        label: item.label,
        value: item.value,
        color: item.color,
        strokeDashArray: `${strokeLength} ${circumference - strokeLength}`,
        strokeDashOffset: strokeOffset,
      };
    });
  }



  loadDashboardSummary(dateStr?: string): void {
    const targetDate = dateStr || this.formattedSelectedDate;
    this.attendanceService.getHRDashboardSummary(targetDate).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const s = res.data;
          this.totalEmployees = s.totalEmployees;

          this.attendanceCards = [
            {
              label: '(On Time / Late) Swipe In',
              count: s.swipeInCount || 0,
              icon: 'pi-check-circle',
              colorClass: 'text-emerald-600',
              bgClass: 'bg-emerald-50',
              borderClass: 'border-emerald-100 hover:border-emerald-300',
              category: 'swipe_in'
            },
            {
              label: 'Not Swipe In',
              count: Math.max(0, s.totalEmployees - (s.swipeInCount || 0) - (s.onLeaveCount || 0)),
              icon: 'pi-exclamation-triangle',
              colorClass: 'text-rose-600',
              bgClass: 'bg-rose-50',
              borderClass: 'border-rose-100 hover:border-rose-300',
              category: 'not_swipe_in'
            },
            {
              label: 'On Leave',
              count: s.onLeaveCount || 0,
              icon: 'pi-calendar',
              colorClass: 'text-blue-600',
              bgClass: 'bg-blue-50',
              borderClass: 'border-blue-100 hover:border-blue-300',
              category: 'on_leave'
            },
            {
              label: 'OD',
              count: s.odCount || 0,
              icon: 'pi-briefcase',
              colorClass: 'text-amber-700',
              bgClass: 'bg-amber-50',
              borderClass: 'border-amber-100 hover:border-amber-300',
              category: 'od'
            },
            {
              label: 'Short Leave',
              count: s.shortLeaveCount || 0,
              icon: 'pi-clock',
              colorClass: 'text-purple-600',
              bgClass: 'bg-purple-50',
              borderClass: 'border-purple-100 hover:border-purple-300',
              category: 'short_leave'
            },
            {
              label: 'Swipe Out',
              count: s.swipeOutCount || 0,
              icon: 'pi-sign-out',
              colorClass: 'text-orange-600',
              bgClass: 'bg-orange-50',
              borderClass: 'border-orange-100 hover:border-orange-300',
              category: 'swipe_out'
            },
          ];

          // Update Donut Chart
          this.donutRawData = [
            { label: 'Swipe In', value: s.swipeInCount || 0, color: '#10b981' },
            { label: 'Not Swipe In', value: Math.max(0, s.totalEmployees - (s.swipeInCount || 0) - (s.onLeaveCount || 0)), color: '#f43f5e' },
            { label: 'OD', value: s.odCount || 0, color: '#b45309' },
            { label: 'On Leave', value: s.onLeaveCount || 0, color: '#3b82f6' },
            { label: 'Short Leave', value: s.shortLeaveCount || 0, color: '#a855f7' },
            { label: 'Swipe Out', value: s.swipeOutCount || 0, color: '#f97316' },
          ];
          this.calculateDonutSegments();

          // Update Stacked Bar Chart
          if (s.barChartData && s.barChartData.length > 0) {
            this.barChartData = s.barChartData.map((d: any) => ({
              day: d.day,
              onTime: d.onTime || 0,
              late: d.late || 0,
              total: d.total || 0
            }));
            const maxVal = Math.max(...s.barChartData.map((d: any) => d.total || 0));
            this.maxBarValue = maxVal > 0 ? maxVal + 20 : 120;
          }

          // Update Sources
          const aiCount = s.aiCount || 0;
          const totalSwipes = s.mobileCount + s.desktopCount + aiCount;
          this.sources = [
            { label: 'Desktop Swipe In', count: s.desktopCount, percentage: totalSwipes > 0 ? Math.round((s.desktopCount / totalSwipes) * 100) : 0, color: 'bg-slate-400', category: 'desktop_swipe_in' },
            { label: 'Mobile Swipe In', count: s.mobileCount, percentage: totalSwipes > 0 ? Math.round((s.mobileCount / totalSwipes) * 100) : 0, color: 'bg-blue-600', category: 'mobile_swipe_in' },
            { label: 'AI Swipe In', count: aiCount, percentage: totalSwipes > 0 ? Math.round((aiCount / totalSwipes) * 100) : 0, color: 'bg-indigo-600', category: 'ai_swipe_in' },
          ];

          // Update Exceptions
          this.exceptions = [
            { label: 'Late Coming (10:00 AM)', count: s.lateComingCount, severity: 'danger', icon: 'pi-clock' },
            { label: 'Early Logout (07:00 PM)', count: s.earlyOutCount, severity: 'warning', icon: 'pi-sign-out' },
          ];

          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching dashboard summary:', err);
      }
    });
  }

  setActiveTab(tab: 'dashboard' | 'pendency' | 'feed'): void {
    this.activeTab = tab;
    if (tab === 'pendency') {
      this.loadPendencyData();
    } else if (tab === 'feed') {
      this.loadCelebrationFeeds();
    }
  }

  loadPendencyData(): void {
    forkJoin({
      regularizations: this.attendanceService.getCompanyRegularizations(1, 100, 'All'),
      leaves: this.leaveService.getLeaves()
    }).subscribe({
      next: (res: any) => {
        const mappedRegs = (res.regularizations?.data || []).map((item: any) => ({
          id: `REG-${item.id}`,
          employeeName: item.employeeName || item.employee_name || 'Employee',
          employeeCode: item.employeeCode || item.employee_code || item.emp_code || `EMP-${item.employee_id || ''}`,
          type: 'Regularization',
          details: `${item.correctionType || 'Attendance Correction'}: ${item.reason || ''}`,
          date: item.created_at || item.attendanceDate,
          status: item.status === 'Pending' ? 'Pending Approval' : item.status,
          raw: item
        }));

        const mappedLeaves = (res.leaves?.data || [])
          .map((item: any) => ({
            id: `LEV-${item.id}`,
            employeeName: item.employee_name || item.employeeName || 'Employee',
            employeeCode: item.employee_code || item.employeeCode || item.emp_code || `EMP-${item.employee_id || ''}`,
            type: 'Leave',
            details: `${item.leave_type || 'Leave'} (${item.session || 'Full Day'}) - ${item.reason || 'No reason provided'}`,
            date: item.created_at || (item.start_date === item.end_date ? item.start_date : `${item.start_date} to ${item.end_date}`),
            status: (item.status === 'PENDING' || item.status === 'Pending') ? 'Pending Approval' : item.status,
            raw: item
          }));

        this.allPendencyRequests = [...mappedRegs, ...mappedLeaves];

        const pendingRegs = mappedRegs.filter((r: any) => r.status === 'Pending Approval');
        const pendingLeaves = mappedLeaves.filter((r: any) => r.status === 'Pending Approval');

        this.pendingCounts.regularization = pendingRegs.length;
        this.pendingCounts.leave = pendingLeaves.length;
        this.pendingCounts.total = pendingRegs.length + pendingLeaves.length;

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching pendency data:', err);
      }
    });
  }

  approveRequest(requestId: string): void {
    const item = this.allPendencyRequests.find(r => r.id === requestId);
    if (!item) return;

    if (requestId.startsWith('REG-')) {
      const rawId = requestId.substring(4);
      this.attendanceService.updateRegularizationStatus(rawId, 'Approved' as any, 'Approved via HR Dashboard').subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Approved',
            detail: 'Regularization request approved successfully.'
          });
          this.loadPendencyData();
          this.loadDashboardSummary(this.formattedSelectedDate);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Failed to approve regularization request.'
          });
        }
      });
    } else if (requestId.startsWith('LEV-')) {
      const rawId = requestId.substring(4);
      const raw = item.raw;
      this.leaveService.updateLeave(rawId, {
        leaveType: raw.leave_type,
        startDate: raw.start_date,
        endDate: raw.end_date,
        reason: raw.reason,
        status: 'APPROVED'
      }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Approved',
            detail: 'Leave request approved successfully.'
          });
          this.loadPendencyData();
          this.loadDashboardSummary(this.formattedSelectedDate);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Failed to approve leave request.'
          });
        }
      });
    }
  }

  rejectRequest(requestId: string): void {
    const item = this.allPendencyRequests.find(r => r.id === requestId);
    if (!item) return;

    if (requestId.startsWith('REG-')) {
      const rawId = requestId.substring(4);
      this.attendanceService.updateRegularizationStatus(rawId, 'Rejected' as any, 'Rejected via HR Dashboard').subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Rejected',
            detail: 'Regularization request rejected.'
          });
          this.loadPendencyData();
          this.loadDashboardSummary(this.formattedSelectedDate);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Failed to reject regularization request.'
          });
        }
      });
    } else if (requestId.startsWith('LEV-')) {
      const rawId = requestId.substring(4);
      const raw = item.raw;
      this.leaveService.updateLeave(rawId, {
        leaveType: raw.leave_type,
        startDate: raw.start_date,
        endDate: raw.end_date,
        reason: raw.reason,
        status: 'REJECTED'
      }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Rejected',
            detail: 'Leave request rejected.'
          });
          this.loadPendencyData();
          this.loadDashboardSummary(this.formattedSelectedDate);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Failed to reject leave request.'
          });
        }
      });
    }
  }

  navigateToLeaveApproval(): void {
    this.router.navigate(['/hradmin/leave-approval']);
  }

  loadCelebrationFeeds(): void {
    this.loadingFeeds = true;
    this.employeeManagementService.getEmployees().subscribe({
      next: (employees) => {
        this.processCelebrationData(employees || []);
        this.loadingFeeds = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingFeeds = false;
        this.cdr.detectChanges();
      }
    });
  }

  private parseDateParts(val: any): { year: number; month: number; day: number } | null {
    if (!val) return null;
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return null;
      return { year: val.getFullYear(), month: val.getMonth(), day: val.getDate() };
    }
    const s = String(val).trim();
    const mIso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (mIso) {
      return {
        year: parseInt(mIso[1], 10),
        month: parseInt(mIso[2], 10) - 1,
        day: parseInt(mIso[3], 10)
      };
    }
    const mDmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (mDmy) {
      return {
        year: parseInt(mDmy[3], 10),
        month: parseInt(mDmy[2], 10) - 1,
        day: parseInt(mDmy[1], 10)
      };
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
    }
    return null;
  }

  processCelebrationData(employees: any[]): void {
    const today = new Date();
    const currentYear = today.getFullYear();
    const todayMonth = today.getMonth(); // 0 to 11
    const todayDate = today.getDate(); // 1 to 31

    const todayMidnight = new Date(currentYear, todayMonth, todayDate).getTime();
    const items: CelebrationFeedItem[] = [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const user = this.authService.user();
    const userCompanyId = (user as any)?.companyId || (user as any)?.company_id || localStorage.getItem('companyId');

    // Filter employees strictly by company if companyId is available
    const companyEmployees = employees.filter(emp => {
      if (!userCompanyId) return true;
      const empCompanyId = emp.companyId ?? emp.company_id;
      if (!empCompanyId) return true;
      return String(empCompanyId) === String(userCompanyId);
    });

    companyEmployees.forEach(emp => {
      // 1. WORK ANNIVERSARY (calculated strictly from Date of Joining: joiningDate / joining_date)
      const joining = emp.joiningDate || emp.joining_date || emp.dateOfJoining || emp.date_of_joining;
      if (joining) {
        const jParts = this.parseDateParts(joining);
        if (jParts) {
          const { year: jYear, month: jMonth, day: jDay } = jParts;

          // Calculate anniversary occurrence
          let annivYear = currentYear;
          let annivDate = new Date(annivYear, jMonth, jDay);
          let diffDays = Math.round((annivDate.getTime() - todayMidnight) / (1000 * 3600 * 24));

          // If already passed earlier this year, calculate for next year
          if (diffDays < 0) {
            annivYear = currentYear + 1;
            annivDate = new Date(annivYear, jMonth, jDay);
            diffDays = Math.round((annivDate.getTime() - todayMidnight) / (1000 * 3600 * 24));
          }

          const isToday = (todayMonth === jMonth && todayDate === jDay);
          const yearsCompleted = annivYear - jYear;

          // Must complete at least 1 year
          if (yearsCompleted >= 1) {
            const feedId = `anniv_${emp.id || emp.employeeId || emp.user_id}_${annivYear}`;
            const storedLikes = this.getStoredLikes(feedId, isToday ? 8 : 2);
            const isLiked = this.getStoredIsLiked(feedId);

            if (isToday) {
              items.push({
                id: feedId,
                userId: emp.user_id || emp.id,
                type: 'anniversary',
                isToday: true,
                name: emp.fullName || emp.full_name || 'Team Member',
                designation: emp.designation || 'Team Member',
                department: emp.department || 'General',
                profilePicture: emp.profilePicture || emp.profile_picture || null,
                dateBadge: 'Today!',
                dateFormatted: `${jDay} ${monthNames[jMonth]}`,
                daysLeft: 0,
                years: yearsCompleted,
                message: `Warm congratulations to ${emp.fullName || emp.full_name} on completing ${yearsCompleted} ${yearsCompleted === 1 ? 'successful year' : 'successful years'} of dedication with us! 🎉`,
                likes: storedLikes,
                isLiked: isLiked
              });
            } else if (diffDays > 0 && diffDays <= 30) {
              items.push({
                id: feedId,
                userId: emp.user_id || emp.id,
                type: 'anniversary',
                isToday: false,
                name: emp.fullName || emp.full_name || 'Team Member',
                designation: emp.designation || 'Team Member',
                department: emp.department || 'General',
                profilePicture: emp.profilePicture || emp.profile_picture || null,
                dateBadge: diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`,
                dateFormatted: `${jDay} ${monthNames[jMonth]}`,
                daysLeft: diffDays,
                years: yearsCompleted,
                message: `Completing ${yearsCompleted} ${yearsCompleted === 1 ? 'year' : 'years'} of service on ${jDay} ${monthNames[jMonth]}. Mark your calendars to celebrate! 🌟`,
                likes: storedLikes,
                isLiked: isLiked
              });
            }
          }
        }
      }

      // 2. BIRTHDAY (calculated strictly from DOB: dob / dateOfBirth)
      const dob = emp.dob || emp.dateOfBirth || emp.date_of_birth;
      if (dob) {
        const bParts = this.parseDateParts(dob);
        if (bParts) {
          const { month: bMonth, day: bDay } = bParts;

          let bdayYear = currentYear;
          let bdayDate = new Date(bdayYear, bMonth, bDay);
          let diffDays = Math.round((bdayDate.getTime() - todayMidnight) / (1000 * 3600 * 24));

          if (diffDays < 0) {
            bdayYear = currentYear + 1;
            bdayDate = new Date(bdayYear, bMonth, bDay);
            diffDays = Math.round((bdayDate.getTime() - todayMidnight) / (1000 * 3600 * 24));
          }

          const isToday = (todayMonth === bMonth && todayDate === bDay);
          const feedId = `bday_${emp.id || emp.employeeId || emp.user_id}_${bdayYear}`;
          const storedLikes = this.getStoredLikes(feedId, isToday ? 12 : 3);
          const isLiked = this.getStoredIsLiked(feedId);

          if (isToday) {
            items.push({
              id: feedId,
              userId: emp.user_id || emp.id,
              type: 'birthday',
              isToday: true,
              name: emp.fullName || emp.full_name || 'Team Member',
              designation: emp.designation || 'Team Member',
              department: emp.department || 'General',
              profilePicture: emp.profilePicture || emp.profile_picture || null,
              dateBadge: 'Today!',
              dateFormatted: `${bDay} ${monthNames[bMonth]}`,
              daysLeft: 0,
              message: `Wishing ${emp.fullName || emp.full_name} a very Happy Birthday! Have a glorious and prosperous year ahead! 🎂`,
              likes: storedLikes,
              isLiked: isLiked
            });
          } else if (diffDays > 0 && diffDays <= 30) {
            items.push({
              id: feedId,
              userId: emp.user_id || emp.id,
              type: 'birthday',
              isToday: false,
              name: emp.fullName || emp.full_name || 'Team Member',
              designation: emp.designation || 'Team Member',
              department: emp.department || 'General',
              profilePicture: emp.profilePicture || emp.profile_picture || null,
              dateBadge: diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`,
              dateFormatted: `${bDay} ${monthNames[bMonth]}`,
              daysLeft: diffDays,
              message: `Birthday coming up on ${bDay} ${monthNames[bMonth]}! Get ready to wish them a wonderful day ahead! 🎈`,
              likes: storedLikes,
              isLiked: isLiked
            });
          }
        }
      }

      // 3. NEW HIRING / NEW JOINEE
      const joiningVal = emp.joiningDate || emp.joining_date || emp.dateOfJoining || emp.date_of_joining;
      const createdVal = emp.created_at || emp.createdAt;
      const jParts = this.parseDateParts(joiningVal) || this.parseDateParts(createdVal);
      if (jParts) {
        const { year: jYear, month: jMonth, day: jDay } = jParts;
        const joinDateTime = new Date(jYear, jMonth, jDay).getTime();
        const diffDays = Math.round((joinDateTime - todayMidnight) / (1000 * 3600 * 24));

        let isRecentlyCreated = false;
        if (createdVal) {
          const cParts = this.parseDateParts(createdVal);
          if (cParts) {
            const createdTime = new Date(cParts.year, cParts.month, cParts.day).getTime();
            const createdDiffDays = Math.round((createdTime - todayMidnight) / (1000 * 3600 * 24));
            if (createdDiffDays >= -30 && createdDiffDays <= 0) {
              isRecentlyCreated = true;
            }
          }
        }

        // Within past 45 days or upcoming 30 days, or created in system in last 30 days
        const isRecentJoin = (diffDays >= -45 && diffDays <= 30);
        if (isRecentJoin || isRecentlyCreated) {
          const isToday = (diffDays === 0);
          const feedId = `newhire_${emp.id || emp.employeeId || emp.user_id}_${jYear}_${jMonth}_${jDay}`;
          const storedLikes = this.getStoredLikes(feedId, isToday ? 15 : 6);
          const isLiked = this.getStoredIsLiked(feedId);

          let dateBadge = '';
          let message = '';
          const empName = emp.fullName || emp.full_name || 'New Team Member';
          const empDesig = emp.designation || 'Team Member';
          const empDept = emp.department || 'our team';

          if (isToday) {
            dateBadge = 'Joined Today! 🚀';
            message = `Warm welcome to ${empName}, who has joined our team as ${empDesig} in ${empDept} today! Let's give them a great welcome aboard! 🎊👏`;
          } else if (diffDays === -1) {
            dateBadge = 'Joined Yesterday';
            message = `Warm welcome to ${empName}, who joined our team yesterday as ${empDesig} in ${empDept}! Welcome to the family! 🌟`;
          } else if (diffDays < -1) {
            const daysAgo = Math.abs(diffDays);
            dateBadge = `Joined ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;
            message = `We are delighted to welcome ${empName} to our team as ${empDesig} in ${empDept}. Welcome aboard! 🚀👏`;
          } else if (diffDays === 1) {
            dateBadge = 'Joining Tomorrow';
            message = `${empName} is joining our team tomorrow as ${empDesig} in ${empDept}. Excited to have them on board! 🤝🎉`;
          } else {
            dateBadge = `Joining in ${diffDays} days`;
            message = `${empName} will be joining our team as ${empDesig} in ${empDept} on ${jDay} ${monthNames[jMonth]}. Let's get ready to welcome them! 🤝`;
          }

          items.push({
            id: feedId,
            userId: emp.user_id || emp.id,
            type: 'newhire',
            isToday: isToday,
            name: empName,
            designation: empDesig,
            department: empDept,
            profilePicture: emp.profilePicture || emp.profile_picture || null,
            dateBadge: dateBadge,
            dateFormatted: `${jDay} ${monthNames[jMonth]}`,
            daysLeft: isToday ? 0 : (diffDays < 0 ? Math.abs(diffDays) : diffDays),
            message: message,
            likes: storedLikes,
            isLiked: isLiked
          });
        }
      }
    });

    items.sort((a, b) => {
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;
      return a.daysLeft - b.daysLeft;
    });

    this.celebrationFeeds = items;
    this.checkUserCelebration(items, today);
    this.cdr.detectChanges();
  }

  checkUserCelebration(items: CelebrationFeedItem[], today: Date): void {
    const user = this.authService.user();
    if (!user) return;

    const currentUserId = String(user.id);
    const currentUsername = (user.username || '').toLowerCase();
    const currentEmpName = (user.employeeName || '').toLowerCase();

    const userAnniv = items.find(i => 
      i.isToday && 
      i.type === 'anniversary' && 
      (String(i.userId) === currentUserId || (currentEmpName && i.name.toLowerCase() === currentEmpName) || (currentUsername && i.name.toLowerCase().includes(currentUsername)))
    );

    const userBday = items.find(i => 
      i.isToday && 
      i.type === 'birthday' && 
      (String(i.userId) === currentUserId || (currentEmpName && i.name.toLowerCase() === currentEmpName) || (currentUsername && i.name.toLowerCase().includes(currentUsername)))
    );

    const userNewHire = items.find(i => 
      i.isToday && 
      i.type === 'newhire' && 
      (String(i.userId) === currentUserId || (currentEmpName && i.name.toLowerCase() === currentEmpName) || (currentUsername && i.name.toLowerCase().includes(currentUsername)))
    );

    if (userAnniv || userBday || userNewHire) {
      const data = {
        name: user.employeeName || user.username || 'Valued Team Member',
        isBirthday: !!userBday,
        isAnniversary: !!userAnniv,
        isNewHire: !!userNewHire,
        years: userAnniv?.years,
        profilePicture: userAnniv?.profilePicture || userBday?.profilePicture || userNewHire?.profilePicture || (user as any).profilePicture || (user as any).profile_picture || null
      };
      this.userCelebrationInfo = data;
      this.celebrationModalData = data;

      const todayKey = `celebration_shown_hr_${currentUserId}_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
      const alreadyShown = sessionStorage.getItem(todayKey);
      if (!alreadyShown) {
        this.showCelebrationModal = true;
      }
    }
  }

  getStoredLikes(feedId: string, defaultLikes: number): number {
    try {
      const stored = localStorage.getItem(`feed_likes_count_${feedId}`);
      return stored !== null ? Number(stored) : defaultLikes;
    } catch (e) {
      return defaultLikes;
    }
  }

  getStoredIsLiked(feedId: string): boolean {
    try {
      return localStorage.getItem(`feed_is_liked_${feedId}`) === 'true';
    } catch (e) {
      return false;
    }
  }

  toggleLike(item: any): void {
    if (!item) return;
    if (item.isLiked) {
      item.likes = Math.max(0, (item.likes || 1) - 1);
      item.isLiked = false;
      if (item.id) localStorage.setItem(`feed_is_liked_${item.id}`, 'false');
    } else {
      item.likes = (item.likes || 0) + 1;
      item.isLiked = true;
      if (item.id) localStorage.setItem(`feed_is_liked_${item.id}`, 'true');
    }
    if (item.id) {
      localStorage.setItem(`feed_likes_count_${item.id}`, String(item.likes));
    }
    this.cdr.detectChanges();
  }

  sendWish(feed: CelebrationFeedItem): void {
    feed.wished = true;
    if (!feed.isLiked) {
      this.toggleLike(feed);
    }
    let wishText = '';
    if (feed.type === 'birthday') {
      wishText = `🎂 You sent heartfelt birthday wishes to ${feed.name}!`;
    } else if (feed.type === 'anniversary') {
      wishText = `🏆 You congratulated ${feed.name} on completing ${feed.years} years of service!`;
    } else {
      wishText = `👋 You welcomed ${feed.name} to the team!`;
    }
    this.toastWishMessage = wishText;
    setTimeout(() => {
      if (this.toastWishMessage === wishText) {
        this.toastWishMessage = null;
        this.cdr.detectChanges();
      }
    }, 4000);
    this.cdr.detectChanges();
  }

  closeCelebrationModal(): void {
    this.showCelebrationModal = false;
    const user = this.authService.user();
    const today = new Date();
    const todayKey = `celebration_shown_hr_${user?.id}_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
    sessionStorage.setItem(todayKey, 'true');
    this.userCelebrationDismissed = true;
    this.cdr.detectChanges();
  }

  openCelebrationModal(feedItem?: CelebrationFeedItem): void {
    if (feedItem) {
      const allMatching = this.celebrationFeeds.filter(i => 
        (i.userId && feedItem.userId && String(i.userId) === String(feedItem.userId)) ||
        (i.name && feedItem.name && i.name.toLowerCase().trim() === feedItem.name.toLowerCase().trim())
      );
      const hasBday = allMatching.some(i => i.type === 'birthday');
      const hasAnniv = allMatching.some(i => i.type === 'anniversary');
      const hasNewHire = allMatching.some(i => i.type === 'newhire') || feedItem.type === 'newhire';
      const annivItem = allMatching.find(i => i.type === 'anniversary');
      const withPic = allMatching.find(i => !!i.profilePicture);

      this.celebrationModalData = {
        name: feedItem.name,
        isBirthday: hasBday,
        isAnniversary: hasAnniv,
        isNewHire: hasNewHire,
        years: annivItem?.years || feedItem.years || 3,
        profilePicture: withPic?.profilePicture || feedItem.profilePicture || null
      };
    } else if (this.userCelebrationInfo) {
      this.celebrationModalData = this.userCelebrationInfo;
    } else if (this.celebrationFeeds.length > 0) {
      const firstToday = this.celebrationFeeds.find(i => i.isToday) || this.celebrationFeeds[0];
      this.openCelebrationModal(firstToday);
      return;
    }
    this.showCelebrationModal = true;
    this.cdr.detectChanges();
  }
}
