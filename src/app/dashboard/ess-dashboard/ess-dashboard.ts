import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CardModule } from 'primeng/card'
import { TableModule } from 'primeng/table'
import { RouterLink } from '@angular/router'
import { Breadcrumb } from 'primeng/breadcrumb'

import { AuthService } from '../../shared/services/services/auth.service'
import {
  AttendanceRecord,
  AttendanceService,
  DashboardSummary
} from '../../shared/services/attendance.service'

import { TableColumn, TableTemplate } from '../../shared/ui/table-template/table-template'

@Component({
  selector: 'app-ess-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule, Breadcrumb, RouterLink, TableTemplate],
  templateUrl: './ess-dashboard.html',
  styleUrl: './ess-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EssDashboard implements OnInit {
  breadcrumbItems: any[] = [
    {
      label: 'Employee Self Service',
      icon: 'pi pi-home',
      routerLink: '/ess'
    },
    {
      label: 'Dashboard',
      icon: 'pi pi-chart-bar',
      routerLink: '/ess/ess-dashboard'
    }
  ]

  // Table Data
  resData: AttendanceRecord[] = []

  // Table Pagination
  pageNo = 1
  pageSize = 10
  totalCount = 0

  searchText = ''

  readonly employeeName = signal<string>('')
  readonly employeeEmail = signal<string>('')

  readonly dashboardSummary = signal<DashboardSummary>({
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    halfDays: 0,
    totalWorkingMinutes: 0
  })

  readonly recentLogs = signal<AttendanceRecord[]>([])

  readonly loading = signal<boolean>(false)

  constructor(
    private readonly authService: AuthService,
    private readonly attendanceService: AttendanceService
  ) { }

  ngOnInit(): void {
    const user = this.authService.user()

    if (user) {
      this.employeeName.set(user.employeeName || 'Employee')

      this.employeeEmail.set(user.username || '')
    }

    this.loadDashboardData()
  }

  // Table Columns

  columns: TableColumn[] = [
    // {
    //   key: 'actions',
    //   header: 'Actions',
    //   isVisible: true
    // },

    {
      key: 'employee_id',
      header: 'Employee ID',
      isVisible: true,
      isSortable: true
    },

    {
      key: 'attendance_date',
      header: 'Attendance Date',
      isVisible: true,
      isSortable: true,
      pipe: 'date',
      pipeArgs: 'dd-MM-yyyy'
    },

    {
      key: 'swipe_in',
      header: 'Swipe In',
      isVisible: true,
      isSortable: true,
      pipe: 'date',
      pipeArgs: 'hh:mm a'
    },

    {
      key: 'swipe_out',
      header: 'Swipe Out',
      isVisible: true,
      isSortable: true,
      pipe: 'date',
      pipeArgs: 'hh:mm a'
    },

    {
      key: 'attendance_status',
      header: 'Status',
      isVisible: true,
      isSortable: true
    },

    {
      key: 'created_at',
      header: 'Created At',
      isVisible: true,
      isSortable: true,
      pipe: 'date',
      pipeArgs: 'dd-MM-yyyy hh:mm a'
    },

    {
      key: 'updated_at',
      header: 'Updated At',
      isVisible: true,
      isSortable: true,
      pipe: 'date',
      pipeArgs: 'dd-MM-yyyy hh:mm a'
    }
  ]

  rowActions = [
    {
      label: 'View',
      icon: 'pi pi-eye',
      id: 'view'
    },
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      id: 'edit'
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      id: 'delete'
    }
  ];
  loadDashboardData(): void {
    this.loading.set(true)

    // Dashboard Summary

    this.attendanceService.getDashboardSummary().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.dashboardSummary.set(res.data)
        }
      },

      error: err => {
        console.error(err)
      }
    })

    // Attendance History

    this.attendanceService.getHistory().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.resData = res.data

          this.totalCount = res.data.length
        }

        console.log(this.resData)

        this.loading.set(false)
      },

      error: err => {
        console.error(err)

        this.loading.set(false)
      }
    })
  }

  // Pagination

  onPageChange(newPage: number) {
    this.pageNo = newPage

    this.loadDashboardData()
  }

  // Search

  onSearchChange(value: string) {
    this.searchText = value

    this.pageNo = 1

    this.loadDashboardData()
  }

  // Page Size

  onPageSizeChange(size: number) {
    this.pageSize = size

    this.pageNo = 1

    this.loadDashboardData()
  }

  // Sorting

  onSortChange(event: any) {
    console.log('Sort Event', event)

    this.loadDashboardData()
  }

  // Row Action

  onActionClicked(event: any) {
    console.log(event)

    if (event.action === 'view') {
      console.log('Selected Attendance:', event.row)
    }
  }

  formatTotalWorkingHours(minutes: number): string {
    const hours = Math.floor(minutes / 60)

    const remainingMins = minutes % 60

    return `${hours}h ${remainingMins}m`
  }

  formatTimeString(dateStr: string | null): string {
    if (!dateStr) return '-'

    const normalized = dateStr.replace(' ', 'T')

    const date = new Date(normalized)

    const parsed = isNaN(date.getTime()) ? new Date(dateStr) : date

    return parsed.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
}
