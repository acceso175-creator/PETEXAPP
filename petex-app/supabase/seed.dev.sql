-- Optional dev seed for PETEX Block 2 data layer.
-- Execute manually in Supabase SQL editor on non-production environments.

insert into public.profiles (id, email, full_name, role)
values
  ('11111111-1111-1111-1111-111111111111', 'admin.demo@petex.app', 'Admin Demo', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'driver.demo@petex.app', 'Driver Demo', 'driver')
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role;

insert into public.zones (id, name, color)
values
  ('33333333-3333-3333-3333-333333333331', 'Zona Centro', '#f97316'),
  ('33333333-3333-3333-3333-333333333332', 'Zona Norte', '#0ea5e9')
on conflict (id) do update
set
  name = excluded.name,
  color = excluded.color;

insert into public.routes (id, date, driver_id, status, notes)
values (
  '44444444-4444-4444-4444-444444444444',
  current_date,
  '22222222-2222-2222-2222-222222222222',
  'assigned',
  'Ruta demo para QA local'
)
on conflict (id) do update
set
  date = excluded.date,
  driver_id = excluded.driver_id,
  status = excluded.status,
  notes = excluded.notes;

insert into public.shipments (
  id,
  tracking,
  tracking_code,
  external_ref,
  status,
  city,
  address_raw,
  address_norm,
  recipient_name,
  recipient_phone,
  zone_id,
  driver_id
)
values
  (
    '55555555-5555-5555-5555-555555555551',
    'MEX-DEMO-001',
    'DEMO-001',
    'ORD-1001',
    'in_route',
    'Chihuahua',
    'Av. Universidad 100, Chihuahua',
    'Av. Universidad 100, Col. Centro, Chihuahua, Chih.',
    'Ana Torres',
    '+526141110001',
    '33333333-3333-3333-3333-333333333331',
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    'MEX-DEMO-002',
    'DEMO-002',
    'ORD-1002',
    'received',
    'Chihuahua',
    'Calle 20 de Noviembre 55, Chihuahua',
    'Calle 20 de Noviembre 55, Col. Norte, Chihuahua, Chih.',
    'Luis Pérez',
    '+526141110002',
    '33333333-3333-3333-3333-333333333332',
    '22222222-2222-2222-2222-222222222222'
  )
on conflict (id) do update
set
  status = excluded.status,
  city = excluded.city,
  address_raw = excluded.address_raw,
  address_norm = excluded.address_norm,
  recipient_name = excluded.recipient_name,
  recipient_phone = excluded.recipient_phone,
  zone_id = excluded.zone_id,
  driver_id = excluded.driver_id,
  updated_at = now();

insert into public.deliveries (
  id,
  shipment_id,
  tracking,
  status,
  city,
  address_raw,
  address_norm,
  recipient_name,
  recipient_phone,
  lat,
  lng,
  zone_id,
  driver_id
)
values
  (
    '66666666-6666-6666-6666-666666666661',
    '55555555-5555-5555-5555-555555555551',
    'MEX-DEMO-001',
    'pendiente',
    'Chihuahua',
    'Av. Universidad 100, Chihuahua',
    'Av. Universidad 100, Col. Centro, Chihuahua, Chih.',
    'Ana Torres',
    '+526141110001',
    28.63528,
    -106.08889,
    '33333333-3333-3333-3333-333333333331',
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    '55555555-5555-5555-5555-555555555552',
    'MEX-DEMO-002',
    'entregado',
    'Chihuahua',
    'Calle 20 de Noviembre 55, Chihuahua',
    'Calle 20 de Noviembre 55, Col. Norte, Chihuahua, Chih.',
    'Luis Pérez',
    '+526141110002',
    28.64871,
    -106.07314,
    '33333333-3333-3333-3333-333333333332',
    '22222222-2222-2222-2222-222222222222'
  )
on conflict (id) do update
set
  status = excluded.status,
  city = excluded.city,
  address_raw = excluded.address_raw,
  address_norm = excluded.address_norm,
  recipient_name = excluded.recipient_name,
  recipient_phone = excluded.recipient_phone,
  lat = excluded.lat,
  lng = excluded.lng,
  zone_id = excluded.zone_id,
  driver_id = excluded.driver_id,
  updated_at = now();

insert into public.route_stops (id, route_id, stop_order, recipient_name, phone, address, city, lat, lng, status)
values
  (
    '77777777-7777-7777-7777-777777777771',
    '44444444-4444-4444-4444-444444444444',
    1,
    'Ana Torres',
    '+526141110001',
    'Av. Universidad 100, Chihuahua',
    'Chihuahua',
    28.63528,
    -106.08889,
    'pending'
  ),
  (
    '77777777-7777-7777-7777-777777777772',
    '44444444-4444-4444-4444-444444444444',
    2,
    'Luis Pérez',
    '+526141110002',
    'Calle 20 de Noviembre 55, Chihuahua',
    'Chihuahua',
    28.64871,
    -106.07314,
    'delivered'
  )
on conflict (id) do update
set
  stop_order = excluded.stop_order,
  recipient_name = excluded.recipient_name,
  phone = excluded.phone,
  address = excluded.address,
  city = excluded.city,
  lat = excluded.lat,
  lng = excluded.lng,
  status = excluded.status;

insert into public.shipment_events (shipment_id, actor_user_id, type, payload)
values
  (
    '55555555-5555-5555-5555-555555555551',
    '11111111-1111-1111-1111-111111111111',
    'status_changed',
    '{"from":"received","to":"in_route"}'::jsonb
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    '11111111-1111-1111-1111-111111111111',
    'status_changed',
    '{"from":"received","to":"delivered"}'::jsonb
  );
