import { ABSOLUTE_CANVAS_HEIGHT } from "./game.gateway"

export class Paddle {
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  public baseX: number;
  public baseY: number;
  public baseHeight: number;

  /**
   * @constructor
   */
  public constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.baseX = x;
    this.baseY = y;
    this.baseHeight = height;
  }

  /**
   * START OF GETTERS
   */
  public getX(): number {
    return (this.x);
  }

  public getY(): number {
    return (this.y);
  }

  public getWidth(): number {
    return (this.width);
  }

  public getHeight(): number {
    return (this.height);
  }
  /**
   * END OF GETTERS
   */

  /**
   * START OF SETTERS
   */
  public setX(x: number): void {
    this.x = x;
  }

  public setY(y: number): void {
    this.y = y;
  }

  /**
   * Receive a relative position between 0 and 100 and set the Y value into its absolute equivalent
   * @param y
   */
  public setYFromRelative(y: number): void {
    this.y = (y * ABSOLUTE_CANVAS_HEIGHT) / 100;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public setWidth(width: number): void {
    this.width = width;
  }

  public setHeight(height: number): void {
    this.height = height;
  }

  public resetHeight(): void {
    this.height = this.baseHeight;
  }

  public resetPosition(): void {
    this.x = this.baseX;
    this.y = this.baseY;
  }

  public resetAll(): void {
    this.resetHeight();
    this.resetPosition();
  }
  /**
   * END OF SETTERS
   */

  /**
   * Calculate the position of the mouse relative to the user's canvas and move the paddle y accordingly
   * @param canvasRect
   * @param event
   */
  public followMouse(canvasRect: DOMRect, event: MouseEvent): void {
    const userCanvasHeight: number = canvasRect.bottom - canvasRect.top;
    const mouseInCanvasYPx: number = event.clientY - canvasRect.top;
    const mouseInCanvasYPerc: number = mouseInCanvasYPx * 100 / userCanvasHeight;
    let updatedPos: number = (ABSOLUTE_CANVAS_HEIGHT * mouseInCanvasYPerc / 100) - (this.height / 2);

    /**
     * Provide paddle from going over top edge
     */
    if (updatedPos < 0)
      updatedPos = 0;
    /**
     * Provide paddle from going over bottom edge
     */
    else if (updatedPos >= ABSOLUTE_CANVAS_HEIGHT - this.height)
      updatedPos = ABSOLUTE_CANVAS_HEIGHT - this.height;
    this.y = updatedPos;
  }

  /**
   * Bonus game mode in which paddles shrink everytime leftPlayer touches the ball
   * Calculate the length to delete and move the paddle down of half this value to seem like both sides shrank
   * @param ball_diameter
   */
  public shrink(ball_diameter: number): void {
    let toSubtract: number;

    if (this.height - (ABSOLUTE_CANVAS_HEIGHT / 10) < ball_diameter)
      toSubtract = this.height - ball_diameter;
    else
      toSubtract = ABSOLUTE_CANVAS_HEIGHT / 10;
    this.height -= toSubtract;
    this.setY(this.y + (toSubtract / 2));
  }
}
