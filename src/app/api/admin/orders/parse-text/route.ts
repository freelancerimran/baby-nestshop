import { NextResponse } from "next/server";

/* =========================================================
   BANGLADESH SMART CUSTOMER PARSER
   ---------------------------------------------------------
   Features:

   - Customer name detection
   - Bangladesh phone detection
   - Address detection in any order
   - 64 district detection
   - English + Bangla district aliases
   - Thana / Upazila / common area mapping
   - Safe TypeScript mapping
   - No object keys with unquoted spaces
========================================================= */

/* =========================================================
   TYPES
========================================================= */

type District =
  | "Bagerhat"
  | "Bandarban"
  | "Barguna"
  | "Barishal"
  | "Bhola"
  | "Bogura"
  | "Brahmanbaria"
  | "Chandpur"
  | "Chattogram"
  | "Chuadanga"
  | "Cox's Bazar"
  | "Cumilla"
  | "Dhaka"
  | "Dinajpur"
  | "Faridpur"
  | "Feni"
  | "Gaibandha"
  | "Gazipur"
  | "Gopalganj"
  | "Habiganj"
  | "Jamalpur"
  | "Jashore"
  | "Jhalokathi"
  | "Jhenaidah"
  | "Joypurhat"
  | "Khagrachhari"
  | "Khulna"
  | "Kishoreganj"
  | "Kurigram"
  | "Kushtia"
  | "Lakshmipur"
  | "Lalmonirhat"
  | "Madaripur"
  | "Magura"
  | "Manikganj"
  | "Meherpur"
  | "Moulvibazar"
  | "Munshiganj"
  | "Mymensingh"
  | "Naogaon"
  | "Narail"
  | "Narayanganj"
  | "Narsingdi"
  | "Natore"
  | "Netrokona"
  | "Nilphamari"
  | "Noakhali"
  | "Pabna"
  | "Panchagarh"
  | "Patuakhali"
  | "Pirojpur"
  | "Rajbari"
  | "Rajshahi"
  | "Rangamati"
  | "Rangpur"
  | "Satkhira"
  | "Shariatpur"
  | "Sherpur"
  | "Sirajganj"
  | "Sunamganj"
  | "Sylhet"
  | "Tangail"
  | "Thakurgaon";

interface ParsedCustomerData {
  customerName: string;
  phone: string;
  address: string;
  district: District | "";
}

/* =========================================================
   DISTRICTS
========================================================= */

const DISTRICTS: District[] = [
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogura",
  "Brahmanbaria",
  "Chandpur",
  "Chattogram",
  "Chuadanga",
  "Cox's Bazar",
  "Cumilla",
  "Dhaka",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokathi",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
];

/* =========================================================
   TEXT NORMALIZATION
========================================================= */

function normalizeText(
  value: string
) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(
      /[’‘`´]/g,
      "'"
    )
    .replace(
      /[–—]/g,
      "-"
    )
    .replace(
      /[.,;:()[\]{}<>!?/\\|]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function cleanLine(
  value: string
) {
  return String(value ?? "")
    .replace(
      /\s+/g,
      " "
    )
    .replace(
      /^[\s:;,\-|]+/,
      ""
    )
    .replace(
      /[\s:;,\-|]+$/,
      ""
    )
    .trim();
}

/* =========================================================
   DISTRICT ALIAS STORAGE

   Array-based mapping is intentionally used.

   This prevents TypeScript syntax errors such as:

   darus salam: "Dhaka"

   because locations with spaces are stored as strings.
========================================================= */

const LOCATION_TO_DISTRICT =
  new Map<string, District>();

function addLocations(
  district: District,
  locations: string[]
) {
  for (
    const location of locations
  ) {
    const normalized =
      normalizeText(
        location
      );

    if (
      normalized
    ) {
      LOCATION_TO_DISTRICT.set(
        normalized,
        district
      );
    }
  }
}

/* =========================================================
   DISTRICT ALIASES
========================================================= */

addLocations(
  "Bagerhat",
  [
    "bagerhat",
    "বাগেরহাট",
  ]
);

addLocations(
  "Bandarban",
  [
    "bandarban",
    "বান্দরবান",
  ]
);

addLocations(
  "Barguna",
  [
    "barguna",
    "বরগুনা",
  ]
);

addLocations(
  "Barishal",
  [
    "barishal",
    "barisal",
    "বরিশাল",
    "বরিশাইল",
  ]
);

addLocations(
  "Bhola",
  [
    "bhola",
    "ভোলা",
  ]
);

addLocations(
  "Bogura",
  [
    "bogura",
    "bogra",
    "বগুড়া",
    "বগুড়া",
  ]
);

addLocations(
  "Brahmanbaria",
  [
    "brahmanbaria",
    "brahmanbaria sadar",
    "ব্রাহ্মণবাড়িয়া",
    "ব্রাহ্মণবাড়িয়া",
  ]
);

addLocations(
  "Chandpur",
  [
    "chandpur",
    "চাঁদপুর",
    "চাদপুর",
  ]
);

addLocations(
  "Chattogram",
  [
    "chattogram",
    "chittagong",
    "ctg",
    "চট্টগ্রাম",
    "চিটাগাং",
  ]
);

addLocations(
  "Chuadanga",
  [
    "chuadanga",
    "চুয়াডাঙ্গা",
    "চুয়াডাঙ্গা",
  ]
);

addLocations(
  "Cox's Bazar",
  [
    "cox's bazar",
    "cox bazar",
    "coxs bazar",
    "coxsbazar",
    "কক্সবাজার",
  ]
);

addLocations(
  "Cumilla",
  [
    "cumilla",
    "comilla",
    "কুমিল্লা",
  ]
);

addLocations(
  "Dhaka",
  [
    "dhaka",
    "ঢাকা",
  ]
);

addLocations(
  "Dinajpur",
  [
    "dinajpur",
    "দিনাজপুর",
  ]
);

addLocations(
  "Faridpur",
  [
    "faridpur",
    "ফরিদপুর",
  ]
);

addLocations(
  "Feni",
  [
    "feni",
    "ফেনী",
  ]
);

addLocations(
  "Gaibandha",
  [
    "gaibandha",
    "গাইবান্ধা",
  ]
);

addLocations(
  "Gazipur",
  [
    "gazipur",
    "গাজীপুর",
    "গাজিপুর",
  ]
);

addLocations(
  "Gopalganj",
  [
    "gopalganj",
    "গোপালগঞ্জ",
  ]
);

addLocations(
  "Habiganj",
  [
    "habiganj",
    "হবিগঞ্জ",
  ]
);

addLocations(
  "Jamalpur",
  [
    "jamalpur",
    "জামালপুর",
  ]
);

addLocations(
  "Jashore",
  [
    "jashore",
    "jessore",
    "যশোর",
  ]
);

addLocations(
  "Jhalokathi",
  [
    "jhalokathi",
    "ঝালকাঠি",
  ]
);

addLocations(
  "Jhenaidah",
  [
    "jhenaidah",
    "ঝিনাইদহ",
  ]
);

addLocations(
  "Joypurhat",
  [
    "joypurhat",
    "jaipurhat",
    "জয়পুরহাট",
    "জয়পুরহাট",
  ]
);

addLocations(
  "Khagrachhari",
  [
    "khagrachhari",
    "khagrachari",
    "খাগড়াছড়ি",
    "খাগড়াছড়ি",
  ]
);

addLocations(
  "Khulna",
  [
    "khulna",
    "খুলনা",
  ]
);

addLocations(
  "Kishoreganj",
  [
    "kishoreganj",
    "কিশোরগঞ্জ",
  ]
);

addLocations(
  "Kurigram",
  [
    "kurigram",
    "কুড়িগ্রাম",
    "কুড়িগ্রাম",
  ]
);

addLocations(
  "Kushtia",
  [
    "kushtia",
    "কুষ্টিয়া",
    "কুষ্টিয়া",
  ]
);

addLocations(
  "Lakshmipur",
  [
    "lakshmipur",
    "laxmipur",
    "লক্ষ্মীপুর",
  ]
);

addLocations(
  "Lalmonirhat",
  [
    "lalmonirhat",
    "লালমনিরহাট",
  ]
);

addLocations(
  "Madaripur",
  [
    "madaripur",
    "মাদারীপুর",
  ]
);

addLocations(
  "Magura",
  [
    "magura",
    "মাগুরা",
  ]
);

addLocations(
  "Manikganj",
  [
    "manikganj",
    "মানিকগঞ্জ",
  ]
);

addLocations(
  "Meherpur",
  [
    "meherpur",
    "মেহেরপুর",
  ]
);

addLocations(
  "Moulvibazar",
  [
    "moulvibazar",
    "moulvi bazar",
    "maulvibazar",
    "মৌলভীবাজার",
    "মৌলভিবাজার",
  ]
);

addLocations(
  "Munshiganj",
  [
    "munshiganj",
    "মুন্সিগঞ্জ",
  ]
);

addLocations(
  "Mymensingh",
  [
    "mymensingh",
    "ময়মনসিংহ",
    "ময়মনসিংহ",
  ]
);

addLocations(
  "Naogaon",
  [
    "naogaon",
    "নওগাঁ",
    "নওগা",
  ]
);

addLocations(
  "Narail",
  [
    "narail",
    "নড়াইল",
    "নড়াইল",
  ]
);

addLocations(
  "Narayanganj",
  [
    "narayanganj",
    "নারায়ণগঞ্জ",
    "নারায়ণগঞ্জ",
  ]
);

addLocations(
  "Narsingdi",
  [
    "narsingdi",
    "নরসিংদী",
  ]
);

addLocations(
  "Natore",
  [
    "natore",
    "নাটোর",
  ]
);

addLocations(
  "Netrokona",
  [
    "netrokona",
    "netrokona",
    "নেত্রকোনা",
  ]
);

addLocations(
  "Nilphamari",
  [
    "nilphamari",
    "নীলফামারী",
  ]
);

addLocations(
  "Noakhali",
  [
    "noakhali",
    "নোয়াখালী",
    "নোয়াখালী",
  ]
);

addLocations(
  "Pabna",
  [
    "pabna",
    "পাবনা",
  ]
);

addLocations(
  "Panchagarh",
  [
    "panchagarh",
    "পঞ্চগড়",
    "পঞ্চগড়",
  ]
);

addLocations(
  "Patuakhali",
  [
    "patuakhali",
    "পটুয়াখালী",
    "পটুয়াখালী",
  ]
);

addLocations(
  "Pirojpur",
  [
    "pirojpur",
    "পিরোজপুর",
  ]
);

addLocations(
  "Rajbari",
  [
    "rajbari",
    "রাজবাড়ী",
    "রাজবাড়ী",
  ]
);

addLocations(
  "Rajshahi",
  [
    "rajshahi",
    "রাজশাহী",
  ]
);

addLocations(
  "Rangamati",
  [
    "rangamati",
    "রাঙ্গামাটি",
  ]
);

addLocations(
  "Rangpur",
  [
    "rangpur",
    "রংপুর",
  ]
);

addLocations(
  "Satkhira",
  [
    "satkhira",
    "সাতক্ষীরা",
  ]
);

addLocations(
  "Shariatpur",
  [
    "shariatpur",
    "শরীয়তপুর",
    "শরিয়তপুর",
  ]
);

addLocations(
  "Sherpur",
  [
    "sherpur",
    "শেরপুর",
  ]
);

addLocations(
  "Sirajganj",
  [
    "sirajganj",
    "সিরাজগঞ্জ",
  ]
);

addLocations(
  "Sunamganj",
  [
    "sunamganj",
    "সুনামগঞ্জ",
  ]
);

addLocations(
  "Sylhet",
  [
    "sylhet",
    "সিলেট",
  ]
);

addLocations(
  "Tangail",
  [
    "tangail",
    "টাঙ্গাইল",
  ]
);

addLocations(
  "Thakurgaon",
  [
    "thakurgaon",
    "ঠাকুরগাঁও",
  ]
);

addLocations(
  "Dhaka",
  [
    /* =====================================================
       DISTRICT
    ===================================================== */

    "dhaka",
    "ঢাকা",
    "dhaka district",
    "ঢাকা জেলা",

    /* =====================================================
       DHAKA CITY / CENTRAL
    ===================================================== */

    "motijheel",
    "মতিঝিল",

    "paltan",
    "পল্টন",

    "ramna",
    "রমনা",

    "shahbag",
    "শাহবাগ",

    "dhanmondi",
    "ধানমন্ডি",

    "lalbagh",
    "লালবাগ",

    "hazaribagh",
    "হাজারীবাগ",
    "হাজারিবাগ",

    "new market",
    "নিউ মার্কেট",

    "bangshal",
    "বংশাল",

    "sutrapur",
    "সূত্রাপুর",

    "kotwali",
    "কোতোয়ালি",
    "কোতোয়ালি",

    "gandaria",
    "গেন্ডারিয়া",
    "গেন্ডারিয়া",

    "wary",
    "wari",
    "ওয়ারী",
    "ওয়ারী",

    "narinda",
    "নারিন্দা",

    "nawabganj",
    "নবাবগঞ্জ",

    "kamrangirchar",
    "কামরাঙ্গীরচর",

    "chawkbazar",
    "chawk bazar",
    "চকবাজার",

    "bakshibazar",
    "বকশীবাজার",

    /* =====================================================
       MIRPUR / NORTH DHAKA
    ===================================================== */

    "mirpur",
    "মিরপুর",

    "mirpur 1",
    "mirpur 2",
    "mirpur 3",
    "mirpur 6",
    "mirpur 7",
    "mirpur 10",
    "mirpur 11",
    "mirpur 12",
    "mirpur 13",
    "mirpur 14",

    "পল্লবী",
    "pallabi",

    "kazipara",
    "কাজীপাড়া",
    "কাজীপাড়া",

    "shewrapara",
    "শেওড়াপাড়া",
    "শেওড়াপাড়া",

    "agargaon",
    "আগারগাঁও",

    "shyamoli",
    "শ্যামলী",

    "technical",
    "টেকনিক্যাল",

    "darus salam",
    "darussalam",
    "দারুস সালাম",
    "দারুসসালাম",

    "kafrul",
    "কাফরুল",

    "ibrahimpur",
    "ইব্রাহিমপুর",

    "senpara",
    "সেনপাড়া",
    "সেনপাড়া",

    "rupnagar",
    "রূপনগর",

    "duaripara",
    "দুয়ারীপাড়া",
    "দুয়ারীপাড়া",

    "kalshi",
    "কালশী",

    "bauniabadh",
    "baunia badh",
    "বাউনিয়াবাদ",
    "বাউনিয়াবাদ",

    "tolarbag",
    "টোলারবাগ",

    "monipur",
    "monipuripara",
    "মনিপুর",
    "মনিপুরীপাড়া",
    "মনিপুরীপাড়া",

    /* =====================================================
       MOHAMMADPUR / ADABOR
    ===================================================== */

    "mohammadpur",
    "mohammedpur",
    "মোহাম্মদপুর",

    "adabor",
    "আদাবর",

    "basila",
    "বসিলা",

    "bosila",

    "beribadh",
    "beribandh",
    "বেড়িবাঁধ",
    "বেড়িবাঁধ",

    "katashur",
    "কাটাসুর",

    "tajmahal road",
    "taj mahal road",
    "তাজমহল রোড",

    "lalmatia",
    "লালমাটিয়া",
    "লালমাটিয়া",

    "asadh gate",
    "আসাদ গেট",

    "shankar",
    "শংকর",
    "শঙ্কর",

    "jaforabad",
    "জাফরাবাদ",

    "rayerbazar",
    "রায়েরবাজার",
    "রায়েরবাজার",

    "jhigatola",
    "জিগাতলা",

    /* =====================================================
       KHILGAON / RAMPURA / BADDA
    ===================================================== */

    "khilgaon",
    "khailgaon",
    "khilgawon",
    "khil gaon",
    "খিলগাঁও",
    "খিলগাও",

    "khilgaon chowdhury para",
    "khailgaon chowdhury para",
    "chowdhury para",
    "চৌধুরীপাড়া",
    "চৌধুরীপাড়া",

    "tilpapara",
    "তিলপাপাড়া",
    "তিলপাপাড়া",

    "nondipara",
    "নন্দীপাড়া",
    "নন্দীপাড়া",

    "basabo",
    "বাসাবো",

    "goran",
    "গোড়ান",
    "গোরান",

    "mugda",
    "মুগদা",

    "sabujbagh",
    "সবুজবাগ",

    "rampura",
    "রামপুরা",

    "banasree",
    "বনশ্রী",

    "badda",
    "বাদ্দা",

    "middle badda",
    "মধ্য বাড্ডা",
    "মধ্যবাদ্দা",

    "north badda",
    "উত্তর বাড্ডা",

    "south badda",
    "দক্ষিণ বাড্ডা",

    "merul badda",
    "মেরুল বাড্ডা",

    "meradia",
    "মেরাদিয়া",
    "মেরাদিয়া",

    "aftar nagar",
    "aftab nagar",
    "আফতাব নগর",

    "nayatola",
    "নয়াটোলা",
    "নয়াটোলা",

    "mohakhali",
    "মহাখালী",
    "মহাখালি",

    "wireless gate",
    "ওয়্যারলেস গেট",
    "ওয়ারলেস গেট",

    "gulsan",
    "gulshan",
    "গুলশান",

    "gulshan 1",
    "gulshan 2",
    "গুলশান ১",
    "গুলশান ২",

    "banani",
    "বনানী",

    "baridhara",
    "বারিধারা",

    "niketon",
    "নিকেতন",

    "bashundhara",
    "bashundhara r/a",
    "bashundhara residential area",
    "বসুন্ধরা",
    "বসুন্ধরা আবাসিক",

    "vatara",
    "ভাটারা",

    "notun bazar",
    "natun bazar",
    "নতুন বাজার",

    "shahjadpur",
    "শাহজাদপুর",

    "kuril",
    "কুড়িল",
    "কুড়িল",

    "khilkhet",
    "খিলক্ষেত",

    /* =====================================================
       UTTARA / AIRPORT
    ===================================================== */

    "uttara",
    "উত্তরা",

    "uttara sector 1",
    "uttara sector 2",
    "uttara sector 3",
    "uttara sector 4",
    "uttara sector 5",
    "uttara sector 6",
    "uttara sector 7",
    "uttara sector 8",
    "uttara sector 9",
    "uttara sector 10",
    "uttara sector 11",
    "uttara sector 12",
    "uttara sector 13",
    "uttara sector 14",
    "uttara sector 15",
    "uttara sector 16",
    "uttara sector 17",
    "uttara sector 18",

    "airport",
    "air port",
    "হযরত শাহজালাল বিমানবন্দর",
    "বিমানবন্দর",

    "dakkhinkhan",
    "dakshinkhan",
    "দক্ষিণখান",

    "uttarkhan",
    "উত্তরখান",

    "ashkona",
    "আশকোনা",

    "kawla",
    "কাওলা",

    "nikunja",
    "নিকুঞ্জ",

    "jashimuddin",
    "জসীমউদ্দীন",

    "azampur",
    "আজমপুর",

    "house building",
    "হাউজ বিল্ডিং",

    "diabari",
    "দিয়াবাড়ি",
    "দিয়াবাড়ি",

    /* =====================================================
       TEJGAON / FARMGATE
    ===================================================== */

    "tejgaon",
    "তেজগাঁও",
    "তেজগাও",

    "farmgate",
    "farm gate",
    "ফার্মগেট",

    "karwan bazar",
    "kawran bazar",
    "কাওরান বাজার",

    "panthapath",
    "পান্থপথ",

    "hatirpool",
    "হাতিরপুল",

    "kathalbagan",
    "কাঁঠালবাগান",
    "কাঠালবাগান",

    "banglamotor",
    "বাংলামোটর",

    "moghbazar",
    "মগবাজার",

    "malibagh",
    "মালিবাগ",

    "shantinagar",
    "শান্তিনগর",

    "rajarbagh",
    "রাজাবাগ",

    "maghbazar",
    "মগবাজার",

    /* =====================================================
       JATRABARI / DEMRA
    ===================================================== */

    "jatrabari",
    "যাত্রাবাড়ী",
    "যাত্রাবাড়ী",

    "demra",
    "ডেমরা",

    "sarulia",
    "সারুলিয়া",
    "সারুলিয়া",

    "konapara",
    "কোনাপাড়া",
    "কোনাপাড়া",

    "shanir akhra",
    "shanirakhra",
    "শনির আখড়া",
    "শনির আখড়া",

    "kajla",
    "কাজলা",

    "donia",
    "দনিয়া",
    "দনিয়া",

    "shampur",
    "শ্যামপুর",

    "postagola",
    "পোস্তগোলা",

    /* =====================================================
       OLD DHAKA
    ===================================================== */

    "azimpur",
    "আজিমপুর",

    "elephant road",
    "এলিফ্যান্ট রোড",

    "nilkhet",
    "নীলক্ষেত",

    "katabon",
    "কাঁটাবন",
    "কাটাবন",

    "banglabazar",
    "বাংলাবাজার",

    "islampur",
    "ইসলামপুর",

    "sadarghat",
    "সদরঘাট",

    "mitford",
    "মিটফোর্ড",

    "shankhari bazar",
    "শাঁখারীবাজার",
    "শাঁখারিবাজার",

    /* =====================================================
       DHAKA DISTRICT UPAZILAS
    ===================================================== */

    "savar",
    "সাভার",

    "ashulia",
    "আশুলিয়া",
    "আশুলিয়া",

    "dhamrai",
    "ধামরাই",

    "keraniganj",
    "কেরানীগঞ্জ",
    "কেরানিগঞ্জ",

    "dohar",
    "দোহার",

    "nawabganj dhaka",
    "নবাবগঞ্জ ঢাকা"
  ]
);

/* =========================================================
   GAZIPUR
========================================================= */

addLocations(
  "Gazipur",
  [
    "gazipur sadar",
    "গাজীপুর সদর",

    "kaliakair",
    "কালিয়াকৈর",
    "কালিয়াকৈর",

    "kaliganj gazipur",
    "কালীগঞ্জ গাজীপুর",

    "kapasia",
    "কাপাসিয়া",
    "কাপাসিয়া",

    "sreepur gazipur",
    "শ্রীপুর গাজীপুর",

    "joydebpur",
    "জয়দেবপুর",
    "জয়দেবপুর",

    "konabari",
    "কোনাবাড়ী",
    "কোনাবাড়ী",

    "board bazar",
    "বোর্ড বাজার",
  ]
);

/* =========================================================
   NARAYANGANJ
========================================================= */

addLocations(
  "Narayanganj",
  [
    "narayanganj sadar",
    "নারায়ণগঞ্জ সদর",
    "নারায়ণগঞ্জ সদর",

    "fatullah",
    "ফতুল্লা",

    "siddhirganj",
    "সিদ্ধিরগঞ্জ",

    "bandar narayanganj",
    "বন্দর নারায়ণগঞ্জ",

    "rupganj",
    "রূপগঞ্জ",

    "sonargaon",
    "সোনারগাঁও",

    "khanpur",
    "খানপুর",
  ]
);

/* =========================================================
   NARSINGDI
========================================================= */

addLocations(
  "Narsingdi",
  [
    "narsingdi sadar",
    "নরসিংদী সদর",

    "belabo",
    "বেলাবো",

    "monohardi",
    "মনোহরদী",

    "palash",
    "পলাশ",

    "raipura",
    "রায়পুরা",
    "রায়পুরা",

    "shibpur narsingdi",
    "শিবপুর নরসিংদী",
  ]
);

/* =========================================================
   MUNSHIGANJ
========================================================= */

addLocations(
  "Munshiganj",
  [
    "munshiganj sadar",
    "মুন্সিগঞ্জ সদর",

    "gazaria",
    "গজারিয়া",
    "গজারিয়া",

    "lohajang",
    "লোহজং",

    "sirajdikhan",
    "সিরাজদিখান",

    "sreenagar",
    "শ্রীনগর",

    "tongibari",
    "টংগীবাড়ী",
    "টংগীবাড়ী",
  ]
);

/* =========================================================
   MANIKGANJ
========================================================= */

addLocations(
  "Manikganj",
  [
    "manikganj sadar",
    "মানিকগঞ্জ সদর",

    "singair",
    "সিংগাইর",

    "shibalaya",
    "শিবালয়",
    "শিবালয়",

    "ghior",
    "ঘিওর",

    "harirampur",
    "হরিরামপুর",

    "saturia",
    "সাটুরিয়া",
    "সাটুরিয়া",
  ]
);

/* =========================================================
   FARIDPUR
========================================================= */

addLocations(
  "Faridpur",
  [
    "faridpur sadar",
    "ফরিদপুর সদর",

    "bhanga",
    "ভাঙ্গা",

    "boalmari",
    "বোয়ালমারী",
    "বোয়ালমারি",
    "বোয়ালমারী",

    "madhukhali",
    "মধুখালী",

    "nagarkanda",
    "নগরকান্দা",

    "sadarpur",
    "সদরপুর",

    "char bhadrasan",
    "চরভদ্রাসন",

    "alfadanga",
    "আলফাডাঙ্গা",

    "saltha",
    "সালথা",
  ]
);

/* =========================================================
   GOPALGANJ
========================================================= */

addLocations(
  "Gopalganj",
  [
    "gopalganj sadar",
    "গোপালগঞ্জ সদর",

    "kashiani",
    "কাশিয়ানী",
    "কাশিয়ানি",

    "kotalipara",
    "কোটালীপাড়া",
    "কোটালীপাড়া",

    "muksudpur",
    "মুকসুদপুর",

    "tungipara",
    "টুঙ্গিপাড়া",
    "টুঙ্গিপাড়া",
  ]
);

/* =========================================================
   MADARIPUR
========================================================= */

addLocations(
  "Madaripur",
  [
    "madaripur sadar",
    "মাদারীপুর সদর",

    "kalkini",
    "কালকিনি",

    "rajoir",
    "রাজৈর",

    "shibchar",
    "শিবচর",
  ]
);

/* =========================================================
   RAJBARI
========================================================= */

addLocations(
  "Rajbari",
  [
    "rajbari sadar",
    "রাজবাড়ী সদর",
    "রাজবাড়ী সদর",

    "goalanda",
    "গোয়ালন্দ",
    "গোয়ালন্দ",

    "kalukhali",
    "কালুখালী",

    "pangsha",
    "পাংশা",

    "baliakandi",
    "বালিয়াকান্দি",
    "বালিয়াকান্দি",
  ]
);

/* =========================================================
   SHARIATPUR
========================================================= */

addLocations(
  "Shariatpur",
  [
    "shariatpur sadar",
    "শরীয়তপুর সদর",
    "শরিয়তপুর সদর",

    "bhedarganj",
    "ভেদরগঞ্জ",

    "damudya",
    "ডামুড্যা",

    "gosairhat",
    "গোসাইরহাট",

    "naria",
    "নড়িয়া",
    "নড়িয়া",

    "zajira",
    "জাজিরা",
  ]
);

/* =========================================================
   CHITTAGONG / CHATTOGRAM
========================================================= */

addLocations(
  "Chattogram",
  [
    "chattogram sadar",
    "chittagong sadar",
    "চট্টগ্রাম সদর",

    "agrabad",
    "আগ্রাবাদ",

    "halishahar",
    "হালিশহর",

    "pahartali",
    "পাহাড়তলী",
    "পাহাড়তলী",

    "panchlaish",
    "পাঁচলাইশ",

    "kotwali chattogram",
    "কোতোয়ালি চট্টগ্রাম",

    "double mooring",
    "ডাবলমুরিং",

    "patenga",
    "পতেঙ্গা",

    "bakalia",
    "বাকলিয়া",
    "বাকলিয়া",

    "chandgaon",
    "চাঁদগাঁও",

    "bayezid",
    "bayazid",
    "বায়েজিদ",
    "বায়েজিদ",

    "anwara",
    "আনোয়ারা",
    "আনোয়ারা",

    "banshkhali",
    "বাঁশখালী",

    "boalkhali",
    "বোয়ালখালী",
    "বোয়ালখালি",

    "chandanaish",
    "চন্দনাইশ",

    "fatikchhari",
    "ফটিকছড়ি",
    "ফটিকছড়ি",

    "hathazari",
    "হাটহাজারী",

    "lohagara chattogram",
    "লোহাগাড়া চট্টগ্রাম",
    "লোহাগাড়া চট্টগ্রাম",

    "mirsharai",
    "মীরসরাই",

    "patiya",
    "পটিয়া",
    "পটিয়া",

    "rangunia",
    "রাঙ্গুনিয়া",
    "রাঙ্গুনিয়া",

    "raozan",
    "রাউজান",

    "rangamati",
    "রাঙ্গামাটি",

    "sandwip",
    "সন্দ্বীপ",

    "satkania",
    "সাতকানিয়া",
    "সাতকানিয়া",

    "sitakunda",
    "সীতাকুণ্ড",

    "karnafuli",
    "কর্ণফুলী",
  ]
);

/* =========================================================
   COX'S BAZAR
========================================================= */

addLocations(
  "Cox's Bazar",
  [
    "cox's bazar sadar",
    "কক্সবাজার সদর",

    "chakaria",
    "চকরিয়া",
    "চকরিয়া",

    "teknaf",
    "টেকনাফ",

    "ukhiya",
    "উখিয়া",
    "উখিয়া",

    "ramu",
    "রামু",

    "pekua",
    "পেকুয়া",
    "পেকুয়া",

    "maheshkhali",
    "মহেশখালী",

    "kutubdia",
    "কুতুবদিয়া",
    "কুতুবদিয়া",
  ]
);

/* =========================================================
   CUMILLA
========================================================= */

addLocations(
  "Cumilla",
  [
    "cumilla sadar",
    "comilla sadar",
    "কুমিল্লা সদর",

    "barura",
    "বরুড়া",
    "বরুড়া",

    "brahmanpara",
    "ব্রাহ্মণপাড়া",
    "ব্রাহ্মণপাড়া",

    "burichang",
    "বুড়িচং",
    "বুড়িচং",

    "chandina",
    "চান্দিনা",

    "chauddagram",
    "চৌদ্দগ্রাম",

    "daudkandi",
    "দাউদকান্দি",

    "debidwar",
    "দেবিদ্বার",

    "homna",
    "হোমনা",

    "laksam",
    "লাকসাম",

    "muradnagar",
    "মুরাদনগর",

    "nangalkot",
    "নাঙ্গলকোট",

    "titas",
    "তিতাস",

    "meghna cumilla",
    "মেঘনা কুমিল্লা",

    "monoharganj",
    "মনোহরগঞ্জ",

    "lalmai",
    "লালমাই",
  ]
);

/* =========================================================
   FENI
========================================================= */

addLocations(
  "Feni",
  [
    "feni sadar",
    "ফেনী সদর",

    "chhagalnaiya",
    "ছাগলনাইয়া",
    "ছাগলনাইয়া",

    "daganbhuiyan",
    "দাগনভূঞা",

    "fulgazi",
    "ফুলগাজী",

    "parshuram",
    "পরশুরাম",

    "sonagazi",
    "সোনাগাজী",
  ]
);

/* =========================================================
   NOAKHALI
========================================================= */

addLocations(
  "Noakhali",
  [
    "noakhali sadar",
    "নোয়াখালী সদর",
    "নোয়াখালী সদর",

    "begumganj",
    "বেগমগঞ্জ",

    "chatkhil",
    "চাটখিল",

    "companiganj",
    "কোম্পানীগঞ্জ",

    "hatiya",
    "হাতিয়া",
    "হাতিয়া",

    "kabirhat",
    "কবিরহাট",

    "senbagh",
    "সেনবাগ",

    "sonaimguri",
    "সোনাইমুড়ী",
    "সোনাইমুড়ী",

    "subarnachar",
    "সুবর্ণচর",
  ]
);

/* =========================================================
   LAKSHMIPUR
========================================================= */

addLocations(
  "Lakshmipur",
  [
    "lakshmipur sadar",
    "লক্ষ্মীপুর সদর",

    "raipur lakshmipur",
    "রায়পুর লক্ষ্মীপুর",
    "রায়পুর লক্ষ্মীপুর",

    "ramganj",
    "রামগঞ্জ",

    "ramgati",
    "রামগতি",

    "kamalnagar",
    "কমলনগর",
  ]
);

/* =========================================================
   BRAHMANBARIA
========================================================= */

addLocations(
  "Brahmanbaria",
  [
    "akhaura",
    "আখাউড়া",
    "আখাউড়া",

    "ashuganj",
    "আশুগঞ্জ",

    "bancharampur",
    "বাঞ্ছারামপুর",

    "bijoynagar",
    "বিজয়নগর",
    "বিজয়নগর",

    "kasba",
    "কসবা",

    "nabinagar",
    "নবীনগর",

    "nasirnagar",
    "নাসিরনগর",

    "sarail",
    "সরাইল",
  ]
);

/* =========================================================
   CHANDPUR
========================================================= */

addLocations(
  "Chandpur",
  [
    "chandpur sadar",
    "চাঁদপুর সদর",

    "faridganj",
    "ফরিদগঞ্জ",

    "haimchar",
    "হাইমচর",

    "hajiganj",
    "হাজীগঞ্জ",

    "kachua chandpur",
    "কচুয়া চাঁদপুর",
    "কচুয়া চাঁদপুর",

    "matlab",
    "মতলব",

    "shahrasti",
    "শাহরাস্তি",
  ]
);

/* =========================================================
   RAJSHAHI
========================================================= */

addLocations(
  "Rajshahi",
  [
    "rajshahi sadar",
    "রাজশাহী সদর",

    "bagha",
    "বাঘা",

    "bagmara",
    "বাগমারা",

    "charghat",
    "চারঘাট",

    "durgapur rajshahi",
    "দুর্গাপুর রাজশাহী",

    "godagari",
    "গোদাগাড়ী",
    "গোদাগাড়ী",

    "mohanpur rajshahi",
    "মোহনপুর রাজশাহী",

    "paba",
    "পবা",

    "puthia",
    "পুঠিয়া",
    "পুঠিয়া",

    "tanore",
    "তানোর",
  ]
);

/* =========================================================
   NATORE
========================================================= */

addLocations(
  "Natore",
  [
    "natore sadar",
    "নাটোর সদর",

    "bagatipara",
    "বাগাতিপাড়া",
    "বাগাতিপাড়া",

    "baraigram",
    "বড়াইগ্রাম",
    "বড়াইগ্রাম",

    "gurudaspur",
    "গুরুদাসপুর",

    "lalpur",
    "লালপুর",

    "singra",
    "সিংড়া",
    "সিংড়া",

    "naldanga",
    "নলডাঙ্গা",
  ]
);

/* =========================================================
   PABNA
========================================================= */

addLocations(
  "Pabna",
  [
    "pabna sadar",
    "পাবনা সদর",

    "atgharia",
    "আটঘরিয়া",
    "আটঘরিয়া",

    "bera",
    "বেড়া",
    "বেড়া",

    "bhangura",
    "ভাঙ্গুড়া",
    "ভাঙ্গুড়া",

    "chatmohar",
    "চাটমোহর",

    "faridpur pabna",
    "ফরিদপুর পাবনা",

    "ishwardi",
    "ঈশ্বরদী",

    "santhia",
    "সাঁথিয়া",
    "সাঁথিয়া",

    "sujanagar",
    "সুজানগর",
  ]
);

/* =========================================================
   BOGURA
========================================================= */

addLocations(
  "Bogura",
  [
    "bogura sadar",
    "bogra sadar",
    "বগুড়া সদর",
    "বগুড়া সদর",

    "adamdighi",
    "আদমদীঘি",

    "dhunat",
    "ধুনট",

    "dhupchanchia",
    "দুপচাঁচিয়া",
    "দুপচাঁচিয়া",

    "gabtali",
    "গাবতলী",

    "kahaloo",
    "কাহালু",

    "nandigram",
    "নন্দীগ্রাম",

    "sariakandi",
    "সারিয়াকান্দি",
    "সারিয়াকান্দি",

    "shajahanpur",
    "শাজাহানপুর",

    "sherpur bogura",
    "শেরপুর বগুড়া",
    "শেরপুর বগুড়া",

    "shibganj bogura",
    "শিবগঞ্জ বগুড়া",
    "শিবগঞ্জ বগুড়া",

    "sonatala",
    "সোনাতলা",
  ]
);

/* =========================================================
   SIRAJGANJ
========================================================= */

addLocations(
  "Sirajganj",
  [
    "sirajganj sadar",
    "সিরাজগঞ্জ সদর",

    "belkuchi",
    "বেলকুচি",

    "chauhali",
    "চৌহালী",

    "kamarkhanda",
    "কামারখন্দ",

    "kazipur",
    "কাজীপুর",

    "raiganj sirajganj",
    "রায়গঞ্জ সিরাজগঞ্জ",
    "রায়গঞ্জ সিরাজগঞ্জ",

    "shahjadpur",
    "শাহজাদপুর",

    "tarash",
    "তাড়াশ",
    "তাড়াশ",

    "ullapara",
    "উল্লাপাড়া",
    "উল্লাপাড়া",
  ]
);

/* =========================================================
   RANGPUR
========================================================= */

addLocations(
  "Rangpur",
  [
    "rangpur sadar",
    "রংপুর সদর",

    "badarganj",
    "বদরগঞ্জ",

    "gangachara",
    "গঙ্গাচড়া",
    "গঙ্গাচড়া",

    "kaunia",
    "কাউনিয়া",
    "কাউনিয়া",

    "mithapukur",
    "মিঠাপুকুর",

    "pirgachha",
    "পীরগাছা",

    "pirganj rangpur",
    "পীরগঞ্জ রংপুর",

    "taraganj",
    "তারাগঞ্জ",
  ]
);

/* =========================================================
   DINAJPUR
========================================================= */

addLocations(
  "Dinajpur",
  [
    "dinajpur sadar",
    "দিনাজপুর সদর",

    "biral",
    "বিরল",

    "birampur",
    "বিরামপুর",

    "birganj",
    "বীরগঞ্জ",

    "bochaganj",
    "বোচাগঞ্জ",

    "chirirbandar",
    "চিরিরবন্দর",

    "fulbari dinajpur",
    "ফুলবাড়ী দিনাজপুর",

    "ghoraghat",
    "ঘোড়াঘাট",
    "ঘোড়াঘাট",

    "hakimpur",
    "হাকিমপুর",

    "kaharole",
    "কাহারোল",

    "khansama",
    "খানসামা",

    "nawabganj dinajpur",
    "নবাবগঞ্জ দিনাজপুর",

    "parbatipur",
    "পার্বতীপুর",
  ]
);

/* =========================================================
   THAKURGAON
========================================================= */

addLocations(
  "Thakurgaon",
  [
    "thakurgaon sadar",
    "ঠাকুরগাঁও সদর",

    "baliadangi",
    "বালিয়াডাঙ্গী",
    "বালিয়াডাঙ্গী",

    "haripur thakurgaon",
    "হরিপুর ঠাকুরগাঁও",

    "pirganj thakurgaon",
    "পীরগঞ্জ ঠাকুরগাঁও",

    "ranisankail",
    "রাণীশংকৈল",
  ]
);

/* =========================================================
   PANCHAGARH
========================================================= */

addLocations(
  "Panchagarh",
  [
    "panchagarh sadar",
    "পঞ্চগড় সদর",
    "পঞ্চগড় সদর",

    "atwari",
    "আটোয়ারী",
    "আটোয়ারী",

    "boda",
    "বোদা",

    "debiganj",
    "দেবীগঞ্জ",

    "tetulia",
    "তেঁতুলিয়া",
    "তেঁতুলিয়া",
  ]
);

/* =========================================================
   NILPHAMARI
========================================================= */

addLocations(
  "Nilphamari",
  [
    "nilphamari sadar",
    "নীলফামারী সদর",

    "dimla",
    "ডিমলা",

    "domar",
    "ডোমার",

    "jaldhaka",
    "জলঢাকা",

    "kishoreganj nilphamari",
    "কিশোরগঞ্জ নীলফামারী",

    "saidpur",
    "সৈয়দপুর",
    "সৈয়দপুর",
  ]
);

/* =========================================================
   KURIGRAM
========================================================= */

addLocations(
  "Kurigram",
  [
    "kurigram sadar",
    "কুড়িগ্রাম সদর",
    "কুড়িগ্রাম সদর",

    "bhurungamari",
    "ভূরুঙ্গামারী",

    "char rajibpur",
    "চর রাজিবপুর",

    "chilmari",
    "চিলমারী",

    "fulbari kurigram",
    "ফুলবাড়ী কুড়িগ্রাম",
    "ফুলবাড়ী কুড়িগ্রাম",

    "nageshwari",
    "নাগেশ্বরী",

    "phulbari kurigram",

    "rajarhat",
    "রাজারহাট",

    "raoumari",
    "roumari",
    "রৌমারী",

    "ulipur",
    "উলিপুর",
  ]
);

/* =========================================================
   LALMONIRHAT
========================================================= */

addLocations(
  "Lalmonirhat",
  [
    "lalmonirhat sadar",
    "লালমনিরহাট সদর",

    "aditmari",
    "আদিতমারী",

    "hatibandha",
    "হাতীবান্ধা",

    "kaliganj lalmonirhat",
    "কালীগঞ্জ লালমনিরহাট",

    "patgram",
    "পাটগ্রাম",
  ]
);

/* =========================================================
   GAIBANDHA
========================================================= */

addLocations(
  "Gaibandha",
  [
    "gaibandha sadar",
    "গাইবান্ধা সদর",

    "fulchhari",
    "ফুলছড়ি",
    "ফুলছড়ি",

    "gobindaganj",
    "গোবিন্দগঞ্জ",

    "palashbari",
    "পলাশবাড়ী",
    "পলাশবাড়ী",

    "sadullapur",
    "সাদুল্লাপুর",

    "saghata",
    "সাঘাটা",

    "sundarganj",
    "সুন্দরগঞ্জ",
  ]
);

/* =========================================================
   KHULNA
========================================================= */

addLocations(
  "Khulna",
  [
    "khulna sadar",
    "খুলনা সদর",

    "sonadanga",
    "সোনাডাঙ্গা",

    "khalishpur",
    "খালিশপুর",

    "daulatpur khulna",
    "দৌলতপুর খুলনা",

    "dumuria",
    "ডুমুরিয়া",
    "ডুমুরিয়া",

    "batiaghata",
    "বটিয়াঘাটা",
    "বটিয়াঘাটা",

    "dacope",
    "দাকোপ",

    "dighalia",
    "দিঘলিয়া",
    "দিঘলিয়া",

    "koyra",
    "কয়রা",
    "কয়রা",

    "paikgachha",
    "পাইকগাছা",

    "phultala",
    "ফুলতলা",

    "rupsa",
    "রূপসা",

    "terokhada",
    "তেরখাদা",
  ]
);

/* =========================================================
   JASHORE
========================================================= */

addLocations(
  "Jashore",
  [
    "jashore sadar",
    "jessore sadar",
    "যশোর সদর",

    "abag",
    "অভয়নগর",
    "অভয়নগর",

    "bagherpara",
    "বাঘারপাড়া",
    "বাঘারপাড়া",

    "chaugachha",
    "চৌগাছা",

    "jhikargachha",
    "ঝিকরগাছা",

    "keshabpur",
    "কেশবপুর",

    "manirampur",
    "মনিরামপুর",

    "sharsha",
    "শার্শা",
  ]
);

/* =========================================================
   SATKHIRA
========================================================= */

addLocations(
  "Satkhira",
  [
    "satkhira sadar",
    "সাতক্ষীরা সদর",

    "assasuni",
    "আশাশুনি",

    "debhata",
    "দেবহাটা",

    "kalaroa",
    "কলারোয়া",
    "কলারোয়া",

    "kaliganj satkhira",
    "কালীগঞ্জ সাতক্ষীরা",

    "shyamnagar",
    "শ্যামনগর",

    "tala",
    "তালা",
  ]
);

/* =========================================================
   BAGERHAT
========================================================= */

addLocations(
  "Bagerhat",
  [
    "bagerhat sadar",
    "বাগেরহাট সদর",

    "chitalmari",
    "চিতলমারী",

    "fakirhat",
    "ফকিরহাট",

    "kachua bagerhat",
    "কচুয়া বাগেরহাট",
    "কচুয়া বাগেরহাট",

    "mollahat",
    "মোল্লাহাট",

    "mongla",
    "মোংলা",

    "morrelganj",
    "মোরেলগঞ্জ",

    "rampal",
    "রামপাল",

    "sarankhola",
    "শরণখোলা",
  ]
);

/* =========================================================
   JHENAIDAH
========================================================= */

addLocations(
  "Jhenaidah",
  [
    "jhenaidah sadar",
    "ঝিনাইদহ সদর",

    "harinakunda",
    "হরিণাকুণ্ডু",

    "kaliganj jhenaidah",
    "কালীগঞ্জ ঝিনাইদহ",

    "kotchandpur",
    "কোটচাঁদপুর",

    "maheshpur",
    "মহেশপুর",

    "shailkupa",
    "শৈলকুপা",
  ]
);

/* =========================================================
   KUSHTIA
========================================================= */

addLocations(
  "Kushtia",
  [
    "kushtia sadar",
    "কুষ্টিয়া সদর",
    "কুষ্টিয়া সদর",

    "bheramara",
    "ভেড়ামারা",
    "ভেড়ামারা",

    "daulatpur kushtia",
    "দৌলতপুর কুষ্টিয়া",
    "দৌলতপুর কুষ্টিয়া",

    "khoksa",
    "খোকসা",

    "kumarkhali",
    "কুমারখালী",

    "mirpur kushtia",
    "মিরপুর কুষ্টিয়া",
    "মিরপুর কুষ্টিয়া",
  ]
);

/* =========================================================
   MAGURA
========================================================= */

addLocations(
  "Magura",
  [
    "magura sadar",
    "মাগুরা সদর",

    "mohammadpur magura",
    "মোহাম্মদপুর মাগুরা",

    "shalikha",
    "শালিখা",

    "sreepur magura",
    "শ্রীপুর মাগুরা",
  ]
);

/* =========================================================
   NARAIL
========================================================= */

addLocations(
  "Narail",
  [
    "narail sadar",
    "নড়াইল সদর",
    "নড়াইল সদর",

    "kalia",
    "কালিয়া",
    "কালিয়া",

    "lohagara narail",
    "লোহাগড়া নড়াইল",
    "লোহাগড়া নড়াইল",
  ]
);

/* =========================================================
   BARISHAL
========================================================= */

addLocations(
  "Barishal",
  [
    "barishal sadar",
    "barisal sadar",
    "বরিশাল সদর",

    "agailjhara",
    "আগৈলঝাড়া",
    "আগৈলঝাড়া",

    "babuganj",
    "বাবুগঞ্জ",

    "bakerganj",
    "বাকেরগঞ্জ",

    "banaripara",
    "বানারীপাড়া",
    "বানারীপাড়া",

    "gaurnadi",
    "গৌরনদী",

    "hizla",
    "হিজলা",

    "mehendiganj",
    "মেহেন্দিগঞ্জ",

    "muladi",
    "মুলাদী",
    "মুলাদি",

    "wazirpur",
    "উজিরপুর",
  ]
);

/* =========================================================
   BHOLA
========================================================= */

addLocations(
  "Bhola",
  [
    "bhola sadar",
    "ভোলা সদর",

    "burhanuddin",
    "বোরহানউদ্দিন",

    "char fashion",
    "চরফ্যাশন",

    "daulatkhan",
    "দৌলতখান",

    "lalmoha",
    "লালমোহন",

    "manpura",
    "মনপুরা",

    "tazumuddin",
    "তজুমদ্দিন",
  ]
);

/* =========================================================
   JHALOKATHI
========================================================= */

addLocations(
  "Jhalokathi",
  [
    "jhalokathi sadar",
    "ঝালকাঠি সদর",

    "kathalia",
    "কাঁঠালিয়া",
    "কাঁঠালিয়া",

    "nalchity",
    "নলছিটি",

    "rajapur jhalokathi",
    "রাজাপুর ঝালকাঠি",
  ]
);

/* =========================================================
   PIROJPUR
========================================================= */

addLocations(
  "Pirojpur",
  [
    "pirojpur sadar",
    "পিরোজপুর সদর",

    "bhandaria",
    "ভান্ডারিয়া",
    "ভান্ডারিয়া",

    "kawkhali",
    "কাউখালী",

    "mathbaria",
    "মঠবাড়িয়া",
    "মঠবাড়িয়া",

    "nazirpur",
    "নাজিরপুর",

    "nesarabad",
    "নেছারাবাদ",

    "swarupkathi",
    "স্বরূপকাঠি",
  ]
);

/* =========================================================
   PATUAKHALI
========================================================= */

addLocations(
  "Patuakhali",
  [
    "patuakhali sadar",
    "পটুয়াখালী সদর",
    "পটুয়াখালী সদর",

    "bauphal",
    "বাউফল",

    "dashmina",
    "দশমিনা",

    "dumki",
    "দুমকি",

    "galachipa",
    "গলাচিপা",

    "kalapara",
    "কলাপাড়া",
    "কলাপাড়া",

    "mirzaganj",
    "মির্জাগঞ্জ",

    "rangabali",
    "রাঙ্গাবালী",
  ]
);

/* =========================================================
   BARGUNA
========================================================= */

addLocations(
  "Barguna",
  [
    "barguna sadar",
    "বরগুনা সদর",

    "amtali",
    "আমতলী",

    "bamna",
    "বামনা",

    "betagi",
    "বেতাগী",

    "patharghata",
    "পাথরঘাটা",

    "taltali",
    "তালতলী",
  ]
);

/* =========================================================
   SYLHET
========================================================= */

addLocations(
  "Sylhet",
  [
    "sylhet sadar",
    "সিলেট সদর",

    "beanibazar",
    "বিয়ানীবাজার",
    "বিয়ানীবাজার",

    "balaganj",
    "বালাগঞ্জ",

    "bishwanath",
    "বিশ্বনাথ",

    "companiganj sylhet",
    "কোম্পানীগঞ্জ সিলেট",

    "fenchuganj",
    "ফেঞ্চুগঞ্জ",

    "golapganj",
    "গোলাপগঞ্জ",

    "gowainghat",
    "গোয়াইনঘাট",
    "গোয়াইনঘাট",

    "jaintiapur",
    "জৈন্তাপুর",

    "kanaighat",
    "কানাইঘাট",

    "osmani nagar",
    "ওসমানীনগর",

    "zakiganj",
    "জকিগঞ্জ",
  ]
);

/* =========================================================
   MOULVIBAZAR
========================================================= */

addLocations(
  "Moulvibazar",
  [
    "moulvibazar sadar",
    "মৌলভীবাজার সদর",

    "barlekha",
    "বড়লেখা",
    "বড়লেখা",

    "juri",
    "জুড়ী",
    "জুড়ী",

    "kamalganj",
    "কমলগঞ্জ",

    "kulaura",
    "কুলাউড়া",
    "কুলাউড়া",

    "rajnagar",
    "রাজনগর",

    "sreemangal",
    "শ্রীমঙ্গল",
  ]
);

/* =========================================================
   HABIGANJ
========================================================= */

addLocations(
  "Habiganj",
  [
    "habiganj sadar",
    "হবিগঞ্জ সদর",

    "ajmiriganj",
    "আজমিরীগঞ্জ",

    "bahubal",
    "বাহুবল",

    "baniyachong",
    "বানিয়াচং",
    "বানিয়াচং",

    "chunarughat",
    "চুনারুঘাট",

    "lakhai",
    "লাখাই",

    "madhabpur",
    "মাধবপুর",

    "nabiganj",
    "নবীগঞ্জ",

    "shayestaganj",
    "শায়েস্তাগঞ্জ",
    "শায়েস্তাগঞ্জ",
  ]
);

/* =========================================================
   SUNAMGANJ
========================================================= */

addLocations(
  "Sunamganj",
  [
    "sunamganj sadar",
    "সুনামগঞ্জ সদর",

    "bishwambharpur",
    "বিশ্বম্ভরপুর",

    "chhatak",
    "ছাতক",

    "derai",
    "দিরাই",

    "dharampasha",
    "ধর্মপাশা",

    "dowarabazar",
    "দোয়ারাবাজার",
    "দোয়ারাবাজার",

    "jagannathpur",
    "জগন্নাথপুর",

    "jamalganj",
    "জামালগঞ্জ",

    "shalla",
    "শাল্লা",

    "tahirpur",
    "তাহিরপুর",
  ]
);

/* =========================================================
   MYMENSINGH
========================================================= */

addLocations(
  "Mymensingh",
  [
    "mymensingh sadar",
    "ময়মনসিংহ সদর",
    "ময়মনসিংহ সদর",

    "bhaluka",
    "ভালুকা",

    "dhobaura",
    "ধোবাউড়া",
    "ধোবাউড়া",

    "fulbaria mymensingh",
    "ফুলবাড়িয়া ময়মনসিংহ",
    "ফুলবাড়িয়া ময়মনসিংহ",

    "gaffargaon",
    "গফরগাঁও",

    "gauripur",
    "গৌরীপুর",

    "haluaghat",
    "হালুয়াঘাট",
    "হালুয়াঘাট",

    "ishwarganj",
    "ঈশ্বরগঞ্জ",

    "muktagachha",
    "মুক্তাগাছা",

    "nandail",
    "নান্দাইল",

    "phulpur",
    "ফুলপুর",

    "trishal",
    "ত্রিশাল",
  ]
);

/* =========================================================
   JAMALPUR
========================================================= */

addLocations(
  "Jamalpur",
  [
    "jamalpur sadar",
    "জামালপুর সদর",

    "bakshiganj",
    "বকশীগঞ্জ",

    "dewanganj",
    "দেওয়ানগঞ্জ",
    "দেওয়ানগঞ্জ",

    "islampur jamalpur",
    "ইসলামপুর জামালপুর",

    "madarganj",
    "মাদারগঞ্জ",

    "melandaha",
    "মেলান্দহ",

    "sarishabari",
    "সরিষাবাড়ী",
    "সরিষাবাড়ী",
  ]
);

/* =========================================================
   NETROKONA
========================================================= */

addLocations(
  "Netrokona",
  [
    "netrokona sadar",
    "নেত্রকোনা সদর",

    "atpara",
    "আটপাড়া",
    "আটপাড়া",

    "barhatta",
    "বারহাট্টা",

    "durgapur netrokona",
    "দুর্গাপুর নেত্রকোনা",

    "kalmakanda",
    "কলমাকান্দা",

    "kendua",
    "কেন্দুয়া",
    "কেন্দুয়া",

    "khaliajuri",
    "খালিয়াজুরী",
    "খালিয়াজুরী",

    "madan",
    "মদন",

    "mohanganj",
    "মোহনগঞ্জ",

    "purbadhala",
    "পূর্বধলা",
  ]
);

/* =========================================================
   SHERPUR
========================================================= */

addLocations(
  "Sherpur",
  [
    "sherpur sadar",
    "শেরপুর সদর",

    "jhenaigati",
    "ঝিনাইগাতী",

    "nakla",
    "নকলা",

    "nalitabari",
    "নালিতাবাড়ী",
    "নালিতাবাড়ী",

    "sreebardi",
    "শ্রীবরদী",
  ]
);

/* =========================================================
   TANGAIL
========================================================= */

addLocations(
  "Tangail",
  [
    "tangail sadar",
    "টাঙ্গাইল সদর",

    "basail",
    "বাসাইল",

    "bhuapur",
    "ভূঞাপুর",

    "delduar",
    "দেলদুয়ার",
    "দেলদুয়ার",

    "dhanbari",
    "ধনবাড়ী",
    "ধনবাড়ী",

    "ghatail",
    "ঘাটাইল",

    "gopalpur tangail",
    "গোপালপুর টাঙ্গাইল",

    "kalihati",
    "কালিহাতী",

    "madhupur",
    "মধুপুর",

    "mirzapur tangail",
    "মির্জাপুর টাঙ্গাইল",

    "nagarpur",
    "নাগরপুর",

    "sakhipur",
    "সখীপুর",
  ]
);

/* =========================================================
   KISHOREGANJ
========================================================= */

addLocations(
  "Kishoreganj",
  [
    "kishoreganj sadar",
    "কিশোরগঞ্জ সদর",

    "austagram",
    "অষ্টগ্রাম",

    "bajitpur",
    "বাজিতপুর",

    "bhairab",
    "ভৈরব",

    "hossainpur",
    "হোসেনপুর",

    "itna",
    "ইটনা",

    "karimganj",
    "করিমগঞ্জ",

    "katiadi",
    "কটিয়াদী",
    "কটিয়াদী",

    "kuliarchar",
    "কুলিয়ারচর",
    "কুলিয়ারচর",

    "mithamain",
    "মিঠামইন",

    "nikli",
    "নিকলী",
    "নিকলি",

    "pakundia",
    "পাকুন্দিয়া",
    "পাকুন্দিয়া",

    "tarail",
    "তাড়াইল",
    "তাড়াইল",
  ]
);

/* =========================================================
   BANDARBAN
========================================================= */

addLocations(
  "Bandarban",
  [
    "bandarban sadar",
    "বান্দরবান সদর",

    "alikadam",
    "আলীকদম",

    "lama",
    "লামা",

    "naikhongchhari",
    "নাইক্ষ্যংছড়ি",
    "নাইক্ষ্যংছড়ি",

    "rowangchhari",
    "রোয়াংছড়ি",
    "রোয়াংছড়ি",

    "ruma",
    "রুমা",

    "thanchi",
    "থানচি",
  ]
);

/* =========================================================
   RANGAMATI
========================================================= */

addLocations(
  "Rangamati",
  [
    "rangamati sadar",
    "রাঙ্গামাটি সদর",

    "baghaichhari",
    "বাঘাইছড়ি",
    "বাঘাইছড়ি",

    "barkal",
    "বরকল",

    "belaichhari",
    "বিলাইছড়ি",
    "বিলাইছড়ি",

    "juraichhari",
    "জুরাছড়ি",
    "জুরাছড়ি",

    "kaptai",
    "কাপ্তাই",

    "kawkhali rangamati",
    "কাউখালী রাঙ্গামাটি",

    "langadu",
    "লংগদু",

    "naniarchar",
    "নানিয়ারচর",
    "নানিয়ারচর",

    "rajasthali",
    "রাজস্থলী",
  ]
);

/* =========================================================
   KHAGRACHHARI
========================================================= */

addLocations(
  "Khagrachhari",
  [
    "khagrachhari sadar",
    "খাগড়াছড়ি সদর",
    "খাগড়াছড়ি সদর",

    "dighinala",
    "দীঘিনালা",

    "guimara",
    "গুইমারা",

    "lakshmichhari",
    "লক্ষ্মীছড়ি",
    "লক্ষ্মীছড়ি",

    "mahalchhari",
    "মহালছড়ি",
    "মহালছড়ি",

    "manikchhari",
    "মানিকছড়ি",
    "মানিকছড়ি",

    "matiranga",
    "মাটিরাঙ্গা",

    "panchhari",
    "পানছড়ি",
    "পানছড়ি",

    "ramgarh",
    "রামগড়",
    "রামগড়",
  ]
);

/* =========================================================
   MEHERPUR
========================================================= */

addLocations(
  "Meherpur",
  [
    "meherpur sadar",
    "মেহেরপুর সদর",

    "gangni",
    "গাংনী",

    "mujibnagar",
    "মুজিবনগর",
  ]
);

/* =========================================================
   ADDRESS / PHONE HELPERS
========================================================= */

function normalizeBangladeshPhone(
  value: string
) {
  let digits =
    value.replace(
      /\D/g,
      ""
    );

  if (
    digits.startsWith("880") &&
    digits.length >= 13
  ) {
    digits =
      `0${digits.slice(3)}`;
  }

  if (
    digits.startsWith("1") &&
    digits.length === 10
  ) {
    digits =
      `0${digits}`;
  }

  if (
    /^01[3-9]\d{8}$/.test(
      digits
    )
  ) {
    return digits;
  }

  return "";
}

function extractPhone(
  text: string
) {
  const matches =
    text.match(
      /(?:\+?880|00880|88)?\s*0?1[3-9](?:[\s-]?\d){8}/g
    ) ?? [];

  for (
    const match of matches
  ) {
    const phone =
      normalizeBangladeshPhone(
        match
      );

    if (
      phone
    ) {
      return phone;
    }
  }

  /*
   * Fallback:
   * Search digit groups.
   */

  const digitGroups =
    text.match(
      /\d[\d\s-]{8,15}\d/g
    ) ?? [];

  for (
    const group of digitGroups
  ) {
    const phone =
      normalizeBangladeshPhone(
        group
      );

    if (
      phone
    ) {
      return phone;
    }
  }

  return "";
}

function looksLikePhoneLine(
  line: string
) {
  return Boolean(
    extractPhone(line)
  );
}

/* =========================================================
   LABEL EXTRACTION
========================================================= */

function getLabelValue(
  line: string,
  labels: string[]
) {
  const normalizedLine =
    normalizeText(
      line
    );

  for (
    const label of labels
  ) {
    const normalizedLabel =
      normalizeText(
        label
      );

    if (
      normalizedLine ===
      normalizedLabel
    ) {
      continue;
    }

    if (
      normalizedLine.startsWith(
        normalizedLabel
      )
    ) {
      const originalLower =
        line.toLowerCase();

      const index =
        originalLower.indexOf(
          label.toLowerCase()
        );

      let value = "";

      if (
        index >= 0
      ) {
        value =
          line.slice(
            index +
              label.length
          );
      } else {
        /*
         * Bangla / normalized fallback.
         */

        value =
          line.replace(
            /^[^:：\-–—]+[:：\-–—]*/,
            ""
          );
      }

      value =
        cleanLine(
          value.replace(
            /^[:：\-–—\s]+/,
            ""
          )
        );

      if (
        value
      ) {
        return value;
      }
    }
  }

  return "";
}

/* =========================================================
   LIKELY LABEL
========================================================= */

function isLikelyLabel(
  line: string
) {
  const value =
    normalizeText(
      line
    );

  const labels = [
    "name",
    "customer name",
    "phone",
    "phone number",
    "mobile",
    "mobile number",
    "address",
    "full address",
    "district",
    "thana",
    "upazila",
    "নাম",
    "মোবাইল",
    "ফোন",
    "ঠিকানা",
    "জেলা",
    "থানা",
    "উপজেলা",
  ];

  return labels.some(
    (
      label
    ) =>
      value ===
      normalizeText(
        label
      )
  );
}

/* =========================================================
   DISTRICT DETECTION
========================================================= */

function detectDistrict(
  text: string
): District | "" {
  const normalized =
    normalizeText(
      text
    );

  if (
    !normalized
  ) {
    return "";
  }

  /*
   * Longest location first.
   *
   * This prevents smaller names
   * from matching before a more
   * specific location.
   */

  const entries =
    Array.from(
      LOCATION_TO_DISTRICT.entries()
    ).sort(
      (
        [first],
        [second]
      ) =>
        second.length -
        first.length
    );

  for (
    const [
      location,
      district,
    ] of entries
  ) {
    if (
      normalized.includes(
        location
      )
    ) {
      return district;
    }
  }

  /*
   * Final district fallback.
   */

  for (
    const district of DISTRICTS
  ) {
    if (
      normalized.includes(
        normalizeText(
          district
        )
      )
    ) {
      return district;
    }
  }

  return "";
}

/* =========================================================
   ADDRESS DETECTION
========================================================= */

function looksLikeAddress(
  line: string
) {
  const value =
    normalizeText(
      line
    );

  if (
    !value
  ) {
    return false;
  }

  const keywords = [
    "road",
    "rd",
    "house",
    "flat",
    "floor",
    "building",
    "block",
    "sector",
    "lane",
    "village",
    "para",
    "bazar",
    "market",
    "gate",
    "thana",
    "upazila",
    "union",
    "ward",
    "post",
    "area",
    "district",

    "বাসা",
    "বাড়ি",
    "বাড়ি",
    "রোড",
    "রাস্তা",
    "ফ্ল্যাট",
    "ফ্লোর",
    "ব্লক",
    "সেক্টর",
    "গ্রাম",
    "পাড়া",
    "পাড়া",
    "বাজার",
    "গেট",
    "থানা",
    "উপজেলা",
    "ইউনিয়ন",
    "ইউনিয়ন",
    "ওয়ার্ড",
    "ওয়ার্ড",
    "জেলা",
  ];

  if (
    keywords.some(
      (
        keyword
      ) =>
        value.includes(
          normalizeText(
            keyword
          )
        )
    )
  ) {
    return true;
  }

  /*
   * Known location mapping.
   */

  for (
    const location of LOCATION_TO_DISTRICT.keys()
  ) {
    if (
      value.includes(
        location
      )
    ) {
      return true;
    }
  }

  /*
   * Number + meaningful text.
   *
   * Example:
   *
   * Khilgaon Chowdhury Para 201/b
   */

  if (
    /\d/.test(line) &&
    line.length >= 8
  ) {
    return true;
  }

  /*
   * Comma-separated address.
   */

  if (
    line.includes(",") &&
    line.length >= 8
  ) {
    return true;
  }

  /*
   * Slash is common in house numbers.
   */

  if (
    line.includes("/") &&
    line.length >= 8
  ) {
    return true;
  }

  return false;
}

/* =========================================================
   NAME DETECTION
========================================================= */

function looksLikeName(
  line: string
) {
  const value =
    cleanLine(
      line
    );

  if (
    value.length < 2 ||
    value.length > 70
  ) {
    return false;
  }

  if (
    looksLikePhoneLine(
      value
    )
  ) {
    return false;
  }

  if (
    isLikelyLabel(
      value
    )
  ) {
    return false;
  }

  if (
    looksLikeAddress(
      value
    )
  ) {
    return false;
  }

  const blocked = [
    "message",
    "messenger",
    "facebook",
    "today",
    "yesterday",
    "seen",
    "typing",
    "order",
    "delivery",
    "cod",
    "thanks",
    "thank you",
  ];

  const normalized =
    normalizeText(
      value
    );

  if (
    blocked.includes(
      normalized
    )
  ) {
    return false;
  }

  const digitCount =
    (
      value.match(
        /\d/g
      ) ?? []
    ).length;

  return digitCount <= 1;
}

/* =========================================================
   EXTRACT CUSTOMER NAME
========================================================= */

function extractCustomerName(
  lines: string[]
) {
  /*
   * 1. Explicit labels.
   */

  for (
    const line of lines
  ) {
    const value =
      getLabelValue(
        line,
        [
          "customer name",
          "name",
          "নাম",
        ]
      );

    if (
      value &&
      !looksLikePhoneLine(
        value
      ) &&
      !looksLikeAddress(
        value
      )
    ) {
      return value;
    }
  }

  /*
   * 2. First reasonable name.
   */

  for (
    const line of lines
  ) {
    if (
      looksLikeName(
        line
      )
    ) {
      return cleanLine(
        line
      );
    }
  }

  return "";
}

/* =========================================================
   EXTRACT ADDRESS

   Works with:

   Name
   Address
   Phone

   Name
   Phone
   Address

   Phone
   Name
   Address

   Address
   Name
   Phone
========================================================= */

function extractAddress(
  lines: string[],
  customerName: string
) {
  /*
   * 1. Explicit address label.
   */

  for (
    const line of lines
  ) {
    const labeledAddress =
      getLabelValue(
        line,
        [
          "full address",
          "address",
          "ঠিকানা",
        ]
      );

    if (
      labeledAddress
    ) {
      return labeledAddress;
    }
  }

  /*
   * 2. Strong address candidates.
   */

  const candidates:
    string[] = [];

  for (
    const line of lines
  ) {
    const cleaned =
      cleanLine(
        line
      );

    if (
      !cleaned
    ) {
      continue;
    }

    if (
      cleaned ===
      customerName
    ) {
      continue;
    }

    if (
      looksLikePhoneLine(
        cleaned
      )
    ) {
      continue;
    }

    if (
      isLikelyLabel(
        cleaned
      )
    ) {
      continue;
    }

    if (
      looksLikeAddress(
        cleaned
      )
    ) {
      candidates.push(
        cleaned
      );
    }
  }

  if (
    candidates.length > 0
  ) {
    return candidates
      .slice(0, 3)
      .join(", ");
  }

  /*
   * 3. Smart fallback.
   *
   * Any meaningful line that is
   * not the name or phone can
   * still be the address.
   */

  const fallback =
    lines.filter(
      (
        line
      ) => {
        const cleaned =
          cleanLine(
            line
          );

        if (
          !cleaned
        ) {
          return false;
        }

        if (
          cleaned ===
          customerName
        ) {
          return false;
        }

        if (
          looksLikePhoneLine(
            cleaned
          )
        ) {
          return false;
        }

        if (
          isLikelyLabel(
            cleaned
          )
        ) {
          return false;
        }

        return (
          cleaned.length >= 5
        );
      }
    );

  return fallback
    .slice(0, 3)
    .map(
      cleanLine
    )
    .join(", ");
}

/* =========================================================
   PARSE CUSTOMER TEXT
========================================================= */

function parseCustomerText(
  text: string
): ParsedCustomerData {
  const lines =
    text
      .split(
        /\r?\n/
      )
      .map(
        cleanLine
      )
      .filter(
        Boolean
      );

  const phone =
    extractPhone(
      text
    );

  const customerName =
    extractCustomerName(
      lines
    );

  const address =
    extractAddress(
      lines,
      customerName
    );

  /*
   * Detect district from the
   * complete original text first.
   */

  const district =
    detectDistrict(
      [
        text,
        address,
      ]
        .filter(
          Boolean
        )
        .join(
          "\n"
        )
    );

  return {
    customerName:
      cleanLine(
        customerName
      ),

    phone,

    address:
      cleanLine(
        address
      ),

    district,
  };
}

/* =========================================================
   API
========================================================= */

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const text =
      String(
        body?.text ?? ""
      ).trim();

    if (
      !text
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Please provide customer text.",
        },
        {
          status: 400,
        }
      );
    }

    const data =
      parseCustomerText(
        text
      );

    return NextResponse.json(
      {
        success: true,
        data,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "PARSE TEXT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Failed to parse customer information.",
      },
      {
        status: 500,
      }
    );
  }
}