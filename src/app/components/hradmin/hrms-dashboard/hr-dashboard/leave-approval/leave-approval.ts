import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

export interface LeaveRequest {
  id: string;
  employeeName: string;
  role: string;
  department: string;
  type: string;
  duration: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
}

@Component({
  selector: 'app-leave-approval',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerModule,
    DialogModule,
    DatePickerModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './leave-approval.html',
  styleUrl: './leave-approval.scss',
})
export class LeaveApproval implements OnInit {
  leaveRequests: LeaveRequest[] = [
    { id: 'LEV-101', employeeName: 'Rohit Sharma', role: 'Frontend Engineer', department: 'Development', type: 'Casual Leave', duration: '2 days (2026-07-05 to 2026-07-06)', reason: 'Attending cousin\'s wedding in home town', status: 'Pending', appliedDate: '2026-07-02' },
    { id: 'LEV-102', employeeName: 'Priya Patel', role: 'UI Designer', department: 'Design', type: 'Sick Leave', duration: '1 day (2026-07-03)', reason: 'Severe headache and viral fever', status: 'Pending', appliedDate: '2026-07-03' },
    { id: 'LEV-103', employeeName: 'Sanjay Dutt', role: 'DevOps Lead', department: 'Infrastructure', type: 'Earned Leave', duration: '3 days (2026-07-07 to 2026-07-09)', reason: 'Personal work at hometown regarding registration', status: 'Pending', appliedDate: '2026-07-01' },
    { id: 'LEV-104', employeeName: 'Nisha Gupta', role: 'HR Executive', department: 'Human Resources', type: 'Casual Leave', duration: '1 day (2026-07-04)', reason: 'Routine health checkup', status: 'Pending', appliedDate: '2026-07-02' },
    { id: 'LEV-105', employeeName: 'Rahul Verma', role: 'QA Engineer', department: 'Quality Assurance', type: 'Sick Leave', duration: '2 days (2026-07-03 to 2026-07-04)', reason: 'Recovering from food poisoning', status: 'Pending', appliedDate: '2026-07-02' }
  ];

  selectedRequest: LeaveRequest | null = null;
  actionType: 'Approve' | 'Reject' | null = null;
  showConfirmModal = false;
  showDetailsDrawer = false;

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {}

  get pendingCount() {
    return this.leaveRequests.filter(r => r.status === 'Pending').length;
  }

  get approvedCount() {
    return this.leaveRequests.filter(r => r.status === 'Approved').length;
  }

  get rejectedCount() {
    return this.leaveRequests.filter(r => r.status === 'Rejected').length;
  }

  get totalCount() {
    return this.leaveRequests.length;
  }

  triggerAction(request: LeaveRequest, type: 'Approve' | 'Reject') {
    this.selectedRequest = request;
    this.actionType = type;
    this.showConfirmModal = true;
  }

  confirmAction(confirm: boolean) {
    this.showConfirmModal = false;
    if (!confirm || !this.selectedRequest || !this.actionType) {
      this.selectedRequest = null;
      this.actionType = null;
      return;
    }

    const req = this.leaveRequests.find(r => r.id === this.selectedRequest!.id);
    if (req) {
      req.status = this.actionType === 'Approve' ? 'Approved' : 'Rejected';
      
      this.messageService.add({
        severity: this.actionType === 'Approve' ? 'success' : 'error',
        summary: this.actionType === 'Approve' ? 'Leave Approved' : 'Leave Rejected',
        detail: `Leave request for ${req.employeeName} has been ${this.actionType === 'Approve' ? 'approved' : 'rejected'} successfully.`
      });
    }

    this.selectedRequest = null;
    this.actionType = null;
    this.showDetailsDrawer = false;
  }

  viewDetails(request: LeaveRequest) {
    this.selectedRequest = request;
    this.showDetailsDrawer = true;
  }
}
