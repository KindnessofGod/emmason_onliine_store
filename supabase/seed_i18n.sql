-- Localisation and marketplace seed.
--
-- Runs after seed.sql. Adds the five-language category copy, the sellers, and
-- back-fills the marketplace columns on the products seeded there.
--
-- TRANSLATION NOTE: the Yorùbá, Igbo and Hausa strings below were produced
-- without a native speaker in the loop. They are good-faith translations, not
-- verified ones — have a speaker review them before launch. French is on
-- firmer ground. English is the source of truth and the fallback.

-- ---------------------------------------------------------------------------
-- Categories — localised names, taglines, glyph and tile gradient.
-- ---------------------------------------------------------------------------
update public.categories c set
  glyph        = v.glyph,
  gradient     = v.gradient,
  name_i18n    = v.name_i18n::jsonb,
  tagline_i18n = v.tagline_i18n::jsonb
from (values
  ('chargers-power-banks', '🔋', array['#2F5C19','#63B824'],
   '{"en":"Chargers & Power Banks","yo":"Ṣájà àti Báńkì Agbára","ig":"Chaja na Ike Nchekwa","ha":"Cajoji da Bankunan Wuta","fr":"Chargeurs et batteries externes"}',
   '{"en":"Fast chargers and power banks that survive the outage","yo":"Ṣájà kíákíá àti báńkì agbára tí yóò bá ọ gbé nígbà tí iná bá lọ","ig":"Chaja ngwa ngwa na ike nchekwa nke na-adịgide mgbe ọkụ na-adịghị","ha":"Cajoji masu sauri da bankunan wuta da za su jure yankewar wuta","fr":"Chargeurs rapides et batteries qui tiennent pendant les coupures"}'),

  ('bluetooth-speakers', '🔊', array['#1B3E10','#4A951A'],
   '{"en":"Bluetooth Speakers","yo":"Agbóhùnsáfẹ́fẹ́ Bluetooth","ig":"Igwe Mkpọtụ Bluetooth","ha":"Lasifikan Bluetooth","fr":"Enceintes Bluetooth"}',
   '{"en":"Loud enough for the whole compound","yo":"Ó gbóhùn tó fún gbogbo àgbàlá","ig":"Ọ na-ada ụda zuru ogige niile","ha":"Mai ƙarar da ta isa duk gidan","fr":"Assez puissantes pour toute la cour"}'),

  ('earbuds', '🎧', array['#245C2E','#4FB56A'],
   '{"en":"Earbuds","yo":"Agbọ́rùn-etí Kékeré","ig":"Ihe Ntị Nta","ha":"Ƙananan Belun Kunne","fr":"Écouteurs sans fil"}',
   '{"en":"True wireless, noise cancelling, all-day battery","yo":"Aláìlókùn ní tòótọ́, ó ń dí ariwo, bátìrì ọjọ́ pípẹ́","ig":"Enweghị eriri n''ezie, na-egbochi mkpọtụ, batrị ụbọchị dum","ha":"Ba waya, mai hana hayaniya, batir yini ɗaya","fr":"Sans fil, réduction de bruit, batterie toute la journée"}'),

  ('headsets', '🎚️', array['#153A22','#3E8C55'],
   '{"en":"Headsets","yo":"Agbọ́rùn-etí Ńlá","ig":"Ihe Ntị Buru Ibu","ha":"Manyan Belun Kunne","fr":"Casques audio"}',
   '{"en":"Over-ear for music, gaming and long calls","yo":"Tí ó bo etí fún orin, eré àti ìpè gígùn","ig":"Nke na-ekpuchi ntị maka egwu, egwuregwu na oku ogologo","ha":"Masu rufe kunne don waƙa, wasa da dogon kira","fr":"Circum-auriculaires pour musique, jeu et longs appels"}'),

  ('smart-watches', '⌚', array['#2B5F3A','#5FBF7F'],
   '{"en":"Smart Watches","yo":"Aago Ọlọ́gbọ́n","ig":"Elekere Ọgụgụ Isi","ha":"Agogon Hannu Masu Wayo","fr":"Montres connectées"}',
   '{"en":"Track your day, take your calls","yo":"Ṣàkíyèsí ọjọ́ rẹ, gba ìpè rẹ","ig":"Soro ụbọchị gị, nata oku gị","ha":"Bi diddigin yininka, karɓi kiran ka","fr":"Suivez votre journée, prenez vos appels"}'),

  ('smart-glasses', '🕶️', array['#1F4633','#4C9E77'],
   '{"en":"Smart Glasses","yo":"Gilaasi Ọlọ́gbọ́n","ig":"Ugogbe Anya Ọgụgụ Isi","ha":"Tabarau Masu Wayo","fr":"Lunettes connectées"}',
   '{"en":"Hands-free calls and recording","yo":"Ìpè àti gbígbàsílẹ̀ láìlo ọwọ́","ig":"Oku na ndekọ na-ejighị aka","ha":"Kira da yin rikodi ba tare da hannu ba","fr":"Appels et enregistrement mains libres"}'),

  ('button-phones', '📱', array['#2F5C19','#7FD13B'],
   '{"en":"Button Phones","yo":"Fóònù Bọ́tìnì","ig":"Ekwentị Bọtịnụ","ha":"Wayoyin Maballi","fr":"Téléphones à touches"}',
   '{"en":"Weeks of standby, and a torch that works","yo":"Ọ̀sẹ̀ púpọ̀ láìsí gbígba iná, àti àtùpà tí ó ń ṣiṣẹ́","ig":"Izu ole na ole na-ejighị ọkụ, na ọkụ na-arụ ọrụ","ha":"Makonni ba tare da caji ba, da tocila mai aiki","fr":"Des semaines d''autonomie, et une torche qui marche"}'),

  ('kids-tablets', '🧸', array['#3F7A1A','#8FD94E'],
   '{"en":"Children''s Tablets","yo":"Táàbù Àwọn Ọmọdé","ig":"Mbadamba Ụmụaka","ha":"Kwamfutocin Yara","fr":"Tablettes pour enfants"}',
   '{"en":"Learning apps, parental controls, shock-proof","yo":"Ohun-èlò ẹ̀kọ́, ìdarí òbí, kò ní fọ́","ig":"Ngwa mmụta, njikwa nne na nna, adịghị agbaji","ha":"Manhajojin koyo, kulawar iyaye, ba ya karyewa","fr":"Apps éducatives, contrôle parental, antichoc"}'),

  ('cameras', '📷', array['#1A4020','#48A05A'],
   '{"en":"Cameras","yo":"Kámẹ́rà","ig":"Igwefoto","ha":"Kyamarori","fr":"Appareils photo"}',
   '{"en":"Vlogging, action and security cameras","yo":"Fún vlogging, ìṣe àti ààbò","ig":"Maka vlogging, mmemme na nchekwa","ha":"Na vlogging, wasanni da tsaro","fr":"Vlogging, action et surveillance"}'),

  ('microphones', '🎤', array['#26512F','#5CB472'],
   '{"en":"Microphones","yo":"Máíkì","ig":"Igwe Okwu","ha":"Makarufo","fr":"Microphones"}',
   '{"en":"Built for content creators","yo":"A ṣe é fún àwọn tí ń ṣe àkóónú","ig":"Emere ya maka ndị na-eme ọdịnaya","ha":"An yi shi don masu ƙirƙirar abun ciki","fr":"Conçus pour les créateurs de contenu"}'),

  ('tripods', '🎬', array['#3A6B22','#7CC24A'],
   '{"en":"Tripods & Lighting","yo":"Ẹsẹ̀-mẹ́ta àti Ìmọ́lẹ̀","ig":"Ụkwụ Atọ na Ọkụ","ha":"Kafafu Uku da Fitila","fr":"Trépieds et éclairage"}',
   '{"en":"Ring lights, phone tripods and selfie sticks","yo":"Ìmọ́lẹ̀ òrùka, ẹsẹ̀-mẹ́ta fóònù àti ọ̀pá selfie","ig":"Ọkụ mgbanaka, ụkwụ atọ ekwentị na osisi selfie","ha":"Fitilun zobe, kafafun waya da sandunan selfie","fr":"Anneaux lumineux, trépieds et perches à selfie"}'),

  ('car-stereos', '🚗', array['#14351C','#3D8B4E'],
   '{"en":"Car Stereos","yo":"Ẹ̀rọ Ohùn Ọkọ̀","ig":"Igwe Ụda Ụgbọala","ha":"Rediyon Mota","fr":"Autoradios"}',
   '{"en":"Android head units, speakers and reversing cameras","yo":"Ẹ̀rọ Android, agbóhùnsáfẹ́fẹ́ àti kámẹ́rà ìpadàsẹ́yìn","ig":"Igwe Android, igwe mkpọtụ na igwefoto nlaghachi azụ","ha":"Na''urorin Android, lasifika da kyamarorin ja da baya","fr":"Autoradios Android, haut-parleurs et caméras de recul"}'),

  ('clippers', '✂️', array['#2D5A35','#6ABF80'],
   '{"en":"Clippers","yo":"Ẹ̀rọ Ìrun","ig":"Igwe Ntacha Ntutu","ha":"Injin Aski","fr":"Tondeuses"}',
   '{"en":"Cordless clippers the barbers actually use","yo":"Ẹ̀rọ aláìlókùn tí àwọn onígbàjámọ̀ ń lò ní tòótọ́","ig":"Igwe enweghị eriri nke ndị na-akpụ isi na-eji","ha":"Injinan aski marasa waya da wanzamai ke amfani da su","fr":"Tondeuses sans fil, celles qu''utilisent vraiment les barbiers"}'),

  ('fans', '🌀', array['#3F9E12','#7FD13B'],
   '{"en":"Fans & Cooling","yo":"Pankẹ́rẹ́ àti Ìtutù","ig":"Fan na Ime Jụụ","ha":"Fanka da Sanyaya","fr":"Ventilateurs et fraîcheur"}',
   '{"en":"Rechargeable and solar — no light, no wahala","yo":"Tí a lè gba iná sí, àti ti oòrùn — kò sí iná, kò sí wàhálà","ig":"Nke a na-etinye ọkụ na nke anyanwụ — enweghị ọkụ, enweghị nsogbu","ha":"Mai caji da na hasken rana — babu wuta, babu wahala","fr":"Rechargeables et solaires — pas de lumière, pas de wahala"}'),

  ('home-appliances', '🏠', array['#22502B','#55A868'],
   '{"en":"Home Appliances","yo":"Ohun-èlò Ilé","ig":"Ngwá Ụlọ","ha":"Kayan Gida","fr":"Électroménager"}',
   '{"en":"Blenders, kettles, irons and everyday essentials","yo":"Ẹ̀rọ ìlọ̀, ìkòkò omi gbígbóná, asọ ìtẹ́ àti ohun ojoojúmọ́","ig":"Igwe ngwakọta, ite mmiri ọkụ, aịrọn na ihe ụbọchị niile","ha":"Mahaɗa, tukunyar ruwan zafi, guga da kayan yau da kullum","fr":"Mixeurs, bouilloires, fers et essentiels du quotidien"}'),

  ('multi-tool-kits', '🧰', array['#2F5C19','#9BDD5C'],
   '{"en":"13-in-1 Kits","yo":"Ìtòlẹ́sẹẹsẹ 13-nínú-1","ig":"Ngwa 13-n''ime-1","ha":"Kayan 13-cikin-1","fr":"Kits 13-en-1"}',
   '{"en":"One box, thirteen jobs","yo":"Àpótí kan, iṣẹ́ mẹ́tàlá","ig":"Otu igbe, ọrụ iri na atọ","ha":"Akwati ɗaya, ayyuka goma sha uku","fr":"Une boîte, treize usages"}')
) as v(slug, glyph, gradient, name_i18n, tagline_i18n)
where c.slug = v.slug;

-- ---------------------------------------------------------------------------
-- Sellers. Emmason is the house account; the rest are marketplace sellers,
-- one left unverified so the pending state is exercisable.
-- ---------------------------------------------------------------------------
insert into public.sellers (slug, name, city, state, since, verified, is_house, rating, review_count, phone, bio)
values
  ('emmason', 'Emmason Mobile Phones, Tech & Gadgets', 'Owerri', 'Imo', 2016, true, true, 4.8, 412, '2349065755314',
   '{"en":"The house account. Walk in to No 24 Day Star Plaza, Owerri, or order for nationwide delivery.","yo":"Àkọọ́ntì ilé. Wá sí No 24 Day Star Plaza, Owerri, tàbí paṣẹ fún ìfijíṣẹ́ jákèjádò orílẹ̀-èdè.","ig":"Akaụntụ ụlọ. Bata na No 24 Day Star Plaza, Owerri, ma ọ bụ nye iwu maka nnyefe mba niile.","ha":"Asusun gida. Ka zo No 24 Day Star Plaza, Owerri, ko ka yi oda don isar da kaya ko''ina.","fr":"Le compte de la maison. Passez au No 24 Day Star Plaza, Owerri, ou commandez en livraison nationale."}'::jsonb),

  ('brightway-gadgets', 'Brightway Gadgets', 'Aba', 'Abia', 2019, true, false, 4.6, 138, null,
   '{"en":"Audio and charging specialists shipping from Aba.","yo":"Amóye lórí ohùn àti gbígba iná, ń fi ránṣẹ́ láti Aba.","ig":"Ndị ọkachamara na ụda na chaja, na-ebuga site na Aba.","ha":"Ƙwararru kan sauti da caji, suna aikawa daga Aba.","fr":"Spécialistes audio et charge, expédition depuis Aba."}'::jsonb),

  ('zenith-tech-hub', 'Zenith Tech Hub', 'Ikeja', 'Lagos', 2020, true, false, 4.7, 265, null,
   '{"en":"Lagos-based hub for cameras, tripods and creator gear.","yo":"Ibùdó Èkó fún kámẹ́rà, ẹsẹ̀-mẹ́ta àti ohun-èlò olùṣẹ̀dá.","ig":"Ebe Lagos maka igwefoto, ụkwụ atọ na ngwa ndị okike.","ha":"Cibiyar Legas don kyamarori, kafafu uku da kayan masu ƙirƙira.","fr":"Hub lagosien pour caméras, trépieds et matériel de création."}'::jsonb),

  ('kelechi-electronics', 'Kelechi Electronics', 'Owerri', 'Imo', 2018, true, false, 4.5, 96, null,
   '{"en":"Home appliances and fans, two streets from the main shop.","yo":"Ohun-èlò ilé àti pankẹ́rẹ́, ìgboro méjì sí ilé-ìtajà àkọ́kọ́.","ig":"Ngwá ụlọ na fan, okporo ámá abụọ site n''ụlọ ahịa isi.","ha":"Kayan gida da fanka, titi biyu daga babban shago.","fr":"Électroménager et ventilateurs, à deux rues de la boutique principale."}'::jsonb),

  ('naija-sound-store', 'Naija Sound Store', 'Port Harcourt', 'Rivers', 2022, false, false, 4.2, 31, null,
   '{"en":"Speakers and party sound. Application under review.","yo":"Agbóhùnsáfẹ́fẹ́ àti ohùn ayẹyẹ. À ń ṣàyẹ̀wò ìbéèrè wọn.","ig":"Igwe mkpọtụ na ụda oriri. A na-enyocha akwụkwọ arịrịọ ha.","ha":"Lasifika da sautin biki. Ana duba takardar neman su.","fr":"Enceintes et sono de fête. Candidature en cours d''examen."}'::jsonb)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Back-fill the marketplace columns on the seeded products.
-- ---------------------------------------------------------------------------

-- English description becomes the base localisation; the data layer falls back
-- to English for any locale that is missing.
update public.products
set description_i18n = jsonb_build_object('en', description)
where description is not null and description_i18n = '{}'::jsonb;

-- Spread the catalogue across sellers so the marketplace is visible, keeping
-- the majority on the house account. Deterministic, so reseeding is stable.
update public.products p
set seller_id = s.id
from public.sellers s
where p.seller_id is null
  and s.slug = case
    when p.category_id in (select id from public.categories where slug in ('bluetooth-speakers','earbuds','headsets'))
         and p.sku like '%-00[23]' then 'brightway-gadgets'
    when p.category_id in (select id from public.categories where slug in ('cameras','tripods','microphones'))
         and p.sku like '%-00[23]' then 'zenith-tech-hub'
    when p.category_id in (select id from public.categories where slug in ('home-appliances','fans'))
         and p.sku like '%-00[23]' then 'kelechi-electronics'
    else 'emmason'
  end;

-- Button phones and tablets are the categories where UK-used stock is normal
-- in this market; everything else is sold new.
update public.products p
set condition = 'uk-used'
from public.categories c
where p.category_id = c.id
  and c.slug in ('button-phones', 'kids-tablets')
  and p.sku like '%-004';

-- Seeded social proof so the rating UI is exercisable. Deterministic.
update public.products
set rating = 3.9 + ((abs(hashtext(slug)) % 11)::numeric / 10),
    review_count = 4 + (abs(hashtext(slug)) % 180)
where review_count = 0;
