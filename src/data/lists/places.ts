import type { Locale } from "../types";

/** [city, region, postal prefix or area, phone area code (US only)] */
export type City = readonly [string, string, string, string?];

const US: City[] = [
  ["New York", "NY", "100", "212"], ["Brooklyn", "NY", "112", "718"], ["Los Angeles", "CA", "900", "213"],
  ["San Francisco", "CA", "941", "415"], ["San Diego", "CA", "921", "619"], ["Oakland", "CA", "946", "510"],
  ["Seattle", "WA", "981", "206"], ["Portland", "OR", "972", "503"], ["Denver", "CO", "802", "303"],
  ["Austin", "TX", "787", "512"], ["Houston", "TX", "770", "713"], ["Dallas", "TX", "752", "214"],
  ["Chicago", "IL", "606", "312"], ["Minneapolis", "MN", "554", "612"], ["Detroit", "MI", "482", "313"],
  ["Boston", "MA", "021", "617"], ["Philadelphia", "PA", "191", "215"], ["Pittsburgh", "PA", "152", "412"],
  ["Washington", "DC", "200", "202"], ["Baltimore", "MD", "212", "410"], ["Atlanta", "GA", "303", "404"],
  ["Miami", "FL", "331", "305"], ["Orlando", "FL", "328", "407"], ["Nashville", "TN", "372", "615"],
  ["Charlotte", "NC", "282", "704"], ["Raleigh", "NC", "276", "919"], ["Phoenix", "AZ", "850", "602"],
  ["Salt Lake City", "UT", "841", "801"], ["Las Vegas", "NV", "891", "702"], ["New Orleans", "LA", "701", "504"],
  ["Kansas City", "MO", "641", "816"], ["Columbus", "OH", "432", "614"], ["Madison", "WI", "537", "608"],
  ["Albuquerque", "NM", "871", "505"], ["Honolulu", "HI", "968", "808"],
];

const GB: City[] = [
  ["London", "Greater London", "E"], ["London", "Greater London", "SW"], ["London", "Greater London", "N"],
  ["London", "Greater London", "SE"], ["Manchester", "Greater Manchester", "M"], ["Birmingham", "West Midlands", "B"],
  ["Leeds", "West Yorkshire", "LS"], ["Sheffield", "South Yorkshire", "S"], ["Liverpool", "Merseyside", "L"],
  ["Bristol", "Bristol", "BS"], ["Newcastle upon Tyne", "Tyne and Wear", "NE"], ["Nottingham", "Nottinghamshire", "NG"],
  ["Leicester", "Leicestershire", "LE"], ["Brighton", "East Sussex", "BN"], ["Oxford", "Oxfordshire", "OX"],
  ["Cambridge", "Cambridgeshire", "CB"], ["York", "North Yorkshire", "YO"], ["Bath", "Somerset", "BA"],
  ["Norwich", "Norfolk", "NR"], ["Exeter", "Devon", "EX"], ["Edinburgh", "Scotland", "EH"], ["Glasgow", "Scotland", "G"],
  ["Aberdeen", "Scotland", "AB"], ["Cardiff", "Wales", "CF"], ["Swansea", "Wales", "SA"], ["Belfast", "Northern Ireland", "BT"],
  ["Southampton", "Hampshire", "SO"], ["Reading", "Berkshire", "RG"], ["Coventry", "West Midlands", "CV"],
];

const IN: City[] = [
  ["Mumbai", "Maharashtra", "400"], ["Pune", "Maharashtra", "411"], ["Nagpur", "Maharashtra", "440"],
  ["Delhi", "Delhi", "110"], ["Gurugram", "Haryana", "122"], ["Noida", "Uttar Pradesh", "201"],
  ["Lucknow", "Uttar Pradesh", "226"], ["Jaipur", "Rajasthan", "302"], ["Ahmedabad", "Gujarat", "380"],
  ["Surat", "Gujarat", "395"], ["Bengaluru", "Karnataka", "560"], ["Mysuru", "Karnataka", "570"],
  ["Mangaluru", "Karnataka", "575"], ["Chennai", "Tamil Nadu", "600"], ["Coimbatore", "Tamil Nadu", "641"],
  ["Madurai", "Tamil Nadu", "625"], ["Hyderabad", "Telangana", "500"], ["Visakhapatnam", "Andhra Pradesh", "530"],
  ["Vijayawada", "Andhra Pradesh", "520"], ["Kochi", "Kerala", "682"], ["Thiruvananthapuram", "Kerala", "695"],
  ["Kolkata", "West Bengal", "700"], ["Bhubaneswar", "Odisha", "751"], ["Guwahati", "Assam", "781"],
  ["Patna", "Bihar", "800"], ["Chandigarh", "Chandigarh", "160"], ["Indore", "Madhya Pradesh", "452"],
  ["Bhopal", "Madhya Pradesh", "462"], ["Panaji", "Goa", "403"], ["Dehradun", "Uttarakhand", "248"],
];

export const CITIES: Record<Locale, City[]> = { "en-US": US, "en-GB": GB, "en-IN": IN };

const w = (s: string): string[] => s.trim().split(/\s+/);

export const STREETS: Record<Locale, { names: string[]; types: string[] }> = {
  "en-US": {
    names: w("Maple Oak Pine Cedar Elm Washington Lake Hill Park Main Church River Sunset Highland Willow Lincoln Jackson Franklin Madison Spring Meadow Ridge Forest Grove Valley Chestnut Walnut Birch Cherry"),
    types: w("Street Avenue Road Lane Drive Court Place Boulevard Way"),
  },
  "en-GB": {
    names: ["High", "Church", "Station", "Victoria", "Park", "Mill", "Queen's", "King's", "Manor", "Albert", "Grove", "Springfield", "Chapel", "Windsor", "Orchard", "Meadow", "Cedar", "Beech", "Ash", "York"],
    types: w("Road Street Lane Avenue Close Gardens Crescent Way Terrace Drive"),
  },
  "en-IN": {
    names: w("MG Gandhi Nehru Station Temple Lake Park Church Market Hill Ring Link Main Residency Brigade Anna Sardar Tilak"),
    types: w("Road Street Nagar Colony Layout Marg"),
  },
};
