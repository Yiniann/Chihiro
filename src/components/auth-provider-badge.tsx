"use client";

type AuthProviderBadgeProps = {
  provider?: "github" | "google" | "credentials" | null;
  className?: string;
};

export function AuthProviderBadge({
  provider,
  className = "",
}: AuthProviderBadgeProps) {
  if (provider !== "github" && provider !== "google") {
    return null;
  }

  return (
    <span
      className={`absolute bottom-0 right-0 inline-flex size-4 items-center justify-center rounded-full border border-white bg-white text-n-6 shadow-sm dark:border-zinc-950 dark:bg-n-1 dark:text-n-6 ${className}`}
      title={provider === "google" ? "Google 登录" : "GitHub 登录"}
      aria-label={provider === "google" ? "Google 登录" : "GitHub 登录"}
    >
      {provider === "google" ? <GoogleMark className="size-2.5" /> : <GithubMark className="size-2.5" />}
    </span>
  );
}

export function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2C6.477 2 2 6.59 2 12.252c0 4.53 2.865 8.372 6.839 9.729.5.097.683-.223.683-.496 0-.245-.009-.894-.014-1.754-2.782.618-3.369-1.37-3.369-1.37-.455-1.17-1.11-1.481-1.11-1.481-.908-.637.069-.624.069-.624 1.004.073 1.532 1.055 1.532 1.055.893 1.564 2.341 1.113 2.91.851.091-.664.35-1.113.636-1.369-2.221-.258-4.555-1.137-4.555-5.062 0-1.118.39-2.032 1.029-2.749-.103-.26-.446-1.305.098-2.72 0 0 .84-.276 2.75 1.05A9.32 9.32 0 0 1 12 6.836c.85.004 1.705.118 2.504.346 1.909-1.326 2.748-1.05 2.748-1.05.546 1.415.203 2.46.1 2.72.64.717 1.027 1.631 1.027 2.749 0 3.935-2.338 4.8-4.566 5.053.359.319.678.948.678 1.911 0 1.379-.013 2.492-.013 2.83 0 .276.18.598.688.496C19.138 20.62 22 16.78 22 12.252 22 6.59 17.523 2 12 2Z" />
    </svg>
  );
}

export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M21.805 10.023h-9.633v3.955h5.52c-.238 1.273-.954 2.352-2.028 3.077v2.554h3.286c1.923-1.798 3.028-4.447 3.028-7.586 0-.68-.061-1.336-.173-1.977Z"
        fill="#4285F4"
      />
      <path
        d="M12.172 22c2.732 0 5.023-.906 6.697-2.445l-3.286-2.554c-.906.617-2.067.98-3.41.98-2.635 0-4.867-1.798-5.663-4.213H3.115v2.635A10.1 10.1 0 0 0 12.172 22Z"
        fill="#34A853"
      />
      <path
        d="M6.509 13.768a6.147 6.147 0 0 1-.317-1.955c0-.68.115-1.336.317-1.955V7.223H3.115A10.19 10.19 0 0 0 2 11.813c0 1.643.39 3.2 1.115 4.59l3.394-2.635Z"
        fill="#FBBC05"
      />
      <path
        d="M12.172 5.646c1.485 0 2.817.52 3.865 1.54l2.894-2.922C17.19 2.62 14.9 1.625 12.172 1.625A10.1 10.1 0 0 0 3.115 7.223l3.394 2.635c.796-2.416 3.028-4.212 5.663-4.212Z"
        fill="#EA4335"
      />
    </svg>
  );
}
