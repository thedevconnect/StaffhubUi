import { Directive, HostListener, Input, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appSortable]',
  standalone: true,
})
export class SortableDirective {
  @Input() sortKey: string = '';
  @Input() currentSortKey: string = '';
  @Input() currentSortOrder: 'asc' | 'desc' | '' = '';
  @Output() sortChange = new EventEmitter<{ key: string; order: 'asc' | 'desc' }>();

  @HostListener('click')
  onClick(): void {
    if (!this.sortKey) {
      return;
    }

    let newOrder: 'asc' | 'desc' = 'asc';

    if (this.currentSortKey === this.sortKey) {
      // Toggle order if same column
      newOrder = this.currentSortOrder === 'asc' ? 'desc' : 'asc';
    }

    this.sortChange.emit({ key: this.sortKey, order: newOrder });
  }
}

