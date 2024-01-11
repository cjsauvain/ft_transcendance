import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { Request, Response } from 'express';
import { JwtAuthenticationGuard } from './jwt_authentication_guard';
import { GameSummaryService } from "../game-summary/game-summary.service";
import { User } from './user.entity';
import { GameSummary } from "../game-summary/game-summary.entity";

@Controller('user')
@UseGuards(JwtAuthenticationGuard)
export class UserController {
  constructor(private readonly userService: UserService, private readonly gameSummaryService: GameSummaryService) {}

  @Get('profile')
  async getProfile(@Req() req: Request, @Res() res: Response) {
    const user: User  = await this.userService.findOneByName(req['user'].username);
    res.send({ username: user.username, img: user.image });
  }

  @Get('friendProfile')
  async getFriendProfile(@Query() login: { login: string }) {
    const user: User  = await this.userService.findOneByName(login.login);
    return { username: user.username, img: user.image };
  }

  @Get('setTfaStatus')
  async setTfaStatus(@Req() req: Request, @Query() tfaStatus: { TfaStatus: string }) {
      await this.userService.setTfaStatus(req['user'].username, tfaStatus.TfaStatus);
  }

  @Post('setOnlineStatus')
  async setOnlineStatus(@Req() req: Request, @Body() body: { status: boolean }) {
      await this.userService.setOnlineStatus(req['user'].username, body.status);
  }

  @Get('getOnlineStatus')
  async getOnlineStatus(@Req() request: Request) {
    return await this.userService.getOnlineStatus(request['user'].username);
  }

  @Get('getTfaStatus')
  async getTfaStatus(@Req() request: Request) {
    return await this.userService.getTfaStatus(request['user'].username);
  }

  @Get('matchHistory')
  async getMatchHistory(@Req() request: Request): Promise<{ history: GameSummary, opponent: string }[]> {
    const matchHistory: GameSummary[] | void  = await this.gameSummaryService.getGameHistory(request['user'].username)
    .catch((error): void => {
      console.error(error);
    });
    if (matchHistory) {
      return this.userService.getGameData(request['user'].username, matchHistory);
    }
  }

  @Get('updateUsername')
  async updateUsername(@Req() request: Request, @Query() newUsername: {newUsername: string}) {
    return await this.userService.updateUsername(request['user'].username, newUsername.newUsername);
  }
  
  @Get('getLogin')
  public getLogin(@Req() request: Request): { login: string } {
    return { login: request['user'].username };
  }
  
  @Post('updateAvatar')
  async updateAvatar(@Req() request: Request, @Body() body: { image: string }) {
    await this.userService.updateAvatar(request['user'].username, body.image);
  }

  @Get('getWinrate')
  public async getWinrate(@Req() request: Request): Promise<number | void> {
      return await this.userService.getWinrate(request['user'].username).catch((error): void => {
        console.error(error);
      });
  }

  @Get('getFriendWinrate')
  public async getFriendWinrate(@Query() login: { login: string }): Promise<number | void> {
      return await this.userService.getWinrate(login.login).catch((error): void => {
        console.error(error);
      });
  }

  @Get('getAchievements')
  public async getAchievements(@Req() request: Request): Promise<{ gameAmount: number, cleanSheet: number, victoryAmount: number }> {
    return await this.userService.getAchievements(request['user'].username);
  }

  @Get('getAllUsers')
  public async getAllUsers(@Req() request: Request): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Get('getUserStatus')
  public async getStatus(@Req() req: Request, @Res() res: Response, @Query() friend: {friend: string}) {
    const status: "Online" | "Offline" = await this.userService.getOnlineStatus(friend.friend);
    res.send({ status: status});
  }
  
}
