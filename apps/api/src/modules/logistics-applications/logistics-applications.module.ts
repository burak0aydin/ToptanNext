import { Module } from '@nestjs/common';
import { LogisticsApplicationsController } from './logistics-applications.controller';
import { LogisticsApplicationsRepository } from './logistics-applications.repository';
import { LogisticsApplicationsService } from './logistics-applications.service';

@Module({
  controllers: [LogisticsApplicationsController],
  providers: [LogisticsApplicationsRepository, LogisticsApplicationsService],
})
export class LogisticsApplicationsModule {}
