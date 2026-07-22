import { Component, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { Breadcrumb } from 'primeng/breadcrumb';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { ExpenseService } from '../../../shared/services/expense.service';
import { AuthService } from '../../../shared/services/services/auth.service';
import { UserService } from '../../../shared/services/user-service';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';

interface DetailRow {
  type: string;
  travelBy: string;
  from: string;
  to: string;
  fromDate: any;
  toDate: any;
  amount: number;
  details: string;
  attachmentName?: string;
  attachmentUrl?: string;
}

@Component({
  selector: 'app-expense-management',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    Breadcrumb,
    ReactiveFormsModule,
    FormsModule,
    SelectModule,
    DatePickerModule,
    ToastModule,
    ButtonModule,
    DrawerModule,
    DialogModule,
    TableModule,
    FloatLabelModule,
    InputTextModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './expense-management.html',
  styleUrl: './expense-management.scss'
})
export class ExpenseManagement implements OnInit {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private expenseService = inject(ExpenseService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private employeeService = inject(EmployeeManagementService);

  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Expense Requests', icon: 'pi pi-wallet', routerLink: '/ess/expense-management' }
  ];

  drawerVisible = false;
  viewDialogVisible = false;
  receiptModalVisible = false;

  expenseForm!: FormGroup;
  detailForm!: FormGroup;
  lodgingForm!: FormGroup;
  foodForm!: FormGroup;
  laundryForm!: FormGroup;
  otherForm!: FormGroup;

  detailsExpanded = true;
  otherDetailsExpanded = true;

  activeTab = 'Fare/Conveyance';
  otherDetailsTabs = ['Fare/Conveyance', 'Lodging', 'Food', 'Laundry', 'Other'];

  submitForOptions = [
    { label: 'Tour Reimbursement', value: 'Tour Reimbursement' },
    { label: 'Local Conveyance', value: 'Local Conveyance' },
    { label: 'Client Visit / Meeting', value: 'Client Visit / Meeting' },
    { label: 'Outstation / Site Work', value: 'Outstation / Site Work' },
    { label: 'Other Business Expense', value: 'Other Business Expense' }
  ];

  travelByOptions = [
    { label: 'Flight', value: 'Flight' },
    { label: 'Train', value: 'Train' },
    { label: 'Bus', value: 'Bus' },
    { label: 'Taxi / Cab', value: 'Taxi / Cab' },
    { label: 'Own Vehicle', value: 'Own Vehicle' }
  ];

  statesList: { label: string; value: string }[] = [
    { label: 'Delhi (NCR)', value: 'Delhi' },
    { label: 'Haryana', value: 'Haryana' },
    { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
    { label: 'Maharashtra', value: 'Maharashtra' },
    { label: 'Karnataka', value: 'Karnataka' },
    { label: 'Tamil Nadu', value: 'Tamil Nadu' },
    { label: 'Telangana', value: 'Telangana' },
    { label: 'Gujarat', value: 'Gujarat' },
    { label: 'West Bengal', value: 'West Bengal' },
    { label: 'Rajasthan', value: 'Rajasthan' },
    { label: 'Punjab', value: 'Punjab' },
    { label: 'Kerala', value: 'Kerala' },
    { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
    { label: 'Bihar', value: 'Bihar' },
    { label: 'Odisha', value: 'Odisha' },
    { label: 'Assam', value: 'Assam' },
    { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
    { label: 'Uttarakhand', value: 'Uttarakhand' },
    { label: 'Himachal Pradesh', value: 'Himachal Pradesh' },
    { label: 'Jharkhand', value: 'Jharkhand' },
    { label: 'Chhattisgarh', value: 'Chhattisgarh' },
    { label: 'Goa', value: 'Goa' },
    { label: 'Jammu & Kashmir', value: 'Jammu & Kashmir' },
    { label: 'Chandigarh', value: 'Chandigarh' }
  ];

  stateCitiesMap: { [key: string]: { label: string; value: string }[] } = {
    'Delhi': [
      { label: 'Delhi', value: 'Delhi' },
      { label: 'New Delhi', value: 'New Delhi' }
    ],
    'Haryana': [
      { label: 'Gurugram', value: 'Gurugram' },
      { label: 'Faridabad', value: 'Faridabad' },
      { label: 'Panipat', value: 'Panipat' },
      { label: 'Ambala', value: 'Ambala' },
      { label: 'Karnal', value: 'Karnal' },
      { label: 'Hisar', value: 'Hisar' },
      { label: 'Rohtak', value: 'Rohtak' },
      { label: 'Sonipat', value: 'Sonipat' },
      { label: 'Panchkula', value: 'Panchkula' },
      { label: 'Palwal', value: 'Palwal' },
      { label: 'Rewari', value: 'Rewari' },
      { label: 'Yamunanagar', value: 'Yamunanagar' },
      { label: 'Bhiwani', value: 'Bhiwani' },
      { label: 'Sirsa', value: 'Sirsa' },
      { label: 'Bahadurgarh', value: 'Bahadurgarh' }
    ],
    'Uttar Pradesh': [
      { label: 'Noida', value: 'Noida' },
      { label: 'Greater Noida', value: 'Greater Noida' },
      { label: 'Ghaziabad', value: 'Ghaziabad' },
      { label: 'Lucknow', value: 'Lucknow' },
      { label: 'Kanpur', value: 'Kanpur' },
      { label: 'Agra', value: 'Agra' },
      { label: 'Varanasi', value: 'Varanasi' },
      { label: 'Prayagraj (Allahabad)', value: 'Prayagraj' },
      { label: 'Meerut', value: 'Meerut' },
      { label: 'Bareilly', value: 'Bareilly' },
      { label: 'Ayodhya', value: 'Ayodhya' },
      { label: 'Aligarh', value: 'Aligarh' },
      { label: 'Moradabad', value: 'Moradabad' },
      { label: 'Saharanpur', value: 'Saharanpur' },
      { label: 'Gorakhpur', value: 'Gorakhpur' },
      { label: 'Jhansi', value: 'Jhansi' },
      { label: 'Firozabad', value: 'Firozabad' },
      { label: 'Mathura', value: 'Mathura' },
      { label: 'Muzaffarnagar', value: 'Muzaffarnagar' },
      { label: 'Etawah', value: 'Etawah' }
    ],
    'Maharashtra': [
      { label: 'Mumbai', value: 'Mumbai' },
      { label: 'Pune', value: 'Pune' },
      { label: 'Nagpur', value: 'Nagpur' },
      { label: 'Nashik', value: 'Nashik' },
      { label: 'Thane', value: 'Thane' },
      { label: 'Navi Mumbai', value: 'Navi Mumbai' },
      { label: 'Aurangabad', value: 'Aurangabad' },
      { label: 'Solapur', value: 'Solapur' },
      { label: 'Kolhapur', value: 'Kolhapur' },
      { label: 'Amravati', value: 'Amravati' },
      { label: 'Nanded', value: 'Nanded' },
      { label: 'Sangli', value: 'Sangli' },
      { label: 'Jalgaon', value: 'Jalgaon' },
      { label: 'Akola', value: 'Akola' },
      { label: 'Latur', value: 'Latur' },
      { label: 'Dhule', value: 'Dhule' },
      { label: 'Chandrapur', value: 'Chandrapur' },
      { label: 'Parbhani', value: 'Parbhani' }
    ],
    'Karnataka': [
      { label: 'Bengaluru', value: 'Bengaluru' },
      { label: 'Mysuru', value: 'Mysuru' },
      { label: 'Hubballi', value: 'Hubballi' },
      { label: 'Mangaluru', value: 'Mangaluru' },
      { label: 'Belagavi', value: 'Belagavi' },
      { label: 'Davanagere', value: 'Davanagere' },
      { label: 'Ballari', value: 'Ballari' },
      { label: 'Vijayapura', value: 'Vijayapura' },
      { label: 'Shivamogga', value: 'Shivamogga' },
      { label: 'Tumakuru', value: 'Tumakuru' },
      { label: 'Kalaburagi', value: 'Kalaburagi' },
      { label: 'Bidar', value: 'Bidar' },
      { label: 'Kolar', value: 'Kolar' }
    ],
    'Tamil Nadu': [
      { label: 'Chennai', value: 'Chennai' },
      { label: 'Coimbatore', value: 'Coimbatore' },
      { label: 'Madurai', value: 'Madurai' },
      { label: 'Tiruchirappalli', value: 'Tiruchirappalli' },
      { label: 'Salem', value: 'Salem' },
      { label: 'Tiruppur', value: 'Tiruppur' },
      { label: 'Erode', value: 'Erode' },
      { label: 'Vellore', value: 'Vellore' },
      { label: 'Tirunelveli', value: 'Tirunelveli' },
      { label: 'Thanjavur', value: 'Thanjavur' },
      { label: 'Kancheepuram', value: 'Kancheepuram' },
      { label: 'Nagercoil', value: 'Nagercoil' },
      { label: 'Dindigul', value: 'Dindigul' },
      { label: 'Ooty', value: 'Ooty' }
    ],
    'Telangana': [
      { label: 'Hyderabad', value: 'Hyderabad' },
      { label: 'Warangal', value: 'Warangal' },
      { label: 'Nizamabad', value: 'Nizamabad' },
      { label: 'Karimnagar', value: 'Karimnagar' },
      { label: 'Khammam', value: 'Khammam' },
      { label: 'Ramagundam', value: 'Ramagundam' },
      { label: 'Mahbubnagar', value: 'Mahbubnagar' },
      { label: 'Nalgonda', value: 'Nalgonda' },
      { label: 'Secunderabad', value: 'Secunderabad' }
    ],
    'Gujarat': [
      { label: 'Ahmedabad', value: 'Ahmedabad' },
      { label: 'Surat', value: 'Surat' },
      { label: 'Vadodara', value: 'Vadodara' },
      { label: 'Rajkot', value: 'Rajkot' },
      { label: 'Bhavnagar', value: 'Bhavnagar' },
      { label: 'Jamnagar', value: 'Jamnagar' },
      { label: 'Gandhinagar', value: 'Gandhinagar' },
      { label: 'Junagadh', value: 'Junagadh' },
      { label: 'Gandhidham', value: 'Gandhidham' },
      { label: 'Anand', value: 'Anand' },
      { label: 'Navsari', value: 'Navsari' },
      { label: 'Morbi', value: 'Morbi' },
      { label: 'Bharuch', value: 'Bharuch' }
    ],
    'West Bengal': [
      { label: 'Kolkata', value: 'Kolkata' },
      { label: 'Howrah', value: 'Howrah' },
      { label: 'Durgapur', value: 'Durgapur' },
      { label: 'Asansol', value: 'Asansol' },
      { label: 'Siliguri', value: 'Siliguri' },
      { label: 'Bardhaman', value: 'Bardhaman' },
      { label: 'Kharagpur', value: 'Kharagpur' },
      { label: 'Haldia', value: 'Haldia' },
      { label: 'Darjeeling', value: 'Darjeeling' },
      { label: 'Bahrampur', value: 'Bahrampur' }
    ],
    'Rajasthan': [
      { label: 'Jaipur', value: 'Jaipur' },
      { label: 'Jodhpur', value: 'Jodhpur' },
      { label: 'Udaipur', value: 'Udaipur' },
      { label: 'Kota', value: 'Kota' },
      { label: 'Bikaner', value: 'Bikaner' },
      { label: 'Ajmer', value: 'Ajmer' },
      { label: 'Bhilwara', value: 'Bhilwara' },
      { label: 'Alwar', value: 'Alwar' },
      { label: 'Sikar', value: 'Sikar' },
      { label: 'Bharatpur', value: 'Bharatpur' },
      { label: 'Pali', value: 'Pali' },
      { label: 'Barmer', value: 'Barmer' },
      { label: 'Chittorgarh', value: 'Chittorgarh' }
    ],
    'Punjab': [
      { label: 'Ludhiana', value: 'Ludhiana' },
      { label: 'Amritsar', value: 'Amritsar' },
      { label: 'Jalandhar', value: 'Jalandhar' },
      { label: 'Patiala', value: 'Patiala' },
      { label: 'Bathinda', value: 'Bathinda' },
      { label: 'Hoshiarpur', value: 'Hoshiarpur' },
      { label: 'Mohali', value: 'Mohali' },
      { label: 'Pathankot', value: 'Pathankot' },
      { label: 'Moga', value: 'Moga' },
      { label: 'Batala', value: 'Batala' },
      { label: 'Barnala', value: 'Barnala' }
    ],
    'Kerala': [
      { label: 'Kochi', value: 'Kochi' },
      { label: 'Thiruvananthapuram', value: 'Thiruvananthapuram' },
      { label: 'Kozhikode', value: 'Kozhikode' },
      { label: 'Thrissur', value: 'Thrissur' },
      { label: 'Kollam', value: 'Kollam' },
      { label: 'Palakkad', value: 'Palakkad' },
      { label: 'Alappuzha', value: 'Alappuzha' },
      { label: 'Kottayam', value: 'Kottayam' },
      { label: 'Kannur', value: 'Kannur' }
    ],
    'Madhya Pradesh': [
      { label: 'Bhopal', value: 'Bhopal' },
      { label: 'Indore', value: 'Indore' },
      { label: 'Gwalior', value: 'Gwalior' },
      { label: 'Jabalpur', value: 'Jabalpur' },
      { label: 'Ujjain', value: 'Ujjain' },
      { label: 'Sagar', value: 'Sagar' },
      { label: 'Dewas', value: 'Dewas' },
      { label: 'Satna', value: 'Satna' },
      { label: 'Ratlam', value: 'Ratlam' },
      { label: 'Rewa', value: 'Rewa' },
      { label: 'Katni', value: 'Katni' },
      { label: 'Singrauli', value: 'Singrauli' },
      { label: 'Burhanpur', value: 'Burhanpur' }
    ],
    'Bihar': [
      { label: 'Patna', value: 'Patna' },
      { label: 'Gaya', value: 'Gaya' },
      { label: 'Bhagalpur', value: 'Bhagalpur' },
      { label: 'Muzaffarpur', value: 'Muzaffarpur' },
      { label: 'Purnia', value: 'Purnia' },
      { label: 'Darbhanga', value: 'Darbhanga' },
      { label: 'Bihar Sharif', value: 'Bihar Sharif' },
      { label: 'Arrah', value: 'Arrah' },
      { label: 'Begusarai', value: 'Begusarai' },
      { label: 'Katihar', value: 'Katihar' },
      { label: 'Chapra', value: 'Chapra' }
    ],
    'Odisha': [
      { label: 'Bhubaneswar', value: 'Bhubaneswar' },
      { label: 'Cuttack', value: 'Cuttack' },
      { label: 'Rourkela', value: 'Rourkela' },
      { label: 'Puri', value: 'Puri' },
      { label: 'Sambalpur', value: 'Sambalpur' },
      { label: 'Berhampur', value: 'Berhampur' },
      { label: 'Balasore', value: 'Balasore' },
      { label: 'Bhadrak', value: 'Bhadrak' }
    ],
    'Assam': [
      { label: 'Guwahati', value: 'Guwahati' },
      { label: 'Silchar', value: 'Silchar' },
      { label: 'Dibrugarh', value: 'Dibrugarh' },
      { label: 'Jorhat', value: 'Jorhat' },
      { label: 'Nagaon', value: 'Nagaon' },
      { label: 'Tezpur', value: 'Tezpur' },
      { label: 'Tinsukia', value: 'Tinsukia' },
      { label: 'Bongaigaon', value: 'Bongaigaon' }
    ],
    'Andhra Pradesh': [
      { label: 'Visakhapatnam', value: 'Visakhapatnam' },
      { label: 'Vijayawada', value: 'Vijayawada' },
      { label: 'Guntur', value: 'Guntur' },
      { label: 'Nellore', value: 'Nellore' },
      { label: 'Kurnool', value: 'Kurnool' },
      { label: 'Kakinada', value: 'Kakinada' },
      { label: 'Tirupati', value: 'Tirupati' },
      { label: 'Rajahmundry', value: 'Rajahmundry' },
      { label: 'Kadapa', value: 'Kadapa' },
      { label: 'Anantapur', value: 'Anantapur' },
      { label: 'Eluru', value: 'Eluru' },
      { label: 'Vizianagaram', value: 'Vizianagaram' }
    ],
    'Uttarakhand': [
      { label: 'Dehradun', value: 'Dehradun' },
      { label: 'Haridwar', value: 'Haridwar' },
      { label: 'Roorkee', value: 'Roorkee' },
      { label: 'Rishikesh', value: 'Rishikesh' },
      { label: 'Haldwani', value: 'Haldwani' },
      { label: 'Kashipur', value: 'Kashipur' },
      { label: 'Nainital', value: 'Nainital' }
    ],
    'Himachal Pradesh': [
      { label: 'Shimla', value: 'Shimla' },
      { label: 'Dharamshala', value: 'Dharamshala' },
      { label: 'Manali', value: 'Manali' },
      { label: 'Solan', value: 'Solan' },
      { label: 'Mandi', value: 'Mandi' },
      { label: 'Baddi', value: 'Baddi' }
    ],
    'Jharkhand': [
      { label: 'Ranchi', value: 'Ranchi' },
      { label: 'Jamshedpur', value: 'Jamshedpur' },
      { label: 'Dhanbad', value: 'Dhanbad' },
      { label: 'Bokaro', value: 'Bokaro' },
      { label: 'Hazaribagh', value: 'Hazaribagh' },
      { label: 'Deoghar', value: 'Deoghar' },
      { label: 'Giridih', value: 'Giridih' }
    ],
    'Chhattisgarh': [
      { label: 'Raipur', value: 'Raipur' },
      { label: 'Bhilai', value: 'Bhilai' },
      { label: 'Bilaspur', value: 'Bilaspur' },
      { label: 'Korba', value: 'Korba' },
      { label: 'Rajnandgaon', value: 'Rajnandgaon' },
      { label: 'Jagdalpur', value: 'Jagdalpur' }
    ],
    'Goa': [
      { label: 'Panaji', value: 'Panaji' },
      { label: 'Margao', value: 'Margao' },
      { label: 'Vasco da Gama', value: 'Vasco da Gama' },
      { label: 'Mapusa', value: 'Mapusa' }
    ],
    'Jammu & Kashmir': [
      { label: 'Srinagar', value: 'Srinagar' },
      { label: 'Jammu', value: 'Jammu' },
      { label: 'Anantnag', value: 'Anantnag' },
      { label: 'Baramulla', value: 'Baramulla' },
      { label: 'Udhampur', value: 'Udhampur' }
    ],
    'Chandigarh': [
      { label: 'Chandigarh', value: 'Chandigarh' }
    ]
  };

  fromCitiesList: { label: string; value: string }[] = [];
  toCitiesList: { label: string; value: string }[] = [];
  visitCitiesList: { label: string; value: string }[] = [];

  addedDetails: DetailRow[] = [];
  selectedFileName = '';
  selectedFileBase64 = '';

  expenseClaims: any[] = [];
  selectedClaim: any = null;

  activeReceiptUrl = '';
  activeReceiptTitle = '';

  loading = signal(false);
  submitting = signal(false);

  currentUser: any = null;
  currentUserSelfName = '';
  currentUserSelfDesignation = '';

  employeesList: any[] = [];
  selectedTargetEmployeeId: number | null = null;
  indiaLocations: any[] = [];
  isHR = false;

  ngOnInit(): void {
    this.initForms();
    this.loadUserInfo();
    this.loadClaims();
    this.loadCompanyEmployees();
    this.loadIndiaLocations();
  }

  initForms(): void {
    this.expenseForm = this.fb.group({
      transferType: ['Self'],
      requestNo: [''],
      selectedEmployeeId: [null],
      submitFor: ['Tour Reimbursement'],
      visitState: [''],
      visitCity: [''],
      visitLocation: [''],
      name: [''],
      designation: [''],
      fromDate: [new Date()],
      toDate: [new Date()],
      purpose: [''],
      walletAmount: ['0']
    });

    this.detailForm = this.fb.group({
      conveyanceType: ['Fare'],
      travelBy: ['Taxi / Cab'],
      fromState: [''],
      fromCity: [''],
      travelFrom: [''],
      toState: [''],
      toCity: [''],
      travelTo: [''],
      fromDate: [new Date()],
      toDate: [new Date()],
      amount: [null],
      details: ['']
    });

    this.lodgingForm = this.fb.group({
      hotelName: [''],
      fromDate: [new Date()],
      toDate: [new Date()],
      amount: [null],
      details: ['']
    });

    this.foodForm = this.fb.group({
      billNo: [''],
      vendor: [''],
      date: [new Date()],
      amount: [null],
      details: ['']
    });

    this.laundryForm = this.fb.group({
      vendor: [''],
      date: [new Date()],
      amount: [null],
      details: ['']
    });

    this.otherForm = this.fb.group({
      expenseType: ['General Expense'],
      date: [new Date()],
      amount: [null],
      details: ['']
    });
  }

  loadUserInfo(): void {
    const user = this.authService.user();
    if (user) {
      this.currentUser = user;
      const roles = (user.roles || []).map((r: any) => typeof r === 'string' ? r : r.roleId || r.roleName || '');
      const userRolesStr = roles.join(',').toUpperCase();
      this.isHR = userRolesStr.includes('HR_ADMIN') || userRolesStr.includes('ADMIN') || userRolesStr.includes('SUPER_ADMIN') || userRolesStr.includes('DEVELOPER');
    }

    this.userService.getUserSidebar('').subscribe({
      next: (res: any) => {
        if (res && res.user) {
          const u = res.user;
          this.currentUserSelfName = u.full_name || u.username || 'Employee';
          this.currentUserSelfDesignation = u.designation || u.role || 'Team Member';

          if (this.expenseForm.get('transferType')?.value === 'Self') {
            this.expenseForm.patchValue({
              name: this.currentUserSelfName,
              designation: this.currentUserSelfDesignation
            });
          }
        }
      }
    });
  }

  loadCompanyEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (data: any[]) => {
        this.employeesList = (data || []).map(e => ({
          ...e,
          fullName: e.fullName || e.full_name || e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim() || `Emp #${e.id}`
        }));
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching employees list:', err);
      }
    });
  }

  loadIndiaLocations(): void {
    this.expenseService.getIndiaLocations().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.indiaLocations = res.data || [];
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Error fetching India locations:', err);
      }
    });
  }

  onFromStateChange(state: string): void {
    this.detailForm.patchValue({ fromCity: '', travelFrom: '' });
    this.fromCitiesList = this.stateCitiesMap[state] || [];
    this.cdr.markForCheck();
  }

  onFromCityChange(city: string): void {
    const state = this.detailForm.get('fromState')?.value || '';
    const fullLoc = city ? `${city}${state ? ', ' + state : ''}` : '';
    this.detailForm.patchValue({ travelFrom: fullLoc });
    this.cdr.markForCheck();
  }

  onToStateChange(state: string): void {
    this.detailForm.patchValue({ toCity: '', travelTo: '' });
    this.toCitiesList = this.stateCitiesMap[state] || [];
    this.cdr.markForCheck();
  }

  onToCityChange(city: string): void {
    const state = this.detailForm.get('toState')?.value || '';
    const fullLoc = city ? `${city}${state ? ', ' + state : ''}` : '';
    this.detailForm.patchValue({ travelTo: fullLoc });
    this.cdr.markForCheck();
  }

  onVisitStateChange(state: string): void {
    this.expenseForm.patchValue({ visitCity: '', visitLocation: '' });
    this.visitCitiesList = this.stateCitiesMap[state] || [];
    this.cdr.markForCheck();
  }

  onVisitCityChange(city: string): void {
    const state = this.expenseForm.get('visitState')?.value || '';
    const fullLoc = city ? `${city}${state ? ', ' + state : ''}` : '';
    this.expenseForm.patchValue({ visitLocation: fullLoc });
    this.cdr.markForCheck();
  }

  onTransferTypeChange(type: string): void {
    if (type === 'Self') {
      this.selectedTargetEmployeeId = null;
      this.expenseForm.patchValue({
        selectedEmployeeId: null,
        name: this.currentUserSelfName || this.currentUser?.username || 'Employee',
        designation: this.currentUserSelfDesignation || 'Team Member'
      });
    } else if (type === 'Other') {
      this.selectedTargetEmployeeId = null;
      this.expenseForm.patchValue({
        selectedEmployeeId: null,
        name: '',
        designation: ''
      });
      if (this.employeesList.length === 0) {
        this.loadCompanyEmployees();
      }
    }
    this.cdr.markForCheck();
  }

  onEmployeeSelect(empId: number): void {
    if (!empId) return;
    const emp = this.employeesList.find(e => Number(e.id) === Number(empId));
    if (emp) {
      this.selectedTargetEmployeeId = emp.id;
      const empName = emp.fullName || emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
      const empDesig = emp.designation || emp.role || 'Team Member';

      this.expenseForm.patchValue({
        name: empName,
        designation: empDesig
      });
      this.cdr.markForCheck();
    }
  }

  loadClaims(): void {
    this.loading.set(true);
    this.expenseService.getClaims().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.expenseClaims = res.data || [];
        }
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching expense claims:', err);
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  showDialog(): void {
    const uName = this.currentUserSelfName || this.currentUser?.username || 'Employee';
    const uDesig = this.currentUserSelfDesignation || 'Team Member';
    this.selectedTargetEmployeeId = null;

    this.expenseForm.reset({
      transferType: 'Self',
      selectedEmployeeId: null,
      submitFor: 'Tour Reimbursement',
      visitState: '',
      visitCity: '',
      visitLocation: '',
      name: uName,
      designation: uDesig,
      fromDate: new Date(),
      toDate: new Date(),
      purpose: '',
      walletAmount: '0'
    });

    this.expenseService.getNextRequestNo().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.expenseForm.patchValue({ requestNo: res.data });
        }
      }
    });

    this.detailForm.reset({ conveyanceType: 'Fare', travelBy: 'Taxi / Cab', fromState: '', fromCity: '', travelFrom: '', toState: '', toCity: '', travelTo: '', fromDate: new Date(), toDate: new Date() });
    this.lodgingForm.reset({ fromDate: new Date(), toDate: new Date() });
    this.foodForm.reset({ date: new Date() });
    this.laundryForm.reset({ date: new Date() });
    this.otherForm.reset({ date: new Date(), expenseType: 'General Expense' });

    this.addedDetails = [];
    this.selectedFileName = '';
    this.selectedFileBase64 = '';
    this.drawerVisible = true;
    this.cdr.markForCheck();
  }

  onDrawerHide(): void {
    this.drawerVisible = false;
  }

  toggleDetails(): void {
    this.detailsExpanded = !this.detailsExpanded;
  }

  toggleOtherDetails(): void {
    this.otherDetailsExpanded = !this.otherDetailsExpanded;
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.selectedFileName = '';
    this.selectedFileBase64 = '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedFileBase64 = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  addDetail(): void {
    let type = 'Conveyance';
    let travelBy = 'Taxi';
    let from = 'N/A';
    let to = 'N/A';
    let fromDate = new Date();
    let toDate = new Date();
    let amount = 0;
    let details = '';

    if (this.activeTab === 'Fare/Conveyance') {
      const v = this.detailForm.value;
      type = 'Conveyance';
      travelBy = v.travelBy || 'Taxi';
      from = v.travelFrom || v.fromCity || 'N/A';
      to = v.travelTo || v.toCity || 'N/A';
      fromDate = v.fromDate || new Date();
      toDate = v.toDate || new Date();
      amount = Number(v.amount) || 0;
      details = `${v.conveyanceType || 'Fare'} - ${v.details || ''}`;
      this.detailForm.reset({ conveyanceType: 'Fare', travelBy: 'Taxi / Cab', fromState: '', fromCity: '', travelFrom: '', toState: '', toCity: '', travelTo: '', fromDate: new Date(), toDate: new Date() });
    } else if (this.activeTab === 'Lodging') {
      const v = this.lodgingForm.value;
      type = 'Lodging';
      travelBy = v.hotelName || 'Hotel';
      fromDate = v.fromDate || new Date();
      toDate = v.toDate || new Date();
      amount = Number(v.amount) || 0;
      details = v.details || '';
      this.lodgingForm.reset({ fromDate: new Date(), toDate: new Date() });
    } else if (this.activeTab === 'Food') {
      const v = this.foodForm.value;
      type = 'Food';
      travelBy = v.vendor || 'Food Vendor';
      fromDate = v.date || new Date();
      toDate = v.date || new Date();
      amount = Number(v.amount) || 0;
      details = `Bill No: ${v.billNo || 'N/A'} - ${v.details || ''}`;
      this.foodForm.reset({ date: new Date() });
    } else if (this.activeTab === 'Laundry') {
      const v = this.laundryForm.value;
      type = 'Laundry';
      travelBy = v.vendor || 'Laundry Service';
      fromDate = v.date || new Date();
      toDate = v.date || new Date();
      amount = Number(v.amount) || 0;
      details = v.details || '';
      this.laundryForm.reset({ date: new Date() });
    } else if (this.activeTab === 'Other') {
      const v = this.otherForm.value;
      type = 'Other';
      travelBy = v.expenseType || 'Other';
      fromDate = v.date || new Date();
      toDate = v.date || new Date();
      amount = Number(v.amount) || 0;
      details = v.details || '';
      this.otherForm.reset({ date: new Date(), expenseType: 'General Expense' });
    }

    if (amount <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Amount Required', detail: 'Please enter amount for expense detail item.' });
      return;
    }

    this.addedDetails = [...this.addedDetails, {
      type,
      travelBy,
      from,
      to,
      fromDate,
      toDate,
      amount,
      details,
      attachmentName: this.selectedFileName || undefined,
      attachmentUrl: this.selectedFileBase64 || undefined
    }];

    this.selectedFileName = '';
    this.selectedFileBase64 = '';
    this.messageService.add({ severity: 'success', summary: 'Added', detail: 'Expense item added to list.' });
    this.cdr.markForCheck();
  }

  get overallTotalAmount(): number {
    return this.addedDetails.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  removeDetail(index: number): void {
    this.addedDetails = this.addedDetails.filter((_, idx) => idx !== index);
    this.messageService.add({ severity: 'info', summary: 'Removed', detail: 'Expense item removed.' });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    const masterVal = this.expenseForm.getRawValue();
    const itemsTotal = this.addedDetails.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const overallReceipt = this.selectedFileBase64 || (this.addedDetails.find(d => d.attachmentUrl)?.attachmentUrl) || null;

    const payload = {
      employeeName: masterVal.name,
      designation: masterVal.designation,
      requestNo: masterVal.requestNo,
      transferType: masterVal.transferType || 'Self',
      targetEmployeeId: masterVal.transferType === 'Other' ? this.selectedTargetEmployeeId : null,
      submitFor: masterVal.submitFor || 'Tour Reimbursement',
      visitLocation: masterVal.visitLocation || masterVal.visitCity || '',
      fromDate: masterVal.fromDate,
      toDate: masterVal.toDate,
      purpose: masterVal.purpose || '',
      totalAmount: itemsTotal,
      receiptUrl: overallReceipt,
      items: this.addedDetails
    };

    this.submitting.set(true);
    this.expenseService.createClaim(payload).subscribe({
      next: (res: any) => {
        this.submitting.set(false);
        if (res && res.success) {
          this.messageService.add({ severity: 'success', summary: 'Submitted', detail: 'Expense claim submitted successfully!' });
          this.drawerVisible = false;
          this.loadClaims();
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res?.message || 'Failed to submit claim' });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Submit error:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to submit claim' });
        this.cdr.markForCheck();
      }
    });
  }

  viewClaimDetails(row: any): void {
    this.expenseService.getClaimById(row.id).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.selectedClaim = res.data;
          this.viewDialogVisible = true;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.selectedClaim = row;
        this.viewDialogVisible = true;
        this.cdr.markForCheck();
      }
    });
  }

  openReceiptModal(url: string, title: string): void {
    if (!url) return;
    this.activeReceiptUrl = url;
    this.activeReceiptTitle = title || 'Bill Receipt';
    this.receiptModalVisible = true;
    this.cdr.markForCheck();
  }

  updateStatus(claimId: number, status: string): void {
    this.expenseService.updateClaimStatus(claimId, status).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.messageService.add({ severity: 'success', summary: 'Status Updated', detail: `Claim ${status.toLowerCase()} successfully.` });
          this.viewDialogVisible = false;
          this.loadClaims();
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to update status' });
      }
    });
  }

  deleteClaim(claimId: number): void {
    this.expenseService.deleteClaim(claimId).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.messageService.add({ severity: 'info', summary: 'Deleted', detail: 'Expense claim deleted.' });
          this.viewDialogVisible = false;
          this.loadClaims();
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to delete claim' });
      }
    });
  }

  onClose(): void {
    this.drawerVisible = false;
  }
}
