

## Analysis of the Current State

After reviewing the entire codebase, console logs, and database schema, here's what I found:

### Currently Working Features
- **Feed** with categories, pagination (8/page), post creation, reactions
- **Post Detail** with comments, reactions, admin controls (pin/delete)
- **Notifications** panel with unread badge counter
- **Videos** panel (admin can add)
- **Glossary** with pagination (20/page), search, letter nav
- **Ranking** with pagination (10/page)
- **Missions** panel
- **Profile** panel with edit, avatar upload, badges, onboarding
- **Admin** panel with member management (role change, delete, edit profile), company management
- **Auth** with login, invite system, password setup

### Issues Found

1. **React ref warning on `UserAvatar` and `SidebarWidgets`** — Both components are function components receiving refs without `forwardRef`. This causes console warnings in `PostList` and `CommunityLayout`.

2. **Notification triggers insert with `auth.uid()` context** — The database triggers for notifications (`trg_comment_notify`, `trg_reaction_notify`, `trg_announcement_notify`) insert into `notifications` table, but the RLS INSERT policy requires `auth.uid() = user_id`. Since triggers run in a database context (not user context), these inserts will likely fail silently. The INSERT policy needs to allow trigger-based inserts (e.g., via a `SECURITY DEFINER` function or a service-role policy).

3. **Missing `profile/:userId` view** — The route `/the-hive/community/profile/:userId` exists in `App.tsx`, and `CommunityLayout` detects `isProfileView`, but the profile for *another user* is never rendered. The condition `activeView === "profile" && !isProfileView` means viewing another user's profile shows nothing.

4. **Post page reset on category change** — `PostList` has `page` state but doesn't reset it when `categorySlug` changes, so switching categories could show an empty page if the new category has fewer posts.

5. **`AchievementTicker.tsx` still exists** — The file is unused (import was removed) but still in the codebase.

### Proposed Fixes

**Step 1: Fix notification RLS for trigger inserts**
- Create a `SECURITY DEFINER` function to insert notifications, and update the triggers to use it instead of direct inserts. This ensures notifications actually get created.

**Step 2: Fix `UserAvatar` ref warning**
- Wrap `UserAvatar` with `React.forwardRef` to eliminate the console warning.

**Step 3: Fix public profile view (`/profile/:userId`)**
- Add rendering for `isProfileView` in `CommunityLayout` that shows the target user's profile (read-only) with their badges and stats.

**Step 4: Reset PostList page on category change**
- Add a `useEffect` in `PostList` that resets `page` to 1 when `categorySlug` changes.

**Step 5: Delete unused `AchievementTicker.tsx`**
- Remove the dead file.

### Technical Details

- **Notification RLS fix**: Create a `SECURITY DEFINER` function `insert_notification(...)` that bypasses RLS. Update the 3 triggers to call this function. Alternatively, add a service-role INSERT policy.
- **forwardRef**: Standard React pattern — wrap the component and pass `ref` to the root element.
- **Profile view**: Reuse existing `ProfilePanel` by passing a `userId` prop, or create a read-only variant that fetches the target user's profile, posts count, badges.
- **Page reset**: `useEffect(() => setPage(1), [categorySlug])` in `PostList`.

