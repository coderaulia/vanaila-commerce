import '../src/services/loadLocalEnv';

import pg from 'pg';

const { Client } = pg;

const clean = (value: string | undefined) => value?.trim().replace(/^['"]|['"]$/g, '') || '';
const connectionString = clean(process.env.DATABASE_URL_MIGRATION) || clean(process.env.DATABASE_URL);

if (!connectionString) {
  throw new Error('Set DATABASE_URL or DATABASE_URL_MIGRATION before running this migration.');
}

const migrationSql = `
CREATE TABLE IF NOT EXISTS "product_reviews" (
  "id" text PRIMARY KEY NOT NULL,
  "product_id" text NOT NULL,
  "customer_id" text,
  "author_name" text NOT NULL,
  "author_email" text NOT NULL,
  "rating" integer NOT NULL,
  "body" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS "product_reviews_product_idx"
  ON "product_reviews" USING btree ("product_id");

CREATE INDEX IF NOT EXISTS "product_reviews_status_idx"
  ON "product_reviews" USING btree ("status");

CREATE INDEX IF NOT EXISTS "product_reviews_created_at_idx"
  ON "product_reviews" USING btree ("created_at");
`;

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(migrationSql);
    const result = await client.query("select to_regclass('public.product_reviews') as table_name");
    if (result.rows[0]?.table_name !== 'product_reviews') {
      throw new Error('product_reviews table was not created.');
    }
    console.log('product_reviews migration applied.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
