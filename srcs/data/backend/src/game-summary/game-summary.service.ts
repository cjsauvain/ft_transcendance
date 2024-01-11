import { Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GameSummary } from "./game-summary.entity";

@Injectable()
export class GameSummaryService {
  constructor(@InjectRepository(GameSummary) private readonly _repository: Repository<GameSummary>) {}

  public async createGameSummary(gameID: number,
                                 winnerLogin: string,
                                 loserLogin: string,
                                 winnerScore: number,
                                 loserScore: number,
                                 mode: "Normal" | "Shrink"): Promise<GameSummary> {
    const res: GameSummary = this._repository.create({gameID, winnerLogin, loserLogin, winnerScore, loserScore, mode});
    return await this._repository.save(res);
  }

  public async getGameHistory(login: string): Promise<GameSummary[]> {
    return await this._repository.find({
      where: [
        { winnerLogin: login },
        { loserLogin: login },
      ],
      take: 10,
    });
  }

  public async getVictoryAmount(login: string): Promise<number> {
    return await this._repository.count({ where: { winnerLogin: login } });
  }

  public async getDefeatAmount(login: string): Promise<number> {
    return await this._repository.count({ where: { loserLogin: login } });
  }

  public async getGameAmount(login: string): Promise<number> {
    return await this._repository.count({
      where: [
        { winnerLogin: login },
        { loserLogin: login },
      ]
    });
  }

  public async getCleanVictoryAmount(login: string): Promise<number> {
    return await this._repository.count({
      where: {
        winnerLogin: login,
        loserScore: 0,
      }
    })
  }
}
