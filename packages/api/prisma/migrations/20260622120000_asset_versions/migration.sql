-- CreateTable
CREATE TABLE "asset_versions" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "raw_content" TEXT,
    "metadata" JSONB,
    "git_sha" TEXT,
    "author_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_versions_asset_id_idx" ON "asset_versions"("asset_id");

-- AddForeignKey
ALTER TABLE "asset_versions" ADD CONSTRAINT "asset_versions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "knowledge_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_versions" ADD CONSTRAINT "asset_versions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
