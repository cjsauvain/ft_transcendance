import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friend } from './friend.entity';
import { UserService } from 'src/user/user.service';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(Friend)
    private readonly friendRepository: Repository<Friend>,
    private readonly userService: UserService
  ) {}

  public async findAllFriendsOfUser(username: string): Promise<Friend[]> {
    return this.friendRepository.find({ where: { sender: username }});
  }

  public async findOne(sender: string, receiver: string): Promise<Friend | null> {
    return this.friendRepository.findOne({ where: { sender: sender, receiver: receiver } });
  }

  public async deleting(id: number): Promise<void> {
    const result = await this.friendRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Friend with id ${id} not found`);
    }
  }

  public async addFriend(sender: string, receiver: string): Promise<void> {
    const newFriend: Friend = this.friendRepository.create({sender, receiver});

    this.friendRepository.save(newFriend).catch((error): void => {
      console.error("Failed to save new friend to database: ");
      throw new Error(error);
    });
  }

  public async deleteByUsername(sender: string, receiver: string): Promise<void> {
    const friend = await this.friendRepository.findOne({ where: { sender: sender, receiver: receiver } });

    if (!friend) {
      console.error(`${receiver} not found in your friend list`);
      return ;
    }
    await this.friendRepository.delete(friend);
  }
}