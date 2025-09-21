import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class HolidayService {
  private readonly logger = new Logger(HolidayService.name);
  private holidaysCache: Set<string> = new Set();
  private lastFetchDate: Date | null = null;
  private readonly CACHE_EXPIRY_HOURS = 24;
  private readonly HOLIDAYS_URL =
    'https://content.capta.co/Recruitment/WorkingDays.json';

  async getColombianHolidays(): Promise<Set<string>> {
    if (this.shouldRefreshCache()) {
      await this.fetchHolidays();
    }
    return this.holidaysCache;
  }

  private shouldRefreshCache(): boolean {
    if (!this.lastFetchDate || this.holidaysCache.size === 0) {
      return true;
    }

    const now = new Date();
    const hoursDiff =
      (now.getTime() - this.lastFetchDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff >= this.CACHE_EXPIRY_HOURS;
  }

  private async fetchHolidays(): Promise<void> {
    try {
      this.logger.log('Fetching Colombian holidays from external API');
      const response: AxiosResponse<string[]> = await axios.get(
        this.HOLIDAYS_URL,
        {
          timeout: 5000,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'colombian-business-day-api/1.0.0',
          },
        },
      );

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format: expected array of holidays');
      }

      this.holidaysCache.clear();

      response.data.forEach((dateStr: string) => {
        if (dateStr && typeof dateStr === 'string') {
          // The API returns dates in YYYY-MM-DD format directly
          this.holidaysCache.add(dateStr);
        }
      });

      this.lastFetchDate = new Date();
      this.logger.log(`Cached ${this.holidaysCache.size} Colombian holidays`);
    } catch (error) {
      this.logger.error('Failed to fetch Colombian holidays', error);

      if (this.holidaysCache.size === 0) {
        // If we have no cached data and fetch fails, throw error
        throw new HttpException(
          {
            error: 'ServiceUnavailable',
            message:
              'Unable to fetch Colombian holidays data. Please try again later.',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // If we have cached data, log error but continue with cached data
      this.logger.warn('Using cached holiday data due to fetch failure');
    }
  }

  isHoliday(dateStr: string): boolean {
    return this.holidaysCache.has(dateStr);
  }
}
