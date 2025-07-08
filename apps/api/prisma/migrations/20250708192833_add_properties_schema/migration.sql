-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "source_url" VARCHAR(1000) NOT NULL,
    "source_platform" VARCHAR(100),
    "external_id" VARCHAR(255),
    "listing_status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "title" VARCHAR(500),
    "description" TEXT,
    "property_type" VARCHAR(100),
    "transaction_type" VARCHAR(50),
    "price" DECIMAL(15,2),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'EUR',
    "price_per_sqm" DECIMAL(10,2),
    "monthly_charges" DECIMAL(10,2),
    "size_sqm" DECIMAL(8,2),
    "rooms" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "floor_number" INTEGER,
    "total_floors" INTEGER,
    "year_built" INTEGER,
    "address" TEXT,
    "city" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "region" VARCHAR(100),
    "country" VARCHAR(100),
    "coordinates" JSONB,
    "features" JSONB,
    "energy_rating" VARCHAR(10),
    "photos" JSONB,
    "virtual_tour_url" VARCHAR(500),
    "floor_plan_url" VARCHAR(500),
    "agent_name" VARCHAR(255),
    "agent_phone" VARCHAR(50),
    "agent_email" VARCHAR(255),
    "agency_name" VARCHAR(255),
    "first_scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "last_price_check" TIMESTAMP(3),
    "scraping_errors" JSONB,
    "data_quality_score" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_saved_properties" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "personal_notes" TEXT,
    "user_rating" SMALLINT,
    "visit_status" VARCHAR(50),
    "visit_date" TIMESTAMP(3),
    "custom_tags" TEXT[],
    "pros" TEXT[],
    "cons" TEXT[],
    "priority_level" SMALLINT,
    "related_trip_id" TEXT,
    "related_journal_entries" TEXT[],
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_saved_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_price_history" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "price_change_percentage" DECIMAL(5,2),
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scraping_platforms" (
    "id" TEXT NOT NULL,
    "platform_name" VARCHAR(100) NOT NULL,
    "country" VARCHAR(10),
    "base_domain" VARCHAR(255),
    "selectors" JSONB,
    "headers" JSONB,
    "rate_limit_ms" INTEGER NOT NULL DEFAULT 1000,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scraping_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "properties_source_url_key" ON "properties"("source_url");

-- CreateIndex
CREATE INDEX "properties_source_url_idx" ON "properties"("source_url");

-- CreateIndex
CREATE INDEX "properties_source_platform_idx" ON "properties"("source_platform");

-- CreateIndex
CREATE INDEX "properties_city_country_idx" ON "properties"("city", "country");

-- CreateIndex
CREATE INDEX "properties_price_currency_idx" ON "properties"("price", "currency");

-- CreateIndex
CREATE INDEX "properties_property_type_idx" ON "properties"("property_type");

-- CreateIndex
CREATE INDEX "properties_transaction_type_idx" ON "properties"("transaction_type");

-- CreateIndex
CREATE INDEX "properties_listing_status_idx" ON "properties"("listing_status");

-- CreateIndex
CREATE INDEX "user_saved_properties_user_id_idx" ON "user_saved_properties"("user_id");

-- CreateIndex
CREATE INDEX "user_saved_properties_visit_status_idx" ON "user_saved_properties"("visit_status");

-- CreateIndex
CREATE INDEX "user_saved_properties_priority_level_idx" ON "user_saved_properties"("priority_level");

-- CreateIndex
CREATE UNIQUE INDEX "user_saved_properties_user_id_property_id_key" ON "user_saved_properties"("user_id", "property_id");

-- CreateIndex
CREATE INDEX "property_price_history_property_id_recorded_at_idx" ON "property_price_history"("property_id", "recorded_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "scraping_platforms_platform_name_key" ON "scraping_platforms"("platform_name");

-- CreateIndex
CREATE INDEX "scraping_platforms_platform_name_idx" ON "scraping_platforms"("platform_name");

-- CreateIndex
CREATE INDEX "scraping_platforms_country_idx" ON "scraping_platforms"("country");

-- CreateIndex
CREATE INDEX "scraping_platforms_is_active_idx" ON "scraping_platforms"("is_active");

-- AddForeignKey
ALTER TABLE "user_saved_properties" ADD CONSTRAINT "user_saved_properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_properties" ADD CONSTRAINT "user_saved_properties_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_properties" ADD CONSTRAINT "user_saved_properties_related_trip_id_fkey" FOREIGN KEY ("related_trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_price_history" ADD CONSTRAINT "property_price_history_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
