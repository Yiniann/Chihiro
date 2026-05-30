export const PRESENCE_HEARTBEAT_INTERVAL_MS = 60_000;
export const PRESENCE_SESSION_TTL_SECONDS = 300;
export const PRESENCE_PROGRESS_THROTTLE_MS = 3_000;
export const PRESENCE_PROGRESS_DELTA_PERCENT = 4;

export type PresenceContentType = "post" | "standalone-page";

export type PresenceReader = {
  sessionKey: string;
  label: string;
  progressPercent: number;
  currentHeading: string | null;
  connectedAt: number;
  lastSeenAt: number;
};

export type PresenceDistributionBucket = {
  id: "early" | "steady" | "deep" | "finish";
  label: string;
  min: number;
  max: number;
  count: number;
};

export type PresenceSnapshot = {
  type: "presence:snapshot";
  contentType: PresenceContentType;
  contentId: number;
  contentSlug: string;
  pathname: string;
  siteOnlineVisitors: number;
  siteActiveSessions: number;
  contentOnlineVisitors: number;
  contentActiveSessions: number;
  readers: PresenceReader[];
  distribution: PresenceDistributionBucket[];
  generatedAt: number;
};

export const PRESENCE_DISTRIBUTION_BUCKETS: Array<Omit<PresenceDistributionBucket, "count">> = [
  {
    id: "early",
    label: "0-25%",
    min: 0,
    max: 25,
  },
  {
    id: "steady",
    label: "25-50%",
    min: 25,
    max: 50,
  },
  {
    id: "deep",
    label: "50-75%",
    min: 50,
    max: 75,
  },
  {
    id: "finish",
    label: "75-100%",
    min: 75,
    max: 101,
  },
];
