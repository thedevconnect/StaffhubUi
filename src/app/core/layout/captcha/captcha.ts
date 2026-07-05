import { CommonModule } from '@angular/common';
import { Component, OnInit, ElementRef, ViewChild, Output, EventEmitter, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-captcha',
  imports: [CommonModule, FormsModule],
  templateUrl: './captcha.html',
  styleUrl: './captcha.scss'
})
export class Captcha implements OnInit {
  @ViewChild('captchaCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // The correct CAPTCHA string
  captchaText = signal('');
  userInput = signal('');

  // Publicly accessible computed signal for validation
  isValid = computed(() => this.userInput() === this.captchaText());

  ngOnInit(): void {
    this.generateCaptcha();
  }

  generateCaptcha(): void {
    const chars = '678900';
    let text = '';
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.captchaText.set(text);
    this.drawCaptcha(text);
  }

  drawCaptcha(text: string): void {
    const canvas: HTMLCanvasElement = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background color for the CAPTCHA box
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some random dots and lines for noise
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#888';
      ctx.fill();
    }

    // Set text properties
    ctx.font = '28px Arial';
    ctx.fillStyle = '#444';
    ctx.textAlign = 'center';

    // Draw characters with some distortion
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate((i * 20) + 20, 30);
      ctx.rotate((Math.random() * 0.2) - 0.1); // Small random rotation
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
  }

  // Method to be called by the parent component for validation

}
