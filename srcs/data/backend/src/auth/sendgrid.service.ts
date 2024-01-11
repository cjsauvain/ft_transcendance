import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sendGrid from '@sendgrid/mail';
import { UserService } from '../user/user.service';

@Injectable()
export class SendgridService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  public async sendMessage(user: { sub: number, username: string, email: string }) {
    const code = Math.floor((Math.random() * 1000000) + 1);
    this.userService.setCodeTfa(user.username, code);
    const msg = {
      to: user.email,
      from: 'jsauvain@student.42angouleme.fr',
      subject: 'Two Factor Authentication',
      text: `Your code is: ${code}`,
    };
      sendGrid.send(msg);
  }

  public async sendCode(user: { sub: number, username: string, email: string }) {
    try {
      sendGrid.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
      await this.sendMessage(user);
    } catch (error) {
      return false;
    }
    return true;
  }

  public async verifyCode(userLogin: string, userInput: number) {
    const codeTfa = await this.userService.getCodeTfa(userLogin);
    if (userInput != codeTfa) {
      return false;
    }
    return true;
  }
}