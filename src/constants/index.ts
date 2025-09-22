import { WorkingHours } from '../types/globals';

/**
 * Configuración de horarios laborales en Colombia
 * Horarios estándar de oficina con almuerzo incluido
 */
export const WORKING_HOURS: WorkingHours = {
  start: 8, // 8:00 AM - Inicio de jornada
  lunchStart: 12, // 12:00 PM - Inicio de almuerzo
  lunchEnd: 13, // 1:00 PM - Fin de almuerzo
  end: 17, // 5:00 PM - Fin de jornada
};

/**
 * Zona horaria de Colombia
 * Utilizada para cálculos de fecha y hora local
 */
export const COLOMBIA_TIMEZONE = 'America/Bogota';
