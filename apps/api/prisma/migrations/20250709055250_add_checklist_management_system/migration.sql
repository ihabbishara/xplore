/*
  Warnings:

  - You are about to drop the column `created_at` on the `checklist_collaborators` table. All the data in the column will be lost.
  - You are about to drop the column `permissions` on the `checklist_collaborators` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `checklist_items` table. All the data in the column will be lost.
  - You are about to drop the column `order_index` on the `checklist_items` table. All the data in the column will be lost.
  - The `priority` column on the `checklist_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `category` on the `checklists` table. All the data in the column will be lost.
  - You are about to drop the column `is_public` on the `checklists` table. All the data in the column will be lost.
  - You are about to drop the column `is_template` on the `checklists` table. All the data in the column will be lost.
  - Added the required column `name` to the `checklist_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `checklist_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "checklist_items_checklist_id_order_index_idx";

-- DropIndex
DROP INDEX "checklists_category_idx";

-- AlterTable
ALTER TABLE "checklist_collaborators" DROP COLUMN "created_at",
DROP COLUMN "permissions",
ADD COLUMN     "can_assign" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_complete" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "can_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "invited_by" TEXT,
ADD COLUMN     "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "role" VARCHAR(50) NOT NULL DEFAULT 'viewer';

-- AlterTable
ALTER TABLE "checklist_items" DROP COLUMN "content",
DROP COLUMN "order_index",
ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "category" VARCHAR(100),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" VARCHAR(255) NOT NULL,
ADD COLUMN     "position" INTEGER NOT NULL,
DROP COLUMN "priority",
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "checklists" DROP COLUMN "category",
DROP COLUMN "is_public",
DROP COLUMN "is_template",
ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "is_collaborative" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'private';

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "icon" VARCHAR(50),
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "default_items" JSONB NOT NULL,
    "created_by" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_activities" (
    "id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT,
    "action" VARCHAR(50) NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "sections" TEXT[],
    "filename" TEXT NOT NULL,
    "download_url" TEXT,
    "file_size" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "include_charts" BOOLEAN,
    "include_raw_data" BOOLEAN,
    "date_range" JSONB,
    "locations" TEXT[],
    "template" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_schedules" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "frequency" TEXT NOT NULL,
    "next_run" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run" TIMESTAMP(3),
    "last_success" BOOLEAN,
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_processing_jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL,
    "result" JSONB,
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checklist_templates_category_idx" ON "checklist_templates"("category");

-- CreateIndex
CREATE INDEX "checklist_templates_tags_idx" ON "checklist_templates"("tags");

-- CreateIndex
CREATE INDEX "checklist_templates_is_system_idx" ON "checklist_templates"("is_system");

-- CreateIndex
CREATE INDEX "checklist_templates_is_public_idx" ON "checklist_templates"("is_public");

-- CreateIndex
CREATE INDEX "checklist_templates_rating_idx" ON "checklist_templates"("rating");

-- CreateIndex
CREATE INDEX "checklist_activities_checklist_id_idx" ON "checklist_activities"("checklist_id");

-- CreateIndex
CREATE INDEX "checklist_activities_user_id_idx" ON "checklist_activities"("user_id");

-- CreateIndex
CREATE INDEX "checklist_activities_action_idx" ON "checklist_activities"("action");

-- CreateIndex
CREATE INDEX "checklist_activities_created_at_idx" ON "checklist_activities"("created_at");

-- CreateIndex
CREATE INDEX "export_history_user_id_idx" ON "export_history"("user_id");

-- CreateIndex
CREATE INDEX "export_history_format_idx" ON "export_history"("format");

-- CreateIndex
CREATE INDEX "export_history_created_at_idx" ON "export_history"("created_at");

-- CreateIndex
CREATE INDEX "export_history_success_idx" ON "export_history"("success");

-- CreateIndex
CREATE INDEX "export_schedules_user_id_idx" ON "export_schedules"("user_id");

-- CreateIndex
CREATE INDEX "export_schedules_frequency_idx" ON "export_schedules"("frequency");

-- CreateIndex
CREATE INDEX "export_schedules_next_run_idx" ON "export_schedules"("next_run");

-- CreateIndex
CREATE INDEX "export_schedules_is_active_idx" ON "export_schedules"("is_active");

-- CreateIndex
CREATE INDEX "analytics_processing_jobs_user_id_idx" ON "analytics_processing_jobs"("user_id");

-- CreateIndex
CREATE INDEX "analytics_processing_jobs_job_type_idx" ON "analytics_processing_jobs"("job_type");

-- CreateIndex
CREATE INDEX "analytics_processing_jobs_status_idx" ON "analytics_processing_jobs"("status");

-- CreateIndex
CREATE INDEX "analytics_processing_jobs_queued_at_idx" ON "analytics_processing_jobs"("queued_at");

-- CreateIndex
CREATE INDEX "analytics_processing_jobs_started_at_idx" ON "analytics_processing_jobs"("started_at");

-- CreateIndex
CREATE INDEX "checklist_collaborators_role_idx" ON "checklist_collaborators"("role");

-- CreateIndex
CREATE INDEX "checklist_items_checklist_id_position_idx" ON "checklist_items"("checklist_id", "position");

-- CreateIndex
CREATE INDEX "checklist_items_category_idx" ON "checklist_items"("category");

-- CreateIndex
CREATE INDEX "checklist_items_priority_idx" ON "checklist_items"("priority");

-- CreateIndex
CREATE INDEX "checklists_template_id_idx" ON "checklists"("template_id");

-- CreateIndex
CREATE INDEX "checklists_visibility_idx" ON "checklists"("visibility");

-- AddForeignKey
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_collaborators" ADD CONSTRAINT "checklist_collaborators_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_activities" ADD CONSTRAINT "checklist_activities_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_activities" ADD CONSTRAINT "checklist_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_history" ADD CONSTRAINT "export_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_schedules" ADD CONSTRAINT "export_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_processing_jobs" ADD CONSTRAINT "analytics_processing_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
