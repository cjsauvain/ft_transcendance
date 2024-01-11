import { Injectable } from "@nestjs/common";
import { MessageI } from "./chat.interface";
import { CreateMessageDto } from "./create-messages-dto";
import { MessageService } from "./message/message.service";
import { Message } from "./message/message.entity";
import { Socket } from "socket.io";

@Injectable()
export class ChatService {
    constructor(private readonly messageService: MessageService) { }
    clientToUser = {};

    public identify(name: string, clientId: string)
    {
        this.clientToUser[clientId] = name;

        return Object.values(this.clientToUser);
    }

    getClientName(clientId: string) {
        return this.clientToUser[clientId];
    }

    create(payload: { name: string, text: string, target: string }) {
        if (payload.target === undefined || payload.name === undefined) {
            return 0;
        }
        const months = [payload.name, payload.target];
        months.sort();
        const roomId = months[0] + months[1];
        const message = {
            inviting_name: payload.name,
            message: payload.text,
            target_name: payload.target,
            room: roomId
        };
        this.messageService.createMessageDb(message);
        return message;
    }

    async findAll(userName: string): Promise<Message[]> {
        return await this.messageService.findAll(userName)
    }
}
