-- Enable PostGIS
create extension if not exists postgis;

-- Venues table
create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('cafe', 'library', 'mall', 'museum', 'supermarket', 'cinema', 'community_centre')),
  lat double precision not null,
  lng double precision not null,
  location geography(point, 4326) generated always as (st_point(lng, lat)::geography) stored,
  address text,
  city text,
  country text,
  has_ac boolean,
  ac_confidence text check (ac_confidence in ('inferred', 'review_mined', 'crowdsourced', 'confirmed')),
  brand text,
  wifi boolean,
  purchase_required boolean,
  time_limit_minutes integer,
  seating boolean,
  work_friendly boolean,
  opening_hours jsonb,
  google_place_id text,
  osm_id text unique,
  last_updated timestamptz default now()
);

-- Spatial index for proximity queries
create index venues_location_idx on venues using gist(location);

-- AC votes table
create table ac_votes (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  vote text not null check (vote in ('yes', 'no')),
  created_at timestamptz default now()
);

-- Proximity query function
-- Returns venues within radius_km of (lat, lng), ordered by distance
create or replace function venues_near(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 2,
  p_limit integer default 50
)
returns table (
  id uuid, name text, type text, lat double precision, lng double precision,
  address text, city text, country text,
  has_ac boolean, ac_confidence text, brand text,
  wifi boolean, purchase_required boolean, time_limit_minutes integer,
  seating boolean, work_friendly boolean, opening_hours jsonb,
  distance_m double precision
)
language sql stable as $$
  select
    v.id, v.name, v.type, v.lat, v.lng,
    v.address, v.city, v.country,
    v.has_ac, v.ac_confidence, v.brand,
    v.wifi, v.purchase_required, v.time_limit_minutes,
    v.seating, v.work_friendly, v.opening_hours,
    st_distance(v.location, st_point(p_lng, p_lat)::geography) as distance_m
  from venues v
  where st_dwithin(v.location, st_point(p_lng, p_lat)::geography, p_radius_km * 1000)
  order by distance_m
  limit p_limit;
$$;

-- Row level security: public read, no public write on venues
alter table venues enable row level security;
create policy "public read venues" on venues for select using (true);

-- Public insert on ac_votes (crowdsourcing), no update/delete
alter table ac_votes enable row level security;
create policy "public insert votes" on ac_votes for insert with check (true);
create policy "public read votes" on ac_votes for select using (true);
