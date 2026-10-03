-- Additive pilot persistence. The API authorizes every projection and mutation.
-- This service-only document is intentionally inaccessible to browser clients.
begin;
create table public.ev_assistant_state (
  id integer primary key check (id = 1),
  version bigint not null default 0,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.ev_assistant_state enable row level security;
revoke all on public.ev_assistant_state from public, anon, authenticated;
grant select, update on public.ev_assistant_state to service_role;
insert into public.ev_assistant_state(id,payload) values(1,
  '{"profiles":{},"measurements":{},"households":{},"memberships":{},"invites":{},"checkIns":{},"logs":{},"proposals":{},"plans":{},"pantry":{},"messages":{},"feedback":{},"nutrition":{},"demos":{},"events":[]}');
create function public.ev_assistant_commit(expected_version bigint, next_payload jsonb)
returns boolean language plpgsql security invoker set search_path = public as $$
declare affected integer;
begin
  update public.ev_assistant_state set payload=next_payload,version=version+1,updated_at=now()
  where id=1 and version=expected_version;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;
revoke all on function public.ev_assistant_commit(bigint,jsonb) from public,anon,authenticated;
grant execute on function public.ev_assistant_commit(bigint,jsonb) to service_role;
commit;
