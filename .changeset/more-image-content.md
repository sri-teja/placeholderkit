---
"@placeholderkit/core": minor
---

More image content and a new `artStyle` option.

- 10 new animals: lion, tiger, raccoon, pig, monkey, sheep, hamster, otter, deer and chick (19 in total).
- 3 new hairstyles (ponytail, afro, waves) and 3 new accessories (scarf, flower, cap).
- 6 new placeholder categories: `real-estate`, `finance`, `health`, `education`, `restaurant-menu`, `social-post`.
- `artStyle: "soft" | "flat" | "outlined"` for `avatarUrl`, `animalUrl`, `<Avatar>` and `<AnimalAvatar>` (`soft` is the default and the existing look). It is called `artStyle` because `style` is React's CSS prop.
- The script-tag build now reads `data-art-style`, `data-hairstyle`, `data-expression` and `data-accessory`.

Because the new animals, hairstyles, accessories and categories join the random picks, many seeds now draw a different image than in 0.3.x. To keep an image exactly as it was, set the choices that gained options: `hairstyle` for person avatars, `animal` and `accessory` for animal avatars, and `category` for placeholders. Logos are unchanged.
