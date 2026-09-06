"use client";

import { useEffect, useRef, useState } from "react";
import type { DataRequestOptions, SubmissionReceipt } from "@/types/data.types";

type SubmissionState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "error"; message: string }
  | { status: "complete"; receipt: SubmissionReceipt };

export function useFormSubmission<T>(
  send: (values: T, options?: DataRequestOptions) => Promise<SubmissionReceipt>,
) {
  const [state, setState] = useState<SubmissionState>({ status: "idle" });
  const request = useRef<AbortController | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (state.status === "error" || state.status === "complete")
      feedbackRef.current?.focus();
  }, [state]);

  async function submit(values: T) {
    // A synchronous lock catches a second click before React rerenders.
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setState({ status: "pending" });
    try {
      const receipt = await send(values, { signal: controller.signal });
      if (!controller.signal.aborted && request.current === controller)
        setState({ status: "complete", receipt });
    } catch (error) {
      if (!controller.signal.aborted && request.current === controller) {
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "We couldn't complete this request. Please try again.",
        });
      }
    } finally {
      if (request.current === controller) request.current = null;
    }
  }

  function clear() {
    request.current?.abort();
    request.current = null;
    setState({ status: "idle" });
  }
  return {
    state,
    submit,
    clear,
    feedbackRef,
    busy: state.status === "pending",
  };
}
