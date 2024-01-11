import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { User } from "../user/user.entity";
import { UserService } from '../user/user.service';

@WebSocketGateway({
  namespace: 'verify_auth',
  cors: true,
  origin: 'http://localhost:4200',
})
export class VerifyAuthGateway {

  constructor(private readonly _jwtService: JwtService,
              private readonly _userService: UserService) {}

  @SubscribeMessage('verify_auth')
  async handleVerifyAuth(socket: Socket): Promise<boolean> {
    const username: string = this._jwtService.decode(socket.handshake.headers.authorization)['username'];
    const expires: number = this._jwtService.decode(socket.handshake.headers.authorization)['exp'] * 1000;
    const resolved_user: User = await this._userService.findOneByName(username);
    const now: number = Date.now();

    if (expires > now && resolved_user !== null) {
      this._userService.setOnlineStatus(username, true);
      return (true);
    }
    else {
      console.error("From VerifyAuthGuard: Token is no longer valid");
      return (false);
    }``
  }
}