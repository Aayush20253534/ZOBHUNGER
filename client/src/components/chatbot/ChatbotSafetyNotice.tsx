"use client";

import type { RefObject } from "react";
import { ShieldAlert, ShieldCheck, X } from "lucide-react";

interface ChatbotSafetyNoticeProps {
  onDismiss: () => void;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
}

export function ChatbotSafetyNotice({
  onDismiss,
  closeButtonRef,
}: ChatbotSafetyNoticeProps) {
  return (
    <div className="zb-chatbot-safety-overlay">
      <section
        className="zb-chatbot-safety-notice"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="zb-chatbot-safety-title"
        aria-describedby="zb-chatbot-safety-description"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="zb-chatbot-safety-close"
          onClick={onDismiss}
          aria-label="Close important safety notice"
        >
          <X aria-hidden="true" />
        </button>

        <div className="zb-chatbot-safety-hero">
          <span className="zb-chatbot-safety-icon" aria-hidden="true">
            <ShieldAlert />
          </span>
          <div>
            <span className="zb-chatbot-safety-eyebrow">Important notice</span>
            <h2 id="zb-chatbot-safety-title">
              Stay alert to recruitment &amp; payment fraud
            </h2>
          </div>
        </div>

        <p id="zb-chatbot-safety-description" className="zb-chatbot-safety-intro">
          Fraudsters may impersonate recruiters or companies through calls,
          WhatsApp, Telegram, personal email addresses, or unofficial social
          accounts. Before acting on any job or payment request claiming to be
          from ZOBHUNGER, verify it through an official ZOBHUNGER channel.
        </p>

        <div className="zb-chatbot-safety-list" aria-label="Fraud prevention safeguards">
          <div className="zb-chatbot-safety-item">
            <span aria-hidden="true">01</span>
            <div>
              <strong>Do not rush into a payment</strong>
              <p>
                Treat requests for money in exchange for a job, interview,
                onboarding, or guaranteed employment as suspicious until you
                independently verify them.
              </p>
            </div>
          </div>

          <div className="zb-chatbot-safety-item">
            <span aria-hidden="true">02</span>
            <div>
              <strong>Never share financial security credentials</strong>
              <p>
                Do not disclose OTPs, UPI PINs, card PINs, passwords, or complete
                banking credentials to a recruiter, agent, or chatbot.
              </p>
            </div>
          </div>

          <div className="zb-chatbot-safety-item">
            <span aria-hidden="true">03</span>
            <div>
              <strong>Verify unofficial communication</strong>
              <p>
                If someone contacts you from an unknown number, personal email,
                or unofficial account, confirm their identity through the
                ZOBHUNGER website before continuing.
              </p>
            </div>
          </div>
        </div>

        <div className="zb-chatbot-safety-callout">
          <ShieldCheck aria-hidden="true" />
          <p>
            <strong>When in doubt, stop and verify.</strong> Do not send money or
            sensitive financial information until the request has been
            independently confirmed.
          </p>
        </div>

        <div className="zb-chatbot-safety-actions">
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Acknowledge safety notice and continue to Aarohi"
          >
            I understand
            <span>Continue to Aarohi</span>
          </button>
          <a href="/contact">Verify or report a suspicious request</a>
        </div>

        <p className="zb-chatbot-safety-footnote">
          Keep screenshots, phone numbers, payment requests, and other evidence
          if you need to report suspected fraud.
        </p>
      </section>
    </div>
  );
}
