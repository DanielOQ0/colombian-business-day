import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Matches } from 'class-validator';

export class BusinessDayQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt({ message: 'days debe ser un número entero' })
  @Min(1, { message: 'days debe ser un número entero positivo' })
  days?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
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
  date: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface WorkingHours {
  start: number;
  lunchStart: number;
  lunchEnd: number;
  end: number;
}
