import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { CookieService } from "ngx-cookie-service";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UserListService {
  private readonly _socket!: Socket;

  constructor(private readonly _cookieService: CookieService) {
    if (!this._cookieService.get('jwt_cookie')) {
      return ;
    }
    this._socket = new Socket({
      url : 'http://localhost:3000/game',
      options: {
        extraHeaders: {
          authorization: this._cookieService.get("jwt_cookie")
        }
      }
    });
  }

  public addSocket(socket: Socket): void {
    this._socket.emit('addSocket');
  }

  public hasReceivedInvitation(): Observable<[inviter: string, mode: "Normal" | "Shrink"]> {
    return (this._socket.fromEvent<[inviter: string, mode: "Normal" | "Shrink"]>('privateInvitation'));
  }

  public declinePrivateGame(): void {
    this._socket.emit('declineInvitation');
  }

  public acceptPrivateGame(): void {
    this._socket.emit('acceptInvitation');
  }
}
