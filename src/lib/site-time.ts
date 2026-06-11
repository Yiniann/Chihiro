import { siteConfig } from "@/lib/site";

export const SITE_TIME_ZONE = siteConfig.timeZone;

export function formatInSiteTimeZone(
  value: string | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions,
  timeZone = SITE_TIME_ZONE,
) {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }

  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone,
  }).format(date);
}

export function getYearInSiteTimeZone(value: string | Date, timeZone = SITE_TIME_ZONE) {
  return formatInSiteTimeZone(value, "en", { year: "numeric" }, timeZone);
}

export function parseSiteDateTimeInput(value: string, timeZone = SITE_TIME_ZONE) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})$/,
  );

  if (!match) {
    throw new Error("请填写有效的发布日期。");
  }

  const [, year, month, day, hour, minute] = match;
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  const numericHour = Number(hour);
  const numericMinute = Number(minute);

  if (
    !Number.isInteger(numericYear) ||
    numericMonth < 1 ||
    numericMonth > 12 ||
    numericHour < 0 ||
    numericHour > 23 ||
    numericMinute < 0 ||
    numericMinute > 59
  ) {
    throw new Error("请填写有效的发布日期。");
  }

  const daysInMonth = new Date(Date.UTC(numericYear, numericMonth, 0)).getUTCDate();

  if (numericDay < 1 || numericDay > daysInMonth) {
    throw new Error("请填写有效的发布日期。");
  }

  const offsetMinutes = getTimeZoneOffsetMinutes(
    new Date(Date.UTC(numericYear, numericMonth - 1, numericDay, numericHour, numericMinute)),
    timeZone,
  );

  return new Date(
    Date.UTC(
      numericYear,
      numericMonth - 1,
      numericDay,
      numericHour,
      numericMinute - offsetMinutes,
    ),
  );
}

export function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const offset = new Intl.DateTimeFormat("en", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  if (!offset || offset === "GMT") {
    return 0;
  }

  const match = offset.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);

  if (!match) {
    return 0;
  }

  const [, sign, hours, minutes] = match;
  const totalMinutes = Number(hours) * 60 + Number(minutes ?? "0");
  return sign === "-" ? -totalMinutes : totalMinutes;
}
