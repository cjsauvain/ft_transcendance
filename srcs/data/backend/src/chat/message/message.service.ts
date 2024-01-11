import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { MessageI } from '../chat.interface';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private readonly message: Repository<Message>,
    ) { }

    createMessageDb(message: MessageI) {
        this.message.save(message);
    }

    async findAll(userName: string): Promise<Message[]> {
        return await this.message.find({ where: { inviting_name: userName } })
    }

    async findAllByRoom(room: string): Promise<Message[]> {
        return await this.message.find({ where: { room: room} })
    }
}
