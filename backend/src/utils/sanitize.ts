// utils/sanitize.ts
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

export const sanitizeText = (text: string) => {
  return purify.sanitize(text, { ALLOWED_TAGS: [] }); // هیچ تگی مجاز نیست
};