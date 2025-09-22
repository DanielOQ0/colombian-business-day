import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class BusinessDayQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseInt(String(value), 10);
    // Si no es un número válido devolvemos el valor original para que falle @IsInt en vez de silenciarlo
    if (isNaN(parsed)) {
      // Forzamos string para que el validador @IsInt falle sin ensuciar el tipo
      return String(value);
    }
    return parsed;
  })
  @IsInt({ message: 'days must be an integer' })
  @Min(1, { message: 'days must be a positive integer' })
  @Max(365, { message: 'days cannot be greater than 365' })
  days?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseInt(String(value), 10);
    if (isNaN(parsed)) {
      return String(value);
    }
    return parsed;
  })
  @IsInt({ message: 'hours must be an integer' })
  @Min(1, { message: 'hours must be a positive integer' })
  @Max(2920, {
    message: 'hours cannot be greater than 2920 (365 business days)',
  })
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
  readonly date: string;
}

export interface ErrorResponse {
  readonly error: string;
  readonly message: string;
}

export interface WorkingHours {
  readonly start: number;
  readonly lunchStart: number;
  readonly lunchEnd: number;
  readonly end: number;
}

// Tipos específicos para mejorar la seguridad de tipos
export type HolidayDate = string; // formato 'yyyy-MM-dd'
export type ISODateString = string; // formato ISO 8601

// Tipo para parámetros de entrada más específico
export interface BusinessDayCalculationParams {
  readonly days?: number;
  readonly hours?: number;
  readonly startDate?: ISODateString;
}
