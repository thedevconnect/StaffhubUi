import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'staffhub' | 'indigo' | 'emerald' | 'violet' | 'orange' | 'amber' | 'rose' | 'red' | 'custom';

export interface ColorDefinition {
  name: AccentColor;
  label: string;
  hex: string;
  hoverHex: string;
  lightBgHex: string;
  bgClass: string;
  badgeClass: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function adjustColorLightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const adjust = (val: number) => Math.min(255, Math.max(0, Math.round(val + (255 - val) * percent)));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

function adjustColorDarkness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const adjust = (val: number) => Math.min(255, Math.max(0, Math.round(val * (1 - percent))));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  themeMode = signal<ThemeMode>('light');
  accentColor = signal<AccentColor>('staffhub');
  customHexColor = signal<string>('#06b6d4');

  colorsList: ColorDefinition[] = [
    { name: 'staffhub', label: 'StaffHub Blue', hex: '#1976D2', hoverHex: '#1565C0', lightBgHex: '#e3f2fd', bgClass: 'bg-[#1976D2]', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
    { name: 'indigo', label: 'Indigo', hex: '#4f46e5', hoverHex: '#4338ca', lightBgHex: '#eef2ff', bgClass: 'bg-indigo-600', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { name: 'emerald', label: 'Emerald', hex: '#059669', hoverHex: '#047857', lightBgHex: '#ecfdf5', bgClass: 'bg-emerald-600', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { name: 'violet', label: 'Violet', hex: '#7c3aed', hoverHex: '#6d28d9', lightBgHex: '#f5f3ff', bgClass: 'bg-violet-600', badgeClass: 'bg-violet-50 text-violet-700 border-violet-200' },
    { name: 'orange', label: 'Orange', hex: '#ea580c', hoverHex: '#c2410c', lightBgHex: '#fff7ed', bgClass: 'bg-orange-500', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' },
    { name: 'amber', label: 'Amber', hex: '#d97706', hoverHex: '#b45309', lightBgHex: '#fffbeb', bgClass: 'bg-amber-500', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
    { name: 'rose', label: 'Rose', hex: '#e11d48', hoverHex: '#be123c', lightBgHex: '#fff1f2', bgClass: 'bg-rose-600', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
    { name: 'red', label: 'Red', hex: '#dc2626', hoverHex: '#b91c1c', lightBgHex: '#fef2f2', bgClass: 'bg-red-600', badgeClass: 'bg-red-50 text-red-700 border-red-200' }
  ];

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const savedMode = (localStorage.getItem('staffhub_theme_mode') as ThemeMode) || 'light';
    const savedAccent = (localStorage.getItem('staffhub_accent_color') as AccentColor) || 'staffhub';
    const savedCustomHex = localStorage.getItem('staffhub_custom_color') || '#06b6d4';

    this.customHexColor.set(savedCustomHex);
    this.setThemeMode(savedMode);

    if (savedAccent === 'custom') {
      this.setCustomAccentColor(savedCustomHex);
    } else {
      this.setAccentColor(savedAccent);
    }

    // Listen to system theme changes if mode is 'system'
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.themeMode() === 'system') {
          this.applyDarkState(e.matches);
        }
      });
    }
  }

  setThemeMode(mode: ThemeMode): void {
    this.themeMode.set(mode);
    localStorage.setItem('staffhub_theme_mode', mode);

    if (mode === 'system') {
      const isSystemDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyDarkState(isSystemDark);
    } else {
      this.applyDarkState(mode === 'dark');
    }
  }

  setAccentColor(color: AccentColor): void {
    this.accentColor.set(color);
    localStorage.setItem('staffhub_accent_color', color);
    document.documentElement.setAttribute('data-accent', color);

    const colorDef = this.colorsList.find(c => c.name === color);
    if (colorDef) {
      document.documentElement.style.setProperty('--accent-color', colorDef.hex);
      document.documentElement.style.setProperty('--accent-hover', colorDef.hoverHex);
      document.documentElement.style.setProperty('--accent-light-bg', colorDef.lightBgHex);
      document.documentElement.style.setProperty('--color-add', colorDef.hex);
      document.documentElement.style.setProperty('--color-add-hover', colorDef.hoverHex);
      document.documentElement.style.setProperty('--color-submit', colorDef.hex);
      document.documentElement.style.setProperty('--color-submit-hover', colorDef.hoverHex);
      document.documentElement.style.setProperty('--primary-color', colorDef.hex);
    }
  }

  setCustomAccentColor(hex: string): void {
    this.customHexColor.set(hex);
    this.accentColor.set('custom');
    localStorage.setItem('staffhub_accent_color', 'custom');
    localStorage.setItem('staffhub_custom_color', hex);

    document.documentElement.setAttribute('data-accent', 'custom');

    const p600 = hex;
    const p700 = adjustColorDarkness(hex, 0.15);
    const p500 = adjustColorLightness(hex, 0.1);
    const p100 = adjustColorLightness(hex, 0.80);
    const p50 = adjustColorLightness(hex, 0.92);
    const p200 = adjustColorLightness(hex, 0.65);

    document.documentElement.style.setProperty('--primary-600', p600);
    document.documentElement.style.setProperty('--primary-700', p700);
    document.documentElement.style.setProperty('--primary-500', p500);
    document.documentElement.style.setProperty('--primary-100', p100);
    document.documentElement.style.setProperty('--primary-50', p50);
    document.documentElement.style.setProperty('--primary-200', p200);

    document.documentElement.style.setProperty('--accent-color', p600);
    document.documentElement.style.setProperty('--accent-hover', p700);
    document.documentElement.style.setProperty('--accent-light-bg', p50);
    document.documentElement.style.setProperty('--color-add', p600);
    document.documentElement.style.setProperty('--color-add-hover', p700);
    document.documentElement.style.setProperty('--color-submit', p600);
    document.documentElement.style.setProperty('--color-submit-hover', p700);
  }

  private applyDarkState(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark');
      if (document.body) document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (document.body) document.body.classList.remove('dark');
    }
  }

  isDarkModeActive(): boolean {
    if (this.themeMode() === 'system') {
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return this.themeMode() === 'dark';
  }
}
