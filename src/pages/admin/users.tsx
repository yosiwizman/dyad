/**
 * Admin Users Page
 *
 * Manage child user profiles and permissions.
 * Future: filter-by-child, create/edit profiles, view activity.
 */

import { Users } from "lucide-react";
import { StubPage } from "./StubPage";

export default function AdminUsersPage() {
  return (
    <StubPage
      title="User Management"
      description="Manage child user profiles, view activity, and configure permissions. Filter apps and chats by child user."
      docRef="KB-023"
      icon={Users}
    />
  );
}
