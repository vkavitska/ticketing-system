/**
 * Shared Tailwind class strings for repeated UI elements, so forms stay DRY
 * without a component library. Compose with template strings where needed.
 */
export const ui = {
  card: "mx-auto my-12 max-w-sm rounded-xl border border-slate-200 bg-white p-7 shadow-sm",
  label: "mt-4 mb-1.5 block text-xs font-semibold",
  input:
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none",
  muted: "text-slate-500",
  footer: "mt-5 text-center text-sm",
  link: "font-medium text-slate-900 underline underline-offset-2",

  btn: "inline-block cursor-pointer rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:cursor-default disabled:opacity-60",
  btnPrimary:
    "inline-block cursor-pointer rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-default disabled:opacity-60",
  btnBlock: "mt-4 block w-full",
  btnSm: "px-3 py-1.5 text-xs",

  statusError: "mt-3 text-sm font-semibold text-red-600",
  statusOk: "mt-3 text-sm font-semibold text-green-700",
} as const;
