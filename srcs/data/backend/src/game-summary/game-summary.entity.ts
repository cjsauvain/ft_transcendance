import {
  Entity,
  Column,
  PrimaryColumn,
  BaseEntity, CreateDateColumn
} from "typeorm";

@Entity('GameSummary')
export class GameSummary extends BaseEntity {
  @PrimaryColumn()
  gameID: number;

  @Column()
  winnerLogin: string;

  @Column()
  loserLogin: string;

  @Column()
  winnerScore: number;

  @Column()
  loserScore: number;

  @Column()
  mode: "Normal" | "Shrink"

  @CreateDateColumn({ type: 'date' })
  created_at: Date;
}
