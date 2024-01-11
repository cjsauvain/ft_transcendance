import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  target_name: string;

  @Column()
  message: string;

  @Column()
  inviting_name: string;

  @Column()
  room: string; 
}
