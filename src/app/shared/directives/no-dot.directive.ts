import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appNoDot]',
  standalone: true,
})
export class NoDotDirective {
  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Prevent dot (period) key
    if (event.key === '.' || event.key === ',') {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedInput = event.clipboardData?.getData('text/plain') || '';
    const cleaned = pastedInput.replace(/[.,]/g, '');
    document.execCommand('insertText', false, cleaned);
  }
}

