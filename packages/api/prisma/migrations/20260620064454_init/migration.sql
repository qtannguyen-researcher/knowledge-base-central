-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "KnowledgeAssetStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('CONCEPT', 'TUTORIAL', 'RESEARCH_NOTE', 'REFERENCE_MATERIAL', 'LEARNING_NOTE', 'ARCHITECTURE_NOTE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('DEPENDS_ON', 'RELATED_TO', 'USES', 'EXTENDS', 'REFERENCES', 'CONTRASTS');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('PROPOSED', 'VALIDATED', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('BOOK', 'PAPER', 'ARTICLE', 'WEBSITE', 'DOCUMENTATION', 'STANDARD', 'VIDEO', 'COURSE');

-- CreateEnum
CREATE TYPE "ReferenceStatus" AS ENUM ('DRAFT', 'VALIDATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttachmentStatus" AS ENUM ('UPLOADED', 'VALIDATED', 'AVAILABLE', 'DELETED');

-- CreateEnum
CREATE TYPE "LearningPathStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DELETED');

-- CreateEnum
CREATE TYPE "CorrectionStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'IMPLEMENTED');

-- CreateEnum
CREATE TYPE "GitSyncTrigger" AS ENUM ('MANUAL', 'SCHEDULED', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('IDLE', 'SYNCING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('CREATED', 'QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_assets" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "raw_content" TEXT,
    "status" "KnowledgeAssetStatus" NOT NULL DEFAULT 'DRAFT',
    "content_type" "ContentType",
    "difficulty" "Difficulty",
    "author_id" UUID,
    "category_id" UUID,
    "git_sha" TEXT,
    "version" TEXT,
    "metadata" JSONB,
    "search_vector" tsvector,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "published_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "knowledge_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "path" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_asset_tags" (
    "asset_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "knowledge_asset_tags_pkey" PRIMARY KEY ("asset_id","tag_id")
);

-- CreateTable
CREATE TABLE "concepts" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "description" TEXT,
    "domain" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_asset_concepts" (
    "asset_id" UUID NOT NULL,
    "concept_id" UUID NOT NULL,

    CONSTRAINT "knowledge_asset_concepts_pkey" PRIMARY KEY ("asset_id","concept_id")
);

-- CreateTable
CREATE TABLE "relationships" (
    "id" UUID NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" UUID NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "relationship" "RelationshipType" NOT NULL,
    "status" "RelationshipStatus" NOT NULL DEFAULT 'PROPOSED',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "references" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT[],
    "year" INTEGER,
    "publisher" TEXT,
    "url" TEXT,
    "doi" TEXT,
    "ref_type" "ReferenceType" NOT NULL,
    "status" "ReferenceStatus" NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_asset_references" (
    "asset_id" UUID NOT NULL,
    "reference_id" UUID NOT NULL,

    CONSTRAINT "knowledge_asset_references_pkey" PRIMARY KEY ("asset_id","reference_id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT,
    "status" "AttachmentStatus" NOT NULL DEFAULT 'UPLOADED',
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" "Difficulty",
    "estimated_duration" INTEGER,
    "status" "LearningPathStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_items" (
    "path_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "learning_path_items_pkey" PRIMARY KEY ("path_id","asset_id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "parent_id" UUID,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correction_requests" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "suggestion" TEXT,
    "status" "CorrectionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewed_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "correction_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "git_sync_jobs" (
    "id" UUID NOT NULL,
    "repository" TEXT NOT NULL,
    "trigger" "GitSyncTrigger" NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'IDLE',
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "error_message" TEXT,
    "synced_count" INTEGER,

    CONSTRAINT "git_sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" UUID,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'CREATED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_id_key" ON "oauth_accounts"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_assets_slug_key" ON "knowledge_assets"("slug");

-- CreateIndex
CREATE INDEX "knowledge_assets_status_published_at_idx" ON "knowledge_assets"("status", "published_at");

-- CreateIndex
CREATE INDEX "knowledge_assets_category_id_idx" ON "knowledge_assets"("category_id");

-- CreateIndex
CREATE INDEX "knowledge_assets_author_id_idx" ON "knowledge_assets"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_path_idx" ON "categories"("path");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "concepts_slug_key" ON "concepts"("slug");

-- CreateIndex
CREATE INDEX "relationships_source_type_source_id_idx" ON "relationships"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "relationships_target_type_target_id_idx" ON "relationships"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "references_slug_key" ON "references"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "learning_paths_slug_key" ON "learning_paths"("slug");

-- CreateIndex
CREATE INDEX "comments_asset_id_idx" ON "comments"("asset_id");

-- CreateIndex
CREATE INDEX "comments_author_id_idx" ON "comments"("author_id");

-- CreateIndex
CREATE INDEX "correction_requests_asset_id_idx" ON "correction_requests"("asset_id");

-- CreateIndex
CREATE INDEX "correction_requests_submitted_by_idx" ON "correction_requests"("submitted_by");

-- CreateIndex
CREATE INDEX "audit_events_actor_id_idx" ON "audit_events"("actor_id");

-- CreateIndex
CREATE INDEX "audit_events_resource_resource_id_idx" ON "audit_events"("resource", "resource_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_assets" ADD CONSTRAINT "knowledge_assets_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_assets" ADD CONSTRAINT "knowledge_assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_asset_tags" ADD CONSTRAINT "knowledge_asset_tags_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "knowledge_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_asset_tags" ADD CONSTRAINT "knowledge_asset_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_asset_concepts" ADD CONSTRAINT "knowledge_asset_concepts_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "knowledge_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_asset_concepts" ADD CONSTRAINT "knowledge_asset_concepts_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_asset_references" ADD CONSTRAINT "knowledge_asset_references_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "knowledge_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_asset_references" ADD CONSTRAINT "knowledge_asset_references_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "references"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "knowledge_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_items" ADD CONSTRAINT "learning_path_items_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_items" ADD CONSTRAINT "learning_path_items_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "knowledge_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "knowledge_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_requests" ADD CONSTRAINT "correction_requests_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "knowledge_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_requests" ADD CONSTRAINT "correction_requests_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_requests" ADD CONSTRAINT "correction_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
