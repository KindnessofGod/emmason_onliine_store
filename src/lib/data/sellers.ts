import type { Seller } from "../types";

export const sellers: Seller[] = [
  {
    id: "slr-emmason",
    slug: "emmason",
    name: "Emmason Mobile Phones, Tech & Gadgets",
    city: "Owerri",
    state: "Imo",
    since: 2016,
    verified: true,
    isHouse: true,
    rating: 4.9,
    reviewCount: 1284,
    bio: {
      en: "The house store. Phones, gadgets and home tech at No 24 Day Star Plaza, Owerri — walk in, test it, take it home.",
      yo: "Ilé-ìtajà wa. Fóònù, gájẹ́ẹ̀tì àti ẹ̀rọ ilé ní No 24 Day Star Plaza, Owerri — wọlé, dán an wò, gbé e lọ ilé.",
      ig: "Ụlọ ahịa anyị. Ekwentị, ngwá ọrụ na teknụzụ ụlọ na No 24 Day Star Plaza, Owerri — bata, nwalee ya, buru ya laa.",
      ha: "Shagonmu. Wayoyi, kayan fasaha da na gida a No 24 Day Star Plaza, Owerri — shigo, gwada, ka ɗauka gida.",
      fr: "La boutique maison. Téléphones, gadgets et high-tech au No 24 Day Star Plaza, Owerri — venez, testez, repartez avec.",
    },
  },
  {
    id: "slr-brightway",
    slug: "brightway-gadgets",
    name: "Brightway Gadgets",
    city: "Ikeja",
    state: "Lagos",
    since: 2019,
    verified: true,
    isHouse: false,
    rating: 4.7,
    reviewCount: 412,
    bio: {
      en: "Computer Village specialists in UK-used phones and laptops. Every device is bench-tested before it ships.",
      yo: "Amòye Computer Village nínú fóònù àti kọ̀ǹpútà tí wọ́n lò ní UK. A ń dán ẹ̀rọ kọ̀ọ̀kan wò kí a tó fi ránṣẹ́.",
      ig: "Ndị ọkachamara Computer Village n'ekwentị na laptop ejirila na UK. Anyị na-anwale ngwaọrụ ọ bụla tupu izipu ya.",
      ha: "Ƙwararrun Computer Village a wayoyi da kwamfutoci na UK. Ana gwada kowace na'ura kafin a aika.",
      fr: "Spécialistes de Computer Village en téléphones et ordinateurs d'occasion UK. Chaque appareil est testé avant expédition.",
    },
  },
  {
    id: "slr-zenith",
    slug: "zenith-tech-hub",
    name: "Zenith Tech Hub",
    city: "Wuse",
    state: "FCT Abuja",
    since: 2021,
    verified: true,
    isHouse: false,
    rating: 4.6,
    reviewCount: 238,
    bio: {
      en: "Audio and content-creation gear for creators — lights, mics, gimbals and studio headphones.",
      yo: "Ohun èlò ohùn àti ìṣẹ̀dá àkóónú fún àwọn olùṣẹ̀dá — ìmọ́lẹ̀, máìkì, gímbà àti agbọ́rùn-etí ilé-iṣẹ́.",
      ig: "Ngwá ụda na ime ihe nkiri maka ndị na-eke ihe — ọkụ, maịk, gimbal na ihe ntị studio.",
      ha: "Kayan sauti da yin bidiyo ga masu kirkira — fitilu, makurufo, gimbal da belun kunne na studio.",
      fr: "Matériel audio et création de contenu pour créateurs — lumières, micros, gimbals et casques studio.",
    },
  },
  {
    id: "slr-kelechi",
    slug: "kelechi-electronics",
    name: "Kelechi Electronics",
    city: "Onitsha",
    state: "Anambra",
    since: 2014,
    verified: true,
    isHouse: false,
    rating: 4.8,
    reviewCount: 693,
    bio: {
      en: "Twelve years in Onitsha Main Market. Fans, inverters, solar and home appliances at market prices.",
      yo: "Ọdún méjìlá ní Ọjà Ńlá Onitsha. Pankẹ́rẹ́, ìnfátà, oòrùn àti ohun èlò ilé ní iye ọjà.",
      ig: "Afọ iri na abụọ n'Ahịa Ukwu Onitsha. Fan, inverter, anyanwụ na ngwá ụlọ n'ọnụahịa ahịa.",
      ha: "Shekaru goma sha biyu a Kasuwar Onitsha. Fanka, inverter, hasken rana da kayan gida a farashin kasuwa.",
      fr: "Douze ans au grand marché d'Onitsha. Ventilateurs, onduleurs, solaire et électroménager au prix du marché.",
    },
  },
  {
    id: "slr-naijasound",
    slug: "naija-sound-store",
    name: "Naija Sound Store",
    city: "Port Harcourt",
    state: "Rivers",
    since: 2023,
    verified: false,
    isHouse: false,
    rating: 4.4,
    reviewCount: 57,
    bio: {
      en: "Speakers, soundbars and party audio for events across the South-South.",
      yo: "Agbóhùnsáfẹ́fẹ́, sáǹdíbáà àti ohùn ayẹyẹ fún ìṣẹ̀lẹ̀ ní Gúúsù-Gúúsù.",
      ig: "Igwe okwu, soundbar na ụda ememe maka mmemme na South-South.",
      ha: "Lasifika, soundbar da sautin biki don bukukuwa a Kudu-Kudu.",
      fr: "Enceintes, barres de son et sono pour événements dans le Sud-Sud.",
    },
  },
];

export function getSeller(id: string): Seller | undefined {
  return sellers.find((s) => s.id === id);
}

export function getSellerBySlug(slug: string): Seller | undefined {
  return sellers.find((s) => s.slug === slug);
}
