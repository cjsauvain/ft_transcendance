import {Body, Req, Controller, Get, Post, UseGuards, Query} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthenticationGuard } from '../user/jwt_authentication_guard';
import { SendgridService } from './sendgrid.service';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly appService: AuthService,
    private readonly sendgridService: SendgridService,
  ) {}

  @Post()
  async authenticate(@Body() body: { code: string }) {
    try {
      return { jwt_token: await this.appService.login(body.code) };
    } catch (error) {
      return { error };
    }
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get('tfa')
  async sendCode(@Req() request: Request) {
    await this.sendgridService.sendCode(request['user']);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get('verify-tfa')
  async verifyCode(@Req() request: Request, @Query() userInput: { userInput: number }) {
    return await this.sendgridService.verifyCode(request['user'].username, userInput.userInput);
  }
}
