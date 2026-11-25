import type { Facet } from "./ecommerce";

const w = (s: string): string[] => s.split("|");

/** Index 0 = 1 star ... 4 = 5 stars. */
export const TITLES: string[][] = [
  w("Disappointed|Didn't last|Would not buy again|Not as described"),
  w("Not for me|Expected more|Just okay at best|Mixed feelings"),
  w("Decent|It's fine|Good, not great|Does the job"),
  w("Really good|Very happy|Great value|Nice quality|Solid choice"),
  w("Love it|Perfect|Exactly as described|Great quality|Highly recommend|New favorite"),
];

export const OPENERS: string[][] = [
  w("Disappointed with this {noun}.|I wouldn't buy this again.|This didn't work out for me."),
  w("Not quite what I hoped for.|Mixed feelings about this {noun}.|I wanted to like this more."),
  w("It's okay.|Decent, with a few caveats.|Does what it needs to."),
  w("Really happy with this {noun}.|Very good overall.|Solid {noun} for the price."),
  w("Absolutely love this {noun}.|Exactly what I was looking for.|Better than I expected.|This is my second order."),
];

export const CLOSERS: string[][] = [
  w("Returned it.|Customer service was helpful, at least.|Can't recommend it."),
  w("Probably returning it.|Might suit someone else better."),
  w("Fine for the price.|Might try something else next time."),
  w("Would buy again.|Minor nitpicks aside, recommended."),
  w("Would recommend.|Already planning to buy another.|Five stars."),
];

/** Category-specific sentences: what a buyer would actually comment on. */
export const FACETS: Record<Facet, { pos: string[]; neg: string[] }> = {
  clothing: { pos: w("The fit is spot on.|The fabric feels great and washes well.|True to size and really comfortable."), neg: w("The sizing runs small.|The fabric pilled after a few washes.|The fit was off for me.") },
  bag: { pos: w("Holds more than it looks.|The straps stay comfortable even when it's full."), neg: w("The zipper started catching after a month.|Smaller than I expected.") },
  kitchen: { pos: w("Feels solid and looks great on the table.|Easy to clean and dishwasher safe."), neg: w("It chipped within a few weeks.|Smaller than it looked in the photos.") },
  textile: { pos: w("Soft from the first wash.|Sleeps cool and looks great on the bed."), neg: w("It wrinkles more than I expected.|The color faded after washing.") },
  decor: { pos: w("Looks even better in person.|Instantly made the room feel finished."), neg: w("The finish had a few marks.|Lighter and less sturdy than it looks.") },
  gear: { pos: w("Packs down small and sets up in minutes.|Held up well on a rainy weekend."), neg: w("Heavier than the listing suggested.|One of the seams leaked in heavy rain.") },
  coffee: { pos: w("Smooth, with a sweet finish.|Great as espresso and as pour-over.|Arrived freshly roasted."), neg: w("Too bitter for my taste.|The beans were roasted weeks before they arrived.") },
  tea: { pos: w("Lovely aroma and a clean taste.|Steeps well more than once."), neg: w("A bit weak, even with extra leaves.|The flavor faded quickly once opened.") },
  brewgear: { pos: w("Makes a noticeably better cup.|Well made and easy to clean."), neg: w("The lid doesn't fit tightly.|Slower than my old one.") },
  pet: { pos: w("My dog loves it.|Still in one piece after weeks of use.|Easy to wash and dries fast."), neg: w("It didn't last a week with my dog.|The sizing guide was off for us.") },
  treats: { pos: w("Gone in seconds every time.|Good ingredients and no upset stomach."), neg: w("My dog wasn't interested.|The bag arrived crushed.") },
  grooming: { pos: w("Gentle and leaves the coat soft.|Made grooming much easier."), neg: w("The scent is stronger than I'd like.|Didn't make much difference.") },
  electronics: { pos: w("Charges quickly and stays cool.|Works with everything I own."), neg: w("Stopped working after a couple of months.|Gets warmer than I'd like.") },
  case: { pos: w("Fits perfectly and the buttons still click well.|Survived a few drops already."), neg: w("It started to yellow quickly.|Adds more bulk than I hoped.") },
  audio: { pos: w("Clear sound and solid battery life.|Comfortable for long calls."), neg: w("The Bluetooth connection drops now and then.|The bass is weaker than expected.") },
  book: { pos: w("Couldn't put it down.|Beautifully written.|Worth reading twice."), neg: w("The middle dragged for me.|Not what the description led me to expect.") },
  cookbook: { pos: w("Every recipe I've tried worked the first time.|Clear instructions and realistic weeknight timings."), neg: w("Several ingredients were hard to find.|The recipes take longer than stated.") },
  kids: { pos: w("Our bedtime favorite now.|Lovely illustrations."), neg: w("Too short for the price.|The pages tore easily.") },
  skincare: { pos: w("My skin feels calmer after a week.|Absorbs quickly with no greasy feel."), neg: w("Caused some redness for me.|Didn't notice much difference.") },
  haircare: { pos: w("Hair feels softer and less frizzy.|A little goes a long way."), neg: w("Left my hair feeling heavy.|The scent didn't last.") },
  body: { pos: w("Smells lovely and lasts all day.|Gentle enough for daily use."), neg: w("The scent fades quickly.|A bit too thin for me.") },
  scent: { pos: w("Fills the room without being too much.|Burns evenly and lasts ages."), neg: w("Barely noticeable once lit.|The scent was different from what I expected.") },
};

/** Star weights for 1..5 stars: mean about 4.18, matching how real store ratings skew. */
export const RATING_WEIGHTS: readonly (readonly [number, number])[] = [[1, 6], [2, 5], [3, 9], [4, 25], [5, 55]];
