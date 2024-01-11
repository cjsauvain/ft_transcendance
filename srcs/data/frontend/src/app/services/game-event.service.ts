import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { GameWebsocketService } from "./game-websocket.service";
import { WrappedSocket } from "ngx-socket-io/src/socket-io.service";

@Injectable({
  providedIn: 'root'
})
export class GameEventService {
  private readonly _socket: WrappedSocket;
  constructor(private _websocket: GameWebsocketService) {
    this._socket = this._websocket.getSocket();
    if (!this._socket) {
      alert("Seems like you aren't logged in and shouldn't be on this page. You will be redirected to the home page");
      window.location.href = "http://localhost:4200";
    }
  }

  /**
   * Receiving data coming from the backend
   */
  public getIsStarted(): Observable<void> {
    return (this._socket.fromEvent<void>('startGame'));
  }

  public getSide(): Observable<"Left" | "Right"> {
    return (this._socket.fromEvent<"Left" | "Right">('side'));
  }

  public getGameID(): Observable<number> {
    return (this._socket.fromEvent<number>('gameID'));
  }

  public getPaddleLeftPos(): Observable<[relX: number, relY: number, relHeight: number]> {
    return (this._socket.fromEvent<[relX: number, relY: number, relHeight: number]>('paddleLeft'));
  }

  public getPaddleRightPos(): Observable<[relX: number, relY: number, relHeight: number]> {
    return (this._socket.fromEvent<[relX: number, relY: number, relHeight: number]>('paddleRight'));
  }

  public getBallPos(): Observable<[relX: number, relY: number]> {
    return (this._socket.fromEvent<[relX: number, relY: number]>('ballPos'));
  }

  public getStatus(): Observable<"Finished" | "Not Finished"> {
    return (this._socket.fromEvent<"Finished" | "Not Finished">('status'));
  }

  public getLeftScore(): Observable<number> {
    return (this._socket.fromEvent<number>('leftScore'));
  }

  public getRightScore(): Observable<number> {
    return (this._socket.fromEvent<number>('rightScore'));
  }

  public getGameSuccessEnding(): Observable<string> {
    return (this._socket.fromEvent<string>('gameSuccessEnding'));
  }

  public getCountdown(): Observable<string> {
    return (this._socket.fromEvent<string>('countdown'));
  }

  public getError(): Observable<string> {
    return (this._socket.fromEvent<string>('error'));
  }

  public isInQueue(): Observable<boolean> {
    return (this._socket.fromEvent<boolean>('inInQueue'));
  }

  /**
   * Sending data to the backend
   */
  public updatePosY(gameID: number, relNewPos: number): void {
    this._socket.emit('updatePosY', gameID, relNewPos);
  }

  public joinQueue(queue: string/*, invited?: string, mode?: "Normal" | "Shrink"*/): void {
    this._socket.emit(`join${queue}Queue`/*, [invited, mode]*/);
  }

  public leaveQueue(queue: string): void {
    this._socket.emit(`leave${queue}Queue`);
  }

  public inviteToPrivateGame(opponent: string, mode: "Normal" | "Shrink"): void {
    this._socket.emit('inviteUserPrivateGame', [opponent, mode])
  }

  public connect(): void {
    this._socket.connect();
  }

  public disconnect(): void {
    this._socket.emit('leftComponentGame');
  }

  /**
   * Others
   */
  public removeAllListeners(): void {
    this._socket.removeAllListeners();
  }
}
