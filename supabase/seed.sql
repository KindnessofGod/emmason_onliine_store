-- Sample catalogue for Emmason Online Store.
-- Prices are in kobo: 4500000 = ₦45,000.
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
-- ---------------------------------------------------------------------------
insert into public.delivery_zones (state, fee_kobo, eta_days) values
  ('Lagos',        150000, '1-2 working days'),
  ('Ogun',         200000, '2-3 working days'),
  ('Oyo',          250000, '2-3 working days'),
  ('Osun',         250000, '2-4 working days'),
  ('Ondo',         250000, '2-4 working days'),
  ('Ekiti',        250000, '2-4 working days'),
  ('Kwara',        280000, '3-4 working days'),
  ('FCT - Abuja',  250000, '2-3 working days'),
  ('Rivers',       300000, '3-5 working days'),
  ('Delta',        300000, '3-5 working days'),
  ('Edo',          280000, '2-4 working days'),
  ('Anambra',      300000, '3-5 working days'),
  ('Enugu',        300000, '3-5 working days'),
  ('Imo',          300000, '3-5 working days'),
  ('Abia',         300000, '3-5 working days'),
  ('Ebonyi',       320000, '3-5 working days'),
  ('Akwa Ibom',    320000, '3-5 working days'),
  ('Cross River',  320000, '3-5 working days'),
  ('Bayelsa',      350000, '4-6 working days'),
  ('Kaduna',       320000, '3-5 working days'),
  ('Kano',         350000, '3-5 working days'),
  ('Katsina',      350000, '4-6 working days'),
  ('Kebbi',        380000, '4-6 working days'),
  ('Sokoto',       380000, '4-6 working days'),
  ('Zamfara',      380000, '4-6 working days'),
  ('Jigawa',       380000, '4-6 working days'),
  ('Bauchi',       380000, '4-6 working days'),
  ('Gombe',        380000, '4-6 working days'),
  ('Yobe',         400000, '5-7 working days'),
  ('Borno',        400000, '5-7 working days'),
  ('Adamawa',      400000, '5-7 working days'),
  ('Taraba',       400000, '5-7 working days'),
  ('Plateau',      350000, '4-6 working days'),
  ('Nasarawa',     320000, '3-5 working days'),
  ('Niger',        320000, '3-5 working days'),
  ('Kogi',         300000, '3-5 working days'),
  ('Benue',        330000, '4-6 working days')
on conflict (state) do nothing;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
insert into public.products
  (category_id, slug, name, brand, description, price_kobo, compare_at_price_kobo, stock, sku, specs, warranty_months, is_featured)
select c.id, v.slug, v.name, v.brand, v.description, v.price_kobo, v.compare_at_price_kobo, v.stock, v.sku, v.specs::jsonb, v.warranty_months, v.is_featured
from (values
  -- Chargers & Power Banks -------------------------------------------------
  ('chargers-power-banks', 'oraimo-toast-20-20000mah-power-bank', 'Oraimo Toast 20 20,000mAh Power Bank', 'Oraimo', 'Charges a phone four times over on one fill. Dual USB-A output plus USB-C in/out, with an LED charge gauge so you always know where you stand.', 3850000, 4500000, 42, 'EMM-PWR-001', '{"Capacity":"20,000mAh","Output":"18W PD + QC 3.0","Ports":"2x USB-A, 1x USB-C","Weight":"420g"}', 12, true),
  ('chargers-power-banks', 'anker-powercore-10000-slim', 'Anker PowerCore 10,000mAh Slim', 'Anker', 'Pocket-sized and genuinely light. The one to carry when you do not want to feel a power bank in your pocket all day.', 2950000, null, 30, 'EMM-PWR-002', '{"Capacity":"10,000mAh","Output":"12W","Ports":"1x USB-A, 1x USB-C","Weight":"195g"}', 12, false),
  ('chargers-power-banks', 'oraimo-65w-gan-fast-charger', 'Oraimo 65W GaN Fast Charger', 'Oraimo', 'One brick for phone, tablet and laptop. GaN internals keep it cool and about half the size of the charger it replaces.', 2250000, 2800000, 55, 'EMM-PWR-003', '{"Output":"65W","Ports":"2x USB-C, 1x USB-A","Standards":"PD 3.0, PPS"}', 12, true),
  ('chargers-power-banks', 'solar-30000mah-rugged-power-bank', '30,000mAh Rugged Solar Power Bank', 'Generic', 'Built for long outages and travel. Solar top-up is a trickle, not a miracle, but the twin torches and huge cell earn their keep.', 4200000, null, 18, 'EMM-PWR-004', '{"Capacity":"30,000mAh","Extras":"Dual LED torch, solar panel","Rating":"IPX4 splash resistant"}', 6, false),
  ('chargers-power-banks', 'braided-usb-c-cable-2m', '2m Braided USB-C Fast Charge Cable', 'Oraimo', 'Nylon braided and stress-tested at the connector, where cheap cables always fail first.', 450000, 700000, 120, 'EMM-PWR-005', '{"Length":"2m","Current":"6A","Jacket":"Braided nylon"}', 6, false),

  -- Bluetooth Speakers -----------------------------------------------------
  ('bluetooth-speakers', 'jbl-flip-6-portable-speaker', 'JBL Flip 6 Portable Speaker', 'JBL', 'The reliable all-rounder. Loud enough for a small room, waterproof enough for the pool, and twelve hours of battery.', 8500000, 9800000, 24, 'EMM-SPK-001', '{"Battery":"12 hours","Rating":"IP67 waterproof","Bluetooth":"5.1","Power":"30W"}', 12, true),
  ('bluetooth-speakers', 'oraimo-soundgo-party-speaker', 'Oraimo SoundGo Party Speaker', 'Oraimo', 'Trolley speaker with wireless mic and RGB lights. Made for outdoor events where mains power is optional.', 15500000, 18000000, 9, 'EMM-SPK-002', '{"Battery":"8 hours","Power":"120W","Extras":"Wireless mic, FM radio, RGB lights","Inputs":"Bluetooth, USB, AUX, SD"}', 12, true),
  ('bluetooth-speakers', 'anker-soundcore-2-speaker', 'Anker Soundcore 2', 'Anker', 'Punches far above its price. Twenty-four hours of playback and bass that does not distort at volume.', 4200000, null, 33, 'EMM-SPK-003', '{"Battery":"24 hours","Power":"12W","Rating":"IPX7","Bluetooth":"5.0"}', 12, false),
  ('bluetooth-speakers', 'mini-bluetooth-speaker-with-fm', 'Mini Bluetooth Speaker with FM Radio', 'Generic', 'The one that lives in the kitchen. Takes an SD card, runs FM without a phone, and costs less than a tank of fuel.', 950000, 1400000, 67, 'EMM-SPK-004', '{"Battery":"6 hours","Power":"5W","Inputs":"Bluetooth, FM, SD card, USB"}', 3, false),

  -- Earbuds ----------------------------------------------------------------
  ('earbuds', 'oraimo-freepods-4-anc-earbuds', 'Oraimo FreePods 4 ANC Earbuds', 'Oraimo', 'Active noise cancelling at a price that does not sting. Four microphones keep your voice clear on calls in traffic.', 3250000, 4200000, 48, 'EMM-EAR-001', '{"Battery":"9h + 27h case","Features":"ANC, ENC, low latency mode","Bluetooth":"5.3","Rating":"IPX5"}', 12, true),
  ('earbuds', 'samsung-galaxy-buds-fe', 'Samsung Galaxy Buds FE', 'Samsung', 'Samsung fit and finish without flagship pricing. Best paired with a Galaxy phone, but works with anything.', 8900000, null, 15, 'EMM-EAR-002', '{"Battery":"6h + 21h case","Features":"ANC, ambient sound","Bluetooth":"5.2"}', 12, false),
  ('earbuds', 'airpods-pro-2-compatible-buds', 'Pro-Style TWS Earbuds', 'Generic', 'Honest budget buds with pop-up pairing and touch controls. Sound is good, build is plastic — priced accordingly.', 1450000, 2000000, 85, 'EMM-EAR-003', '{"Battery":"5h + 20h case","Features":"Touch control, pop-up pairing","Bluetooth":"5.3"}', 3, false),
  ('earbuds', 'oraimo-riff-2-earbuds', 'Oraimo Riff 2 Earbuds', 'Oraimo', 'Small, light and comfortable for long stretches. The default recommendation for anyone buying their first pair.', 1850000, 2400000, 62, 'EMM-EAR-004', '{"Battery":"6h + 18h case","Bluetooth":"5.3","Rating":"IPX4"}', 12, false),

  -- Headsets ---------------------------------------------------------------
  ('headsets', 'sony-wh-ch520-wireless-headphones', 'Sony WH-CH520 Wireless Headphones', 'Sony', 'Fifty hours of battery and Sony tuning. No noise cancelling, which is exactly why the battery lasts.', 7500000, 8500000, 21, 'EMM-HDS-001', '{"Battery":"50 hours","Type":"On-ear","Bluetooth":"5.2","Extras":"Multipoint pairing"}', 12, true),
  ('headsets', 'oraimo-bosom-2-anc-headphones', 'Oraimo BoomPop 2 ANC Headphones', 'Oraimo', 'Over-ear noise cancelling for the price of decent earbuds. Folds flat for travel.', 4500000, 5800000, 27, 'EMM-HDS-002', '{"Battery":"40 hours","Type":"Over-ear","Features":"ANC, foldable"}', 12, false),
  ('headsets', 'gaming-headset-with-mic-rgb', 'RGB Gaming Headset with Boom Mic', 'Generic', 'Wired, because latency matters more than tidiness when you are gaming. Detachable noise-cancelling boom mic.', 2200000, 3000000, 40, 'EMM-HDS-003', '{"Connection":"3.5mm + USB (lighting)","Driver":"50mm","Mic":"Detachable boom"}', 6, false),
  ('headsets', 'call-center-mono-headset', 'Mono Call Centre Headset', 'Generic', 'Single-ear headset for long shifts on the phone. Padded band, in-line mute, and a mic that stays where you bend it.', 1350000, null, 35, 'EMM-HDS-004', '{"Connection":"USB-A","Type":"Mono on-ear","Mic":"Noise cancelling"}', 6, false),

  -- Smart Watches ----------------------------------------------------------
  ('smart-watches', 'oraimo-watch-4-plus', 'Oraimo Watch 4 Plus', 'Oraimo', 'Big bright screen, Bluetooth calling and a fortnight between charges. The value pick in this category.', 3950000, 5200000, 38, 'EMM-WCH-001', '{"Display":"1.96\" AMOLED","Battery":"14 days","Features":"Bluetooth calling, SpO2, heart rate","Rating":"IP68"}', 12, true),
  ('smart-watches', 'samsung-galaxy-watch-6-44mm', 'Samsung Galaxy Watch 6 44mm', 'Samsung', 'A real smartwatch with Wear OS, proper app support and sleep tracking that is actually accurate.', 24500000, 27000000, 6, 'EMM-WCH-002', '{"Display":"1.5\" AMOLED","Battery":"40 hours","OS":"Wear OS 4","Rating":"5ATM + IP68"}', 12, true),
  ('smart-watches', 'kids-gps-smart-watch', 'Kids GPS Smart Watch with SIM', 'Generic', 'Takes a SIM so you can call your child directly, with GPS location and an SOS button. Peace of mind for school runs.', 2850000, 3500000, 22, 'EMM-WCH-003', '{"SIM":"2G/4G nano-SIM","Features":"GPS, SOS call, geo-fence","Battery":"2 days"}', 6, false),
  ('smart-watches', 'sports-fitness-band-slim', 'Slim Fitness Tracker Band', 'Generic', 'For step counting and sleep, nothing more. Light enough that you forget you are wearing it overnight.', 1250000, null, 54, 'EMM-WCH-004', '{"Display":"0.96\" colour","Battery":"7 days","Features":"Steps, sleep, heart rate"}', 6, false),

  -- Smart Glasses ----------------------------------------------------------
  ('smart-glasses', 'audio-bluetooth-sunglasses', 'Bluetooth Audio Sunglasses', 'Generic', 'Open-ear speakers in the arms, so you hear music and traffic at the same time. Polarised lenses swap out for clear ones.', 4500000, 6000000, 16, 'EMM-GLS-001', '{"Battery":"6 hours","Audio":"Open-ear directional","Lenses":"Polarised, interchangeable"}', 6, true),
  ('smart-glasses', 'camera-smart-glasses-1080p', '1080p Camera Smart Glasses', 'Generic', 'Records point-of-view video hands-free. Useful for creators; check local rules before filming people.', 8500000, null, 8, 'EMM-GLS-002', '{"Camera":"1080p 30fps","Storage":"32GB built in","Battery":"90 min recording"}', 6, false),
  ('smart-glasses', 'blue-light-blocking-smart-glasses', 'Blue Light Smart Glasses with Calls', 'Generic', 'Blue-light lenses for screen work, plus a microphone for calls without a headset.', 3200000, 4000000, 25, 'EMM-GLS-003', '{"Battery":"5 hours","Lenses":"Anti blue light","Features":"Call answering, voice assistant"}', 6, false),

  -- Button Phones ----------------------------------------------------------
  ('button-phones', 'nokia-105-dual-sim', 'Nokia 105 Dual SIM', 'Nokia', 'The phone that refuses to die. Weeks of standby, a torch that works, and a keypad you can dial without looking.', 1850000, 2200000, 74, 'EMM-BTN-001', '{"Standby":"Up to 3 weeks","SIM":"Dual SIM","Extras":"FM radio, torch","Battery":"1000mAh"}', 12, true),
  ('button-phones', 'nokia-110-4g-with-camera', 'Nokia 110 4G', 'Nokia', 'Button phone with 4G, so it still works as networks retire 2G and 3G. Doubles as a hotspot.', 3200000, 3800000, 31, 'EMM-BTN-002', '{"Network":"4G LTE","SIM":"Dual SIM","Extras":"Camera, hotspot, MP3 player"}', 12, false),
  ('button-phones', 'itel-power-king-big-battery-phone', 'Itel Power King Big Battery Phone', 'Itel', 'A 2,400mAh cell in a feature phone means a month of standby and enough left over to charge someone else''s phone.', 1650000, null, 46, 'EMM-BTN-003', '{"Battery":"2400mAh","Standby":"Up to 30 days","Extras":"Torch, FM, OTG charge-out"}', 6, false),
  ('button-phones', 'senior-friendly-big-button-phone', 'Big Button Senior Phone', 'Generic', 'Oversized keys, very loud earpiece and an SOS button on the back. Bought for parents, appreciated daily.', 2100000, 2600000, 19, 'EMM-BTN-004', '{"Keys":"Extra large","Audio":"Amplified earpiece","Extras":"SOS button, charging cradle"}', 6, false),

  -- Children's Tablets -----------------------------------------------------
  ('kids-tablets', 'kids-learning-tablet-7-inch-32gb', '7" Kids Learning Tablet 32GB', 'Generic', 'Preloaded with learning apps, wrapped in a bumper case, and locked down with parental controls that a child cannot argue with.', 6500000, 8000000, 26, 'EMM-KTB-001', '{"Screen":"7\" IPS","Storage":"32GB + microSD","RAM":"2GB","Extras":"Bumper case, parental controls","Battery":"3000mAh"}', 12, true),
  ('kids-tablets', 'kids-tablet-10-inch-64gb-sim', '10" Kids Tablet 64GB with SIM', 'Generic', 'Bigger screen for schoolwork and a SIM slot so it works away from wifi. Comes with a stand cover and stylus.', 11500000, 13500000, 12, 'EMM-KTB-002', '{"Screen":"10.1\" IPS","Storage":"64GB + microSD","RAM":"4GB","Network":"4G LTE","Extras":"Stylus, stand cover"}', 12, false),
  ('kids-tablets', 'toddler-abc-learning-pad', 'Toddler ABC Learning Pad', 'Generic', 'Not a real tablet — a rugged toy that teaches letters, numbers and sounds. For ages two to five, and it survives being thrown.', 1850000, 2400000, 44, 'EMM-KTB-003', '{"Ages":"2-5 years","Power":"3x AA batteries","Content":"Letters, numbers, songs, spelling"}', 3, false),

  -- Cameras ----------------------------------------------------------------
  ('cameras', 'vlogging-camera-4k-with-flip-screen', '4K Vlogging Camera with Flip Screen', 'Generic', 'Flip-out screen so you can frame yourself, plus a 3.5mm mic input — the feature most cheap vlogging cameras leave out.', 14500000, 17500000, 11, 'EMM-CAM-001', '{"Video":"4K 30fps","Screen":"3\" flip-out","Inputs":"3.5mm external mic","Extras":"Wifi transfer, 16x digital zoom"}', 12, true),
  ('cameras', 'action-camera-4k-waterproof', '4K Waterproof Action Camera', 'Generic', 'Waterproof case, helmet and bike mounts in the box. Stabilisation is decent in daylight, noisy at night.', 8900000, 11000000, 17, 'EMM-CAM-002', '{"Video":"4K 30fps","Rating":"Waterproof to 30m (case)","Extras":"Remote, mount kit, 2 batteries"}', 6, false),
  ('cameras', 'wifi-security-camera-indoor-ptz', 'Indoor Wifi Security Camera (PTZ)', 'Generic', 'Pans, tilts and tracks motion. Records to an SD card so you are not forced into a cloud subscription.', 3500000, 4500000, 34, 'EMM-CAM-003', '{"Resolution":"3MP","Features":"Pan/tilt, motion tracking, night vision","Storage":"microSD up to 128GB","Audio":"Two-way"}', 12, true),
  ('cameras', 'outdoor-solar-security-camera-4g', 'Outdoor Solar 4G Security Camera', 'Generic', 'Runs on a SIM and a solar panel, so it works where there is neither wifi nor reliable mains power.', 12500000, null, 7, 'EMM-CAM-004', '{"Resolution":"3MP","Power":"Solar panel + battery","Network":"4G SIM","Rating":"IP66"}', 12, false),

  -- Microphones ------------------------------------------------------------
  ('microphones', 'wireless-lapel-microphone-2-pack', 'Wireless Lapel Microphone (2 Pack)', 'Generic', 'Two transmitters and one receiver, so you can record an interview with both sides mic''d. Plugs straight into a phone.', 3200000, 4200000, 39, 'EMM-MIC-001', '{"Range":"20m line of sight","Battery":"6 hours","Connectors":"USB-C, Lightning, 3.5mm","Extras":"Charging case, windscreens"}', 6, true),
  ('microphones', 'usb-condenser-studio-microphone', 'USB Condenser Studio Microphone', 'Generic', 'For voiceovers and podcasts recorded at a desk. Shock mount and pop filter included, which you will need.', 4500000, 5500000, 23, 'EMM-MIC-002', '{"Pattern":"Cardioid","Connection":"USB","Extras":"Shock mount, pop filter, boom arm","Sample rate":"48kHz/16-bit"}', 12, true),
  ('microphones', 'wired-lavalier-microphone-3m', '3m Wired Lavalier Microphone', 'Generic', 'No batteries, no pairing, nothing to go wrong. The dependable backup every creator should own.', 750000, 1100000, 58, 'EMM-MIC-003', '{"Cable":"3m","Connection":"3.5mm TRRS","Extras":"Windscreen, TRS adapter"}', 3, false),
  ('microphones', 'handheld-dynamic-vocal-microphone', 'Handheld Dynamic Vocal Microphone', 'Generic', 'For events, churches and karaoke. Dynamic capsule rejects room noise and survives being dropped.', 1950000, null, 29, 'EMM-MIC-004', '{"Type":"Dynamic","Pattern":"Cardioid","Connection":"XLR","Extras":"6m XLR-to-jack cable"}', 6, false),

  -- Tripods ----------------------------------------------------------------
  ('tripods', 'professional-tripod-2m-with-phone-mount', '2m Professional Tripod with Phone Mount', 'Generic', 'Extends to eye level and folds to fit a bag. Fluid-ish pan head is smooth enough for slow pans.', 2450000, 3200000, 41, 'EMM-TRP-001', '{"Height":"50cm - 200cm","Head":"3-way pan/tilt","Mount":"1/4\" screw + phone clamp","Weight":"1.4kg"}', 6, true),
  ('tripods', 'ring-light-18-inch-with-stand', '18" Ring Light with Stand', 'Generic', 'The standard content-creation light. Three colour temperatures, dimmable, with a phone holder and remote.', 4200000, 5500000, 28, 'EMM-TRP-002', '{"Diameter":"18 inch","Colour":"3200K - 5600K","Stand":"2.1m adjustable","Extras":"Bluetooth remote, phone holder"}', 6, true),
  ('tripods', 'mini-flexible-octopus-tripod', 'Flexible Octopus Tripod', 'Generic', 'Wraps around railings, branches and chair backs. Weighs nothing and lives in your bag permanently.', 650000, 950000, 76, 'EMM-TRP-003', '{"Height":"25cm","Mount":"Phone clamp + 1/4\" screw","Extras":"Bluetooth shutter remote"}', 3, false),
  ('tripods', 'selfie-stick-tripod-bluetooth', 'Bluetooth Selfie Stick Tripod', 'Generic', 'Selfie stick that unfolds into a tripod. Detachable remote clips into the handle so you do not lose it.', 850000, 1200000, 63, 'EMM-TRP-004', '{"Extended":"1.1m","Mode":"Selfie stick + tripod","Remote":"Detachable Bluetooth"}', 3, false),

  -- Car Stereos ------------------------------------------------------------
  ('car-stereos', 'android-car-stereo-7-inch-double-din', '7" Android Car Stereo (Double DIN)', 'Generic', 'Android head unit with wireless CarPlay and Android Auto, GPS and a reversing camera input. Fitting is extra.', 12500000, 15500000, 13, 'EMM-CAR-001', '{"Screen":"7\" capacitive touch","OS":"Android 12","Features":"Wireless CarPlay, Android Auto, GPS","Inputs":"Reverse camera, USB, AUX, SD"}', 12, true),
  ('car-stereos', 'single-din-bluetooth-car-radio', 'Single DIN Bluetooth Car Radio', 'Generic', 'A straight swap for a dead factory radio. Bluetooth calling, USB, SD and FM, with a detachable face.', 3200000, 4200000, 32, 'EMM-CAR-002', '{"Size":"Single DIN","Features":"Bluetooth, USB, SD, AUX, FM","Power":"4x 50W","Extras":"Detachable face"}', 12, false),
  ('car-stereos', 'car-speakers-6x9-4-way', '6x9" 4-Way Car Speakers (Pair)', 'Generic', 'Rear-shelf speakers that add the low end factory speakers never had. Sold as a pair.', 4500000, 5800000, 20, 'EMM-CAR-003', '{"Size":"6x9 inch","Config":"4-way","Peak power":"400W per pair","Impedance":"4 ohm"}', 6, false),
  ('car-stereos', 'reversing-camera-kit-night-vision', 'Reversing Camera Kit with Night Vision', 'Generic', 'Waterproof camera, guide lines and 6m of cable. Pairs with any head unit that takes a camera input.', 1850000, 2400000, 37, 'EMM-CAR-004', '{"Resolution":"720p","Angle":"170 degrees","Rating":"IP68","Extras":"Guide lines, 6m cable"}', 6, false),

  -- Clippers ---------------------------------------------------------------
  ('clippers', 'wahl-magic-clip-cordless', 'Wahl Magic Clip Cordless', 'Wahl', 'The barbershop standard. Stagger-tooth blade for fading, ninety minutes cordless, and it holds its edge for years.', 15500000, 18500000, 14, 'EMM-CLP-001', '{"Runtime":"90 minutes","Blade":"Stagger-tooth crunch","Extras":"8 guards, oil, brush","Motor":"Rotary"}', 12, true),
  ('clippers', 'kemei-professional-cordless-clipper', 'Kemei Professional Cordless Clipper', 'Kemei', 'Sharp, quiet and a fraction of the price of the big names. The sensible starter clipper for home use.', 3500000, 4800000, 47, 'EMM-CLP-002', '{"Runtime":"120 minutes","Blade":"Titanium ceramic","Extras":"6 guards, charging stand"}', 6, true),
  ('clippers', 'beard-trimmer-grooming-kit-usb', 'USB Beard Trimmer Grooming Kit', 'Generic', 'Trimmer, nose-hair head, shaver head and detail head in one rechargeable body. Washable under the tap.', 2200000, 3000000, 52, 'EMM-CLP-003', '{"Runtime":"60 minutes","Heads":"4 interchangeable","Charging":"USB-C","Rating":"Washable"}', 6, false),
  ('clippers', 'professional-hair-shaver-bald-head', 'Professional Bald Head Shaver', 'Generic', 'Five rotary heads that follow the shape of the scalp. Gets closer than a clipper without the razor burn.', 2850000, 3600000, 24, 'EMM-CLP-004', '{"Heads":"5 rotary","Runtime":"90 minutes","Rating":"Wet and dry","Charging":"USB-C"}', 6, false),

  -- Fans -------------------------------------------------------------------
  ('fans', 'rechargeable-standing-fan-18-inch', '18" Rechargeable Standing Fan', 'Generic', 'Runs eight hours on a charge with an LED light built into the hub. The fan people actually buy when power is unreliable.', 8500000, 10500000, 22, 'EMM-FAN-001', '{"Size":"18 inch","Runtime":"6-8 hours","Extras":"LED light, remote control, solar input","Speeds":"3"}', 12, true),
  ('fans', 'rechargeable-table-fan-12-inch', '12" Rechargeable Table Fan', 'Generic', 'Desk-sized and light enough to carry room to room. Charges from mains or a power bank.', 4200000, 5500000, 36, 'EMM-FAN-002', '{"Size":"12 inch","Runtime":"5-7 hours","Charging":"AC + USB","Speeds":"3"}', 12, false),
  ('fans', 'usb-mini-desk-fan-clip-on', 'USB Mini Clip-On Desk Fan', 'Generic', 'Clips to a desk, cot or headboard. Quiet enough to sleep next to, which most mini fans are not.', 950000, 1400000, 68, 'EMM-FAN-003', '{"Power":"USB 5V","Battery":"4000mAh","Runtime":"4-12 hours","Extras":"360 degree rotation, clip base"}', 6, false),
  ('fans', 'rechargeable-tower-fan-with-remote', 'Rechargeable Tower Fan with Remote', 'Generic', 'Takes up a footprint the size of a shoebox and moves air across a whole sitting room. Timer and oscillation.', 12500000, null, 9, 'EMM-FAN-004', '{"Height":"90cm","Runtime":"5 hours","Extras":"Remote, timer, oscillation","Speeds":"3"}', 12, false),

  -- Home Appliances --------------------------------------------------------
  ('home-appliances', 'binatone-blender-with-grinder-1-5l', 'Binatone 1.5L Blender with Grinder', 'Binatone', 'Blender jar plus a dry mill for pepper and egusi. The two-jar set that ends up doing all the work in a Nigerian kitchen.', 5500000, 7000000, 25, 'EMM-HOM-001', '{"Capacity":"1.5L jar + mill","Power":"400W","Speeds":"2 + pulse","Jar":"Unbreakable"}', 12, true),
  ('home-appliances', 'electric-kettle-1-7l-stainless', '1.7L Stainless Electric Kettle', 'Generic', 'Boils fast and switches itself off. Concealed element so limescale does not build on a visible coil.', 2200000, 2900000, 43, 'EMM-HOM-002', '{"Capacity":"1.7L","Power":"2000W","Body":"Stainless steel","Safety":"Auto shut-off, boil-dry protection"}', 12, false),
  ('home-appliances', 'dry-iron-non-stick-soleplate', 'Non-Stick Dry Iron', 'Generic', 'Heavy enough to press without leaning on it, with a soleplate that glides and a thermostat that holds temperature.', 1850000, 2400000, 38, 'EMM-HOM-003', '{"Power":"1200W","Soleplate":"Non-stick coated","Control":"Adjustable thermostat"}', 12, false),
  ('home-appliances', 'sandwich-toaster-2-slice', '2-Slice Sandwich Toaster', 'Generic', 'Sealed-edge toastie plates and an indicator light that tells you when it is actually ready.', 2650000, 3400000, 27, 'EMM-HOM-004', '{"Power":"750W","Plates":"Non-stick, sealed edge","Extras":"Cord storage, indicator lights"}', 12, false),
  ('home-appliances', 'rechargeable-led-emergency-lamp', 'Rechargeable LED Emergency Lamp', 'Generic', 'Comes on by itself when the power cuts. Twelve hours on low, and it charges a phone in a pinch.', 1450000, 1900000, 55, 'EMM-HOM-005', '{"Runtime":"6-12 hours","Extras":"Auto-on at outage, USB charge-out, solar input","Brightness":"3 levels"}', 6, false),

  -- 13-in-1 Kits -----------------------------------------------------------
  ('multi-tool-kits', '13-in-1-universal-charging-cable-kit', '13-in-1 Universal Charging Cable Kit', 'Generic', 'One braided cable that ends in thirteen tips — USB-C, Lightning, micro-USB, laptop barrels and more. Lives in a zip case.', 1850000, 2600000, 49, 'EMM-KIT-001', '{"Tips":"13 interchangeable","Cable":"1.2m braided","Covers":"USB-C, Lightning, micro-USB, laptop barrels","Extras":"Zip case"}', 6, true),
  ('multi-tool-kits', '13-in-1-phone-repair-tool-kit', '13-in-1 Phone Repair Tool Kit', 'Generic', 'Precision drivers, spudgers, suction cup and opening picks. Everything for a screen or battery swap, nothing you will not use.', 1250000, 1800000, 41, 'EMM-KIT-002', '{"Pieces":"13","Includes":"Precision screwdrivers, spudgers, picks, suction cup, tweezers","Extras":"Roll-up pouch"}', 3, false),
  ('multi-tool-kits', '13-in-1-travel-adapter-power-station', '13-in-1 Travel Adapter & Power Station', 'Generic', 'Worldwide plug adapter with four USB ports and two sockets. One block replaces the tangle you normally pack.', 2450000, 3200000, 30, 'EMM-KIT-003', '{"Sockets":"2 universal AC","USB":"3x USB-A, 1x USB-C PD","Regions":"UK, EU, US, AU","Fuse":"Replaceable"}', 12, false),
  ('multi-tool-kits', '13-in-1-grooming-kit-cordless', '13-in-1 Cordless Grooming Kit', 'Generic', 'Clipper, beard trimmer, nose trimmer, shaver and body groomer heads on one rechargeable handle.', 3850000, 4900000, 26, 'EMM-KIT-004', '{"Attachments":"13","Runtime":"90 minutes","Charging":"USB-C","Rating":"Washable heads"}', 6, true)
) as v(category_slug, slug, name, brand, description, price_kobo, compare_at_price_kobo, stock, sku, specs, warranty_months, is_featured)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;
