import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BusinessDayController } from './controllers/business-day.controller';
import { BusinessDayService } from './services/business-day.service';
import { HolidayService } from './services/holiday.service';

@Module({
  imports: [],
  controllers: [AppController, BusinessDayController],
  providers: [AppService, BusinessDayService, HolidayService],
})
export class AppModule {}
