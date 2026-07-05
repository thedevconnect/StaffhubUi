import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule
} from '@angular/forms';

import { AppBreadcrumb } from '../../../../shared/ui/breadcrumb/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';

import { MessageService, ConfirmationService } from 'primeng/api';
import { AttendanceService } from '../../../../shared/services/attendance.service';
import {
  TableColumn,
  TableTemplate
} from '../../../../shared/ui/table-template/table-template';

@Component({
  selector: 'app-holiday-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,

    CardModule,
    AppBreadcrumb,
    ButtonModule,
    TooltipModule,
    TableModule,
    DialogModule,
    DrawerModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,

    TableTemplate
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './holiday-list.html',
  styleUrl: './holiday-list.scss',
})
export class HolidayList implements OnInit {
  pageNo = 1;
  pageSize = 10;
  totalCount = 0;
  searchText = '';

  holiday_calendar: any[] = [];

  showAssetDrawer = false;
  isEditMode = false;

  assetForm!: FormGroup;
  showDialog = false;
  isHoliday = false;
  loading = signal(false);

  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Holiday List', icon: 'pi pi-clock', routerLink: '/ess/holiday-list' }
  ];

  columns: TableColumn[] = [
    { key: 'image', header: 'Image', isVisible: true, isSortable: false },
    { key: 'holiday_date', header: 'Holiday Date', isVisible: true, isSortable: true, pipe: 'date', pipeArgs: 'dd-MM-yyyy' },
    { key: 'holiday_name', header: 'Holiday Name', isVisible: true, isSortable: true },
    { key: 'holiday_type', header: 'Holiday Type', isVisible: true, isSortable: true },
    { key: 'region', header: 'Region', isVisible: true, isSortable: true },
    { key: 'is_active', header: 'Status', isVisible: true, isSortable: true, formatter: (val: any) => val === 1 ? 'Active' : 'Inactive' },
  ];


  constructor(
    private readonly user: AttendanceService,
    private readonly fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadAllData();
  }

  initForm(): void {
    this.assetForm = this.fb.group({
      EmployeeId: ['', Validators.required],
      Department: ['', Validators.required],
      AssetType: ['', Validators.required],
      AssetName: ['', Validators.required],
      AssignedDate: ['', Validators.required],
      OfficeLocationId: [''],
      OfficeLocation: [''],
      DeptRemarks: [''],
      EmployeeRemarks: ['']
    });
  }

  getHolidayImage(row: any): string {
    if (row.image) {
      return row.image;
    }
    const name = (row.holiday_name || '').toLowerCase().trim();
    let fileName = 'new_year.jpg'; // fallback default

    if (name.includes('new year')) {
      fileName = 'new_year.jpg';
    } else if (name.includes('republic')) {
      fileName = 'republic_day.jpg';
    } else if (name.includes('independence')) {
      fileName = 'independence-day.jpg';
    } else if (name.includes('christmas')) {
      fileName = 'christmas.jpg';
    } else if (name.includes('diwali') || name.includes('deepavali')) {
      fileName = 'diwali.jpg';
    } else if (name.includes('dussehra') || name.includes('vijayadashami') || name.includes('durga puja') || name.includes('dussera')) {
      fileName = 'dussehra.jpg';
    } else if (name.includes('holi')) {
      fileName = 'holi.jpg';
    } else if (name.includes('shivratri') || name.includes('shiva') || name.includes('shivaratri')) {
      fileName = 'maha-shivratri.jpg';
    } else if (name.includes('gandhi') || name.includes('jayanti') && name.includes('gandhi')) {
      fileName = 'gandhi-jayanti.jpg';
    } else if (name.includes('milad') || name.includes('id-e-milad')) {
      fileName = 'Eid-e-milad.jpg';
    } else if (name.includes('fitr') || name.includes('eid-ul-fitr') || name.includes('ramadan')) {
      fileName = 'eid-ul-fitr.jpg';
    } else if (name.includes('good friday') || name.includes('good-friday')) {
      fileName = 'good-friday.jpg';
    } else if (name.includes('buddha') || name.includes('purnima')) {
      fileName = 'buddha-purnima.jpg';
    } else if (name.includes('ganesh') || name.includes('chaturthi')) {
      fileName = 'ganesh-chaturthi.jpg';
    } else if (name.includes('janmashtami') || name.includes('janamashtami') || name.includes('krishna')) {
      fileName = 'janamashtami.jpg';
    } else if (name.includes('raksha') || name.includes('rakhi')) {
      fileName = 'raksha-bandhan.jpg';
    } else if (name.includes('pongal')) {
      fileName = 'Pongal.jpg';
    } else if (name.includes('lohri')) {
      fileName = 'Lohri.jpg';
    } else if (name.includes('sankranti') || name.includes('makar')) {
      fileName = 'makar_sankranti.jpg';
    } else if (name.includes('bhai duj') || name.includes('bhai-duj')) {
      fileName = 'bhai-duj.jpg';
    } else if (name.includes('chhat') || name.includes('chhath')) {
      fileName = 'chhat.jpg';
    } else if (name.includes('shivaji')) {
      fileName = 'chhatrapati-shivaji-jayanti.jpg';
    } else if (name.includes('dhanteras')) {
      fileName = 'dhanteras.jpg';
    } else if (name.includes('govardhan')) {
      fileName = 'govardhan.jpg';
    } else if (name.includes('gudi padwa') || name.includes('gudi-padwa')) {
      fileName = 'gudi-padwa.jpg';
    } else if (name.includes('hanuman')) {
      fileName = 'hanuman_jayanti.jpg';
    } else if (name.includes('hartalika')) {
      fileName = 'hartalika-teej.jpg';
    } else if (name.includes('haryali')) {
      fileName = 'haryali-teej.jpg';
    } else if (name.includes('hazrat ali')) {
      fileName = 'hazrat_ali_jayanti.jpg';
    } else if (name.includes('id-ul-zuha') || name.includes('bakrid') || name.includes('adha')) {
      fileName = 'id-ul-zuha.jpg';
    } else if (name.includes('jamat')) {
      fileName = 'jamat-ul-vida.jpg';
    } else if (name.includes('karwa chauth') || name.includes('karva')) {
      fileName = 'karwa-chauth.jpg';
    } else if (name.includes('lakshmi') || name.includes('laxmi')) {
      fileName = 'lakshmi-puja.jpg';
    } else if (name.includes('bihu')) {
      fileName = 'magh_bihu.jpg';
    } else if (name.includes('saptami')) {
      fileName = 'maha-saptami.jpg';
    } else if (name.includes('agrasen')) {
      fileName = 'maharaja-agrasen-jayanti.jpg';
    } else if (name.includes('muharram')) {
      fileName = 'muharram.jpg';
    } else if (name.includes('nag panchami') || name.includes('nag-panchami')) {
      fileName = 'nag-panchami.jpg';
    } else if (name.includes('onam')) {
      fileName = 'onam.jpg';
    } else if (name.includes('parshuram')) {
      fileName = 'parshuram-jayanti.jpg';
    } else if (name.includes('tagore')) {
      fileName = 'rabindranath-tagore-jayanti.jpg';
    } else if (name.includes('raja sankaranti') || name.includes('raja-sankranti')) {
      fileName = 'raja-sankranti.jpg';
    } else if (name.includes('ram navami') || name.includes('ram-navami')) {
      fileName = 'ram-navami.jpg';
    } else if (name.includes('kabir')) {
      fileName = 'sant-kabir-jayanti.jpg';
    } else if (name.includes('patel')) {
      fileName = 'sardar-patel-jayanti.jpg';
    } else if (name.includes('udham')) {
      fileName = 'sardar-udham-singh.jpg';
    } else if (name.includes('sharad purnima')) {
      fileName = 'sharad-purnima.jpg';
    } else if (name.includes('subhash') || name.includes('bose') || name.includes('baji')) {
      fileName = 'subhash_chadra_bose_jayanti.jpg';
    } else if (name.includes('ugadi')) {
      fileName = 'ugadi.jpg';
    } else if (name.includes('vaisakhi') || name.includes('baisakhi')) {
      fileName = 'vaisakhi.jpg';
    } else if (name.includes('valmiki')) {
      fileName = 'valmiki-jayanti.jpg';
    } else if (name.includes('vasant') || name.includes('basant')) {
      fileName = 'vasant-panchami.jpg';
    } else if (name.includes('vishwakarma')) {
      fileName = 'vishwakarma-puja.jpg';
    } else if (name.includes('gurunanak') || name.includes('guru nanak')) {
      fileName = 'gurunanak-jayanti.jpg';
    } else if (name.includes('arjan')) {
      fileName = 'guru-arjan-dev-ji-martyrdom-day.jpg';
    } else if (name.includes('gobind')) {
      fileName = 'guru-gobind-singh-jayant.jpg';
    } else if (name.includes('hargobind')) {
      fileName = 'guru-hargobind-ji-birthday.jpg';
    } else if (name.includes('teg bahadur') || name.includes('tegh bahadur')) {
      fileName = 'guru-teg-bahadur.png';
    } else if (name.includes('ravidas')) {
      fileName = 'guru_ravidas_jayanti.jpg';
    } else if (name.includes('angad')) {
      fileName = 'guru-angad-dev-ji-birthday.jpg';
    }

    return `assets/holidays/${fileName}`;
  }

  loadDashboardData(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading.set(true);

    this.user.getHolidays(this.pageNo, this.pageSize, this.searchText).subscribe({
      next: (res: any) => {
        this.holiday_calendar = res?.holiday_calendar ?? [];
        this.totalCount = res?.totalCount ?? this.holiday_calendar.length;
        this.loading.set(false);

        console.log('Holiday Calendar:', this.holiday_calendar);
      },
      error: (err) => {
        console.error('Holiday API Error:', err);
        this.holiday_calendar = [];
        this.totalCount = 0;
        this.loading.set(false);
      }
    });
  }

  openAddDrawer(): void {
    this.showAssetDrawer = true;
    this.isEditMode = false;
    this.assetForm.reset();
  }

  saveAsset(): void {
    if (this.assetForm.invalid) {
      this.assetForm.markAllAsTouched();
      return;
    }

    console.log('Form Value:', this.assetForm.value);

    this.showAssetDrawer = false;
    this.isEditMode = false;
    this.assetForm.reset();
  }

  onPageChange(newPage: number): void {
    this.pageNo = newPage;
    this.loadAllData();
  }

  onSearchChange(value: string): void {
    this.searchText = value;
    this.pageNo = 1;
    this.loadAllData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageNo = 1;
    this.loadAllData();
  }

  onSortChange(event: any): void {
    console.log('Sort Event', event);
  }


}