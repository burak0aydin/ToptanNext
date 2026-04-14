import { Module } from '@nestjs/common';
import { SectorsController } from './sectors.controller';
import { SectorsRepository } from './sectors.repository';
import { SectorsService } from './sectors.service';

@Module({
  controllers: [SectorsController],
  providers: [SectorsRepository, SectorsService],
  exports: [SectorsService],
})
export class SectorsModule {}
