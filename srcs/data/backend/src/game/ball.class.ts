import { ABSOLUTE_CANVAS_HEIGHT } from "./game.gateway";

export class Ball {
  private readonly BALL_BASE_SPEED_X: number = 10;
  private readonly BALL_BASE_SPEED_Y: number = 10;

  public x: number;
  public y: number;
  public radius: number;
  public speed_x: number;
  public speed_y: number;

  public baseX: number;
  public baseY: number;

  /**
   * @constructor
   */
  public constructor(x: number, y: number, radius: number) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed_x = this.BALL_BASE_SPEED_X;
    this.speed_y = this.BALL_BASE_SPEED_Y;
    this.resetService();

    this.baseX = x;
    this.baseY = y;
  }

  public moveBall(): void {
    this.x += this.speed_x;
    this.y += this.speed_y;
  }

  public setBasePosition(x: number, y: number): void {
    this.baseX = x;
    this.baseY = y;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public horizontalBounce(): void {
    this.speed_y *= -1;
  }

  /**
   * Invert the x speed of the ball and calculate its angle depending on the collision point on the paddle
   * @param paddleY
   * @param paddleHeight
   */
  public bouncePaddle(paddleY: number, paddleHeight: number): void {
    /**
     *  Normalize the collision point to a value between 0 and 1
     *  Xnormalized = (X - Xminimum) / (Xmaximum - Xminimum)
     *             = (this.y - paddleY) / (paddleY + paddleHeight - paddleY)
     *  Multiply by 2 to have a normalization between 0 and 2
     *             = ((this.y - paddleY) / paddleHeight) * 2
     *  Substract 1 to have a normalization between -1 and 1
     *  -1 is top of paddle and 1 is bottom of paddle
     *             = (((this.y - paddleY) / paddleHeight) * 2) - 1
     */
    const collisionPointRelativeToPaddlePx: number = this.y - paddleY;
    let normalizedCollisionPoint: number = ((collisionPointRelativeToPaddlePx / paddleHeight) * 2) - 1;

    // in case the ball hit the very tip of the paddle, we invert the normalized point that the ball isn't sent in a straight line
    if (normalizedCollisionPoint === 1 || normalizedCollisionPoint === -1) {
      normalizedCollisionPoint = -normalizedCollisionPoint;
    }

    this.speed_x *= -1;
    this.speed_y = Math.sin(normalizedCollisionPoint) * Math.abs(this.speed_x);
  }

  /**
   * Choose a random angle for the service. See bouncePaddle() for normalization
   */
  public randomizeServiceAngle(): void {
    const normalizedValue: number = (Math.random() * 2) - 1;
    this.speed_y = Math.sin(normalizedValue) * Math.abs(this.speed_x);
  }

  /**
   * When a player scores, the ball must go in the opposite direction, simulating a swap of service
   */
  public invertService(): void {
      this.speed_x *= -1;
      this.randomizeServiceAngle();
  }

  /**
   * Choose randomly if the ball is served to the right or to the left
   */
  public resetService(): void {
    this.speed_x *= Math.random() < 0.5 ? -1 : 1;
    this.randomizeServiceAngle();
  }

  public resetPosition(): void {
    this.x = this.baseX;
    this.y = this.baseY;
  }
}
