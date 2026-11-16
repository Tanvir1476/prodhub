-- =============================================================================
-- OPTIONAL sample data so the public site has something to show on first run.
-- Run after schema.sql. Delete these rows from the Admin dashboard whenever
-- you like — nothing in the application depends on them.
-- =============================================================================

insert into public.products (name, quantity, price, colors, category, description, purchase_link)
values
  ('Wireless Noise-Cancelling Headphones', 24, 8950.00, array['Black','Silver'], 'Electronics',
   'Over-ear headphones with 30-hour battery life, active noise cancellation and a foldable design for travel.',
   'https://example.com/headphones'),
  ('Ergonomic Office Chair', 6, 14500.00, array['Gray','Black'], 'Home & Living',
   'Mesh-back chair with adjustable lumbar support, 4D armrests and a 120 kg load rating.',
   'https://example.com/office-chair'),
  ('Stainless Steel Water Bottle 1L', 120, 1250.00, array['Navy','Olive','White'], 'Sports & Outdoors',
   'Double-wall vacuum insulated bottle that keeps drinks cold for 24 hours and hot for 12.',
   null),
  ('Mechanical Keyboard (TKL)', 0, 6400.00, array['White','Black'], 'Electronics',
   'Tenkeyless layout with hot-swappable switches, PBT keycaps and per-key RGB lighting.',
   'https://example.com/keyboard'),
  ('Cotton Panjabi', 35, 2200.00, array['Cream','Maroon','Teal'], 'Fashion',
   'Premium cotton panjabi with hand-finished embroidery on the collar and placket.',
   null),
  ('Ceramic Pour-Over Coffee Set', 12, 3100.00, array['White','Charcoal'], 'Kitchen',
   'Dripper, server and two cups in matte-glazed stoneware. Fits standard #2 paper filters.',
   'https://example.com/coffee-set');
