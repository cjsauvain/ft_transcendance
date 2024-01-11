import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';

import { ChatController } from './chat/chat.controller';
import { ChatGateway } from './chat/chat.gateway';
import { ChatService } from './chat/chat.service';

import { GameGateway } from './game/game.gateway';
import { GameSummaryService } from './game-summary/game-summary.service';
import { GameSummary } from "./game-summary/game-summary.entity";

import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { User } from './user/user.entity';

import { VerifyAuthGateway } from './verify_auth/verify_auth.gateway';
import { FriendService } from './chat/friend.service';
import { SendgridService } from './auth/sendgrid.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessageService } from './chat/message/message.service';
import { Message } from './chat/message/message.entity';
import { Blocked } from './chat/blocked.entity';
import { BlockedService } from './chat/blocked.service';
import { Friend } from './chat/friend.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../../../.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'postgres',
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [User, GameSummary, Message, Blocked, Friend],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, GameSummary,Message, Blocked, Friend]),

    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '5h' },
    }),
  ],

  controllers: [ChatController, AuthController, UserController],
  providers: [
    ChatGateway,
    ChatService,
    AuthService,
    UserService,
    GameGateway,
    FriendService,
    VerifyAuthGateway,
    SendgridService,
    ConfigService,
    GameSummaryService,
    MessageService,
    BlockedService,
  ],
})
export class AppModule {}
