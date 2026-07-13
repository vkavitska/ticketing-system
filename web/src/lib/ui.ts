/**
 * Shared Tailwind class strings for repeated UI elements, so forms stay DRY
 * without a component library. Compose with template strings where needed.
 */
export const ui = {
  card: "mx-auto my-12 max-w-sm rounded-xl border border-slate-200 bg-white p-7 shadow-sm",
  label: "mt-4 mb-1.5 block text-xs font-semibold",
  input:
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none",
  select:
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none",
  muted: "text-slate-500",
  footer: "mt-5 text-center text-sm",
  link: "font-medium text-slate-900 underline underline-offset-2",

  btn: "inline-block cursor-pointer rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-default disabled:opacity-60",
  btnPrimary:
    "inline-block cursor-pointer rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-default disabled:opacity-60",
  btnDanger:
    "inline-block cursor-pointer rounded-md border border-red-600 bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-default disabled:opacity-60",
  btnBlock: "mt-4 block w-full",
  btnSm: "px-3 py-1.5 text-xs",

  // Compact square control for row actions (rename / delete). Always pair with
  // an aria-label since the visible content is an icon glyph.
  iconBtn:
    "inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-default disabled:opacity-50",

  // Small count/label pill (e.g. epics-per-team).
  badge:
    "inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600",

  // Surfaces for the master–detail layout.
  panel: "rounded-xl border border-slate-200 bg-white shadow-sm",
  listRow:
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
  listRowActive: "bg-slate-100 hover:bg-slate-100 font-semibold",

  statusError: "mt-3 text-sm font-semibold text-red-600",
  statusOk: "mt-3 text-sm font-semibold text-green-700",
} as const;
