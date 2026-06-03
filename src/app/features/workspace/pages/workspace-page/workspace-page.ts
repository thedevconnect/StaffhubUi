import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { UsersApiService } from '../../../../shared/services/users-api.service';
import { DataTable, DataTableColumn } from '../../../../shared/ui/data-table/data-table';

@Component({
  selector: 'app-workspace-page',
  standalone: true,
  imports: [CardModule, DataTable],
  templateUrl: './workspace-page.html',
  styleUrl: './workspace-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspacePage {
  private readonly route = inject(ActivatedRoute);
  private readonly usersApi = inject(UsersApiService);

  readonly title = computed(() => this.route.snapshot.data['title'] ?? 'Workspace');
  readonly users = computed(() => this.usersApi.users());
  readonly loading = computed(() => this.usersApi.loading());

  readonly columns: DataTableColumn[] = [
    { field: 'employeeName', header: 'Employee' },
    { field: 'username', header: 'Username' },
    { field: 'currentRole', header: 'Role' },
    { field: 'personalemail', header: 'Email' },
    { field: 'phone', header: 'Phone' },
  ];

  constructor() {
    this.usersApi.loadUsers();
  }
}
