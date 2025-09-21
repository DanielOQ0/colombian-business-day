import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Matches } from 'class-validator';

export class BusinessDayQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt({ message: 'days must be an integer' })
  @Min(1, { message: 'days must be a positive integer' })
  days?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt({ message: 'hours must be an integer' })
  @Min(1, { message: 'hours must be a positive integer' })
  hours?: number;

  @IsOptional()
  @IsString({ message: 'date must be a string' })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
    message:
      'date must be in ISO 8601 format with Z suffix (e.g., 2025-08-01T14:00:00Z)',
  })
  date?: string;
}

export interface BusinessDayResponse {
  date: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface WorkingHours {
  start: number; // 8 (8:00 AM)
  lunchStart: number; // 12 (12:00 PM)
  lunchEnd: number; // 13 (1:00 PM)
  end: number; // 17 (5:00 PM)
}

export const WORKING_HOURS: WorkingHours = {
  start: 8,
  lunchStart: 12,
  lunchEnd: 13,
  end: 17,
};

export const COLOMBIA_TIMEZONE = 'America/Bogota';
