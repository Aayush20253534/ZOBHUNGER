const palette = {
  red: "#e21d36",
  redDeep: "#c91530",
  ink: "#1f1720",
  muted: "#6f6269",
  line: "#eadde1",
  soft: "#fff6f7",
} as const;

export interface EmailDetail {
  label: string;
  value: string;
}

export interface EmailAction {
  label: string;
  url: string;
}

export interface CorporateEmailInput {
  eyebrow?: string;
  title: string;
  intro: string;
  details?: EmailDetail[];
  paragraphs?: string[];
  action?: EmailAction;
  note?: string;
  signoff?: string;
}

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function textBlock(input: CorporateEmailInput) {
  const sections = [
    input.eyebrow ? input.eyebrow.toUpperCase() : undefined,
    input.title,
    "",
    input.intro,
    ...(input.paragraphs?.flatMap(paragraph => ["", paragraph]) ?? []),
    ...(input.details?.length
      ? ["", ...input.details.map(detail => `${detail.label}: ${detail.value}`)]
      : []),
    ...(input.action ? ["", `${input.action.label}: ${input.action.url}`] : []),
    ...(input.note ? ["", input.note] : []),
    "",
    input.signoff ?? "Regards,\nZOBHUNGER",
  ].filter((value): value is string => value !== undefined);
  return sections.join("\n");
}

function detailsTable(details: EmailDetail[]) {
  if (!details.length) return "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border-collapse:separate;border-spacing:0;border:1px solid ${palette.line};border-radius:14px;overflow:hidden;background:#fff">${details.map((detail, index) => `<tr><td style="width:38%;padding:12px 14px;border-bottom:${index === details.length - 1 ? "0" : `1px solid ${palette.line}`};background:${palette.soft};color:${palette.muted};font-size:12px;font-weight:700;letter-spacing:.02em">${escapeEmailHtml(detail.label)}</td><td style="padding:12px 14px;border-bottom:${index === details.length - 1 ? "0" : `1px solid ${palette.line}`};color:${palette.ink};font-size:14px;font-weight:700;overflow-wrap:anywhere">${escapeEmailHtml(detail.value)}</td></tr>`).join("")}</table>`;
}

export function corporateEmail(input: CorporateEmailInput) {
  const eyebrow = escapeEmailHtml(input.eyebrow ?? "ZOBHUNGER");
  const title = escapeEmailHtml(input.title);
  const intro = escapeEmailHtml(input.intro);
  const paragraphs = (input.paragraphs ?? []).map(paragraph => `<p style="margin:14px 0 0;color:${palette.muted};font-size:15px;line-height:1.7">${escapeEmailHtml(paragraph)}</p>`).join("");
  const details = detailsTable(input.details ?? []);
  const action = input.action
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0 8px"><tr><td style="border-radius:10px;background:${palette.redDeep}"><a href="${escapeEmailHtml(input.action.url)}" style="display:inline-block;padding:13px 18px;color:#fff;text-decoration:none;font-size:14px;font-weight:800">${escapeEmailHtml(input.action.label)}</a></td></tr></table>`
    : "";
  const note = input.note
    ? `<div style="margin-top:24px;padding:14px 16px;border-left:3px solid ${palette.red};border-radius:8px;background:${palette.soft};color:${palette.muted};font-size:13px;line-height:1.65">${escapeEmailHtml(input.note)}</div>`
    : "";
  const signoff = escapeEmailHtml(input.signoff ?? "Regards,\nZOBHUNGER").replaceAll("\n", "<br>");

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f5f2f3"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f5f2f3"><tr><td align="center" style="padding:28px 14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;border-collapse:separate;border-spacing:0;border:1px solid ${palette.line};border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 18px 46px rgba(57,20,31,.08)"><tr><td style="padding:25px 28px;background:${palette.red};background-image:linear-gradient(138deg,#f42642 0%,#e21d36 46%,#c91530 100%);color:#fff"><div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;opacity:.82">${eyebrow}</div><div style="margin-top:7px;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.18;font-weight:900;letter-spacing:-.02em">${title}</div></td></tr><tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;color:${palette.ink}"><p style="margin:0;color:${palette.ink};font-size:16px;line-height:1.7">${intro}</p>${paragraphs}${details}${action}${note}<p style="margin:26px 0 0;color:${palette.muted};font-size:14px;line-height:1.65">${signoff}</p></td></tr><tr><td style="padding:16px 28px;border-top:1px solid ${palette.line};background:#fbf9fa;font-family:Arial,Helvetica,sans-serif;color:#8b7e84;font-size:11px;line-height:1.6">ZOBHUNGER · Integrated Workforce, Sales &amp; Business Execution Platform<br>This is an operational email generated by the ZOBHUNGER platform.</td></tr></table></td></tr></table></body></html>`;

  return { text: textBlock(input), html };
}
