# DPA_TEMPLATE.md — Data Processing Agreement (fill-in template)

> ## ⚠️ NOT LEGAL ADVICE — engineering posture only
>
> This is a **skeleton with blanks**, written by engineers so that the technical sections
> (processing scope, sub-processors, security measures, deletion) can be filled in accurately
> from what the code actually does. **It is not a contract, not counsel-reviewed, and not fit to
> sign.** Every `<<PLACEHOLDER>>` must be completed and the whole document reviewed by a
> qualified lawyer in the relevant jurisdiction before it is sent to any counterparty.

**How to use this file**

1. Copy it out of the repo — do not sign the version in `.claude/docs/`.
2. Replace every `<<PLACEHOLDER>>`. Search for `<<` to find them all.
3. Fill the technical sections (§4, §5, §6, §8) from [`../../COMPLIANCE.md`](../../COMPLIANCE.md)
   and [`../../SECURITY.md`](../../SECURITY.md) — **re-verify against the code**, do not copy
   stale text.
4. Read §8 before promising anything about deletion. The honest answer today is that this system
   **cannot erase data**.
5. Send to counsel.

---

## 1. Parties

| Role | Party |
|---|---|
| **Controller** ("Customer") | `<<LEGAL ENTITY NAME>>`, `<<COMPANY / REGISTRATION NUMBER>>`, `<<REGISTERED ADDRESS>>` |
| **Processor** ("Provider") | `<<LEGAL ENTITY NAME>>`, `<<COMPANY / REGISTRATION NUMBER>>`, `<<REGISTERED ADDRESS>>` |
| Effective date | `<<DATE>>` |
| Governing agreement | `<<TITLE AND DATE OF THE MAIN SERVICES AGREEMENT>>` |
| Governing law / venue | `<<JURISDICTION>>` |

**Contacts**

| Purpose | Controller | Processor |
|---|---|---|
| Data protection contact / DPO | `<<NAME, EMAIL>>` | `<<NAME, EMAIL>>` |
| Security incident contact | `<<EMAIL / PHONE, 24/7?>>` | `<<EMAIL — see SECURITY.md; currently a PLACEHOLDER>>` |
| EU representative (if applicable) | `<<NAME / N/A>>` | `<<NAME / N/A>>` |

---

## 2. Roles and instructions

The Controller determines the purposes and means of processing. The Processor processes personal
data **only on the Controller's documented instructions**, including the instructions set out in
this Agreement, unless required otherwise by law — in which case the Processor shall inform the
Controller before processing, unless that law prohibits such notice.

`<<CONFIRM THE ROLE ALLOCATION. Note: in a direct home-use deployment the operator is likely the
CONTROLLER, not a processor. This template assumes an organisational (school) customer.>>`

The Processor shall immediately inform the Controller if, in its opinion, an instruction infringes
applicable data protection law.

---

## 3. Subject matter, duration, nature and purpose

| Item | Value |
|---|---|
| Subject matter | Provision of `<<SERVICE NAME>>`, a Hebrew-language daily practice workbook for primary-school children |
| Duration | For the term of the governing agreement, plus the retention period in §8 |
| Nature of processing | `<<Storage, retrieval, transmission, and synchronisation of learner accounts and learning-progress records>>` |
| Purpose | `<<Delivering the educational service and allowing a learner to resume their work across sessions and devices>>` |
| Prohibited purposes | No profiling, no advertising or ad targeting, no automated decision-making producing legal or similarly significant effects, no sale or sharing of personal data, no use for model training — `<<CONFIRM AND ADJUST>>` |

---

## 4. Categories of data subjects and personal data

**Data subjects:** children aged approximately 6–8 (learners); administrators of the Controller.

**Categories of personal data processed** — verify against `COMPLIANCE.md` → *What we actually
store* before signing:

| Category | Detail |
|---|---|
| Account identifiers | Username (**chosen by the Controller's administrator**, not by the child), internal user id, role, account status |
| Authentication data | bcrypt password hash (cost 12); session token version. **No plaintext password is stored.** |
| Learning activity | Progress across workbook days, exercises, exams, badges, streaks per subject |
| Administrative records | Audit log of admin actions (actor id, action, target id, timestamp) |
| Transient security state | Rate-limit and lockout counters, keyed on `sha256(...)` so no raw username or IP is stored |

**Categories expressly NOT collected:** email address, telephone number, postal address, real
name, date of birth, precise location, biometric data, and any special-category data under GDPR
Art. 9. There is no field or API accepting any of them.

**Special note on children's data.** All learner data is children's data. `<<CONFIRM which regimes
apply: COPPA (US), GDPR Art. 8 / GDPR-K (EU), Israeli Privacy Protection Law incl. Amendment 13.>>`
`<<STATE the lawful basis and, where consent-based, HOW guardian consent is obtained — note that
the product itself contains NO consent-capture mechanism (roadmap UX3); consent must be obtained
by the Controller out of band.>>`

---

## 5. Sub-processors

The Controller `<<grants general written authorisation / requires specific prior authorisation>>`
for the sub-processors below. The Processor shall give at least `<<N>>` days' notice before adding
or replacing a sub-processor, during which the Controller may object on reasonable
data-protection grounds.

| Sub-processor | Service | Processing location | Data |
|---|---|---|---|
| Google Ireland Ltd / Google LLC `<<CONFIRM CONTRACTING ENTITY>>` | Firebase Firestore (database) | **`europe-west1`** (Belgium) | All stored personal data |
| Google `<<AS ABOVE>>` | Firebase App Hosting (runtime, Cloud Run) | **`europe-west4`** (Netherlands) | Request processing, application logs |
| Google `<<AS ABOVE>>` | Secret Manager | `<<PROJECT REGION>>` | Signing secret only — no personal data |
| Google `<<AS ABOVE>>` | Cloud Logging / Error Reporting | `<<PROJECT REGION>>` | Structured logs, captured errors |
| `<<ANY ADDITIONAL — none at time of writing>>` | | | |

**Google is the only sub-processor.** No analytics vendor, advertising network, CDN, or
third-party runtime API is used.

The Processor shall impose on each sub-processor data-protection obligations no less protective
than those in this Agreement, and remains fully liable to the Controller for their performance.

---

## 6. Security measures (Art. 32)

The Processor implements the technical and organisational measures listed in
[`../../SECURITY.md`](../../SECURITY.md), summarised here. **Re-verify before signing; do not
warrant a control the code does not implement.**

| Measure | Implementation |
|---|---|
| Encryption in transit | TLS; HSTS `<<NOTE: currently STAGED at max-age 86400, no preload>>` |
| Encryption at rest | Google Cloud default encryption at rest |
| Password protection | bcrypt cost 12; never stored or logged in plaintext |
| Access control | JWT HS256 sessions, 30-day expiry, immediate revocation via `tokenVersion`; role-based admin gate re-checked per request |
| Brute-force resistance | Account lockout (5 failures / 60s) and an **enforcing** rate limiter; both fail-open by deliberate availability trade-off |
| Database access control | Deny-all Firestore rules; server-side Admin SDK access only, no client SDK |
| Input validation | Central zod schemas; request-body size caps |
| Browser hardening | CSP `<<NOTE: currently REPORT-ONLY, not enforcing>>`, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy |
| Auditability | Append-only admin audit log |
| Resilience | Firestore PITR (7 days) + daily backups (14-day retention); RPO ≤ 1h, RTO ≤ 4h, with a recorded restore drill |
| Personnel | `<<CONFIDENTIALITY UNDERTAKINGS, TRAINING, BACKGROUND CHECKS — DESCRIBE>>` |
| Testing | `<<NOTE HONESTLY: no third-party penetration test or security audit has been performed>>` |

---

## 7. Personal data breach notification

The Processor shall notify the Controller **without undue delay and in any event within
`<<N — commonly 24 or 48>>` hours** of becoming aware of a personal data breach affecting the
Controller's personal data.

The notification shall include, so far as known: the nature of the breach; the categories and
approximate number of data subjects and records affected; the likely consequences; the measures
taken or proposed; and the contact point for further information. Where the information cannot be
provided at once, it may be given in phases without undue further delay.

The Processor shall assist the Controller in meeting its own notification obligations to
supervisory authorities and data subjects, and shall document all breaches.

`<<CONFIRM notification channel and escalation path. NOTE: the security contact in SECURITY.md is
currently a PLACEHOLDER and must be a monitored mailbox before this clause is meaningful.>>`

---

## 8. Deletion and return of data

> **⚠️ READ BEFORE COMPLETING THIS SECTION.** As of `<<DATE>>` this system **cannot erase personal
> data**. Deletion is a *soft* delete: the account record and the learning-progress record are
> **retained in full and are restorable**. Permanent erasure is not implemented and is deferred to
> a future phase. Do not accept a clause obliging deletion or erasure on a timescale the system
> cannot meet. See [`../../COMPLIANCE.md`](../../COMPLIANCE.md) → *Limitations*.

**Available today**

| Operation | Available | Effect |
|---|---|---|
| Deactivate an account | ✅ | Login refused, sync revoked, reversible |
| "Delete" an account | ⚠️ Soft only | `status: "deleted"`, sessions revoked; **record and progress retained** |
| Permanently erase | ❌ **Not implemented** | — |
| Export a learner's data | ✅ | An admin can produce a complete JSON file of a learner's account fields and progress bundle, including for a soft-deleted account. Every export is audited. |

**Additional facts to disclose**

- A soft-deleted account **does not lose access to the offline application**: lesson content is
  static and progress is held in browser storage. Local data is cleared when the device next
  reaches the server. Soft delete is account bookkeeping, not access removal.
- **Retention is not automated.** No scheduled job deletes anything. A selection module and a
  read-only dry-run report exist; nothing acts on them. The selector also measures **account age,
  not last activity**.
- **Backups extend retention.** Data remains recoverable via PITR for 7 days and via scheduled
  backups for 14 days after any deletion, whatever the deletion clause says.

**On termination**, at the Controller's choice, the Processor shall `<<return / delete>>` the
personal data within `<<N>>` days, subject to the limitations above and to any legal retention
obligation. `<<STATE THE ACTUAL COMMITMENT — deactivation plus a documented erasure backlog item
is the honest position today.>>`

---

## 9. Assistance to the Controller

The Processor shall, taking into account the nature of the processing, assist the Controller by
appropriate technical and organisational measures in fulfilling its obligations to:

- respond to data-subject requests (Arts. 15–22) — **noting the per-right limitations in
  `COMPLIANCE.md`, in particular that erasure is unavailable**;
- ensure security of processing (Art. 32);
- carry out data protection impact assessments and prior consultation (Arts. 35–36);
- notify personal data breaches (Arts. 33–34).

Response time for assistance requests: `<<N>> business days`. Charges, if any: `<<STATE>>`.

---

## 10. Audit rights

The Processor shall make available to the Controller all information necessary to demonstrate
compliance with this Agreement, and shall allow for and contribute to audits, including
inspections, conducted by the Controller or an auditor it mandates.

| Term | Value |
|---|---|
| Frequency | `<<e.g. once per 12 months, plus after any breach>>` |
| Notice required | `<<N>> days` |
| Scope | `<<Documentation review / questionnaire / on-site — DEFINE>>` |
| Confidentiality | Auditor bound by confidentiality; findings are confidential |
| Costs | `<<WHO BEARS THEM>>` |
| Third-party reports | The Processor may satisfy audit requests by providing sub-processor certifications (e.g. Google Cloud's SOC 2 / ISO 27001) plus its own documentation. **The Processor itself holds no independent security certification and has not undergone a third-party penetration test.** |

---

## 11. International transfers

All learner data is stored and processed **within the EU** (Firestore `europe-west1`, App Hosting
`europe-west4`). `<<CONFIRM whether any support access occurs from outside the EEA/Israel, and if
so specify the transfer mechanism — SCCs, adequacy decision, or other.>>` `<<Israel currently
benefits from an EU adequacy decision — CONFIRM ITS CURRENT STATUS WITH COUNSEL.>>`

---

## 12. Signatures

| | Controller | Processor |
|---|---|---|
| Name | `<<NAME>>` | `<<NAME>>` |
| Title | `<<TITLE>>` | `<<TITLE>>` |
| Date | `<<DATE>>` | `<<DATE>>` |
| Signature | | |

---

### Annex A — Technical and organisational measures
See §6 and [`../../SECURITY.md`](../../SECURITY.md).

### Annex B — Sub-processors
See §5.

### Annex C — `<<ANY CUSTOMER-SPECIFIC TERMS>>`
