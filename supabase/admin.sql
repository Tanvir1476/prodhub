-- =============================================================================
-- Register the single Admin account.
--
-- 1. In the Supabase Dashboard go to Authentication → Users → "Add user"
--    → "Create new user". Enter the admin email + a strong password and tick
--    "Auto Confirm User".
-- 2. Replace the email below with the one you used and run this script.
-- 3. Put the same email in ADMIN_EMAIL in your .env.local / Vercel env vars.
-- =============================================================================

insert into public.admin_users (user_id)
select id from auth.users where lower(email) = lower('tanvirfarhan07@gmail.com')
on conflict (user_id) do nothing;

-- Verify (should return one row):
select u.id, u.email, a.created_at as registered_as_admin_at
from public.admin_users a
join auth.users u on u.id = a.user_id;
