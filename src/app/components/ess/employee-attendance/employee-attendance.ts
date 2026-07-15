import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, signal } from '@angular/core';
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
    ProgressBarModule
  ],
  providers: [MessageService],
  templateUrl: './employee-attendance.html',
  styleUrl: './employee-attendance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeAttendance implements OnInit, OnDestroy {
  readonly currentTime = signal<string>('');
  readonly currentDate = signal<string>('');

  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Attendance', icon: 'pi pi-clock', routerLink: '/ess/employee-attendance' }
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
    private readonly messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.updateClock();
    this.clockIntervalId = setInterval(() => this.updateClock(), 1000);
    this.loadAllData();
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

  checkIncompleteAttendance(): void {
    // We no longer show a toast here. 
    // The backend handles showing the missing attendance count in the Notifications dropdown automatically.
    this.attendanceService.checkIncompleteAttendance().subscribe();
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId) clearInterval(this.clockIntervalId);
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);
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
                const inTime = this.parseDbDate(r.swipe_in);
                const outTime = this.parseDbDate(r.swipe_out);
                if (inTime && outTime) {
                  return sum + (outTime.getTime() - inTime.getTime());
                }
                return sum;
              }, 0);

            this.startTimerTicks(record, previousCompletedMs);
            this.isActionLoading = false;
          } else {
            this.isSwipedIn.set(false);
            this.stopTimerTicks();

            const totalWorkMsToday = allTodayRecords
              .filter((r: any) => r.swipe_in && r.swipe_out)
              .reduce((sum: number, r: any) => {
                const inTime = this.parseDbDate(r.swipe_in);
                const outTime = this.parseDbDate(r.swipe_out);
                if (inTime && outTime) {
                  return sum + (outTime.getTime() - inTime.getTime());
                }
                return sum;
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

  async performSwipeIn(): Promise<void> {
    this.isActionLoading = true;

    if (typeof navigator !== 'undefined' && navigator.permissions) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (status.state === 'denied') {
          this.isActionLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Location Access Denied',
            detail: 'Location permission is blocked in your browser. Please reset location permissions and try again.'
          });
          return;
        }
      } catch (e) {
        console.warn('Permissions API query failed', e);
      }
    }

    const os_name = this.getOSName();
    const browser_name = this.getBrowserName();
    const device_name = this.getDeviceName();
    const coords = await this.getGeolocation();

    if (!coords.latitude || !coords.longitude) {
      this.isActionLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Location Required',
        detail: 'Location permission is mandatory to Swipe In. Please allow location access.'
      });
      return;
    }

    const ip_address = await this.getIpAddress();
    if (!ip_address) {
      this.isActionLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Network Error',
        detail: 'Unable to retrieve IP Address. Please check your connection.'
      });
      return;
    }

    const location_address = await this.getDetailedLocation(coords.latitude, coords.longitude);

    const payload: Partial<AttendanceRecord> = {
      os_name,
      browser_name,
      device_name,
      latitude: coords.latitude,
      longitude: coords.longitude,
      location_address: location_address,
      ip_address: ip_address,
      device_id: this.getDeviceId()
    };

    this.attendanceService.swipeIn(payload).subscribe({
      next: (res) => {
        this.isActionLoading = false;

        if (res.success) {
          const now = new Date().toISOString();

          const newRecord: any = {
            id: res.data?.id || res.data?.attendanceId,
            attendance_date: now.split('T')[0],
            swipe_in: now,
            swipe_out: null,
            total_work_minutes: 0,
            attendance_status: 'PRESENT',
            notes: '',
            os_name,
            browser_name,
            device_name,
            latitude: coords.latitude,
            longitude: coords.longitude,
            location_address: payload.location_address,
            ip_address: ip_address
          };

          this.activeRecord.set(newRecord);
          this.isSwipedIn.set(true);
          this.duration.set('00:00:00');
          this.shiftProgressPercentage.set(0);

          const previousCompletedMs = this.allTodayRecords
            .filter((r: any) => r.swipe_in && r.swipe_out)
            .reduce((sum: number, r: any) => {
              const inTime = this.parseDbDate(r.swipe_in);
              const outTime = this.parseDbDate(r.swipe_out);
              if (inTime && outTime) {
                return sum + (outTime.getTime() - inTime.getTime());
              }
              return sum;
            }, 0);

          this.buildTodayTimeline(newRecord);
          this.startTimerTicks(newRecord, previousCompletedMs);

          this.messageService.add({
            severity: 'success',
            summary: 'Checked In',
            detail: 'Swiped in successfully!'
          });

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

    if (typeof navigator !== 'undefined' && navigator.permissions) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (status.state === 'denied') {
          this.isActionLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Location Access Denied',
            detail: 'Location permission is blocked in your browser. Please reset location permissions and try again.'
          });
          return;
        }
      } catch (e) {
        console.warn('Permissions API query failed', e);
      }
    }

    const os_name = this.getOSName();
    const browser_name = this.getBrowserName();
    const device_name = this.getDeviceName();
    const coords = await this.getGeolocation();

    if (!coords.latitude || !coords.longitude) {
      this.isActionLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Location Required',
        detail: 'Location permission is mandatory to Swipe Out. Please allow location access.'
      });
      return;
    }

    const ip_address = await this.getIpAddress();
    if (!ip_address) {
      this.isActionLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Network Error',
        detail: 'Unable to retrieve IP Address. Please check your connection.'
      });
      return;
    }

    const location_address = await this.getDetailedLocation(coords.latitude, coords.longitude);

    const payload = {
      notes: this.swipeOutNote,
      os_name,
      browser_name,
      device_name,
      latitude: coords.latitude,
      longitude: coords.longitude,
      location_address: location_address,
      ip_address: ip_address,
      device_id: this.getDeviceId()
    };

    this.attendanceService.swipeOut(payload).subscribe({
      next: (res) => {
        this.isActionLoading = false;

        if (res.success) {
          const current = this.activeRecord();
          const now = new Date().toISOString();

          if (current) {
            const updatedRecord: any = {
              ...current,
              swipe_out: now,
              notes: this.swipeOutNote
            };

            this.activeRecord.set(updatedRecord);
          }

          this.isSwipedIn.set(false);
          this.stopTimerTicks();

          this.messageService.add({
            severity: 'success',
            summary: 'Checked Out',
            detail: 'Swiped out successfully!'
          });

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
    const targetMs = 9 * 60 * 60 * 1000; // 9 hours
    const percent = (workMs / targetMs) * 100;
    this.shiftProgressPercentage.set(Math.min(100, Math.max(0, parseFloat(percent.toFixed(1)))));
  }

  private startTimerTicks(record: AttendanceRecord, previousCompletedMs: number = 0): void {
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);

    const swipeInTime = this.parseDbDate(record.swipe_in);
    if (!swipeInTime) return;

    this.timerIntervalId = setInterval(() => {
      const now = new Date();
      const currentSessionWorkElapsed = now.getTime() - swipeInTime.getTime();
      const workMs = Math.max(0, previousCompletedMs + currentSessionWorkElapsed);
      this.duration.set(this.formatMsToHMS(workMs));
      this.updateProgressPercentage(workMs);
    }, 1000);
  }

  private stopTimerTicks(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  private buildTodayTimeline(records: AttendanceRecord[] | AttendanceRecord | null): void {
    const timeline: Array<{ type: string; time: string; timestamp: number; icon: string; colorClass: string }> = [];

    if (!records) {
      this.todayPunches.set([]);
      return;
    }

    const recordsList = Array.isArray(records) ? records : [records];

    recordsList.forEach(record => {
      if (record.swipe_in) {
        const dt = this.parseDbDate(record.swipe_in);
        const loc = record.swipe_in_address || record.location_address;
        timeline.push({
          type: loc ? `Swipe In (${loc})` : 'Swipe In',
          time: this.formatDateTimeToTime(record.swipe_in),
          timestamp: dt ? dt.getTime() : 0,
          icon: 'pi pi-sign-in',
          colorClass: 'border-emerald-500 bg-emerald-50 text-emerald-600'
        });
      }
      if (record.swipe_out) {
        const dt = this.parseDbDate(record.swipe_out);
        const loc = record.swipe_out_address;
        const typeStr = record.notes
          ? `Swipe Out (${record.notes})${loc ? ' @ ' + loc : ''}`
          : `Swipe Out${loc ? ' @ ' + loc : ''}`;
        timeline.push({
          type: typeStr,
          time: this.formatDateTimeToTime(record.swipe_out),
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

  private parseDbDate(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    const normalized = dateStr.replace(' ', 'T');
    const parsed = new Date(normalized);
    return isNaN(parsed.getTime()) ? new Date(dateStr) : parsed;
  }

  private formatMsToHMS(ms: number): string {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return [hours, minutes, seconds].map(v => v < 10 ? '0' + v : v).join(':');
  }

  private formatDateTimeToTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    const date = this.parseDbDate(dateStr);
    if (!date) return '-';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) return 'Opera';
    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    if (userAgent.indexOf('Edge') > -1 || userAgent.indexOf('Edg') > -1) return 'Edge';
    if (userAgent.indexOf('Trident') > -1) return 'Internet Explorer';
    return 'Browser';
  }

  private getOSName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Windows') > -1) return 'Windows';
    if (userAgent.indexOf('Macintosh') > -1 || userAgent.indexOf('Mac OS') > -1) return 'macOS';
    if (userAgent.indexOf('Linux') > -1) return 'Linux';
    if (userAgent.indexOf('Android') > -1) return 'Android';
    if (userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) return 'iOS';
    return 'Operating System';
  }

  private getDeviceName(): string {
    const userAgent = navigator.userAgent;
    const isMobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent);
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 768;
    const isMobile = isMobileRegex || isSmallScreen;
    return isMobile ? 'Mobile' : 'Laptop';
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
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('High accuracy geolocation failed or timed out. Trying standard resolution...', error);
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            () => {
              resolve({ latitude: null, longitude: null });
            },
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
    if (!this.officeLocation) return;

    // Check if we run on browser
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const mapElement = document.getElementById('attendance-map');
        if (!mapElement) return;

        // Leaflet setup
        this.map = L.map(mapElement).setView([this.officeLocation!.latitude, this.officeLocation!.longitude], 18);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(this.map);

        this.officeCircle = L.circle([this.officeLocation!.latitude, this.officeLocation!.longitude], {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.2,
          radius: this.officeLocation!.radius
        }).addTo(this.map);

        this.refreshMapLocation();
      }, 100);
    }
  }

  async refreshMapLocation(): Promise<void> {
    if (!this.map || !this.officeLocation) return;

    this.isRefreshingLocation = true;
    try {
      const coords = await this.getGeolocation();
      if (coords.latitude && coords.longitude) {
        const R = 6371e3; // Radius of the earth in m
        const lat1 = this.officeLocation.latitude * (Math.PI / 180);
        const lon1 = this.officeLocation.longitude * (Math.PI / 180);
        const lat2 = coords.latitude * (Math.PI / 180);
        const lon2 = coords.longitude * (Math.PI / 180);
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        const isInside = distance <= this.officeLocation.radius;
        const markerColor = isInside ? '#10b981' : '#f43f5e'; // Emerald or Rose

        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style='background-color:${markerColor}; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);'></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        if (this.employeeMarker) {
          this.employeeMarker.setLatLng([coords.latitude, coords.longitude]);
          this.employeeMarker.setIcon(icon);
        } else {
          this.employeeMarker = L.marker([coords.latitude, coords.longitude], { icon }).addTo(this.map);
        }

        if (isInside) {
          this.employeeMarker.bindPopup('You are within the allowed radius.').openPopup();
        } else {
          this.employeeMarker.bindPopup(`You Are Outside The Allowed Radius (${Math.round(distance)}m).`).openPopup();
        }

        const group = L.featureGroup([this.employeeMarker, this.officeCircle]);
        this.map.fitBounds(group.getBounds().pad(0.1));
      }
    } finally {
      this.isRefreshingLocation = false;
    }
  }

}