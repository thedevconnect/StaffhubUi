import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal } from '@angular/core'
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
import { EmployeeAttendance } from '../../components/ess/employee-attendance/employee-attendance'
import { AttendanceRegularization } from '../../components/ess/attendance-regularization/attendance-regularization'
import { LeaveService } from '../../shared/services/leave.service'
import { UserProfileService } from '../../shared/services/user-profile.service'
import { EmployeeManagementService } from '../../shared/services/employee-management.service'
export interface CelebrationFeedItem {
  id: string;
  userId?: string | number;
  type: 'birthday' | 'anniversary';
  isToday: boolean;
  name: string;
  designation: string;
  department: string;
  avatarUrl?: string;
  profilePicture?: string;
  dateBadge: string;
  dateFormatted: string;
  daysLeft: number;
  years?: number;
  message: string;
  likes: number;
  isLiked?: boolean;
  wished?: boolean;
}

@Component({
  selector: 'app-ess-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    Breadcrumb,
    RouterLink,
    TableTemplate,
    EmployeeAttendance,
    AttendanceRegularization
  ],
  templateUrl: './ess-dashboard.html',
  styleUrl: './ess-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EssDashboard implements OnInit {
  breadcrumbItems: any[] = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      routerLink: '/ess'
    },
    {
      label: 'Home Page',
      routerLink: '/ess/ess-dashboard'
    }
  ]

  activeTab: 'dashboard' | 'attendance' | 'regularization' | 'pendency' = 'dashboard';
  pendencyCount = 0;

  readonly myInfo = signal<{ name: string; designation: string; department: string; reportingManager: string }>({
    name: 'Loading...',
    designation: 'Loading...',
    department: 'Loading...',
    reportingManager: 'Loading...'
  });

  readonly leaveStatusList = signal<Array<{ label: string; value: string | number }>>([
    { label: 'Earned Leave-Apply', value: 0 },
    { label: 'Casual Leave Approved', value: 0 },
    { label: 'Earned Leave-Approved', value: 0 },
    { label: 'Loss of Pay-Approved', value: 0 },
    { label: 'Outdoor Duty-Approved', value: 0 },
    { label: 'Restricted Holiday-Approved', value: 0 },
    { label: 'Casual Leave-Balance as on', value: 0 },
    { label: 'Earned Leave-Balance as on', value: 0 }
  ]);

  readonly activeFeedFilter = signal<'all' | 'anniversary' | 'birthday'>('all');
  readonly activeFeedView = signal<'all' | 'today' | 'upcoming'>('all');
  readonly celebrationFeeds = signal<CelebrationFeedItem[]>([]);
  readonly loadingFeeds = signal<boolean>(false);

  // User celebration pop-up modal state
  readonly showCelebrationModal = signal<boolean>(false);
  readonly userCelebrationInfo = signal<{
    name: string;
    isBirthday: boolean;
    isAnniversary: boolean;
    years?: number;
  } | null>(null);
  readonly userCelebrationDismissed = signal<boolean>(false);
  readonly toastWishMessage = signal<string | null>(null);

  readonly anniversaryFeeds = signal<Array<{ date: string; name: string; years: number; likes: number; comments: number; isLiked?: boolean }>>([
    { date: 'Today', name: 'Manjeet', years: 2, likes: 8, comments: 0 }
  ]);

  readonly birthdayFeeds = signal<Array<{ date: string; name: string; likes: number; comments: number; isLiked?: boolean }>>([
    { date: 'Today', name: 'Niharika', likes: 12, comments: 0 }
  ]);

  get todayCelebrationsCount(): number {
    return this.celebrationFeeds().filter(i => i.isToday).length;
  }

  get upcomingCelebrationsCount(): number {
    return this.celebrationFeeds().filter(i => !i.isToday).length;
  }

  get filteredCelebrationFeeds(): CelebrationFeedItem[] {
    const filter = this.activeFeedFilter();
    const view = this.activeFeedView();

    return this.celebrationFeeds().filter(item => {
      if (filter !== 'all' && item.type !== filter) return false;
      if (view === 'today' && !item.isToday) return false;
      if (view === 'upcoming' && item.isToday) return false;
      return true;
    });
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
    this.cdr.markForCheck();
  }

  sendWish(feed: CelebrationFeedItem): void {
    feed.wished = true;
    if (!feed.isLiked) {
      this.toggleLike(feed);
    }
    const wishText = feed.type === 'birthday'
      ? `🎂 You sent heartfelt birthday wishes to ${feed.name}!`
      : `🏆 You congratulated ${feed.name} on completing ${feed.years} years of service!`;
    this.toastWishMessage.set(wishText);
    setTimeout(() => {
      if (this.toastWishMessage() === wishText) {
        this.toastWishMessage.set(null);
        this.cdr.markForCheck();
      }
    }, 4000);
    this.cdr.markForCheck();
  }

  closeCelebrationModal(): void {
    this.showCelebrationModal.set(false);
    const user = this.authService.user();
    const today = new Date();
    const todayKey = `celebration_shown_${user?.id}_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
    sessionStorage.setItem(todayKey, 'true');
    this.userCelebrationDismissed.set(true);
    this.cdr.markForCheck();
  }

  openCelebrationModal(): void {
    this.showCelebrationModal.set(true);
    this.cdr.markForCheck();
  }

  // Table Data
  resData: AttendanceRecord[] = []

  // Table Pagination
  pageNo = 1
  pageSize = 10
  totalCount = 0

  searchText = ''

  readonly employeeName = signal<string>('Employee')
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
    private readonly attendanceService: AttendanceService,
    private readonly leaveService: LeaveService,
    private readonly userProfileService: UserProfileService,
    private readonly employeeManagementService: EmployeeManagementService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const user = this.authService.user()

    if (user) {
      this.employeeName.set(user.employeeName || user.username || 'Employee')
      this.employeeEmail.set(user.username || '')

      this.myInfo.set({
        name: user.employeeName || user.username || 'Employee',
        designation: user.role || 'ESS',
        department: 'General',
        reportingManager: 'N/A'
      });

      if (user.id) {
        this.employeeManagementService.getEmployeeById(user.id).subscribe({
          next: (emp: any) => {
            if (emp) {
              const name = emp.fullName || emp.full_name || emp.employeeName || user.employeeName || user.username || 'Employee';
              const desig = emp.designation || user.role || 'ESS';
              const dept = emp.department || 'General';
              const manager = emp.reportingManager || emp.reportingManagerName || emp.reporting_manager_name || 'N/A';

              this.employeeName.set(name);
              this.myInfo.set({
                name: name,
                designation: desig,
                department: dept,
                reportingManager: manager
              });

              const joining = emp.joiningDate || emp.joining_date;
              if (joining) {
                try {
                  const joiningStr = new Date(joining).toISOString().split('T')[0];
                  localStorage.setItem('joiningDate', joiningStr);
                } catch (e) { }
              }
            }
            this.cdr.markForCheck();
          },
          error: () => { }
        });
      }
    }

    this.userProfileService.getUserProfile().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const joining = res.data.joining_date || res.data.date_of_joining || res.data.doj || res.data.created_at;
          if (joining) {
            try {
              const joiningStr = new Date(joining).toISOString().split('T')[0];
              localStorage.setItem('joiningDate', joiningStr);
            } catch (e) { }
          }
          this.loadLiveLeaveSummary();
        }
      },
      error: () => {
        this.loadLiveLeaveSummary();
      }
    });

    this.loadDashboardData()
    this.loadCelebrationFeeds()
  }

  loadCelebrationFeeds(): void {
    this.loadingFeeds.set(true);
    this.employeeManagementService.getEmployees().subscribe({
      next: (employees) => {
        this.processCelebrationData(employees || []);
        this.loadingFeeds.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingFeeds.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  processCelebrationData(employees: any[]): void {
    const today = new Date();
    const currentYear = today.getFullYear();
    const todayMonth = today.getMonth(); // 0 to 11
    const todayDate = today.getDate(); // 1 to 31

    const todayMidnight = new Date(currentYear, todayMonth, todayDate).getTime();
    const items: CelebrationFeedItem[] = [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    employees.forEach(emp => {
      // 1. WORK ANNIVERSARY (calculated from joining_date / joiningDate)
      const joining = emp.joiningDate || emp.joining_date;
      if (joining) {
        const jDate = new Date(joining);
        if (!isNaN(jDate.getTime())) {
          const jYear = jDate.getFullYear();
          const jMonth = jDate.getMonth();
          const jDay = jDate.getDate();

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

      // 2. BIRTHDAY (calculated from dob / dateOfBirth)
      const dob = emp.dob || emp.dateOfBirth || emp.date_of_birth;
      if (dob) {
        const bDate = new Date(dob);
        if (!isNaN(bDate.getTime())) {
          const bMonth = bDate.getMonth();
          const bDay = bDate.getDate();

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
    });

    // Sort items: Today items first, then upcoming by daysLeft ascending
    items.sort((a, b) => {
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;
      return a.daysLeft - b.daysLeft;
    });

    this.celebrationFeeds.set(items);

    // Also populate anniversaryFeeds and birthdayFeeds for compatibility
    const annivList = items.filter(i => i.type === 'anniversary').map(i => ({
      date: i.dateFormatted,
      name: i.name,
      years: i.years || 1,
      likes: i.likes,
      comments: 0,
      isLiked: i.isLiked
    }));
    this.anniversaryFeeds.set(annivList.length > 0 ? annivList : [
      { date: 'Today', name: 'Manjeet', years: 2, likes: 8, comments: 0 }
    ]);

    const bdayList = items.filter(i => i.type === 'birthday').map(i => ({
      date: i.dateFormatted,
      name: i.name,
      likes: i.likes,
      comments: 0,
      isLiked: i.isLiked
    }));
    this.birthdayFeeds.set(bdayList.length > 0 ? bdayList : [
      { date: 'Today', name: 'Niharika', likes: 12, comments: 0 }
    ]);

    this.checkUserCelebration(items, today);
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

    if (userAnniv || userBday) {
      this.userCelebrationInfo.set({
        name: user.employeeName || user.username || 'Valued Team Member',
        isBirthday: !!userBday,
        isAnniversary: !!userAnniv,
        years: userAnniv?.years
      });

      const todayKey = `celebration_shown_${currentUserId}_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
      const alreadyShown = sessionStorage.getItem(todayKey);
      if (!alreadyShown) {
        this.showCelebrationModal.set(true);
      }
    }
  }

  loadLiveLeaveSummary(): void {
    const user = this.authService.user();
    const userId = user?.id;

    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1 to 12 (e.g. 8 for August)

    // Calculate completed months in current calendar year (or since joining if joined in current year)
    let joiningStr = localStorage.getItem('joiningDate');
    let joiningDate: Date | null = joiningStr ? new Date(joiningStr) : null;
    if (joiningDate && isNaN(joiningDate.getTime())) {
      joiningDate = null;
    }

    let monthsToCount = currentMonth; // Default: Months elapsed in current year (1.0 EL & 0.5 CL on 1st of every month)
    if (joiningDate && joiningDate.getFullYear() === today.getFullYear()) {
      const joiningMonth = joiningDate.getMonth() + 1;
      monthsToCount = Math.max(1, currentMonth - joiningMonth + 1);
    }

    // 1.0 EL per month, 0.5 CL per month for current year
    const creditedElCurrentYear = monthsToCount * 1.0;
    const creditedClCurrentYear = monthsToCount * 0.5;

    // Fetch Live Leave Balances from Backend
    this.leaveService.getLeaveBalances(userId).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const el = res.data.earnedLeave || {};
          const cl = res.data.casualLeave || {};

          const elTaken = Number(el.taken || 0);
          const clTaken = Number(cl.taken || 0);
          const elPending = Number(el.pending || 0);
          const lopTaken = Number(res.data.lossOfPay?.taken || 0);

          const elCreditedDb = Number(el.credited || 0);
          const clCreditedDb = Number(cl.credited || 0);

          // Use current year accrual or DB balance if within annual limits
          const finalElCredited = elCreditedDb > 0 && elCreditedDb <= 12 ? elCreditedDb : creditedElCurrentYear;
          const finalClCredited = clCreditedDb > 0 && clCreditedDb <= 6 ? clCreditedDb : creditedClCurrentYear;

          const elRemaining = Math.max(0, Math.round((finalElCredited - elTaken) * 100) / 100);
          const clRemaining = Math.max(0, Math.round((finalClCredited - clTaken) * 100) / 100);

          this.leaveService.getLeaves().subscribe({
            next: (leaveRes) => {
              let outdoorDutyTaken = 0;
              let restrictedHolidayTaken = 0;

              if (leaveRes?.success && Array.isArray(leaveRes.data)) {
                leaveRes.data.forEach((l: any) => {
                  const type = (l.leave_type || '').toUpperCase();
                  const status = (l.status || '').toUpperCase();
                  const days = l.start_date && l.end_date 
                    ? Math.max(1, Math.round((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / (1000 * 3600 * 24)) + 1)
                    : 1;

                  if (status === 'APPROVED' || status === 'ACCEPTED') {
                    if (type.includes('OUTDOOR') || type.includes('OD')) outdoorDutyTaken += days;
                    if (type.includes('RESTRICTED') || type.includes('RH')) restrictedHolidayTaken += days;
                  }
                });
              }

              this.leaveStatusList.set([
                { label: 'Earned Leave-Apply', value: elPending ? -elPending : 0 },
                { label: 'Casual Leave Approved', value: clTaken ? -clTaken : 0 },
                { label: 'Earned Leave-Approved', value: elTaken ? -elTaken : 0 },
                { label: 'Loss of Pay-Approved', value: lopTaken ? -lopTaken : 0 },
                { label: 'Outdoor Duty-Approved', value: outdoorDutyTaken ? -outdoorDutyTaken : 0 },
                { label: 'Restricted Holiday-Approved', value: restrictedHolidayTaken ? -restrictedHolidayTaken : 0 },
                { label: 'Casual Leave-Balance as on', value: clRemaining },
                { label: 'Earned Leave-Balance as on', value: elRemaining }
              ]);
              this.cdr.markForCheck();
            },
            error: () => {
              this.setCalculatedLeaveList(creditedElCurrentYear, creditedClCurrentYear, elTaken, clTaken, elPending, clRemaining, elRemaining);
            }
          });
        } else {
          this.setCalculatedLeaveList(creditedElCurrentYear, creditedClCurrentYear, 0, 0, 0, creditedClCurrentYear, creditedElCurrentYear);
        }
      },
      error: () => {
        this.setCalculatedLeaveList(creditedElCurrentYear, creditedClCurrentYear, 0, 0, 0, creditedClCurrentYear, creditedElCurrentYear);
      }
    });
  }

  setCalculatedLeaveList(elCredited: number, clCredited: number, elTaken: number, clTaken: number, elPending: number, clBal: number, elBal: number): void {
    this.leaveStatusList.set([
      { label: 'Earned Leave-Apply', value: elPending ? -elPending : 0 },
      { label: 'Casual Leave Approved', value: elTaken ? -elTaken : 0 },
      { label: 'Earned Leave-Approved', value: elTaken ? -elTaken : 0 },
      { label: 'Loss of Pay-Approved', value: 0 },
      { label: 'Outdoor Duty-Approved', value: 0 },
      { label: 'Restricted Holiday-Approved', value: 0 },
      { label: 'Casual Leave-Balance as on', value: clBal },
      { label: 'Earned Leave-Balance as on', value: elBal }
    ]);
    this.cdr.markForCheck();
  }

  // Table Columns

  columns: TableColumn[] = [
    { key: 'employee_id', header: 'Employee ID', isVisible: true, isSortable: true },
    { key: 'attendance_date', header: 'Attendance Date', isVisible: true, isSortable: true, pipe: 'date', pipeArgs: 'dd-MM-yyyy' },
    { key: 'swipe_in', header: 'Swipe In', isVisible: true, isSortable: true, pipe: 'date', pipeArgs: 'hh:mm:ss a' },
    { key: 'swipe_out', header: 'Swipe Out', isVisible: true, isSortable: true, pipe: 'date', pipeArgs: 'hh:mm:ss a' },
    { key: 'attendance_status', header: 'Status', isVisible: true, isSortable: true },
    { key: 'total_work_minutes', header: 'Total Time', isVisible: true, isSortable: true, pipe: 'formatTotalWorkingHours' },
    { key: 'created_at', header: 'Created At', isVisible: true, isSortable: true, pipe: 'date', pipeArgs: 'dd-MM-yyyy hh:mm:ss a' }
  ]

  rowActions = [
    { label: 'View', icon: 'pi pi-eye', id: 'view' },
    { label: 'Edit', icon: 'pi pi-pencil', id: 'edit' },
    { label: 'Delete', icon: 'pi pi-trash', id: 'delete' }
  ];

  loadDashboardData(): void {
    this.loading.set(true)

    // Dashboard Summary
    this.attendanceService.getDashboardSummary().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.dashboardSummary.set(res.data)
        }
        this.cdr.markForCheck()
      },
      error: err => {
        console.error(err)
      }
    })

    // Attendance History with Pagination
    this.attendanceService.getHistory(this.pageNo, this.pageSize, this.searchText).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.resData = res.data
          if (res.pagination) {
            this.totalCount = res.pagination.total
          } else {
            this.totalCount = res.data.length
          }
        }
        this.loading.set(false)
        this.cdr.markForCheck()
      },
      error: err => {
        console.error(err)
        this.loading.set(false)
        this.cdr.markForCheck()
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
    // console.log('Sort Event', event)

    this.loadDashboardData()
  }

  // Row Action

  onActionClicked(event: any) {
    // console.log(event)

    if (event.action === 'view') {
      //  console.log('Selected Attendance:', event.row)
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
      second: '2-digit',
      hour12: true
    })
  }
}
