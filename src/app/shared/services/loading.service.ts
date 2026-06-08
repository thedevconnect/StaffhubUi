import { Injectable } from '@angular/core';
import { BehaviorSubject, timer } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private _loading = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._loading.asObservable();
  private readonly MIN_LOADING_TIME_MS = 2000; // 2 second

  constructor() { }

  startLoading() {
    this._loading.next(true);
  }

  stopLoading() {
    // Ensure the loader is visible for at least the minimum time
    timer(this.MIN_LOADING_TIME_MS).pipe(
      finalize(() => this._loading.next(false))
    ).subscribe();
  }



}