import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { CookieService } from "ngx-cookie-service";

@Injectable({
    providedIn: 'root'
})
export class GameWebsocketService {
  private readonly _socket!: Socket;

  constructor(private _cookieService: CookieService) {
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

  public getSocket(): Socket {
    return (this._socket);
  }
}
