import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

export interface DataTableColumn {
  field: string;
  header: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, TableModule, InputTextModule, SelectModule, FormsModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable {
  @Input() value: any[] = [];
  @Input() columns: DataTableColumn[] = [];
  @Input() loading = false;
  @Input() rows = 10;
  @Input() rowsPerPageOptions: number[] = [5, 10, 25, 50];
  rowsOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 }
  ];

  @Input() globalFilterFields: string[] = [];

  globalFilterValue = '';
  
  onRowsChange(event: any): void {
    this.rows = event.value as number;
  }

  onGlobalFilterChange(event: any): void {
    this.globalFilterValue = event;
  }
}

