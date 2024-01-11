import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { WrappedSocket } from "ngx-socket-io/src/socket-io.service";
import { ChatWebsocketService } from './chat-websocket.service';

@Injectable({
  providedIn: 'root'
})
export class ChatEventService {
  private readonly _socket: WrappedSocket;
  constructor(private _websocket: ChatWebsocketService) {
    this._socket = this._websocket.getSocket();
    if (!this._socket) {
      alert("Seems like you aren't logged in and shouldn't be on this page. You will be redirected to the home page");
      window.location.href = "http://localhost:4200";
    }
  }

  /**
   * Receiving data coming from the backend
   */
  public getFriendList(): Observable<{id: number, sender: string, receiver: string}[]> {
    return (this._socket.fromEvent<{id: number, sender: string, receiver: string}[]>('updateFriendList'));
  }

  /**
   * Sending data to the backend
   */
  public addFriend(toAdd: string): void {
    this._socket.emit('addFriend', toAdd);
  }

  public deleteFriend(toDelete: string): void {
    this._socket.emit('deleteFriend', toDelete);
  }
}
