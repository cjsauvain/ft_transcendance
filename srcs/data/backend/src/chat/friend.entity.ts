import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Friend
{
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable: true})
  sender: string;

  @Column({nullable: true})
  receiver: string;
}