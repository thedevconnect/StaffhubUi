import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appOnlyNumber]',
  standalone: true,
})
export class OnlyNumberDirective {
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
    ];

    // Allow: backspace, delete, tab, escape, enter, arrows
    if (allowedKeys.indexOf(event.key) !== -1) {
      return;
    }

    // Ensure that it is a number and stop the keypress
    if (
      (event.shiftKey || event.key < '0' || event.key > '9') &&
      (event.key < '0' || event.key > '9')
    ) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedInput = event.clipboardData?.getData('text/plain') || '';
    const reg = /^[0-9]*$/;
    if (reg.test(pastedInput)) {
      document.execCommand('insertText', false, pastedInput);
    }
  }
}

