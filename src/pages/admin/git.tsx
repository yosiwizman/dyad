/**
 * Admin Git Ops Page
 *
 * Manage Git operations and repository settings.
 * Future: repo sync, branch management, commit history.
 */

import { GitBranch } from "lucide-react";
import { StubPage } from "./StubPage";

export default function AdminGitPage() {
  return (
    <StubPage
      title="Git Operations"
      description="Manage Git repositories, sync status, and branch policies. View commit history and manage repository access."
      docRef="KB-029"
      icon={GitBranch}
    />
  );
}
