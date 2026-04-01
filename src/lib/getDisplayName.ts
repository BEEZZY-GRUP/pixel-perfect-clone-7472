/**
 * Returns the best display name for a profile.
 * Priority: name > email > company_name
 *
 * @param profile  Must have at least { name?, company_name }
 * @param email    Optional email fetched separately (e.g. from get_user_emails RPC)
 */
export function getDisplayName(
  profile: { name?: string | null; company_name?: string | null } | null | undefined,
  email?: string | null,
): string {
  if (!profile) return "Membro";
  if (profile.name?.trim()) return profile.name.trim();
  if (email?.trim()) return email.trim();
  return profile.company_name?.trim() || "Membro";
}
