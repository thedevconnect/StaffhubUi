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
  @Input() jsonTemplate: TemplateRef<any> | null = null;
  @Input() jsonTemplate1: TemplateRef<any> | null = null;
  @Input() jsonTemplate2: TemplateRef<any> | null = null;
  @Input() jsonTemplate3: TemplateRef<any> | null = null;
  @Input() jsonTemplate4: TemplateRef<any> | null = null;
  @Input() jsonTemplate5: TemplateRef<any> | null = null;
  @Input() jsonTemplate6: TemplateRef<any> | null = null;
  @Input() jsonTemplate7: TemplateRef<any> | null = null;
  @Input() jsonTemplate8: TemplateRef<any> | null = null;
  @Input() jsonTemplate9: TemplateRef<any> | null = null;
  @Input() headerExtraTemplate: TemplateRef<any> | null = null;

  @Input() currentPage = 1;
  @Input() sortColumn: string | null = null;
  @Input() sortDirection: 'asc' | 'desc' = 'asc';
  @Input() searchText = '';
  @Input() pageSizeOptions: number[] = [5, 10, 20, 50, 100];
  @Input() showRefresh: boolean = false;
  @Input() showSortButtons: boolean = false;
  @Input() showExport: boolean = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() refresh = new EventEmitter<void>();
  @Output() exportData = new EventEmitter<void>();

  // Actions Menu
  @Input() rowActions: { label: string; icon: string; id: string }[] = [];
  @Input() disableActionCondition: (actionId: string, row: any) => boolean = () => false;
  @Output() actionClicked = new EventEmitter<{ actionId: string; row: any }>();

  menuItems: MenuItem[] = [];

  toggleMenu(menu: any, event: any, row: any) {
    this.menuItems = this.rowActions.map(action => ({
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

  constructor(private userService: UserService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.paginatedData = this.data;
    }
    if (changes['totalCount'] || changes['pageSize']) {
      this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
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
    }
  }

  goToFirst(): void {
    if (this.currentPage !== 1) {
      this.currentPage = 1;
      this.pageChange.emit(this.currentPage);
    }
  }

  goToLast(): void {
    if (this.currentPage !== this.totalPages) {
      this.currentPage = this.totalPages;
      this.pageChange.emit(this.currentPage);
    }
  }

  changePageSize(newSize: number): void {
    this.pageSizeChange.emit(newSize);
  }

  onSearch(): void {
    this.searchChange.emit(this.searchText);
  }

  onSort(columnKey: string): void {
    let newDirection: 'asc' | 'desc' = 'asc';
    if (this.sortColumn === columnKey && this.sortDirection === 'asc') {
      newDirection = 'desc';
    }
    this.sortChange.emit({ column: columnKey, direction: newDirection });
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


}
