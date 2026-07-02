import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  signal,
} from '@angular/core';
import { CommonModule, NgClass, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SkeletonModule } from 'primeng/skeleton';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { UserService } from '../../services/user-service';
import { ExcelService } from '../../services/excel.service';

export interface TableColumn {
  key: string;
  header: string;
  isSortable?: boolean;
  isVisible?: boolean;
  isCustom?: boolean;
  format?: string;
}

export interface TableAction {
  label: string;
  icon: string;
  id: string;
}

export interface Tab {
  label: string;
  value: any;
  count?: number; // Optional badge count
  icon?: string; // Optional icon
}

@Component({
  selector: 'app-table-template',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, NgIf, SkeletonModule, MenuModule, ButtonModule],
  templateUrl: './table-template.html',
  styleUrls: ['./table-template.scss'],
})
export class TableTemplate implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() pageSize = 5;
  @Input() totalCount = 0;
  @Input() isLoading: boolean = false;

  // Template inputs
  @Input() actionTemplate: TemplateRef<any> | null = null;
  @Input() rowTemplate: TemplateRef<any> | null = null;
  @Input() customTemplate: TemplateRef<any> | null = null;
  @Input() headerCheckbox: TemplateRef<any> | null = null;

  // Custom Cell Templates mapped by column key
  @Input() cellTemplates: { [key: string]: TemplateRef<any> } = {};
  @Input() headerExtraTemplate: TemplateRef<any> | null = null;

  @Input() currentPage = 1;
  @Input() sortColumn: string | null = null;
  @Input() sortDirection: 'asc' | 'desc' = 'asc';
  @Input() searchText = '';
  @Input() pageSizeOptions: number[] = [5, 10, 20, 50, 100];
  @Input() showRefresh: boolean = false;
  @Input() showSortButtons: boolean = false;
  @Input() showExport: boolean = false;
  @Input() exportFileName: string = 'Exported_Data';
  @Input() serverSide: boolean = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() refresh = new EventEmitter<void>();
  @Output() exportData = new EventEmitter<void>();

  // Actions Menu
  @Input() tableActions: TableAction[] = [
    { label: 'View', icon: 'pi pi-eye', id: 'view' },
    { label: 'Edit', icon: 'pi pi-pencil', id: 'edit' },
    { label: 'Delete', icon: 'pi pi-trash', id: 'delete' }
  ];
  @Input() disableActionCondition: (actionId: string, row: any) => boolean = () => false;
  @Output() actionClicked = new EventEmitter<{ actionId: string; row: any }>();

  menuItems: MenuItem[] = [];

  toggleMenu(menu: any, event: any, row: any) {
    this.menuItems = this.tableActions.map(action => ({
      label: action.label,
      icon: action.icon,
      disabled: this.disableActionCondition(action.id, row),
      command: () => this.actionClicked.emit({ actionId: action.id, row })
    }));
    menu.toggle(event);
  }

  // Tab Inputs/Outputs
  @Input() tabs: Tab[] = [];
  @Input() activeTab: any = null;
  @Output() tabChange = new EventEmitter<any>();

  onTabClick(tab: Tab): void {
    if (this.activeTab !== tab.value) {
      this.activeTab = tab.value;
      this.currentPage = 1; // Reset to first page on tab change
      this.tabChange.emit(tab.value);
    }
  }

  paginatedData: any[] = [];
  totalPages = 1;
  Math = Math;

  expandedStates: { [key: string]: boolean } = {};

  getRowId = (item: any, idx: number) =>
    item?.id ?? item?.ID ?? item?.resignId ?? item?.employeId ?? item?.refNo ?? idx;

  private getCellKey = (item: any, col: string, idx: number) =>
    `${this.getRowId(item, idx)}_${col}`;

  toggleExpand(item: any, col: string, idx: number) {
    this.expandedStates[this.getCellKey(item, col, idx)] = !this.isExpanded(item, col, idx);
  }

  isExpanded(item: any, col: string, idx: number) {
    return !!this.expandedStates[this.getCellKey(item, col, idx)];
  }

  getDisplayText(item: any, col: string, idx: number): string {
    const text = this.getDeepValue(item, col);
    if (typeof text !== 'string') return text;
    const words = text.split(/\s+/);
    return words.length > 4 && !this.isExpanded(item, col, idx)
      ? words.slice(0, 4).join(' ') + '...'
      : text;
  }

  shouldShowMore(item: any, col: string): boolean {
    const text = this.getDeepValue(item, col);
    return typeof text === 'string' && text.split(/\s+/).length > 4;
  }

  get skeletonRows(): number[] {
    return Array.from({ length: 5 }, (_, i) => i);
  }

  constructor(private userService: UserService, private excelService: ExcelService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['currentPage'] || changes['pageSize'] || changes['totalCount']) {
      this.updatePaginatedData();
    }
  }

  updatePaginatedData(): void {
    if (this.serverSide) {
      this.paginatedData = this.data || [];
      this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
    } else {
      const rawData = this.data || [];
      
      // 1. Filter locally
      let processed = [...rawData];
      const search = (this.searchText || '').toLowerCase().trim();
      if (search) {
        processed = processed.filter(item => 
          Object.values(item).some(val => 
            String(val ?? '').toLowerCase().includes(search)
          )
        );
      }

      // 2. Sort locally
      if (this.sortColumn) {
        const col = this.sortColumn;
        const dir = this.sortDirection;
        processed.sort((a, b) => {
          const av = this.getDeepValue(a, col);
          const bv = this.getDeepValue(b, col);
          if (av == null) return 1;
          if (bv == null) return -1;
          const result = String(av).localeCompare(String(bv), undefined, {
            numeric: true,
            sensitivity: 'base'
          });
          return dir === 'asc' ? result : -result;
        });
      }

      // 3. Paginate locally
      this.totalCount = processed.length;
      this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
      
      // Safety check: if currentPage exceeds totalPages, reset to 1
      if (this.currentPage > this.totalPages) {
        this.currentPage = 1;
      }
      
      const startIndex = (this.currentPage - 1) * this.pageSize;
      this.paginatedData = processed.slice(startIndex, startIndex + this.pageSize);
    }
  }

  get visibleColumnsCount(): number {
    return (this.columns || []).filter((col) => col.isVisible).length;
  }

  get shouldShowRefresh(): boolean {
    // Show refresh button if showRefresh is explicitly true OR if refresh event has subscribers
    return this.showRefresh || (this.refresh.observers && this.refresh.observers.length > 0);
  }

  onRefreshClick(): void {
    if (!this.isLoading) {
      this.refresh.emit();
    }
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const maxVisible = 5;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = Math.max(current - Math.floor(maxVisible / 2), 1);
    let end = Math.min(start + maxVisible - 1, total);

    if (end - start + 1 < maxVisible) {
      start = Math.max(end - maxVisible + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  changePage(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit(page);
      if (!this.serverSide) {
        this.updatePaginatedData();
      }
    }
  }

  goToFirst(): void {
    if (this.currentPage !== 1) {
      this.currentPage = 1;
      this.pageChange.emit(this.currentPage);
      if (!this.serverSide) {
        this.updatePaginatedData();
      }
    }
  }

  goToLast(): void {
    if (this.currentPage !== this.totalPages) {
      this.currentPage = this.totalPages;
      this.pageChange.emit(this.currentPage);
      if (!this.serverSide) {
        this.updatePaginatedData();
      }
    }
  }

  changePageSize(newSize: number): void {
    this.pageSize = Number(newSize);
    this.pageSizeChange.emit(this.pageSize);
    if (!this.serverSide) {
      this.currentPage = 1;
      this.updatePaginatedData();
    }
  }

  onSearch(): void {
    this.currentPage = 1;
    this.searchChange.emit(this.searchText);
    if (!this.serverSide) {
      this.updatePaginatedData();
    }
  }

  onSort(columnKey: string): void {
    let newDirection: 'asc' | 'desc' = 'asc';
    if (this.sortColumn === columnKey && this.sortDirection === 'asc') {
      newDirection = 'desc';
    }
    this.sortColumn = columnKey;
    this.sortDirection = newDirection;
    this.sortChange.emit({ column: columnKey, direction: newDirection });
    if (!this.serverSide) {
      this.updatePaginatedData();
    }
  }

  getDeepValue(o: any, key: string): any {
    if (!o || !key) return null;

    return key.split('.').reduce((obj, i) => {
      if (!obj) return null;

      // Try exact match first
      if (obj[i] !== undefined) return obj[i];

      // Try case-insensitive match
      const lowerKey = i.toLowerCase();
      const actualKey = Object.keys(obj).find((k) => k.toLowerCase() === lowerKey);
      return actualKey ? obj[actualKey] : null;
    }, o);
  }

  exportToExcel(): void {
    if (!this.data || this.data.length === 0) return;

    // Filter columns to export
    const exportableCols = (this.columns || []).filter(col =>
      col.isVisible !== false &&
      col.key !== 'actions' &&
      col.key !== 'checkbox'
    );

    if (exportableCols.length === 0) return;

    // Map data to sheet format
    const exportData = this.data.map(item => {
      const row: any = {};
      exportableCols.forEach(col => {
        let val = this.getDeepValue(item, col.key);

        // Strip out HTML tags or formatting details if they exist in string format
        if (typeof val === 'string') {
          val = val.trim();
        }

        // Format special column values
        if (col.format === 'date' && val) {
          try {
            val = new Date(val).toLocaleDateString();
          } catch (e) { }
        } else if (col.format === 'time' && val) {
          try {
            val = new Date(val).toLocaleTimeString();
          } catch (e) { }
        } else if (col.format === 'uppercase' && val) {
          val = String(val).toUpperCase();
        }

        row[col.header] = val ?? '';
      });
      return row;
    });

    // Use ExcelService to export
    this.excelService.exportAsExcelFile(exportData, this.exportFileName);
  }

}
