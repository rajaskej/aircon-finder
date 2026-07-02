-- Track when a venue's Google reviews were last mined, so pipeline runs
-- don't re-query the paid Place Details API for venues already checked.
alter table venues add column if not exists reviews_checked_at timestamptz;

-- Graz and Vienna were fully mined on 2026-07-02; mark them checked so the
-- next pipeline run doesn't re-bill ~2,500 Place Details calls.
update venues set reviews_checked_at = now()
where city in ('Graz', 'Vienna') and reviews_checked_at is null;
