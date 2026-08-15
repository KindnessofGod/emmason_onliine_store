-- Catalogue for Emmason Mobile Phones, Tech & Gadgets.
--
-- Prices are in kobo: 4500000 = ₦45,000. They were researched against the
-- Nigerian retail market in August 2026 (oraimo.com.ng, Jumia NG, Jiji,
-- NaijaTechGuide, Coprices) so the store opens with believable numbers rather
-- than invented ones. They are still placeholders: Emmason must confirm every
-- price against real cost before selling, and re-check periodically — naira
-- pricing on imported electronics moves with the exchange rate.
--
-- compare_at_price_kobo drives the struck-through "was" price. It is set ONLY
-- where a genuinely higher reference price exists. Inventing one is a false
-- discount, which the FCCPA treats as a misleading trade practice — leave it
-- null rather than guess.
--
-- Product images are intentionally empty — the storefront renders a branded
-- placeholder tile until real photos are uploaded through the admin panel.

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
insert into public.categories (slug, name, description, sort_order) values
  ('chargers-power-banks', 'Chargers & Power Banks', 'Fast chargers, cables and high-capacity power banks to keep you going through any outage.', 1),
  ('bluetooth-speakers',   'Bluetooth Speakers',     'Portable and party speakers with deep bass, long battery life and FM radio.', 2),
  ('earbuds',              'Earbuds',                'True-wireless earbuds with noise cancelling and all-day battery.', 3),
  ('headsets',             'Headsets',               'Over-ear headphones and call headsets for music, gaming and work.', 4),
  ('smart-watches',        'Smart Watches',          'Fitness tracking, call answering and always-on displays.', 5),
  ('smart-glasses',        'Smart Glasses',          'Audio and camera glasses for hands-free calls and recording.', 6),
  ('button-phones',        'Button Phones',          'Durable Nokia-style phones with month-long standby and loud speakers.', 7),
  ('kids-tablets',         'Children''s Tablets',    'Learning tablets with parental controls and shock-proof cases.', 8),
  ('cameras',              'Cameras',                'Vlogging, action and security cameras for creators and homes.', 9),
  ('microphones',          'Microphones',            'Lapel, USB and wireless microphones built for content creation.', 10),
  ('tripods',              'Tripods',                'Phone and camera tripods, ring lights and selfie sticks.', 11),
  ('car-stereos',          'Car Stereos',            'Android head units, car speakers and reversing camera kits.', 12),
  ('clippers',             'Clippers',               'Professional cordless hair clippers, trimmers and shavers.', 13),
  ('fans',                 'Fans',                   'Rechargeable standing, table and mini fans that survive the heat.', 14),
  ('home-appliances',      'Home Appliances',        'Blenders, kettles, irons and everyday kitchen essentials.', 15),
  ('multi-tool-kits',      '13-in-1 Kits',           'All-in-one charging, tool and accessory kits — one box, thirteen jobs.', 16)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Delivery zones — flat fee per state.
--
-- Priced from OWERRI, IMO STATE, where the shop is. Imo is the home state and
-- cheapest; the South East and South South neighbours are next; the far North
-- East costs most. Getting this backwards (a Lagos-centric table) would
-- overcharge Emmason's closest customers, who are the ones most likely to
-- choose pickup instead and walk into the shop.
-- ---------------------------------------------------------------------------
insert into public.delivery_zones (state, fee_kobo, eta_days) values
  -- Home state
  ('Imo',          100000, 'Same or next working day'),
  -- South East and immediate neighbours
  ('Abia',         180000, '1-2 working days'),
  ('Anambra',      180000, '1-2 working days'),
  ('Rivers',       200000, '1-2 working days'),
  ('Enugu',        200000, '1-2 working days'),
  ('Ebonyi',       220000, '2-3 working days'),
  ('Delta',        220000, '2-3 working days'),
  ('Bayelsa',      250000, '2-3 working days'),
  ('Akwa Ibom',    250000, '2-3 working days'),
  ('Cross River',  250000, '2-3 working days'),
  ('Edo',          250000, '2-3 working days'),
  -- South West and Middle Belt
  ('Lagos',        300000, '2-4 working days'),
  ('Ogun',         300000, '2-4 working days'),
  ('Oyo',          320000, '3-4 working days'),
  ('Osun',         320000, '3-4 working days'),
  ('Ondo',         300000, '2-4 working days'),
  ('Ekiti',        320000, '3-4 working days'),
  ('Kogi',         280000, '2-4 working days'),
  ('Benue',        300000, '3-4 working days'),
  ('FCT - Abuja',  300000, '2-4 working days'),
  ('Nasarawa',     320000, '3-4 working days'),
  ('Kwara',        330000, '3-5 working days'),
  ('Niger',        350000, '3-5 working days'),
  ('Plateau',      350000, '3-5 working days'),
  -- North West
  ('Kaduna',       380000, '4-6 working days'),
  ('Kano',         400000, '4-6 working days'),
  ('Katsina',      420000, '4-6 working days'),
  ('Jigawa',       420000, '4-6 working days'),
  ('Zamfara',      450000, '5-7 working days'),
  ('Kebbi',        450000, '5-7 working days'),
  ('Sokoto',       450000, '5-7 working days'),
  -- North East
  ('Bauchi',       420000, '4-6 working days'),
  ('Gombe',        420000, '4-6 working days'),
  ('Taraba',       450000, '5-7 working days'),
  ('Adamawa',      450000, '5-7 working days'),
  ('Yobe',         480000, '5-8 working days'),
  ('Borno',        480000, '5-8 working days')
on conflict (state) do nothing;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
insert into public.products
  (category_id, slug, name, brand, description, price_kobo, compare_at_price_kobo, stock, sku, specs, warranty_months, is_featured)
select c.id, v.slug, v.name, v.brand, v.description, v.price_kobo, v.compare_at_price_kobo, v.stock, v.sku, v.specs::jsonb, v.warranty_months, v.is_featured
from (values
  -- Chargers & Power Banks -------------------------------------------------
  ('chargers-power-banks', 'oraimo-toast-20-20000mah-power-bank', 'oraimo Toast 20 20,000mAh Power Bank', 'oraimo', 'Charges a phone four times over on one fill. Dual USB-A output plus USB-C in/out, with an LED gauge so you always know what is left before NEPA takes light.', 2450000, 2900000, 42, 'EMM-PWR-001', '{"Capacity":"20,000mAh","Output":"20W PD + QC 3.0","Ports":"2x USB-A, 1x USB-C","Weight":"420g"}', 12, true),
  ('chargers-power-banks', 'oraimo-powerbox-600-60000mah', 'oraimo PowerBox 600 60,000mAh', 'oraimo', 'The one you buy when the outage lasts days, not hours. Runs a phone for a week, a fan overnight, and a laptop through a work session.', 10880000, null, 8, 'EMM-PWR-002', '{"Capacity":"60,000mAh","Output":"65W PD","Ports":"2x USB-A, 2x USB-C","Extras":"LED torch, digital display"}', 12, true),
  ('chargers-power-banks', 'oraimo-toast-22-5-byte-10000mah', 'oraimo Toast 22.5 Byte 10,000mAh', 'oraimo', 'Pocket-sized and genuinely light. The one to carry when you do not want to feel a power bank in your pocket all day.', 1400000, null, 55, 'EMM-PWR-003', '{"Capacity":"10,000mAh","Output":"22.5W SuperFast","Ports":"1x USB-A, 1x USB-C","Weight":"195g"}', 12, false),
  ('chargers-power-banks', 'oraimo-65w-gan-fast-charger', 'oraimo 65W GaN Fast Charger', 'oraimo', 'One brick for phone, tablet and laptop. GaN internals keep it cool and about half the size of the charger it replaces.', 2250000, 2800000, 48, 'EMM-PWR-004', '{"Output":"65W","Ports":"2x USB-C, 1x USB-A","Standards":"PD 3.0, PPS"}', 12, true),
  ('chargers-power-banks', 'oraimo-33w-supercharge-wall-charger', 'oraimo 33W SuperCharge Wall Charger', 'oraimo', 'Fills a Tecno or Infinix battery to half in about twenty minutes. Surge-protected, which matters more here than the wattage does.', 1250000, null, 72, 'EMM-PWR-005', '{"Output":"33W","Ports":"1x USB-C, 1x USB-A","Safety":"Surge and over-voltage protection"}', 12, false),
  ('chargers-power-banks', 'anker-powercore-10000-slim', 'Anker PowerCore 10,000mAh Slim', 'Anker', 'Anker''s reliability in the smallest body they make it in. Costs more than the market average and lasts longer than it.', 2950000, null, 24, 'EMM-PWR-006', '{"Capacity":"10,000mAh","Output":"12W","Ports":"1x USB-A, 1x USB-C","Weight":"195g"}', 18, false),
  ('chargers-power-banks', 'solar-30000mah-rugged-power-bank', '30,000mAh Rugged Solar Power Bank', 'Generic', 'Built for long outages and travel. Solar top-up is a trickle, not a miracle, but the twin torches and huge cell earn their keep.', 4200000, null, 18, 'EMM-PWR-007', '{"Capacity":"30,000mAh","Extras":"Dual LED torch, solar panel","Rating":"IPX4 splash resistant"}', 6, false),
  ('chargers-power-banks', 'oraimo-braided-usb-c-cable-2m', 'oraimo 2m Braided USB-C Fast Charge Cable', 'oraimo', 'Nylon braided and stress-tested at the connector, where cheap cables always fail first.', 450000, 700000, 120, 'EMM-PWR-008', '{"Length":"2m","Current":"6A","Jacket":"Braided nylon"}', 6, false),

  -- Bluetooth Speakers -----------------------------------------------------
  ('bluetooth-speakers', 'oraimo-soundgo-2-portable-speaker', 'oraimo SoundGo 2 Portable Speaker', 'oraimo', 'The entry point that does not sound like one. Loud enough for a room, small enough for a bag, and it takes a splash.', 1200000, null, 46, 'EMM-SPK-001', '{"Output":"5W","Battery":"12 hours","Rating":"IPX5","Extras":"TF card, FM radio"}', 12, true),
  ('bluetooth-speakers', 'oraimo-boombox-2-party-speaker', 'oraimo BoomBox 2 Party Speaker', 'oraimo', 'Fills a compound. Twin drivers, deep bass and a battery that outlasts the party, with a mic input if someone wants the floor.', 4500000, 5500000, 15, 'EMM-SPK-002', '{"Output":"30W","Battery":"18 hours","Extras":"Mic input, RGB lighting, TWS pairing"}', 12, true),
  ('bluetooth-speakers', 'jbl-flip-6-portable-speaker', 'JBL Flip 6', 'JBL', 'The benchmark portable. You are paying for the drivers and the waterproofing, and both are the real thing.', 14500000, null, 9, 'EMM-SPK-003', '{"Output":"30W","Battery":"12 hours","Rating":"IP67 waterproof and dustproof","Extras":"PartyBoost pairing"}', 12, false),
  ('bluetooth-speakers', 'jbl-go-3-mini-speaker', 'JBL Go 3', 'JBL', 'Fits in a palm and clips to a bag. Genuine JBL sound at the size where most speakers stop being worth carrying.', 4200000, null, 27, 'EMM-SPK-004', '{"Output":"4.2W","Battery":"5 hours","Rating":"IP67","Weight":"209g"}', 12, false),
  ('bluetooth-speakers', 'ox-8-inch-trolley-party-speaker', 'Ox 8" Trolley Party Speaker', 'Ox', 'Wheels, a handle, a wireless mic and enough output for an outdoor event. The workhorse for owambe and church hall.', 8500000, 9800000, 11, 'EMM-SPK-005', '{"Driver":"8 inch","Battery":"6-8 hours","Extras":"Wireless mic, trolley wheels, FM, USB, guitar input"}', 6, false),
  ('bluetooth-speakers', 'oraimo-soundpro-stereo-speaker', 'oraimo SoundPro Stereo Speaker', 'oraimo', 'Two of them pair into true stereo. On its own it is a solid desk speaker with more low end than the size suggests.', 2850000, null, 22, 'EMM-SPK-006', '{"Output":"20W","Battery":"14 hours","Rating":"IPX6","Extras":"TWS stereo pairing"}', 12, false),
  ('bluetooth-speakers', 'rechargeable-fm-usb-speaker-generic', 'Rechargeable FM & USB Speaker', 'Generic', 'Plays from a memory card, a flash drive or FM with no phone involved. The one that ends up in the kitchen or the shop.', 950000, null, 38, 'EMM-SPK-007', '{"Output":"5W","Battery":"8 hours","Inputs":"TF card, USB, FM, AUX"}', 3, false),

  -- Earbuds ----------------------------------------------------------------
  ('earbuds', 'oraimo-freepods-4-anc-earbuds', 'oraimo FreePods 4 ANC Earbuds', 'oraimo', 'Active noise cancelling that actually cuts generator hum and danfo traffic. Four mics, so people can hear you on calls outdoors.', 2500000, 3200000, 34, 'EMM-EAR-001', '{"ANC":"Up to 42dB hybrid","Battery":"9h buds, 36h case","Bluetooth":"5.3","Rating":"IPX5"}', 12, true),
  ('earbuds', 'oraimo-freepods-pro-2', 'oraimo FreePods Pro 2', 'oraimo', 'The step up: better ANC, longer battery and wireless charging on the case. For people who wear buds most of the day.', 3200000, null, 19, 'EMM-EAR-002', '{"ANC":"Hybrid adaptive","Battery":"10h buds, 40h case","Charging":"USB-C + wireless","Bluetooth":"5.3"}', 12, true),
  ('earbuds', 'oraimo-freepods-3', 'oraimo FreePods 3', 'oraimo', 'The volume seller. Half-in-ear fit that stays comfortable for hours, and a case that survives being thrown in a bag.', 1950000, 2400000, 52, 'EMM-EAR-003', '{"Battery":"7h buds, 27h case","Bluetooth":"5.2","Rating":"IPX4","Extras":"Touch controls"}', 12, false),
  ('earbuds', 'oraimo-freepods-lite', 'oraimo FreePods Lite', 'oraimo', 'Cheapest oraimo buds worth owning. Skips ANC, keeps the battery life and the build.', 1350000, null, 61, 'EMM-EAR-004', '{"Battery":"6h buds, 24h case","Bluetooth":"5.3","Rating":"IPX4"}', 12, false),
  ('earbuds', 'oraimo-riff-earbuds', 'oraimo Riff Earbuds', 'oraimo', 'Small, light and cheap enough to keep a spare pair. Good for calls and podcasts more than for bass.', 1100000, null, 44, 'EMM-EAR-005', '{"Battery":"5h buds, 20h case","Bluetooth":"5.0","Weight":"3.7g per bud"}', 6, false),
  ('earbuds', 'apple-airpods-pro-2-uk-used', 'Apple AirPods Pro (2nd gen) — UK used', 'Apple', 'Genuine units, tested and cleaned, with battery health checked before they go on the shelf. Best ANC in the shop.', 18500000, null, 6, 'EMM-EAR-006', '{"ANC":"Adaptive, H2 chip","Battery":"6h buds, 30h case","Condition":"UK used, tested","Charging":"USB-C MagSafe"}', 3, false),
  ('earbuds', 'samsung-galaxy-buds-fe', 'Samsung Galaxy Buds FE', 'Samsung', 'Samsung''s value pair. Proper ANC and a secure wingtip fit that stays in while running.', 9500000, null, 12, 'EMM-EAR-007', '{"ANC":"Active","Battery":"6h buds, 30h case","Bluetooth":"5.2","Rating":"IPX2"}', 12, false),
  ('earbuds', 'i12-tws-budget-earbuds', 'i12 TWS Budget Earbuds', 'Generic', 'The cheapest wireless buds we will stand behind. Honest about what they are: fine for calls, light on bass.', 350000, null, 95, 'EMM-EAR-008', '{"Battery":"3h buds, 12h case","Bluetooth":"5.0","Extras":"Touch control"}', 1, false),

  -- Headsets ---------------------------------------------------------------
  ('headsets', 'oraimo-boompop-2-headphones', 'oraimo BoomPop 2 Headphones', 'oraimo', 'Over-ear, folding, and the battery runs for days rather than hours. The value pick for commuting and study.', 2200000, 2800000, 29, 'EMM-HED-001', '{"Battery":"60 hours","Driver":"40mm","Bluetooth":"5.3","Extras":"Foldable, AUX input"}', 12, true),
  ('headsets', 'jbl-tune-520bt', 'JBL Tune 520BT', 'JBL', 'JBL Pure Bass in a light on-ear frame. Speed-charge gives you three hours from five minutes on the cable.', 5200000, null, 14, 'EMM-HED-002', '{"Battery":"57 hours","Bluetooth":"5.3","Extras":"Speed charge, multipoint pairing"}', 12, false),
  ('headsets', 'sony-wh-ch520-headphones', 'Sony WH-CH520', 'Sony', 'Sony''s tuning at the affordable end. Comfortable enough to forget you have them on, which is the whole point on a long day.', 6800000, null, 8, 'EMM-HED-003', '{"Battery":"50 hours","Bluetooth":"5.2","Extras":"DSEE upscaling, multipoint"}', 12, false),
  ('headsets', 'rgb-gaming-headset-over-ear', 'RGB Gaming Headset', 'Generic', 'Boom mic, surround-tuned drivers and lighting. Wired, because wireless lag in a shooter is not worth the tidy cable.', 1850000, 2400000, 23, 'EMM-HED-004', '{"Connection":"3.5mm + USB for lighting","Driver":"50mm","Mic":"Detachable boom","Extras":"Inline volume control"}', 6, false),
  ('headsets', 'oraimo-sprint-mono-call-headset', 'oraimo Sprint Mono Call Headset', 'oraimo', 'One ear free, twenty hours of talk time. Built for drivers, dispatch riders and anyone on the phone all day.', 850000, null, 41, 'EMM-HED-005', '{"Battery":"20 hours talk","Bluetooth":"5.2","Weight":"9g","Extras":"Noise-reducing mic"}', 12, false),
  ('headsets', 'oraimo-vibe-wired-earphones', 'oraimo Vibe Wired Earphones', 'oraimo', 'Wired, so nothing to charge and nothing to pair. In-line mic and a cable that survives being wound round a phone.', 450000, null, 88, 'EMM-HED-006', '{"Connection":"3.5mm","Driver":"10mm","Extras":"In-line mic and remote"}', 6, false),

  -- Smart Watches ----------------------------------------------------------
  ('smart-watches', 'oraimo-watch-6-osw-807', 'oraimo Watch 6 (OSW-807)', 'oraimo', 'Big 2.04" screen, Bluetooth calling and IP68 so a downpour is not a problem. The current flagship of oraimo''s watch line.', 3200000, 3800000, 21, 'EMM-WAT-001', '{"Display":"2.04 inch TFT","Rating":"IP68","Battery":"Up to 10 days","Extras":"HD Bluetooth calling, heart rate, SpO2, AI watch faces"}', 12, true),
  ('smart-watches', 'oraimo-watch-5-smart-watch', 'oraimo Watch 5', 'oraimo', 'The one most people should buy. Calling, tracking and a week of battery, without paying flagship money.', 2400000, null, 33, 'EMM-WAT-002', '{"Display":"1.91 inch","Rating":"IP68","Battery":"7-10 days","Extras":"Bluetooth calling, 100+ sport modes"}', 12, true),
  ('smart-watches', 'oraimo-tempo-w2-osw-20', 'oraimo Tempo W2 (OSW-20)', 'oraimo', 'Round face, twenty-day standby. For people who want a watch that looks like a watch and charges twice a month.', 3600000, null, 12, 'EMM-WAT-003', '{"Display":"Round oval","Battery":"20-day standby","Rating":"IP67","Bluetooth":"4.2","Extras":"Heart rate, exercise tracking"}', 12, false),
  ('smart-watches', 'oraimo-watch-2-pro-osw-32', 'oraimo Watch 2 Pro (OSW-32)', 'oraimo', 'Large 1.75" screen and call alerts at the cheapest price oraimo does a proper watch. Still IP-rated.', 1650000, null, 26, 'EMM-WAT-004', '{"Display":"1.75 inch","Battery":"300mAh, 7 days","Bluetooth":"5.1","Extras":"Call and notification alerts"}', 12, false),
  ('smart-watches', 'oraimo-tempo-s-osw-11', 'oraimo Tempo S (OSW-11)', 'oraimo', 'Slim band-style tracker with twenty days between charges. Light enough to sleep in, which is when it does its best work.', 1600000, null, 30, 'EMM-WAT-005', '{"Display":"1.3 inch","Battery":"200mAh, 20 days","Bluetooth":"4.2","Extras":"Sleep and heart rate tracking"}', 12, false),
  ('smart-watches', 'itel-smartwatch-2-ultra', 'itel Smartwatch 2 Ultra', 'itel', 'itel''s answer to the oraimo watches, and it undercuts them. Calling, tracking, and a strap that does not stain.', 1800000, null, 24, 'EMM-WAT-006', '{"Display":"1.83 inch","Battery":"7 days","Rating":"IP67","Extras":"Bluetooth calling, SpO2"}', 12, false),
  ('smart-watches', 'apple-watch-se-2-uk-used', 'Apple Watch SE (2nd gen) — UK used', 'Apple', 'Genuine, tested, battery health checked. Pairs with iPhone only — say so to any customer before they pay.', 21000000, null, 4, 'EMM-WAT-007', '{"Display":"40mm Retina","Condition":"UK used, tested","Compatibility":"iPhone only","Extras":"Crash detection, ECG-free SE sensor set"}', 3, false),

  -- Smart Glasses ----------------------------------------------------------
  ('smart-glasses', 'bluetooth-audio-sunglasses', 'Bluetooth Audio Sunglasses', 'Generic', 'Open-ear speakers in the arms, so you hear music and traffic at once. Polarised lenses that swap for clear ones.', 2800000, 3500000, 17, 'EMM-GLS-001', '{"Battery":"6 hours playback","Bluetooth":"5.2","Lenses":"Polarised, swappable","Extras":"Touch controls, call mic"}', 6, true),
  ('smart-glasses', 'camera-glasses-1080p', '1080p Camera Glasses', 'Generic', 'Records what you are looking at, hands free. Useful for riders and site work; check consent before filming people.', 4500000, null, 9, 'EMM-GLS-002', '{"Video":"1080p 30fps","Storage":"32GB built in","Battery":"90 minutes recording","Extras":"One-touch capture"}', 6, false),
  ('smart-glasses', 'oraimo-glass-audio-eyewear', 'oraimo Glass Audio Eyewear', 'oraimo', 'oraimo''s build quality on the audio-glasses idea, with a warranty that means something locally.', 3800000, null, 11, 'EMM-GLS-003', '{"Battery":"8 hours","Bluetooth":"5.3","Rating":"IPX4","Extras":"Dual mic, open-ear drivers"}', 12, false),
  ('smart-glasses', 'anti-blue-light-computer-glasses', 'Anti Blue Light Computer Glasses', 'Generic', 'No battery, no pairing. Just a coating that takes the edge off long screen days.', 1200000, 1600000, 48, 'EMM-GLS-004', '{"Filter":"Blue light blocking coating","Frame":"TR90 lightweight","Extras":"Hard case and cloth"}', 3, false),
  ('smart-glasses', 'polarised-audio-glasses-premium', 'Premium Polarised Audio Glasses', 'Generic', 'Heavier frame, better drivers and proper polarisation. The pair to wear driving in Owerri afternoon sun.', 5200000, null, 7, 'EMM-GLS-005', '{"Battery":"9 hours","Lenses":"UV400 polarised","Bluetooth":"5.3","Rating":"IPX5"}', 6, false),

  -- Button Phones ----------------------------------------------------------
  ('button-phones', 'itel-2163-button-phone', 'itel 2163', 'itel', 'The cheapest working phone in the shop. Wireless FM, torch, and a battery that goes a week between charges.', 1190000, null, 64, 'EMM-BTN-001', '{"Display":"1.8 inch","SIM":"Dual SIM dual standby","Battery":"1000mAh","Extras":"Wireless FM, torch"}', 12, true),
  ('button-phones', 'itel-2160-button-phone', 'itel 2160', 'itel', 'Adds a call recorder to the 2163. Popular with traders who need a record of what was agreed.', 1430000, null, 52, 'EMM-BTN-002', '{"Display":"1.8 inch QQVGA","SIM":"Dual SIM dual standby","Extras":"Call recorder, wireless FM, bright torch"}', 12, false),
  ('button-phones', 'itel-2165-button-phone', 'itel 2165', 'itel', 'Bigger 2.0" screen and 177 hours of standby. The comfortable middle of the itel button range.', 1650000, null, 43, 'EMM-BTN-003', '{"Display":"2.0 inch QVGA","Battery":"1000mAh, 9.5h talk / 177h standby","SIM":"Dual SIM dual standby","Extras":"Wireless FM, torch"}', 12, false),
  ('button-phones', 'nokia-105-dual-sim', 'Nokia 105 Dual SIM', 'Nokia', 'The phone that refuses to die. Drops onto concrete and keeps ringing, and the battery lasts weeks.', 2200000, null, 37, 'EMM-BTN-004', '{"Display":"1.8 inch","Battery":"1000mAh, up to 15h talk","SIM":"Dual SIM","Extras":"FM radio, torch, MP3 player"}', 12, true),
  ('button-phones', 'nokia-150-dual-sim', 'Nokia 150 Dual SIM', 'Nokia', 'A step up in build and camera, with a proper 2.4" screen. Still Nokia-tough.', 3400000, null, 19, 'EMM-BTN-005', '{"Display":"2.4 inch","Camera":"Rear VGA","SIM":"Dual SIM","Extras":"FM radio, torch, Bluetooth"}', 12, false),
  ('button-phones', 'tecno-t101-button-phone', 'Tecno T101', 'Tecno', 'Tecno''s entry basic phone. Loud speaker, long standby, and cheap enough to keep as a spare line.', 1199000, null, 58, 'EMM-BTN-006', '{"Display":"1.77 inch","SIM":"Dual SIM","Extras":"FM radio, torch, loud speaker"}', 12, false),
  ('button-phones', 'tecno-t315-button-phone', 'Tecno T315', 'Tecno', 'Bigger battery and a keypad that suits older hands. A common choice for parents and grandparents.', 2300000, null, 31, 'EMM-BTN-007', '{"Display":"2.4 inch","Battery":"2400mAh","SIM":"Dual SIM","Extras":"Large font mode, FM, torch, power-bank out"}', 12, false),

  -- Children's Tablets -----------------------------------------------------
  ('kids-tablets', 'itel-pad-8-kids-edition', 'itel Pad 8 — Kids Edition', 'itel', 'A real Android tablet with a child profile and a bumper case. Grows with the child instead of being outgrown in a year.', 9500000, 11000000, 13, 'EMM-KID-001', '{"Display":"10.1 inch HD","Storage":"4GB RAM + 128GB","Battery":"6000mAh","Extras":"Parental controls, shock-proof bumper case"}', 12, true),
  ('kids-tablets', 'kids-tablet-10-inch-64gb', '10" Kids Learning Tablet 64GB', 'Generic', 'Big screen for two children to share. Pre-loaded learning apps and a time limit parents actually control.', 9200000, null, 16, 'EMM-KID-002', '{"Display":"10.1 inch","Storage":"4GB RAM + 64GB","Battery":"5000mAh","Extras":"Parental time limits, silicone case, stand"}', 12, false),
  ('kids-tablets', 'kids-tablet-7-inch-32gb', '7" Kids Tablet 32GB', 'Generic', 'The starter tablet. Light enough for small hands and cheap enough that a drop is not a disaster.', 5800000, 6800000, 27, 'EMM-KID-003', '{"Display":"7 inch","Storage":"2GB RAM + 32GB","Battery":"3000mAh","Extras":"Bumper case, kid launcher"}', 12, true),
  ('kids-tablets', 'wintouch-k11-kids-tablet', 'Wintouch K11 Kids Tablet', 'Wintouch', 'The budget standard in Nigerian shops. Does the alphabet, the nursery rhymes and the cartoons, and little else.', 3800000, null, 34, 'EMM-KID-004', '{"Display":"7 inch","Storage":"1GB RAM + 16GB","Battery":"2800mAh","Extras":"Wi-Fi only, pre-loaded learning apps"}', 6, false),
  ('kids-tablets', 'kids-learning-tablet-with-headset', '7" Learning Tablet with Kids Headset', 'Generic', 'Bundled with volume-limited headphones, so the sound cannot go loud enough to damage young hearing.', 4500000, 5400000, 21, 'EMM-KID-005', '{"Display":"7 inch","Storage":"2GB RAM + 32GB","Bundle":"Volume-limited kids headset, case","Extras":"Parental controls"}', 12, false),

  -- Cameras ----------------------------------------------------------------
  ('cameras', '4k-action-camera-waterproof', '4K Action Camera with Waterproof Case', 'Generic', 'Helmet, bike or dashboard. Records 4K, survives water in the case, and the mounts are all in the box.', 6500000, 7800000, 18, 'EMM-CAM-001', '{"Video":"4K 30fps / 1080p 60fps","Rating":"Waterproof to 30m in case","Extras":"Wi-Fi, remote, full mount kit","Storage":"microSD up to 128GB"}', 12, true),
  ('cameras', 'vlogging-camera-1080p-flip-screen', '1080p Vlogging Camera with Flip Screen', 'Generic', 'Flip screen so you can see yourself, plus a hot shoe for a mic. The realistic first camera for a TikTok seller.', 8500000, null, 12, 'EMM-CAM-002', '{"Video":"1080p 30fps","Photo":"24MP interpolated","Extras":"Flip screen, hot shoe, remote","Battery":"2x rechargeable"}', 12, true),
  ('cameras', 'v380-wifi-security-camera-indoor', 'V380 Wi-Fi Security Camera', 'Generic', 'Watches the shop from your phone. Motion alerts, night vision and two-way audio so you can talk through it.', 2800000, 3400000, 29, 'EMM-CAM-003', '{"Video":"1080p","Extras":"Night vision, motion alerts, two-way audio, pan and tilt","Storage":"microSD or cloud"}', 12, false),
  ('cameras', 'solar-outdoor-cctv-camera-4g', 'Solar Outdoor CCTV Camera (4G)', 'Generic', 'Runs on sun and a SIM, so it works where there is neither power nor Wi-Fi. Built for gates and compounds.', 7200000, null, 10, 'EMM-CAM-004', '{"Video":"2K","Power":"Solar panel + battery","Connection":"4G SIM or Wi-Fi","Rating":"IP66 weatherproof"}', 12, false),
  ('cameras', 'usb-webcam-1080p-with-mic', '1080p USB Webcam with Mic', 'Generic', 'Plug-and-play for Zoom, classes and streaming. Better than any laptop camera at this price.', 2200000, null, 36, 'EMM-CAM-005', '{"Video":"1080p 30fps","Mic":"Built-in noise reducing","Mount":"Clip and tripod thread","Connection":"USB, no driver needed"}', 12, false),
  ('cameras', 'canon-eos-2000d-uk-used', 'Canon EOS 2000D — UK used', 'Canon', 'A real DSLR at the price of a phone camera. Shutter count checked and body tested before it goes on the shelf.', 38500000, null, 3, 'EMM-CAM-006', '{"Sensor":"24.1MP APS-C","Video":"1080p","Condition":"UK used, shutter count checked","Bundle":"18-55mm kit lens, battery, charger"}', 3, false),

  -- Microphones ------------------------------------------------------------
  ('microphones', 'boya-by-m1-lapel-microphone', 'BOYA BY-M1 Lapel Microphone', 'BOYA', 'The lapel mic that made phone interviews listenable. Six metres of cable and it works on phone and camera both.', 1800000, null, 42, 'EMM-MIC-001', '{"Type":"Omnidirectional lavalier","Cable":"6m","Compatibility":"Phone, camera, PC","Power":"LR44 battery or passive"}', 12, true),
  ('microphones', 'wireless-lavalier-microphone-2-pack', 'Wireless Lavalier Microphone (2-Pack)', 'Generic', 'Two transmitters and one receiver, so you can record an interview without a cable across the floor.', 3500000, 4200000, 24, 'EMM-MIC-002', '{"Range":"20m line of sight","Battery":"6 hours","Connectors":"USB-C, Lightning, 3.5mm","Extras":"Noise reduction, charging case"}', 12, true),
  ('microphones', 'bm-800-condenser-mic-kit', 'BM-800 Condenser Mic Studio Kit', 'Generic', 'Arm, shock mount, pop filter and phantom power in one box. The standard bedroom-studio starting point.', 4200000, 5000000, 17, 'EMM-MIC-003', '{"Type":"Condenser, cardioid","Bundle":"Boom arm, shock mount, pop filter, phantom power supply","Connection":"XLR to 3.5mm"}', 6, false),
  ('microphones', 'dynamic-vocal-microphone-wired', 'Wired Dynamic Vocal Microphone', 'Generic', 'Built like the SM58 it copies. Takes abuse on stage, in church, and at events where mics get dropped.', 2500000, null, 31, 'EMM-MIC-004', '{"Type":"Dynamic, cardioid","Connection":"XLR with 5m cable","Body":"Metal, die-cast","Extras":"On/off switch"}', 12, false),
  ('microphones', 'shotgun-microphone-camera-mount', 'Shotgun Microphone (Camera Mount)', 'Generic', 'Points where the camera points and ignores the rest of the room. Shock-mounted so handling noise stays out.', 5500000, null, 13, 'EMM-MIC-005', '{"Type":"Super-cardioid shotgun","Power":"Battery-free, plug-in power","Mount":"Cold shoe with shock mount","Extras":"Furry windshield included"}', 12, false),
  ('microphones', 'wireless-karaoke-microphone-handheld', 'Wireless Karaoke Microphone', 'Generic', 'Speaker and mic in one handle. Bluetooth from a phone, plug it into nothing, and the party starts.', 1500000, 1900000, 38, 'EMM-MIC-006', '{"Battery":"5 hours","Connection":"Bluetooth 5.0, TF card","Extras":"Built-in speaker, echo control, LED lights"}', 6, false),

  -- Tripods ----------------------------------------------------------------
  ('tripods', 'ring-light-12-inch-with-tripod', '12" Ring Light with Tripod', 'Generic', 'The size that suits a market stall or a bedroom setup. Three colour temperatures and a phone clamp that holds a big phone.', 2000000, 2500000, 33, 'EMM-TRI-001', '{"Diameter":"12 inch","Tripod":"Extends to 2.1m","Colour":"3 temperatures, 10 brightness levels","Mount":"Phone clamp + ball head"}', 6, true),
  ('tripods', 'ring-light-10-inch-with-tripod', '10" Ring Light with Tripod', 'Generic', 'The cheapest ring light worth buying. Small, light, and bright enough for a desk or a face-to-camera video.', 1000000, null, 47, 'EMM-TRI-002', '{"Diameter":"10 inch","Tripod":"Extends to 1.6m","Power":"USB","Mount":"Phone clamp"}', 6, true),
  ('tripods', 'ring-light-18-inch-studio-kit', '18" Ring Light Studio Kit', 'Generic', 'Studio size, with a stand that takes the weight and a bag to move it. What a serious content seller ends up buying.', 6800000, null, 8, 'EMM-TRI-003', '{"Diameter":"18 inch","Stand":"Heavy-duty, 2m","Extras":"Carry bag, phone and camera mounts, remote","Power":"AC"}', 12, false),
  ('tripods', 'rgb-ring-light-22-inch', '22" RGB Ring Light', 'Generic', 'Full colour, not just warm-to-cool. For creators who want a lit background as well as a lit face.', 4200000, null, 7, 'EMM-TRI-004', '{"Diameter":"22 inch","Colour":"Full RGB + bi-colour white","Stand":"2.1m","Extras":"Remote, phone and camera mounts"}', 12, false),
  ('tripods', 'camera-tripod-2-1m-aluminium', '2.1m Aluminium Camera Tripod', 'Generic', 'A tripod on its own, no light. Fluid pan head, quick-release plate and a bubble level that is actually accurate.', 1800000, null, 26, 'EMM-TRI-005', '{"Height":"0.6m to 2.1m","Head":"Fluid pan and tilt","Load":"5kg","Extras":"Quick release plate, carry bag"}', 12, false),
  ('tripods', 'bluetooth-selfie-stick-tripod', 'Bluetooth Selfie Stick Tripod', 'Generic', 'Folds to pocket size, opens into a tripod, and the remote pops out of the handle. The one that lives in the bag.', 850000, 1200000, 55, 'EMM-TRI-006', '{"Extended":"1.1m","Folded":"20cm","Remote":"Detachable Bluetooth","Mount":"Phone clamp, rotates 360"}', 6, false),

  -- Car Stereos ------------------------------------------------------------
  ('car-stereos', 'hikity-double-din-android-13-10-1', 'Hikity 10.1" Double Din Android 13 (2+64GB)', 'Hikity', 'A full Android screen in the dash, with wireless CarPlay and Android Auto. Turns an old car into a modern one.', 14500000, 17000000, 9, 'EMM-CAR-001', '{"Screen":"10.1 inch touchscreen","System":"Android 13, 2GB RAM + 64GB","Connectivity":"Wireless Apple CarPlay + Android Auto, Bluetooth, Wi-Fi","Extras":"GPS, FM, reversing camera input"}', 12, true),
  ('car-stereos', 'android-car-stereo-9-inch-carplay', '9" Android Car Stereo with CarPlay', 'Generic', 'Same idea in a size that fits more dashboards. Comes with the wiring harness and mounting frame.', 12000000, null, 11, 'EMM-CAR-002', '{"Screen":"9 inch","System":"Android, 2GB + 32GB","Connectivity":"CarPlay, Android Auto, Bluetooth","Bundle":"Harness and mounting frame"}', 12, false),
  ('car-stereos', 'double-din-7-inch-touchscreen-stereo', '7" Double Din Touchscreen Stereo', 'Generic', 'Bluetooth calling, USB and a reversing camera input, without paying for Android. The sensible upgrade.', 7500000, 8900000, 15, 'EMM-CAR-003', '{"Screen":"7 inch touchscreen","Connectivity":"Bluetooth, USB, AUX, FM","Extras":"Reversing camera input, mirror link"}', 12, false),
  ('car-stereos', 'single-din-bluetooth-car-stereo', 'Single Din Bluetooth Car Stereo', 'Generic', 'Fits the slot almost every older car already has. Bluetooth calling, USB and a detachable face against theft.', 2800000, null, 28, 'EMM-CAR-004', '{"Fit":"Standard single DIN","Connectivity":"Bluetooth, USB, TF, AUX, FM","Output":"4x 60W","Extras":"Detachable face plate"}', 12, false),
  ('car-stereos', 'car-speakers-6-5-inch-pair', '6.5" Car Speakers (Pair)', 'Generic', 'Coaxial pair to replace the blown paper cones in the doors. The cheapest real improvement to car sound.', 3500000, null, 22, 'EMM-CAR-005', '{"Size":"6.5 inch coaxial","Power":"280W peak per pair","Impedance":"4 ohm","Bundle":"Grilles and fixings"}', 6, false),
  ('car-stereos', 'reversing-camera-kit-waterproof', 'Waterproof Reversing Camera Kit', 'Generic', 'Night-capable, waterproof, with the guide lines on screen. Pairs with any head unit that has a camera input.', 1800000, 2400000, 34, 'EMM-CAR-006', '{"Video":"170 degree wide angle","Rating":"IP68 waterproof","Extras":"Night vision, parking guide lines","Bundle":"6m cable"}', 12, false),

  -- Clippers ---------------------------------------------------------------
  ('clippers', 'wahl-magic-clip-cordless', 'Wahl Magic Clip Cordless', 'Wahl', 'The fade clipper barbers actually ask for. Stagger-tooth blade, and the lever gives you the blend without changing guards.', 15500000, null, 7, 'EMM-CLP-001', '{"Motor":"Rotary","Runtime":"90 minutes cordless","Blade":"Crunch stagger-tooth, zero-gap capable","Bundle":"8 guards, oil, brush"}', 12, true),
  ('clippers', 'wahl-senior-cordless-clipper', 'Wahl Senior Cordless', 'Wahl', 'Heavier, louder, and it does not bog down in thick hair. The one for a shop cutting all day.', 9800000, null, 6, 'EMM-CLP-002', '{"Motor":"V9000 rotary","Runtime":"70 minutes cordless","Blade":"Precision fade blade","Bundle":"Guards, oil, charging stand"}', 12, false),
  ('clippers', 'andis-master-clipper', 'Andis Master', 'Andis', 'All-metal body and a magnetic motor. Runs hot and cuts through anything; the professional alternative to the Wahl.', 8500000, null, 5, 'EMM-CLP-003', '{"Motor":"Magnetic","Body":"Aluminium alloy","Blade":"Carbon steel, adjustable","Power":"Corded"}', 12, false),
  ('clippers', 'chaoba-808-professional-clipper', 'Chaoba 808 Professional Clipper', 'Chaoba', 'The workhorse in most Nigerian barbershops. Cheap to run, easy to get blades for, and it just keeps going.', 1500000, 1900000, 26, 'EMM-CLP-004', '{"Motor":"Magnetic","Power":"Corded","Blade":"Stainless steel, adjustable","Bundle":"4 guards, oil, brush"}', 6, true),
  ('clippers', 'kemei-km-1990-cordless-clipper', 'Kemei KM-1990 Cordless Clipper', 'Kemei', 'Cordless at a price that makes a spare affordable. Good for home cuts and touch-ups between shop visits.', 1250000, null, 38, 'EMM-CLP-005', '{"Runtime":"120 minutes","Charging":"USB","Blade":"Titanium coated","Bundle":"4 guards, oil, brush"}', 6, false),
  ('clippers', 'kemei-km-809a-beard-trimmer', 'Kemei KM-809A Beard Trimmer', 'Kemei', 'Fine teeth for edges and beard lines rather than bulk. Pairs with a clipper; not a replacement for one.', 950000, null, 45, 'EMM-CLP-006', '{"Runtime":"90 minutes","Charging":"USB","Blade":"T-blade for edging","Extras":"Washable head"}', 6, false),
  ('clippers', 'kiki-ng-2018-hair-clipper', 'Kiki NG-2018 Hair Clipper', 'Kiki', 'Long-running favourite in the local market. Corded, simple, and near-impossible to kill.', 1400000, null, 29, 'EMM-CLP-007', '{"Motor":"Magnetic","Power":"Corded","Blade":"Adjustable steel","Bundle":"Guards, oil, brush"}', 6, false),

  -- Fans -------------------------------------------------------------------
  ('fans', 'ox-18-inch-rechargeable-standing-fan', 'Ox 18" Rechargeable Standing Fan', 'Ox', 'Runs hours after the light goes, with an LED lamp in the hub and a remote. The fan people buy when power is unreliable.', 3200000, 3800000, 19, 'EMM-FAN-001', '{"Size":"18 inch","Runtime":"6-8 hours","Extras":"LED light, remote control, solar input","Speeds":"3"}', 12, true),
  ('fans', 'qasa-18-inch-rechargeable-fan-solar', 'Qasa 18" Rechargeable Fan with 20W Solar Panel', 'Qasa', 'Comes with its own solar panel, so it charges through a long outage instead of dying with the battery.', 3850000, 4400000, 14, 'EMM-FAN-002', '{"Size":"18 inch","Runtime":"7-9 hours","Bundle":"20W solar panel","Extras":"LED light, remote","Speeds":"3"}', 12, true),
  ('fans', 'century-18-inch-ac-dc-rechargeable-fan', 'Century 18" AC/DC Rechargeable Fan (FRC-45)', 'Century', 'The heavy one. Metal blades, proper motor, and it moves air a plastic fan cannot. Priced accordingly.', 10000000, null, 6, 'EMM-FAN-003', '{"Size":"18 inch","Power":"AC and DC","Blades":"Metal","Extras":"Remote, LED light, solar input","Speeds":"3"}', 24, false),
  ('fans', 'ox-16-inch-rechargeable-table-fan', 'Ox 16" Rechargeable Table Fan', 'Ox', 'Desk-sized and light enough to carry room to room. Charges from mains or a solar panel.', 2200000, null, 25, 'EMM-FAN-004', '{"Size":"16 inch","Runtime":"5-7 hours","Charging":"AC + solar","Speeds":"3"}', 12, false),
  ('fans', 'rechargeable-fan-12-inch-led', '12" Rechargeable Fan with LED Light', 'Generic', 'Small, cheap and it doubles as an emergency lamp. The one that ends up in a child''s room or a shop.', 1850000, 2300000, 41, 'EMM-FAN-005', '{"Size":"12 inch","Runtime":"5-7 hours","Extras":"LED light panel, USB charge-out","Speeds":"2"}', 6, false),
  ('fans', 'usb-mini-desk-fan-clip-on', 'USB Mini Clip-On Desk Fan', 'Generic', 'Clips to a desk, cot or headboard. Quiet enough to sleep next to, which most mini fans are not.', 450000, null, 72, 'EMM-FAN-006', '{"Power":"USB 5V","Battery":"4000mAh","Runtime":"4-12 hours","Extras":"360 degree rotation, clip base"}', 6, false),

  -- Home Appliances --------------------------------------------------------
  ('home-appliances', 'silver-crest-4l-commercial-blender', 'Silver Crest 4L Commercial Blender', 'Silver Crest', 'The big jug that handles tomatoes, pepper and beans in one go. Built for cooking that feeds a household, not a smoothie.', 3350000, 4000000, 21, 'EMM-HOM-001', '{"Capacity":"4L jar","Power":"2200W","Speeds":"Variable + pulse","Jar":"Unbreakable"}', 12, true),
  ('home-appliances', 'binatone-blender-with-grinder-1-5l', 'Binatone 1.5L Blender with Grinder', 'Binatone', 'Blender jar plus a dry mill for pepper and egusi. The two-jar set that ends up doing all the work in a Nigerian kitchen.', 4500000, 5200000, 17, 'EMM-HOM-002', '{"Capacity":"1.5L jar + mill","Power":"400W","Speeds":"2 + pulse","Jar":"Unbreakable"}', 24, true),
  ('home-appliances', 'binatone-electric-kettle-1-7l', 'Binatone 1.7L Cordless Electric Kettle', 'Binatone', 'Boils fast and switches itself off. Cool-touch body, so a child brushing past it is not an emergency.', 1800000, null, 32, 'EMM-HOM-003', '{"Capacity":"1.7L","Power":"2200W","Body":"Cool touch","Safety":"Auto shut-off, boil-dry protection"}', 24, false),
  ('home-appliances', 'silver-crest-2l-electric-kettle', 'Silver Crest 2L Electric Kettle', 'Silver Crest', 'Bigger capacity, lower price, stainless body. The practical choice for a compound or a shop.', 1200000, null, 39, 'EMM-HOM-004', '{"Capacity":"2L","Power":"1800W","Body":"Stainless steel","Safety":"Auto shut-off"}', 12, false),
  ('home-appliances', 'binatone-dry-iron-non-stick', 'Binatone Non-Stick Dry Iron', 'Binatone', 'Heavy enough to press without leaning on it, with a soleplate that glides and a thermostat that holds temperature.', 1650000, 2000000, 28, 'EMM-HOM-005', '{"Power":"1200W","Soleplate":"Non-stick coated","Control":"Adjustable thermostat"}', 24, false),
  ('home-appliances', 'sandwich-toaster-2-slice', '2-Slice Sandwich Toaster', 'Generic', 'Sealed-edge toastie plates and an indicator light that tells you when it is actually ready.', 2200000, 2700000, 24, 'EMM-HOM-006', '{"Power":"750W","Plates":"Non-stick, sealed edge","Extras":"Cord storage, indicator lights"}', 12, false),
  ('home-appliances', 'rechargeable-led-emergency-lamp', 'Rechargeable LED Emergency Lamp', 'Generic', 'Comes on by itself when the power cuts. Twelve hours on low, and it charges a phone in a pinch.', 1450000, 1900000, 48, 'EMM-HOM-007', '{"Runtime":"6-12 hours","Extras":"Auto-on at outage, USB charge-out, solar input","Brightness":"3 levels"}', 6, false),

  -- 13-in-1 Kits -----------------------------------------------------------
  ('multi-tool-kits', '13-in-1-universal-charging-cable-kit', '13-in-1 Universal Charging Cable Kit', 'Generic', 'One braided cable that ends in thirteen tips — USB-C, Lightning, micro-USB, laptop barrels and more. Lives in a zip case.', 1850000, 2600000, 44, 'EMM-KIT-001', '{"Tips":"13 interchangeable","Cable":"1.2m braided","Covers":"USB-C, Lightning, micro-USB, laptop barrels","Extras":"Zip case"}', 6, true),
  ('multi-tool-kits', '13-in-1-phone-repair-tool-kit', '13-in-1 Phone Repair Tool Kit', 'Generic', 'Precision drivers, spudgers, suction cup and opening picks. Everything for a screen or battery swap, nothing you will not use.', 1250000, 1800000, 37, 'EMM-KIT-002', '{"Pieces":"13","Includes":"Precision screwdrivers, spudgers, picks, suction cup, tweezers","Extras":"Roll-up pouch"}', 3, false),
  ('multi-tool-kits', '13-in-1-travel-adapter-power-station', '13-in-1 Travel Adapter & Power Station', 'Generic', 'Worldwide plug adapter with four USB ports and two sockets. One block replaces the tangle you normally pack.', 2450000, 3200000, 26, 'EMM-KIT-003', '{"Sockets":"2 universal AC","USB":"3x USB-A, 1x USB-C PD","Regions":"UK, EU, US, AU","Fuse":"Replaceable"}', 12, false),
  ('multi-tool-kits', '13-in-1-grooming-kit-cordless', '13-in-1 Cordless Grooming Kit', 'Generic', 'Clipper, beard trimmer, nose trimmer, shaver and body groomer heads on one rechargeable handle.', 2850000, 3600000, 23, 'EMM-KIT-004', '{"Attachments":"13","Runtime":"90 minutes","Charging":"USB-C","Rating":"Washable heads"}', 6, true),
  ('multi-tool-kits', '13-in-1-car-emergency-kit', '13-in-1 Car Emergency Kit', 'Generic', 'Jump leads, tyre inflator, torch, warning triangle and tools in one boot-sized case. For the day the car decides.', 2800000, null, 15, 'EMM-KIT-005', '{"Pieces":"13","Includes":"Jump leads, 12V tyre inflator, LED torch, warning triangle, gloves, basic tools","Case":"Hard shell"}', 6, false)
) as v(category_slug, slug, name, brand, description, price_kobo, compare_at_price_kobo, stock, sku, specs, warranty_months, is_featured)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;
