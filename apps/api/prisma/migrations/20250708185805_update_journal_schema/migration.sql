/*
  Warnings:

  - You are about to drop the column `metadata` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `visibility` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `weather` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to alter the column `title` on the `journal_entries` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - The `mood` column on the `journal_entries` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `journal_id` on the `journal_media` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `journal_media` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail_url` on the `journal_media` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `journal_media` table. All the data in the column will be lost.
  - Added the required column `entry_id` to the `journal_media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_path` to the `journal_media` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "journal_media" DROP CONSTRAINT "journal_media_journal_id_fkey";

-- DropIndex
DROP INDEX "journal_entries_user_id_created_at_idx";

-- DropIndex
DROP INDEX "journal_media_journal_id_idx";

-- AlterTable
ALTER TABLE "journal_entries" DROP COLUMN "metadata",
DROP COLUMN "visibility",
DROP COLUMN "weather",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "coordinates" JSONB,
ADD COLUMN     "entry_type" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "is_favorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "local_id" VARCHAR(255),
ADD COLUMN     "privacy_level" TEXT NOT NULL DEFAULT 'private',
ADD COLUMN     "shared_with" TEXT[],
ADD COLUMN     "sync_status" TEXT NOT NULL DEFAULT 'synced',
ADD COLUMN     "timezone" VARCHAR(50),
ADD COLUMN     "weather_data" JSONB,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "title" SET DATA TYPE VARCHAR(255),
DROP COLUMN "mood",
ADD COLUMN     "mood" SMALLINT;

-- AlterTable
ALTER TABLE "journal_media" DROP COLUMN "journal_id",
DROP COLUMN "metadata",
DROP COLUMN "thumbnail_url",
DROP COLUMN "url",
ADD COLUMN     "alt_text" TEXT,
ADD COLUMN     "duration_seconds" INTEGER,
ADD COLUMN     "entry_id" TEXT NOT NULL,
ADD COLUMN     "exif_data" JSONB,
ADD COLUMN     "file_path" VARCHAR(500) NOT NULL,
ADD COLUMN     "file_size" BIGINT,
ADD COLUMN     "mime_type" VARCHAR(100),
ADD COLUMN     "original_filename" VARCHAR(255),
ADD COLUMN     "processing_status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "thumbnail_path" VARCHAR(500),
ADD COLUMN     "transcription" TEXT;

-- CreateTable
CREATE TABLE "voice_transcriptions" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "audio_file_path" VARCHAR(500) NOT NULL,
    "transcription_text" TEXT,
    "confidence_score" DECIMAL(3,2),
    "language" VARCHAR(10),
    "processing_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_transcriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "voice_transcriptions_entry_id_idx" ON "voice_transcriptions"("entry_id");

-- CreateIndex
CREATE INDEX "voice_transcriptions_processing_status_idx" ON "voice_transcriptions"("processing_status");

-- CreateIndex
CREATE INDEX "journal_entries_user_id_created_at_idx" ON "journal_entries"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "journal_entries_location_id_idx" ON "journal_entries"("location_id");

-- CreateIndex
CREATE INDEX "journal_entries_entry_type_idx" ON "journal_entries"("entry_type");

-- CreateIndex
CREATE INDEX "journal_entries_privacy_level_idx" ON "journal_entries"("privacy_level");

-- CreateIndex
CREATE INDEX "journal_media_entry_id_order_index_idx" ON "journal_media"("entry_id", "order_index");

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_media" ADD CONSTRAINT "journal_media_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_transcriptions" ADD CONSTRAINT "voice_transcriptions_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
