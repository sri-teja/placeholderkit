import type { Category } from "../../core/placeholder";
import type { StoreVertical } from "../types";

export type Facet =
  | "clothing" | "bag" | "kitchen" | "textile" | "decor" | "gear" | "coffee" | "tea" | "brewgear" | "pet" | "treats"
  | "grooming" | "electronics" | "case" | "audio" | "book" | "cookbook" | "kids" | "skincare" | "haircare" | "body" | "scent";

export interface CategorySpec {
  name: string;
  /** Placeholder image category for product photos. */
  image: Category;
  /** Name template: {adj}, {mat}, {item}. */
  pattern?: string;
  adj: string[];
  mat: string[];
  item: string[];
  /** How reviews refer to it ("this {noun}"). Defaults to the item, lowercased. */
  noun?: string;
  /** Description templates for this category, when the generic ones don't fit. */
  desc?: string[];
  /** Authored price range in US dollars. */
  price: [number, number];
  facet: Facet;
}

export interface VerticalSpec {
  label: string;
  nameA: string[];
  nameB: string[];
  taglines: string[];
  categories: CategorySpec[];
  /** Order-size habits: typical quantity of a single item. */
  bulky: boolean;
}

const w = (s: string): string[] => s.split("|");

export const VERTICALS: Record<StoreVertical, VerticalSpec> = {
  apparel: {
    label: "clothing", bulky: false,
    nameA: w("Thread|Pine|Field|North|Common|Harbor|Linen|Oak"), nameB: w("& Co.|Supply|Goods|Studio|Outfitters|Clothing"),
    taglines: w("Everyday clothes, made to last.|Wardrobe staples without the markup.|Good fabric, honest prices."),
    categories: [
      { name: "Tops", image: "fashion", adj: w("Everyday|Relaxed|Classic|Heavyweight|Lightweight|Oversized"), mat: w("Cotton|Linen|Merino|Organic Cotton|French Terry"), item: w("T-Shirt@24-45|Oxford Shirt@55-110|Crewneck Sweater@70-140|Hoodie@60-110|Cardigan@70-140|Polo@40-80"), price: [24, 140], facet: "clothing" },
      { name: "Bottoms", image: "fashion", adj: w("Slim|Relaxed|Tailored|Everyday|Vintage-Wash"), mat: w("Denim|Twill|Linen|Corduroy|Stretch Cotton"), item: w("Chinos@60-120|Wide-Leg Trousers@70-140|Straight Jeans@70-160|Shorts@38-70|Joggers@50-95|Pleated Skirt@55-120"), noun: "pair", price: [38, 160], facet: "clothing" },
      { name: "Outerwear", image: "fashion", adj: w("Waxed|Quilted|Packable|Lined|Classic|Water-Resistant"), mat: w("Canvas|Wool|Nylon|Cotton Twill|Recycled Down"), item: w("Jacket|Overshirt|Parka|Trench Coat|Vest|Rain Shell"), price: [80, 320], facet: "clothing" },
      { name: "Bags", image: "product", adj: w("Everyday|Waxed|Roll-Top|Compact|Structured"), mat: w("Canvas|Leather|Nylon|Recycled Polyester|Cotton"), item: w("Tote@30-90|Weekender Bag@120-220|Backpack@70-180|Crossbody Bag@45-120|Belt Bag@30-70"), noun: "bag", price: [30, 220], facet: "bag" },
    ],
  },
  home: {
    label: "home goods", bulky: false,
    nameA: w("Hearth|Nook|Willow|Stone|Kiln|Juniper|Clay"), nameB: w("Home|House|Living|Goods|& Co."),
    taglines: w("Simple things for a well-kept home.|Made for the rooms you live in.|Useful, beautiful, built to last."),
    categories: [
      { name: "Kitchen", image: "home", adj: w("Handmade|Speckled|Stackable|Classic|Matte"), mat: w("Stoneware|Ceramic|Porcelain|Glass"), item: w("Mug@14-32|Serving Bowl@30-80|Dinner Plate Set@60-180|Pasta Bowl@18-40|Pitcher@30-70|Salad Bowl@35-90"), price: [12, 180], facet: "kitchen" },
      { name: "Bedding", image: "home", adj: w("Washed|Waffle-Knit|Soft|Breathable|Heavyweight"), mat: w("Linen|Cotton Percale|Sateen|Wool|Bamboo"), item: w("Duvet Cover@90-260|Sheet Set@80-220|Throw Blanket@60-160|Pillowcase Pair@35-70|Quilt@120-260"), price: [35, 260], facet: "textile" },
      { name: "Decor", image: "home", adj: w("Minimal|Ribbed|Round|Sculpted|Arched"), mat: w("Ceramic|Brass|Oak|Glass|Travertine"), item: w("Table Lamp@80-240|Vase@25-90|Wall Mirror@90-240|Planter@20-70|Picture Frame@18-50|Bookend@25-60"), price: [18, 240], facet: "decor" },
      { name: "Storage", image: "home", adj: w("Woven|Stackable|Wall-Mounted|Modular"), mat: w("Seagrass|Oak|Steel|Bamboo|Rattan"), item: w("Basket@25-70|Shelf@60-190|Storage Box@20-60|Coat Rack@50-150"), price: [20, 190], facet: "decor" },
    ],
  },
  outdoor: {
    label: "outdoor gear", bulky: false,
    nameA: w("Ridge|Summit|Trailhead|Cedar|Basecamp|Alpine|Timberline"), nameB: w("Outdoors|Supply|Gear|Co."),
    taglines: w("Gear for the long way round.|Tested outside, priced fairly.|Pack light, go further."),
    categories: [
      { name: "Camping", image: "travel", pattern: "{adj} {item}", adj: w("Ultralight|Packable|Rugged|Compact|Trail-Ready"), mat: [""], item: w("Tent@120-420|Sleeping Bag@80-260|Camp Chair@40-120|Lantern@25-60|Cookset@35-90|Hammock@40-110"), price: [25, 420], facet: "gear" },
      { name: "Hiking", image: "nature", pattern: "{adj} {item}", adj: w("Trail|Alpine|Lightweight|Everyday|All-Weather"), mat: [""], item: w("Daypack@60-180|Trekking Poles@50-140|Hiking Socks@15-28|Water Bottle@15-40|Headlamp@25-60|Rain Jacket@90-240"), price: [15, 240], facet: "gear" },
      { name: "Cycling", image: "sports", pattern: "{adj} {item}", adj: w("Commuter|Reflective|Lightweight|All-Weather"), mat: [""], item: w("Helmet@60-180|Bike Light@20-70|Saddle Bag@25-60|Cycling Gloves@18-45|Jersey@50-120"), price: [18, 180], facet: "gear" },
      { name: "Water", image: "travel", pattern: "{adj} {item}", adj: w("Quick-Dry|Compact|Travel|Packable"), mat: [""], item: w("Dry Bag@20-50|Paddle@80-260|Snorkel Set@35-90|Beach Towel@25-60|Swim Shorts@30-70"), price: [15, 260], facet: "gear" },
    ],
  },
  coffee: {
    label: "coffee", bulky: true,
    nameA: w("Ember|Copper|Morning|Daybreak|Little Bean|Corner|Highline"), nameB: w("Coffee|Roasters|Coffee Co.|Coffee House"),
    taglines: w("Roasted this week, brewed every morning.|Small-batch coffee, shipped fresh.|Better coffee at home."),
    categories: [
      { name: "Coffee", image: "food", adj: w("Ethiopia|Colombia|Guatemala|Kenya|Brazil|Sumatra|Costa Rica|Rwanda"), mat: w("Washed|Natural|Honey"), item: w("Light Roast|Medium Roast|Dark Roast|Espresso|Decaf"), noun: "coffee", desc: w("Roasted in small batches and shipped within days of roasting. {Closer}|A {matl}-process coffee from {adj}, roasted as {aitem}. {Closer}|Sweet, balanced and easy to brew at home. {Closer}"), price: [14, 32], facet: "coffee" },
      { name: "Tea", image: "food", adj: w("Organic|Loose-Leaf|Smoky|Floral|Breakfast"), mat: w("Green|Black|Oolong|White|Herbal"), item: w("Tea|Tea Tin|Tea Sampler|Chai Blend"), noun: "tea", desc: w("{Name}: {matl} tea, picked and packed with care. {Closer}|A {adjl} {matl} tea for slow mornings. {Closer}"), price: [9, 40], facet: "tea" },
      { name: "Brewing", image: "product", pattern: "{adj} {item}", adj: w("Classic|Compact|Ceramic|Glass|Everyday"), mat: [""], item: w("Pour-Over Dripper@18-45|French Press@25-60|Grinder@60-260|Kettle@45-160|Cold Brew Jar@20-45|Scale@25-70"), price: [18, 260], facet: "brewgear" },
      { name: "Mugs", image: "home", adj: w("Handmade|Insulated|Double-Wall|Speckled"), mat: w("Stoneware|Glass|Steel|Ceramic"), item: w("Mug|Travel Mug|Cup Set|Tumbler"), price: [14, 48], facet: "kitchen" },
    ],
  },
  pets: {
    label: "pet supplies", bulky: true,
    nameA: w("Paws|Good Dog|Whisker|Biscuit|Wag|Tails"), nameB: w("& Co.|Supply|Club|Pet Goods"),
    taglines: w("Everything for the best one in the house.|Pet supplies we'd use ourselves.|Happy pets, fewer chewed shoes."),
    categories: [
      { name: "Dog", image: "pet", pattern: "{adj} {item}", adj: w("Durable|Reflective|Washable|Adjustable|Everyday"), mat: [""], item: w("Dog Bed@50-160|Leash@15-45|Harness@25-60|Chew Toy@8-20|Collar@15-40"), price: [10, 160], facet: "pet" },
      { name: "Cat", image: "pet", pattern: "{adj} {item}", adj: w("Cozy|Modern|Sturdy|Classic"), mat: [""], item: w("Cat Tree@80-190|Scratching Post@25-70|Cat Bed@30-80|Wand Toy@8-18|Litter Mat@15-35"), price: [9, 190], facet: "pet" },
      { name: "Treats", image: "food", adj: w("Grain-Free|Small-Batch|Crunchy|Soft"), mat: w("Salmon|Chicken|Peanut Butter|Sweet Potato|Lamb"), item: w("Treats|Dental Chews|Training Bites|Jerky"), noun: "treats", desc: w("{Name}, made with real {matl}. {Closer}|Small treats with simple ingredients, starting with {matl}. {Closer}"), price: [6, 28], facet: "treats" },
      { name: "Grooming", image: "product", pattern: "{adj} {item}", adj: w("Gentle|Everyday|Fragrance-Free|Easy-Grip"), mat: [""], desc: w("{Name} for a calm, easy grooming routine. {Closer}|Gentle on coats and easy to use at home. {Closer}"), item: w("Shampoo|Brush|Nail Clipper|Grooming Wipes"), price: [8, 45], facet: "grooming" },
    ],
  },
  "tech-accessories": {
    label: "tech accessories", bulky: false,
    nameA: w("Volt|Circuit|Pixel|Signal|Port|Nimbus"), nameB: w("Labs|Gear|Works|Supply"),
    taglines: w("Accessories that just work.|Better cables, chargers and cases.|Gear for your desk and your bag."),
    categories: [
      { name: "Charging", image: "tech", adj: w("Fast|Compact|3-in-1|Travel|Slim"), mat: w("Aluminum|Recycled Plastic|Silicone|Braided Nylon"), item: w("Charger@20-60|Power Bank@30-90|Charging Cable@12-30|Wireless Charging Pad@25-70|Charging Stand@35-90"), price: [15, 90], facet: "electronics" },
      { name: "Cases", image: "product", adj: w("Slim|Rugged|Minimal|Everyday"), mat: w("Leather|Silicone|Recycled Plastic|Felt|Canvas"), item: w("Phone Case@20-60|Laptop Sleeve@35-90|Tablet Folio@30-80|Earbuds Case@15-35"), noun: "case", price: [18, 90], facet: "case" },
      { name: "Audio", image: "music", pattern: "{adj} {item}", adj: w("Noise-Cancelling|Portable|Waterproof|Studio"), mat: [""], item: w("Wireless Earbuds@50-250|Headphones@80-350|Bluetooth Speaker@40-200|Desk Speaker@80-300"), price: [35, 320], facet: "audio" },
      { name: "Desk", image: "tech", pattern: "{adj} {item}", adj: w("Minimal|Compact|Everyday|Pro"), mat: [""], item: w("Keyboard@60-220|Mouse@25-120|Monitor Stand@40-140|Desk Mat@20-60|USB-C Hub@30-90|Webcam@50-160"), price: [20, 220], facet: "electronics" },
    ],
  },
  books: {
    label: "books", bulky: false,
    nameA: w("Paper|Lantern|Inkwell|Margin|Chapter|Quiet"), nameB: w("Books|Bookshop|Press|& Co."),
    taglines: w("A small bookshop with a long reading list.|Books worth staying up for.|Hand-picked reads, shipped with care."),
    categories: [
      { name: "Fiction", image: "book", pattern: "The {adj} {item}", adj: w("Quiet|Last|Silver|Hidden|Long|Northern|Paper|Salt|Distant|Winter"), mat: [""], item: w("Harbor|Garden|Summer|Orchard|Lighthouse|Letters|Island|Station|Season|River"), noun: "book", desc: w("A novel about home, distance and the people we come back to.|{Name} follows one family across a single unforgettable season.|A quiet, generous story told in short chapters."), price: [12, 28], facet: "book" },
      { name: "Cookbooks", image: "book", adj: w("Weeknight|Simple|Slow|Everyday|Weekend"), mat: w("Vegetarian|Baking|Pasta|Noodle|Bread|Salad"), item: w("Kitchen|Cookbook|Table|Recipes"), noun: "cookbook", desc: w("{Name} collects {matl} recipes that fit into a normal week.|Over 80 {matl} recipes, each one tested twice."), price: [18, 40], facet: "cookbook" },
      { name: "Nonfiction", image: "book", pattern: "The {item} of {mat}", adj: [""], mat: w("Attention|Small Things|Cities|Sleep|Focus|Maps|Color|Rest"), item: w("Art|Science|Shape|History|Habit"), noun: "book", desc: w("{Name} explores {matl} through stories, research and practical ideas.|A short, readable guide to {matl}."), price: [16, 34], facet: "book" },
      { name: "Kids", image: "book", pattern: "{adj} {item}", adj: w("Little|Sleepy|Brave|Curious|Tiny"), mat: [""], item: w("Fox|Moon|Bear|Owl|Garden Adventure|Bus Ride"), noun: "book", desc: w("A picture book about a {adjl} {iteml} and a big day out.|{Name} is a bedtime story for ages 3 to 6."), price: [8, 20], facet: "kids" },
    ],
  },
  beauty: {
    label: "beauty", bulky: true,
    nameA: w("Bloom|Dew|Fern|Petal|Glow|Saltwater"), nameB: w("Skin|Beauty|Botanics|Apothecary"),
    taglines: w("Simple skincare that does what it says.|Clean formulas, honest results.|Everyday care, made gently."),
    categories: [
      { name: "Skincare", image: "product", adj: w("Hydrating|Gentle|Brightening|Daily|Overnight"), mat: w("Vitamin C|Hyaluronic|Rosehip|Green Tea|Ceramide|Aloe"), item: w("Face Serum|Moisturizer|Cleanser|Face Oil|Eye Cream|Toner"), desc: w("Made with {matl} for daily use. {Closer}|A {adjl} formula, suitable for all skin types. {Closer}"), price: [14, 68], facet: "skincare" },
      { name: "Hair", image: "product", adj: w("Nourishing|Volumizing|Curl-Defining|Repairing"), mat: w("Argan|Coconut|Rice Water|Shea"), item: w("Shampoo|Conditioner|Hair Oil|Hair Mask"), desc: w("Made with {matl}, for all hair types. {Closer}|A {adjl} formula for everyday hair care. {Closer}"), price: [10, 40], facet: "haircare" },
      { name: "Body", image: "product", adj: w("Soothing|Rich|Everyday|Exfoliating"), mat: w("Oat|Lavender|Shea|Citrus|Sea Salt"), item: w("Body Wash|Body Lotion|Hand Cream|Bar Soap|Body Scrub"), desc: w("Made with {matl}, gentle enough for every day. {Closer}|A {adjl} {iteml} that leaves skin soft. {Closer}"), price: [8, 36], facet: "body" },
      { name: "Fragrance", image: "product", adj: w("Warm|Fresh|Woody|Floral"), mat: w("Cedar|Fig|Neroli|Sandalwood|Amber"), item: w("Candle|Eau de Parfum|Room Spray|Diffuser"), desc: w("Notes of {matl}, made to fill a room without overpowering it. {Closer}|A {adjl} scent built around {matl}. {Closer}"), price: [18, 120], facet: "scent" },
    ],
  },
};

export const STORE_VERTICALS = Object.keys(VERTICALS) as StoreVertical[];

/** Product description templates. {Name}, {item}, {mat}, {adj}, {label} are filled per product. */
export const DESCRIPTIONS = w(
  "{Name} is made from {matl} and designed for everyday use.|" +
  "A {adjl} {iteml} in {matl}, built to last for years.|" +
  "Our best-selling {iteml}, now in {matl}. {Closer}|" +
  "{Name}: simple, well made and easy to look after. {Closer}|" +
  "Made in small batches from {matl}. {Closer}|" +
  "{Name}: designed to be used every day and kept for years. {Closer}",
);
export const DESCRIPTION_CLOSERS = w("Ships within two business days.|Free returns within 30 days.|Backed by our one-year guarantee.|Packed in recyclable materials.");
