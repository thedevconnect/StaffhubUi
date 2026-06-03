import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appOnlyString]',
  standalone: true,
})
export class OnlyStringDirective {
  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Tab',
      'End',
      'Home',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
      'Enter',
      'Space',
    ];

    // Allow: backspace, delete, tab, escape, enter, arrows, space
    if (allowedKeys.indexOf(event.key) !== -1) {
      return;
    }

    // Allow only letters (a-z, A-Z) and spaces
    const reg = /^[a-zA-Z\s]*$/;
    if (!reg.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedInput = event.clipboardData?.getData('text/plain') || '';
    const reg = /^[a-zA-Z\s]*$/;
    if (reg.test(pastedInput)) {
      document.execCommand('insertText', false, pastedInput);
    }
  }
}

