import { Controller, Get } from '@nestjs/common';
import { BlockedService, Blocked } from './blocked.service';

@Controller('blockeds')
export class BlockedController {
  constructor(private readonly blockedService: BlockedService) {}

  @Get()
  findAll(): Promise<Blocked[]> {
    return this.blockedService.findAll();
  }

}
