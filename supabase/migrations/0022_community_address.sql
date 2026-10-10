-- Each sub community has an address. An event with no place of its own uses its community's address, so the address is
-- typed once (Admin > About) and every event follows it.

alter table public.sub_communities
  add column address text check (address is null or char_length(address) between 1 and 120);

update public.sub_communities set address = 'Rivapark Floor UG Deli Park Medan' where address is null;
update public.sub_communities set address = 'Luahap Eatery - Apt Mansyur Residence 2nd Floor, Medan' where name = 'Beyground';

alter table public.schedule_events alter column place drop not null;
alter table public.schedule_events drop constraint if exists schedule_events_place_check;
alter table public.schedule_events add constraint schedule_events_place_check check (place is null or char_length(place) between 1 and 120);

-- Events that only repeated the community's address now follow it.
update public.schedule_events e set place = null
  from public.sub_communities c
  where e.sub_community_id = c.id and e.place = c.address;
