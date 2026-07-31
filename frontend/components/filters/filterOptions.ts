import type { SelectOption } from "./filter.types";

// ─── Option Lists ─────────────────────────────────────────────────────────────

export const CATEGORY_OPTIONS: SelectOption[] = [
  { label: "همه دسته‌ها", value: "" },
  { label: "خودرو و وسایل نقلیه", value: "vehicle" },
  { label: "مسکن", value: "real-estate" },
  { label: "لوازم خانگی", value: "home-appliances" },
  { label: "موبایل و تبلت", value: "mobile" },
  { label: "لوازم الکترونیک", value: "electronics" },
  { label: "پوشاک و لوازم شخصی", value: "clothing" },
  { label: "کسب‌وکار", value: "business" },
  { label: "خدمات", value: "services" },
  { label: "استخدام و کاریابی", value: "jobs" },
  { label: "سرگرمی و فراغت", value: "entertainment" },
  { label: "صنعت، ابزار و تجهیزات", value: "industrial" },
];

export const AD_TYPE_OPTIONS: SelectOption[] = [
  { label: "همه انواع", value: "" },
  { label: "فروش", value: "sale" },
  { label: "اجاره", value: "rent" },
  { label: "رایگان", value: "free" },
  { label: "معاوضه", value: "exchange" },
];

export const CONDITION_OPTIONS: SelectOption[] = [
  { label: "همه", value: "" },
  { label: "نو", value: "new" },
  { label: "در حد نو", value: "like-new" },
  { label: "کارکرده", value: "used" },
  { label: "نیاز به تعمیر", value: "needs-repair" },
];

export const PROVINCE_OPTIONS: SelectOption[] = [
  { label: "همه استان‌ها", value: "" },
  { label: "آذربایجان شرقی", value: "east-azerbaijan" },
  { label: "آذربایجان غربی", value: "west-azerbaijan" },
  { label: "اردبیل", value: "ardabil" },
  { label: "اصفهان", value: "isfahan" },
  { label: "البرز", value: "alborz" },
  { label: "بوشهر", value: "bushehr" },
  { label: "تهران", value: "tehran" },
  { label: "چهارمحال و بختیاری", value: "chaharmahal" },
  { label: "خراسان جنوبی", value: "south-khorasan" },
  { label: "خراسان رضوی", value: "khorasan-razavi" },
  { label: "خراسان شمالی", value: "north-khorasan" },
  { label: "خوزستان", value: "khuzestan" },
  { label: "زنجان", value: "zanjan" },
  { label: "سمنان", value: "semnan" },
  { label: "سیستان و بلوچستان", value: "sistan" },
  { label: "فارس", value: "fars" },
  { label: "قزوین", value: "qazvin" },
  { label: "قم", value: "qom" },
  { label: "کردستان", value: "kurdistan" },
  { label: "کرمان", value: "kerman" },
  { label: "کرمانشاه", value: "kermanshah" },
  { label: "کهگیلویه و بویراحمد", value: "kohgiluyeh" },
  { label: "گلستان", value: "golestan" },
  { label: "گیلان", value: "Gilan" },
  { label: "لرستان", value: "lorestan" },
  { label: "مازندران", value: "mazandaran" },
  { label: "مرکزی", value: "markazi" },
  { label: "هرمزگان", value: "hormozgan" },
  { label: "همدان", value: "hamedan" },
  { label: "یزد", value: "yazd" },
];

export const SORT_OPTIONS: SelectOption[] = [
  { label: "انتخاب کنید", value: "" },
  { label: "جدیدترین", value: "newest" },
  { label: "قدیمی‌ترین", value: "oldest" },
  { label: "ارزان‌ترین", value: "cheapest" },
  { label: "گران‌ترین", value: "most-expensive" },
  { label: "بیشترین بازدید", value: "most-viewed" },
];

export const DATE_RANGE_OPTIONS: SelectOption[] = [
  { label: "همه زمان‌ها", value: "" },
  { label: "امروز", value: "today" },
  { label: "دیروز", value: "yesterday" },
  { label: "این هفته", value: "this-week" },
  { label: "این ماه", value: "this-month" },
  { label: "سه ماه اخیر", value: "last-3-months" },
];

// ─── Label Map (value → Persian display label) ───────────────────────────────

export const LABEL_MAP: Record<string, string> = {
  // Categories
  vehicle: "خودرو",
  "real-estate": "مسکن",
  "home-appliances": "لوازم خانگی",
  mobile: "موبایل",
  electronics: "الکترونیک",
  clothing: "پوشاک",
  business: "کسب‌وکار",
  services: "خدمات",
  jobs: "استخدام",
  entertainment: "سرگرمی",
  industrial: "صنعت",
  // Ad Types
  sale: "فروش",
  rent: "اجاره",
  free: "رایگان",
  exchange: "معاوضه",
  // Conditions
  new: "نو",
  "like-new": "در حد نو",
  used: "کارکرده",
  "needs-repair": "نیاز به تعمیر",
  // Provinces
  "east-azerbaijan": "آذربایجان شرقی",
  "west-azerbaijan": "آذربایجان غربی",
  ardabil: "اردبیل",
  isfahan: "اصفهان",
  alborz: "البرز",
  bushehr: "بوشهر",
  tehran: "تهران",
  chaharmahal: "چهارمحال",
  "south-khorasan": "خراسان جنوبی",
  "khorasan-razavi": "خراسان رضوی",
  "north-khorasan": "خراسان شمالی",
  khuzestan: "خوزستان",
  zanjan: "زنجان",
  semnan: "سمنان",
  sistan: "سیستان",
  fars: "فارس",
  qazvin: "قزوین",
  qom: "قم",
  kurdistan: "کردستان",
  kerman: "کرمان",
  kermanshah: "کرمانشاه",
  kohgiluyeh: "کهگیلویه",
  golestan: "گلستان",
  Gilan: "گیلان",
  lorestan: "لرستان",
  mazandaran: "مازندران",
  markazi: "مرکزی",
  hormozgan: "هرمزگان",
  hamedan: "همدان",
  yazd: "یزد",
  // Sort
  newest: "جدیدترین",
  oldest: "قدیمی‌ترین",
  cheapest: "ارزان‌ترین",
  "most-expensive": "گران‌ترین",
  "most-viewed": "پربازدید",
  // Date Range
  today: "امروز",
  yesterday: "دیروز",
  "this-week": "این هفته",
  "this-month": "این ماه",
  "last-3-months": "۳ ماه اخیر",
};
