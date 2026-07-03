import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

interface AttendanceCard {
  label: string;
  count: number;
  icon: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
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
  imports: [CommonModule, FormsModule],
  templateUrl: './hr-dashboard.html',
  styleUrl: './hr-dashboard.scss',
})
export class HrDashboard implements OnInit {
  // Navigation tabs: 'dashboard' | 'pendency'
  activeTab: 'dashboard' | 'pendency' = 'dashboard';

  constructor(private router: Router) {}

  // Total headcount in statistics
  totalEmployees = 147;

  // KPI cards
  attendanceCards: AttendanceCard[] = [
    {
      label: 'Swipe In',
      count: 83,
      icon: 'pi-check-circle',
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-100 hover:border-emerald-300',
    },
    {
      label: 'Not Swipe In',
      count: 38,
      icon: 'pi-exclamation-triangle',
      colorClass: 'text-rose-600',
      bgClass: 'bg-rose-50',
      borderClass: 'border-rose-100 hover:border-rose-300',
    },
    {
      label: 'On Leave',
      count: 7,
      icon: 'pi-calendar',
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-100 hover:border-blue-300',
    },
    {
      label: 'OD',
      count: 15,
      icon: 'pi-briefcase',
      colorClass: 'text-amber-700',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-100 hover:border-amber-300',
    },
    {
      label: 'Short Leave',
      count: 2,
      icon: 'pi-clock',
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-50',
      borderClass: 'border-purple-100 hover:border-purple-300',
    },
    {
      label: 'Swipe Out',
      count: 2,
      icon: 'pi-sign-out',
      colorClass: 'text-orange-600',
      bgClass: 'bg-orange-50',
      borderClass: 'border-orange-100 hover:border-orange-300',
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

  // Detailed pending requests (for Pendency Tab)
  pendingRequests: PendingRequestItem[] = [
    { id: 'REG-001', employeeName: 'Mausam Tyagi', type: 'Regularization', details: 'Swipe In missing on July 02', date: '2026-07-02', status: 'Pending Approval' },
    { id: 'REG-002', employeeName: 'Amit Kumar', type: 'Regularization', details: 'Late Entry regularization request', date: '2026-07-01', status: 'Pending Approval' },
    { id: 'LEV-001', employeeName: 'Rohit Sharma', type: 'Leave', details: 'Casual Leave (2 days)', date: '2026-07-04 to 2026-07-05', status: 'Pending Approval' },
    { id: 'LEV-002', employeeName: 'Priya Patel', type: 'Leave', details: 'Sick Leave (1 day)', date: '2026-07-03', status: 'Pending Approval' },
    { id: 'LEV-003', employeeName: 'Sanjay Dutt', type: 'Leave', details: 'Earned Leave (3 days)', date: '2026-07-06 to 2026-07-08', status: 'Pending Approval' },
    { id: 'LEV-004', employeeName: 'Nisha Gupta', type: 'Leave', details: 'Casual Leave (1 day)', date: '2026-07-03', status: 'Pending Approval' },
    { id: 'LEV-005', employeeName: 'Rahul Verma', type: 'Leave', details: 'Sick Leave (2 days)', date: '2026-07-02 to 2026-07-03', status: 'Pending Approval' },
    { id: 'LEV-006', employeeName: 'Divya Teja', type: 'Leave', details: 'Earned Leave (5 days)', date: '2026-07-10 to 2026-07-14', status: 'Pending Approval' },
    { id: 'LEV-007', employeeName: 'Kunal Sen', type: 'Leave', details: 'Short Leave (2 hours)', date: '2026-07-03', status: 'Pending Approval' },
    { id: 'LEV-008', employeeName: 'Vikram Seth', type: 'Leave', details: 'Casual Leave (1 day)', date: '2026-07-06', status: 'Pending Approval' },
    { id: 'LEV-009', employeeName: 'Aditi Rao', type: 'Leave', details: 'Sick Leave (1 day)', date: '2026-07-02', status: 'Pending Approval' },
    { id: 'ATT-001', employeeName: 'Rajesh Koothrapali', type: 'Attendance Approval', details: 'On-Duty (OD) request for client meet', date: '2026-07-03', status: 'Pending Approval' },
    { id: 'ATT-002', employeeName: 'Penny Hofstadter', type: 'Attendance Approval', details: 'On-Duty (OD) outdoor sales', date: '2026-07-02', status: 'Pending Approval' },
    { id: 'EXP-001', employeeName: 'Sheldon Cooper', type: 'Expense Claim', details: 'Travel allowance claim - $120', date: '2026-06-30', status: 'Pending Approval' },
    { id: 'EXP-002', employeeName: 'Leonard Hofstadter', type: 'Expense Claim', details: 'Client lunch reimbursement - $45', date: '2026-07-01', status: 'Pending Approval' }
  ];

  ngOnInit(): void {
    this.calculateDonutSegments();
  }

  // Calculate SVG stroke parameters for the Donut Chart
  calculateDonutSegments(): void {
    const total = this.totalEmployees; // 147
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

  setActiveTab(tab: 'dashboard' | 'pendency'): void {
    this.activeTab = tab;
  }

  approveRequest(requestId: string): void {
    this.pendingRequests = this.pendingRequests.filter(req => req.id !== requestId);
    this.pendingCounts.total--;
  }

  rejectRequest(requestId: string): void {
    this.pendingRequests = this.pendingRequests.filter(req => req.id !== requestId);
    this.pendingCounts.total--;
  }

  navigateToLeaveApproval(): void {
    this.router.navigate(['/hradmin/leave-approval']);
  }
}
