-- DropIndex
DROP INDEX "knowledge_assets_search_vector_gin_idx";

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "report_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "search_queries" ALTER COLUMN "id" DROP DEFAULT;
