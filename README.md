# Colombian Business Day API

API REST para calcular días y horas hábiles según las reglas de negocio colombianas.

## 📋 Descripción

Esta API calcula días y horas hábiles siguiendo las reglas de negocio colombianas, incluyendo:
- Horario laboral de 8:00 AM a 5:00 PM (hora de Colombia)
- Pausa de almuerzo de 12:00 PM a 1:00 PM
- Exclusión de fines de semana y días festivos colombianos
- Ajuste automático de fechas fuera del horario laboral

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js (v18 o superior)
- pnpm (recomendado) // npm

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

## 📋 API Documentation

### Endpoint Principal

**GET** `/business-days/calculate`

Calcula días y horas hábiles según las reglas de negocio colombianas.

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
  "date": "2025-08-01T14:00:00.000Z"
}
```

##### Errores (400 Bad Request, 503 Service Unavailable)
```json
{
  "error": "InvalidParameters",
  "message": "Detalle del error"
}
```

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
Si la fecha inicial está fuera del horario laboral o en un día no hábil, se ajusta automáticamente:
- **Antes de las 8:00 AM**: se mueve a las 8:00 AM del mismo día
- **Después de las 5:00 PM**: se mueve a las 8:00 AM del siguiente día hábil
- **Durante el almuerzo**: se mueve a la 1:00 PM
- **Fin de semana o feriado**: se mueve al siguiente día hábil a las 8:00 AM

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
```

## 🏗️ Arquitectura

### Estructura del Proyecto
```
src/
├── constants/           # Constantes
│   └── index.ts
├── controllers/          # Controladores REST
│   └── business-day.controller.ts
├── services/            # Lógica de negocio
│   ├── business-day.service.ts
│   └── holiday.service.ts
├── types/               # Tipos e interfaces TypeScript
│   └── index.ts
├── app.module.ts        # Módulo principal
└── main.ts             # Punto de entrada
```

### Dependencias Principales
- **NestJS**: Framework Node.js
- **Luxon**: Manejo de fechas y zonas horarias
- **Axios**: Cliente HTTP para obtener feriados
- **class-validator/transformer**: Validación y transformación