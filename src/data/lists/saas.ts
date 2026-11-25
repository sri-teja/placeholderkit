import type { SaasProduct } from "../types";

const w = (s: string): string[] => s.split("|");

export interface ProductSpec {
  label: string;
  nameA: string[];
  nameB: string[];
  taglines: string[];
  /** Per-seat pricing (true) or flat monthly price per plan (false). */
  perSeat: boolean;
  /** Feature bullets added at each tier: Free, Starter, Pro, Business (cumulative on a pricing page). */
  features: [string[], string[], string[], string[]];
  /** What users work on, for the activity feed: "dashboard", "task"... */
  item: string;
  /** Verb for item.completed: "completed", "closed"... */
  done: string;
  titles: string[];
  reports: string[];
}

export const PRODUCTS: Record<SaasProduct, ProductSpec> = {
  analytics: {
    label: "analytics", perSeat: false, item: "dashboard", done: "published",
    nameA: w("Lumen|Prism|Clarity|Vista|Northlight"), nameB: w("Analytics|Insights|Metrics"),
    taglines: w("Answers from your data, without the SQL.|Dashboards your whole team will actually read.|Product analytics that stays out of the way."),
    features: [w("1 dashboard|7-day history"), w("Unlimited dashboards|12-month history|Email reports"), w("Funnels and cohorts|Scheduled exports|Team spaces"), w("SSO and audit log|Unlimited history|Dedicated support")],
    titles: w("Q3 Pipeline|Weekly Signups|Churn by Cohort|Marketing Funnel|Revenue Overview|Activation Rate|Trial Conversion|Feature Adoption"),
    reports: w("weekly summary|revenue|retention|funnel"),
  },
  "project-management": {
    label: "project management", perSeat: true, item: "task", done: "completed",
    nameA: w("Taskwise|Northstar|Tempo|Milestone|Kanbo"), nameB: w("HQ|Projects|Work"),
    taglines: w("Plan, track and ship work together.|Every project, one calm place.|Less status chasing, more shipping."),
    features: [w("Up to 3 projects|Basic boards"), w("Unlimited projects|Timelines|File sharing"), w("Workload view|Automations|Guest access"), w("SSO and audit log|Advanced permissions|Priority support")],
    titles: w("Update onboarding emails|Fix checkout bug|Plan Q2 roadmap|Design review|Prepare board deck|Migrate billing|Launch checklist|Customer interviews"),
    reports: w("sprint|workload|project status|time tracking"),
  },
  crm: {
    label: "CRM", perSeat: true, item: "deal", done: "closed",
    nameA: w("Closewise|Rapport|Leadline|Harborline|Dealpath"), nameB: w("CRM|Sales|Hub"),
    taglines: w("A CRM your sales team will keep up to date.|Every deal, every contact, one view.|Close more, update less."),
    features: [w("Up to 500 contacts|1 pipeline"), w("Unlimited contacts|Email tracking|3 pipelines"), w("Forecasting|Sequences|Custom fields"), w("SSO and audit log|Territories|Dedicated support")],
    titles: w("Annual renewal|Expansion: 20 seats|Pilot program|Enterprise upgrade|New logo: West region|Multi-year contract|Partner referral"),
    reports: w("pipeline|forecast|win rate|activity"),
  },
  "support-desk": {
    label: "customer support", perSeat: true, item: "conversation", done: "resolved",
    nameA: w("Helpwise|Kindly|Answerly|Replyto|Haven"), nameB: w("Desk|Support|Help"),
    taglines: w("Support your customers from one shared inbox.|Fast, friendly answers at any scale.|Help desk software people enjoy using."),
    features: [w("1 shared inbox|Email support"), w("3 inboxes|Saved replies|Live chat"), w("Help center|SLA rules|Satisfaction surveys"), w("SSO and audit log|Custom roles|Priority support")],
    titles: w("Login issue|Refund request|Shipping delay|Billing question|Password reset|Feature request|Order not received|Account upgrade"),
    reports: w("response time|satisfaction|volume|agent performance"),
  },
  hr: {
    label: "HR", perSeat: true, item: "request", done: "approved",
    nameA: w("Peopleworks|Crewly|Roster|Teamwise|Kinship"), nameB: w("HR|People|Hub"),
    taglines: w("HR that runs itself, so you can focus on people.|Onboarding, time off and reviews in one place.|The simple home for your team."),
    features: [w("Up to 10 people|Employee directory"), w("Time off tracking|Onboarding checklists|Document storage"), w("Performance reviews|Org chart|Custom reports"), w("SSO and audit log|Advanced permissions|Dedicated support")],
    titles: w("Time-off request|New hire onboarding|Q3 performance review|Benefits enrollment|Offer letter: Product Designer|Equipment request|Expense report"),
    reports: w("headcount|time off|turnover|payroll summary"),
  },
  "dev-tools": {
    label: "developer tools", perSeat: false, item: "pull request", done: "merged",
    nameA: w("Forge|Patchwork|Shipyard|Lattice|Buildway"), nameB: w("Dev|CI|Labs|Cloud"),
    taglines: w("Faster builds, calmer deploys.|CI that keeps up with your team.|Ship with confidence, every commit."),
    features: [w("1 project|100 build minutes"), w("10 projects|Unlimited build minutes|Preview deploys"), w("Parallel builds|Deploy approvals|Secrets management"), w("SSO and audit log|Self-hosted runners|Priority support")],
    titles: w("Fix flaky test|Add rate limiting|Upgrade dependencies|Improve cache hit rate|Refactor auth middleware|Add health check|Speed up cold starts"),
    reports: w("build time|deploy frequency|test coverage|usage"),
  },
};

export const SAAS_PRODUCTS = Object.keys(PRODUCTS) as SaasProduct[];

export const PLAN_NAMES = ["Free", "Starter", "Pro", "Business"] as const;
/** Authored US dollar prices per month: per seat, or flat. */
export const PLAN_USD = { perSeat: [0, 10, 20, 40], flat: [0, 29, 99, 299] } as const;

/** [industry, name suffixes] for customer companies. */
export const INDUSTRIES: readonly (readonly [string, string[]])[] = [
  ["Healthcare", w("Health|Dental|Clinic|Care")], ["Logistics", w("Logistics|Freight|Shipping")], ["Retail", w("Goods|Market|Outfitters")],
  ["Education", w("Academy|Learning|School")], ["Finance", w("Capital|Advisors|Partners")], ["Hospitality", w("Hotels|Hospitality|Kitchen")],
  ["Manufacturing", w("Industries|Manufacturing|Works")], ["Real Estate", w("Properties|Realty|Homes")], ["Media", w("Studio|Media|Pictures")],
  ["Software", w("Labs|Software|Systems")], ["Nonprofit", w("Foundation|Trust")], ["Legal", w("Law|Legal")],
  ["Construction", w("Builders|Construction")], ["Agriculture", w("Farms|Growers")], ["Energy", w("Energy|Solar")],
];

export const COMPANY_PREFIXES = w(
  "Harbor|Brightside|Northgate|Bluepeak|Cedar|Summit|Redwood|Lakeshore|Ironwood|Silverline|Oakridge|Riverbend|Highmark|" +
  "Clearwater|Stonebridge|Westfield|Evergreen|Meridian|Pinecrest|Granite|Sunrise|Kestrel|Copperfield|Fairview|Larkspur|" +
  "Maplewood|Horizon|Bayside|Ashford|Wildflower|Foxglove|Blackwater|Goldcrest|Hillcrest|Moorland",
);

/** [band, weight, min seats, max seats] */
export const EMPLOYEE_BANDS: readonly (readonly [string, number, number, number])[] = [
  ["1-10", 30, 2, 8], ["11-50", 35, 5, 25], ["51-200", 20, 15, 60], ["201-1000", 10, 30, 150], ["1000+", 5, 80, 400],
];

export const OWNER_TITLES = w("Founder|CEO|Managing Director|Head of Operations|COO|General Manager");
export const JOB_TITLES = w(
  "Operations Manager|Product Manager|Account Executive|Customer Success Manager|Software Engineer|Designer|Data Analyst|" +
  "Marketing Manager|Finance Lead|Support Specialist|Sales Manager|HR Manager|Project Manager|Office Manager",
);
export const TEAM_TITLES = w("Support Engineer|Customer Success Manager|Support Lead|Technical Support Specialist|Onboarding Specialist");

export const INTEGRATIONS = w("calendar|email|data warehouse|chat|single sign-on|accounting|webhook");

/** Ticket templates by topic. Each entry pairs a subject with a body that says the same thing. Priority weights: [low, normal, high, urgent]. */
export const TICKET_TOPICS: readonly { topic: string; priority: readonly number[]; tickets: readonly (readonly [string, string])[] }[] = [
  { topic: "billing", priority: [2, 6, 2, 0], tickets: [
    ["Question about my latest invoice", "Hi, our latest invoice from {product} looks higher than expected. Could you walk me through it?"],
    ["Can we switch to annual billing?", "We'd like to move to annual billing at renewal. What are the next steps?"],
    ["Update the card on file", "Our company card changed. How do I update it before the next invoice?"],
    ["Charged for the wrong number of seats", "We removed two people last month but the invoice still counts them. Can you take a look?"],
  ] },
  { topic: "bug", priority: [0, 5, 4, 1], tickets: [
    ["Page not loading for some of our team", "Since this morning a few of us see a blank page in {product}. Reloading doesn't help."],
    ["Export fails with an error", "When I export, I get an error after a few seconds. It worked fine last week."],
    ["Notifications stopped arriving", "Our team stopped getting notifications from {product} yesterday. Nothing changed on our side."],
    ["Search results look out of date", "Search isn't showing items we created this week. Is indexing delayed?"],
  ] },
  { topic: "how-to", priority: [5, 5, 0, 0], tickets: [
    ["How do I add a teammate?", "Quick question: what's the easiest way to add a new teammate and give them access?"],
    ["How do I export our data?", "We need a copy of our data for a review. Is there a way to export everything?"],
    ["Can I rename our workspace?", "We rebranded. Can we change our workspace name without losing anything?"],
    ["Where do I change notification settings?", "I'm getting more emails than I need. Where can I turn some of them off?"],
  ] },
  { topic: "feature", priority: [7, 3, 0, 0], tickets: [
    ["Request: dark mode", "Loving {product} so far. A dark mode would make long sessions much easier on the eyes."],
    ["Request: more granular permissions", "We'd like some people to view but not edit certain areas. Is that on the roadmap?"],
    ["Request: API access on Starter", "We're on Starter and would like to automate a few things. Any chance of API access on our plan?"],
    ["Request: custom fields", "We track a few details that don't fit the default fields. Custom fields would help a lot."],
  ] },
  { topic: "access", priority: [0, 2, 5, 3], tickets: [
    ["Locked out of my account", "I can't sign in to {product} and the reset email isn't arriving. Can you help?"],
    ["SSO setup help", "We're setting up single sign-on and get an error on the last step."],
    ["Two-factor code not arriving", "The two-factor code never arrives by text, so I can't get in."],
    ["Owner left the company", "The account owner left our company. How do we transfer ownership?"],
  ] },
];
