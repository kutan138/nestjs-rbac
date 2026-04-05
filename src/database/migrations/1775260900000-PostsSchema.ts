import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: PostsSchema
 *
 * Creates:
 *  - posts : id, title, content, slug (unique), status, authorId (FK → users),
 *            createdAt, updatedAt
 *
 * Indexes:
 *  - posts.authorId   INDEX  (filter by author)
 *  - posts.status     INDEX  (filter by status)
 *  - posts.slug       UNIQUE (for SEO-friendly URLs)
 */
export class PostsSchema1775260900000 implements MigrationInterface {
  name = 'PostsSchema1775260900000';

  // ─────────────────────────────────────────────
  //  UP
  // ─────────────────────────────────────────────
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── ENUM (idempotent) ─────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "posts_status_enum" AS ENUM ('draft', 'published', 'archived');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);

    // ── TABLE: posts ─────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "posts" (
        "id"        UUID                  NOT NULL DEFAULT gen_random_uuid(),
        "title"     VARCHAR(255)          NOT NULL,
        "content"   TEXT                  NOT NULL,
        "slug"      VARCHAR(300)                  ,
        "status"    "posts_status_enum"   NOT NULL DEFAULT 'draft',
        "authorId"  UUID                  NOT NULL,
        "createdAt" TIMESTAMPTZ           NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ           NOT NULL DEFAULT now(),

        CONSTRAINT "PK_posts_id"    PRIMARY KEY ("id"),
        CONSTRAINT "UQ_posts_slug"  UNIQUE      ("slug"),
        CONSTRAINT "FK_posts_authorId"
          FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_posts_authorId" ON "posts" ("authorId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_posts_status" ON "posts" ("status")
    `);
  }

  // ─────────────────────────────────────────────
  //  DOWN
  // ─────────────────────────────────────────────
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_posts_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_posts_authorId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "posts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "posts_status_enum"`);
  }
}
