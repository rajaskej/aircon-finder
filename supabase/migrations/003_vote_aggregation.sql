-- Function to aggregate AC votes for a venue
create or replace function aggregate_votes_for_venue(p_venue_id uuid)
returns void language plpgsql security definer as $$
declare
  v_yes integer;
  v_no integer;
  v_total integer;
begin
  select
    count(*) filter (where vote = 'yes'),
    count(*) filter (where vote = 'no')
  into v_yes, v_no
  from ac_votes
  where venue_id = p_venue_id;

  v_total := v_yes + v_no;

  if v_total >= 3 then
    if v_yes > v_no then
      update venues set has_ac = true, ac_confidence = 'crowdsourced', last_updated = now()
      where id = p_venue_id;
    else
      update venues set has_ac = false, ac_confidence = 'crowdsourced', last_updated = now()
      where id = p_venue_id;
    end if;
  end if;
end;
$$;

-- Trigger: aggregate votes after each insert
create or replace function trigger_aggregate_votes()
returns trigger language plpgsql security definer as $$
begin
  perform aggregate_votes_for_venue(NEW.venue_id);
  return NEW;
end;
$$;

drop trigger if exists aggregate_votes_trigger on ac_votes;
create trigger aggregate_votes_trigger
  after insert on ac_votes
  for each row execute function trigger_aggregate_votes();

-- Redefine venues_near to explicitly filter published venues (defense in depth)
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
  where v.status = 'published'
    and st_dwithin(v.location, st_point(p_lng, p_lat)::geography, p_radius_km * 1000)
  order by distance_m
  limit p_limit;
$$;

-- Add length constraints on venue name to limit spam payload size
alter table venues add constraint venues_name_length check (char_length(name) <= 200);
