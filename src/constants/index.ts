import { WorkingHours } from '../types/globals';

/**
 * Configuración de horarios laborales en Colombia
 * Horarios estándar de oficina con almuerzo incluido
 *
 * @readonly - Inmutable para prevenir modificaciones accidentales
 */
export const WORKING_HOURS: Readonly<WorkingHours> = Object.freeze({
  start: 8, // 8:00 AM - Inicio de jornada
  lunchStart: 12, // 12:00 PM - Inicio de almuerzo
  lunchEnd: 13, // 1:00 PM - Fin de almuerzo
  end: 17, // 5:00 PM - Fin de jornada
} as const);

/**
 * Zona horaria de Colombia
 * Utilizada para cálculos de fecha y hora local
 *
 * @readonly - Constante inmutable
 */
export const COLOMBIA_TIMEZONE = 'America/Bogota' as const;

/**
 * Días laborales válidos (números del 1-7, donde 1=lunes, 7=domingo)
 */
export const BUSINESS_DAYS = Object.freeze([1, 2, 3, 4, 5] as const);

/**
 * Configuración de caché por defecto
 */
export const CACHE_CONFIG = Object.freeze({
  EXPIRY_HOURS: 24,
  MAX_RETRIES: 3,
  TIMEOUT_MS: 5000,
} as const);

// Re-exportar constantes de errores y logs para acceso centralizado
export { BusinessDayErrorCode, ERROR_MESSAGES, LOG_MESSAGES } from './errors';
