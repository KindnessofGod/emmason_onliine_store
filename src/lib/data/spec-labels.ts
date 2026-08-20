import type { LocalizedText } from "../types";

/**
 * Spec labels repeat across dozens of products, so they live here once instead
 * of being re-translated inline in every product record.
 */
export const specLabel = {
  display: {
    en: "Display",
    yo: "Ojú ìwòye",
    ig: "Ihuenyo",
    ha: "Allo",
    fr: "Écran",
  },
  battery: {
    en: "Battery",
    yo: "Bátìrì",
    ig: "Batrị",
    ha: "Baturi",
    fr: "Batterie",
  },
  storage: {
    en: "Storage",
    yo: "Ibi ìtọ́jú",
    ig: "Ebe nchekwa",
    ha: "Ma'ajiya",
    fr: "Stockage",
  },
  memory: {
    en: "Memory",
    yo: "Ìrántí",
    ig: "Ebe ncheta",
    ha: "Ƙwaƙwalwa",
    fr: "Mémoire",
  },
  camera: {
    en: "Camera",
    yo: "Kámẹ́rà",
    ig: "Igwefoto",
    ha: "Kyamara",
    fr: "Appareil photo",
  },
  network: {
    en: "Network",
    yo: "Nẹ́tíwọ̀kì",
    ig: "Netwọk",
    ha: "Hanyar sadarwa",
    fr: "Réseau",
  },
  charging: {
    en: "Charging",
    yo: "Gbígba iná",
    ig: "Ịtinye ọkụ",
    ha: "Caji",
    fr: "Recharge",
  },
  runtime: {
    en: "Run time",
    yo: "Àkókò iṣẹ́",
    ig: "Oge ọ na-arụ ọrụ",
    ha: "Tsawon aiki",
    fr: "Autonomie",
  },
  power: {
    en: "Power",
    yo: "Agbára",
    ig: "Ike",
    ha: "Ƙarfi",
    fr: "Puissance",
  },
  size: {
    en: "Size",
    yo: "Ìwọ̀n",
    ig: "Nha",
    ha: "Girma",
    fr: "Taille",
  },
  connectivity: {
    en: "Connectivity",
    yo: "Ìsopọ̀",
    ig: "Njikọ",
    ha: "Haɗi",
    fr: "Connectivité",
  },
  playtime: {
    en: "Play time",
    yo: "Àkókò ìtẹ̀tẹ̀",
    ig: "Oge ịkpọ",
    ha: "Tsawon kunnawa",
    fr: "Autonomie d'écoute",
  },
  capacity: {
    en: "Capacity",
    yo: "Agbára ìkó",
    ig: "Ike ịkwaga",
    ha: "Ƙarfin ɗauka",
    fr: "Capacité",
  },
  output: {
    en: "Output",
    yo: "Ìjáde",
    ig: "Ihe ọ na-enye",
    ha: "Fitarwa",
    fr: "Sortie",
  },
  brightness: {
    en: "Brightness",
    yo: "Ìmọ́lẹ̀",
    ig: "Ìchá",
    ha: "Haske",
    fr: "Luminosité",
  },
  colourTemp: {
    en: "Colour temperature",
    yo: "Ìwọ̀n ooru àwọ̀",
    ig: "Okpomọkụ agba",
    ha: "Zafin launi",
    fr: "Température de couleur",
  },
  mount: {
    en: "Mount",
    yo: "Ìgbékalẹ̀",
    ig: "Ebe a na-etinye ya",
    ha: "Wurin haɗawa",
    fr: "Fixation",
  },
  compatibility: {
    en: "Works with",
    yo: "Ó ń ṣiṣẹ́ pẹ̀lú",
    ig: "Ọ na-arụ ọrụ na",
    ha: "Yana aiki da",
    fr: "Compatible avec",
  },
  material: {
    en: "Material",
    yo: "Ohun èlò",
    ig: "Ihe e ji mee ya",
    ha: "Kayan da aka yi da shi",
    fr: "Matériau",
  },
  inTheBox: {
    en: "In the box",
    yo: "Nínú àpótí",
    ig: "N'ime igbe",
    ha: "Cikin akwati",
    fr: "Dans la boîte",
  },
  waterResistance: {
    en: "Water resistance",
    yo: "Ààbò omi",
    ig: "Nchekwa mmiri",
    ha: "Juriyar ruwa",
    fr: "Résistance à l'eau",
  },
  noiseCancelling: {
    en: "Noise cancelling",
    yo: "Yíyọ ariwo kúrò",
    ig: "Iwepu ụzụ",
    ha: "Kawar da hayaniya",
    fr: "Réduction de bruit",
  },
  driver: {
    en: "Driver",
    yo: "Awakọ́ ohùn",
    ig: "Ngwa olu",
    ha: "Na'urar sauti",
    fr: "Haut-parleur",
  },
  resolution: {
    en: "Resolution",
    yo: "Ìwọ̀n àwòrán",
    ig: "Ọkwa foto",
    ha: "Ƙarfin hoto",
    fr: "Résolution",
  },
  type: {
    en: "Type",
    yo: "Irú",
    ig: "Ụdị",
    ha: "Nau'i",
    fr: "Type",
  },
} satisfies Record<string, LocalizedText>;

export type SpecKey = keyof typeof specLabel;

/**
 * Collapse a spec key to bare-lowercase-alphanumeric, so "Water resistance",
 * "water-resistance" and "waterResistance" all resolve to the same entry
 * regardless of how a product's `specs` jsonb happened to capitalise or
 * space it. Used both to look up a stored key's translated label and to
 * match a stored key back to the `specLabel`/template key it came from.
 */
export function normalizeSpecKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const specLabelByNormalizedKey = new Map<string, LocalizedText>(
  (Object.entries(specLabel) as [SpecKey, LocalizedText][]).map(([key, value]) => [
    normalizeSpecKey(key),
    value,
  ]),
);

/** Translated label for a stored spec key, however it was cased/spaced.
 *  Undefined for a custom field with no known translation. */
export function lookupSpecLabel(key: string): LocalizedText | undefined {
  return specLabelByNormalizedKey.get(normalizeSpecKey(key));
}
