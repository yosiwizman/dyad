/**
 * Admin Vault Page
 *
 * Manage vault configuration and secrets.
 * Future: vault status, backup/restore, key rotation.
 */

import { Lock } from "lucide-react";
import { StubPage } from "./StubPage";

export default function AdminVaultPage() {
  return (
    <StubPage
      title="Vault Operations"
      description="Manage the secure vault for API keys and credentials. View vault status, perform backup/restore, and rotate encryption keys."
      docRef="KB-027"
      icon={Lock}
    />
  );
}
