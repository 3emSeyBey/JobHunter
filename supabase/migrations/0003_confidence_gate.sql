-- Adds confidence gate column for existing settings rows.
alter table settings add column if not exists min_confidence int not null default 3 check (min_confidence between 0 and 10);
alter table settings add column if not exists llm_batch_size int not null default 1 check (llm_batch_size between 1 and 20);
