const A4_W = 595.28;
const A4_H = 841.89;

type JoiningForOffer = {
  employeeNumber: string | null;
  fullName: string;
  currentAddressLine1: string;
  currentAddressLine2: string | null;
  currentCity: string;
  currentState: string;
  currentPostalCode: string;
};

type OfferForPdf = {
  status: string;
  designation: string;
  department: string;
  projectAssignment: string;
  workLocation: string;
  joiningDate: Date;
  employmentType: string;
  monthlyGrossSalary: number;
  annualCtc: number;
  probationMonths: number;
  noticePeriodDays: number;
  additionalTerms: string | null;
  authorizedSignatoryName: string | null;
  authorizedSignatoryTitle: string | null;
  issuedAt: Date | null;
};

type PdfPage = string[];

function pdfText(value: string) {
  return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "?").replace(/([\\()])/g, "\\$1");
}

function wrap(value: string, max = 88) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (!line) { line = word; continue; }
    if (`${line} ${word}`.length <= max) line += ` ${word}`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

function indianDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function money(value: number) {
  return `INR ${new Intl.NumberFormat("en-IN").format(value)}`;
}

function employmentLabel(value: string) {
  return value.split("_").map(part => part[0] + part.slice(1).toLowerCase()).join(" ");
}

function jpegSize(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > bytes.length) break;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) break;
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
      return { height: bytes.readUInt16BE(offset + 3), width: bytes.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  return null;
}

function makePdf(pageContents: PdfPage[], signature?: Buffer, signaturePageIndex?: number) {
  const sigSize = signature ? jpegSize(signature) : null;
  const hasSignature = Boolean(signature && sigSize && signaturePageIndex !== undefined);
  const pageCount = pageContents.length;
  const firstPageObject = 3;
  const fontRegularObject = firstPageObject + pageCount;
  const fontBoldObject = fontRegularObject + 1;
  const firstContentObject = fontBoldObject + 1;
  const signatureObject = firstContentObject + pageCount;

  const objects: Buffer[] = [];
  objects.push(Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "ascii"));
  objects.push(Buffer.from(`<< /Type /Pages /Kids [${pageContents.map((_, index) => `${firstPageObject + index} 0 R`).join(" ")}] /Count ${pageCount} >>`, "ascii"));

  pageContents.forEach((_, index) => {
    const signatureResource = hasSignature && index === signaturePageIndex ? `/XObject << /Sig ${signatureObject} 0 R >>` : "";
    objects.push(Buffer.from(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_W} ${A4_H}] /Resources << /Font << /F1 ${fontRegularObject} 0 R /F2 ${fontBoldObject} 0 R >> ${signatureResource} >> /Contents ${firstContentObject + index} 0 R >>`,
      "ascii",
    ));
  });

  objects.push(Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "ascii"));
  objects.push(Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>", "ascii"));

  for (const page of pageContents) {
    const stream = Buffer.from(page.join("\n"), "ascii");
    objects.push(Buffer.concat([
      Buffer.from(`<< /Length ${stream.length} >>\nstream\n`, "ascii"),
      stream,
      Buffer.from("\nendstream", "ascii"),
    ]));
  }

  if (hasSignature && signature && sigSize) {
    objects.push(Buffer.concat([
      Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${sigSize.width} /Height ${sigSize.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${signature.length} >>\nstream\n`, "ascii"),
      signature,
      Buffer.from("\nendstream", "ascii"),
    ]));
  }

  const header = Buffer.from("%PDF-1.4\n%ZBH\n", "binary");
  const chunks: Buffer[] = [header];
  const offsets = [0];
  let cursor = header.length;
  objects.forEach((object, index) => {
    offsets.push(cursor);
    const pre = Buffer.from(`${index + 1} 0 obj\n`, "ascii");
    const post = Buffer.from("\nendobj\n", "ascii");
    chunks.push(pre, object, post);
    cursor += pre.length + object.length + post.length;
  });
  const xrefAt = cursor;
  const xref = [`xref\n0 ${objects.length + 1}\n`, "0000000000 65535 f \n", ...offsets.slice(1).map(v => `${String(v).padStart(10, "0")} 00000 n \n`)].join("");
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  chunks.push(Buffer.from(xref + trailer, "ascii"));
  return Buffer.concat(chunks);
}

function text(page: PdfPage, x: number, y: number, value: string, size = 10, bold = false, color = "0.12 0.12 0.14") {
  page.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfText(value)}) Tj ET`);
}

function line(page: PdfPage, x1: number, y1: number, x2: number, y2: number, color = "0.85 0.85 0.87", width = 1) {
  page.push(`${width} w ${color} RG ${x1} ${y1} m ${x2} ${y2} l S`);
}

function paragraph(page: PdfPage, x: number, y: number, value: string, max = 92, leading = 15, size = 10) {
  let currentY = y;
  for (const row of wrap(value, max)) {
    text(page, x, currentY, row, size);
    currentY -= leading;
  }
  return currentY;
}

function drawLetterhead(page: PdfPage) {
  text(page, 52, 790, "ZOB", 24, true, "0.12 0.12 0.14");
  text(page, 103, 790, "HUNGER", 24, true, "0.85 0.15 0.23");
  text(page, 52, 771, "Hire. Deploy. Deliver.", 9, true, "0.35 0.33 0.36");
  text(page, 360, 792, "Zobhungr Solutions Private Limited", 9, true, "0.32 0.30 0.33");
  text(page, 360, 777, "Vijay Tower, Ghazipur, Uttar Pradesh 233001", 8, false, "0.42 0.40 0.43");
  text(page, 360, 763, "help@zobhungr.com | zobhungr.com", 8, false, "0.42 0.40 0.43");
  line(page, 52, 744, 543, 744, "0.85 0.15 0.23", 1.6);
}

function drawFooter(page: PdfPage, pageNumber: number, pageCount: number) {
  line(page, 52, 50, 543, 50, "0.90 0.88 0.89", 0.5);
  text(page, 52, 34, "This is a system-generated offer letter. Verify the employee ID and issue status with ZOBHUNGER HR.", 7, false, "0.46 0.44 0.46");
  text(page, 500, 34, `${pageNumber}/${pageCount}`, 7, true, "0.46 0.44 0.46");
}

function drawDraftWatermark(page: PdfPage, status: string) {
  if (status !== "ISSUED") page.push("q 0.92 0.92 0.93 rg 0.707 0.707 -0.707 0.707 155 310 cm BT /F2 58 Tf 0 0 Td (DRAFT - NOT ISSUED) Tj ET Q");
}

function drawSignature(page: PdfPage, y: number, offer: OfferForPdf, signature?: Buffer) {
  const sigSize = signature ? jpegSize(signature) : null;
  const hasSignature = Boolean(signature && sigSize);
  text(page, 52, y, "For Zobhungr Solutions Private Limited", 9, true);
  y -= 12;
  if (hasSignature && signature && sigSize) {
    const maxW = 110;
    const maxH = 48;
    const scale = Math.min(maxW / sigSize.width, maxH / sigSize.height);
    const sw = sigSize.width * scale;
    const sh = sigSize.height * scale;
    page.push(`q ${sw.toFixed(2)} 0 0 ${sh.toFixed(2)} 52 ${(y - sh + 2).toFixed(2)} cm /Sig Do Q`);
    y -= sh + 4;
  } else {
    text(page, 52, y - 12, offer.status === "ISSUED" ? "Authorized signature" : "Signature to be added before issue", 8, false, "0.48 0.45 0.48");
    y -= 28;
  }
  line(page, 52, y, 190, y, "0.35 0.33 0.36", 0.6);
  text(page, 52, y - 14, offer.authorizedSignatoryName || "Authorized Signatory", 8.5, true);
  text(page, 52, y - 27, offer.authorizedSignatoryTitle || "Authorized Signatory", 8, false, "0.42 0.40 0.43");
}

export function createEmployeeOfferPdf(joining: JoiningForOffer, offer: OfferForPdf, signature?: Buffer) {
  const firstPage: PdfPage = [];
  drawLetterhead(firstPage);

  const letterDate = offer.issuedAt ?? new Date();
  text(firstPage, 52, 716, `Date: ${indianDate(letterDate)}`, 9);
  text(firstPage, 52, 696, "To,", 10, true);
  text(firstPage, 52, 680, joining.fullName, 10, true);
  text(firstPage, 52, 664, joining.currentAddressLine1, 9);
  if (joining.currentAddressLine2) text(firstPage, 52, 650, joining.currentAddressLine2, 9);
  text(firstPage, 52, joining.currentAddressLine2 ? 636 : 650, `${joining.currentCity}, ${joining.currentState} ${joining.currentPostalCode}`, 9);

  let y = joining.currentAddressLine2 ? 606 : 620;
  text(firstPage, 52, y, `Subject: Offer of Employment - ${offer.designation}`, 11, true, "0.42 0.13 0.20");
  y -= 32;
  text(firstPage, 52, y, `Dear ${joining.fullName},`, 10, true);
  y -= 24;
  y = paragraph(firstPage, 52, y, "We are pleased to offer you employment with Zobhungr Solutions Private Limited. Your appointment is subject to the terms below and the policies applicable to your role and project assignment.");
  y -= 12;

  const rows: [string, string][] = [
    ["Employee ID", joining.employeeNumber || "Pending"],
    ["Designation", offer.designation],
    ["Department", offer.department],
    ["Project / Assignment", offer.projectAssignment],
    ["Work location", offer.workLocation],
    ["Joining date", indianDate(offer.joiningDate)],
    ["Employment type", employmentLabel(offer.employmentType)],
    ["Monthly gross salary", money(offer.monthlyGrossSalary)],
    ["Annual CTC", money(offer.annualCtc)],
    ["Probation", `${offer.probationMonths} month${offer.probationMonths === 1 ? "" : "s"}`],
    ["Notice period", `${offer.noticePeriodDays} day${offer.noticePeriodDays === 1 ? "" : "s"}`],
  ];

  for (const [label, value] of rows) {
    const valueLines = wrap(value, 58);
    text(firstPage, 64, y, label, 8, true, "0.38 0.35 0.38");
    valueLines.forEach((row, index) => text(firstPage, 190, y - index * 11, row, 8.5, false, "0.10 0.10 0.12"));
    const rowHeight = Math.max(19, 10 + valueLines.length * 11);
    line(firstPage, 58, y - rowHeight + 12, 520, y - rowHeight + 12, "0.91 0.89 0.90", 0.5);
    y -= rowHeight;
  }

  y -= 5;
  y = paragraph(firstPage, 52, y, "Your employment will be governed by company policies, confidentiality obligations, attendance requirements, project instructions and applicable law. You are expected to provide accurate joining documents and maintain professional conduct during your association with ZOBHUNGER.", 96, 13.5, 8.8);

  const additionalLines = offer.additionalTerms?.trim() ? wrap(offer.additionalTerms, 92) : [];
  const extraPages: PdfPage[] = [];
  if (additionalLines.length) {
    text(firstPage, 52, Math.max(104, y - 4), "Additional terms and conditions continue on the following page(s) and form part of this offer.", 8, true, "0.42 0.13 0.20");
    for (let index = 0; index < additionalLines.length; index += 30) {
      const page: PdfPage = [];
      drawLetterhead(page);
      text(page, 52, 704, "Additional Terms & Conditions", 13, true, "0.42 0.13 0.20");
      text(page, 52, 682, `${joining.fullName} | ${joining.employeeNumber || "Employee ID pending"}`, 8.5, true, "0.35 0.33 0.36");
      let termsY = 652;
      for (const row of additionalLines.slice(index, index + 30)) {
        text(page, 52, termsY, row, 9, false, "0.14 0.13 0.15");
        termsY -= 14;
      }
      extraPages.push(page);
    }
  }

  // Very long core terms can leave too little room for a legible signature
  // block even when there are no custom terms. In that case move authorization
  // to a clean continuation page instead of overlapping the policy/footer.
  if (!extraPages.length && y < 220) {
    const authorizationPage: PdfPage = [];
    drawLetterhead(authorizationPage);
    text(authorizationPage, 52, 704, "Offer Authorization", 13, true, "0.42 0.13 0.20");
    text(authorizationPage, 52, 682, `${joining.fullName} | ${joining.employeeNumber || "Employee ID pending"}`, 8.5, true, "0.35 0.33 0.36");
    text(authorizationPage, 52, 650, "This page forms part of the offer of employment and records the authorized company approval.", 9, false, "0.22 0.20 0.23");
    extraPages.push(authorizationPage);
  }

  const pages = [firstPage, ...extraPages];
  const signaturePageIndex = extraPages.length ? pages.length - 1 : 0;
  const signaturePage = pages[signaturePageIndex];
  if (extraPages.length) drawSignature(signaturePage, 190, offer, signature);
  else drawSignature(firstPage, Math.max(128, y - 18), offer, signature);

  pages.forEach((page, index) => {
    drawDraftWatermark(page, offer.status);
    drawFooter(page, index + 1, pages.length);
  });

  return makePdf(pages, signature, signaturePageIndex);
}
