import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ProgressBarModule } from 'primeng/progressbar';
import {
  AttendanceService,
  AttendanceRecord,
  DashboardSummary
} from '../../../shared/services/attendance.service';
import { TableTemplate, TableColumn } from '../../../shared/ui/table-template/table-template';
import { parseLocalDatetime, formatLocalTime } from '../../../shared/utils/date-utils';
import * as L from 'leaflet';

@Component({
  selector: 'app-employee-attendance',
  standalone: true,
  imports: [
    CommonModule,
    AppBreadcrumb,
    DialogModule,
    ToastModule,
    FormsModule,
    ProgressBarModule,
    TableTemplate
  ],
  providers: [MessageService],
  templateUrl: './employee-attendance.html',
  styleUrl: './employee-attendance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeAttendance implements OnInit, OnDestroy {
  readonly Math = Math;

  readonly currentTime = signal<string>('');
  readonly currentDate = signal<string>('');

  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Attendance', icon: 'pi pi-clock', routerLink: '/ess/employee-attendance' }
  ];

  columns: TableColumn[] = [
    { key: 'attendance_date', header: 'Date', isSortable: true, pipe: 'date', pipeArgs: 'mediumDate' },
    { key: 'swipe_in', header: 'Swipe In', isSortable: true },
    { key: 'swipe_out', header: 'Swipe Out', isSortable: true },
    { key: 'total_work_minutes', header: 'Work Hours', isSortable: true },
    { key: 'attendance_status', header: 'Status', isSortable: true },
    { key: 'location_address', header: 'Location / Device', isSortable: false },
    { key: 'notes', header: 'Notes', isSortable: false }
  ];

  readonly isSwipedIn = signal<boolean>(false);
  readonly activeRecord = signal<AttendanceRecord | null>(null);
  readonly todayPunches = signal<Array<{ type: string; time: string; icon: string; colorClass: string }>>([]);

  readonly duration = signal<string>('00:00:00');
  readonly shiftProgressPercentage = signal<number>(0);

  readonly dashboardSummary = signal<DashboardSummary>({
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    halfDays: 0,
    totalWorkingMinutes: 0
  });

  readonly historyRecords = signal<AttendanceRecord[]>([]);
  readonly historyTotal = signal<number>(0);
  readonly historyPage = signal<number>(1);
  readonly historyLimit = signal<number>(10);
  readonly historyTotalPages = signal<number>(1);
  readonly historyLoading = signal<boolean>(false);
  readonly historySearch = signal<string>('');

  isActionLoading = false;
  swipeOutDialogVisible = false;
  swipeOutNote = '';
  isRefreshingLocation = false;
  officeLocation: { latitude: number, longitude: number, radius: number } | null = null;
  map: any = null;
  officeCircle: any = null;
  employeeMarker: any = null;

  private allTodayRecords: AttendanceRecord[] = [];
  private clockIntervalId: any;
  private timerIntervalId: any;

  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly messageService: MessageService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.updateClock();
    this.clockIntervalId = setInterval(() => this.updateClock(), 1000);
    this.loadAllData();
    this.loadHistory(1, 10);
    this.checkIncompleteAttendance();

    this.attendanceService.getOfficeLocation().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.office_latitude) {
          this.officeLocation = {
            latitude: parseFloat(res.data.office_latitude),
            longitude: parseFloat(res.data.office_longitude),
            radius: res.data.allowed_radius
          };
          this.initMap();
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId) clearInterval(this.clockIntervalId);
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);
  }

  loadHistory(page: number = 1, limit: number = 10, search: string = ''): void {
    this.historyLoading.set(true);
    this.historyPage.set(page);
    this.historyLimit.set(limit);
    this.historySearch.set(search);

    this.attendanceService.getHistory(page, limit, search).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.historyRecords.set(res.data);
          if (res.pagination) {
            this.historyTotal.set(res.pagination.total);
            this.historyTotalPages.set(res.pagination.totalPages || Math.ceil(res.pagination.total / limit) || 1);
          } else {
            this.historyTotal.set(res.data.length);
            this.historyTotalPages.set(Math.ceil(res.data.length / limit) || 1);
          }
        } else {
          this.historyRecords.set([]);
          this.historyTotal.set(0);
          this.historyTotalPages.set(1);
        }
        this.historyLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.historyRecords.set([]);
        this.historyLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onHistorySearch(search: string): void {
    this.loadHistory(1, this.historyLimit(), search);
  }

  onHistoryPageChange(newPage: number): void {
    this.loadHistory(newPage, this.historyLimit(), this.historySearch());
  }

  onHistoryLimitChange(newLimit: number): void {
    this.loadHistory(1, newLimit, this.historySearch());
  }

  formatWorkHours(minutes: number | null): string {
    if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) return '-';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  }

  formatDisplayTime(dateStr: string | null): string {
    return formatLocalTime(dateStr);
  }

  checkIncompleteAttendance(): void {
    this.attendanceService.checkIncompleteAttendance().subscribe();
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    this.currentDate.set(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }

  loadAllData(): void {
    this.isActionLoading = true;

    this.attendanceService.getTodayRecord().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const record = res.data;
          const allTodayRecords = (res as any).allToday || (record ? [record] : []);
          this.allTodayRecords = allTodayRecords;
          this.activeRecord.set(record);

          if (record.swipe_in && !record.swipe_out) {
            this.isSwipedIn.set(true);
            this.buildTodayTimeline(allTodayRecords);

            const previousCompletedMs = allTodayRecords
              .filter((r: any) => r.id !== record.id && r.swipe_in && r.swipe_out)
              .reduce((sum: number, r: any) => {
                const inTime = parseLocalDatetime(r.swipe_in);
                const outTime = parseLocalDatetime(r.swipe_out);
                return (inTime && outTime) ? sum + (outTime.getTime() - inTime.getTime()) : sum;
              }, 0);

            this.startTimerTicks(record, previousCompletedMs);
            this.isActionLoading = false;
          } else {
            this.isSwipedIn.set(false);
            this.stopTimerTicks();

            const totalWorkMsToday = allTodayRecords
              .filter((r: any) => r.swipe_in && r.swipe_out)
              .reduce((sum: number, r: any) => {
                const inTime = parseLocalDatetime(r.swipe_in);
                const outTime = parseLocalDatetime(r.swipe_out);
                return (inTime && outTime) ? sum + (outTime.getTime() - inTime.getTime()) : sum;
              }, 0);

            if (totalWorkMsToday > 0) {
              this.duration.set(this.formatMsToHMS(totalWorkMsToday));
              this.updateProgressPercentage(totalWorkMsToday);
            } else {
              this.duration.set('00:00:00');
              this.shiftProgressPercentage.set(0);
            }

            this.buildTodayTimeline(allTodayRecords);
            this.isActionLoading = false;
          }
        } else {
          this.resetTodayState();
          this.isActionLoading = false;
        }
      },
      error: (err) => {
        this.resetTodayState();
        this.isActionLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: err.error?.message || 'Failed to load today status.'
        });
      }
    });

    this.attendanceService.getDashboardSummary().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dashboardSummary.set(res.data);
        }
      }
    });
  }

  private async collectSwipeContext(): Promise<{ payload: Partial<AttendanceRecord>; coords: { latitude: number; longitude: number } } | null> {
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (status.state === 'denied') {
          this.messageService.add({
            severity: 'error',
            summary: 'Location Access Denied',
            detail: 'Location permission is blocked in your browser. Please reset location permissions and try again.'
          });
          return null;
        }
      } catch (e) { }
    }

    const coords = await this.getGeolocation();
    if (!coords.latitude || !coords.longitude) {
      this.messageService.add({
        severity: 'error',
        summary: 'Location Required',
        detail: 'Location permission is mandatory to Swipe. Please allow location access.'
      });
      return null;
    }

    const ip_address = await this.getIpAddress();
    if (!ip_address) {
      this.messageService.add({
        severity: 'error',
        summary: 'Network Error',
        detail: 'Unable to retrieve IP Address. Please check your connection.'
      });
      return null;
    }

    const location_address = await this.getDetailedLocation(coords.latitude, coords.longitude);
    return {
      coords: { latitude: coords.latitude, longitude: coords.longitude },
      payload: {
        os_name: this.getOSName(),
        browser_name: this.getBrowserName(),
        device_name: this.getDeviceName(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        location_address,
        ip_address,
        device_id: this.getDeviceId()
      }
    };
  }

  async performSwipeIn(): Promise<void> {
    this.isActionLoading = true;
    const ctx = await this.collectSwipeContext();

    if (!ctx) {
      this.isActionLoading = false;
      return;
    }

    this.attendanceService.swipeIn(ctx.payload).subscribe({
      next: (res) => {
        this.isActionLoading = false;
        if (res.success) {
          const now = this.getLocalDateTimeISOString();
          const newRecord: any = {
            id: res.data?.id || res.data?.attendanceId,
            attendance_date: now.split('T')[0],
            swipe_in: now,
            swipe_out: null,
            total_work_minutes: 0,
            attendance_status: 'PRESENT',
            notes: '',
            ...ctx.payload
          };

          this.activeRecord.set(newRecord);
          this.isSwipedIn.set(true);
          this.duration.set('00:00:00');
          this.shiftProgressPercentage.set(0);

          const previousCompletedMs = this.allTodayRecords
            .filter((r: any) => r.swipe_in && r.swipe_out)
            .reduce((sum: number, r: any) => {
              const inTime = parseLocalDatetime(r.swipe_in);
              const outTime = parseLocalDatetime(r.swipe_out);
              return (inTime && outTime) ? sum + (outTime.getTime() - inTime.getTime()) : sum;
            }, 0);

          this.buildTodayTimeline(newRecord);
          this.startTimerTicks(newRecord, previousCompletedMs);
          this.messageService.add({ severity: 'success', summary: 'Checked In', detail: 'Swiped in successfully!' });
          this.loadAllData();
        }
      },
      error: (err) => {
        this.isActionLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Swipe In Failed',
          detail: err.error?.message || 'Already checked in or server error.'
        });
        this.loadAllData();
      }
    });
  }

  confirmSwipeOut(): void {
    this.swipeOutNote = '';
    this.swipeOutDialogVisible = true;
  }

  async performSwipeOut(): Promise<void> {
    this.swipeOutDialogVisible = false;
    this.isActionLoading = true;
    const ctx = await this.collectSwipeContext();

    if (!ctx) {
      this.isActionLoading = false;
      return;
    }

    const payload = { ...ctx.payload, notes: this.swipeOutNote };

    this.attendanceService.swipeOut(payload).subscribe({
      next: (res) => {
        this.isActionLoading = false;
        if (res.success) {
          const current = this.activeRecord();
          const now = this.getLocalDateTimeISOString();
          if (current) {
            this.activeRecord.set({ ...current, swipe_out: now, notes: this.swipeOutNote });
          }

          this.isSwipedIn.set(false);
          this.stopTimerTicks();
          this.messageService.add({ severity: 'success', summary: 'Checked Out', detail: 'Swiped out successfully!' });
          this.loadAllData();
        }
      },
      error: (err) => {
        this.isActionLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Swipe Out Failed',
          detail: err.error?.message || 'Server error.'
        });
        this.loadAllData();
      }
    });
  }

  private resetTodayState(): void {
    this.activeRecord.set(null);
    this.isSwipedIn.set(false);
    this.todayPunches.set([]);
    this.duration.set('00:00:00');
    this.shiftProgressPercentage.set(0);
    this.stopTimerTicks();
  }

  private updateProgressPercentage(workMs: number): void {
    const targetMs = 9 * 60 * 60 * 1000;
    const percent = (workMs / targetMs) * 100;
    this.shiftProgressPercentage.set(Math.min(100, Math.max(0, parseFloat(percent.toFixed(1)))));
  }

  private startTimerTicks(record: AttendanceRecord, previousCompletedMs: number = 0): void {
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);

    const swipeInTime = parseLocalDatetime(record.swipe_in);
    if (!swipeInTime) return;

    const tick = () => {
      const now = new Date();
      const currentSessionWorkElapsed = now.getTime() - swipeInTime.getTime();
      const workMs = Math.max(0, previousCompletedMs + (currentSessionWorkElapsed > 0 ? currentSessionWorkElapsed : 0));
      this.duration.set(this.formatMsToHMS(workMs));
      this.updateProgressPercentage(workMs);
    };

    tick();
    this.timerIntervalId = setInterval(tick, 1000);
  }

  private stopTimerTicks(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  private buildTodayTimeline(records: AttendanceRecord[] | AttendanceRecord | null): void {
    if (!records) {
      this.todayPunches.set([]);
      return;
    }

    const recordsList = Array.isArray(records) ? records : [records];
    const timeline: Array<{ type: string; time: string; timestamp: number; icon: string; colorClass: string }> = [];

    recordsList.forEach(record => {
      if (record.swipe_in) {
        const dt = parseLocalDatetime(record.swipe_in);
        timeline.push({
          type: 'Swipe In',
          time: formatLocalTime(record.swipe_in),
          timestamp: dt ? dt.getTime() : 0,
          icon: 'pi pi-sign-in',
          colorClass: 'border-emerald-500 bg-emerald-50 text-emerald-600'
        });
      }
      if (record.swipe_out) {
        const dt = parseLocalDatetime(record.swipe_out);
        timeline.push({
          type: record.notes ? `Swipe Out (${record.notes})` : 'Swipe Out',
          time: formatLocalTime(record.swipe_out),
          timestamp: dt ? dt.getTime() : 0,
          icon: 'pi pi-sign-out',
          colorClass: 'border-rose-500 bg-rose-50 text-rose-600'
        });
      }
    });

    timeline.sort((a, b) => b.timestamp - a.timestamp);
    this.todayPunches.set(timeline.map(item => ({
      type: item.type,
      time: item.time,
      icon: item.icon,
      colorClass: item.colorClass
    })));
  }

  private getLocalDateTimeISOString(date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private formatMsToHMS(ms: number): string {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return [hours, minutes, seconds].map(v => v < 10 ? '0' + v : v).join(':');
  }

  private getBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge') || ua.includes('Edg')) return 'Edge';
    return 'Browser';
  }

  private getOSName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Macintosh') || ua.includes('Mac OS')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Operating System';
  }

  private getDeviceName(): string {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
    const isIpadOS = navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform);
    return (isMobileRegex || isIpadOS) ? 'Mobile' : 'Laptop';
  }

  private getDeviceId(): string {
    if (typeof localStorage === 'undefined') return 'unknown-device';
    let deviceId = localStorage.getItem('staffhub_device_id');
    if (!deviceId) {
      deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('staffhub_device_id', deviceId);
    }
    return deviceId;
  }

  private getGeolocation(): Promise<{ latitude: number | null; longitude: number | null }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => resolve({ latitude: null, longitude: null }),
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
          );
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }

  private async getIpAddress(): Promise<string | null> {
    try {
      const res = await fetch('https://api.ipify.org?format=json').then(r => r.json());
      return res.ip || null;
    } catch {
      return null;
    }
  }

  private async getDetailedLocation(lat: number, lon: number): Promise<string> {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      let displayName = data.display_name || `Lat: ${lat.toFixed(4)}, Long: ${lon.toFixed(4)}`;
      if (displayName.includes('110059') && displayName.includes('Patel Nagar')) {
        displayName = displayName.replace('Patel Nagar', 'Uttam Nagar');
      }
      return displayName;
    } catch {
      return `Lat: ${lat.toFixed(4)}, Long: ${lon.toFixed(4)}`;
    }
  }

  private initMap(): void {
    if (!this.officeLocation || typeof document === 'undefined') return;

    setTimeout(() => {
      const mapElement = document.getElementById('attendance-map');
      if (!mapElement) return;

      this.map = L.map(mapElement).setView([this.officeLocation!.latitude, this.officeLocation!.longitude], 18);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(this.map);

      this.officeCircle = L.circle([this.officeLocation!.latitude, this.officeLocation!.longitude], {
        color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, radius: this.officeLocation!.radius
      }).addTo(this.map);

      this.refreshMapLocation();
    }, 100);
  }

  async refreshMapLocation(): Promise<void> {
    if (!this.map || !this.officeLocation) return;
    this.isRefreshingLocation = true;
    try {
      const coords = await this.getGeolocation();
      if (coords.latitude && coords.longitude) {
        const distance = this.calculateDistanceInMeters(
          this.officeLocation.latitude, this.officeLocation.longitude,
          coords.latitude, coords.longitude
        );

        const isInside = distance <= this.officeLocation.radius;
        const markerColor = isInside ? '#10b981' : '#f43f5e';
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style='background-color:${markerColor}; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);'></div>`,
          iconSize: [16, 16], iconAnchor: [8, 8]
        });

        if (this.employeeMarker) {
          this.employeeMarker.setLatLng([coords.latitude, coords.longitude]);
          this.employeeMarker.setIcon(icon);
        } else {
          this.employeeMarker = L.marker([coords.latitude, coords.longitude], { icon }).addTo(this.map);
        }

        const msg = isInside ? 'You are within the allowed radius.' : `You Are Outside The Allowed Radius (${Math.round(distance)}m).`;
        this.employeeMarker.bindPopup(msg).openPopup();

        const group = L.featureGroup([this.employeeMarker, this.officeCircle]);
        this.map.fitBounds(group.getBounds().pad(0.1));
      }
    } finally {
      this.isRefreshingLocation = false;
    }
  }

  private calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const rad1 = lat1 * (Math.PI / 180);
    const rad2 = lat2 * (Math.PI / 180);
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad1) * Math.cos(rad2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }
}