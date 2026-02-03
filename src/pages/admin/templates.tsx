/**
 * Admin Templates Page
 *
 * Manage app templates for child users.
 * Future: create/edit templates, import from hub, set defaults.
 */

import { LayoutTemplate } from "lucide-react";
import { StubPage } from "./StubPage";

export default function AdminTemplatesPage() {
  return (
    <StubPage
      title="Template Management"
      description="Create and manage app templates. Import templates from the hub and set defaults for child users."
      docRef="KB-024"
      icon={LayoutTemplate}
    />
  );
}
