import type { Metadata } from "next";
import {
  Copy,
} from "lucide-react";

export const metadata: Metadata = {
  title: "设计系统",
  description: "Chihiro 前台主题当前实际使用的色彩、字体、节奏与组件语言。",
};

const editorialSerif =
  '"Iowan Old Style", "Palatino Linotype", "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif';

const principles = [
  "内容优先，氛围退后。页面首先要可读、可扫、可停留，视觉气质只负责托住内容。",
  "主色克制使用。只有一个主强调色，用来处理链接、选中、focus 和少量关键反馈。",
  "层级主要靠中性色和留白建立，而不是靠很多颜色块或很重的装饰。",
  "前台可以有空气感，但正文承载面必须稳定、安静、可久读。",
  "明暗只是同一站点的两种光线，不是两套完全不同的性格。",
  "排版比装饰更重要。字级、行高、段落节奏和导航层级先于风格表达。",
  "导航要轻，但层级要准。面板提示、卡片提示和主标题必须一眼分清。",
  "所有页面都应该像同一个系统长出来，而不是像不同风格拼在一起。",
];

const primarySwatches = [
  { name: "浅色主色", usage: "light 主题强调色", hex: "#5E81AC", tone: "#5E81AC", accent: true },
  { name: "深色主色", usage: "dark 主题强调色", hex: "#38BDF8", tone: "#38BDF8", accent: true },
];

const neutralSwatches = [
  { name: "zinc-100", usage: "轻表面 / 图标底", hex: "#F4F4F5", tone: "#F4F4F5" },
  { name: "zinc-200", usage: "描边 / 分隔", hex: "#E4E4E7", tone: "#E4E4E7" },
  { name: "zinc-400", usage: "弱元信息", hex: "#A1A1AA", tone: "#A1A1AA" },
  { name: "zinc-500", usage: "次要文本", hex: "#71717A", tone: "#71717A" },
  { name: "zinc-600", usage: "导语 / 说明", hex: "#52525B", tone: "#52525B" },
  { name: "zinc-900", usage: "正文", hex: "#18181B", tone: "#18181B" },
];

const backgroundSwatches = [
  { name: "light canvas", usage: "浅色页面底", hex: "#FAFAFA", tone: "#FAFAFA" },
  { name: "light tint", usage: "浅色背景轻雾", hex: "#F8FAFC", tone: "#F8FAFC" },
  { name: "dark canvas", usage: "深色页面底", hex: "#09090B", tone: "#09090B" },
  { name: "dark tint", usage: "深色背景过渡", hex: "#0C0E14", tone: "#0C0E14" },
  { name: "safari root", usage: "深色根背景", hex: "#09090B", tone: "#09090B" },
];

const semanticSwatches = [
  { name: "rose pulse", usage: "like / presence 等活跃反馈", hex: "#FB7185", tone: "#FB7185", accent: true },
  { name: "emerald", usage: "在线 / 成功状态", hex: "#34D399", tone: "#34D399", accent: true },
  { name: "amber", usage: "提醒 / 弱警告", hex: "#F59E0B", tone: "#F59E0B", accent: true },
];

const scaleRows = [
  { token: "text-4xl", label: "Hero 标题", meta: "2.25rem · 500 · 1.1", previewClassName: "site-title-hero" },
  { token: "text-3xl", label: "H1 / 文章标题", meta: "1.875rem · 500 · 1.15", previewClassName: "site-title-page" },
  { token: "text-2xl", label: "H2 / 节标题", meta: "1.5rem · 500 · 1.2", previewClassName: "site-title-h2" },
  { token: "text-xl", label: "H3 / 弹框标题", meta: "1.25rem · 500 · 1.3", previewClassName: "site-title-h3" },
  { token: "text-lg", label: "导读段", meta: "1.125rem · 400 · 1.55", previewClassName: "site-lead" },
  { token: "text-base", label: "UI / 正文默认", meta: "1rem · 400 · 1.55", previewClassName: "site-body" },
  { token: "text-sm", label: "次要文本 / 元数据", meta: "0.875rem · 400 · 1.5", previewClassName: "site-meta" },
  { token: "text-xs", label: "小帽子文字 / 标签", meta: "0.75rem · 600 · 1.4", previewClassName: "site-eyebrow" },
];

const radii = [
  { px: "9999px", token: "rounded-full", use: "胶囊按钮 / 小切换" },
  { px: "6px", token: "rounded-md", use: "代码块 / tooltip / 局部内容块" },
  { px: "16px", token: "rounded-2xl", use: "卡片 / 输入框 / 常规表面" },
  { px: "1.75rem", token: "rounded-[1.75rem]", use: "Search / Dialog / Tag Panel / MegaNav" },
];

const atoms = [
  {
    title: "按钮",
    meta: "accent fill / quiet secondary / ghost",
    preview: (
      <div className="flex flex-wrap items-center gap-3">
        <button className="rounded-full border border-[#adc6e3] bg-[#eef5fb] px-5 py-2.5 text-sm font-medium text-[#4f729c]">
          主按钮
        </button>
        <button className="rounded-full border border-[#d8d0c6] bg-white/80 px-5 py-2.5 text-sm font-medium text-[#3d3832]">
          次按钮
        </button>
        <button className="rounded-full px-3 py-2 text-sm font-medium text-[#6f665e]">
          幽灵
        </button>
      </div>
    ),
  },
  {
    title: "标签",
    meta: "neutral-2 / text-xs / rounded",
    preview: (
      <div className="flex flex-wrap gap-2">
        {["design", "tokens", "reading"].map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-[#ddd4c8] bg-[#f4f0ea] px-3 py-1 text-xs text-[#73695f]"
          >
            {tag}
          </span>
        ))}
      </div>
    ),
  },
  {
    title: "引文",
    meta: "accent border / neutral-7",
    preview: (
      <blockquote className="border-l-[3px] border-[#5e81ac] pl-4 text-lg leading-8 text-[#5c544c]">
        一千次「不」，方有一次「是」。
      </blockquote>
    ),
  },
  {
    title: "指标",
    meta: "serif numerals / calm labels",
    preview: (
      <div className="flex gap-8">
        {[
          ["128", "文章"],
          ["1", "主色"],
          ["10", "戒律"],
        ].map(([value, label]) => (
          <div key={label}>
            <p style={{ fontFamily: editorialSerif }} className="text-4xl text-[#1c1815]">
              {value}
            </p>
            <p className="mt-1 text-sm text-[#81766a]">{label}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "虚列列表",
    meta: "editorial bullets / roomy leading",
    preview: (
      <ul className="grid gap-3 text-lg leading-8 text-[#4e4640]">
        <li>一 色不溢于五分</li>
        <li>一 硬阴影禁用</li>
        <li>一 中文不施合成 bold</li>
      </ul>
    ),
  },
  {
    title: "Inline 代码",
    meta: "neutral-2 / mono",
    preview: (
      <p className="text-lg leading-8 text-[#4e4640]">
        执{" "}
        <code className="rounded-md bg-[#f1eee8] px-2 py-1 font-mono text-base text-[#38322d]">
          text-neutral-9
        </code>{" "}
        为正文默认色。
      </p>
    ),
  },
];

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen w-full px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl px-0 py-0 text-[#2d2924] dark:text-[#f5efe6]">
        <div className="flex flex-col gap-10 lg:gap-14">
          <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
            <div className="grid gap-8">
              <p className="inline-flex items-center gap-4 text-sm tracking-[0.18em] text-[#7c746d] dark:text-[#b9aea0]">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#5e81ac]" />
                设计系统 · v0.1 · 2026.06
              </p>

              <div className="grid gap-6">
                <h1
                  style={{ fontFamily: editorialSerif }}
                  className="max-w-5xl text-4xl font-medium leading-[1.1] tracking-[-0.04em] text-[#181512] dark:text-[#fbf5ec]"
                >
                  Chihiro Design
                </h1>
                <p
                  style={{ fontFamily: editorialSerif }}
                  className="max-w-4xl text-lg font-normal leading-[1.55] text-[#5a534c] dark:text-[#cbc1b4]"
                >
                  一种冷静的蓝，一组安静的中性色，剩下交给留白、呼吸感和时间感。Chihiro 是一套为个人前台而设计的系统，围绕内容、记录、浏览与阅读展开。                </p>
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-3 pt-6 font-mono text-sm text-[#756b62] dark:text-[#a99d90]">
                <span>主色调 · 浅色 #5E81AC · 深色 #38BDF8</span>
                <span>字体 Instrument Sans / JetBrains Mono</span>
              </div>
            </div>

          </header>

          {/* <section className="border-t border-[rgba(191,181,168,0.48)] pt-10 dark:border-white/10">
            <SectionHeading
              index="00"
              eyebrow="出样"
              title="输出样本"
              description="这页不是抽象规范墙，而是把当前前台真正存在的语气拆开来看：首页 hero、列表、阅读页、表单和代码块都应该属于同一种光线。"
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {demoCards.map((card) => (
                <article
                  key={card.title}
                  className="group grid gap-5 rounded-[1.6rem] border border-[rgba(204,194,182,0.72)] bg-white/62 p-5 shadow-[0_12px_30px_rgba(42,35,28,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(42,35,28,0.08)] dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="relative overflow-hidden rounded-[1.25rem] border border-[rgba(207,197,184,0.72)] bg-[#fbf9f5] p-4 dark:border-white/10 dark:bg-[#1a1714]">
                    <div className="h-[24rem] rounded-[1rem] border border-[rgba(207,197,184,0.6)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,239,232,0.9))] px-5 py-4 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(34,29,25,0.92),rgba(23,19,17,0.95))]">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#9e9489] dark:text-[#a89b8d]">
                        <span>Chihiro</span>
                        <span>{card.title}</span>
                      </div>
                      <div className="mt-8 grid gap-4">
                        <div className="h-3 w-20 rounded-full bg-[#d8e5f2] dark:bg-[#23445d]" />
                        <div
                          style={{ fontFamily: editorialSerif }}
                          className="max-w-[18rem] text-2xl leading-[1.2] text-[#1a1613] dark:text-[#f6efe6]"
                        >
                          {card.title === "首页 Hero"
                            ? "Hi, I’m Chihiro."
                            : card.title === "最近写作"
                              ? "最近写作"
                              : "一篇适合停留的长文"}
                        </div>
                        <div className="grid gap-2">
                          <div className="h-2 rounded-full bg-[#e8e0d6] dark:bg-[#38322d]" />
                          <div className="h-2 w-[88%] rounded-full bg-[#eee6dc] dark:bg-[#403933]" />
                          <div className="h-2 w-[78%] rounded-full bg-[#eee6dc] dark:bg-[#403933]" />
                        </div>
                        <div className="mt-4 grid gap-3">
                          {[1, 2, 3].map((line) => (
                            <div key={line} className="h-2 rounded-full bg-[#f3ece3] dark:bg-[#2e2824]" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="absolute right-6 top-6 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(200,190,178,0.72)] bg-white/80 text-[#6b6259] shadow-[0_8px_24px_rgba(42,35,28,0.08)] dark:border-white/10 dark:bg-[#231f1b] dark:text-[#d9cec0]">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <h3
                      style={{ fontFamily: editorialSerif }}
                      className="text-2xl leading-[1.2] text-[#171412] dark:text-[#faf4ea]"
                    >
                      {card.title}
                    </h3>
                    <p className="text-base leading-8 text-[#6b6259] dark:text-[#c0b4a7]">
                      {card.meta}
                    </p>
                  </div>

                  <Link
                    href="/posts"
                    className="inline-flex items-center gap-2 text-base text-[#5e81ac] transition hover:opacity-80"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    查看对应页面语境
                  </Link>
                </article>
              ))}
            </div>
          </section> */}

          <DesignPrinciplesSection />
          <ColorSection />
          <TypographySection />
          <RhythmSection />

          <section className="border-t border-[rgba(191,181,168,0.48)] pt-10 dark:border-white/10">
            <SectionHeading
              index="05"
              eyebrow="原子组件"
              title="原子组件"
              description="一组数量不多但足够定下气质的组件。按钮、标签、引文、指标、虚列列表和 inline code 都是这套语言的基础发音。"
            />

            <div className="mt-10 grid gap-x-8 gap-y-10 lg:grid-cols-3">
              {atoms.map((atom) => (
                <article key={atom.title} className="grid gap-5">
                  <div>
                    <h3 className="text-[1.8rem] font-medium tracking-tight text-[#191511] dark:text-[#faf2e6]">
                      {atom.title}
                    </h3>
                    <p className="mt-1 font-mono text-sm text-[#897d71] dark:text-[#ac9f92]">{atom.meta}</p>
                  </div>
                  <div className="rounded-md border border-[rgba(207,197,184,0.62)] bg-[#fffdfa] p-5 dark:border-white/10 dark:bg-[#1a1714]">
                    {atom.preview}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <PatternSection />
        </div>
      </div>
    </main>
  );
}

function DesignPrinciplesSection() {
  return (
    <section className="border-t border-[rgba(191,181,168,0.48)] pt-10 dark:border-white/10">
      <SectionHeading
        index="01"
        eyebrow="主张"
        title="设计原则"
        description="Chihiro不追求强装饰和强存在感，而追求内容、层级与浏览节奏之间的平衡。它应该安静、清楚、有呼吸感，让人愿意停下来读，而不是被界面不断打断。"
      />

      <div className="mt-10 grid gap-x-12 gap-y-6 lg:grid-cols-2">
        {principles.map((item, index) => (
          <div key={item} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-4">
            <p className="font-mono text-base text-[#5e81ac]">{String(index + 1).padStart(2, "0")}</p>
            <p className="text-base leading-[1.55] text-[#3e3832] dark:text-[#e7ddd1]">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ColorSection() {
  return (
    <section className="border-t border-[rgba(191,181,168,0.48)] pt-10 dark:border-white/10">
      <SectionHeading
        index="02"
        eyebrow="颜色"
        title="克制的色彩"
        description="一个主色、一组常用中性色、两层页面背景，再加少量辅助状态色。"
      />

      <div className="mt-12 grid gap-6">
        <div>
          <h3 style={{ fontFamily: editorialSerif }} className="text-xl font-medium leading-[1.3] text-[#231e1a] dark:text-[#f8f2e8]">
            主色
          </h3>
          <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {primarySwatches.map((swatch) => (
              <SwatchCard key={swatch.name} {...swatch} accent={swatch.accent} />
            ))}
          </div>
        </div>

        <div className="pt-6">
          <h3 style={{ fontFamily: editorialSerif }} className="text-xl font-medium leading-[1.3] text-[#231e1a] dark:text-[#f8f2e8]">
            常用中性色
          </h3>
          <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {neutralSwatches.map((swatch) => (
              <SwatchCard key={swatch.name} {...swatch} />
            ))}
          </div>
        </div>

        <div className="pt-6">
          <h3 style={{ fontFamily: editorialSerif }} className="text-xl font-medium leading-[1.3] text-[#231e1a] dark:text-[#f8f2e8]">
            背景层
          </h3>
          <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {backgroundSwatches.map((swatch) => (
              <SwatchCard key={swatch.name} {...swatch} />
            ))}
          </div>
        </div>

        <div className="pt-6">
          <h3 style={{ fontFamily: editorialSerif }} className="text-xl font-medium leading-[1.3] text-[#231e1a] dark:text-[#f8f2e8]">
            辅助状态色
          </h3>
          <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {semanticSwatches.map((swatch) => (
              <SwatchCard key={swatch.name} {...swatch} accent={swatch.accent} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TypographySection() {
  return (
    <section className="border-t border-[rgba(191,181,168,0.48)] pt-10 dark:border-white/10">
      <SectionHeading
        index="03"
        eyebrow="字体"
        title="主字体与辅助字体"
        description="当前前台正式在用的是 Sans 和 Mono。Sans 负责大部分界面与阅读，Mono 负责代码和精确信息；Serif 仍是预留方向，不是当前主系统。"
      />

      <div className="mt-10 grid gap-x-10 gap-y-8 lg:grid-cols-2">
        <FontRoleCard
          glyph="Aa"
          title="Sans · 当前主字体"
          stack="Instrument Sans → PingFang SC → Microsoft YaHei → Noto Sans SC"
          description="导航、按钮、列表、表单、正文说明和大部分界面文本都以 Sans 为主。它定义了当前前台最稳定的阅读和浏览语气。"
        />
        <FontRoleCard
          glyph="</>"
          title="Mono · 代码 / 元信息"
          stack="JetBrains Mono → SF Mono → Consolas"
          description="代码块、版本号、token 名、统计值、色值和需要等宽对齐的数字由 Mono 承担，它负责精确感而不是装饰感。"
          mono
        />
      </div>

      <div className="mt-5 max-w-3xl">
        <p className="font-mono text-sm text-[#5e81ac]">Serif · 预留方向</p>
        <p className="mt-3 text-sm leading-[1.5] text-[#5f574f] dark:text-[#cabfb2]">
          衬线字体目前只作为少量展示和编辑语气的预留方向存在，还没有进入前台全局字体栈。等站点真的需要更强的编辑感时，再决定是否把它提升为正式角色。
        </p>
      </div>

      <div className="mt-12">
        {scaleRows.map((row) => (
          <div
            key={row.token}
            className="grid gap-3 border-t border-[rgba(215,206,195,0.66)] py-5 first:border-t-0 md:grid-cols-[14rem_minmax(0,1fr)_15rem] md:items-center dark:border-white/10"
          >
            <p className="font-mono text-base text-[#5e81ac]">{row.token}</p>
            <p
              className={`${row.previewClassName} text-[#1d1915] dark:text-[#f8f2e8]`}
              style={{ fontFamily: row.token.startsWith("text-xl") || row.token.startsWith("text-2xl") || row.token.startsWith("text-3xl") || row.token.startsWith("text-4xl") ? editorialSerif : undefined }}
            >
              {row.label}
            </p>
            <p className="font-mono text-base text-[#81766a] md:text-right dark:text-[#b4a89a]">{row.meta}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RhythmSection() {
  return (
    <section className="border-t border-[rgba(191,181,168,0.48)] pt-10 dark:border-white/10">
      <SectionHeading
        index="04"
        eyebrow="间距"
        title="节奏与形态"
        description="前台真实更接近两种状态：正文内容直接落在页面上，只有导航、弹层和重点卡片会使用 translucent surface。不要为了形式额外加一层壳。"
      />

      <div className="mt-10 grid gap-12">
        <div>
          <h3 style={{ fontFamily: editorialSerif }} className="text-xl font-medium leading-[1.3] text-[#231e1a] dark:text-[#f8f2e8]">
            圆角
          </h3>
          <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {radii.map((radius) => (
              <article
                key={radius.token}
                className="grid gap-5 rounded-2xl border border-[rgba(204,194,182,0.72)] bg-white/62 p-5 text-center dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="grid place-items-center py-7">
                  <div
                    style={{ borderRadius: radius.px }}
                    className="h-28 w-28 border border-[rgba(222,213,201,0.72)] bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-[rgba(255,255,255,0.08)] dark:shadow-[0_18px_45px_rgba(2,6,23,0.06)]"
                  />
                </div>
                <div className="grid gap-1">
                  <p className="text-lg font-medium leading-[1.55] text-[#2a2520] dark:text-[#f4eee4]">{radius.px}</p>
                  <p className="font-mono text-base text-[#6c6259] dark:text-[#b6a99a]">{radius.token}</p>
                  <p className="text-sm text-[#8a7e72] dark:text-[#a99d90]">{radius.use}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontFamily: editorialSerif }} className="text-xl font-medium leading-[1.3] text-[#231e1a] dark:text-[#f8f2e8]">
            深度
          </h3>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <DepthCard
              title="no shell"
              body="正文、长段落和多数阅读内容直接落在页面上，用字级、行高和留白建立层级，不额外包一层卡片。"
              bare
            />
            <DepthCard
              title="translucent"
              body="border + bg-white/80 + shadow-sm + backdrop-blur-sm。作为主题主要的 shell，用于导航、弹层、搜索和重点卡片。"
              softShadow
            />
            <DepthCard
              title="anti · solid fill"
              body="避免使用大面积实色填充的卡片壳。导航、弹层和重点列表以轻透明表面为主，不用整块满色建立存在感。"
              solid
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PatternSection() {
  return (
    <section className="border-t border-[rgba(191,181,168,0.48)] pt-10 dark:border-white/10">
      <SectionHeading
        index="06"
        eyebrow="段落"
        title="段落样例"
        description="用真实前台语境把规则落到段落上。这里展示的是评论流、表单、代码块和模态的组织方式，而不是纯概念占位。"
      />

      <div className="mt-10 grid gap-6">
        <PatternFrame
          name="comment-thread"
          tokens="--field-{bg,border,gradient,shadow} · --color-accent · rounded-tl-sm"
        >
          <div className="grid gap-8">
            <CommentBubble
              author="Anya"
              time="2 小时前"
              letter="A"
              body="三档 neutral 的设定让阅读节奏有了松紧感，深色模式自动反转这一点尤其难得。"
            />
            <div className="pl-10 sm:pl-20">
              <CommentBubble
                author="Innei"
                time="1 小时前"
                letter="I"
                owner
                body="谢谢看完。本来就想避免 50—950 那种「色味稀薄」的感觉。"
              />
            </div>
          </div>
        </PatternFrame>

        <PatternFrame name="form" tokens="--field-* · --color-accent · rounded-md / rounded-2xl">
          <form className="grid max-w-4xl gap-7">
            <Field label="姓名" placeholder="怎么称呼你" />
            <Field label="邮箱（不公开）" placeholder="you@example.com" />
            <Field label="内容" placeholder="写下你的想法" textarea />
            <div className="flex justify-end">
                <button
                type="button"
                className="rounded-full border border-[#adc6e3] bg-[#eef5fb] px-6 py-3 text-base font-medium text-[#4f729c]"
              >
                发表
              </button>
            </div>
          </form>
        </PatternFrame>

        <PatternFrame
          name="code-block"
          tokens="--code-accent-{line,soft,tint,icon,foreground} · --color-paper"
        >
          <div className="overflow-hidden rounded-2xl border border-[rgba(207,197,184,0.72)] bg-[#fffdfa] dark:border-white/10 dark:bg-[#171412]">
            <div className="flex items-center justify-between border-b border-[rgba(215,206,195,0.72)] px-5 py-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#edf4fb] px-3 py-1 font-mono text-sm text-[#4f729c]">CSS</span>
                <span className="text-base text-[#39332d] dark:text-[#ece3d7]">tailwind.css</span>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[rgba(207,197,184,0.72)] text-[#7f7368] dark:border-white/10 dark:text-[#c7bbad]"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <pre className="overflow-x-auto px-6 py-5 font-mono text-[0.95rem] leading-8 text-[#312b25] dark:text-[#efe5d8]">
              <code>
                {`@import "tailwindcss";
@import "@/app/globals.css";

:root {
  --site-canvas-background: radial-gradient(circle at top center, rgb(var(--primary-rgb) / 0.14), transparent 32%);
}
`}
              </code>
            </pre>
          </div>
        </PatternFrame>

        <PatternFrame name="modal" tokens="--color-paper · quiet secondary · accent outline">
          <div className="rounded-[1.75rem] bg-[rgba(45,41,36,0.38)] p-8 sm:p-12">
            <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-[rgba(207,197,184,0.72)] bg-[#fffdfa] p-8 shadow-[0_24px_50px_rgba(28,24,20,0.12)] dark:border-white/10 dark:bg-[#171412]">
              <h3 className="text-xl font-medium leading-[1.3] text-[#181411] dark:text-[#f8f2e8]">确定要删除这条内容吗？</h3>
              <p className="mt-4 text-base leading-[1.55] text-[#61584f] dark:text-[#c9beb0]">
                删除之后无法恢复。已经有 3 个人回复过这条内容，删除后他们的评论也会一起消失。
              </p>
              <div className="mt-8 flex justify-end gap-3">
                <button className="rounded-full border border-[rgba(207,197,184,0.8)] bg-white/80 px-5 py-2.5 text-base text-[#524b44] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#dfd4c7]">
                  取消
                </button>
                <button className="rounded-full border border-[#adc6e3] bg-[#eef5fb] px-5 py-2.5 text-base font-medium text-[#4f729c]">
                  删除
                </button>
              </div>
            </div>
          </div>
        </PatternFrame>
      </div>
    </section>
  );
}

function SectionHeading({
  index,
  eyebrow,
  title,
  description,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-4xl">
      <p className="font-mono text-base tracking-[0.08em] text-[#5e81ac]">
        {index} · {eyebrow}
      </p>
      <h2
        style={{ fontFamily: editorialSerif }}
        className="mt-4 text-3xl font-medium leading-[1.15] tracking-[-0.03em] text-[#181512] dark:text-[#fbf5ec]"
      >
        {title}
      </h2>
      <p
        style={{ fontFamily: editorialSerif }}
        className="mt-5 text-lg font-normal leading-[1.55] text-[#5f574f] dark:text-[#cabfb2]"
      >
        {description}
      </p>
    </div>
  );
}

function SwatchCard({
  name,
  usage,
  hex,
  tone,
  accent = false,
}: {
  name: string;
  usage: string;
  hex: string;
  tone: string;
  accent?: boolean;
}) {
  return (
    <article className="grid gap-3">
      <div className="h-28 rounded-md" style={{ backgroundColor: tone }} />
      <div className="grid gap-2">
        <p
          style={{ fontFamily: accent ? editorialSerif : undefined }}
          className={`text-lg font-medium leading-[1.55] ${accent ? "text-[#4f729c]" : "text-[#241f1a] dark:text-[#f5efe6]"}`}
        >
          {name}
        </p>
        <p className="text-base leading-7 text-[#6d6258] dark:text-[#b5a99b]">{usage}</p>
        <p className="font-mono text-base text-[#807468] dark:text-[#c0b4a7]">{hex}</p>
      </div>
    </article>
  );
}

function FontRoleCard({
  glyph,
  title,
  stack,
  description,
  serif = false,
  mono = false,
}: {
  glyph: string;
  title: string;
  stack: string;
  description: string;
  serif?: boolean;
  mono?: boolean;
}) {
  return (
    <article className="grid gap-5">
      <p
        style={{ fontFamily: mono ? "var(--font-mono)" : serif ? editorialSerif : undefined }}
        className="text-3xl font-medium leading-[1.15] tracking-[-0.03em] text-[#181411] dark:text-[#faf2e8]"
      >
        {glyph}
      </p>
      <div className="grid gap-2">
        <h3 className="text-lg font-medium leading-[1.55] text-[#5e81ac]">{title}</h3>
        <p className="text-sm leading-[1.5] text-[#655c53] dark:text-[#bcae9f]">{stack}</p>
        <p className="text-base leading-[1.55] text-[#4d453f] dark:text-[#e4d9cb]">{description}</p>
      </div>
    </article>
  );
}

function DepthCard({
  title,
  body,
  softShadow = false,
  danger = false,
  bare = false,
  solid = false,
}: {
  title: string;
  body: string;
  softShadow?: boolean;
  danger?: boolean;
  bare?: boolean;
  solid?: boolean;
}) {
  return (
    <article
      className={[
        bare ? "p-1" : "rounded-2xl border p-6",
        danger
          ? "border-[#b14f5c]/20 bg-[#b14f5c] text-white shadow-[0_22px_40px_rgba(177,79,92,0.22)]"
          : solid
            ? "border-zinc-200/80 bg-white text-zinc-950 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-zinc-800/80 dark:bg-black dark:text-zinc-50 dark:shadow-[0_18px_40px_rgba(0,0,0,0.3)]"
          : bare
            ? "bg-transparent text-[#231e1a] dark:text-[#f7f1e8]"
            : "border-[rgba(204,194,182,0.72)] bg-white/64 text-[#231e1a] dark:border-white/10 dark:bg-white/[0.03] dark:text-[#f7f1e8]",
        softShadow ? "shadow-[0_12px_32px_rgba(42,35,28,0.08)]" : "",
      ].join(" ")}
    >
      <p
        className={`font-mono text-base ${
          danger
            ? "text-white/88"
            : solid
              ? "text-[#5e81ac] dark:text-[#7ea4d6]"
              : "text-[#5e81ac]"
        }`}
      >
        {title}
      </p>
      <p
        className={`mt-4 text-base leading-[1.55] ${
          danger ? "text-white" : solid ? "text-zinc-950 dark:text-zinc-50" : ""
        }`}
      >
        {body}
      </p>
    </article>
  );
}

function PatternFrame({
  name,
  tokens,
  children,
}: {
  name: string;
  tokens: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 border-b border-[rgba(215,206,195,0.72)] pb-4 font-mono text-base text-[#6f6459] sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-[#b6a999]">
        <span>{name}</span>
        <span>{tokens}</span>
      </div>
      <div className="py-2 sm:py-3">{children}</div>
    </section>
  );
}

function CommentBubble({
  author,
  time,
  letter,
  body,
  owner = false,
}: {
  author: string;
  time: string;
  letter: string;
  body: string;
  owner?: boolean;
}) {
  return (
    <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-4">
      <div className="grid justify-items-center gap-3 pt-2">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#e5dfd6] text-xl font-medium text-[#61574f] dark:bg-[#35302b] dark:text-[#d9cebf]">
          {letter}
        </span>
      </div>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xl font-medium leading-[1.3] text-[#26211c] dark:text-[#f7f1e8]">{author}</span>
          {owner ? (
            <span className="rounded-full bg-[#edf4fb] px-3 py-1 text-sm text-[#4f729c]">站主</span>
          ) : null}
          <span className="text-base text-[#8a7f72] dark:text-[#ab9f91]">{time}</span>
        </div>
        <div className="inline-block max-w-3xl rounded-[0.7rem_1.1rem_1.1rem_1.1rem] border border-[rgba(222,213,201,0.7)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,241,234,0.88))] px-5 py-4 text-base leading-[1.55] text-[#4b433c] shadow-[0_8px_18px_rgba(42,35,28,0.05)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(32,27,24,0.95),rgba(25,21,18,0.94))] dark:text-[#efe5d8]">
          {body}
        </div>
        <button type="button" className="justify-self-start text-base text-[#74695f] dark:text-[#b9aea0]">
          回复
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  textarea = false,
}: {
  label: string;
  placeholder: string;
  textarea?: boolean;
}) {
  return (
    <label className="grid gap-3">
      <span className="text-lg font-medium leading-[1.55] text-[#3a342e] dark:text-[#ece3d7]">{label}</span>
      {textarea ? (
        <textarea
          rows={6}
          placeholder={placeholder}
          className="min-h-52 rounded-[1.35rem] border border-[rgba(222,213,201,0.78)] bg-[#fffdfa] px-6 py-5 text-[1rem] leading-8 text-[#2f2a25] shadow-[inset_0_1px_4px_rgba(42,35,28,0.03)] outline-none placeholder:text-[#b4aaa0] dark:border-white/10 dark:bg-[#171412] dark:text-[#f2e7da] dark:placeholder:text-[#84796d]"
        />
      ) : (
        <input
          placeholder={placeholder}
          className="h-14 rounded-full border border-[rgba(222,213,201,0.78)] bg-[#fffdfa] px-6 text-[1rem] text-[#2f2a25] shadow-[inset_0_1px_4px_rgba(42,35,28,0.03)] outline-none placeholder:text-[#b4aaa0] dark:border-white/10 dark:bg-[#171412] dark:text-[#f2e7da] dark:placeholder:text-[#84796d]"
        />
      )}
    </label>
  );
}
