import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { HolidayService } from './holiday.service';
import { WORKING_HOURS, COLOMBIA_TIMEZONE } from '../types/globals';

@Injectable()
export class BusinessDayService {
  private readonly logger = new Logger(BusinessDayService.name);

  constructor(private readonly holidayService: HolidayService) {}

  async calculateBusinessDateTime(
    days?: number,
    hours?: number,
    startDate?: string,
  ): Promise<string> {
    // Get current date in Colombia timezone or parse provided date
    let currentDateTime = startDate
      ? DateTime.fromISO(startDate, { zone: 'utc' }).setZone(COLOMBIA_TIMEZONE)
      : DateTime.now().setZone(COLOMBIA_TIMEZONE);

    this.logger.log(
      `Starting calculation from: ${currentDateTime.toISO()} (Colombia time)`,
    );

    // Adjust to nearest business hour if outside working time
    currentDateTime = await this.adjustToNearestBusinessTime(currentDateTime);

    // Add business days first
    if (days && days > 0) {
      currentDateTime = await this.addBusinessDays(currentDateTime, days);
    }

    // Then add business hours
    if (hours && hours > 0) {
      currentDateTime = await this.addBusinessHours(currentDateTime, hours);
    }

    // Convert back to UTC for response
    const resultUTC = currentDateTime.toUTC().toISO();
    this.logger.log(`Final result: ${resultUTC} (UTC)`);

    return resultUTC!;
  }

  private async adjustToNearestBusinessTime(
    dateTime: DateTime,
  ): Promise<DateTime> {
    const holidays = await this.holidayService.getColombianHolidays();

    // If it's a weekend or holiday, move to next business day at 8 AM
    while (this.isWeekend(dateTime) || this.isHoliday(dateTime, holidays)) {
      dateTime = dateTime.plus({ days: 1 }).set({
        hour: WORKING_HOURS.start,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
    }

    // If outside working hours, adjust to nearest business time
    const hour = dateTime.hour;
    const minute = dateTime.minute;

    if (hour < WORKING_HOURS.start) {
      // Before 8:00 AM - move to 8:00 AM same day
      return dateTime.set({
        hour: WORKING_HOURS.start,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
    } else if (hour >= WORKING_HOURS.end) {
      // After 5:00 PM - move to 8:00 AM next business day
      let nextDay = dateTime.plus({ days: 1 }).set({
        hour: WORKING_HOURS.start,
        minute: 0,
        second: 0,
        millisecond: 0,
      });

      // Ensure next day is also a business day
      while (this.isWeekend(nextDay) || this.isHoliday(nextDay, holidays)) {
        nextDay = nextDay.plus({ days: 1 });
      }

      return nextDay;
    } else if (
      hour >= WORKING_HOURS.lunchStart &&
      hour < WORKING_HOURS.lunchEnd
    ) {
      // During lunch (12:00-1:00 PM) - move to 1:00 PM same day
      return dateTime.set({
        hour: WORKING_HOURS.lunchEnd,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
    }

    // Already in business hours
    return dateTime;
  }

  private async addBusinessDays(
    startDateTime: DateTime,
    daysToAdd: number,
  ): Promise<DateTime> {
    const holidays = await this.holidayService.getColombianHolidays();
    let currentDateTime = startDateTime;
    let remainingDays = daysToAdd;

    while (remainingDays > 0) {
      currentDateTime = currentDateTime.plus({ days: 1 });

      // Check if this day is a business day
      if (
        !this.isWeekend(currentDateTime) &&
        !this.isHoliday(currentDateTime, holidays)
      ) {
        remainingDays--;
      }
    }

    return currentDateTime;
  }

  private async addBusinessHours(
    startDateTime: DateTime,
    hoursToAdd: number,
  ): Promise<DateTime> {
    const holidays = await this.holidayService.getColombianHolidays();
    let currentDateTime = startDateTime;
    let remainingMinutes = hoursToAdd * 60;

    while (remainingMinutes > 0) {
      // Ensure we're in a business day
      while (
        this.isWeekend(currentDateTime) ||
        this.isHoliday(currentDateTime, holidays)
      ) {
        currentDateTime = currentDateTime.plus({ days: 1 }).set({
          hour: WORKING_HOURS.start,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
      }

      const currentHour = currentDateTime.hour;
      const currentMinute = currentDateTime.minute;

      // Calculate remaining minutes in current business period
      let minutesToEndOfPeriod: number;

      if (currentHour < WORKING_HOURS.lunchStart) {
        // Morning period (8:00 AM - 12:00 PM)
        const endOfMorning = currentDateTime.set({
          hour: WORKING_HOURS.lunchStart,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
        minutesToEndOfPeriod = endOfMorning.diff(
          currentDateTime,
          'minutes',
        ).minutes;
      } else if (currentHour >= WORKING_HOURS.lunchEnd) {
        // Afternoon period (1:00 PM - 5:00 PM)
        const endOfAfternoon = currentDateTime.set({
          hour: WORKING_HOURS.end,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
        minutesToEndOfPeriod = endOfAfternoon.diff(
          currentDateTime,
          'minutes',
        ).minutes;
      } else {
        // During lunch break - jump to 1:00 PM
        currentDateTime = currentDateTime.set({
          hour: WORKING_HOURS.lunchEnd,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
        continue;
      }

      if (remainingMinutes <= minutesToEndOfPeriod) {
        // We can finish within this period
        return currentDateTime.plus({ minutes: remainingMinutes });
      } else {
        // Move to next business period
        remainingMinutes -= minutesToEndOfPeriod;

        if (currentHour < WORKING_HOURS.lunchStart) {
          // Jump to afternoon period (1:00 PM)
          currentDateTime = currentDateTime.set({
            hour: WORKING_HOURS.lunchEnd,
            minute: 0,
            second: 0,
            millisecond: 0,
          });
        } else {
          // Move to next business day morning (8:00 AM)
          currentDateTime = currentDateTime.plus({ days: 1 }).set({
            hour: WORKING_HOURS.start,
            minute: 0,
            second: 0,
            millisecond: 0,
          });
        }
      }
    }

    return currentDateTime;
  }

  private isWeekend(dateTime: DateTime): boolean {
    const weekday = dateTime.weekday;
    return weekday === 6 || weekday === 7; // Saturday or Sunday
  }

  private isHoliday(dateTime: DateTime, holidays: Set<string>): boolean {
    const dateStr = dateTime.toFormat('yyyy-MM-dd');
    return holidays.has(dateStr);
  }
}
