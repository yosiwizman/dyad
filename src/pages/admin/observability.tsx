/**
 * Admin Observability Page
 *
 * View system metrics, logs, and performance data.
 * Future: real-time metrics, log viewer, alerting.
 */

import { Activity } from "lucide-react";
import { StubPage } from "./StubPage";

export default function AdminObservabilityPage() {
  return (
    <StubPage
      title="Observability"
      description="View system metrics, application logs, and performance data. Monitor AI usage, response times, and error rates."
      docRef="KB-030"
      icon={Activity}
    />
  );
}
