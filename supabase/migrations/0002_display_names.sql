-- Add display_name to household_members so users can choose how their name
-- appears in the app (instead of their email). Update is restricted to the
-- caller's own row via a SECURITY DEFINER RPC.

alter table public.household_members
  add column if not exists display_name text;

create or replace function public.update_my_display_name(p_display_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_clean text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  v_clean := nullif(btrim(p_display_name), '');

  if v_clean is not null and length(v_clean) > 60 then
    raise exception 'display name too long';
  end if;

  update public.household_members
     set display_name = v_clean
   where user_id = v_uid;
end;
$$;

revoke all on function public.update_my_display_name(text) from public;
grant execute on function public.update_my_display_name(text) to authenticated;
