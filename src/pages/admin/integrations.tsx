/**
 * Admin Integrations Page
 *
 * Manage third-party integrations (GitHub, Supabase, Vercel, Neon).
 * Future: connection status, OAuth management, API keys.
 */

import { Plug } from "lucide-react";
import { StubPage } from "./StubPage";

export default function AdminIntegrationsPage() {
  return (
    <StubPage
      title="Integrations"
      description="Manage third-party integrations including GitHub, Supabase, Vercel, and Neon. View connection status and manage OAuth tokens."
      docRef="KB-028"
      icon={Plug}
    />
  );
}
