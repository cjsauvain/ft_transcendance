import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { User } from "../user/user.entity"
import { Socket } from "socket.io";
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

const INVALID_TOKEN: string = "This token is no longer valid"

@Injectable()
export class ChatGuard implements CanActivate {
  constructor(
    private readonly _jwtService: JwtService,
    private readonly _userDbService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket: Socket = context.switchToHttp().getRequest().user;

    const decodedToken: any = this._jwtService
      .decode(
        context
          .switchToHttp()
          .getRequest()
          .handshake
          .headers
          .authorization);
    const username: string = decodedToken.username;
    const resolved_user: User = await this._userDbService.findOneByName(username);
    const expires: number = decodedToken.exp * 1000;
    const now: number = Date.now();

    if (expires > now && resolved_user !== null) {
      return (true);
    }
    else {
      console.error("From ChatGuard: Token is no longer valid");
      return (false);
    }
  }
}
