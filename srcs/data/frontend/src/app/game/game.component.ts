import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild
} from "@angular/core";
import { GameEventService } from "../services/game-event.service";
import { Subscription } from "rxjs";
import { CookieService } from "ngx-cookie-service";

const PADDLE_TO_CANVAS_WIDTH_RATIO: number = 0.01;

const enum ValueInIndex {
  X = 0,
  Y = 1,
  HEIGHT = 2,
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})

export class GameComponent implements AfterViewInit, AfterContentInit, OnDestroy {
  /**
   * PRIVATE ATTRIBUTES
   * */
  private _canvas:HTMLCanvasElement = {} as HTMLCanvasElement;
  private _context: CanvasRenderingContext2D | null = {} as CanvasRenderingContext2D;
  private _PADDLE_WIDTH!: number;
  private _BALL_RADIUS!: number;
  private _relativeMousePos!: number;

  /**
   * Subscriptions
   * @private
   */
  private _isStartedSubscription!: Subscription;
  private _sideSubscription!: Subscription;
  private _gameIDSubscription!: Subscription;
  private _paddleLeftSubscription!: Subscription;
  private _paddleRightSubscription!: Subscription;
  private _ballPosSubscription!: Subscription;
  private _statusSubscription!: Subscription;
  private _leftScoreSubscription!: Subscription;
  private _rightScoreSubscription!: Subscription;
  private _gameSuccessEndingSubscription!: Subscription;
  private _countdownSubscription!: Subscription;
  private _errorSubscription!: Subscription;
  private _isInQueueSubscription!: Subscription;

  /**
   * Values linked to said subscriptions
   * @private
   */
  private _side!: "Left" | "Right";
  private _paddleLeft!: [relX: number, relY: number, relHeight: number];
  private _paddleRight!: [relX: number, relY: number, relHeight: number];
  private _ball!: [x: number, y: number];
  private _status: "Finished" | "Not Finished" | "Aborted" = "Not Finished";
  private _leftScore: number = 0;
  private _rightScore: number = 0;
  private _isInQueue: boolean = false;

  private _mouseControl: boolean = false;

  /**
   * Get canvas from the DOM
   * @private
   */
  @ViewChild("canvas", { static: true }) private _canvasElement!: ElementRef;

  /**
   * Get the 2 radio buttons from the DOM to uncheck them when the game ends
   * @private
   */
  @ViewChild("radioButtonNormal", { static: true }) private _radioButtonNormal!: ElementRef;
  @ViewChild("radioButtonShrink", { static: true }) private _radioButtonShrink!: ElementRef;

  /**
   * PUBLIC ATTRIBUTES
   */
  public gameID: number = -1;
  public isStarted: boolean = false;
  public queueJoined: "Normal" | "Shrink" | "Private" | null = null;
  public selectedGameMode: "Normal" | "Shrink" | null = null;
  public hasBeenInvitedToPrivateGame: boolean = false;

  /**
   * Event listener on mouse movement
   */
  @HostListener('mousemove', ['$event']) onMouseMove(event: MouseEvent): void {
    if (this.isStarted && this._mouseControl) {
      const canvasRect: DOMRect = this._canvas.getBoundingClientRect();
      this._relativeMousePos = this._getRelativePaddlePos(canvasRect, event);
      this._gameEventService.updatePosY(this.gameID, this._relativeMousePos);
    }
  }

  /**
   * PUBLIC METHODS
   * */
  constructor(private readonly _gameEventService: GameEventService,
              private readonly _cookieService: CookieService) {}

  /**
   * Check if the state 'private' has been declared while navigating to this component
   * If yes, the user just invited someone to play a private game
   */
  public ngAfterContentInit(): void {
    const state = history.state;
    if (state.private === true)
      this.hasBeenInvitedToPrivateGame = true;
  }

  public ngAfterViewInit(): void {
    this._canvas = this._canvasElement.nativeElement;
    this._context = this._canvas.getContext("2d");
    if (!this._context) {
      console.error("From ngAfterViewInit(): !this._context");
      return ;
    }

    this._gameEventService.connect();
    this._calculateRatioValues();
    this._setDrawingParameters();
    this._socketListeners();
    if (this.hasBeenInvitedToPrivateGame) {
      this._displayMessage("Waiting for your friend");
      this._gameEventService.joinQueue("Private");
    } else {
      this._displayQueueJoiningScreen();
    }
  }

  public ngOnDestroy(): void {
    this._gameEventService.disconnect();
    this._gameEventService.removeAllListeners();

    this._isStartedSubscription.unsubscribe();
    this._sideSubscription.unsubscribe();
    this._gameIDSubscription.unsubscribe();
    this._paddleLeftSubscription.unsubscribe();
    this._paddleRightSubscription.unsubscribe();
    this._ballPosSubscription.unsubscribe();
    this._statusSubscription.unsubscribe();
    this._leftScoreSubscription.unsubscribe();
    this._rightScoreSubscription.unsubscribe();
    this._gameSuccessEndingSubscription.unsubscribe();
    this._countdownSubscription.unsubscribe();
    this._errorSubscription.unsubscribe();
  }

  /**
   * Turn on the mouseControl variable when the mouse is over the canvas
   */
  public onMouseOver(): void {
    this._mouseControl = true;
  }

  /**
   * Turn off the mouseControl variable when the mouse is over the canvas
   */
  public onMouseOut(): void {
    this._mouseControl = false;
  }

  /**
   * Notify the backend that this user clicked the join queue button
   */
  public joinQueue(): void {
    if (!this._cookieService.check('jwt_cookie')) {
      alert("Seems like you aren't logged in and shouldn't be on this page. You will be redirected to the home page");
      window.location.href = "http://localhost:4200";
    }
    if (!this._canvas || !this._context) {
      console.error("From startGame(): !this._canvas || this._context");
      return;
    } else if (this.gameID !== -1) {
      return;
    } else if (this.selectedGameMode === null) {
      alert("Please select a game mode");
      return;
    } else if (this.queueJoined !== null) {
      alert("You can only join one queue at a time");
      return ;
    }

    if (this._isInQueue === true) {
      alert("You can only join one queue at a time");
      return ;
    }

    this._gameEventService.joinQueue(this.selectedGameMode);
    this.queueJoined = this.selectedGameMode;
    this._displayWaitingScreen();
  }

  /**
   * Notify the backend that this user clicked the leave queue button
   */
  public leaveQueue(): void {
    // if no queue has been selected, this.queueJoined is undefined. It means the user is here because they initiated a private game. Hence the ?? "Private"
    this._gameEventService.leaveQueue(this.queueJoined ?? "Private");
    this.hasBeenInvitedToPrivateGame = false;
    this.queueJoined = null;
    this.selectedGameMode = null;
    this._radioButtonNormal.nativeElement.checked = false;
    this._radioButtonShrink.nativeElement.checked = false;
    this._displayQueueJoiningScreen();
  }

  /**
   * PRIVATE METHODS
   * */
  private _socketListeners(): void {
    /**
     * Listen to the event declaring the game has started and then update the display 60 times per second
     */
    this._isStartedSubscription = this._gameEventService.getIsStarted().subscribe((): void => {
      this.isStarted = true;
      const gameIntervalID = setInterval((): void => {
        this._printGame();
        if (this._status === "Finished" || this._status === "Aborted") {
          clearInterval(gameIntervalID);
        }
      }, 1000 / 60)
    });
    this._sideSubscription = this._gameEventService.getSide().subscribe((data: "Left" | "Right"): void => {
      this._side = data
    });
    this._gameIDSubscription = this._gameEventService.getGameID().subscribe((data: number): void => {
      this.gameID = data
    })
    this._paddleLeftSubscription = this._gameEventService.getPaddleLeftPos().subscribe((data: [relX: number, relY: number, relheight: number]): void => {
      this._paddleLeft = data
    });
    this._paddleRightSubscription = this._gameEventService.getPaddleRightPos().subscribe((data: [relX: number, relY: number, relHeight: number]): void => {
      this._paddleRight = data
    });
    this._ballPosSubscription = this._gameEventService.getBallPos().subscribe((data: [relX: number, relY: number]): void => {
      this._ball = data
    });
    this._statusSubscription = this._gameEventService.getStatus().subscribe((data: "Finished" | "Not Finished"): void => {
      this._status = data
    });
    this._leftScoreSubscription = this._gameEventService.getLeftScore().subscribe((data: number): void => {
      this._leftScore = data
    });
    this._rightScoreSubscription = this._gameEventService.getRightScore().subscribe((data: number): void => {
      this._rightScore = data
    });
    /**
     * Listen to the event declaring the game has successfully finished and then display the winning/losing screen
     */
    this._gameSuccessEndingSubscription = this._gameEventService.getGameSuccessEnding().subscribe((data: string): void => {
      setTimeout((): void => {
        this._displayMessage(data)
        this._resetValues();
      }, (1000 / 60) + 1);
    });
    this._countdownSubscription = this._gameEventService.getCountdown().subscribe((data: string): void => {
      this._displayMessage(data)
    });
    /**
     * Listen to the event declaring the game has been aborted
     */
    this._errorSubscription = this._gameEventService.getError().subscribe((data: string): void => {
      setTimeout((): void => {
        this._displayQueueJoiningScreen();
        alert(data);
        this._resetValues();
      }, (1000 / 60) + 1);
    })
    this._isInQueueSubscription = this._gameEventService.isInQueue().subscribe((data: boolean): void => {
      this._isInQueue = data;
    })
  }

  private _convToAbsolute(relativeValue: number, maxAbsValue: number): number {
    return ((relativeValue * maxAbsValue) / 100);
  }

  /**
   * Reset the variables to their default state
   * @private
   */
  private _resetValues(): void {
    this.gameID = -1;
    this.isStarted = false;
    this.queueJoined = null;
    this._status = "Not Finished";
    this.hasBeenInvitedToPrivateGame = false;
  }

  /**
   * Calculate the different game elements proportions depending on the user's canvas size
   * @private
   */
  private _calculateRatioValues(): void {
    const canvasRect: DOMRect = this._canvas.getBoundingClientRect();
    this._canvas.width = canvasRect.width;
    this._canvas.height = canvasRect.height;
    this._PADDLE_WIDTH = this._canvas.width * PADDLE_TO_CANVAS_WIDTH_RATIO;
    /**
     * Rectangle area: A = w * h
     * we want the ball to have an area equal to 4000th of the canvas' area (i.e. 4000 balls could fit in the canvas)
     * ballArea = (w * h) / 4000
     * Since the ball is a square, its sides' length are equal
     * ballArea = ballDiameter² = (w * h) / 4000
     * ballDiameter = sqrt((w * h) / 4000)
     * ballRadius = sqrt((w * h) / 4000) / 2
     */
    this._BALL_RADIUS = (Math.sqrt((this._canvas.width * this._canvas.height) / 4000) / 2);
  }

  /**
   * Initialize the drawing parameters of the canvas
   * @private
   */
  private _setDrawingParameters(): void {
    this._context!.font = '5vh sans-serif';
    this._context!.fillStyle = "white";
    this._context!.strokeStyle = "white";
    this._context!.lineWidth = 3;
    this._context!.textAlign = "center";
    this._context!.textBaseline = "middle";
  }

  /**
   * Calculate the position of the mouse relative to the user's canvas
   * @param canvasRect
   * @param event
   */
  private _getRelativePaddlePos(canvasRect: DOMRect, event: MouseEvent): number {
    const userCanvasHeight: number = canvasRect.height;
    let paddleHeight: number;

    if (this._side === "Left") {
      paddleHeight = this._convToAbsolute(this._paddleLeft[ValueInIndex.HEIGHT], this._canvas.height);
    } else {
      paddleHeight = this._convToAbsolute(this._paddleRight[ValueInIndex.HEIGHT], this._canvas.height);
    }

    let mouseInCanvasYPx: number = event.clientY - canvasRect.top - (paddleHeight / 2);

    if (mouseInCanvasYPx < 0) {
      mouseInCanvasYPx = 0
    } else if (mouseInCanvasYPx >= userCanvasHeight - paddleHeight) {
      mouseInCanvasYPx = userCanvasHeight - paddleHeight;
    }

    /**
     * Convert the absolute value into a relative value
     */
    const mouseInCanvasYPerc: number = mouseInCanvasYPx * 100 / userCanvasHeight;
    return (mouseInCanvasYPerc);
  }

  /**
   * Print the different elements composing the whole game field
   * @private
   */
  private _printGame(): void {
    if (!this._canvas || !this._context) {
      console.error("From _drawCanvasElements(): !this._context")
      return;
    }
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._drawLeftSide(this._leftScore, this._paddleLeft);
    this._drawRightSide(this._rightScore, this._paddleRight);
    this._drawBall(this._ball);
    this._drawDashedLine();
  }

  /**
   * Draw left player's name, score and paddle
   */
  private _drawLeftSide(score: number, paddle: [relX: number, relY: number, relHeight: number]): void {
    if (!this._context) {
      console.error ("From _drawLeftSide(): !this._context")
      return ;
    }
    const scoreX: number = this._canvas.width / 4;
    const scoreY: number = this._canvas.height * 0.03;
    this._context.fillText(score.toString(), scoreX, 2 * scoreY);
    this._drawPaddle(paddle);
  }

  /**
   * Draw right player's score and paddle
   */
  private _drawRightSide(score: number, paddle: [relX: number, relY: number, relHeight: number]): void {
    if (!this._context) {
      console.error("From _drawRightSide(): !this._context")
      return ;
    }
    const scoreX: number = this._canvas.width * 0.75;
    const scoreY: number = this._canvas.height * 0.03;
    this._context.fillText(score.toString(), scoreX, 2 * scoreY);
    this._drawPaddle(paddle);
  }

  /**
   * Draw the ball
   * @param ball
   * @private
   */
  private _drawBall(ball: [relX: number, relY: number]): void {
    if (!this._context) {
      console.error("From _drawBall(): !this._context")
      return;
    }
    const absX: number = this._convToAbsolute(ball[ValueInIndex.X], this._canvas.width);
    const absY: number = this._convToAbsolute(ball[ValueInIndex.Y], this._canvas.height);
    this._context.beginPath();
    this._context.fillRect(absX - this._BALL_RADIUS, absY - this._BALL_RADIUS, 2 * this._BALL_RADIUS, 2 * this._BALL_RADIUS);
    this._context.fill();
  }

  /**
   * Draw the dashed line separating the left and right sides of the field
   * @private
   */
  private _drawDashedLine(): void {
    if (!this._context) {
      console.error("From _drawDashedLine(): !this._context");
      return ;
    }
    /**
     * Original Pong has 30 dashes i.e. 30 dashes + 30 spaces = 60 elements to fit
     */
    const dashLength: number = this._canvas.height / 60;
    this._context.beginPath();
    this._context.setLineDash([dashLength, dashLength]);
    this._context.moveTo(this._canvas.width / 2, 0);
    this._context.lineTo(this._canvas.width / 2, this._canvas.height);
    this._context.stroke();
  }

  /**
   * Generic function drawing a paddle
   * @param paddle
   * @private
   */
  private _drawPaddle(paddle: [relX: number, relY: number, relHeight: number]): void {
    if (!this._context) {
      console.error("From _drawPaddle(): !this._context")
      return;
    }
    const absX: number = this._convToAbsolute(paddle[ValueInIndex.X], this._canvas.width);
    const absY: number = this._convToAbsolute(paddle[ValueInIndex.Y], this._canvas.height);
    const absHeight: number = this._convToAbsolute(paddle[ValueInIndex.HEIGHT], this._canvas.height);
    this._context.fillRect(absX, absY, this._PADDLE_WIDTH, absHeight);
  }

  /**
   * Notify the user they have to select a game mode
   * @private
   */
  private _displayQueueJoiningScreen(): void {
    if (!this._context) {
      console.error("From _displayQueueJoiningScreen(): !this._context");
      return ;
    }
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.fillText("Please join a queue", this._canvas.width / 2, this._canvas.height / 2);
  }

  /**
   * Notify the player they joined the queue and are now waiting for an opponent
   * @private
   */
  private _displayWaitingScreen(): void {
    if (!this._context) {
      console.error("From _displayWaitingScreen(): !this._context");
      return ;
    }
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.fillText(`${this.queueJoined} queue joined`, this._canvas.width / 2, (this._canvas.height / 2) - 50);
    this._context.fillText("Waiting for another player...", this._canvas.width / 2, (this._canvas.height / 2) + 50);
  }

  /**
   * Display the msg string on the user's screen
   * @param msg
   * @private
   */
  private _displayMessage(msg: string): void {
    if (!this._context) {
      console.error("From _displayMessage(): !this._context");
      return ;
    }
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.fillText(msg, this._canvas.width / 2, this._canvas.height / 2);
  }
}
