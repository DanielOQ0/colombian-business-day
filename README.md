# Colombian Business Day API

API REST para calcular días y horas hábiles usando la zona horaria de Colombia.

## 📋 Descripción

Esta API calcula días y horas hábiles configurada para la zona horaria colombiana, incluyendo:
- Horario laboral de 8:00 AM a 5:00 PM (hora de Colombia)
- Pausa de almuerzo de 12:00 PM a 1:00 PM
- Exclusión de fines de semana y días festivos colombianos
- Ajuste automático de fechas fuera del horario laboral

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js (v18 o superior)
- pnpm (recomendado) o npm

### Instalación
```bash
# Instalar dependencias
pnpm install

# Ejecutar en modo desarrollo
pnpm start:dev

# Ejecutar en producción
pnpm build
pnpm start:prod
```

### Variables de Entorno
Copia el archivo `.env.example` a `.env` y configura las variables según tu entorno:

```bash
# Copiar archivo de ejemplo
cp .env.example .env
```

Variables disponibles:
- **`PORT`**: Puerto del servidor (default: 3000)
- **`HOLIDAYS_API_URL`**: URL de la API de días festivos
- **`NODE_ENV`**: Ambiente de ejecución (development/production)

## 📋 API Documentation

### Endpoint Principal

**GET** `/business-days/calculate`

Calcula días y horas hábiles usando la zona horaria de Colombia.

#### Query Parameters

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `days` | `number` | No | Número de días hábiles a sumar (entero positivo) |
| `hours` | `number` | No | Número de horas hábiles a sumar (entero positivo) |
| `date` | `string` | No | Fecha/hora inicial en UTC (ISO 8601 con sufijo Z). Si no se provee, usa la hora actual en Colombia |

**Nota:** Al menos uno de los parámetros `days` o `hours` debe ser proporcionado.

#### Ejemplos de Uso

```bash
# Agregar 5 días hábiles desde ahora
curl "http://localhost:3000/business-days/calculate?days=5"

# Agregar 8 horas hábiles desde ahora
curl "http://localhost:3000/business-days/calculate?hours=8"

# Agregar 2 días y 4 horas hábiles desde una fecha específica
curl "http://localhost:3000/business-days/calculate?days=2&hours=4&date=2025-08-01T14:00:00Z"
```

#### Respuestas

##### Respuesta Exitosa (200 OK)
```json
{
  "date": "2025-08-01T14:00:00Z"
}
```

**Nota:** La fecha se devuelve en formato ISO 8601 UTC sin milisegundos.

##### Errores (400 Bad Request, 404 Not Found, 503 Service Unavailable)
```json
{
  "error": "InvalidParameters",
  "message": "Detalle del error"
}
```

**Nota:** Las respuestas de error contienen únicamente los campos `error` y `message`.

## 📚 Reglas de Negocio

### Días Hábiles
- **Lunes a Viernes**: Días laborales
- **Sábados y Domingos**: No son días hábiles
- **Días Festivos Colombianos**: Se excluyen automáticamente

### Horario Laboral
- **Horario**: 8:00 AM - 5:00 PM (hora de Colombia)
- **Almuerzo**: 12:00 PM - 1:00 PM (no se cuenta como tiempo hábil)
- **Zona Horaria**: America/Bogota

### Comportamiento de Ajuste
La fecha de inicio se "ancla" al último instante laboral válido anterior (ajuste hacia atrás) antes de comenzar a sumar días u horas. Esto asegura que el cómputo siempre parte de un punto dentro de una franja laboral. Reglas actuales:

- **Fin de semana o feriado**: se retrocede día por día hasta encontrar el último día hábil y se fija a las **5:00 PM** de ese día.
- **Antes de las 8:00 AM** (mismo día hábil): se mueve al día hábil anterior a las **5:00 PM**.
- **Después de las 5:00 PM**: se fija a las **5:00 PM** del mismo día.
- **Durante el almuerzo (12:00 PM - 1:00 PM)**: se fija a las **12:00 PM** del mismo día.
- **Dentro del horario laboral (8:00 AM - 12:00 PM, 1:00 PM - 5:00 PM)**: no se modifica.

### Días Festivos
Los días festivos colombianos se obtienen desde: https://content.capta.co/Recruitment/WorkingDays.json

## 🧪 Testing

```bash
# Ejecutar todos los tests
pnpm test

# Ejecutar tests con cobertura
pnpm test:cov

# Ejecutar tests e2e
pnpm test:e2e

# Ejecutar tests en modo watch
pnpm test:watch
```

### Tests Incluidos
- **Unit tests**: Servicios y controladores individuales
- **E2E tests**: Pruebas de integración completas
- **Cobertura**: Reportes de cobertura de código generados

## 🏗️ Arquitectura

### Estructura del Proyecto
```
src/
├── constants/           # Constantes y mensajes centralizados
│   ├── index.ts        # Re-exporta todas las constantes
│   └── errors.ts       # Códigos de error y mensajes de log
├── controllers/         # Controladores REST
│   └── business-day.controller.ts
├── interceptors/        # Interceptors globales
│   └── logging.interceptor.ts
├── services/            # Lógica de negocio
│   ├── business-day.service.ts
│   └── holiday.service.ts
├── types/               # Tipos e interfaces TypeScript
│   └── globals.ts
├── app.module.ts        # Módulo principal
└── main.ts             # Punto de entrada
```

### Dependencias Principales
- **NestJS**: Framework Node.js para aplicaciones escalables
- **Luxon**: Manejo avanzado de fechas y zonas horarias
- **Axios**: Cliente HTTP para obtener días festivos
- **class-validator/transformer**: Validación y transformación de datos
- **TypeScript**: Tipado estático con configuración strict