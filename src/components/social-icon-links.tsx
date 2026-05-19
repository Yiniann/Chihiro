"use client";

import { Mail, MessageCircle, Send } from "lucide-react";
import { GithubMark } from "@/components/auth-provider-badge";
import type { SocialLink, SocialLinkPlatform } from "@/lib/social-links";

export function SocialIconLinks({
  links,
  className = "",
}: {
  links: SocialLink[];
  className?: string;
}) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`.trim()}>
      {links.map((link) => (
        <a
          key={`${link.platform}-${link.href}`}
          href={link.href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={link.label}
          title={link.label}
          className="inline-flex items-center justify-center text-zinc-700/85 transition hover:-translate-y-0.5 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
        >
          <SocialPlatformIcon platform={link.platform} />
        </a>
      ))}
    </div>
  );
}

function SocialPlatformIcon({ platform }: { platform: SocialLinkPlatform }) {
  switch (platform) {
    case "email":
      return <Mail className="block h-[18px] w-[18px] shrink-0" strokeWidth={1.9} aria-hidden="true" />;
    case "github":
      return <GithubMark className="block h-[18px] w-[18px] shrink-0" />;
    case "instagram":
      return <InstagramMark />;
    case "telegram":
      return <Send className="block h-[18px] w-[18px] shrink-0" strokeWidth={1.9} aria-hidden="true" />;
    case "whatsapp":
      return <MessageCircle className="block h-[18px] w-[18px] shrink-0" strokeWidth={1.9} aria-hidden="true" />;
    case "bilibili":
      return <BilibiliMark />;
    case "x":
      return <XMark />;
    default:
      return null;
  }
}

function BilibiliMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      aria-hidden="true"
      className="block h-[18px] w-[18px] shrink-0"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 5 6.2 3.2M16 5l1.8-1.8" />
      <rect x="4" y="6.5" width="16" height="12" rx="3.5" />
      <path d="M9.5 11v3M14.5 11v3M8.5 16h7" />
    </svg>
  );
}

function InstagramMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      aria-hidden="true"
      className="block h-[18px] w-[18px] shrink-0"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      aria-hidden="true"
      className="block h-[18px] w-[18px] shrink-0"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 4h3.4L19 20h-3.4L5 4Z" />
      <path d="M19 4 12.8 11M11.2 13 5 20" />
    </svg>
  );
}
