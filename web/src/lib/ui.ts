/**
 * Shared Tailwind class strings for repeated UI elements, so forms stay DRY
 * without a component library. Compose with template strings where needed.
 *
 * Accent is indigo; neutrals are slate. Interactive elements use a
 * focus-visible ring; text fields use a focus ring (always shown on focus).
 */
export const ui = {
  card: "mx-auto my-12 max-w-sm rounded-xl border border-slate-200 bg-white p-7 shadow-sm",
  label: "mt-4 mb-1.5 block text-xs font-semibold text-slate-700",
  input:
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25",
  select:
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25",
  muted: "text-slate-500",
  footer: "mt-5 text-center text-sm",
  link: "font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-700",

  btn: "inline-block cursor-pointer rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60",
  btnPrimary:
    "inline-block cursor-pointer rounded-md border border-indigo-600 bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700 hover:border-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60",
  btnDanger:
    "inline-block cursor-pointer rounded-md border border-red-600 bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-red-700 hover:border-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60",
  btnBlock: "mt-4 block w-full",
  btnSm: "px-3 py-1.5 text-xs",

  // Compact square control for row actions (rename / delete). Always pair with
  // an aria-label since the visible content is an icon glyph.
  iconBtn:
    "inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-50",

  // Small count pill (e.g. epics-per-team). tabular-nums keeps digits aligned.
  badge:
    "inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-slate-600",

  // Surfaces for the master–detail layout.
  panel: "rounded-xl border border-slate-200 bg-white shadow-sm",
  listRow:
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
  listRowActive: "bg-indigo-50 text-indigo-900 hover:bg-indigo-50 font-semibold",

  // Kanban board surfaces.
  boardColumn:
    "flex w-72 shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-100/70",
  boardColumnOver: "border-indigo-400 bg-indigo-50/60",
  boardCard:
    "block w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1",

  statusError: "mt-3 text-sm font-semibold text-red-600",
  statusOk: "mt-3 text-sm font-semibold text-green-700",
} as const;
