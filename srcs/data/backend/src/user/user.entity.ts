import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

@Entity('User')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  login: string;

  @Column({ nullable: true, unique: true })
  username: string;

  @Column()
  image: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  twoFactorAuthenticationSecret?: string;

  @Column({ default: 'false' })
  TfaStatus: string;

  @Column({ nullable: true })
  codeTfa?: number;

  @Column({ default: true })
  AfkStatus: boolean;

  @Column({ default: 0 })
  numberOfWins: number;

  @Column({ default: 0 })
  numberOfGames: number;

  @Column({ default: 0 })
  winrate: number;

  @Column({ default: "Offline" })
  onlineStatus: "Online" | "Offline";
}
