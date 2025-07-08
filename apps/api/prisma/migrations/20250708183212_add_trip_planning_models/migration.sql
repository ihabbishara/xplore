-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creator_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "trip_type" TEXT,
    "cover_image_url" TEXT,
    "estimated_budget" DECIMAL(10,2),
    "actual_budget" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "settings" JSONB,
    "analytics" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_destinations" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "arrival_date" TIMESTAMP(3) NOT NULL,
    "departure_date" TIMESTAMP(3) NOT NULL,
    "day_order" INTEGER NOT NULL,
    "accommodation_type" TEXT,
    "accommodation_name" TEXT,
    "accommodation_address" TEXT,
    "activities" JSONB,
    "notes" TEXT,
    "weather" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_segments" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "from_destination_id" TEXT NOT NULL,
    "to_destination_id" TEXT NOT NULL,
    "transport_mode" TEXT NOT NULL,
    "distance" DECIMAL(10,2),
    "duration" INTEGER,
    "cost" DECIMAL(10,2),
    "currency" VARCHAR(3),
    "polyline" TEXT,
    "waypoints" JSONB,
    "departure_time" TIMESTAMP(3),
    "arrival_time" TIMESTAMP(3),
    "booking_reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_collaborators" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "permissions" JSONB,
    "invited_by" TEXT,
    "invited_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_weather_summaries" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "destination_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "weather_provider" TEXT NOT NULL,
    "temperature" JSONB NOT NULL,
    "conditions" TEXT NOT NULL,
    "precipitation" DECIMAL(5,2),
    "wind_speed" DECIMAL(5,2),
    "humidity" SMALLINT,
    "uv_index" SMALLINT,
    "sunrise" TIMESTAMP(3),
    "sunset" TIMESTAMP(3),
    "alerts" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_weather_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trip_id" TEXT,
    "location_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood" TEXT,
    "weather" JSONB,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "tags" TEXT[],
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_media" (
    "id" TEXT NOT NULL,
    "journal_id" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "caption" TEXT,
    "metadata" JSONB,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "user_id" TEXT NOT NULL,
    "trip_id" TEXT,
    "template_id" TEXT,
    "category" TEXT,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "priority" TEXT,
    "due_date" TIMESTAMP(3),
    "assigned_to" TEXT,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_collaborators" (
    "id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trips_creator_id_idx" ON "trips"("creator_id");

-- CreateIndex
CREATE INDEX "trips_start_date_end_date_idx" ON "trips"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "trips_status_idx" ON "trips"("status");

-- CreateIndex
CREATE INDEX "trip_destinations_trip_id_day_order_idx" ON "trip_destinations"("trip_id", "day_order");

-- CreateIndex
CREATE INDEX "trip_destinations_arrival_date_departure_date_idx" ON "trip_destinations"("arrival_date", "departure_date");

-- CreateIndex
CREATE INDEX "route_segments_trip_id_idx" ON "route_segments"("trip_id");

-- CreateIndex
CREATE INDEX "route_segments_transport_mode_idx" ON "route_segments"("transport_mode");

-- CreateIndex
CREATE INDEX "trip_collaborators_user_id_idx" ON "trip_collaborators"("user_id");

-- CreateIndex
CREATE INDEX "trip_collaborators_role_idx" ON "trip_collaborators"("role");

-- CreateIndex
CREATE UNIQUE INDEX "trip_collaborators_trip_id_user_id_key" ON "trip_collaborators"("trip_id", "user_id");

-- CreateIndex
CREATE INDEX "trip_weather_summaries_trip_id_date_idx" ON "trip_weather_summaries"("trip_id", "date");

-- CreateIndex
CREATE INDEX "trip_weather_summaries_destination_id_idx" ON "trip_weather_summaries"("destination_id");

-- CreateIndex
CREATE INDEX "journal_entries_user_id_created_at_idx" ON "journal_entries"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "journal_entries_trip_id_idx" ON "journal_entries"("trip_id");

-- CreateIndex
CREATE INDEX "journal_entries_tags_idx" ON "journal_entries"("tags");

-- CreateIndex
CREATE INDEX "journal_media_journal_id_idx" ON "journal_media"("journal_id");

-- CreateIndex
CREATE INDEX "checklists_user_id_idx" ON "checklists"("user_id");

-- CreateIndex
CREATE INDEX "checklists_trip_id_idx" ON "checklists"("trip_id");

-- CreateIndex
CREATE INDEX "checklists_category_idx" ON "checklists"("category");

-- CreateIndex
CREATE INDEX "checklist_items_checklist_id_order_index_idx" ON "checklist_items"("checklist_id", "order_index");

-- CreateIndex
CREATE INDEX "checklist_items_assigned_to_idx" ON "checklist_items"("assigned_to");

-- CreateIndex
CREATE INDEX "checklist_collaborators_user_id_idx" ON "checklist_collaborators"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_collaborators_checklist_id_user_id_key" ON "checklist_collaborators"("checklist_id", "user_id");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_destinations" ADD CONSTRAINT "trip_destinations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_destinations" ADD CONSTRAINT "trip_destinations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_from_destination_id_fkey" FOREIGN KEY ("from_destination_id") REFERENCES "trip_destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_collaborators" ADD CONSTRAINT "trip_collaborators_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_collaborators" ADD CONSTRAINT "trip_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_collaborators" ADD CONSTRAINT "trip_collaborators_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_weather_summaries" ADD CONSTRAINT "trip_weather_summaries_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_media" ADD CONSTRAINT "journal_media_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_collaborators" ADD CONSTRAINT "checklist_collaborators_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_collaborators" ADD CONSTRAINT "checklist_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
