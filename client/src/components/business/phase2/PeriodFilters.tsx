"use client";
import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ReportFilters } from "@/types/phase2.types";
import { todayIST } from "../attendance/AttendanceUI";
export function PeriodFilters({ values, onChange, onApply, children }: { values: ReportFilters; onChange: (value: ReportFilters) => void; onApply: () => void; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const form = <form className="zb-p2-filters" onSubmit={e => { e.preventDefault(); onApply(); setOpen(false); }}><label><span>From date · IST</span><input required type="date" min="2000-01-01" max={values.to} value={values.from} onChange={e => onChange({ ...values, from: e.target.value })} /></label><label><span>To date · IST</span><input required type="date" min={values.from} max={todayIST()} value={values.to} onChange={e => onChange({ ...values, to: e.target.value })} /></label><label><span>Location</span><input value={values.location} maxLength={100} placeholder="All locations" onChange={e => onChange({ ...values, location: e.target.value })} /></label>{children}<button type="submit" className="zb-biz-button">Apply filters</button></form>;
  return <><div className="zb-p2-desktop-filters">{form}</div><div className="zb-p2-mobile-filters"><Sheet open={open} onOpenChange={setOpen}><SheetTrigger className="zb-biz-button zb-biz-button--secondary"><SlidersHorizontal aria-hidden="true" />Dates & filters</SheetTrigger><SheetContent className="zb-biz zb-att zb-p2 zb-p2-drawer zb-p2-filter-drawer"><SheetHeader><SheetTitle>Choose your view</SheetTitle><SheetDescription>Select up to 366 dates and an optional location.</SheetDescription></SheetHeader>{form}</SheetContent></Sheet></div></>;
}
