"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight } from "lucide-react";
import { ActionButton } from "@/components/common/ActionButton";
import { ActionLink } from "@/components/common/ActionLink";
import { CTASection } from "@/components/common/CTASection";
import { EmptyState } from "@/components/common/EmptyState";
import { FeedbackMessage } from "@/components/common/FeedbackMessage";
import { LoadingState } from "@/components/common/LoadingState";
import { PageShell } from "@/components/common/PageShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/Fields";
import { IndustryCard } from "@/components/industries/IndustryCard";
import { JobCard } from "@/components/jobs/JobCard";
import { SolutionCard } from "@/components/solutions/SolutionCard";
import { industries } from "@/data/industries";
import { solutions } from "@/data/solutions";
import { createMockAdapter } from "@/mocks/adapter";
import { mockJobs } from "@/mocks/jobs";
import { enquirySchema } from "@/schemas/enquiry.schema";
import type { MockScenario, SubmissionReceipt } from "@/types/data.types";
import type { EnquiryInput } from "@/types/enquiry.types";
import type { JobList } from "@/types/job.types";

// The preview always uses an isolated mock, including when the app is in API mode.
const previewAdapter = createMockAdapter({ latencyMs: 700 });
const colours = [
  ["Page", "#FAF9F9"],
  ["Surface", "#FFFFFF"],
  ["Text", "#272126"],
  ["Burgundy panel", "#461820"],
  ["Red action", "#C8202F"],
  ["Soft accent", "#FFE2E5"],
  ["Muted text", "#685E64"],
  ["Border", "#E7DFE2"],
] as const;

type JobPreviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: JobList };

function JobStatePreview() {
  const request = useRef<AbortController | null>(null);
  const [query, setQuery] = useState("");
  const [scenario, setScenario] = useState<MockScenario>("success");
  const [state, setState] = useState<JobPreviewState>({
    status: "ready",
    data: {
      items: mockJobs.slice(0, 3),
      total: mockJobs.length,
      page: 1,
      pageSize: 3,
      totalPages: 2,
    },
  });

  useEffect(() => () => request.current?.abort(), []);

  async function load(nextScenario: MockScenario) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setScenario(nextScenario);
    setState({ status: "loading" });
    try {
      const data = await previewAdapter.listJobs(
        { query, pageSize: 3 },
        { signal: controller.signal, scenario: nextScenario },
      );
      if (!controller.signal.aborted) setState({ status: "ready", data });
    } catch (error) {
      if (!controller.signal.aborted)
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load demo roles.",
        });
    }
  }

  return (
    <section className="zb-section" aria-labelledby="preview-jobs-heading">
      <SectionHeading
        id="preview-jobs-heading"
        eyebrow="04 / Data states"
        title="Useful cards in every state"
        description="Search these fictional roles, or simulate an empty result or failed request. The first three matching cards are shown here; complete job pages are available under Jobs."
      />
      <form
        className="zb-preview-search"
        role="search"
        aria-label="Search demo roles"
        onSubmit={(event) => {
          event.preventDefault();
          void load("success");
        }}
      >
        <TextField
          label="Search demo roles"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try Lucknow, retail or sales"
        />
        <ActionButton type="submit">Search roles</ActionButton>
      </form>
      <div
        className="zb-preview-controls"
        role="group"
        aria-label="Mock job response"
      >
        {(
          [
            ["success", "Show results"],
            ["empty", "Empty results"],
            ["error", "Simulate error"],
          ] as const
        ).map(([value, label]) => (
          <ActionButton
            key={value}
            variant={scenario === value ? "default" : "outline"}
            aria-pressed={scenario === value}
            onClick={() => void load(value)}
          >
            {label}
          </ActionButton>
        ))}
      </div>
      {state.status === "loading" && (
        <div className="zb-preview-panel">
          <LoadingState label="Loading demo roles…" />
        </div>
      )}
      {state.status === "error" && (
        <div className="zb-preview-status">
          <FeedbackMessage tone="error" title="We couldn’t load the roles">
            {state.message}
          </FeedbackMessage>
          <ActionButton
            className="mt-4"
            variant="outline"
            onClick={() => void load("success")}
          >
            Try again
          </ActionButton>
        </div>
      )}
      {state.status === "ready" &&
        (state.data.items.length ? (
          <>
            <p className="zb-field-note zb-preview-status" role="status">
              Showing {state.data.items.length} of {state.data.total} demo
              roles. These are not live vacancies.
            </p>
            <div className="zb-card-grid" data-columns="3">
              {state.data.items.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </>
        ) : (
          <div role="status">
            <EmptyState
              title="No matching roles"
              description="Try another role or location, or switch back to Show results."
            />
          </div>
        ))}
    </section>
  );
}

function EnquiryFormPreview() {
  const request = useRef<AbortController | null>(null);
  const [scenario, setScenario] = useState<"success" | "error">("success");
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: "",
      companyName: "",
      email: "",
      phone: "",
      serviceRequired: "",
      message: "",
    },
    mode: "onBlur",
  });

  useEffect(() => () => request.current?.abort(), []);

  async function submit(values: EnquiryInput) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setReceipt(null);
    setSubmissionError(null);
    try {
      const result = await previewAdapter.submitEnquiry(values, {
        signal: controller.signal,
        scenario,
      });
      if (!controller.signal.aborted) setReceipt(result);
    } catch (error) {
      if (!controller.signal.aborted)
        setSubmissionError(
          error instanceof Error
            ? error.message
            : "The demo could not be completed.",
        );
    }
  }

  return (
    <section className="zb-section" aria-labelledby="preview-form-heading">
      <SectionHeading
        id="preview-form-heading"
        eyebrow="05 / Forms"
        title="Clear fields. Helpful feedback."
        description="Required fields are marked with an asterisk. This form checks validation and demo confirmations; it never sends or saves the information."
      />
      <div className="zb-preview-panel">
        <form
          noValidate
          onSubmit={(event) => {
            void handleSubmit(submit)(event);
          }}
        >
          <fieldset disabled={isSubmitting} className="zb-preview-fieldset">
            <legend className="sr-only">Demo business enquiry</legend>
            <div className="zb-form-grid">
              <TextField
                label="Your name"
                required
                autoComplete="name"
                maxLength={120}
                error={errors.name?.message}
                {...register("name")}
              />
              <TextField
                label="Company name"
                autoComplete="organization"
                maxLength={160}
                error={errors.companyName?.message}
                {...register("companyName")}
              />
              <TextField
                label="Work email"
                required
                type="email"
                autoComplete="email"
                maxLength={254}
                error={errors.email?.message}
                {...register("email")}
              />
              <TextField
                label="Phone number"
                required
                type="tel"
                autoComplete="tel"
                maxLength={24}
                hint="Include your country code, for example +91."
                error={errors.phone?.message}
                {...register("phone")}
              />
              <Controller
                name="serviceRequired"
                control={control}
                render={({ field }) => (
                  <SelectField
                    label="Service required"
                    required
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    disabled={isSubmitting}
                    options={solutions.map((solution) => ({
                      value: solution.slug,
                      label: solution.label,
                    }))}
                    error={errors.serviceRequired?.message}
                  />
                )}
              />
              <SelectField
                label="Demo response"
                value={scenario}
                onValueChange={(value) =>
                  setScenario(value === "error" ? "error" : "success")
                }
                options={[
                  { value: "success", label: "Simulated success" },
                  { value: "error", label: "Simulated error" },
                ]}
                disabled={isSubmitting}
                hint="A development control for checking the feedback."
              />
              <div className="zb-form-full">
                <TextAreaField
                  label="Tell us what you need"
                  required
                  maxLength={4000}
                  hint="Use fictional details while reviewing this preview."
                  error={errors.message?.message}
                  {...register("message")}
                />
              </div>
            </div>
            <div className="zb-preview-form-actions">
              <ActionButton
                type="submit"
                loading={isSubmitting}
                loadingLabel="Checking demo…"
              >
                Preview enquiry
              </ActionButton>
              <ActionButton
                variant="outline"
                onClick={() => {
                  reset();
                  setReceipt(null);
                  setSubmissionError(null);
                }}
              >
                Clear form
              </ActionButton>
            </div>
          </fieldset>
        </form>
        {submissionError && (
          <div className="zb-preview-status">
            <FeedbackMessage tone="error" title="Demo request failed">
              {submissionError} Your entries are still available. Choose
              Simulated success to try again.
            </FeedbackMessage>
          </div>
        )}
        {receipt && (
          <div className="zb-preview-status">
            <FeedbackMessage tone="success" title="Demo validation complete">
              {receipt.message}
            </FeedbackMessage>
          </div>
        )}
      </div>
    </section>
  );
}

export function DesignSystemPreview() {
  return (
    <PageShell
      eyebrow="Frontend design system"
      title="Built for business. Ready for the field."
      description="A working review of the ZOBHUNGER colour system, typography, navigation, cards and form behaviour. The red-and-white palette applies across the public website."
      actions={
        <ActionLink href="/" variant="secondary">
          View the homepage{" "}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </ActionLink>
      }
    >
      <FeedbackMessage title="Development preview">
        This page is available only in development. All roles and submissions
        below are demonstrations.
      </FeedbackMessage>
      <section className="zb-section" aria-labelledby="preview-brand-heading">
        <SectionHeading
          id="preview-brand-heading"
          eyebrow="01 / Brand system"
          title="White surfaces. A clear red accent."
          description="Manrope typography, restrained borders, 12px card corners and practical spacing. Colour supports the hierarchy while the content does the explaining."
        />
        <dl className="zb-colours">
          {colours.map(([label, colour]) => (
            <div key={label}>
              <dt>
                <span
                  className="zb-colour-swatch"
                  style={{ backgroundColor: colour }}
                  aria-hidden="true"
                />
                {label}
              </dt>
              <dd>{colour}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="zb-section" aria-labelledby="preview-actions-heading">
        <SectionHeading
          id="preview-actions-heading"
          eyebrow="02 / Actions"
          title="One clear next step"
          description="Red for the primary action, an outline for supporting actions, and simple links for navigation."
        />
        <div className="zb-preview-panel">
          <div className="zb-preview-controls">
            <ActionLink href="/hire-workforce">
              Hire workforce{" "}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </ActionLink>
            <ActionLink href="/solutions" variant="secondary">
              Explore solutions
            </ActionLink>
            <ActionLink href="/for-workers" variant="text">
              Looking for work?
            </ActionLink>
          </div>
          <div className="zb-preview-controls">
            <ActionButton disabled>Disabled action</ActionButton>
            <ActionButton loading loadingLabel="Loading state">
              Submit
            </ActionButton>
          </div>
          <p className="zb-field-note">
            Use Tab to check focus states. Resize the window to review the
            navigation drawer and card grids.
          </p>
        </div>
      </section>
      <section className="zb-section" aria-labelledby="preview-cards-heading">
        <SectionHeading
          id="preview-cards-heading"
          eyebrow="03 / Cards"
          title="Find the support your business needs"
          description="Each solution card explains the work, names the services and provides one destination."
          action={
            <ActionLink href="/solutions" variant="text">
              All solutions
            </ActionLink>
          }
        />
        <div className="zb-card-grid" data-columns="3">
          {solutions.slice(0, 3).map((solution) => (
            <SolutionCard key={solution.slug} solution={solution} />
          ))}
        </div>
        <div className="zb-preview-industry">
          <SectionHeading
            title="Built around your industry"
            description="The same card system adapts to industry pages without adding unnecessary controls."
          />
          <div className="zb-card-grid" data-columns="3">
            {industries.slice(0, 3).map((industry) => (
              <IndustryCard key={industry.slug} industry={industry} />
            ))}
          </div>
        </div>
      </section>
      <JobStatePreview />
      <EnquiryFormPreview />
      <CTASection />
    </PageShell>
  );
}
