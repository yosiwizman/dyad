/**
 * Admin Publishing Page
 *
 * Manage publishing operations and broker configuration.
 * Future: queue management, deployment targets, publish history.
 */

import { Rocket } from "lucide-react";
import { StubPage } from "./StubPage";

export default function AdminPublishingPage() {
  return (
    <StubPage
      title="Publishing Operations"
      description="Manage app publishing through the ABBA broker. View publish queue, configure deployment targets, and review publish history."
      docRef="KB-026"
      icon={Rocket}
    />
  );
}
