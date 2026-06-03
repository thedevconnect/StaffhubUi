import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly loadingState = signal<boolean>(false);

  // Get loading state (readonly)
  isLoading() {
    return this.loadingState.asReadonly();
  }

  // Set loading state
  setLoading(isLoading: boolean): void {
    this.loadingState.set(isLoading);
  }

  // Show loading
  show(): void {
    this.loadingState.set(true);
  }

  // Hide loading
  hide(): void {
    this.loadingState.set(false);
  }
}

