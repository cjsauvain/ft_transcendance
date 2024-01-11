import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Blocked
{
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  target_name: string;

  @Column()
  inviting_name: string;

}