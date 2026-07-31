import * as UAParserLib from "ua-parser-js";

export const parseDevice = (userAgent: string) => {
  const UAParser = (UAParserLib as any).default || UAParserLib;
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  let device = "Desktop";
  if (result.device.type === "mobile") device = result.device.model || "Mobile";
  else if (result.device.type === "tablet")
    device = result.device.model || "Tablet";

  return {
    device,
    browser: result.browser.name || "Unknown",
    os: result.os.name || "Unknown",
  };
};
