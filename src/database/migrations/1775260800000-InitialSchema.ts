import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: InitialSchema
 *
 * Creates:
 *  - users      : id, name, email (unique), passwordHash, googleId, appleId, role, isActive, createdAt, updatedAt
 *  - refresh_tokens : id, tokenHash, userId (FK → users), expiresAt, revokedAt, createdAt
 *
 * Indexes / Constraints:
 *  - users.email          UNIQUE
 *  - users.googleId       UNIQUE (nullable)
 *  - users.appleId        UNIQUE (nullable)
 *  - users.role           INDEX  (for RBAC queries)
 *  - refresh_tokens(userId, revokedAt)  COMPOSITE INDEX
 *  - refresh_tokens.tokenHash           INDEX  (fast lookup)
 */
export class InitialSchema1775260800000 implements MigrationInterface {
  name = 'InitialSchema1775260800000';

  // ─────────────────────────────────────────────
  //  UP
  // ─────────────────────────────────────────────
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── ENUM (idempotent) ────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_role_enum" AS ENUM ('admin', 'user');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);

    // ── TABLE: users ────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"           UUID          NOT NULL DEFAULT gen_random_uuid(),
        "name"         VARCHAR(100)  NOT NULL,
        "email"        VARCHAR(255)  NOT NULL,
        "passwordHash" VARCHAR               ,
        "googleId"     VARCHAR(255)          ,
        "appleId"      VARCHAR(255)          ,
        "role"         "users_role_enum"     NOT NULL DEFAULT 'user',
        "isActive"     BOOLEAN       NOT NULL DEFAULT true,
        "createdAt"    TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMPTZ   NOT NULL DEFAULT now(),

        CONSTRAINT "PK_users_id"          PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email"        UNIQUE      ("email"),
        CONSTRAINT "UQ_users_googleId"     UNIQUE      ("googleId"),
        CONSTRAINT "UQ_users_appleId"      UNIQUE      ("appleId")
      )
    `);

    // Index on role — used by RBAC guard
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_role" ON "users" ("role")
    `);

    // Index on isActive — soft-delete / active-filter queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_isActive" ON "users" ("isActive")
    `);

    // ── TABLE: refresh_tokens ───────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
        "tokenHash"   VARCHAR      NOT NULL,
        "userId"      UUID         NOT NULL,
        "expiresAt"   TIMESTAMPTZ  NOT NULL,
        "revokedAt"   TIMESTAMPTZ          ,
        "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),

        CONSTRAINT "PK_refresh_tokens_id"  PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_userId"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Composite index used to find valid (non-revoked) tokens for a user
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_userId_revokedAt"
        ON "refresh_tokens" ("userId", "revokedAt")
    `);

    // Fast lookup by hashed token value
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_tokenHash"
        ON "refresh_tokens" ("tokenHash")
    `);
  }

  // ─────────────────────────────────────────────
  //  DOWN  (full rollback)
  // ─────────────────────────────────────────────
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_refresh_tokens_tokenHash"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_refresh_tokens_userId_revokedAt"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
