import type { LucideIcon } from "lucide-react";
import { Bell, Clapperboard, Image, LogIn, Mail, MessageSquareText, Radio, Settings2, ShieldUser } from "lucide-react";

export type SettingsNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    href: "/admin/settings/users",
    label: "用户设置",
    description: "站长用户管理",
    icon: ShieldUser,
  },
  {
    href: "/admin/settings/general",
    label: "站点设置",
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
    href: "/admin/settings/media",
    label: "内容源设置",
    description: "多类型内容源配置",
    icon: Clapperboard,
  },
  {
    href: "/admin/settings/email",
    label: "邮件设置",
    description: "SMTP 发信与发件人配置",
    icon: Mail,
  },
  {
    href: "/admin/settings/subscriptions",
    label: "订阅设置",
    description: "邮件订阅入口与开关",
    icon: Bell,
  },
  {
    href: "/admin/settings/login",
    label: "登录设置",
    description: "公开用户登录与 OAuth",
    icon: LogIn,
  },
  {
    href: "/admin/settings/comments",
    label: "评论设置",
    description: "评论入口与审核策略",
    icon: MessageSquareText,
  },
  {
    href: "/admin/settings/websocket",
    label: "WebSocket 设置",
    description: "实时在线访客与阅读状态",
    icon: Radio,
  },
];
