/*
  Warnings:

  - You are about to drop the column `company_info` on the `migration_plans` table. All the data in the column will be lost.
  - You are about to drop the column `current_stack` on the `migration_plans` table. All the data in the column will be lost.
  - You are about to drop the column `data_inventory` on the `migration_plans` table. All the data in the column will be lost.
  - You are about to drop the column `generated_plan` on the `migration_plans` table. All the data in the column will be lost.
  - You are about to drop the column `priorities` on the `migration_plans` table. All the data in the column will be lost.
  - You are about to drop the column `timeline_months` on the `migration_plans` table. All the data in the column will be lost.
  - You are about to drop the column `total_cost_max` on the `migration_plans` table. All the data in the column will be lost.
  - You are about to drop the column `total_cost_min` on the `migration_plans` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `migration_plans` table. All the data in the column will be lost.
  - Added the required column `asset_id` to the `migration_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `migration_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `migration_plans` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "migration_plans" DROP CONSTRAINT "migration_plans_user_id_fkey";

-- AlterTable
ALTER TABLE "migration_plans" DROP COLUMN "company_info",
DROP COLUMN "current_stack",
DROP COLUMN "data_inventory",
DROP COLUMN "generated_plan",
DROP COLUMN "priorities",
DROP COLUMN "timeline_months",
DROP COLUMN "total_cost_max",
DROP COLUMN "total_cost_min",
DROP COLUMN "user_id",
ADD COLUMN     "asset_id" UUID NOT NULL,
ADD COLUMN     "business_priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "current_progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estimated_duration_days" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estimated_engineering_effort" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estimated_risk_reduction" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "overall_priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" VARCHAR(50) NOT NULL,
ADD COLUMN     "technical_priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "workflow_run_id" UUID;

-- AlterTable
ALTER TABLE "scan_results" ADD COLUMN     "asset_id" UUID;

-- AlterTable
ALTER TABLE "threat_items" ADD COLUMN     "affected_algorithms" TEXT[],
ADD COLUMN     "cve_id" VARCHAR(50),
ADD COLUMN     "impact" TEXT,
ADD COLUMN     "recommendation" TEXT;

-- AlterTable
ALTER TABLE "threat_subscriptions" ADD COLUMN     "verification_token" VARCHAR(255),
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" VARCHAR(50),
ADD COLUMN     "knowledge_level" VARCHAR(50) NOT NULL DEFAULT 'beginner';

-- CreateTable
CREATE TABLE "unsubscribe_feedbacks" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unsubscribe_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "asset_type" VARCHAR(50) NOT NULL,
    "repository_url" VARCHAR(500),
    "domain" VARCHAR(255),
    "description" TEXT,
    "tags" TEXT[],
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "current_risk_score" INTEGER,
    "current_quantum_readiness" INTEGER,
    "latest_scan_id" UUID,
    "metadata" JSONB,
    "last_scan_at" TIMESTAMP(3),
    "next_scheduled_scan_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_events" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "source_module" VARCHAR(100) NOT NULL,
    "event_data" JSONB,
    "created_by_user_id" UUID,
    "system_generated" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_snapshots" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "scan_result_id" UUID,
    "overall_risk_score" INTEGER NOT NULL,
    "quantum_readiness_score" INTEGER NOT NULL,
    "critical_findings" INTEGER NOT NULL,
    "high_findings" INTEGER NOT NULL,
    "medium_findings" INTEGER NOT NULL,
    "low_findings" INTEGER NOT NULL,
    "algorithm_summary" JSONB NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "job_type" VARCHAR(100) NOT NULL,
    "job_status" VARCHAR(50) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "asset_id" UUID,
    "requested_by_user_id" UUID,
    "queue_name" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "current_stage" VARCHAR(100),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "result_payload" JSONB,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" UUID NOT NULL,
    "workflow_name" VARCHAR(150) NOT NULL,
    "workflow_type" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "step_order" INTEGER NOT NULL,
    "step_type" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "job_type" VARCHAR(50) NOT NULL,
    "configuration" JSONB,
    "depends_on_step_id" UUID,
    "retry_policy" JSONB,
    "timeout_seconds" INTEGER,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_runs" (
    "id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "asset_id" UUID,
    "requested_by_user_id" UUID,
    "status" VARCHAR(50) NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_step_executions" (
    "id" UUID NOT NULL,
    "workflow_run_id" UUID NOT NULL,
    "workflow_step_id" UUID NOT NULL,
    "job_id" UUID,
    "status" VARCHAR(50) NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,

    CONSTRAINT "workflow_step_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threat_advisories" (
    "id" UUID NOT NULL,
    "source" VARCHAR(100) NOT NULL,
    "advisory_id" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "references" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "threat_advisories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threat_rules" (
    "id" UUID NOT NULL,
    "rule_id" VARCHAR(100) NOT NULL,
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "condition" JSONB NOT NULL,
    "recommended_action" TEXT NOT NULL,
    "deprecation_status" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "threat_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threat_correlations" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "snapshot_id" UUID,
    "workflow_run_id" UUID,
    "job_id" UUID,
    "status" VARCHAR(50) NOT NULL,
    "overall_severity" VARCHAR(50),
    "overall_priority" INTEGER NOT NULL DEFAULT 0,
    "overall_confidence" INTEGER NOT NULL DEFAULT 0,
    "correlated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "threat_correlations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threat_matches" (
    "id" UUID NOT NULL,
    "correlation_id" UUID NOT NULL,
    "algorithm" VARCHAR(100) NOT NULL,
    "algorithm_family" VARCHAR(100),
    "finding_id" VARCHAR(100),
    "threat_source" VARCHAR(100) NOT NULL,
    "advisory_id" UUID,
    "rule_id" UUID,
    "confidence" INTEGER NOT NULL DEFAULT 100,
    "severity" VARCHAR(50) NOT NULL,
    "impact" TEXT,
    "affected_component" VARCHAR(255),
    "evidence" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "threat_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threat_recommendations" (
    "id" UUID NOT NULL,
    "correlation_id" UUID NOT NULL,
    "recommendation_type" VARCHAR(100) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "estimated_effort" VARCHAR(50) NOT NULL,
    "estimated_risk_reduction" INTEGER NOT NULL,
    "references" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "threat_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migration_phases" (
    "id" UUID NOT NULL,
    "migration_plan_id" UUID NOT NULL,
    "phase_order" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL,

    CONSTRAINT "migration_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migration_tasks" (
    "id" UUID NOT NULL,
    "migration_plan_id" UUID NOT NULL,
    "migration_phase_id" UUID,
    "task_type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "algorithm" VARCHAR(100),
    "current_technology" VARCHAR(100),
    "recommended_technology" VARCHAR(100),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL,
    "estimated_hours" INTEGER NOT NULL DEFAULT 0,
    "complexity" VARCHAR(50) NOT NULL,
    "depends_on_task_id" UUID,

    CONSTRAINT "migration_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migration_decisions" (
    "id" UUID NOT NULL,
    "migration_plan_id" UUID NOT NULL,
    "decision_type" VARCHAR(100) NOT NULL,
    "approved_by_user_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "migration_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "weekly_summary" BOOLEAN NOT NULL DEFAULT false,
    "monthly_compliance" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_audits" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "report_type" VARCHAR(50) NOT NULL,
    "report_period" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "error_log" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_events_asset_id_created_at_idx" ON "asset_events"("asset_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "asset_snapshots_asset_id_captured_at_idx" ON "asset_snapshots"("asset_id", "captured_at" DESC);

-- CreateIndex
CREATE INDEX "jobs_job_status_created_at_idx" ON "jobs"("job_status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "jobs_asset_id_created_at_idx" ON "jobs"("asset_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "workflow_runs_status_created_at_idx" ON "workflow_runs"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "workflow_runs_asset_id_created_at_idx" ON "workflow_runs"("asset_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "workflow_step_executions_job_id_key" ON "workflow_step_executions"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "threat_advisories_source_advisory_id_key" ON "threat_advisories"("source", "advisory_id");

-- CreateIndex
CREATE UNIQUE INDEX "threat_rules_rule_id_key" ON "threat_rules"("rule_id");

-- CreateIndex
CREATE INDEX "threat_correlations_asset_id_correlated_at_idx" ON "threat_correlations"("asset_id", "correlated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE INDEX "report_audits_user_id_report_type_report_period_idx" ON "report_audits"("user_id", "report_type", "report_period");

-- CreateIndex
CREATE UNIQUE INDEX "report_audits_user_id_report_type_report_period_key" ON "report_audits"("user_id", "report_type", "report_period");

-- CreateIndex
CREATE INDEX "migration_plans_asset_id_created_at_idx" ON "migration_plans"("asset_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_events" ADD CONSTRAINT "asset_events_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_events" ADD CONSTRAINT "asset_events_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_snapshots" ADD CONSTRAINT "asset_snapshots_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_snapshots" ADD CONSTRAINT "asset_snapshots_scan_result_id_fkey" FOREIGN KEY ("scan_result_id") REFERENCES "scan_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_results" ADD CONSTRAINT "scan_results_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_depends_on_step_id_fkey" FOREIGN KEY ("depends_on_step_id") REFERENCES "workflow_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_step_executions" ADD CONSTRAINT "workflow_step_executions_workflow_run_id_fkey" FOREIGN KEY ("workflow_run_id") REFERENCES "workflow_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_step_executions" ADD CONSTRAINT "workflow_step_executions_workflow_step_id_fkey" FOREIGN KEY ("workflow_step_id") REFERENCES "workflow_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_step_executions" ADD CONSTRAINT "workflow_step_executions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "threat_matches" ADD CONSTRAINT "threat_matches_correlation_id_fkey" FOREIGN KEY ("correlation_id") REFERENCES "threat_correlations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "threat_matches" ADD CONSTRAINT "threat_matches_advisory_id_fkey" FOREIGN KEY ("advisory_id") REFERENCES "threat_advisories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "threat_matches" ADD CONSTRAINT "threat_matches_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "threat_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "threat_recommendations" ADD CONSTRAINT "threat_recommendations_correlation_id_fkey" FOREIGN KEY ("correlation_id") REFERENCES "threat_correlations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migration_phases" ADD CONSTRAINT "migration_phases_migration_plan_id_fkey" FOREIGN KEY ("migration_plan_id") REFERENCES "migration_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migration_tasks" ADD CONSTRAINT "migration_tasks_migration_plan_id_fkey" FOREIGN KEY ("migration_plan_id") REFERENCES "migration_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migration_tasks" ADD CONSTRAINT "migration_tasks_migration_phase_id_fkey" FOREIGN KEY ("migration_phase_id") REFERENCES "migration_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migration_tasks" ADD CONSTRAINT "migration_tasks_depends_on_task_id_fkey" FOREIGN KEY ("depends_on_task_id") REFERENCES "migration_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migration_decisions" ADD CONSTRAINT "migration_decisions_migration_plan_id_fkey" FOREIGN KEY ("migration_plan_id") REFERENCES "migration_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_audits" ADD CONSTRAINT "report_audits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
