/**
 * Códigos de error específicos del dominio de días laborales
 * Centralizados para consistencia en toda la aplicación
 */
export enum BusinessDayErrorCode {
  INVALID_PARAMETERS = 'InvalidParameters',
  SERVICE_UNAVAILABLE = 'ServiceUnavailable',
  INTERNAL_SERVER_ERROR = 'InternalServerError',
}

/**
 * Mensajes de error estándar para cada código
 */
export const ERROR_MESSAGES = Object.freeze({
  [BusinessDayErrorCode.INVALID_PARAMETERS]:
    'At least one parameter (days or hours) must be provided',
  [BusinessDayErrorCode.SERVICE_UNAVAILABLE]:
    'Unable to fetch Colombian holidays data. Please try again later.',
  [BusinessDayErrorCode.INTERNAL_SERVER_ERROR]:
    'An unexpected error occurred while calculating business days',
} as const);

/**
 * Mensajes de log centralizados para consistencia en toda la aplicación
 */
export const LOG_MESSAGES = Object.freeze({
  // BusinessDayService messages
  BUSINESS_DAY_CALCULATION_START: (startDate: string) =>
    `Starting calculation from: ${startDate} (Colombia time)`,
  BUSINESS_DAY_CALCULATION_RESULT: (resultUTC: string) =>
    `Final result: ${resultUTC} (UTC)`,
  BUSINESS_DAY_CALCULATION_PARAMS: (params: Record<string, unknown>) =>
    `Calculating business days with params: ${JSON.stringify(params)}`,

  // HolidayService messages
  HOLIDAYS_FETCH_START: 'Fetching Colombian holidays from external API',
  HOLIDAYS_CACHED: (count: number) => `Cached ${count} Colombian holidays`,
  HOLIDAYS_FETCH_ERROR: 'Failed to fetch Colombian holidays',
  HOLIDAYS_USING_CACHE: 'Using cached holiday data due to fetch failure',

  // Generic error messages
  ERROR_CALCULATING_BUSINESS_DAYS: 'Error calculating business days',
  SERVICE_ERROR: 'Service error',

  // Interceptor messages
  REQUEST_LOG: (method: string, url: string, query: unknown, body: unknown) =>
    `${method} ${url} - Query: ${JSON.stringify(query)} - Body: ${JSON.stringify(body)}`,
  RESPONSE_LOG: (
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    data: unknown,
  ) =>
    `${method} ${url} ${statusCode} - ${duration}ms - Response: ${JSON.stringify(data)}`,
  ERROR_LOG: (
    method: string,
    url: string,
    status: number,
    duration: number,
    message: string,
  ) => `${method} ${url} ${status} - ${duration}ms - Error: ${message}`,
} as const);
