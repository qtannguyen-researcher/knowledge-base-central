-- Create search_queries table for search analytics
CREATE TABLE "search_queries" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "query" TEXT NOT NULL,
  "result_count" INT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for analytics queries by time
CREATE INDEX "search_queries_created_at_idx" ON "search_queries" ("created_at");

-- Index for analytics queries by query text
CREATE INDEX "search_queries_query_idx" ON "search_queries" ("query");
