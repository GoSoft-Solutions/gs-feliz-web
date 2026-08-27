/**
 * FELIZ Worker — skeleton.
 *
 * This process is intentionally empty of business logic in Phase 1.
 * It exists so the monorepo structure, build pipeline, and deployment
 * target (a second Elastic Beanstalk environment/process) are ready
 * ahead of time, per the roadmap (see docs/roadmap.md).
 *
 * Real responsibilities land in later phases:
 *  - Phase 6 (Newsletter MVP): consume SQS messages, send email via SES.
 *  - Later: scheduled/background jobs sourced from DB-scheduled jobs.
 *
 * Until then, running this process is a no-op that logs a startup
 * message and exits, so `pnpm dev` across the monorepo does not hang on
 * an app with no work to do yet.
 */
function main(): void {
  console.log('[worker] FELIZ worker skeleton — no queues configured yet (Phase 6+).');
}

main();
