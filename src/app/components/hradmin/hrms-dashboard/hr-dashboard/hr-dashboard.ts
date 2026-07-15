import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TableColumn, TableTemplate } from '../../../../shared/ui/table-template/table-template';
import { AttendanceService } from '../../../../shared/services/attendance.service';
import { LeaveService } from '../../../../shared/services/leave.service';
import { forkJoin, Subscription } from 'rxjs';
import { SocketService } from '../../../../shared/services/socket.service';
import { AuthService } from '../../../../shared/services/services/auth.service';

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
  imports: [CommonModule, FormsModule, ToastModule, BreadcrumbModule, ButtonModule, ConfirmDialogModule, DialogModule, TableTemplate],
  providers: [MessageService, ConfirmationService],
  templateUrl: './hr-dashboard.html',
  styleUrl: './hr-dashboard.scss',
})
export class HrDashboard implements OnInit, OnDestroy {
  // Navigation tabs: 'dashboard' | 'pendency'
  activeTab: 'dashboard' | 'pendency' = 'dashboard';

  constructor(private router: Router) { }

  // Total headcount in statistics
  totalEmployees = 147;

  breadcrumbItems: MenuItem[] = [{ label: 'HR Dashboard' }];
  isLoading = false;
  confirmationService = inject(ConfirmationService);

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
    { label: 'Swipe In', value: 83, color: '#10b981' }, // emerald-500
    { label: 'Not Swipe In', value: 38, color: '#f43f5e' }, // rose-500
    { label: 'OD', value: 15, color: '#b45309' }, // amber-700
    { label: 'On Leave', value: 7, color: '#3b82f6' }, // blue-500
    { label: 'Short Leave', value: 2, color: '#a855f7' }, // purple-500
    { label: 'Swipe Out', value: 2, color: '#f97316' }, // orange-500
  ];

  donutSegments: DonutSegment[] = [];

  // Stacked Bar Chart data
  barChartData: StackedBarData[] = [
    { day: 'Monday', onTime: 77, late: 10, total: 87 },
    { day: 'Tuesday', onTime: 79, late: 13, total: 92 },
    { day: 'Wednesday', onTime: 71, late: 7, total: 78 },
    { day: 'Thursday', onTime: 66, late: 17, total: 83 },
    { day: 'Friday', onTime: 74, late: 9, total: 83 },
  ];

  maxBarValue = 120; // Y-axis max value

  // Source distribution
  sources = [
    { label: 'Desktop Swipe In', count: 0, percentage: 0, color: 'bg-slate-400' },
    { label: 'Mobile Swipe In', count: 83, percentage: 100, color: 'bg-blue-600' },
    { label: 'AI Swipe In', count: 0, percentage: 0, color: 'bg-indigo-600' },
  ];

  // Exceptions list
  exceptions = [
    { label: 'Late Coming', count: 9, severity: 'danger', icon: 'pi-clock' },
    { label: 'Early Swipe Out', count: 2, severity: 'warning', icon: 'pi-sign-out' },
  ];

  // Pendency numbers
  pendingCounts = {
    regularization: 2,
    leave: 9,
    attendance: 6,
    expense: 5,
    gatepass: 5,
    total: 27
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

    { key: 'department', header: 'Department' },
    { key: 'designation', header: 'Designation' },
    { key: 'location_address', header: 'Location / Status' },

  ];

  pendingRequestColumns: TableColumn[] = [
    { key: 'actions', header: 'Actions' },
    { key: 'id', header: 'Request ID', isSortable: true },
    { key: 'employeeName', header: 'Employee Name', isSortable: true },
    { key: 'type', header: 'Request Type' },
    { key: 'details', header: 'Description / Details' },
    { key: 'date', header: 'Requested Date', isSortable: true },
    { key: 'status', header: 'Status' },
  ];

  ngOnInit(): void {
    const currentDay = new Date().getDay();
    if (currentDay >= 1 && currentDay <= 5) {
      this.barChartData = this.barChartData.slice(0, currentDay);
    } else if (currentDay === 0 || currentDay === 6) {
      this.barChartData = this.barChartData.slice(0, 5);
    }

    this.loadPendencyData();
    this.loadDashboardSummary();

    const user = this.authService.user();
    if (user?.companyId) {
      this.socketService.connect(user.companyId);
      this.socketSubscription = this.socketService.onAttendanceUpdated().subscribe(() => {
        // Silently reload dashboard data on socket event
        this.loadDashboardSummary();
        this.loadPendencyData();
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
    this.loadDashboardSummary();
    this.loadPendencyData();

    // Simulate slight delay for visual feedback if API is too fast
    setTimeout(() => {
      this.isLoading = false;
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Dashboard synchronized successfully' });
    }, 600);
  }

  onCardClick(card: AttendanceCard): void {
    if (card.count === 0) {
      this.messageService.add({ severity: 'info', summary: 'Info', detail: `No records found for ${card.label} today.` });
      return;
    }

    this.detailsCategoryLabel = card.label;
    this.isDetailsModalVisible = true;
    this.isLoadingDetails = true;
    this.detailsTableData = [];

    this.attendanceService.getHRDashboardDetails(card.category).subscribe({
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

  // Calculate SVG stroke parameters for the Donut Chart
  calculateDonutSegments(): void {
    const total = this.totalEmployees || 1;
    let currentOffset = 0;
    const circumference = 314.16; // 2 * pi * r (r=50)

    this.donutSegments = this.donutRawData.map((item) => {
      const percentage = item.value / total;
      const strokeLength = percentage * circumference;
      // offset is calculated so segments follow each other
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

  loadDashboardSummary(): void {
    this.attendanceService.getHRDashboardSummary().subscribe({
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
          const totalSwipes = s.mobileCount + s.desktopCount;
          this.sources = [
            { label: 'Desktop Swipe In', count: s.desktopCount, percentage: totalSwipes > 0 ? (s.desktopCount / totalSwipes) * 100 : 0, color: 'bg-slate-400' },
            { label: 'Mobile Swipe In', count: s.mobileCount, percentage: totalSwipes > 0 ? (s.mobileCount / totalSwipes) * 100 : 100, color: 'bg-blue-600' },
            { label: 'AI Swipe In', count: 0, percentage: 0, color: 'bg-indigo-600' },
          ];

          // Update Exceptions
          this.exceptions = [
            { label: 'Late Coming', count: s.lateComingCount, severity: 'danger', icon: 'pi-clock' },
            { label: 'Early Swipe Out', count: s.earlyOutCount, severity: 'warning', icon: 'pi-sign-out' },
          ];

          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching dashboard summary:', err);
      }
    });
  }

  setActiveTab(tab: 'dashboard' | 'pendency'): void {
    this.activeTab = tab;
    if (tab === 'pendency') {
      this.loadPendencyData();
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
          employeeName: item.employeeName,
          type: 'Regularization',
          details: `${item.correctionType}: ${item.reason}`,
          date: item.attendanceDate,
          status: item.status === 'Pending' ? 'Pending Approval' : item.status,
          raw: item
        }));

        const mappedLeaves = (res.leaves?.data || [])
          .map((item: any) => ({
            id: `LEV-${item.id}`,
            employeeName: item.employee_name || 'Unknown',
            type: 'Leave',
            details: `${item.leave_type}: ${item.reason || ''}`,
            date: item.start_date === item.end_date ? item.start_date : `${item.start_date} to ${item.end_date}`,
            status: item.status === 'PENDING' ? 'Pending Approval' : item.status,
            raw: item
          }));

        this.allPendencyRequests = [...mappedRegs, ...mappedLeaves];

        // Update counts (only pending)
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
          this.loadDashboardSummary();
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
          this.loadDashboardSummary();
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
          this.loadDashboardSummary();
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
          this.loadDashboardSummary();
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
}
