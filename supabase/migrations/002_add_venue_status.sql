alter table venues add column if not exists status text default 'published' check (status in ('published', 'pending'));
update venues set status = 'published' where status is null;
drop policy if exists "public read venues" on venues;
create policy "public read published venues" on venues for select using (status = 'published');
create policy "public submit venues" on venues for insert with check (status = 'pending');
