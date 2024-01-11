import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserInterface } from './user.interface';
import { GameSummaryService } from 'src/game-summary/game-summary.service';
import { GameSummary } from 'src/game-summary/game-summary.entity';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly _repository: Repository<User>, private readonly _gameSummary: GameSummaryService) {}

  public async createUser(user: UserInterface): Promise<User> {
    return await this._repository.save(user);
  }

  public async findOneByName(userLogin: string): Promise<User | null> {
    return await this._repository.findOne({ where: { login: userLogin } }).catch((error) => {
      console.error(error);
      throw new Error(error);
    });
  }

  public async findAll():Promise<User[]> {
    return await this._repository.find();
  }

  public async setTfaSecret(secret: string, userId: number): Promise<void> {
    await this._repository.update(userId, { twoFactorAuthenticationSecret: secret });
  }

  public async setCodeTfa(userLogin: string, codeTfa: number): Promise<void> {
    const user: User = await this.findOneByName(userLogin);
    user.codeTfa = codeTfa;
    await this._repository.save(user);
  }

  public async getCodeTfa(userLogin: string): Promise<number> {
    const user: User = await this.findOneByName(userLogin);
    return user.codeTfa;
  }

  public async setTfaStatus(userLogin: string, status: string) {
    const user: User = await this.findOneByName(userLogin);
    user.TfaStatus = status;
    await this._repository.save(user);
  }

  public async getTfaStatus(userLogin: string) {
    const user: User = await this.findOneByName(userLogin);
    return user.TfaStatus;
  }

  public async setOnlineStatus(userLogin: string, status: boolean) {
    const user: User = await this.findOneByName(userLogin);
    if (status) {
      user.onlineStatus = "Online";
    }
    else {
      user.onlineStatus = "Offline";
    }
    await this._repository.save(user);
  }

  public async getOnlineStatus(userLogin: string): Promise<"Online" | "Offline"> {
    const user: User = await this.findOneByName(userLogin);
    return user.onlineStatus;
  }

  public async getUsername(userLogin: string): Promise<string> {
    const user: User = await this.findOneByName(userLogin);
    return user.username;
  }

  async updateUsername(userLogin: string, newUsername: string) {
    const userFound = await this._repository.findOne({ where: { username: newUsername } });
      if (userFound)
        return (1);
    const user = await this.findOneByName(userLogin);
      if (newUsername.length > 10 || newUsername.length < 3){
        return(2);
    } else {
      user.username = newUsername;
      await this._repository.save(user);
      return (3);
    }
  }

  public async updateAvatar(userLogin: string, newAvatar: string) {
    const user: User = await this.findOneByName(userLogin);
    user.image = newAvatar;
    await this._repository.save(user);
  }

  public async getWinrate(userLogin: string): Promise<number> {
    const user: User = await this.findOneByName(userLogin);

    return user.winrate;
  }

  public async wonGame(userLogin: string): Promise<void> {
    const user: User = await this.findOneByName(userLogin);
    user.numberOfWins++;
    await this._repository.save(user);
  }

  public async playedGame(userLogin: string): Promise<void> {
    const user: User = await this.findOneByName(userLogin);
    user.numberOfGames++;
    await this._repository.save(user);
  }

  public async calculateWinrate(userLogin: string): Promise<void> {
    const user: User = await this.findOneByName(userLogin);
    if (user.numberOfGames === 0) {
      user.winrate = 0;
    } else {
      user.winrate = Math.round((user.numberOfWins / user.numberOfGames) * 100);
    }
    await this._repository.save(user);
  }

  public async getGameData(login: string, matchHistory: GameSummary[]): Promise<{ history: GameSummary, opponent: string }[]> {
    let gameData: { history: GameSummary, opponent: string }[] = [];
    let opponent: string;
    for (let match of matchHistory) {
      if (login === match.winnerLogin) 
        opponent = match.loserLogin;
      
      else 
        opponent = match.winnerLogin;
      
      opponent = await this.getUsername(opponent);
      gameData.push({ history: match, opponent: opponent });
    }
    return gameData;
  }

  public async getAchievements(login: string): Promise<{ gameAmount: number, cleanSheet: number, victoryAmount: number }> {
    return {
      gameAmount: await this._gameSummary.getGameAmount(login),
      cleanSheet: await this._gameSummary.getCleanVictoryAmount(login),
      victoryAmount: await this._gameSummary.getVictoryAmount(login),
    }  

  }
}
