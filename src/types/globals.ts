import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Matches } from 'class-validator';

export class BusinessDayQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? undefined : parsed;
  })
  @IsInt({ message: 'days debe ser un número entero' })
  @Min(1, { message: 'days debe ser un número entero positivo' })
  days?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? undefined : parsed;
  })
  @IsInt({ message: 'hours debe ser un número entero' })
  @Min(1, { message: 'hours debe ser un número entero positivo' })
  hours?: number;

  @IsOptional()
  @IsString({ message: 'date debe ser una cadena de texto' })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
    message:
      'date debe estar en formato ISO 8601 con sufijo Z (ej: 2025-08-01T14:00:00Z)',
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
