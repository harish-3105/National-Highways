import { Module } from '@nestjs/common';
import { HighwaysController } from './highways.controller';
import { HighwaysService } from './highways.service';

@Module({
  controllers: [HighwaysController],
  providers: [HighwaysService],
  exports: [HighwaysService],
})
export class HighwaysModule {}
