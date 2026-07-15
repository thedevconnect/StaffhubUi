import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  private companyId: number | string | null = null;

  constructor() {
    this.socket = io(environment.apiBaseUrl, {
      autoConnect: false, // Connect manually when authenticated
      transports: ['websocket', 'polling'] // Prefer websocket
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      if (this.companyId) {
        this.socket.emit('join_company', this.companyId);
      }
    });
  }

  connect(companyId: number | string) {
    this.companyId = companyId;
    if (!this.socket.connected) {
      this.socket.connect();
    } else {
      // If already connected, join room directly
      this.socket.emit('join_company', companyId);
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  onAttendanceUpdated(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('attendance_updated', (data) => {
        console.log('SOCKET EVENT RECEIVED: attendance_updated', data);
        observer.next(data);
      });

      // Cleanup
      return () => {
        this.socket.off('attendance_updated');
      };
    });
  }
}
