"use client";

import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { Send, Smile } from "lucide-react";
import { useActionState, useRef, useState, type CSSProperties } from "react";
import { useFormStatus } from "react-dom";
import {
  submitPostCommentAction,
  type SubmitCommentState,
} from "@/app/(site)/posts/[...slug]/comment-actions";
import type { CommentTargetType } from "@/server/repositories/comments";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/tiptap-ui-primitive/popover/popover";
import { AuthProviderBadge } from "@/components/auth-provider-badge";
import { useToast } from "@/components/toast-provider";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";

const initialState: SubmitCommentState = {
  error: null,
  success: null,
};
const commentMaxLength = 512;
const KAOMOJI_LIST = [
  "(⌒▽⌒)☆",
  "<(￣︶￣)>",
  "ヽ(・∀・)ﾉ",
  "(￣ω￣)",
  "(o･ω･o)",
  "(＠＾◡＾)",
  "(^人^)",
  "(o´▽`o)",
  "(*´▽`*)",
  "(≧◡≦)",
  "(o´∀`o)",
  "(＾▽＾)",
  "(⌒ω⌒)",
  "╰(▔∀▔)╯",
  "(─‿‿─)",
  "(*^‿^*)",
  "(✯◡✯)",
  "(◕‿◕)",
  "(*≧ω≦*)",
  "(☆▽☆)",
  "(⌒‿⌒)",
  "＼(≧▽≦)／",
  "(*°▽°*)",
  "(✧ω✧)",
  "(￣▽￣)",
  "o(≧▽≦)o",
  "(☆ω☆)",
  "＼(￣▽￣)／",
  "(*¯︶¯*)",
  "＼(＾▽＾)／",
  "٩(◕‿◕)۶",
  "(o˘◡˘o)",
  "\\(★ω★)/",
  "\\(^ヮ^)/",
  "(〃＾▽＾〃)",
  "(╯✧▽✧)╯",
  "o(>ω<)o",
  "(๑˃ᴗ˂)ﻭ",
  "(๑˘︶˘๑)",
  "(⁀ᗢ⁀)",
  "(*￣▽￣)b",
  "( ˙▿˙ )",
  "(¯▿¯)",
  "( ◕▿◕ )",
  "(ᵔ◡ᵔ)",
  "(♡μ_μ)",
  "(*^^*)♡",
  "(♡-_-♡)",
  "(￣ε￣＠)",
  "ヽ(♡‿♡)ノ",
  "(─‿‿─)♡",
  "(*♡∀♡)",
  "(◕‿◕)♡",
  "(ღ˘⌣˘ღ)",
  "(♡°▽°♡)",
  "(♡˙︶˙♡)",
  "(≧◡≦) ♡",
  "(⌒▽⌒)♡",
  "٩(♡ε♡)۶",
  "♡ (￣З￣)",
  "(❤ω❤)",
  "(´♡‿♡`)",
  "(°◡°♡)",
  "(´꒳`)♡",
  "♡(>ᴗ•)",
  "(⌒_⌒;)",
  "(o^ ^o)",
  "(*/ω＼)",
  "(*/。＼)",
  "(*/_＼)",
  "(*ﾉωﾉ)",
  "(o-_-o)",
  "(*μ_μ)",
  "(ᵔ.ᵔ)",
  "(*ﾉ∀`*)",
  "(//▽//)",
  "(//ω//)",
  "(*^.^*)",
  "(*ﾉ▽ﾉ)",
  "(￣▽￣*)ゞ",
  "(*/▽＼*)",
  "(„ಡωಡ„)",
  "( 〃▽〃)",
  "(/▿＼ )",
  "(＃＞＜)",
  "(；￣Д￣)",
  "(￣□￣」)",
  "(＃￣0￣)",
  "(＃￣ω￣)",
  "(￢_￢;)",
  "(＞ｍ＜)",
  "(」°ロ°)」",
  "(＾＾＃)",
  "(︶︹︺)",
  "(￣ヘ￣)",
  "(￣︿￣)",
  "(＞﹏＜)",
  "(--_--)",
  "凸(￣ヘ￣)",
  "(⇀‸↼‶)",
  "o(>< )o",
  "(」＞＜)」",
  "(ᗒᗣᗕ)՞",
  "(눈_눈)",
  "(＃`Д´)",
  "(`皿´＃)",
  "(・`ω´・)",
  "(`ー´)",
  "凸(`△´＃)",
  "( `ε´ )",
  "ヽ(‵﹏´)ノ",
  "(╬`益´)",
  "Σ(▼□▼メ)",
  "(°ㅂ°╬)",
  "(ノ°益°)ノ",
  "(‡▼益▼)",
  "(╬ Ò﹏Ó)",
  "(凸ಠ益ಠ)凸",
  "٩(ఠ益ఠ)۶",
  "(ﾉಥ益ಥ)ﾉ",
  "(≖､≖╬)",
  "(ノ_<。)",
  "(-_-)",
  "(´-ω-`)",
  "(μ_μ)",
  "(ﾉД`)",
  "(-ω-、)",
  "o(TヘTo)",
  "(｡╯︵╰｡)",
  "(个_个)",
  "(╯︵╰,)",
  "( ╥ω╥ )",
  "(╯_╰)",
  "(╥_╥)",
  "(／ˍ・、)",
  "(ノ_<、)",
  "(╥﹏╥)",
  "(つω`｡)",
  "(ﾉω･､)",
  "(T_T)",
  "(>_<)",
  "o(〒﹏〒)o",
  "(ಥ﹏ಥ)",
  "(ಡ‸ಡ)",
  "~(>_<~)",
  "☆⌒(>。<)",
  "(☆_@)",
  "(×_×)",
  "(x_x)",
  "(×_×)⌒☆",
  "(x_x)⌒☆",
  "(×﹏×)",
  "☆(＃××)",
  "(＋_＋)",
  "٩(× ×)۶",
  "(ﾒ﹏ﾒ)",
  "(ノωヽ)",
  "(／。＼)",
  "(ﾉ_ヽ)",
  "(″ロ゛)",
  "(・人・)",
  "＼(〇_ｏ)／",
  "(/ω＼)",
  "(/_＼)",
  "〜(＞＜)〜",
  "┐(￣ヘ￣)┌",
  "╮(￣_￣)╭",
  "ヽ(ˇヘˇ)ノ",
  "┐(￣～￣)┌",
  "┐(︶▽︶)┌",
  "╮(￣～￣)╭",
  "╮(︶︿︶)╭",
  "┐(￣∀￣)┌",
  "╮(︶▽︶)╭",
  "┐(￣ヮ￣)┌",
  "ᕕ( ᐛ )ᕗ",
  "┐(シ)┌",
  "(￣ω￣;)",
  "σ(￣、￣〃)",
  "(￣～￣;)",
  "(・_・ヾ",
  "(〃￣ω￣〃ゞ",
  "(・_・;)",
  "(＠_＠)",
  "(・・;)ゞ",
  "Σ(￣。￣ﾉ)",
  "(・・ ) ?",
  "(◎ ◎)ゞ",
  "(ーー;)",
  "(¯ ¯٥)",
  "(￢_￢)",
  "(→_→)",
  "(￢ ￢)",
  "(￢‿￢ )",
  "(¬_¬ )",
  "(←_←)",
  "(¬ ¬ )",
  "(¬‿¬ )",
  "(↼_↼)",
  "(⇀_⇀)",
  "(ᓀ ᓀ)",
  "w(°ｏ°)w",
  "ヽ(°〇°)ﾉ",
  "Σ(O_O)",
  "Σ(°ロ°)",
  "(⊙_⊙)",
  "(o_O)",
  "(O_O;)",
  "(O.O)",
  "(°ロ°) !",
  "(o_O) !",
  "(□_□)",
  "Σ(□_□)",
  "∑(O_O;)",
  "(*・ω・)ﾉ",
  "(￣▽￣)ノ",
  "(°▽°)/",
  "(^-^*)/",
  "＼(⌒▽⌒)",
  "ヾ(☆▽☆)",
  "(^０^)ノ",
  "~ヾ(・ω・)",
  "(・∀・)ノ",
  "ヾ(・ω・*)",
  "(*°ｰ°)ﾉ",
  "(・_・)ノ",
  "(￣ω￣)/",
  "(⌒ω⌒)ﾉ",
  "(≧▽≦)/",
  "(✧∀✧)/",
  "(￣▽￣)/",
  "(つ≧▽≦)つ",
  "(つ✧ω✧)つ",
  "(っಠ‿ಠ)っ",
  "(づ◡﹏◡)づ",
  "⊂(￣▽￣)⊃",
  "(^_~)",
  "( ﾟｏ⌒)",
  "(^_- )≡☆",
  "(^ω~)",
  "(>ω^)",
  "(~人^)",
  "(^_-)",
  "( -_・)",
  "(^_<)〜☆",
  "(^人<)〜☆",
  "☆⌒(ゝ。∂)",
  "(^_<)",
  "(^_−)☆",
  "(･ω<)☆",
  "(^.~)☆",
  "(^.~)",
  "(>ᴗ•)",
  "m(_ _)m",
  "(シ_ _)シ",
  "m(. .)m",
  "<(_ _)>",
  "人(_ _*)",
  "(*_ _)人",
  "(シ. .)シ",
  "(*￣ii￣)",
  "(￣ﾊ￣*)",
  "\\(￣ﾊ￣)",
  "(＾་།＾)",
  "(＾〃＾)",
  "(￣ ¨ヽ￣)",
  "(￣ ;￣)",
  "(￣ ;;￣)",
  "|･ω･)",
  "ﾍ(･_|",
  "|ω･)ﾉ",
  "ヾ(･|",
  "|д･)",
  "|_￣))",
  "|▽//)",
  "|_・)",
  "|･д･)ﾉ",
  "|ʘ‿ʘ)╯",
  "__φ(．．)",
  "__φ(。。)",
  "(=①ω①=)",
  "(=`ω´=)",
  "(=^‥^=)",
  "( =ω= )",
  "(^◔ᴥ◔^)",
  "(^◕ᴥ◕^)",
  "ต(=ω=)ต",
  "(￣(ｴ)￣)",
  "(／(ｴ)＼)",
  "ʕ ᵔᴥᵔ ʔ",
  "ʕ •ᴥ• ʔ",
  "ʕಠᴥಠʔ",
  "∪＾ェ＾∪",
  "∪･ω･∪",
  "∪￣-￣∪",
  "∪･ｪ･∪",
  "Ｕ^皿^Ｕ",
  "ＵＴｪＴＵ",
  "U^ｪ^U",
  "V●ᴥ●V",
  "U・ᴥ・U",
  "／(＞×＜)＼",
  "／(˃ᆺ˂)＼",
  "(￣(ω)￣)",
  "(￣Θ￣)",
  "(`･Θ･´)",
  "(◉Θ◉)",
  "(･θ･)",
  "(・Θ・)",
  "(･Θ･)",
  "ζ°)))彡",
  ">°))))彡",
  "(°))<<",
  "―(T_T)→",
  "Q(`⌒´Q)",
  "(っ˘ڡ˘ς)",
  "ヘ(￣ω￣ヘ)",
  "(〜￣▽￣)〜",
  "〜(￣▽￣〜)",
  "(ﾉ≧∀≦)ﾉ",
  "√(￣‥￣√)",
  "└(＾＾)┐",
  "┌(＾＾)┘",
  "＼(￣▽￣)＼",
  "／(￣▽￣)／",
  "(^_^♪)",
  "(~˘▽˘)~",
  "~(˘▽˘~)",
  "(〜￣△￣)〜",
  "(~‾▽‾)~",
  "~(˘▽˘)~",
  "(≖ ͜ʖ≖)",
  "(￣^￣)ゞ",
  "(－‸ლ)",
  "(oT-T)尸",
  "(ಠ_ಠ)",
  "(￣﹃￣)",
  "(　･ω･)☞",
  "(⌐■_■)",
  "(◕‿◕✿)",
];

function getStableKaomojiTriggerLabel(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return KAOMOJI_LIST[hash % KAOMOJI_LIST.length] ?? "(//ω//)";
}

type PostCommentFormProps = {
  targetType: CommentTargetType;
  targetId: number;
  parentId?: string | null;
  pathname: string;
  formId?: string;
  showGuestFields?: boolean;
  compact?: boolean;
  placeholder?: string;
  submitLabel?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onSuccess?: () => void;
};

export function PostCommentForm({
  targetType,
  targetId,
  parentId = null,
  pathname,
  formId,
  showGuestFields = false,
  compact = false,
  placeholder = "写下你的想法...",
  submitLabel = "Send",
  user = null,
  onSuccess,
}: PostCommentFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isMobile = useIsBreakpoint();
  const [bodyLength, setBodyLength] = useState(0);
  const stableKaomojiTriggerLabel = getStableKaomojiTriggerLabel(
    `${targetType}:${targetId}:${parentId ?? "root"}:${pathname}:${compact ? "compact" : "default"}`,
  );
  const { showToast } = useToast();
  const [, formAction] = useActionState(async (previousState: SubmitCommentState, formData: FormData) => {
    const nextState = await submitPostCommentAction(previousState, formData);

    if (!nextState.error) {
      formRef.current?.reset();
      setBodyLength(0);
      onSuccess?.();
    }

    if (nextState.error) {
      showToast(nextState.error, "error");
    } else if (nextState.success) {
      showToast(nextState.success, "success");
    }

    return nextState;
  }, initialState);

  function insertText(text: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const selectionStart = textarea.selectionStart ?? textarea.value.length;
    const selectionEnd = textarea.selectionEnd ?? textarea.value.length;
    const textWithSpacing = `${selectionStart > 0 ? " " : ""}${text}`;
    const nextValue =
      textarea.value.slice(0, selectionStart) +
      textWithSpacing +
      textarea.value.slice(selectionEnd);
    const nextCursorPosition = selectionStart + textWithSpacing.length;

    textarea.value = nextValue;
    textarea.focus();
    textarea.setSelectionRange(nextCursorPosition, nextCursorPosition);
    setBodyLength(nextValue.length);
  }

  return (
    <form id={formId} ref={formRef} action={formAction} className="grid gap-3">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <input type="hidden" name="pathname" value={pathname} />
      {showGuestFields ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="site-eyebrow uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
              邮箱
            </span>
            <input
              type="email"
              name="authorEmail"
              maxLength={254}
              required
              className="h-10 rounded-md border border-zinc-200/80 bg-white/70 px-3 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-zinc-800/80 dark:bg-zinc-950/55 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950/80"
              placeholder="you@example.com"
            />
          </label>
          <label className="grid gap-2">
            <span className="site-eyebrow uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
              昵称
            </span>
            <input
              name="authorName"
              maxLength={40}
              className="h-10 rounded-md border border-zinc-200/80 bg-white/70 px-3 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-zinc-800/80 dark:bg-zinc-950/55 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950/80"
              placeholder="可选"
            />
          </label>
        </div>
      ) : null}
      <div className={user ? "grid grid-cols-[2.25rem_1fr] gap-3" : "grid gap-2"}>
        {user ? <UserAvatar user={user} /> : null}
        <label className="grid gap-2">
          {!user ? (
            <span className="site-eyebrow uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
              留言
            </span>
          ) : null}
          <div className="overflow-hidden rounded-md border border-zinc-200/80 bg-transparent transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 dark:border-zinc-800/80">
            <textarea
              ref={textareaRef}
              name="body"
              rows={compact ? 2 : user ? 3 : 4}
              maxLength={commentMaxLength}
              required
              onChange={(event) => setBodyLength(event.currentTarget.value.length)}
              className={`site-body block w-full resize-none border-0 bg-transparent px-3 py-2 text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-600 ${
                compact ? "min-h-20" : "min-h-28"
              }`}
              placeholder={placeholder}
            />
            <div
              className={`grid h-9 items-center gap-3 border-t border-zinc-200/70 px-3 dark:border-zinc-800/70 ${
                isMobile ? "grid-cols-[1fr_auto]" : "grid-cols-[1fr_auto_1fr]"
              }`}
            >
              <div className="site-eyebrow flex items-center gap-3 text-primary/80 dark:text-primary/75">
                <EmojiInsertPopover onSelect={insertText} />
                <CommentInsertPopover
                  label={stableKaomojiTriggerLabel}
                  items={KAOMOJI_LIST}
                  onSelect={insertText}
                  itemClassName="text-xs"
                  widthClassName="w-80"
                />
              </div>
              {isMobile ? null : (
                <span className="site-eyebrow justify-self-center text-primary/80 dark:text-primary/75">
                  支持 Markdown / GFM
                </span>
              )}
              <div className="flex items-center justify-end gap-3 justify-self-end">
                <span className="site-eyebrow text-zinc-400 dark:text-zinc-500">
                  {bodyLength}/{commentMaxLength}
                </span>
                <SubmitButton label={submitLabel} />
              </div>
            </div>
          </div>
        </label>
      </div>
    </form>
  );
}

function EmojiInsertPopover({ onSelect }: { onSelect: (value: string) => void }) {
  const emojiPickerStyle = {
    "--epr-emoji-size": "26px",
    "--epr-emoji-padding": "4px",
  } as CSSProperties;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="border-b border-transparent px-0 py-0 text-xs text-primary/80 transition hover:border-primary/35 hover:text-primary dark:text-primary/75 dark:hover:border-primary/35 dark:hover:text-primary"
          aria-label="Emoji"
        >
          <Smile className="size-3.5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/80 p-0 shadow-sm backdrop-blur-sm dark:border-white/14 dark:bg-[rgba(255,255,255,0.06)] dark:shadow-[0_18px_45px_rgba(2,6,23,0.06)]"
      >
        <EmojiPicker
          onEmojiClick={(emojiData: EmojiClickData) => onSelect(emojiData.emoji)}
          width="100%"
          height={384}
          style={emojiPickerStyle}
          searchDisabled={false}
          skinTonesDisabled={false}
          previewConfig={{ showPreview: false }}
          theme={Theme.AUTO}
          lazyLoadEmojis
        />
      </PopoverContent>
    </Popover>
  );
}

function CommentInsertPopover({
  label,
  items,
  onSelect,
  itemClassName,
  widthClassName,
}: {
  label: string;
  items: string[];
  onSelect: (value: string) => void;
  itemClassName: string;
  widthClassName: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="border-b border-transparent px-0 py-0 text-xs text-primary/80 transition hover:border-primary/35 hover:text-primary dark:text-primary/75 dark:hover:border-primary/35 dark:hover:text-primary"
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className={`${widthClassName} rounded-2xl border border-zinc-200/80 bg-white/80 p-2 shadow-sm backdrop-blur-sm dark:border-white/14 dark:bg-[rgba(255,255,255,0.06)] dark:shadow-[0_18px_45px_rgba(2,6,23,0.06)]`}
      >
        <div className="grid h-[24rem] grid-cols-4 gap-1 overflow-y-auto">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`flex min-h-10 min-w-0 items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80 ${itemClassName}`}
            >
              {item}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function UserAvatar({
  user,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider?: "github" | "google" | "credentials" | null;
  };
}) {
  const label = user.name ?? user.email ?? "你";

  return (
    <span className="relative mt-1 block size-9 shrink-0">
      {user.image ? (
        <span
          className="block size-9 rounded-full bg-cover bg-center bg-no-repeat ring-1 ring-zinc-200/80 dark:ring-zinc-800/80"
          style={{ backgroundImage: `url(${user.image})` }}
        />
      ) : (
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {label.slice(0, 1).toUpperCase()}
        </span>
      )}
      <AuthProviderBadge provider={user.provider ?? null} />
    </span>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-7 items-center justify-center gap-1.5 px-1 text-sm font-medium text-primary transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Send className="size-3.5" aria-hidden="true" />
      {pending ? "提交中..." : label}
    </button>
  );
}
