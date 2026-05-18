"use client";

import { useActionState, useEffect } from "react";
import {
  saveImageHostingSettingsAction,
  type SaveImageHostingSettingsState,
} from "@/app/(admin)/admin/settings/image-hosting/actions";
import { useToast } from "@/components/toast-provider";

const initialState: SaveImageHostingSettingsState = {
  error: null,
  success: null,
};

type ImageHostingSettingsFormProps = {
  defaults: {
    provider: "R2" | "S3";
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    publicBaseUrl: string;
    keyPrefix: string;
    forcePathStyle: boolean;
    hasSecretAccessKey: boolean;
  };
  canEdit: boolean;
};

export function ImageHostingSettingsForm({ defaults, canEdit }: ImageHostingSettingsFormProps) {
  const [state, formAction] = useActionState(saveImageHostingSettingsAction, initialState);
  useSettingsToast(state);

  return (
    <form id="image-hosting-settings-form" action={formAction} className="grid gap-6">
      <section className="grid gap-6 md:grid-cols-2">
        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            存储服务
          </span>
          <select
            name="provider"
            defaultValue={defaults.provider}
            className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition focus:outline-none dark:text-zinc-200"
          >
            <option value="R2">Cloudflare R2</option>
            <option value="S3">Amazon S3 / S3 兼容服务</option>
          </select>
        </label>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            区域
          </span>
          <input
            name="region"
            type="text"
            required
            defaultValue={defaults.region}
            className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="auto 或 us-east-1"
          />
        </label>

        <div className="md:col-span-2">
          <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              S3 API 接口地址
            </span>
            <input
              name="endpoint"
              type="url"
              defaultValue={defaults.endpoint}
              className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder="https://<account-id>.r2.cloudflarestorage.com"
            />
            <span className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
              R2 必填；标准 S3 可以留空使用 AWS 默认接口地址。
            </span>
          </label>
        </div>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            存储桶
          </span>
          <input
            name="bucket"
            type="text"
            required
            defaultValue={defaults.bucket}
            className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="my-bucket"
          />
        </label>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            文件路径前缀
          </span>
          <input
            name="keyPrefix"
            type="text"
            defaultValue={defaults.keyPrefix}
            className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="uploads/images"
          />
        </label>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            访问密钥 ID
          </span>
          <input
            name="accessKeyId"
            type="text"
            required
            defaultValue={defaults.accessKeyId}
            className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder="对象存储访问密钥 ID"
          />
        </label>

        <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            访问密钥 Secret
          </span>
          <input
            name="secretAccessKey"
            type="password"
            required={!defaults.hasSecretAccessKey}
            className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
            placeholder={defaults.hasSecretAccessKey ? "留空保持现有密钥" : "对象存储访问密钥 Secret"}
          />
        </label>

        <div className="md:col-span-2">
          <label className="grid gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              公开访问地址
            </span>
            <input
              name="publicBaseUrl"
              type="url"
              required
              defaultValue={defaults.publicBaseUrl}
              className="h-11 bg-transparent px-0 text-base text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-600"
              placeholder="https://img.example.com"
            />
            <span className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
              上传成功后，正文图片会使用这个地址拼接对象文件路径。
            </span>
          </label>
        </div>

        <label className="flex items-start gap-3 md:col-span-2">
          <input
            name="forcePathStyle"
            type="checkbox"
            value="1"
            defaultChecked={defaults.forcePathStyle}
            className="mt-1 size-4"
          />
          <span className="grid gap-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              使用 path-style 请求
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              R2 通常需要开启；标准 S3 如果使用虚拟主机风格访问可以关闭。
            </span>
          </span>
        </label>
      </section>

      <section className="grid gap-3">
        {!canEdit ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            只有 Owner 可以修改设置。
          </div>
        ) : null}
      </section>
    </form>
  );
}

function useSettingsToast(state: SaveImageHostingSettingsState) {
  const { showToast } = useToast();

  useEffect(() => {
    if (state.error) {
      showToast(state.error, "error");
      return;
    }

    if (state.success) {
      showToast(state.success);
    }
  }, [showToast, state.error, state.success]);
}
