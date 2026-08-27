/**
 * Auto-translation and transliteration helper from English clothing terms to Kannada.
 * Used when customers toggle the Kannada language button on the storefront.
 */

const DICTIONARY: Record<string, string> = {
  // Clothing categories & garments
  shirt: "ಶರ್ಟ್",
  shirts: "ಶರ್ಟ್‌ಗಳು",
  "t-shirt": "ಟಿ-ಶರ್ಟ್",
  "t-shirts": "ಟಿ-ಶರ್ಟ್‌ಗಳು",
  tshirt: "ಟಿ-ಶರ್ಟ್",
  tshirts: "ಟಿ-ಶರ್ಟ್‌ಗಳು",
  "night pant": "ನೈಟ್ ಪ್ಯಾಂಟ್",
  "night pants": "ನೈಟ್ ಪ್ಯಾಂಟ್‌ಗಳು",
  nightpant: "ನೈಟ್ ಪ್ಯಾಂಟ್",
  nightpants: "ನೈಟ್ ಪ್ಯಾಂಟ್‌ಗಳು",
  "night shirt": "ನೈಟ್ ಶರ್ಟ್",
  "night shirts": "ನೈಟ್ ಶರ್ಟ್‌ಗಳು",
  nightshirt: "ನೈಟ್ ಶರ್ಟ್",
  nightshirts: "ನೈಟ್ ಶರ್ಟ್‌ಗಳು",
  pant: "ಪ್ಯಾಂಟ್",
  pants: "ಪ್ಯಾಂಟ್‌ಗಳು",
  trouser: "ಟ್ರಾನ್ಸರ್",
  trousers: "ಟ್ರಾನ್ಸರ್‌ಗಳು",
  jeans: "ಜೀನ್ಸ್",
  "track pant": "ಟ್ರಾಕ್ ಪ್ಯಾಂಟ್",
  "track pants": "ಟ್ರಾಕ್ ಪ್ಯಾಂಟ್‌ಗಳು",
  trackpant: "ಟ್ರಾಕ್ ಪ್ಯಾಂಟ್",
  trackpants: "ಟ್ರಾಕ್ ಪ್ಯಾಂಟ್‌ಗಳು",
  dhoti: "ಧೋತಿ",
  dhotis: "ಧೋತಿಗಳು",
  panche: "ಪಂಚೆ",
  lungi: "ಲುಂಗಿ",
  kurta: "ಕುರ್ತಾ",
  kurtas: "ಕುರ್ತಾಗಳು",
  pyjama: "ಪೈಜಾಮ",
  pyjamas: "ಪೈಜಾಮಗಳು",
  pajama: "ಪೈಜಾಮ",
  pajamas: "ಪೈಜಾಮಗಳು",
  shorts: "ಶಾರ್ಟ್ಸ್",
  boxer: "ಬಾಕ್ಸರ್",
  boxers: "ಬಾಕ್ಸರ್‌ಗಳು",
  innerwear: "ಒಳಉಡುಪು",
  underwear: "ಒಳಉಡುಪು",
  vest: "ಬನಿಯನ್",
  vests: "ಬನಿಯನ್‌ಗಳು",
  brief: "ಬ್ರೀಫ್",
  briefs: "ಬ್ರೀಫ್‌ಗಳು",
  towel: "ಟವೆಲ್",
  towels: "ಟವೆಲ್‌ಗಳು",
  handkerchief: "ಕರವಸ್ತ್ರ",
  handkerchiefs: "ಕರವಸ್ತ್ರಗಳು",

  // Types, styles & cuts
  "half collar": "ಹಾಫ್ ಕಾಲರ್",
  "full collar": "ಫುಲ್ ಕಾಲರ್",
  "half sleeve": "ಹಾಫ್ ಸ್ಲೀವ್",
  "full sleeve": "ಫುಲ್ ಸ್ಲೀವ್",
  "half-sleeve": "ಹಾಫ್ ಸ್ಲೀವ್",
  "full-sleeve": "ಫುಲ್ ಸ್ಲೀವ್",
  "short sleeve": "ಹಾಫ್ ಸ್ಲೀವ್",
  "long sleeve": "ಫುಲ್ ಸ್ಲೀವ್",
  collar: "ಕಾಲರ್",
  sleeve: "ಸ್ಲೀವ್",
  round: "ರೌಂಡ್",
  "round neck": "ರೌಂಡ್ ನೆಕ್",
  "v neck": "ವಿ ನೆಕ್",
  polo: "ಪೋಲೊ",
  formal: "ಫಾರ್ಮಲ್",
  casual: "ಕ್ಯಾಶುಯಲ್",
  party: "ಪಾರ್ಟಿ",
  regular: "ರೆಗ್ಯುಲರ್",
  slim: "ಸ್ಲಿಮ್",
  fit: "ಫಿಟ್",

  // Fabrics & Patterns
  cotton: "ಕಾಟನ್",
  pure: "ಪ್ಯೂರ್",
  silk: "ರೇಷ್ಮೆ",
  linen: "ಲಿನೆನ್",
  denim: "ಡೆನಿಮ್",
  hosiery: "ಹೋಸಿಯರಿ",
  woolen: "ಉಣ್ಣೆ",
  check: "ಚೆಕ್ಸ್",
  checks: "ಚೆಕ್ಸ್",
  checked: "ಚೆಕ್ಸ್",
  stripe: "ಗೆರೆ",
  stripes: "ಗೆರೆಗಳು",
  striped: "ಗೆರೆಗಳ",
  plain: "ಪ್ಲೇನ್",
  solid: "ಪ್ಲೇನ್",
  print: "ಪ್ರಿಂಟ್",
  printed: "ಪ್ರಿಂಟೆಡ್",

  // Colors
  white: "ಬಿಳಿ",
  black: "ಕಪ್ಪು",
  blue: "ನೀಲಿ",
  red: "ಕೆಂಪು",
  green: "ಹಸಿರು",
  yellow: "ಹಳದಿ",
  brown: "ಕಂದು",
  grey: "ಬೂದು",
  gray: "ಬೂದು",
  navy: "ನೇವಿ",
  maroon: "ಮೆರೂನ್",
  orange: "ಕಿತ್ತಳೆ",
  pink: "ಗುಲಾಬಿ",
  purple: "ನೇರಳೆ",
  beige: "ಬೀಜ್",
  assorted: "ವಿವಿಧ",
  multicolor: "ಬಹುಬಣ್ಣ",
  multicolour: "ಬಹುಬಣ್ಣ",
  standard: "ಸಾಮಾನ್ಯ",

  // Audience
  men: "ಪುರುಷರ",
  "men's": "ಪುರುಷರ",
  mens: "ಪುರುಷರ",
  boy: "ಹುಡುಗರ",
  boys: "ಹುಡುಗರ",
  "boy's": "ಹುಡುಗರ",
  kid: "ಮಕ್ಕಳ",
  kids: "ಮಕ್ಕಳ",
  "kid's": "ಮಕ್ಕಳ",

  // Sizes & attributes
  "free size": "ಫ್ರೀ ಸೈಜ್",
  free: "ಫ್ರೀ",
  size: "ಸೈಜ್",
  small: "ಸ್ಮಾಲ್",
  medium: "ಮೀಡಿಯಂ",
  large: "ಲಾರ್ಜ್",
  waist: "ಸೊಂಟ",
};

/**
 * Translates an English text to Kannada using dictionary matching and phrases.
 * If no translation exists for a specific word, retains the word cleanly.
 */
export function autoTranslateToKannada(englishText?: string | null): string {
  if (!englishText || !englishText.trim()) return "";
  const cleaned = englishText.trim();

  // 1. Direct whole phrase match
  const lower = cleaned.toLowerCase();
  if (DICTIONARY[lower]) {
    return DICTIONARY[lower];
  }

  // 2. Check multi-word phrase replacements first (e.g. "night pant", "half sleeve")
  let translated = lower;
  const multiWordKeys = Object.keys(DICTIONARY)
    .filter((k) => k.includes(" "))
    .sort((a, b) => b.length - a.length);

  for (const phrase of multiWordKeys) {
    const regex = new RegExp(`\\b${phrase}\\b`, "gi");
    if (regex.test(translated)) {
      translated = translated.replace(regex, DICTIONARY[phrase]);
    }
  }

  // 3. Word-by-word replacement for single words
  const words = translated.split(/\s+/);
  const resultWords = words.map((w) => {
    // Strip punctuation for lookup
    const cleanWord = w.toLowerCase().replace(/[^a-z0-9'-]/g, "");
    if (DICTIONARY[cleanWord]) {
      return DICTIONARY[cleanWord];
    }
    // Return word as-is if already in Kannada or no translation
    return w;
  });

  return resultWords.join(" ");
}

/**
 * Returns the localized name for a product or category based on current selected language.
 * When language is "kn", it uses the stored Kannada name or auto-translates from English.
 */
export function getLocalizedName(
  nameEn: string,
  nameKn?: string | null,
  language: "en" | "kn" = "en",
): string {
  if (language === "kn") {
    if (nameKn && nameKn.trim() && nameKn.trim() !== nameEn.trim()) {
      return nameKn.trim();
    }
    const auto = autoTranslateToKannada(nameEn);
    return auto || nameEn;
  }
  return nameEn;
}
