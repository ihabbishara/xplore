-- CreateTable
CREATE TABLE "location_analytics" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "user_id" TEXT,
    "total_visits" INTEGER NOT NULL DEFAULT 0,
    "total_time_spent" BIGINT NOT NULL DEFAULT 0,
    "journal_entries" INTEGER NOT NULL DEFAULT 0,
    "saved_by_users" INTEGER NOT NULL DEFAULT 0,
    "average_sentiment" DECIMAL(3,2),
    "sentiment_distribution" JSONB,
    "average_cost_rating" DECIMAL(3,2),
    "cost_breakdown" JSONB,
    "affordability_score" DECIMAL(3,2),
    "weather_rating" DECIMAL(3,2),
    "culture_rating" DECIMAL(3,2),
    "safety_rating" DECIMAL(3,2),
    "transport_rating" DECIMAL(3,2),
    "visit_patterns" JSONB,
    "activity_preferences" JSONB,
    "decision_factors" JSONB,
    "relocate_probability" DECIMAL(3,2),
    "comparison_score" DECIMAL(5,2),
    "ranking_position" INTEGER,
    "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_quality_score" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exploration_insights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "location_analytics_id" TEXT,
    "insight_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "confidence" DECIMAL(3,2) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "actionable" BOOLEAN NOT NULL DEFAULT false,
    "supporting_data" JSONB,
    "related_locations" TEXT[],
    "is_viewed" BOOLEAN NOT NULL DEFAULT false,
    "is_useful" BOOLEAN,
    "is_dismissed" BOOLEAN NOT NULL DEFAULT false,
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exploration_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_comparisons" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comparison_name" VARCHAR(255),
    "location_ids" TEXT[],
    "criteria" JSONB NOT NULL,
    "scores" JSONB NOT NULL,
    "rankings" JSONB NOT NULL,
    "winner" TEXT,
    "strengths" JSONB,
    "weaknesses" JSONB,
    "recommendations" JSONB,
    "is_bookmarked" BOOLEAN NOT NULL DEFAULT false,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_cache" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cache_key" VARCHAR(255) NOT NULL,
    "cache_type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_accessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_matrices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "matrix_type" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "alternatives" JSONB NOT NULL,
    "scores" JSONB,
    "rankings" JSONB,
    "sensitivity" JSONB,
    "final_decision" TEXT,
    "decision_reason" TEXT,
    "decision_date" TIMESTAMP(3),
    "confidence" DECIMAL(3,2),
    "actual_outcome" TEXT,
    "satisfaction_rating" SMALLINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_matrices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_behavior_patterns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pattern_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "pattern" JSONB NOT NULL,
    "frequency" DECIMAL(3,2) NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "triggers" JSONB,
    "outcomes" JSONB,
    "first_observed" TIMESTAMP(3) NOT NULL,
    "last_observed" TIMESTAMP(3) NOT NULL,
    "evolution" JSONB,
    "data_points" INTEGER NOT NULL,
    "reliability" DECIMAL(3,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_behavior_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictive_models" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "model_type" TEXT NOT NULL,
    "target_variable" TEXT NOT NULL,
    "accuracy" DECIMAL(3,2) NOT NULL,
    "precision" DECIMAL(3,2),
    "recall" DECIMAL(3,2),
    "f1_score" DECIMAL(3,2),
    "features" JSONB NOT NULL,
    "hyperparameters" JSONB NOT NULL,
    "training_data_size" INTEGER NOT NULL,
    "training_period" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_trained" TIMESTAMP(3) NOT NULL,
    "last_validated" TIMESTAMP(3),
    "predictions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictive_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LocationAnalyticsToLocationComparison" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "location_analytics_location_id_key" ON "location_analytics"("location_id");

-- CreateIndex
CREATE INDEX "location_analytics_location_id_idx" ON "location_analytics"("location_id");

-- CreateIndex
CREATE INDEX "location_analytics_user_id_idx" ON "location_analytics"("user_id");

-- CreateIndex
CREATE INDEX "location_analytics_average_sentiment_idx" ON "location_analytics"("average_sentiment");

-- CreateIndex
CREATE INDEX "location_analytics_comparison_score_idx" ON "location_analytics"("comparison_score");

-- CreateIndex
CREATE INDEX "location_analytics_last_calculated_idx" ON "location_analytics"("last_calculated");

-- CreateIndex
CREATE INDEX "exploration_insights_user_id_idx" ON "exploration_insights"("user_id");

-- CreateIndex
CREATE INDEX "exploration_insights_insight_type_idx" ON "exploration_insights"("insight_type");

-- CreateIndex
CREATE INDEX "exploration_insights_category_idx" ON "exploration_insights"("category");

-- CreateIndex
CREATE INDEX "exploration_insights_priority_idx" ON "exploration_insights"("priority");

-- CreateIndex
CREATE INDEX "exploration_insights_created_at_idx" ON "exploration_insights"("created_at");

-- CreateIndex
CREATE INDEX "exploration_insights_valid_until_idx" ON "exploration_insights"("valid_until");

-- CreateIndex
CREATE INDEX "location_comparisons_user_id_idx" ON "location_comparisons"("user_id");

-- CreateIndex
CREATE INDEX "location_comparisons_location_ids_idx" ON "location_comparisons"("location_ids");

-- CreateIndex
CREATE INDEX "location_comparisons_created_at_idx" ON "location_comparisons"("created_at");

-- CreateIndex
CREATE INDEX "dashboard_cache_user_id_idx" ON "dashboard_cache"("user_id");

-- CreateIndex
CREATE INDEX "dashboard_cache_cache_type_idx" ON "dashboard_cache"("cache_type");

-- CreateIndex
CREATE INDEX "dashboard_cache_expires_at_idx" ON "dashboard_cache"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_cache_user_id_cache_key_key" ON "dashboard_cache"("user_id", "cache_key");

-- CreateIndex
CREATE INDEX "decision_matrices_user_id_idx" ON "decision_matrices"("user_id");

-- CreateIndex
CREATE INDEX "decision_matrices_matrix_type_idx" ON "decision_matrices"("matrix_type");

-- CreateIndex
CREATE INDEX "decision_matrices_is_active_idx" ON "decision_matrices"("is_active");

-- CreateIndex
CREATE INDEX "decision_matrices_is_template_idx" ON "decision_matrices"("is_template");

-- CreateIndex
CREATE INDEX "user_behavior_patterns_user_id_idx" ON "user_behavior_patterns"("user_id");

-- CreateIndex
CREATE INDEX "user_behavior_patterns_pattern_type_idx" ON "user_behavior_patterns"("pattern_type");

-- CreateIndex
CREATE INDEX "user_behavior_patterns_category_idx" ON "user_behavior_patterns"("category");

-- CreateIndex
CREATE INDEX "user_behavior_patterns_frequency_idx" ON "user_behavior_patterns"("frequency");

-- CreateIndex
CREATE INDEX "user_behavior_patterns_last_observed_idx" ON "user_behavior_patterns"("last_observed");

-- CreateIndex
CREATE INDEX "predictive_models_user_id_idx" ON "predictive_models"("user_id");

-- CreateIndex
CREATE INDEX "predictive_models_model_type_idx" ON "predictive_models"("model_type");

-- CreateIndex
CREATE INDEX "predictive_models_target_variable_idx" ON "predictive_models"("target_variable");

-- CreateIndex
CREATE INDEX "predictive_models_is_active_idx" ON "predictive_models"("is_active");

-- CreateIndex
CREATE INDEX "predictive_models_last_trained_idx" ON "predictive_models"("last_trained");

-- CreateIndex
CREATE UNIQUE INDEX "_LocationAnalyticsToLocationComparison_AB_unique" ON "_LocationAnalyticsToLocationComparison"("A", "B");

-- CreateIndex
CREATE INDEX "_LocationAnalyticsToLocationComparison_B_index" ON "_LocationAnalyticsToLocationComparison"("B");

-- AddForeignKey
ALTER TABLE "location_analytics" ADD CONSTRAINT "location_analytics_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_analytics" ADD CONSTRAINT "location_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exploration_insights" ADD CONSTRAINT "exploration_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exploration_insights" ADD CONSTRAINT "exploration_insights_location_analytics_id_fkey" FOREIGN KEY ("location_analytics_id") REFERENCES "location_analytics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_comparisons" ADD CONSTRAINT "location_comparisons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_cache" ADD CONSTRAINT "dashboard_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_matrices" ADD CONSTRAINT "decision_matrices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_behavior_patterns" ADD CONSTRAINT "user_behavior_patterns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictive_models" ADD CONSTRAINT "predictive_models_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationAnalyticsToLocationComparison" ADD CONSTRAINT "_LocationAnalyticsToLocationComparison_A_fkey" FOREIGN KEY ("A") REFERENCES "location_analytics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationAnalyticsToLocationComparison" ADD CONSTRAINT "_LocationAnalyticsToLocationComparison_B_fkey" FOREIGN KEY ("B") REFERENCES "location_comparisons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
