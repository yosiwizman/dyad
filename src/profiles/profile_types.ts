/**
 * Profile Types for Local User Profiles
 *
 * Profiles allow multiple users (e.g., kids) to use ABBA AI on the same machine
 * with isolated workspaces and PIN-based authentication.
 */

import { z } from "zod";

/**
 * Profile schema for local user profiles
 */
export const ProfileSchema = z.object({
  /** Unique profile identifier (UUID) */
  id: z.string().uuid(),

  /** Display name for the profile */
  name: z.string().min(1).max(50),

  /** Hashed PIN (4-6 digits, stored as bcrypt hash) */
  pinHash: z.string(),

  /** Profile creation timestamp */
  createdAt: z.string().datetime(),

  /** Last login timestamp */
  lastLoginAt: z.string().datetime().optional(),

  /** Whether this is an admin profile (can access developer mode) */
  isAdmin: z.boolean().default(false),

  /** Avatar color/emoji for visual identification */
  avatarColor: z.string().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;

/**
 * Profile without sensitive data (for UI display)
 */
export const ProfileSummarySchema = ProfileSchema.omit({ pinHash: true });
export type ProfileSummary = z.infer<typeof ProfileSummarySchema>;

/**
 * Profiles storage schema
 */
export const ProfilesStorageSchema = z.object({
  /** List of all profiles */
  profiles: z.array(ProfileSchema),

  /** Version for future migration support */
  version: z.number().default(1),
});

export type ProfilesStorage = z.infer<typeof ProfilesStorageSchema>;

/**
 * Create profile input
 */
export const CreateProfileInputSchema = z.object({
  name: z.string().min(1).max(50),
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
  isAdmin: z.boolean().optional(),
  avatarColor: z.string().optional(),
});

export type CreateProfileInput = z.infer<typeof CreateProfileInputSchema>;

/**
 * Verify PIN input
 */
export const VerifyPinInputSchema = z.object({
  profileId: z.string().uuid(),
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
});

export type VerifyPinInput = z.infer<typeof VerifyPinInputSchema>;

/**
 * Active profile session (in-memory only, not persisted)
 */
export interface ActiveProfileSession {
  profileId: string;
  profileName: string;
  isAdmin: boolean;
  loginAt: Date;
}

/**
 * Profile colors for avatar selection
 */
export const PROFILE_AVATAR_COLORS = [
  "#8B5CF6", // Purple (ABBA brand)
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
] as const;

export type ProfileAvatarColor = (typeof PROFILE_AVATAR_COLORS)[number];
