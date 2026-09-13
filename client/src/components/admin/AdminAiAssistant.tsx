"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Archive,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  Inbox,
  LoaderCircle,
  MessageSquareText,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  changeAiKnowledgeStatus,
  changeAiLeadStatus,
  createAiKnowledge,
  getAiAssistantAnalytics,
  listAiKnowledge,
  listAiLeads,
  updateAiKnowledge,
  type AiAssistantAnalytics,
  type AiKnowledgeDocument,
  type AiKnowledgeDraftInput,
  type AiKnowledgeStatus,
  type AiLead,
  type AiLeadStatus,
  type AiManagedAudience,
  type AiPage,
} from "@/services/admin-ai-assistant.service";

const categories = ["company", "services", "industries", "workers", "businesses", "jobs", "partnerships", "case-studies", "contact", "policies"] as const;
const knowledgeStatuses: AiKnowledgeStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const leadStatuses: AiLeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED"];
const audiences: AiManagedAudience[] = ["JOB_SEEKER", "BUSINESS", "VENDOR_PARTNER", "GENERAL"];
type Tab = "overview" | "knowledge" | "leads";
type Notice = { tone: "success" | "error" | "warning"; message: string } | null;

const emptyKnowledgeForm: AiKnowledgeDraftInput = {
  slug: "",
  title: "",
  category: "company",
  url: "/",
  description: "",
  keywords: [],
  aliases: [],
  body: "",
};

function humanize(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function percentage(value: number) { return `${Math.round(value * 100)}%`; }
function errorMessage(error: unknown, fallback: string) { return error instanceof ApiError ? error.message : error instanceof Error ? error.message : fallback; }
function splitTags(value: string) { return [...new Set(value.split(",").map((entry) => entry.trim()).filter(Boolean))].slice(0, 30); }

export function AdminAiAssistant() {
  const [tab, setTab] = useState<Tab>("overview");
  const [analytics, setAnalytics] = useState<AiAssistantAnalytics | null>(null);
  const [knowledge, setKnowledge] = useState<AiPage<AiKnowledgeDocument> | null>(null);
  const [leads, setLeads] = useState<AiPage<AiLead> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [knowledgePage, setKnowledgePage] = useState(1);
  const [knowledgeQuery, setKnowledgeQuery] = useState("");
  const [knowledgeStatus, setKnowledgeStatus] = useState<AiKnowledgeStatus | "">("");
  const [knowledgeCategory, setKnowledgeCategory] = useState("");
  const [leadPage, setLeadPage] = useState(1);
  const [leadQuery, setLeadQuery] = useState("");
  const [leadStatus, setLeadStatus] = useState<AiLeadStatus | "">("");
  const [leadAudience, setLeadAudience] = useState<AiManagedAudience | "">("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<AiKnowledgeDocument | "new" | null>(null);
  const [form, setForm] = useState<AiKnowledgeDraftInput>(emptyKnowledgeForm);
  const [keywordText, setKeywordText] = useState("");
  const [aliasText, setAliasText] = useState("");
  const [saving, setSaving] = useState(false);

  const loadOverview = useCallback(async (soft = false) => {
    if (soft) setRefreshing(true); else setLoading(true);
    try { setAnalytics((await getAiAssistantAnalytics(analyticsDays)).data); }
    catch (error) { setNotice({ tone: "error", message: errorMessage(error, "Unable to load AI assistant analytics.") }); }
    finally { setLoading(false); setRefreshing(false); }
  }, [analyticsDays]);

  const loadKnowledge = useCallback(async (soft = false) => {
    if (soft) setRefreshing(true); else setLoading(true);
    try {
      setKnowledge((await listAiKnowledge({ page: knowledgePage, query: knowledgeQuery || undefined, status: knowledgeStatus, category: knowledgeCategory || undefined })).data);
    } catch (error) { setNotice({ tone: "error", message: errorMessage(error, "Unable to load AI knowledge.") }); }
    finally { setLoading(false); setRefreshing(false); }
  }, [knowledgeCategory, knowledgePage, knowledgeQuery, knowledgeStatus]);

  const loadLeads = useCallback(async (soft = false) => {
    if (soft) setRefreshing(true); else setLoading(true);
    try { setLeads((await listAiLeads({ page: leadPage, query: leadQuery || undefined, status: leadStatus, audience: leadAudience })).data); }
    catch (error) { setNotice({ tone: "error", message: errorMessage(error, "Unable to load AI assistant leads.") }); }
    finally { setLoading(false); setRefreshing(false); }
  }, [leadAudience, leadPage, leadQuery, leadStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (tab === "overview") void loadOverview();
      else if (tab === "knowledge") void loadKnowledge();
      else void loadLeads();
    }, tab === "overview" ? 0 : 180);
    return () => window.clearTimeout(timer);
  }, [loadKnowledge, loadLeads, loadOverview, tab]);

  const refresh = useCallback(() => {
    setNotice(null);
    if (tab === "overview") void loadOverview(true);
    else if (tab === "knowledge") void loadKnowledge(true);
    else void loadLeads(true);
  }, [loadKnowledge, loadLeads, loadOverview, tab]);

  function openCreate() {
    setEditor("new");
    setForm(emptyKnowledgeForm);
    setKeywordText("");
    setAliasText("");
    setNotice(null);
  }

  function openEdit(item: AiKnowledgeDocument) {
    setEditor(item);
    setForm({
      slug: item.slug,
      title: item.title,
      category: item.category,
      url: item.url,
      description: item.description ?? "",
      keywords: item.keywords,
      aliases: item.aliases,
      body: item.body,
    });
    setKeywordText(item.keywords.join(", "));
    setAliasText(item.aliases.join(", "));
    setNotice(null);
  }

  async function saveKnowledge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !editor) return;
    setSaving(true); setNotice(null);
    const payload = { ...form, keywords: splitTags(keywordText), aliases: splitTags(aliasText), description: form.description?.trim() || undefined };
    try {
      const response = editor === "new"
        ? await createAiKnowledge(payload)
        : await updateAiKnowledge(editor.id, { ...payload, expectedRevision: editor.revision });
      setEditor(response.data);
      setForm({ ...payload, description: payload.description ?? "" });
      setKeywordText(response.data.keywords.join(", "));
      setAliasText(response.data.aliases.join(", "));
      setNotice({ tone: "success", message: editor === "new" ? "Knowledge draft created. Review it before publishing." : "Knowledge saved. Published content is returned to draft after edits and must be verified again." });
      await loadKnowledge(true);
    } catch (error) { setNotice({ tone: "error", message: errorMessage(error, "Unable to save knowledge.") }); }
    finally { setSaving(false); }
  }

  async function setKnowledgeLifecycle(item: AiKnowledgeDocument, status: AiKnowledgeStatus) {
    setBusyId(item.id); setNotice(null);
    try {
      const updated = (await changeAiKnowledgeStatus(item.id, status, item.revision)).data;
      setNotice({ tone: "success", message: status === "PUBLISHED" ? "Knowledge verified and published to the live assistant." : `Knowledge moved to ${humanize(status)}.` });
      if (editor !== "new" && editor?.id === item.id) setEditor(updated);
      await loadKnowledge(true);
      if (tab === "overview") await loadOverview(true);
    } catch (error) { setNotice({ tone: "error", message: errorMessage(error, "Unable to change knowledge status.") }); }
    finally { setBusyId(null); }
  }

  async function setLeadLifecycle(item: AiLead, status: AiLeadStatus) {
    setBusyId(item.id); setNotice(null);
    try {
      await changeAiLeadStatus(item.id, status);
      setNotice({ tone: "success", message: `${item.name}'s enquiry is now ${humanize(status)}.` });
      await loadLeads(true);
    } catch (error) { setNotice({ tone: "error", message: errorMessage(error, "Unable to update lead status.") }); }
    finally { setBusyId(null); }
  }

  const overviewCards = useMemo(() => analytics ? [
    { label: "Questions asked", value: analytics.totals.questions, note: `${analytics.totals.conversations} conversations`, icon: MessageSquareText },
    { label: "Grounded answers", value: percentage(analytics.rates.grounded), note: `${analytics.totals.grounded} verified answers`, icon: ShieldCheck },
    { label: "Unanswered", value: analytics.totals.unanswered, note: `${percentage(analytics.rates.unanswered)} need knowledge or handover`, icon: CircleHelp },
    { label: "Leads generated", value: analytics.totals.leads, note: `${percentage(analytics.rates.leadConversion)} conversation conversion`, icon: UsersRound },
  ] : [], [analytics]);

  return (
    <div className="zbaa-page">
      <section className="zbaa-hero">
        <div>
          <span className="zbaa-kicker"><BrainCircuit aria-hidden="true" /> AI operations</span>
          <h1>ZOBHUNGER AI Assistant</h1>
          <p>Manage verified knowledge, review unanswered demand, track leads and control the public assistant without changing application code.</p>
        </div>
        <div className="zbaa-hero-actions">
          <span className="zbaa-live"><i /> Grounded RAG</span>
          <button type="button" onClick={refresh} disabled={refreshing}><RefreshCw className={refreshing ? "zba-spin" : ""} /> Refresh</button>
        </div>
      </section>

      <nav className="zbaa-tabs" aria-label="AI assistant administration">
        {(["overview", "knowledge", "leads"] as Tab[]).map((value) => (
          <button key={value} type="button" className={tab === value ? "is-active" : ""} onClick={() => { setTab(value); setNotice(null); }}>
            {value === "overview" ? <BarChart3 /> : value === "knowledge" ? <FileCheck2 /> : <Inbox />}{humanize(value)}
          </button>
        ))}
      </nav>

      {notice ? <div className={`zbaa-notice is-${notice.tone}`} role="status">{notice.tone === "success" ? <CheckCircle2 /> : <AlertCircle />}<span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss"><X /></button></div> : null}

      {loading ? <div className="zbaa-loading"><LoaderCircle className="zba-spin" /><span>Loading AI assistant workspace…</span></div> : null}

      {!loading && tab === "overview" && analytics ? (
        <>
          <section className="zbaa-overview-toolbar"><div><strong>Performance window</strong><span>Operational analytics use persisted, privacy-bounded conversation events.</span></div><select value={analyticsDays} onChange={(event) => setAnalyticsDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></section>
          <section className="zbaa-stats">{overviewCards.map(({ label, value, note, icon: Icon }) => <article key={label}><span><Icon /></span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>)}</section>
          <div className="zbaa-overview-grid">
            <section className="zbaa-panel"><header><div><span className="zbaa-section-kicker">Knowledge gaps</span><h2>Top unanswered questions</h2><p>Use these to improve verified knowledge instead of letting the model improvise.</p></div></header><div className="zbaa-question-list">{analytics.topUnanswered.length ? analytics.topUnanswered.map((item, index) => <article key={`${item.question}:${index}`}><span>{index + 1}</span><p>{item.question}</p><strong>{item.count}×</strong></article>) : <div className="zbaa-empty"><Sparkles /><strong>No unanswered questions in this period</strong><p>The current verified knowledge covered recorded questions.</p></div>}</div></section>
            <section className="zbaa-panel"><header><div><span className="zbaa-section-kicker">Traffic mix</span><h2>Audience and knowledge health</h2><p>See who uses the assistant and how much managed content is live.</p></div></header><div className="zbaa-breakdown"><Breakdown label="Business" value={analytics.audience.BUSINESS ?? 0} /><Breakdown label="Job seekers" value={analytics.audience.JOB_SEEKER ?? 0} /><Breakdown label="Vendors / partners" value={analytics.audience.VENDOR_PARTNER ?? 0} /><Breakdown label="General" value={analytics.audience.GENERAL ?? 0} /><hr /><Breakdown label="Published knowledge" value={analytics.knowledge.PUBLISHED ?? 0} /><Breakdown label="Draft knowledge" value={analytics.knowledge.DRAFT ?? 0} /><Breakdown label="Archived knowledge" value={analytics.knowledge.ARCHIVED ?? 0} /></div><div className="zbaa-latency"><Bot /><div><small>Average assistant latency</small><strong>{analytics.totals.averageLatencyMs.toLocaleString("en-IN")} ms</strong></div></div></section>
          </div>
        </>
      ) : null}

      {!loading && tab === "knowledge" ? (
        <section className="zbaa-panel zbaa-panel--full">
          <header className="zbaa-list-head"><div><span className="zbaa-section-kicker">Verified source control</span><h2>Managed knowledge base</h2><p>Only published and explicitly verified records are added to the live retrieval index.</p></div><button className="zbaa-primary" type="button" onClick={openCreate}><Plus /> New knowledge</button></header>
          <div className="zbaa-filters"><label><Search /><input value={knowledgeQuery} onChange={(event) => { setKnowledgeQuery(event.target.value); setKnowledgePage(1); }} placeholder="Search title, slug or content" /></label><select value={knowledgeStatus} onChange={(event) => { setKnowledgeStatus(event.target.value as AiKnowledgeStatus | ""); setKnowledgePage(1); }}><option value="">All statuses</option>{knowledgeStatuses.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}</select><select value={knowledgeCategory} onChange={(event) => { setKnowledgeCategory(event.target.value); setKnowledgePage(1); }}><option value="">All categories</option>{categories.map((category) => <option key={category} value={category}>{humanize(category)}</option>)}</select></div>
          <div className="zbaa-knowledge-list">{knowledge?.items.length ? knowledge.items.map((item) => <article key={item.id}><div className="zbaa-knowledge-main"><div className="zbaa-row-title"><span className={`zbaa-status is-${item.status.toLowerCase()}`}>{humanize(item.status)}</span><span>{humanize(item.category)}</span></div><h3>{item.title}</h3><p>{item.description || item.body.slice(0, 180)}</p><small>{item.url} · Updated {formatDate(item.updatedAt)} · Revision {item.revision}</small></div><div className="zbaa-row-actions"><button type="button" onClick={() => openEdit(item)}><Pencil /> Edit</button>{item.status !== "PUBLISHED" ? <button type="button" className="is-positive" disabled={busyId === item.id} onClick={() => void setKnowledgeLifecycle(item, "PUBLISHED")}><ShieldCheck /> Publish</button> : <button type="button" disabled={busyId === item.id} onClick={() => void setKnowledgeLifecycle(item, "DRAFT")}><Save /> Return to draft</button>}{item.status !== "ARCHIVED" ? <button type="button" className="is-muted" disabled={busyId === item.id} onClick={() => void setKnowledgeLifecycle(item, "ARCHIVED")}><Archive /> Archive</button> : null}</div></article>) : <div className="zbaa-empty"><Search /><strong>No managed knowledge matches these filters</strong><p>Create a verified record or change the current filters.</p></div>}</div>
          <Pager page={knowledge?.page ?? 1} totalPages={knowledge?.totalPages ?? 1} onPage={setKnowledgePage} />
        </section>
      ) : null}

      {!loading && tab === "leads" ? (
        <section className="zbaa-panel zbaa-panel--full">
          <header className="zbaa-list-head"><div><span className="zbaa-section-kicker">Lead & handover queue</span><h2>Assistant enquiries</h2><p>Every chatbot lead is also routed into the normal intake system so human follow-up stays accountable.</p></div><span className="zbaa-total">{leads?.total ?? 0} records</span></header>
          <div className="zbaa-filters"><label><Search /><input value={leadQuery} onChange={(event) => { setLeadQuery(event.target.value); setLeadPage(1); }} placeholder="Name, contact, company or requirement" /></label><select value={leadStatus} onChange={(event) => { setLeadStatus(event.target.value as AiLeadStatus | ""); setLeadPage(1); }}><option value="">All statuses</option>{leadStatuses.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}</select><select value={leadAudience} onChange={(event) => { setLeadAudience(event.target.value as AiManagedAudience | ""); setLeadPage(1); }}><option value="">All audiences</option>{audiences.map((audience) => <option key={audience} value={audience}>{humanize(audience)}</option>)}</select></div>
          <div className="zbaa-lead-list">{leads?.items.length ? leads.items.map((item) => <article key={item.id}><div className="zbaa-lead-avatar">{item.name.slice(0, 2).toUpperCase()}</div><div className="zbaa-lead-copy"><div><strong>{item.name}</strong><span className={`zbaa-status is-${item.status.toLowerCase()}`}>{humanize(item.status)}</span></div><small>{humanize(item.audience)}{item.companyName ? ` · ${item.companyName}` : ""} · {formatDate(item.createdAt)}</small><p>{item.requirement}</p><div className="zbaa-contact-row">{item.email ? <a href={`mailto:${item.email}`}>{item.email}</a> : null}{item.phone ? <a href={`tel:${item.phone}`}>{item.phone}</a> : null}{item.sourcePath ? <span>From {item.sourcePath}</span> : null}</div>{item.enquiryDetails ? <details><summary>Additional details</summary><p>{item.enquiryDetails}</p></details> : null}</div><label className="zbaa-lead-status">Status<select value={item.status} disabled={busyId === item.id} onChange={(event) => void setLeadLifecycle(item, event.target.value as AiLeadStatus)}>{leadStatuses.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}</select></label></article>) : <div className="zbaa-empty"><Inbox /><strong>No assistant leads match these filters</strong><p>New lead and human-handover requests will appear here automatically.</p></div>}</div>
          <Pager page={leads?.page ?? 1} totalPages={leads?.totalPages ?? 1} onPage={setLeadPage} />
        </section>
      ) : null}

      {editor ? <div className="zbaa-drawer-layer" role="presentation"><button className="zbaa-drawer-backdrop" type="button" aria-label="Close knowledge editor" onClick={() => !saving && setEditor(null)} /><aside className="zbaa-editor" role="dialog" aria-modal="true" aria-labelledby="ai-knowledge-editor-title"><header><div><span className="zbaa-section-kicker">{editor === "new" ? "New verified source" : `${humanize(editor.status)} · revision ${editor.revision}`}</span><h2 id="ai-knowledge-editor-title">{editor === "new" ? "Create knowledge draft" : "Edit knowledge"}</h2><p>Publishing is an explicit verification action. Edits to live content automatically return it to draft.</p></div><button type="button" onClick={() => !saving && setEditor(null)} aria-label="Close"><X /></button></header><form onSubmit={saveKnowledge}><div className="zbaa-editor-grid"><label>Title *<input required minLength={3} maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>Slug *<input required disabled={editor !== "new"} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") })} /></label><label>Category *<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category} value={category}>{humanize(category)}</option>)}</select></label><label>Public URL *<input required value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="/services" /></label></div><label>Description<textarea minLength={10} maxLength={320} rows={2} value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><div className="zbaa-editor-grid"><label>Keywords<input value={keywordText} onChange={(event) => setKeywordText(event.target.value)} placeholder="workforce, deployment, staffing" /></label><label>Aliases<input value={aliasText} onChange={(event) => setAliasText(event.target.value)} placeholder="alternative phrases, common names" /></label></div><label>Verified source content *<textarea className="zbaa-body-editor" required minLength={20} maxLength={60000} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Write factual ZOBHUNGER content only. Markdown headings and lists are supported by the RAG parser." /></label><div className="zbaa-editor-note"><ShieldCheck /><span>Drafts never reach public retrieval. Publishing records the verifying administrator and refreshes the live knowledge index.</span></div><footer><button type="button" className="zbaa-secondary" onClick={() => setEditor(null)} disabled={saving}>Cancel</button><button className="zbaa-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle className="zba-spin" /> : <Save />}{saving ? "Saving…" : "Save draft"}</button></footer></form></aside></div> : null}
    </div>
  );
}

function Breakdown({ label, value }: { label: string; value: number }) { return <div className="zbaa-breakdown-row"><span>{label}</span><strong>{value.toLocaleString("en-IN")}</strong></div>; }
function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) { if (totalPages <= 1) return null; return <div className="zbaa-pager"><button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft /> Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next <ChevronRight /></button></div>; }
