# NestJS Project Exploration Report: RBCA (Role-Based Control Access)

## 1. Overall Project Structure

### Root Level Structure

```
rbca/
├── src/                          # Source code
├── dist/                         # Compiled output
├── test/                         # Test files
├── node_modules/                 # Dependencies
├── package.json                  # Project metadata & scripts
├── package-lock.json
├── tsconfig.json                 # TypeScript config
├── tsconfig.build.json           # TypeScript build config
├── nest-cli.json                 # NestJS CLI config
├── eslint.config.mjs             # ESLint configuration
├── .prettierrc                   # Prettier formatting config
├── .env                          # Environment variables (local)
├── .env.example                  # Environment template
├── docker-compose.yml            # Docker services
├── .gitignore
├── README.md
└── .vscode/                      # VS Code settings
```

### Source Code Structure (src/)

```
src/
├── main.ts                       # Application entry point
├── app.module.ts                 # Root module
├── app.controller.ts             # Root controller
├── app.service.ts                # Root service
│
├── config/                       # Configuration files
│   ├── app.config.ts             # App configuration (port, nodeEnv)
│   ├── database.config.ts        # Database configuration (TypeORM)
│   ├── jwt.config.ts             # JWT configuration (secrets, expiry)
│   └── validation.ts             # Environment validation
│
├── database/                     # Database layer
│   ├── data-source.ts            # TypeORM data source
│   ├── migrations/               # Database migrations
│   └── seeds/                    # Database seeders
│
├── common/                       # Shared utilities & guards
│   ├── decorators/               # Custom decorators
│   ├── filters/                  # Exception filters
│   ├── guards/                   # Global guards (RolesGuard)
│   ├── interceptors/             # HTTP interceptors
│   └── pipes/                    # Validation pipes
│
└── modules/                      # Feature modules
    ├── auth/                     # Authentication module
    │   ├── auth.module.ts        # Auth module definition
    │   ├── auth.controller.ts    # Auth endpoints
    │   ├── auth.service.ts       # Auth business logic
    │   ├── dto/                  # Data transfer objects
    │   │   ├── login.dto.ts
    │   │   ├── register.dto.ts
    │   │   ├── refresh-token.dto.ts
    │   │   └── auth-response.dto.ts
    │   ├── entities/             # Database entities
    │   │   └── refresh-token.entity.ts
    │   ├── decorators/           # Auth-specific decorators
    │   │   ├── current-user.decorator.ts
    │   │   ├── public.decorator.ts
    │   │   └── roles.decorator.ts
    │   ├── guards/               # Auth-specific guards
    │   │   ├── jwt-auth.guard.ts
    │   │   ├── jwt-refresh.guard.ts
    │   │   ├── google-oauth.guard.ts
    │   │   └── apple-oauth.guard.ts
    │   └── strategies/           # Passport strategies
    │       ├── jwt.strategy.ts
    │       ├── jwt-refresh.strategy.ts
    │       ├── google.strategy.ts
    │       └── apple.strategy.ts
    │
    └── users/                    # Users module
        ├── users.module.ts       # Users module definition
        ├── users.controller.ts   # Users endpoints
        ├── users.service.ts      # Users business logic
        ├── dto/                  # Data transfer objects
        │   ├── create-user.dto.ts
        │   └── update-user.dto.ts
        └── entities/             # Database entities
            └── user.entity.ts
```

---

## 2. package.json Contents

### Project Metadata

- **Name**: rbca
- **Version**: 0.0.1
- **License**: UNLICENSED
- **Private**: true

### Key Scripts

```json
{
  "build": "nest build",
  "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
  "test:e2e": "jest --config ./test/jest-e2e.json"
}
```

### Core Dependencies

- **NestJS**: ^11.0.1
  - `@nestjs/common` - Core framework
  - `@nestjs/core` - Core engine
  - `@nestjs/config` - Environment configuration
  - `@nestjs/typeorm` - ORM integration
  - `@nestjs/jwt` - JWT authentication
  - `@nestjs/passport` - Passport integration
  - `@nestjs/swagger` - API documentation
  - `@nestjs/platform-express` - Express adapter

- **Authentication & Security**:
  - `passport` - ^0.7.0 (authentication middleware)
  - `passport-jwt` - ^4.0.1 (JWT strategy)
  - `passport-google-oauth20` - ^2.0.0 (Google OAuth)
  - `passport-apple` - ^2.0.2 (Apple OAuth)
  - `bcrypt` - ^6.0.0 (password hashing)
  - `@nestjs/jwt` - ^11.0.2 (JWT handling)

- **Database & ORM**:
  - `typeorm` - ^0.3.28 (ORM)
  - `pg` - ^8.20.0 (PostgreSQL driver)

- **Validation & Transformation**:
  - `class-validator` - ^0.14.4 (DTO validation)
  - `class-transformer` - ^0.5.1 (object transformation)

- **Utilities**:
  - `rxjs` - ^7.8.1 (reactive programming)
  - `reflect-metadata` - ^0.2.2 (reflection metadata)

### Development Dependencies

- **Testing**: Jest ^30.0.0, Supertest ^7.0.0, ts-jest ^29.2.5
- **Linting**: ESLint ^9.18.0, Prettier ^3.4.2
- **TypeScript**: ^5.7.3
- **NestJS Tools**: @nestjs/cli ^11.0.0, @nestjs/schematics ^11.0.0

---

## 3. main.ts File

**Location**: `src/main.ts`

### Functionality

The entry point of the application that:

1. **Creates the NestJS application** from `AppModule`
2. **Sets up Global Validation Pipe**:
   - `whitelist: true` - strips non-whitelisted properties
   - `forbidNonWhitelisted: true` - throws error on extra properties
   - `transform: true` - automatically transforms payloads to DTO instances

3. **Configures Swagger/OpenAPI** documentation:
   - Title: "RBCA API"
   - Description: "Role-Based Access Control API"
   - Version: 1.0
   - Adds Bearer JWT authentication scheme
   - Serves at `/api/docs`
   - Enables auth persistence

4. **Starts the server**:
   - Listens on `process.env.PORT ?? 3000`
   - Logs startup messages with URLs

```typescript
// Summary of key setup:
- ValidationPipe for DTO validation
- Swagger documentation with JWT auth support
- Server listening on configurable port
- Console logging for startup info
```

---

## 4. Logger Configuration

**Current State**: ⚠️ **NO DEDICATED LOGGER CONFIGURED**

### What's Currently Used

- **Plain `console.log()`** in `main.ts` for startup messages only
- No structured logging framework
- No Winston, Pino, or other logger packages installed

### Logging Points Found

```
src/main.ts: Lines 37-42 (startup logs only)
- console.log(`🚀 App running at: http://localhost:${port}`)
- console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`)
```

### Missing

- ❌ No logger service injectable in modules
- ❌ No request/response logging
- ❌ No error logging framework
- ❌ No log levels (debug, info, warn, error)
- ❌ No persistent log storage
- ❌ No correlation IDs for tracing

### TypeORM Logging

- Enabled in development mode only:
  ```typescript
  logging: process.env.NODE_ENV === 'development';
  ```
- Provides SQL query logs to console

---

## 5. app.module.ts

**Location**: `src/app.module.ts`

### Module Configuration

```typescript
@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [jwtConfig, appConfig],
    }),

    // Database setup
    TypeOrmModule.forRoot(databaseConfig()),

    // Feature modules
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards (applied to all routes)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
```

### Key Features

1. **Global Configuration**:
   - ConfigModule loads environment variables from `.env`
   - Registers `jwtConfig` and `appConfig` globally
   - Allows injection via `ConfigService`

2. **Database Integration**:
   - TypeORM configured with PostgreSQL
   - Entities: `User`, `RefreshToken`
   - Auto-sync in non-production environments

3. **Feature Modules**:
   - **AuthModule**: Authentication, JWT, OAuth (Google, Apple)
   - **UsersModule**: User CRUD operations

4. **Global Guards** (applied to ALL routes):
   - **JwtAuthGuard**: Verifies JWT tokens, respects `@Public()` decorator
   - **RolesGuard**: Enforces role-based access (if `@Roles()` decorator present)

### Authentication Flow

- JWT auth is required by default (unless marked with `@Public()`)
- Refresh token rotation implemented
- OAuth2 integration for Google and Apple

---

## 6. Environment Files (.env & Config)

### .env (Production Values - **CHANGE THESE**)

```ini
# App
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=rbca

# JWT (⚠️ CHANGE IN PRODUCTION)
JWT_SECRET=change-me-jwt-secret-at-least-32-chars
JWT_REFRESH_SECRET=change-me-refresh-secret-at-least-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=xxxx
GOOGLE_CLIENT_SECRET=xxxx
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Apple OAuth
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY_PATH=
APPLE_CALLBACK_URL=http://localhost:3000/auth/apple/callback
```

### .env.example (Template - Stripped for Security)

```ini
# App
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=rbca
```

### Configuration Files

#### 1. **app.config.ts** - Application Settings

```typescript
// Exports: { port: number, nodeEnv: string }
// Reads: PORT, NODE_ENV env vars
```

#### 2. **database.config.ts** - TypeORM Setup

```typescript
// PostgreSQL connection
// Entities: User, RefreshToken
// Sync mode: enabled in non-production
// Logging: enabled in development
```

#### 3. **jwt.config.ts** - JWT Settings

```typescript
interface JwtConfig {
  secret: string; // Access token secret
  refreshSecret: string; // Refresh token secret
  expiresIn: string; // Access token TTL (default: 15m)
  refreshExpiresIn: string; // Refresh token TTL (default: 7d)
}
```

#### 4. **validation.ts** - Environment Validation

- File exists but is empty (no validation rules implemented)

---

## 7. Key Architecture Insights

### Authentication System

- **Multi-strategy support**:
  - Local (email/password with bcrypt)
  - JWT with refresh token rotation
  - Google OAuth2
  - Apple OAuth2 (commented out)

- **Token Management**:
  - Access tokens: 15m default
  - Refresh tokens: 7d default, stored hashed in DB
  - Token rotation on refresh
  - Token revocation on logout

- **User Roles**:
  - `admin` - Full access
  - `user` - Standard access (default)

### Database Schema

- **Users Table**: UUID PK, email unique, role enum, OAuth IDs
- **RefreshTokens Table**: Token hash, expiry, revocation tracking

### Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT-based stateless auth
- Global JWT guard (opt-out with `@Public()`)
- Role-based access control (RBAC) via `@Roles()` decorator
- HTTP-only token storage recommended (client-side responsibility)

### Code Organization

- **Modular structure** (Auth, Users modules)
- **DTOs** for validation and type safety
- **Service layer** for business logic separation
- **Controllers** for HTTP handling
- **Guards** for authorization
- **Decorators** for metadata marking (`@Public()`, `@Roles()`, `@CurrentUser()`)

### Missing/Incomplete

- ❌ No structured logging
- ❌ No error handling filters
- ❌ No request interceptors
- ❌ No validation rules in validation.ts
- ❌ Apple OAuth commented out (not fully enabled)
- ❌ No tests in src (only test directory exists)
- ⚠️ Credentials exposed in .env (Google OAuth keys visible)

---

## 8. Summary

**Project Type**: NestJS REST API with Role-Based Access Control

**Status**: Development-ready, but needs:

1. Production environment configuration
2. Structured logging implementation
3. Comprehensive error handling
4. Unit/integration tests
5. Security audit (exposed credentials)

**Tech Stack**:

- Framework: NestJS 11
- Database: PostgreSQL + TypeORM
- Auth: JWT + Passport + OAuth2
- Validation: Class-validator
- API Docs: Swagger/OpenAPI
