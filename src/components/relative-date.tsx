"use client";

type RelativeDateProps = {
  value: string | null;
};

export function RelativeDate({ value }: RelativeDateProps) {
  if (!value) {
    return null;
  }

  const absoluteLabel = formatAbsoluteDate(value);
  const displayLabel =
    typeof window === "undefined" ? absoluteLabel : formatRelativeDate(value);

  return (
    <time dateTime={value} title={absoluteLabel} suppressHydrationWarning>
      {displayLabel}
    </time>
  );
}

function formatRelativeDate(value: string) {
  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return formatAbsoluteDate(value);
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

  return formatAbsoluteDate(value);
}

function formatAbsoluteDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
