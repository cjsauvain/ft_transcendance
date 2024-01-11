import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { CookieService } from "ngx-cookie-service";

@Injectable({
    providedIn: 'root'
})
export class ChatWebsocketService {
  private readonly _socket!: Socket;

  constructor(private _cookieService: CookieService) {
    if (!this._cookieService.get('jwt_cookie')) {
      return ;
    }
    this._socket = new Socket({
      url : 'http://localhost:3000/chat',
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

  joinChat(name: string) {
    this._socket.emit('join', { name });
  }

  isTyping(isTyping: boolean) {
    this._socket.emit('typing', { isTyping });
  }
}
