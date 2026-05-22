"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AccountLinkButton } from "@/app/(admin)/admin/settings/users/account-link-button";
import {
  saveOwnerSettingsAction,
  unlinkOwnerProviderAction,
} from "@/app/(admin)/admin/settings/users/actions";
import { getProviderLabel } from "@/lib/account-linking";
import {
  getSocialLinkLabel,
  getSocialLinkPlaceholder,
  SOCIAL_LINK_PLATFORM_ORDER,
  type SocialLink,
  type SocialLinkPlatform,
} from "@/lib/social-links";
import { useToast } from "@/components/toast-provider";

const initialSettingsState = {
  error: null,
  success: null,
};

const OWNER_SETTINGS_FORM_ID = "owner-settings-form";
const DEFAULT_SOCIAL_ROWS: SocialLink[] = [
  { platform: "email", label: "Email", href: "" },
  { platform: "github", label: "GitHub", href: "" },
];

export function OwnerSecurityForms({
  defaultUsername,
  defaultName,
  defaultImage,
  defaultSocialLinks,
  githubEnabled,
  googleEnabled,
  linkedGithub,
  linkedGoogle,
  siteUrl,
}: {
  defaultUsername: string;
  defaultName: string;
  defaultImage: string;
  defaultSocialLinks: SocialLink[];
  githubEnabled: boolean;
  googleEnabled: boolean;
  linkedGithub: boolean;
  linkedGoogle: boolean;
  siteUrl: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const profileDefaults = useMemo(
    () => ({
      username: defaultUsername,
      name: defaultName,
      image: defaultImage,
    }),
    [defaultImage, defaultName, defaultUsername],
  );
  const socialDefaultsKey = useMemo(
    () =>
      JSON.stringify(
        defaultSocialLinks.map((link) => ({
          platform: link.platform,
          href: link.href,
        })),
      ),
    [defaultSocialLinks],
  );
  const lastSyncedSocialDefaultsKeyRef = useRef(socialDefaultsKey);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState(() => ({
    username: defaultUsername,
    name: defaultName,
    image: defaultImage,
  }));
  const [socialRows, setSocialRows] = useState<SocialLinkRow[]>(() =>
    buildInitialSocialLinkRows(defaultSocialLinks),
  );

  useEffect(() => {
    setProfile(profileDefaults);
  }, [profileDefaults]);

  useEffect(() => {
    if (lastSyncedSocialDefaultsKeyRef.current === socialDefaultsKey) {
      return;
    }

    lastSyncedSocialDefaultsKeyRef.current = socialDefaultsKey;
    setSocialRows(buildInitialSocialLinkRows(defaultSocialLinks));
  }, [defaultSocialLinks, socialDefaultsKey]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const result = await saveOwnerSettingsAction(
      initialSettingsState,
      new FormData(event.currentTarget),
    );

    if (result.error) {
      showToast(result.error, "error");
      setIsSubmitting(false);
      return;
    }

    if (result.success) {
      showToast(result.success);
      router.refresh();
    }

    setIsSubmitting(false);
  }

  return (
    <div className="mt-8 grid gap-10">
      <form
        id={OWNER_SETTINGS_FORM_ID}
        onSubmit={handleSubmit}
        className="grid gap-10"
      >
        <OwnerProfileSection
          profile={profile}
          onChange={setProfile}
          disabled={isSubmitting}
        />
        <OwnerSocialLinksSection rows={socialRows} onChange={setSocialRows} disabled={isSubmitting} />
      </form>
      <OwnerBindingSection
        githubEnabled={githubEnabled}
        googleEnabled={googleEnabled}
        linkedGithub={linkedGithub}
        linkedGoogle={linkedGoogle}
        siteUrl={siteUrl}
      />
    </div>
  );
}

function OwnerProfileSection({
  profile,
  onChange,
  disabled,
}: {
  profile: {
    username: string;
    name: string;
    image: string;
  };
  onChange: (
    updater:
      | {
          username: string;
          name: string;
          image: string;
        }
      | ((
          current: {
            username: string;
            name: string;
            image: string;
          },
        ) => {
          username: string;
          name: string;
          image: string;
        }),
  ) => void;
  disabled: boolean;
}) {
  return (
    <section className="grid gap-5 border-t border-zinc-200/80 pt-6 dark:border-zinc-800/80">
      <SectionTitle title="基本信息" description="公开展示的名称和头像。" />
      <div className="grid gap-0">
        <FormRow label="昵称">
          <input
            name="name"
            type="text"
            value={profile.name}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            className="h-12 w-full rounded-2xl border border-zinc-200/80 bg-white px-4 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
            placeholder="输入公开显示名称"
          />
        </FormRow>
        <FormRow label="用户名">
          <input
            name="username"
            type="text"
            value={profile.username}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                username: event.target.value,
              }))
            }
            className="h-12 w-full rounded-2xl border border-zinc-200/80 bg-white px-4 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
            placeholder="输入登录用户名"
          />
        </FormRow>
        <FormRow
          label="头像 URL"
          description="支持站内相对路径或完整 https 链接。"
        >
          <input
            name="image"
            type="text"
            value={profile.image}
            disabled={disabled}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                image: event.target.value,
              }))
            }
            className="h-12 w-full rounded-2xl border border-zinc-200/80 bg-white px-4 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
            placeholder="/avatar.png 或 https://example.com/avatar.png"
          />
        </FormRow>
      </div>
    </section>
  );
}

function OwnerSocialLinksSection({
  rows,
  onChange,
  disabled,
}: {
  rows: SocialLinkRow[];
  onChange: React.Dispatch<React.SetStateAction<SocialLinkRow[]>>;
  disabled: boolean;
}) {
  function handleAddRow() {
    if (disabled) {
      return;
    }

    onChange((current) => [
      ...current,
      {
        id: createSocialLinkRowId(),
        platform: "telegram",
        href: "",
      },
    ]);
  }

  return (
    <section className="grid gap-5 border-t border-zinc-200/80 pt-6 dark:border-zinc-800/80">
      <div className="flex items-center justify-between gap-4">
        <SectionTitle title="社交链接" />
        <button
          type="button"
          onClick={handleAddRow}
          disabled={disabled}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          添加链接
        </button>
      </div>
      <div className="grid gap-3 border-b border-zinc-200/80 py-5 dark:border-zinc-800/80">
        {rows.map((row) => (
          <SocialLinkRowEditor
            key={row.id}
            row={row}
            disabled={disabled}
            onChange={(nextRow) => {
              onChange((current) =>
                current.map((item) => (item.id === nextRow.id ? nextRow : item)),
              );
            }}
            onRemove={() => {
              onChange((current) => current.filter((item) => item.id !== row.id));
            }}
          />
        ))}
      </div>
    </section>
  );
}

type SocialLinkRow = {
  id: string;
  platform: SocialLinkPlatform;
  href: string;
};

function SocialLinkRowEditor({
  row,
  onChange,
  onRemove,
  disabled,
}: {
  row: SocialLinkRow;
  onChange: (row: SocialLinkRow) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-3 border-b border-zinc-200/70 pb-3 last:border-b-0 dark:border-zinc-800/70">
      <div className="grid gap-3 md:grid-cols-[12rem_minmax(0,1fr)_auto] md:items-center">
        <select
          name="socialLinkPlatform"
          value={row.platform}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...row,
              platform: event.target.value as SocialLinkPlatform,
            })
          }
          className="h-11 rounded-2xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-zinc-400 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:text-zinc-200 dark:focus:border-zinc-600"
        >
          {SOCIAL_LINK_PLATFORM_ORDER.map((platform) => (
            <option key={platform} value={platform}>
              {getSocialLinkLabel(platform)}
            </option>
          ))}
        </select>
        <input
          name="socialLinkUrl"
          type="text"
          value={row.href}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...row,
              href: event.target.value,
            })
          }
          className="h-11 w-full rounded-2xl border border-zinc-200/80 bg-white px-4 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
          placeholder={getSocialLinkPlaceholder(row.platform)}
        />
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="text-zinc-400 transition hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

function buildInitialSocialLinkRows(defaultSocialLinks: SocialLink[]) {
  const rows = defaultSocialLinks.map((link) => ({
    id: createSocialLinkRowId(),
    platform: link.platform,
    href: link.platform === "email" ? link.href.replace(/^mailto:/i, "") : link.href,
  }));

  for (const defaultRow of [...DEFAULT_SOCIAL_ROWS].reverse()) {
    if (!rows.some((row) => row.platform === defaultRow.platform)) {
      rows.unshift({
        id: createSocialLinkRowId(),
        platform: defaultRow.platform,
        href: defaultRow.href,
      });
    }
  }

  return rows;
}

function createSocialLinkRowId() {
  return `social-link-${Math.random().toString(36).slice(2, 10)}`;
}

function OwnerBindingSection({
  githubEnabled,
  googleEnabled,
  linkedGithub,
  linkedGoogle,
  siteUrl,
}: {
  githubEnabled: boolean;
  googleEnabled: boolean;
  linkedGithub: boolean;
  linkedGoogle: boolean;
  siteUrl: string;
}) {
  return (
    <section className="grid gap-5 border-t border-zinc-200/80 pt-6 dark:border-zinc-800/80">
      <SectionTitle title="绑定方式" description="管理当前 Owner 的第三方登录绑定。" />
      <div className="grid gap-0">
        <ProviderLinkRow
          provider="github"
          enabled={githubEnabled}
          linked={linkedGithub}
          siteUrl={siteUrl}
        />
        <ProviderLinkRow
          provider="google"
          enabled={googleEnabled}
          linked={linkedGoogle}
          siteUrl={siteUrl}
        />
      </div>
    </section>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="grid gap-1">
      <p className="text-lg font-medium tracking-tight text-zinc-950 dark:text-zinc-50">{title}</p>
      {description ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
    </div>
  );
}

function FormRow({
  label,
  description,
  children,
}: {
  label?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-zinc-200/80 py-5 dark:border-zinc-800/80 md:grid-cols-[11rem_minmax(0,1fr)] md:items-start md:gap-6">
      <div className="grid gap-1">
        {label ? (
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{label}</p>
        ) : null}
        {description ? (
          <p className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ProviderLinkRow({
  provider,
  enabled,
  linked,
  siteUrl,
}: {
  provider: "github" | "google";
  enabled: boolean;
  linked: boolean;
  siteUrl: string;
}) {
  const label = getProviderLabel(provider);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/80 py-5 last:border-b-0 dark:border-zinc-800/80">
      <div>
        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{label}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {linked ? "已经绑定到当前 Owner 帐号" : enabled ? "可绑定到当前 Owner 帐号" : "当前未配置"}
        </p>
      </div>
      {linked ? (
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            已绑定
          </span>
          <form action={unlinkOwnerProviderAction}>
            <input type="hidden" name="provider" value={provider} />
            <button
              type="submit"
              className="text-sm font-medium text-rose-600 transition hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
            >
              解除绑定
            </button>
          </form>
        </div>
      ) : enabled ? (
        <AccountLinkButton provider={provider} label={label} siteUrl={siteUrl} />
      ) : (
        <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          未启用
        </span>
      )}
    </div>
  );
}
