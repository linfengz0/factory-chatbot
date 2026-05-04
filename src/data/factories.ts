import type { Factory } from '../types';

export const factories: Record<string, Factory> = {
  FA17523846: {
    type: 'internal',
    id: '232498330767092327',
    factoryid: 'FA17523846',
    factorystatus: 'Active',
    factoryname: 'LAI FAT FASHION LTD',
    subcategory:
      'TAILOR TOP COAT,SOFTWOVEN 2 PIECES,KNIT OUTERWEAR / JACKET,KNIT 2 PIECES,KNIT 3 PIECES,SUIT 3 PIECE,SUIT OTHERS,BLOUSE,SKIRT,SOFT WOVEN JUMPSUIT,DRESS SHIRT,SHIRT JACKET,OUTERWEAR OTHERS,SOFT WOVEN SHIRT,DRESS PANTS,OUTERWEAR JUMPSUIT,CLOAK,WF SHIRT,KNIT HOODIE,KNIT PANTS,KNIT OTHERS,KNIT JUMPSUIT,KNIT CREW T,KNIT POLO T,VEST,CASUAL LONG COAT,BLAZER,KNIT SHIRT,KNIT DRESS,KNIT SKIRT,DENIM BOTTOM,DENIM JACKET,DENIM SHIRT,DENIM TOP,DENIM OTHERS,DENIM JUMPSUIT,DENIM DRESS,DENIM SKIRT,YOGA PANTS,SUIT 2 PIECE,DRESS,CASUAL SHIRT,SHORT PANTS,CASUAL PANTS,CASUAL TOP COAT',
    historysubcategory: 'OTHERS,KNIT,DENIM,ACTIVE WEAR,SUIT,SHIRT,PANTS,OUTERWEAR,SOFT WOVEN',
    esg: 'WRAP,Better Work',
    moq: 500,
    coostring: 'CHN',
    inhousevap: 'Seam sealed,Laser Cut,Bonding',
    outsourcevap: 'Heat Transfer,Embellishment,Garment Dyeing,Washing,Embroidery,Printing',
    partyaudit3rd: 1,
    positioning: 'Fashion',
    pricepoint: 'Premium,Better',
    tradeterm: 'FOB',
    historyservicedbrand: 'JOOP!/CARA CARA/CULT GAIA',
    mainhistorybrand: 'southern tide/amazon/delta/allan/ck/TH/ADONIS/BROOKE',
    factorycodelong: 'VMLFF',
    createddate: '2026-04-30 06:00:01',
    categorysplit: 'MEN,WOMEN',
    factorycodeshort: 'LFF',
    capacity: [
      { month: '2026-04', original: 50000, totalDemand: 35000, remaining: 15000, status: 'Available' },
      { month: '2026-05', original: 55000, totalDemand: 40000, remaining: 15000, status: 'Available' },
      { month: '2026-06', original: 52000, totalDemand: 38000, remaining: 14000, status: 'Available' },
    ],
  },

  TH001: {
    type: 'external',
    id: null,
    factoryname: 'Tusuka Denim Ltd.',
    coostring: 'BD',
    productimages: null,
    description:
      "Tusuka Denim Ltd. is a premier large-scale garment manufacturer based in Dhaka, Bangladesh, specializing in the production of high-quality denim and trousers. Operating as a contract manufacturer with a workforce of 5,001 to 10,000 employees, the company functions as an integrated production house featuring dedicated plants, laboratories, and R&D centers. Their extensive product portfolio includes denim jeans, woven garments, long pants, ladies' leggings, and shorts. Tusuka Denim is a leader in sustainable apparel manufacturing, utilizing organic cotton and recycled fabrics alongside advanced eco-friendly technologies such as Tonello ECOfree ozone washing for sustainable finishing. The company maintains rigorous quality and compliance standards, holding certifications including ISO 9001, WRAP, SEDEX, Control Union, and Accord. As a key player in the global supply chain, they serve a prestigious international clientele including H&M, Guess, Michael Kors, Carrefour, and &Other Stories, with significant export operations reaching North American and European markets.",
    historysubcategory:
      'Mens non-knit apparel excluding swimwear, Non-Knit Clothing and Acc, Womens non-knit apparel articles, Hosiery and footwear without soles, Knitted or Crocheted Clothing Items',
    logo: null,
    employeecount: 'FROM_5001_TO_10000_PEOPLE',
    keyexportmarket: 'US, SG, Europe, North America',
    esg: 'International Organization for Standardization 9001, Worldwide Responsible Accredited Production, Supplier Ethical Data Exchange',
    subcategory:
      'Denim Jeans, Trousers, Woven Garments, Long Pants, Ladies Leggings, Shorts, Sustainable Denim, Organic Cotton Apparel, Recycled Fabric Clothing, Denim Washing Services, Ozone Finishing, Readymade Garments',
    emails: 'info@tusuka.com',
    phones: '+8809666722222, +88028853748, +88028826297',
    mainhistorybrand:
      'MARKS AND SPENCER/MAERSK/R J V INTERNATIONAL/INDITEX/NEXT RETAIL/ZARA/RJV INTERNATIONAL/MAGELLAN/CACHE CACHE/ITX/MAERSK LOGISTICS/MICHAEL KORS/PAULINE/HAYLEYS FREE ZONE/LOGIX/JEENA/NEXT/CHOICE DISCOUNT STORES/DHL/SARENZA/GLOBAL TRANSPORTATION/MARUBENI INTEX/SPEED MARK/CAFAN/ITX TRADING/EV CARGO/COSCO/SPEED MARK CONSOLIDATION SERVICE/MARUBENI/PAULINE 10/SPEEDMARK/H M/CARREFOUR/OTHER STORIES/GUESS/ECI',
    yearfounded: '2008',
    address: 'House # 25, Road # 01, Sector # 13, Uttara, Dhaka, Bangladesh',
    businesstype: 'MANUFACTURER, TRADING_COMPANY',
    websites: 'https://www.bgmea.com.bd/member/3990',
  },
};

export const COO_MAP: Record<string, string> = {
  CHN: 'China',
  VNM: 'Vietnam',
  IDN: 'Indonesia',
  BGD: 'Bangladesh',
  KHM: 'Cambodia',
  BD: 'Bangladesh',
};

export const ANCHOR_CONFIG: Record<string, { id: string; label: string }[]> = {
  internal: [
    { id: 'basic', label: 'General Information' },
    { id: 'categories', label: 'Categories' },
    { id: 'vap', label: 'VAP' },
    { id: 'esg', label: 'ESG' },
    { id: 'customers', label: 'Customers' },
    { id: 'capacity', label: 'Capacity' },
  ],
  external: [
    { id: 'basic', label: 'General Information' },
    { id: 'contact', label: 'Contact' },
    { id: 'categories', label: 'Categories' },
    { id: 'customers', label: 'Customers' },
    { id: 'esg', label: 'ESG' },
    { id: 'images', label: 'Images' },
  ],
};
