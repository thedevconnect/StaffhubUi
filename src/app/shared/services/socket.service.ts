import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.apiBaseUrl, {
      autoConnect: false // Connect manually when authenticated
    });
  }

  connect(companyId: number | string) {
    if (!this.socket.connected) {
      this.socket.connect();
      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        this.socket.emit('join_company', companyId);
      });
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
        observer.next(data);
      });

      // Cleanup
      return () => {
        this.socket.off('attendance_updated');
      };
    });
  }
}
