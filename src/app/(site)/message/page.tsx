export default function MessagePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16 sm:px-10">
      <p className="text-sm uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
        Message
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        留言
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
        这里后续可以放留言板、联系表单，或者一段更正式的联系说明。现在先作为留言入口页保留。
      </p>
    </main>
  );
}
