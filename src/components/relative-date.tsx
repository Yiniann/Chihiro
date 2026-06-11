"use client";

import { formatInSiteTimeZone } from "@/lib/site-time";

type RelativeDateProps = {
  value: string | null;
  timeZone?: string;
};

export function RelativeDate({ value, timeZone }: RelativeDateProps) {
  if (!value) {
    return null;
  }

  const absoluteLabel = formatAbsoluteDate(value, timeZone);
  const displayLabel =
    typeof window === "undefined" ? absoluteLabel : formatRelativeDate(value, timeZone);

  return (
    <time dateTime={value} title={absoluteLabel} suppressHydrationWarning>
      {displayLabel}
    </time>
  );
}

function formatRelativeDate(value: string, timeZone?: string) {
  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return formatAbsoluteDate(value, timeZone);
  }

  const diffInDays = Math.floor((Date.now() - time) / 86_400_000);

  if (diffInDays < 0) {
    return formatAbsoluteDate(value);
  }

  if (diffInDays <= 30) {
    if (diffInDays === 0) {
      return "Today";
    }

    if (diffInDays === 1) {
      return "1 day ago";
    }

    return `${diffInDays} days ago`;
  }

  return formatAbsoluteDate(value, timeZone);
}

function formatAbsoluteDate(value: string, timeZone?: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatInSiteTimeZone(date, "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }, timeZone);
}
