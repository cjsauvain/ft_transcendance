import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blocked } from './blocked.entity';
import { UserInterface } from 'src/user/user.interface';
import { BlockedInterface } from './blocked.interface';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.entity';

@Injectable()
export class BlockedService {
  constructor(
    @InjectRepository(Blocked)
    private readonly blockedRepository: Repository<Blocked>,
    private readonly userService: UserService
  ) {}

  async findAll(): Promise<Blocked[]> {
    return this.blockedRepository.find();
  }

  async findOne(id: string, inviting_name: string): Promise<Blocked> {
    return this.blockedRepository.findOne({ where: { target_name: id, inviting_name: inviting_name } });
  }

  async deleting(id: number): Promise<void> {
    const result = await this.blockedRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Blocked with id ${id} not found`);
    }
  }

  async deleteByUsername(target_name: string, inviting_name: string): Promise<void> {
    const blocked = await this.blockedRepository.findOne({ where: { target_name: target_name, inviting_name: inviting_name } });

    if (!blocked) {
      throw new NotFoundException(`Blocked with username ${target_name} not found`);
    }

    await this.blockedRepository.delete(blocked);
  }

  async addBlocked(newBlocked: Partial<User>, username: string)
  {
    const temp = await this.userService.findOneByName(newBlocked.login);
    if (this.blockedRepository.findOne({ where: { target_name: newBlocked.login, inviting_name: username }}) === null)
        return ;
    const blocked:BlockedInterface = { target_name: temp.login, inviting_name: username }
    this.blockedRepository.save(blocked);
  }
}

export { Blocked };
