"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { ActionButton } from "@/components/common/ActionButton";
import { SelectField, TextField } from "@/components/forms/Fields";
import { jobCategories, jobLocations, jobTypes } from "@/data/workers";
import { jobsHref } from "@/lib/job-filters";
import type { JobFilters as FilterValues } from "@/types/job.types";

function options(
  values: readonly string[],
  selected: string | undefined,
  label: string,
) {
  const known = [...values];
  if (selected && !known.includes(selected)) known.push(selected);
  return [
    { value: "all", label },
    ...known.map((value) => ({ value, label: value })),
  ];
}

export function JobFilters({
  initialFilters,
}: {
  initialFilters: FilterValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState(initialFilters);
  function setFilter(key: "location" | "category" | "jobType", value: string) {
    setDraft((current) => ({
      ...current,
      [key]: value === "all" ? "" : value,
    }));
  }
  function apply(next: FilterValues) {
    startTransition(() =>
      router.push(jobsHref({ ...next, page: 1 }), { scroll: false }),
    );
  }

  return (
    <form
      className="zb-job-filters"
      role="search"
      aria-label="Search and filter jobs"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        apply(draft);
      }}
    >
      <fieldset disabled={pending}>
        <legend className="sr-only">Job search filters</legend>
        <div className="zb-job-search-row">
          <TextField
            label="Search jobs"
            type="search"
            maxLength={120}
            placeholder="Job title, skill or keyword"
            value={draft.query ?? ""}
            onChange={(event) =>
              setDraft((current) => ({ ...current, query: event.target.value }))
            }
          />
          <ActionButton
            type="submit"
            loading={pending}
            loadingLabel="Searching…"
          >
            <Search className="size-4" aria-hidden="true" />
            Search jobs
          </ActionButton>
        </div>
        <div className="zb-job-filter-row">
          <SelectField
            label="Location"
            value={draft.location || "all"}
            options={options(
              jobLocations,
              initialFilters.location,
              "All locations",
            )}
            onValueChange={(value) => setFilter("location", value)}
            disabled={pending}
          />
          <SelectField
            label="Category"
            value={draft.category || "all"}
            options={options(
              jobCategories,
              initialFilters.category,
              "All categories",
            )}
            onValueChange={(value) => setFilter("category", value)}
            disabled={pending}
          />
          <SelectField
            label="Job type"
            value={draft.jobType || "all"}
            options={options(jobTypes, initialFilters.jobType, "All job types")}
            onValueChange={(value) => setFilter("jobType", value)}
            disabled={pending}
          />
          <ActionButton
            variant="outline"
            onClick={() => {
              setDraft({ query: "", location: "", category: "", jobType: "" });
              apply({});
            }}
          >
            Clear filters
          </ActionButton>
        </div>
      </fieldset>
    </form>
  );
}
