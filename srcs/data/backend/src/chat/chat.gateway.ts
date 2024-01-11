import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "http";
import { Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "src/user/user.service";
import { ChatService } from "./chat.service";
import { FriendService } from "./friend.service";
import { MessageService } from "./message/message.service";
import { BlockedService } from "./blocked.service";
import { Friend } from "./friend.entity";
import { ChatGuard } from "./chat.guard";
import { UseGuards } from "@nestjs/common";

@WebSocketGateway({ namespace: 'chat', cors: true, origin: "http://localhost:4200" })
@UseGuards(ChatGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;
  private _username: string;

  constructor(private _jwtService: JwtService, private _userService: UserService,
    private readonly messageService: MessageService,
    private readonly chatService: ChatService,
    private readonly friendService: FriendService,
    private readonly blockedService: BlockedService
  ) {}

  public async handleConnection(socket: Socket): Promise<void>
  {
    const username: string = this._getUsername(socket);

    try {
      this._username = this._jwtService.decode(socket.handshake.headers.authorization)['username'];
      socket.emit('username', this._username);
    }
    catch (error) {
      console.error(error);
    }
    this._sendFriendList(socket);
  }

  public handleDisconnect(socket: Socket): void {
    const username: string = this._getUsername(socket);
  }

  /**
   * Send their friend list to a specific user
   * @param socket 
   * @returns 
   */
  public async _sendFriendList(socket: Socket): Promise<void>{
    const username: string = this._getUsername(socket);
    const allFriends: Friend[] = await this.friendService.findAllFriendsOfUser(username);

    socket.emit('getFriendList', allFriends);
  }

  @SubscribeMessage('getPrevMessages')
  async getPrevMessages(socket: Socket, room: string)
  {
    socket.emit('getMessageOn', await this.messageService.findAllByRoom(room));
  }

  @SubscribeMessage('createMessage')
  async create(socket: Socket, payload: { name: string, text: string, target: string })
  {
    const message = await this.chatService.create(payload);
    this.server.emit('message', message);
    return message;
  }

  @SubscribeMessage('findAllMessages')
  findAll(@ConnectedSocket() client: Socket)
  {
    return this.chatService.findAll(this._jwtService.decode(client.handshake.headers.authorization)['username']);
  }

  @SubscribeMessage('join')
  joinRoom(@MessageBody('name') name: string, @ConnectedSocket() client: Socket)
  {
    return this.chatService.identify(name, client.id);
  }

    /**
   * Front end requested to receive user list
   * @param client
   */
  @SubscribeMessage("getUserList")
  public async SendList(socket: Socket): Promise<void> {
    const username: string = this._getUsername(socket);
    var userList: string[] = [];
    const list = await this._userService.findAll();

    // filter the list so that the user does not see themself
    list.forEach((element) => {
      if (element.login !== username) {
        userList.push(element.login);
      }
    });
    // send the data back
    socket.emit('getUserList', userList);
  }

  /**
   * Add the receiver user to the friend list
   * @param socket
   * @param receiver 
   */
  @SubscribeMessage("addFriend")
  public async addFriend(socket: Socket, receiver: string): Promise<void> {
    const username: string = this._getUsername(socket);
    const friend: Friend | null = await this.friendService.findOne(username, receiver);

    // receiver is not in your friend list
    if (friend === null) {
      await this.friendService.addFriend(username, receiver);
      setTimeout((): void => {
        this._sendFriendList(socket);
      }, 200);
    }
  }

  @SubscribeMessage("deleteFriend")
  public async deleteFriend(socket: Socket, receiver: string): Promise<void> {
    const username: string = this._getUsername(socket);

    await this.friendService.deleteByUsername(username, receiver);
    setTimeout((): void => {
      this._sendFriendList(socket);
    }, 200);
  }

  @SubscribeMessage("getStatus")
  public async getStatus(client: Socket, target_name: string)
  {
    const tmp: "Online" | "Offline" = await this._userService.getOnlineStatus(target_name);
    client.emit('setStatus', tmp);
  }

  /**
  * Extract the username from the socket's header and return it
  * @param socket
  * @private
  */
  private _getUsername(socket: Socket): string {
    return (this._jwtService.decode(socket.handshake.headers.authorization)['username']);
  }

// BLOCK

  @SubscribeMessage("addBlocked")
  public async addBlocked(client: Socket, target_name: string)
  {
    const user = await this._userService.findOneByName(target_name);
    this.blockedService.addBlocked(user, this._jwtService.decode(client.handshake.headers.authorization)['username']);
    client.emit('isBlockedAdded', true);
  }

  @SubscribeMessage("removeBlocked")
  async removeBlocked(client: Socket, target_name: string)
  {
    const blocked = await this.blockedService.deleteByUsername(target_name, this._jwtService.decode(client.handshake.headers.authorization)['username']);
    client.emit('isBlockedRemoved', true);
  }

  @SubscribeMessage("isBlocked")
  async isBlocked(client: Socket, target_name: string)
  {
    const user_target = await this._userService.findOneByName(target_name);
    const blocked = await this.blockedService.findOne(user_target.login, this._jwtService.decode(client.handshake.headers.authorization)['username']);
    if (blocked === null)
      client.emit('infoBlocked', false);
    else
      client.emit('infoBlocked', true);
  }

}