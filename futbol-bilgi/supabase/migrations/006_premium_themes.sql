INSERT INTO public.shop_items (item_type, name, description, preview_url, price_coins, price_gems, league_scope, is_premium, is_active)
VALUES
  ('theme', 'Şampiyonlar Gecesi', 'Gece finali hissi veren premium altın tema.', '/previews/theme_champion_night.jpg', 0, 150, 'turkey', true, true),
  ('theme', 'Zümrüt Alev', 'Derin zümrüt tonları ve canlı vurgu renkleri.', '/previews/theme_emerald_flare.jpg', 0, 90, 'turkey', true, true),
  ('theme', 'Gece Altını', 'Koyu zemin üzerinde soğuk mavi ve altın karışımı premium tema.', '/previews/theme_midnight_gold.jpg', 0, 120, 'turkey', true, true)
ON CONFLICT DO NOTHING;
