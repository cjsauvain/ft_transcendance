import {
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import {
  OnModuleInit,
  UseGuards
} from "@nestjs/common";
import { GameGuard } from "./game.guard";
import { Game } from "./game.class";
import { Paddle } from "./paddle.class";
import { Ball } from "./ball.class";
import { GameSummaryService } from "../game-summary/game-summary.service";
import { Player } from "./player.class";
import { UserService } from "../user/user.service";

export const ABSOLUTE_CANVAS_WIDTH: number = 1600;
export const ABSOLUTE_CANVAS_HEIGHT: number = 900;
const MAX_POINTS: number = 3;
const UNEXPECTED_ERROR: string = "An unexpected error happened. Game is aborted";
const FRIEND_DECLINED_INVITATION: string = "Your friend declined your game invitation";
const COULD_NOT_FIND_OPPONENT: string = "Could not retrieve opponent information. They may have disconnected";

interface IPlayer {
  name: string;
  socket: Socket;
  invited?: string,
  mode?: "Normal" | "Shrink",
}

@WebSocketGateway({ namespace: 'game', cors: true, origin: "http://localhost:4200" })
@UseGuards(GameGuard)
export class GameGateway implements OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  private _server: Server;
  private _normalQueue: Map<string, IPlayer> = new Map<string, IPlayer>;
  private _shrinkQueue: Map<string, IPlayer> = new Map<string, IPlayer>;
  private _privateQueue: Map<string, IPlayer> = new Map<string, IPlayer>;
  private _activeGames: Map<number, Game> = new Map<number, Game>;
  private _allConnectedPeople: Map<string, IPlayer> = new Map<string, IPlayer>;
  private _nextGameID: number = 0;

  constructor(private readonly _jwtService: JwtService,
              private readonly _gameSummaryService: GameSummaryService,
              private readonly _userService: UserService) {}

  public onModuleInit(): void {
    this._server.removeAllListeners('updatePosY');
  }

  public handleDisconnect(socket: Socket): void {
    const username: string = this._getUsername(socket);

    const playingGame: Game = this._isInGame(username);
    if (playingGame !== null) {
      playingGame.status = "Aborted";
    } else if (this._normalQueue.has(username) === true) {
      this._removePlayerFromNormalQueue(username);
    } else if (this._shrinkQueue.has(username) === true) {
      this._removePlayerFromShrinkQueue(username);
    } else if (this._privateQueue.has(username) === true) {
      this._removePlayerFromPrivateQueue(username);
    }

    this._allConnectedPeople.delete(username);
  }

  @SubscribeMessage("joinNormalQueue")
  private _handleJoinNormalQueue(socket: Socket): void {
    const username: string = this._getUsername(socket);

    if (this._normalQueue.has(username) === true) {
      return ;
    } else if (this._shrinkQueue.has(username) === true) {
      return ;
    }
    this._addPlayerToNormalQueue(username, socket);

    if (this._normalQueue.size % 2 === 0) {
      this._startGame("Normal", false, null, null);
      this._deleteFirstTwoUsersOfNormalQUeue();
    }
  }

  @SubscribeMessage("joinShrinkQueue")
  private _handleJoinShrinkQueue(socket: Socket): void {
    const username: string = this._getUsername(socket);

    if (this._shrinkQueue.has(username) === true) {
      return ;
    } else if (this._normalQueue.has(username) === true) {
      return ;
    }
    this._addPlayerToShrinkQueue(username, socket);

    if (this._shrinkQueue.size % 2 === 0) {
      this._startGame("Shrink", false, null, null);
      this._deleteFirstTwoUsersOfShrinkQUeue();
    }
  }

  @SubscribeMessage("joinPrivateQueue")
  private _handleJoinPrivateQueue(socket: Socket/*, [invited, mode]*/): void {
    const username: string = this._getUsername(socket);

    if (this._privateQueue.has(username) === true) {
      return;
    } else if (this._normalQueue.has(username) === true) {
      return;
    } else if (this._shrinkQueue.has(username) === true) {
      return;
    }

    const player: IPlayer = {
      name: username,
      socket: socket,
    }

    this._addPlayerToPrivateQueue(player);

    const inviter: IPlayer = this._hasSomeoneInvitedUser(username);
    if (inviter !== null) {
      const invited: IPlayer = this._privateQueue.get(username);
      this._startGame(inviter.mode, true, inviter, invited);
      this._deleteFirstTwoUsersOfPrivateQUeue();
    }
  }

  @SubscribeMessage("leaveNormalQueue")
  private _handleleavenormalqueue(socket: Socket): void {
    const username: string = this._getUsername(socket);

    if (this._normalQueue.has(username) === true) {
      this._removePlayerFromNormalQueue(username);
    }
  }

  @SubscribeMessage("leaveShrinkQueue")
  private _handleLeaveShrinkQueue(socket: Socket): void {
    const username: string = this._getUsername(socket);

    if (this._shrinkQueue.has(username) === true) {
      this._removePlayerFromShrinkQueue(username);
    }
  }

  @SubscribeMessage("leavePrivateQueue")
  private _handleLeavePrivateQueue(socket: Socket): void {
    const username: string = this._getUsername(socket);

    if (this._privateQueue.has(username) === true) {
      this._removePlayerFromPrivateQueue(username);
    }
  }

  @SubscribeMessage("updatePosY")
  private _updatePlayerPosY(socket: Socket, [gameID, newRelativePos]): void {
    const game: Game = this._activeGames.get(gameID);
    if (game === undefined) {
      return ;
    }

    const username: string = this._getUsername(socket);
    if (game.playerLeft.name === username) {
      game.playerLeft.paddle.setYFromRelative(newRelativePos);
    } else {
      game.playerRight.paddle.setYFromRelative(newRelativePos);
    }
  }

  /**
   * Send the opponent an invitation to play a private game
   * @param socket
   * @param opponent
   * @param mode
   * @private
   */
  @SubscribeMessage("inviteUserPrivateGame")
  private _inviteUserPrivateGame(socket: Socket, [opponent, mode]): void {
    const username: string = this._getUsername(socket);

    if (this._privateQueue.has(username) === true) {
      console.log("You can only invite one person at a time");
      return ;
    }

    const player: IPlayer = {
      name: username,
      socket: socket,
      invited: opponent,
      mode: mode,
    };
    this._addPlayerToPrivateQueue(player);

    const otherPlayer: IPlayer = this._allConnectedPeople.get(opponent);
    if (otherPlayer === undefined) {
      console.error("Could not retrieve opponent information. They may have disconnected");
      this._removePlayerFromPrivateQueue(username);
      player.socket.emit("error", COULD_NOT_FIND_OPPONENT);
      return ;
    }
    otherPlayer.socket.emit('privateInvitation', [username, mode]);
  }

  @SubscribeMessage("addSocket")
  private _addSocket(socket: Socket): void {
    const username: string = this._getUsername(socket);
    const player: IPlayer = {
      name: username,
      socket: socket,
    }

    this._allConnectedPeople.set(username, player);
  }

  @SubscribeMessage("leftComponentGame")
  private disconnectClient(socket: Socket): void {
    const username: string = this._getUsername(socket);

    const playingGame: Game = this._isInGame(username);
    if (playingGame !== null) {
      playingGame.status = "Aborted";
    } else if (this._normalQueue.has(username) === true) {
      this._removePlayerFromNormalQueue(username);
    } else if (this._shrinkQueue.has(username) === true) {
      this._removePlayerFromShrinkQueue(username);
    } else if (this._privateQueue.has(username) === true) {
      this._removePlayerFromPrivateQueue(username);
    }
  }

  /**
   * Accept the private game invitation
   * @param socket
   * @private
   */
  @SubscribeMessage("acceptInvitation")
  private _acceptInvitation(socket: Socket): void {
    const username: string = this._getUsername(socket);

    const player: IPlayer = {
      name: username,
      socket: socket,
    }
    this._addPlayerToPrivateQueue(player);

    const inviter: IPlayer = this._hasSomeoneInvitedUser(username);

    if (inviter !== null) {
      this._startGame(inviter.mode, true, inviter, player)
    }
  }

  /**
   * Decline the private game invitation
   * @param socket
   * @private
   */
  @SubscribeMessage("declineInvitation")
  private _declineInvitation(socket: Socket): void {
    const username: string = this._getUsername(socket);
    const inviter: IPlayer = this._hasSomeoneInvitedUser(username);

    if (inviter !== null) {
      this._removePlayerFromPrivateQueue(inviter.name);
      inviter.socket.emit("error", FRIEND_DECLINED_INVITATION);
    }
  }

  /**
   * Add a player to the normal queue
   * @param username
   * @param socket
   * @private
   */
  private _addPlayerToNormalQueue(username: string, socket: Socket): void {
    const player: IPlayer = {
      name: username,
      socket: socket,
    };
    this._normalQueue.set(username, player);
  }

  /**
   * Add a player to the shrink queue
   * @param username
   * @param socket
   * @private
   */
  private _addPlayerToShrinkQueue(username: string, socket: Socket): void {
    const player: IPlayer = {
      name: username,
      socket: socket,
    };
    this._shrinkQueue.set(username, player);
  }

  /**
   * Add a player to the private queue
   * @param player
   * @private
   */
  private _addPlayerToPrivateQueue(player: IPlayer): void {
    this._privateQueue.set(player.name, player);
    player.socket.emit('isInPrivateQueue', true);
  }

  /**
   * Remove a player from the normal queue
   * @param username
   * @private
   */
  private _removePlayerFromNormalQueue(username: string): void {
    this._normalQueue.delete(username);
  }

  /**
   * Remove a player from the shrink queue
   * @param username
   * @private
   */
  private _removePlayerFromShrinkQueue(username: string): void {
    this._shrinkQueue.delete(username);
  }

  /**
   * Remove a player from the private queue
   * @param username
   * @private
   */
  private _removePlayerFromPrivateQueue(username: string): void {
    const player: IPlayer = this._privateQueue.get(username);

    player?.socket.emit('isInPrivateQueue', false);

    this._privateQueue.delete(username);
  }

  private _isInGame(username: string): Game | null {
    for (let value of this._activeGames.values()) {
      if (value.playerLeft.name === username || value.playerRight.name === username) {
        return (value);
      }
    }
    return (null);
  }

  /**
   * Iterate through the private queue to determine if the opponent is in it
   * @private
   */
  private _hasSomeoneInvitedUser(user: string): IPlayer | null {
    for (let value of this._privateQueue.values()) {
      if (value.invited === user) {
        return (value);
      }
    }
    return (null);
  }

  /**
   * Emit an error message to the socket
   * @param err_msg
   * @param socket
   * @private
   */
  private _sendError(socket: Socket, err_msg: string): void {
    socket.emit('error', err_msg);
  }

  /**
   * When an error has been detected and the variable status has been set to 'abort', the game must be aborted. The players are removed from the queue and are sent a notification
   * @param game
   * @param isPrivate
   * @private
   */
  private _abortGame(game: Game, isPrivate: boolean): void {
    this._emitDataToRoom(`${game.id}`, "status", game.status);
    this._emitDataToRoom(`${game.id}`, "error", UNEXPECTED_ERROR);
    this._removePlayersFromRoom(`${game.id}`, game.playerLeft.socket, game.playerRight.socket)

    if (isPrivate === true) {
      this._removePlayerFromPrivateQueue(game.playerLeft.name);
      this._removePlayerFromPrivateQueue(game.playerRight.name);
    } else if (game.mode === "Normal") {
      this._removePlayerFromNormalQueue(game.playerLeft.name);
      this._removePlayerFromNormalQueue(game.playerRight.name);
    } else {
      this._removePlayerFromShrinkQueue(game.playerLeft.name);
      this._removePlayerFromShrinkQueue(game.playerRight.name);
    }
    this._activeGames.delete(game.id);
  }

  /**
   * Initialize the game, create the room and start the game
   * @param mode
   * @param isPrivate
   * @param inviter
   * @param invited
   * @private
   */
  private _startGame(mode: "Normal" | "Shrink", isPrivate: boolean, inviter: IPlayer | null, invited: IPlayer | null): void {
    let entries: IterableIterator<IPlayer>;
    let leftPlayer: IPlayer;
    let rightPlayer: IPlayer;

    if (mode === "Normal") {
      entries = this._normalQueue.values();
    } else {
      entries = this._shrinkQueue.values();
    }

    if (isPrivate === false) {
      leftPlayer = entries.next().value;
      rightPlayer = entries.next().value;
    } else {
      leftPlayer = inviter;
      rightPlayer = invited;
    }

    const game: Game = new Game(this._nextGameID, leftPlayer.name, leftPlayer.socket, rightPlayer.name, rightPlayer.socket, mode);
    this._activeGames.set(game.id, game);
    this._nextGameID++;
    if (this._nextGameID > 1000000000) {
      this._nextGameID = 0;
    }

    this._addPlayersInRoom(`${game.id}`, leftPlayer.socket, rightPlayer.socket)
    this._emitDataToRoom(`${game.id}`, "gameID", game.id);
    this._assignSides(leftPlayer.socket, rightPlayer.socket);
    this._sendAllGameData(game);

    /**
     * Print a 3...2...1 countdown before starting the game
     */
    let countdown: number = 3;
    const countdownIntervalID: NodeJS.Timeout = setInterval((): void => {
      if (countdown === 0) {
        clearInterval(countdownIntervalID);
        leftPlayer.socket.emit('startGame');
        rightPlayer.socket.emit('startGame');
        this._gameLogic(leftPlayer, rightPlayer, game, isPrivate);
      } else {
        this._server.in(`${game.id}`).emit(`countdown`, countdown);
        countdown--;
      }
    }, 1000);
  }

  /**
   * Make players' sockets join the room corresponding to their game
   * @param roomName
   * @param leftPlayerSocket
   * @param rightPlayerSocket
   * @private
   */
  private _addPlayersInRoom(roomName: string, leftPlayerSocket: Socket, rightPlayerSocket: Socket): void {
    leftPlayerSocket.join(roomName);
    rightPlayerSocket.join(roomName);
  }

  /**
   * Remove players' sockets from their room
   * @param roomName
   * @param leftPlayerSocket
   * @param rightPlayerSocket
   * @private
   */
  private _removePlayersFromRoom(roomName: string, leftPlayerSocket: Socket, rightPlayerSocket: Socket): void {
    leftPlayerSocket.leave(roomName);
    rightPlayerSocket.leave(roomName);
  }

  /**
   * Assign the first player in the queue to the left side and the second player to the right side of the field
   * @private
   */
  private _assignSides(leftPlayerSocket: Socket, rightPlayerSocket: Socket): void {
    leftPlayerSocket.emit('side', "Left");
    rightPlayerSocket.emit('side', "Right");
  }

  private _sendAllGameData(game: Game): void {

    const paddleLeftRelX: number = this._convToRelative(game.playerLeft.paddle.x, ABSOLUTE_CANVAS_WIDTH);
    const paddleLeftRelY: number = this._convToRelative(game.playerLeft.paddle.y, ABSOLUTE_CANVAS_HEIGHT);
    const paddleLeftRelHeight: number = this._convToRelative(game.playerLeft.paddle.height, ABSOLUTE_CANVAS_HEIGHT);
    this._emitDataToRoom(`${game.id}`, "paddleLeft", [paddleLeftRelX, paddleLeftRelY, paddleLeftRelHeight]);

    const paddleRightRelX: number = this._convToRelative(game.playerRight.paddle.x, ABSOLUTE_CANVAS_WIDTH);
    const paddleRightRelY: number = this._convToRelative(game.playerRight.paddle.y, ABSOLUTE_CANVAS_HEIGHT);
    const paddleRightRelHeight: number = this._convToRelative(game.playerRight.paddle.height, ABSOLUTE_CANVAS_HEIGHT);
    this._emitDataToRoom(`${game.id}`, "paddleRight", [paddleRightRelX, paddleRightRelY, paddleRightRelHeight]);

    const ballRelX: number = this._convToRelative(game.ball.x, ABSOLUTE_CANVAS_WIDTH);
    const ballRelY: number = this._convToRelative(game.ball.y, ABSOLUTE_CANVAS_HEIGHT);
    this._emitDataToRoom(`${game.id}`, "ballPos", [ballRelX, ballRelY]);

    this._emitDataToRoom(`${game.id}`, "leftScore", game.playerLeft.score);
    this._emitDataToRoom(`${game.id}`, "rightScore", game.playerRight.score);
  }

  private _emitDataToRoom(roomName: string, event: string, data: number | string | number[]): void {
    this._server.in(roomName).emit(event, data);
  }

  private _convToRelative(absValue: number, maxAbsValue: number): number {
    return ((absValue * 100) / maxAbsValue);
  }

  /**
   * 60 times per second the state of the game will be sent to both players until it's completed
   */
  private _gameLogic(leftPlayer: IPlayer, rightPlayer: IPlayer, game: Game, isPrivate: boolean): void {
    const id: NodeJS.Timeout = setInterval((): void => {
      if (game.status === "Aborted") {
        this._abortGame(game, isPrivate);
        clearInterval(id);
      }

      const leftPlayerScored: boolean = game.ball.x + game.ball.radius > ABSOLUTE_CANVAS_WIDTH;
      const rightPlayerScored: boolean = game.ball.x - game.ball.radius < 0;

      /**
       * A player scored
       */
      if (leftPlayerScored || rightPlayerScored) {
        game.playerLeft.paddle.resetAll();
        game.playerRight.paddle.resetAll();
        game.ball.resetPosition();
        game.ball.invertService();
        if (leftPlayerScored) {
          game.playerLeft.incrementScore();
          if (game.playerLeft.score === MAX_POINTS) {
            this._gameSuccessEnding(leftPlayer, rightPlayer, id, game, isPrivate);
            if (isPrivate === false) {
              this._sendSummaryToDB(game.id, game.playerLeft, game.playerRight, game.mode).catch((error): void => {
                console.error(error);
              });
            }
          }
        } else {
          game.playerRight.incrementScore();
          if (game.playerRight.score === MAX_POINTS) {
            this._gameSuccessEnding(rightPlayer, leftPlayer, id, game, isPrivate);
            if (isPrivate === false) {
              this._sendSummaryToDB(game.id, game.playerRight, game.playerLeft, game.mode).catch((error): void => {
                console.error(error);
              });
            }
          }
        }
      }
      /**
      * Ball bounced off the floor || ceiling
      */
      if (game.ball.y >= ABSOLUTE_CANVAS_HEIGHT || game.ball.y < 0) {
        game.ball.horizontalBounce();
      }
      /**
      * Bouncing on paddles
      * Evaluation is done only when the ball is at a distance of (2 * ball.speed_x) from each paddle
      */
      if (game.ball.x <= game.playerLeft.paddle.x + game.playerLeft.paddle.width + (2 * Math.abs(game.ball.speed_x))) {
        this._handleLeftPaddleCollision(game.playerLeft.paddle, game.ball, game);
      } else if (game.ball.x >= game.playerRight.paddle.x - (2 * Math.abs(game.ball.speed_x))) {
        this._handleRightPaddleCollision(game.playerRight.paddle, game.ball, game);
      }
      game.ball.moveBall();
      this._sendAllGameData(game)
    }, 1000 / 60);
  }

  /**
   * If ball has collided with paddle, we must determine the side from which it happened
   * Then set ball out of the paddle to avoid infinite collision
   */
  private _handleLeftPaddleCollision(paddle: Paddle, ball: Ball, game: Game): void {
    const hasCollided: boolean = this._isBallXWithinPaddle(paddle, ball) && this._isBallYWithinPaddle(paddle, ball);
    const ballPreviousX: number = ball.x - ball.speed_x;
    const ballPreviousY: number = ball.y - ball.speed_y;

    if (!hasCollided)
      return ;
    /**
     * Top side
     */
    if (ballPreviousY < paddle.y && ballPreviousX < (paddle.x + paddle.width)) {
      ball.horizontalBounce();
      ball.setPosition(ball.x, paddle.y - ball.radius);
    }
    /**
     * Bottom side
     */
    else if (ballPreviousY > (paddle.y + paddle.height) && ballPreviousX < (paddle.x+ paddle.width)) {
      ball.horizontalBounce();
      ball.setPosition(ball.x, paddle.y + paddle.height + ball.radius);
    }
    /**
     * Right side
     */
    else {
      ball.bouncePaddle(paddle.y, paddle.height);
      ball.setPosition(paddle.x + paddle.width + ball.radius, ball.y);
    }
    if (game.mode === "Shrink")
      game.playerLeft.paddle.shrink(2 * ball.radius);
  }

  /**
   * If ball has collided with paddle, we must determine the side by which it happened
   * Then set ball out of the paddle to avoid infinite collision
   */
  private _handleRightPaddleCollision(paddle: Paddle, ball: Ball, game: Game): void {
    const hasCollided: boolean = this._isBallXWithinPaddle(paddle, ball) && this._isBallYWithinPaddle(paddle, ball);
    const ballPreviousX: number = ball.x - ball.speed_x;
    const ballPreviousY: number = ball.y - ball.speed_y;

    if (!hasCollided)
      return ;
    /**
     * Top side
     */
    if (ballPreviousY < paddle.y && ballPreviousX > paddle.x) {
      ball.horizontalBounce();
      ball.setPosition(ball.x, paddle.y - ball.radius);
    }
    /**
     * Bottom side
     */
    else if (ballPreviousY > (paddle.y + paddle.height) && ballPreviousX > paddle.x) {
      ball.horizontalBounce();
      ball.setPosition(ball.x, paddle.y + paddle.height + ball.radius);
    }
    /**
     * Left side
     */
    else {
      ball.bouncePaddle(paddle.y, paddle.height);
      ball.setPosition(paddle.x - ball.radius, ball.y);
    }
    if (game.mode === "Shrink")
      game.playerRight.paddle.shrink(2 * ball.radius);
  }

  private _isBallXWithinPaddle(paddle: Paddle, ball: Ball): boolean {
    if (ball.x > paddle.x && ball.x <= (paddle.x + paddle.width))
      return (true);
    return (false);
  }

  private _isBallYWithinPaddle(paddle: Paddle, ball: Ball): boolean {
    if (ball.y > paddle.y && ball.y <= (paddle.y + paddle.height))
      return (true);
    return (false);
  }

  private _gameSuccessEnding(winner: IPlayer, loser: IPlayer, id: NodeJS.Timeout, game: Game, isPrivate: boolean): void {
    game.status = "Finished";
    this._emitDataToRoom(`${game.id}`, "status", game.status);
    this._assignResults(winner.socket, loser.socket);
    if (isPrivate === true) {
      this._removePlayerFromPrivateQueue(winner.name);
      this._removePlayerFromPrivateQueue(loser.name);
    } else if (game.mode === "Normal") {
      this._removePlayerFromNormalQueue(winner.name);
      this._removePlayerFromNormalQueue(loser.name);
    } else {
      this._removePlayerFromShrinkQueue(winner.name);
      this._removePlayerFromShrinkQueue(loser.name);
    }
    clearInterval(id);
    this._activeGames.delete(game.id);
  }

  /**
   * Send all the game summary to the appropriate database's tables
   * @private
   */
  private async _sendSummaryToDB(gameID: number, winner: Player, loser: Player, mode: "Normal" | "Shrink"): Promise<void> {
    try {
      await this._gameSummaryService.createGameSummary(gameID,
        winner.name,
        loser.name,
        winner.score,
        loser.score,
        mode);
      await this._userService.wonGame(winner.name);
      await this._userService.playedGame(winner.name);
      await this._userService.playedGame(loser.name);
      await this._userService.calculateWinrate(winner.name);
      await this._userService.calculateWinrate(loser.name);
      } catch(error) {
        console.error("Error happened while updating database");
      }
  }

  /**
   * Notify the players of the game result
   * @private
   */
  private _assignResults(winnerSocket: Socket, loserSocket: Socket): void {
    winnerSocket.emit('gameSuccessEnding', "You won the game");
    loserSocket.emit('gameSuccessEnding', "You lost the game");
  }

  /**
   * Extract the username from the socket's header and return it
   * @param socket
   * @private
   */
  private _getUsername(socket: Socket): string {
    return (this._jwtService.decode(socket.handshake.headers.authorization)['username']);
  }

  private _deleteFirstTwoUsersOfNormalQUeue(): void {
    const keys: IterableIterator<string> = this._normalQueue.keys();
    const firstPlayerName: string = keys.next().value;
    const secondPlayerName: string = keys.next().value;
    
    this._normalQueue.delete(firstPlayerName);
    this._normalQueue.delete(secondPlayerName);
  }

  private _deleteFirstTwoUsersOfShrinkQUeue(): void {
    const keys: IterableIterator<string> = this._normalQueue.keys();
    const firstPlayerName: string = keys.next().value;
    const secondPlayerName: string = keys.next().value;
    
    this._normalQueue.delete(firstPlayerName);
    this._normalQueue.delete(secondPlayerName);
  }

  private _deleteFirstTwoUsersOfPrivateQUeue(): void {
    const keys: IterableIterator<string> = this._normalQueue.keys();
    const firstPlayerName: string = keys.next().value;
    const secondPlayerName: string = keys.next().value;
    
    this._normalQueue.delete(firstPlayerName);
    this._normalQueue.delete(secondPlayerName);
  }
}
