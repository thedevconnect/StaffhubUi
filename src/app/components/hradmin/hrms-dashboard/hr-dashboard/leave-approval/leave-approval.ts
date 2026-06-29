import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { TableTemplate } from '../../../../../shared/ui/table-template/table-template';
import { Breadcrumb } from 'primeng/breadcrumb';

@Component({
  selector: 'app-leave-approval',
  imports: [
    CommonModule,
    FormsModule,
    TableTemplate,
    DrawerModule,
    Breadcrumb,
    DialogModule,
    DatePickerModule,
    ButtonModule,
    ToastModule
  ],
  templateUrl: './leave-approval.html',
  styleUrl: './leave-approval.scss',
})
export class LeaveApproval {

}
