"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CloseIcon, SlidersIcon } from "./icons";
import type { Category, Condition } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";

const CONDITIONS: Condition[] = ["new", "uk-used", "refurbished"];

/**
 * Filters are URL state, not component state — a filtered listing stays
 * shareable and survives a refresh.
 */
export function ShopFilters({
  locale,
  dict,
  categories,
  bounds,
  lockedCategory,
}: {
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
  bounds: { min: number; max: number };
  /** Set on category pages, where the category is fixed by the route. */
  lockedCategory?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const current = {
    category: searchParams.get("category") ?? "",
    condition: searchParams.get("condition") ?? "",
    min: searchParams.get("min") ?? "",
    max: searchParams.get("max") ?? "",
  };

  const activeCount = Object.entries(current).filter(
    ([key, value]) => value !== "" && !(key === "category" && lockedCategory),
  ).length;

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function clearAll() {
    const next = new URLSearchParams();
    const q = searchParams.get("q");
    const sort = searchParams.get("sort");
    if (q) next.set("q", q);
    if (sort) next.set("sort", sort);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const conditionLabel = (condition: Condition) =>
    condition === "new"
      ? dict.product.conditionNew
      : condition === "uk-used"
        ? dict.product.conditionUkUsed
        : dict.product.conditionRefurbished;

  const panel = (
    <div className="space-y-7">
      {!lockedCategory && (
        <fieldset>
          <legend className="mb-2.5 text-sm font-bold text-ink-900">{dict.shop.category}</legend>
          <div className="space-y-1">
            <FilterRadio
              name="category"
              checked={current.category === ""}
              onChange={() => update("category", "")}
              label={dict.shop.allCategories}
            />
            {categories.map((category) => (
              <FilterRadio
                key={category.slug}
                name="category"
                checked={current.category === category.slug}
                onChange={() => update("category", category.slug)}
                label={category.name[locale]}
              />
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2.5 text-sm font-bold text-ink-900">
          {dict.shop.conditionLabel}
        </legend>
        <div className="space-y-1">
          <FilterRadio
            name="condition"
            checked={current.condition === ""}
            onChange={() => update("condition", "")}
            label={dict.common.all}
          />
          {CONDITIONS.map((condition) => (
            <FilterRadio
              key={condition}
              name="condition"
              checked={current.condition === condition}
              onChange={() => update("condition", condition)}
              label={conditionLabel(condition)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2.5 text-sm font-bold text-ink-900">{dict.shop.priceRange}</legend>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label htmlFor="filter-min" className="sr-only">
              {dict.shop.min}
            </label>
            <input
              id="filter-min"
              type="number"
              inputMode="numeric"
              placeholder={`${dict.shop.min} ${bounds.min}`}
              defaultValue={current.min}
              onBlur={(e) => update("min", e.target.value)}
              className="field !py-2 !text-sm"
            />
          </div>
          <span className="text-ink-300">–</span>
          <div className="flex-1">
            <label htmlFor="filter-max" className="sr-only">
              {dict.shop.max}
            </label>
            <input
              id="filter-max"
              type="number"
              inputMode="numeric"
              placeholder={`${dict.shop.max} ${bounds.max}`}
              defaultValue={current.max}
              onBlur={(e) => update("max", e.target.value)}
              className="field !py-2 !text-sm"
            />
          </div>
        </div>
      </fieldset>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-sm font-bold text-flash-500 transition hover:text-flash-600"
        >
          {dict.shop.clearFilters}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-800 transition hover:bg-ink-50 lg:hidden"
      >
        <SlidersIcon className="h-4 w-4" />
        {dict.shop.filters}
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] text-white">
            {activeCount}
          </span>
        )}
      </button>

      <aside className="hidden lg:block">{panel}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={dict.nav.close}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-900/50"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lift">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-ink-900">{dict.shop.filters}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={dict.nav.close}
                className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-100"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            {panel}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-7 w-full rounded-xl bg-brand-600 py-3 font-bold text-white transition hover:bg-brand-700"
            >
              {dict.shop.apply}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function FilterRadio({
  name,
  checked,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink-600 transition hover:bg-ink-50">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-brand-600"
      />
      <span className={checked ? "font-semibold text-ink-900" : ""}>{label}</span>
    </label>
  );
}

export function SortSelect({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const options = [
    { value: "featured", label: dict.shop.sortFeatured },
    { value: "newest", label: dict.shop.sortNewest },
    { value: "price-asc", label: dict.shop.sortPriceAsc },
    { value: "price-desc", label: dict.shop.sortPriceDesc },
  ];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="hidden text-sm text-ink-500 sm:block">
        {dict.shop.sortBy}
      </label>
      <select
        id="sort"
        value={searchParams.get("sort") ?? "featured"}
        onChange={(e) => {
          const next = new URLSearchParams(searchParams.toString());
          if (e.target.value === "featured") next.delete("sort");
          else next.set("sort", e.target.value);
          const qs = next.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }}
        className="field !w-auto !py-2 !text-sm font-semibold"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
