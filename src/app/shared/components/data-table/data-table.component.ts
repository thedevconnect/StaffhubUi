
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ColumnDefinition {
  key: string;
  header: string;
  type?: 'text' | 'image' | 'date' | 'status' | 'custom' | 'action';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnChanges {
  @Input() columns: ColumnDefinition[] = [];
  @Input() data: any[] = [];
  @Input() totalItems: number = 0;
  @Input() itemsPerPageOptions: number[] = [10, 20, 50, 100];

  @Output() onSearch = new EventEmitter<string>();
  @Output() onRefresh = new EventEmitter<void>();
  @Output() onExportExcel = new EventEmitter<void>();
  @Output() onPageChange = new EventEmitter<number>();
  @Output() onPageSizeChange = new EventEmitter<number>();
  @Output() onView = new EventEmitter<any>();

  searchText: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  sortKey: string = '';
  sortDir: 'asc' | 'desc' = 'asc';

  get displayData(): any[] {
    let result = [...this.data];

    if (this.sortKey) {
      result.sort((a, b) => {
        const valA = a[this.sortKey] || '';
        const valB = b[this.sortKey] || '';
        if (valA < valB) return this.sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const start = (this.currentPage - 1) * this.itemsPerPage;
    return result.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get pages(): number[] {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['totalItems'] || changes['itemsPerPage']) {
      // Ensure current page is valid when total items or page size change
      if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.setPage(this.totalPages);
      }
    }
  }

  handleSearch() {
    this.currentPage = 1;
    this.onSearch.emit(this.searchText);
  }

  handleSort(key: string) {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
  }

  handleRefresh() {
    this.onRefresh.emit();
  }

  handleExportExcel() {
    this.onExportExcel.emit();
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.onPageChange.emit(this.currentPage);
    }
  }

  onPageSizeSelect(event: any) {
    this.itemsPerPage = Number(event.target.value);
    this.currentPage = 1; // Reset to first page
    this.onPageSizeChange.emit(this.itemsPerPage);
  }
}
