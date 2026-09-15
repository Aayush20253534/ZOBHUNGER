import { inflateRawSync } from "node:zlib";
import { HttpError } from "../../utils/http-error.js";
import { technicalStudentCoreSchema, type TechnicalStudentCoreInput } from "./technical-students.schema.js";

export interface TechnicalStudentImportError {
  row: number;
  field?: string;
  message: string;
}

export interface TechnicalStudentParsedImport {
  rows: TechnicalStudentCoreInput[];
  rowNumbers: number[];
  errors: TechnicalStudentImportError[];
  totalRows: number;
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { value += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else value += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") { row.push(value.trim()); value = ""; }
    else if (char === "\n") { row.push(value.trim()); rows.push(row); row = []; value = ""; }
    else if (char !== "\r") value += char;
  }
  if (value.length || row.length) { row.push(value.trim()); rows.push(row); }
  return rows;
}

function zipEntries(buffer: Buffer): Map<string, Buffer> {
  const eocdSignature = 0x06054b50;
  let eocd = -1;
  const lowerBound = Math.max(0, buffer.length - 0xffff - 22);
  for (let offset = buffer.length - 22; offset >= lowerBound; offset -= 1) {
    if (buffer.readUInt32LE(offset) === eocdSignature) { eocd = offset; break; }
  }
  if (eocd < 0) throw new HttpError(400, "The Excel file is not a valid XLSX workbook", { code: "TECHNICAL_STUDENT_IMPORT_INVALID_XLSX" });

  const centralDirectorySize = buffer.readUInt32LE(eocd + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocd + 16);
  const end = centralDirectoryOffset + centralDirectorySize;
  if (centralDirectoryOffset < 0 || end > buffer.length) throw new HttpError(400, "The Excel workbook directory is invalid", { code: "TECHNICAL_STUDENT_IMPORT_INVALID_XLSX" });
  const entries = new Map<string, Buffer>();
  let cursor = centralDirectoryOffset;

  while (cursor < end && buffer.readUInt32LE(cursor) === 0x02014b50) {
    const compressionMethod = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.subarray(cursor + 46, cursor + 46 + fileNameLength).toString("utf8");

    if (name === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(name)) {
      if (uncompressedSize > 12 * 1024 * 1024) throw new HttpError(400, "The Excel worksheet is too large to process safely", { code: "TECHNICAL_STUDENT_IMPORT_XLSX_TOO_LARGE" });
      if (localHeaderOffset < 0 || localHeaderOffset + 30 > buffer.length || buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
        throw new HttpError(400, "The Excel workbook contains an invalid worksheet entry", { code: "TECHNICAL_STUDENT_IMPORT_INVALID_XLSX" });
      }
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
      let data: Buffer;
      if (compressionMethod === 0) data = compressed;
      else if (compressionMethod === 8) data = inflateRawSync(compressed);
      else throw new HttpError(400, "This Excel compression format is not supported", { code: "TECHNICAL_STUDENT_IMPORT_XLSX_COMPRESSION" });
      if (data.length > 12 * 1024 * 1024) throw new HttpError(400, "The Excel worksheet is too large to process safely", { code: "TECHNICAL_STUDENT_IMPORT_XLSX_TOO_LARGE" });
      entries.set(name, data);
    }

    cursor += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

function columnIndex(cellReference: string) {
  const letters = (cellReference.match(/[A-Z]+/i)?.[0] ?? "A").toUpperCase();
  let result = 0;
  for (const char of letters) result = result * 26 + char.charCodeAt(0) - 64;
  return result - 1;
}

function parseXlsx(buffer: Buffer): string[][] {
  const entries = zipEntries(buffer);
  const sharedXml = entries.get("xl/sharedStrings.xml")?.toString("utf8") ?? "";
  const sharedStrings = [...sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) => {
    const pieces = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((item) => decodeXml(item[1]));
    return pieces.join("");
  });
  const sheetName = [...entries.keys()].filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort()[0];
  if (!sheetName) throw new HttpError(400, "The Excel workbook does not contain a worksheet", { code: "TECHNICAL_STUDENT_IMPORT_EMPTY_XLSX" });
  const xml = entries.get(sheetName)!.toString("utf8");
  const rows: string[][] = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cellMatch[1];
      const body = cellMatch[2];
      const ref = attributes.match(/\br="([^"]+)"/)?.[1] ?? "A1";
      const type = attributes.match(/\bt="([^"]+)"/)?.[1] ?? "";
      const index = columnIndex(ref);
      let value = "";
      if (type === "inlineStr") {
        value = [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((item) => decodeXml(item[1])).join("");
      } else {
        const raw = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? "";
        value = type === "s" ? (sharedStrings[Number(raw)] ?? "") : decodeXml(raw);
      }
      while (row.length <= index) row.push("");
      row[index] = value.trim();
    }
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}

function normalizedHeader(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

const aliases: Record<string, string[]> = {
  fullName: ["full name", "student name", "name"],
  email: ["email", "email address", "student email"],
  mobileNumber: ["mobile", "mobile number", "phone", "phone number", "contact number"],
  enrollmentNumber: ["enrollment number", "enrollment no", "roll number", "roll no", "student id"],
  dateOfBirth: ["date of birth", "dob", "birth date"],
  gender: ["gender"],
  qualification: ["qualification", "education", "course type"],
  tradeBranch: ["trade branch", "trade", "branch", "course", "discipline"],
  passingYear: ["passing year", "passout year", "graduation year", "batch", "passing batch"],
  currentSemesterYear: ["current semester year", "current semester", "semester", "current year", "year semester"],
  academicScore: ["percentage cgpa", "academic score", "percentage", "cgpa", "score"],
  skills: ["skills", "technical skills"],
  certifications: ["certifications", "certificates", "certification"],
  currentCity: ["current city", "city"],
  currentState: ["current state", "state"],
  preferredLocations: ["preferred locations", "preferred location", "preferred job location", "job location"],
  preferredOpportunityTypes: ["interested in", "opportunity preferences", "preferred opportunity types", "opportunity type"],
};

function listValue(value: string) {
  return value.split(/[,;|\n]/).map((item) => item.trim()).filter(Boolean);
}

function normalizeQualification(value: string) {
  const compact = value.toLowerCase();
  if (compact.includes("iti")) return "iti";
  if (compact.includes("poly") || compact.includes("diploma")) return "diploma-polytechnic";
  return value.trim().toLowerCase();
}

function normalizeGender(value: string) {
  const compact = value.trim().toLowerCase();
  if (!compact) return undefined;
  if (["m", "male"].includes(compact)) return "male";
  if (["f", "female"].includes(compact)) return "female";
  if (["prefer not to say", "prefer-not-to-say", "na", "n/a"].includes(compact)) return "prefer-not-to-say";
  return "other";
}

function normalizeOpportunity(value: string) {
  const compact = value.trim().toLowerCase();
  if (compact.startsWith("job")) return "jobs";
  if (compact.startsWith("intern")) return "internships";
  if (compact.startsWith("apprent")) return "apprenticeships";
  if (compact.startsWith("train")) return "training";
  return compact;
}

function excelDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split(/[/-]/).map(Number);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const serial = Number(trimmed);
  if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
    const millis = Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000;
    return new Date(millis).toISOString().slice(0, 10);
  }
  return trimmed;
}

function mapRows(table: string[][]): TechnicalStudentParsedImport {
  const meaningful = table.filter((row) => row.some((value) => value.trim()));
  if (meaningful.length < 2) throw new HttpError(400, "The student file needs a header row and at least one student", { code: "TECHNICAL_STUDENT_IMPORT_EMPTY" });
  const headers = meaningful[0].map(normalizedHeader);
  const columnMap = new Map<string, number>();
  for (const [field, names] of Object.entries(aliases)) {
    const index = headers.findIndex((header) => names.includes(header));
    if (index >= 0) columnMap.set(field, index);
  }
  for (const required of ["fullName", "email", "mobileNumber", "qualification", "tradeBranch", "passingYear", "currentCity", "currentState", "preferredOpportunityTypes"]) {
    if (!columnMap.has(required)) {
      throw new HttpError(400, `The student file is missing the required column: ${aliases[required][0]}`, { code: "TECHNICAL_STUDENT_IMPORT_COLUMN_MISSING", details: { field: required } });
    }
  }

  if (meaningful.length - 1 > 1000) throw new HttpError(400, "A single student import can contain at most 1,000 records", { code: "TECHNICAL_STUDENT_IMPORT_TOO_LARGE" });
  const rows: TechnicalStudentCoreInput[] = [];
  const rowNumbers: number[] = [];
  const errors: TechnicalStudentImportError[] = [];
  const seenEmails = new Set<string>();
  const seenEnrollment = new Set<string>();

  for (let index = 1; index < meaningful.length; index += 1) {
    const source = meaningful[index];
    const value = (field: string) => source[columnMap.get(field) ?? -1]?.trim() ?? "";
    const raw = {
      fullName: value("fullName"),
      email: value("email").toLowerCase(),
      mobileNumber: value("mobileNumber"),
      enrollmentNumber: value("enrollmentNumber") || undefined,
      dateOfBirth: excelDate(value("dateOfBirth")),
      gender: normalizeGender(value("gender")),
      qualification: normalizeQualification(value("qualification")),
      tradeBranch: value("tradeBranch"),
      passingYear: value("passingYear").replace(/\.0$/, ""),
      currentSemesterYear: value("currentSemesterYear") || undefined,
      academicScore: value("academicScore") || undefined,
      skills: listValue(value("skills")),
      certifications: listValue(value("certifications")),
      currentCity: value("currentCity"),
      currentState: value("currentState"),
      preferredLocations: listValue(value("preferredLocations")),
      preferredOpportunityTypes: listValue(value("preferredOpportunityTypes")).map(normalizeOpportunity),
    };
    const parsed = technicalStudentCoreSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors.push({ row: index + 1, field: issue.path[0]?.toString(), message: issue.message });
      continue;
    }
    if (seenEmails.has(parsed.data.email)) {
      errors.push({ row: index + 1, field: "email", message: "Duplicate email inside this file" });
      continue;
    }
    if (parsed.data.enrollmentNumber && seenEnrollment.has(parsed.data.enrollmentNumber.toLowerCase())) {
      errors.push({ row: index + 1, field: "enrollmentNumber", message: "Duplicate enrollment number inside this file" });
      continue;
    }
    seenEmails.add(parsed.data.email);
    if (parsed.data.enrollmentNumber) seenEnrollment.add(parsed.data.enrollmentNumber.toLowerCase());
    rows.push(parsed.data);
    rowNumbers.push(index + 1);
  }
  return { rows, rowNumbers, errors, totalRows: meaningful.length - 1 };
}

export function parseTechnicalStudentSpreadsheet(input: { buffer: Buffer; mimeType?: string; fileName?: string }): TechnicalStudentParsedImport {
  if (!Buffer.isBuffer(input.buffer) || input.buffer.length === 0) throw new HttpError(400, "Choose a CSV or XLSX student file", { code: "TECHNICAL_STUDENT_IMPORT_FILE_REQUIRED" });
  const fileName = (input.fileName ?? "").toLowerCase();
  const mime = (input.mimeType ?? "").toLowerCase();
  const xlsx = fileName.endsWith(".xlsx") || mime.includes("spreadsheetml");
  const csv = fileName.endsWith(".csv") || mime.includes("csv") || mime === "text/plain";
  if (!xlsx && !csv) throw new HttpError(415, "Upload a .xlsx or .csv student file", { code: "TECHNICAL_STUDENT_IMPORT_FILE_TYPE" });
  const table = xlsx ? parseXlsx(input.buffer) : parseCsv(input.buffer.toString("utf8").replace(/^\uFEFF/, ""));
  return mapRows(table);
}
