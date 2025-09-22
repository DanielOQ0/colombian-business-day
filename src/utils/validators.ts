/**
 * Validador personalizado para fechas ISO 8601 más estricto
 */
import { DateTime } from 'luxon';

export function isValidISODate(dateString: string): boolean {
  if (!dateString.endsWith('Z')) return false;

  const parsed = DateTime.fromISO(dateString, { zone: 'utc' });

  if (!parsed.isValid) return false;

  // Validar que no sea muy en el pasado o futuro
  const now = DateTime.now();
  const yearsDiff = Math.abs(parsed.diff(now, 'years').years);

  return yearsDiff <= 10; // Máximo 10 años en cualquier dirección
}

/**
 * Validador de parámetros de negocio
 */
export function validateBusinessParams(
  days?: number,
  hours?: number,
): string | null {
  if (!days && !hours) {
    return 'At least one parameter (days or hours) must be provided';
  }

  if (days && (days < 1 || days > 365)) {
    return 'days must be between 1 and 365';
  }

  if (hours && (hours < 1 || hours > 2920)) {
    return 'hours must be between 1 and 2920 (365 business days)';
  }

  return null; // Válido
}
