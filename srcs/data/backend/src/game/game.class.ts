import { ABSOLUTE_CANVAS_WIDTH } from "./game.gateway";
import { ABSOLUTE_CANVAS_HEIGHT } from "./game.gateway";
import { Player } from "./player.class";
import { Ball } from "./ball.class";
import { Socket } from "socket.io";

export class Game {
  private readonly _PADDLE_TO_CANVAS_WIDTH_RATIO: number = 0.01;
  private readonly _PADDLE_TO_CANVAS_HEIGHT_RATIO: number = 0.16;
  public id: number;
  public playerLeft: Player;
  public playerRight: Player;
  public ball: Ball;
  public mode: "Normal" | "Shrink";
  public status: "Not finished" | "Finished" | "Aborted";

  /**
   * @constructor
   */
  public constructor(id: number, playerLeftName: string, playerLeftSocket: Socket, playerRightName: string, playerRightSocket: Socket, mode: "Normal" | "Shrink"/*, inviter?: string, invited?: string*/) {
    let paddleHeight: number;
    let paddleY: number;
    if (mode === "Normal") {
      paddleHeight = ABSOLUTE_CANVAS_HEIGHT * this._PADDLE_TO_CANVAS_HEIGHT_RATIO;
      paddleY = (ABSOLUTE_CANVAS_HEIGHT / 2) - (paddleHeight / 2);
    } else {
      paddleHeight = ABSOLUTE_CANVAS_HEIGHT;
      paddleY = 0;
    }
    const paddleWidth: number = ABSOLUTE_CANVAS_WIDTH * this._PADDLE_TO_CANVAS_WIDTH_RATIO;
    const paddleLeftX: number = paddleWidth;
    const paddleRightX: number = ABSOLUTE_CANVAS_WIDTH - (2 * paddleWidth);

    this.id = id;
    this.playerLeft = new Player(playerLeftName, playerLeftSocket, paddleLeftX, paddleY, paddleWidth, paddleHeight);
    this.playerRight = new Player(playerRightName, playerRightSocket, paddleRightX, paddleY, paddleWidth, paddleHeight);
    /**
     * Rectangle area: A = w * h
     * we want the ball to have an area equal to 4000th of the canvas' area (i.e. 4000 balls could fit in the canvas)
     * ballArea = (w * h) / 4000
     * Since the ball is a square, its sides' length are equal
     * ballArea = ballDiameter² = (w * h) / 4000
     * ballDiameter = sqrt((w * h) / 4000)
     * ballRadius = sqrt((w * h) / 4000) / 2
     */
    this.ball = new Ball(ABSOLUTE_CANVAS_WIDTH / 2, ABSOLUTE_CANVAS_HEIGHT / 2, (Math.sqrt((ABSOLUTE_CANVAS_WIDTH * ABSOLUTE_CANVAS_HEIGHT) / 4000) / 2));
    this.mode = mode;
    this.status = "Not finished";
  }
}
