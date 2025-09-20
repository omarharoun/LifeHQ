-- Dots Dashboard Database Schema
-- Run this in your Supabase SQL editor

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Workspaces table
create table public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  owner uuid references auth.users(id) not null,
  title text not null default 'Untitled workspace',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Nodes (dots) table
create table public.nodes (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  owner uuid references auth.users(id) not null,
  type text not null check (type in ('action','knowledge','custom')),
  title text,
  content jsonb default '{}'::jsonb, -- freeform content, like blocks, rich text
  position jsonb default '{"x":0,"y":0}'::jsonb, -- {x:number,y:number,scale:number}
  style jsonb default '{}'::jsonb, -- color, shape, size
  properties jsonb default '{}'::jsonb, -- tags, due date, points, etc
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Links (edges) table
create table public.links (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  owner uuid references auth.users(id) not null,
  from_node uuid references public.nodes(id) on delete cascade,
  to_node uuid references public.nodes(id) on delete cascade,
  label text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activity log (audit) table
create table public.activities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  action text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Create indexes for performance
create index idx_workspaces_owner on public.workspaces(owner);
create index idx_nodes_workspace_id on public.nodes(workspace_id);
create index idx_nodes_owner on public.nodes(owner);
create index idx_links_workspace_id on public.links(workspace_id);
create index idx_links_from_node on public.links(from_node);
create index idx_links_to_node on public.links(to_node);
create index idx_activities_workspace_id on public.activities(workspace_id);
create index idx_activities_user_id on public.activities(user_id);

-- Enable Row Level Security
alter table public.workspaces enable row level security;
alter table public.nodes enable row level security;
alter table public.links enable row level security;
alter table public.activities enable row level security;

-- RLS Policies

-- Workspaces: only owner can select/insert/update/delete
create policy "workspaces_owner" on public.workspaces
  for all
  using (owner = auth.uid())
  with check (owner = auth.uid());

-- Nodes: only owners of the workspace can access
create policy "nodes_owner" on public.nodes
  for all
  using (exists (select 1 from public.workspaces w where w.id = public.nodes.workspace_id and w.owner = auth.uid()))
  with check (exists (select 1 from public.workspaces w where w.id = public.nodes.workspace_id and w.owner = auth.uid()));

-- Links: similar policy to nodes
create policy "links_owner" on public.links
  for all
  using (exists (select 1 from public.workspaces w where w.id = public.links.workspace_id and w.owner = auth.uid()))
  with check (exists (select 1 from public.workspaces w where w.id = public.links.workspace_id and w.owner = auth.uid()));

-- Activities: allow insert by authenticated users into their workspace; selection only by workspace owner
create policy "activities_insert" on public.activities
  for insert
  with check (auth.uid() = user_id);

create policy "activities_select_owner" on public.activities
  for select
  using (exists (select 1 from public.workspaces w where w.id = public.activities.workspace_id and w.owner = auth.uid()));

-- Functions for automatic updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_updated_at before update on public.workspaces
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.nodes
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.links
  for each row execute procedure public.handle_updated_at();

-- Function to log activities automatically
create or replace function public.log_activity()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.activities (user_id, workspace_id, action, payload)
    values (
      auth.uid(),
      coalesce(new.workspace_id, (select workspace_id from public.nodes where id = new.from_node limit 1)),
      TG_OP || '_' || TG_TABLE_NAME,
      row_to_json(new)
    );
    return new;
  elsif TG_OP = 'UPDATE' then
    insert into public.activities (user_id, workspace_id, action, payload)
    values (
      auth.uid(),
      coalesce(new.workspace_id, (select workspace_id from public.nodes where id = new.from_node limit 1)),
      TG_OP || '_' || TG_TABLE_NAME,
      jsonb_build_object('old', row_to_json(old), 'new', row_to_json(new))
    );
    return new;
  elsif TG_OP = 'DELETE' then
    insert into public.activities (user_id, workspace_id, action, payload)
    values (
      auth.uid(),
      coalesce(old.workspace_id, (select workspace_id from public.nodes where id = old.from_node limit 1)),
      TG_OP || '_' || TG_TABLE_NAME,
      row_to_json(old)
    );
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

-- Triggers for activity logging
create trigger log_workspace_activity after insert or update or delete on public.workspaces
  for each row execute procedure public.log_activity();

create trigger log_node_activity after insert or update or delete on public.nodes
  for each row execute procedure public.log_activity();

create trigger log_link_activity after insert or update or delete on public.links
  for each row execute procedure public.log_activity();

-- Enable realtime for tables
alter publication supabase_realtime add table public.workspaces;
alter publication supabase_realtime add table public.nodes;
alter publication supabase_realtime add table public.links;
alter publication supabase_realtime add table public.activities;