import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  ElementRef,
  HostListener
} from '@angular/core';
import { CommonModule, NgClass, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SkeletonModule } from 'primeng/skeleton';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { ExcelService } from '../../services/excel.service';

export interface TableColumn {
  key: string;
  header: string;
  isSortable?: boolean;
  isVisible?: boolean;
  isCustom?: boolean;
  format?: string;
  formatter?: (value: any, row?: any) => any;
  pipe?: string;
  pipeArgs?: string;
}

export interface TableAction {
  label: string;
  icon: string;
  id: string;
}

export interface Tab {
  label: string;
  value: any;
  count?: number;
  icon?: string;
}

@Component({
  selector: 'app-table-template',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, NgIf, SkeletonModule, MenuModule, ButtonModule],
  templateUrl: './table-template.html',
  styleUrls: ['./table-template.scss']
})
export class TableTemplate implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() pageSize = 5;
  @Input() totalCount = 0;
  @Input() isLoading = false;

  // Template inputs
  @Input() actionTemplate: TemplateRef<any> | null = null;
  @Input() rowTemplate: TemplateRef<any> | null = null;
  @Input() customTemplate: TemplateRef<any> | null = null;
  @Input() headerCheckbox: TemplateRef<any> | null = null;
  @Input() cellTemplates: { [key: string]: TemplateRef<any> } = {};
  @Input() headerExtraTemplate: TemplateRef<any> | null = null;

  @Input() currentPage = 1;
  @Input() sortColumn: string | null = null;
  @Input() sortDirection: 'asc' | 'desc' = 'asc';
  @Input() searchText = '';
  @Input() pageSizeOptions: number[] = [5, 10, 20, 50, 100];
  @Input() showRefresh = false;
  @Input() showSortButtons = false;
  @Input() showExport = false;
  @Input() exportFileName = 'Exported_Data';
  @Input() serverSide = false;
  @Input() enableFullScreen = true;

  @Input() tableActions: TableAction[] = [
    { label: 'View', icon: 'pi pi-eye', id: 'view' },
    { label: 'Edit', icon: 'pi pi-pencil', id: 'edit' },
    { label: 'Delete', icon: 'pi pi-trash', id: 'delete' }
  ];
  @Input() disableActionCondition: (actionId: string, row: any) => boolean = () => false;

  @Input() tabs: Tab[] = [];
  @Input() activeTab: any = null;

  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() refresh = new EventEmitter<void>();
  @Output() exportData = new EventEmitter<void>();
  @Output() actionClicked = new EventEmitter<{ actionId: string; row: any }>();
  @Output() tabChange = new EventEmitter<any>();

  isFullscreen = false;
  menuItems: MenuItem[] = [];
  paginatedData: any[] = [];
  totalPages = 1;
  Math = Math;
  expandedStates: { [key: string]: boolean } = {};

  constructor(
    private excelService: ExcelService,
    private elementRef: ElementRef
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['currentPage'] || changes['pageSize'] || changes['totalCount']) {
      this.updatePaginatedData();
    }
  }

  toggleMenu(menu: any, event: any, row: any): void {
    this.menuItems = this.tableActions.map(action => ({
      label: action.label,
      icon: action.icon,
      disabled: this.disableActionCondition(action.id, row),
      command: () => this.actionClicked.emit({ actionId: action.id, row })
    }));
    menu.toggle(event);
  }

  toggleFullScreen(): void {
    const el = this.elementRef.nativeElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => this.toggleCssFullScreen());
      } else {
        this.toggleCssFullScreen();
      }
      this.isFullscreen = true;
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
      this.isFullscreen = false;
    }
  }

  @HostListener('document:fullscreenchange')
  @HostListener('document:webkitfullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
    document.body.style.overflow = this.isFullscreen ? 'hidden' : '';
  }

  private toggleCssFullScreen(): void {
    this.isFullscreen = !this.isFullscreen;
    document.body.style.overflow = this.isFullscreen ? 'hidden' : '';
  }

  onTabClick(tab: Tab): void {
    if (this.activeTab !== tab.value) {
      this.activeTab = tab.value;
      this.currentPage = 1;
      this.tabChange.emit(tab.value);
    }
  }

  getRowId = (item: any, idx: number) => item?.id ?? item?.ID ?? item?.resignId ?? item?.employeId ?? item?.refNo ?? idx;

  private getCellKey = (item: any, col: string, idx: number) => `${this.getRowId(item, idx)}_${col}`;

  toggleExpand(item: any, col: string, idx: number): void {
    this.expandedStates[this.getCellKey(item, col, idx)] = !this.isExpanded(item, col, idx);
  }

  isExpanded(item: any, col: string, idx: number): boolean {
    return !!this.expandedStates[this.getCellKey(item, col, idx)];
  }

  getDisplayText(item: any, col: string, idx: number): string {
    const text = this.getDeepValue(item, col);
    if (typeof text !== 'string') return text;
    const words = text.split(/\s+/);
    return words.length > 4 && !this.isExpanded(item, col, idx) ? words.slice(0, 4).join(' ') + '...' : text;
  }

  shouldShowMore(item: any, col: string): boolean {
    const text = this.getDeepValue(item, col);
    return typeof text === 'string' && text.split(/\s+/).length > 4;
  }

  get skeletonRows(): number[] {
    return [0, 1, 2, 3, 4];
  }

  updatePaginatedData(): void {
    if (this.serverSide) {
      this.paginatedData = this.data || [];
      this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
    } else {
      let processed = [...(this.data || [])];
      const search = (this.searchText || '').toLowerCase().trim();
      if (search) {
        processed = processed.filter(item =>
          Object.values(item).some(val => String(val ?? '').toLowerCase().includes(search))
        );
      }

      if (this.sortColumn) {
        const col = this.sortColumn;
        const dir = this.sortDirection;
        processed.sort((a, b) => {
          const av = this.getDeepValue(a, col);
          const bv = this.getDeepValue(b, col);
          if (av == null) return 1;
          if (bv == null) return -1;
          const res = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
          return dir === 'asc' ? res : -res;
        });
      }

      this.totalCount = processed.length;
      this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
      if (this.currentPage > this.totalPages) this.currentPage = 1;

      const startIndex = (this.currentPage - 1) * this.pageSize;
      this.paginatedData = processed.slice(startIndex, startIndex + this.pageSize);
    }
  }

  get visibleColumnsCount(): number {
    return (this.columns || []).filter(col => col.isVisible !== false).length;
  }

  get shouldShowRefresh(): boolean {
    return this.showRefresh || this.refresh.observed;
  }

  onRefreshClick(): void {
    if (!this.isLoading) this.refresh.emit();
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const maxVisible = 5;

    if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);

    let start = Math.max(current - Math.floor(maxVisible / 2), 1);
    let end = Math.min(start + maxVisible - 1, total);
    if (end - start + 1 < maxVisible) start = Math.max(end - maxVisible + 1, 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  changePage(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit(page);
      if (!this.serverSide) this.updatePaginatedData();
    }
  }

  goToFirst(): void {
    if (this.currentPage !== 1) this.changePage(1);
  }

  goToLast(): void {
    if (this.currentPage !== this.totalPages) this.changePage(this.totalPages);
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
    if (!this.serverSide) this.updatePaginatedData();
  }

  onSort(columnKey: string): void {
    const newDirection = (this.sortColumn === columnKey && this.sortDirection === 'asc') ? 'desc' : 'asc';
    this.sortColumn = columnKey;
    this.sortDirection = newDirection;
    this.sortChange.emit({ column: columnKey, direction: newDirection });
    if (!this.serverSide) this.updatePaginatedData();
  }

  getDeepValue(o: any, key: string): any {
    if (!o || !key) return null;
    return key.split('.').reduce((obj, i) => {
      if (!obj) return null;
      if (obj[i] !== undefined) return obj[i];
      const lowerKey = i.toLowerCase();
      const actualKey = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
      return actualKey ? obj[actualKey] : null;
    }, o);
  }

  isDateField(col: TableColumn, item: any): boolean {
    if (col.format === 'date' || col.pipe === 'date') return true;
    const lowerKey = (col.key || '').toLowerCase();
    if (lowerKey.includes('date') || lowerKey.includes('created_at') || lowerKey.includes('updated_at') || lowerKey.includes('joiningdate')) {
      const val = this.getDeepValue(item, col.key);
      if (typeof val === 'string' && (val.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(val))) return true;
    }
    return false;
  }

  formatDateCell(val: any, pipeArgs?: string): string {
    if (!val) return '-';
    if (typeof val === 'string' && val.includes(' to ')) {
      const parts = val.split(' to ');
      return `${this.formatDateCell(parts[0])} to ${this.formatDateCell(parts[1])}`;
    }

    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);

      const isISOString = typeof val === 'string' && val.includes('T');
      const isDateOnlyUTC = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;

      const year = (isISOString || isDateOnlyUTC) ? d.getUTCFullYear() : d.getFullYear();
      const month = String(((isISOString || isDateOnlyUTC) ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, '0');
      const day = String((isISOString || isDateOnlyUTC) ? d.getUTCDate() : d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      if (isDateOnlyUTC) return dateStr;

      const rawHours = isISOString ? d.getUTCHours() : d.getHours();
      const rawMinutes = isISOString ? d.getUTCMinutes() : d.getMinutes();
      const rawSeconds = isISOString ? d.getUTCSeconds() : d.getSeconds();

      const hasTime = typeof val === 'string'
        ? (val.includes('T') && !val.endsWith('T00:00:00.000Z') && !val.endsWith('T00:00:00Z')) || val.includes(':')
        : (rawHours > 0 || rawMinutes > 0 || rawSeconds > 0);

      if (hasTime) {
        let hours = rawHours;
        const minutes = String(rawMinutes).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const formattedHours = String(hours).padStart(2, '0');

        if (pipeArgs && (pipeArgs.includes('hh:mm') || pipeArgs.includes('shortTime') || pipeArgs.includes('mm'))) {
          return `${formattedHours}:${minutes} ${ampm}`;
        }
        return `${dateStr} ${formattedHours}:${minutes} ${ampm}`;
      }

      return dateStr;
    } catch (e) {
      return String(val);
    }
  }

  formatWorkMinutes(val: any): string {
    if (val === null || val === undefined || isNaN(Number(val)) || Number(val) <= 0) return '0h 0m';
    const mins = Math.round(Number(val));
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  }

  exportToExcel(): void {
    if (!this.data || this.data.length === 0) return;
    const exportableCols = (this.columns || []).filter(col => col.isVisible !== false && col.key !== 'actions' && col.key !== 'checkbox');
    if (exportableCols.length === 0) return;

    const exportData = this.data.map(item => {
      const row: any = {};
      exportableCols.forEach(col => {
        let val = this.getDeepValue(item, col.key);
        if (typeof val === 'string') val = val.trim();

        if (col.formatter) {
          val = col.formatter(val, item);
        } else if (col.pipe === 'date' && val) {
          try {
            val = new DatePipe('en-US').transform(val, col.pipeArgs || 'mediumDate') || val;
          } catch (e) { }
        } else if (col.pipe === 'uppercase' && val) {
          val = String(val).toUpperCase();
        } else if (col.pipe === 'lowercase' && val) {
          val = String(val).toLowerCase();
        } else if (col.format === 'date' && val) {
          try { val = new Date(val).toLocaleDateString(); } catch (e) { }
        } else if (col.format === 'time' && val) {
          try { val = new Date(val).toLocaleTimeString(); } catch (e) { }
        }

        row[col.header] = val ?? '';
      });
      return row;
    });

    this.excelService.exportAsExcelFile(exportData, this.exportFileName);
  }
}
