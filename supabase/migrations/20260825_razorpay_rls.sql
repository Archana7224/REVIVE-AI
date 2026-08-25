-- Apply only in the Supabase project backing the Edge Functions.
-- The existing REVIVE merchant model must expose merchants.owner_id = auth.uid().

alter table public.merchants enable row level security;
alter table public.customers enable row level security;
alter table public.payments enable row level security;
alter table public.recovery_cases enable row level security;
alter table public.payment_links enable row level security;
alter table public.agent_logs enable row level security;
alter table public.webhook_events enable row level security;

create policy "merchant members can read own records" on public.merchants for select using (owner_id = auth.uid());
create policy "merchant members can read own customers" on public.customers for select using (exists (select 1 from public.merchants m where m.id = customers.merchant_id and m.owner_id = auth.uid()));
create policy "merchant members can read own payments" on public.payments for select using (exists (select 1 from public.merchants m where m.id = payments.merchant_id and m.owner_id = auth.uid()));
create policy "merchant members can read own recovery cases" on public.recovery_cases for select using (exists (select 1 from public.payments p join public.merchants m on m.id = p.merchant_id where p.id = recovery_cases.payment_id and m.owner_id = auth.uid()));
create policy "merchant members can read own payment links" on public.payment_links for select using (exists (select 1 from public.recovery_cases rc join public.payments p on p.id = rc.payment_id join public.merchants m on m.id = p.merchant_id where rc.id = payment_links.recovery_case_id and m.owner_id = auth.uid()));
create policy "merchant members can read own agent logs" on public.agent_logs for select using (exists (select 1 from public.recovery_cases rc join public.payments p on p.id = rc.payment_id join public.merchants m on m.id = p.merchant_id where rc.id = agent_logs.recovery_case_id and m.owner_id = auth.uid()));
create policy "merchant members can read own webhook events" on public.webhook_events for select using (exists (select 1 from public.payments p join public.merchants m on m.id = p.merchant_id where p.razorpay_payment_id = webhook_events.razorpay_payment_id and m.owner_id = auth.uid()));

-- Keep webhook writes server-only through the service-role client; clients receive updates via SELECT policies.
alter publication supabase_realtime add table public.recovery_cases;
alter publication supabase_realtime add table public.payments;
