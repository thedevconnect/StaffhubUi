import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AppConfig {
  apiUrl: string;
  baseUrl: string;
  elockerUrl?: string;
  appTitle?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly config = signal<AppConfig | null>(null);
  private configLoaded = false;

  constructor(private httpClient: HttpClient) {}

  async loadConfig(): Promise<void> {
    if (this.configLoaded) {
      return Promise.resolve();
    }

    try {
      const configData = await firstValueFrom(
        this.httpClient.get<AppConfig>('/assets/config.json')
      );
      this.config.set(configData);
      this.configLoaded = true;
    } catch (error) {
      console.error('Error loading config:', error);
      // Set default config if file not found
      this.config.set({
        apiUrl: 'http://localhost:3000/api',
        baseUrl: 'http://localhost:4200',
        appTitle: 'CrewNet',
      });
      this.configLoaded = true;
    }
  }

  get apiUrl(): string {
    return this.config()?.apiUrl || 'http://localhost:3000/api';
  }

  get baseUrl(): string {
    return this.config()?.baseUrl || 'http://localhost:4200';
  }

  get elockerUrl(): string {
    return this.config()?.elockerUrl || '';
  }

  get appTitle(): string {
    return this.config()?.appTitle || 'CrewNet';
  }

  getConfig(): AppConfig | null {
    return this.config();
  }
}

