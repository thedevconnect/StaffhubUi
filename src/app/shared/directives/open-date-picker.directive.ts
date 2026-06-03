import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appOpenDatePicker]',
  standalone: true,
})
export class OpenDatePickerDirective {
  constructor(private el: ElementRef) {}

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    // Find the date picker input in the parent element
    const input = this.el.nativeElement.parentElement?.querySelector('input');
    if (input) {
      input.focus();
      input.click();
    }
  }
}

