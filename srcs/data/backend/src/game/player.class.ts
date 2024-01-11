import { Paddle } from "./paddle.class";
import { Socket } from "socket.io";

export class Player {
  private readonly BASE_SCORE:number = 0;

  public paddle: Paddle;
  public score: number;
  public name: string;
  public socket: Socket;

  /**
   * @constructor
   */
  public constructor(name: string, socket: Socket, paddleX: number, paddleY: number, paddleWidth: number, paddleHeight: number) {
      this.paddle = new Paddle(paddleX, paddleY, paddleWidth, paddleHeight);
      this.score = 0;
      this.name = name;
      this.socket = socket;
  }

  public incrementScore(): void {
    this.score++;
  }

  public resetScore(): void {
    this.score = this.BASE_SCORE;
  }

  public getScore(): number {
    return (this.score);
  }
}
