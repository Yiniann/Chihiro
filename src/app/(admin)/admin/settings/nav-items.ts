import type { LucideIcon } from "lucide-react";
import { Image, MessageSquareText, Settings2, ShieldUser } from "lucide-react";

export type SettingsNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    href: "/admin/settings/users",
    label: "用户",
    description: "Owner 登录方式与第三方绑定",
    icon: ShieldUser,
  },
  {
    href: "/admin/settings/general",
    label: "常规设置",
    description: "站点基础资料与展示文案",
    icon: Settings2,
  },
  {
    href: "/admin/settings/image-hosting",
    label: "图床设置",
    description: "对象存储与图片上传",
    icon: Image,
  },
  {
    href: "/admin/settings/login-comments",
    label: "登录与评论",
    description: "公开评论、OAuth 与审核策略",
    icon: MessageSquareText,
  },
];
