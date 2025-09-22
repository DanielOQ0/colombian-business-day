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

## ☁️ Despliegue en AWS Lambda con CDK

Se incluye infraestructura como código usando **AWS CDK v2** para desplegar la API como:

- AWS Lambda (Node.js 20) ejecutando NestJS empaquetado vía `esbuild`
- Amazon API Gateway REST API (Stage: `prod`)
- CORS abierto (ajusta según tus necesidades)

### 1. Prerrequisitos

- Cuenta de AWS y credenciales configuradas localmente (`aws configure` o variables de entorno)
- Bootstrap de CDK (solo la primera vez por cuenta/región)
- Node.js 18/20 y pnpm instalado

Verifica credenciales:
```powershell
aws sts get-caller-identity
```

### 2. Instalación de dependencias
Ya se agregaron las dependencias en `package.json`, solo asegura instalar:
```powershell
pnpm install
```

### 3. Estructura Infra (carpeta `cdk/`)
```
cdk/
├── bin/
│   └── colombian-business-day.ts   # EntryPoint CDK App
├── lib/
│   └── colombian-business-day-stack.ts  # Stack con Lambda + API Gateway
├── cdk.json
└── tsconfig.json
```

### 4. Bootstrap (solo primera vez por cuenta/región)
```powershell
pnpm cdk:bootstrap
```

### 5. Synthesis (opcional para revisar CloudFormation)
```powershell
pnpm cdk:synth
```

### 6. Desplegar
```powershell
pnpm cdk:deploy
```

Al finalizar verás una salida similar:
```
Outputs:
ColombianBusinessDayStack.BusinessDayApiEndpoint = https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/
```

Tu endpoint final será, por ejemplo:
```
https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/business-days/calculate?days=2&hours=3
```

### 7. Probar en producción
```powershell
curl "https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/business-days/calculate?days=1&hours=2"
```

### 8. Variables de Entorno
Si necesitas variables (`HOLIDAYS_API_URL`, etc.) edita en `colombian-business-day-stack.ts` la propiedad `environment` del `NodejsFunction`.

### 9. Limpiar Recursos
```powershell
pnpm cdk:destroy
```

### 10. Costos
La combinación Lambda + API Gateway entra usualmente en el Free Tier si es bajo volumen. Revisa siempre el [Cost Explorer](https://console.aws.amazon.com/cost-management/home).

### 11. Troubleshooting
| Problema | Causa probable | Solución |
|----------|----------------|----------|
| `AccessDenied` en bootstrap | Rol/credenciales sin permisos | Usa usuario/role con `AdministratorAccess` para bootstrap inicial |
| Lambda timeout | Lógica pesada o cold start | Incrementa `timeout` en el stack o añade más memoria |
| 502 en API Gateway | Excepción no controlada en Lambda | Revisa CloudWatch Logs del Lambda |
| Cambios no reflejados | Cache de código en Lambda | Asegura `pnpm cdk:deploy` completó y no hubo errores |

### 12. Próximos Pasos Recomendados
- Agregar un dominio personalizado (Route53 + ACM + `RestApi` CustomDomain)
- Añadir logging estructurado (p.ej. `pino`)
- Implementar CI/CD (GitHub Actions con `cdk deploy --require-approval never`)
- Añadir capa (Lambda Layer) para dependencias pesadas compartidas
- Configurar WAF ante tráfico público

---
Si necesitas ayuda agregando dominio, CI/CD o variables seguras (SSM Parameter Store / Secrets Manager), abre un issue o pide más detalles.