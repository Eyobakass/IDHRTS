# IDHRTS Deep Software Engineering Audit Report

**Project:** Integrated Digital House Rental and Tax Management System (IDHRTS)  
**Sprint:** August 25 – September 14, 2026  
**Audit Date:** September 5, 2026  
**Auditor:** Antigravity (Senior SE / Architect / QA / Security / EM perspective)

---

## 1. Executive Summary

- **Current State:** The project has a structurally sound skeleton — all 9 backend Django apps and 5 frontend dashboard pages exist — but the depth of implementation is highly uneven. Core authentication, property, and contract workflows are meaningfully implemented; large swaths of the SRS (notifications, tax payment PDF, PRN workflow, woreda/tax officer dashboards, admin config, reports, dispute lifecycle, compliance tasks) are either skeleton-only or completely absent.
- **Strength #1:** The Schedule B tax calculation engine (`tax/utils.py`) is mathematically correct, well-tested, and compliant with Proclamation 1395/2025 brackets — the most critical single piece of domain logic is solid.
- **Strength #2:** The database schema is comprehensive and largely SRS-accurate, covering all major entities with correct status lifecycles, relationship constraints, and UUID primary keys.
- **Weakness #1:** The `notifications` and `woreda` apps are empty shells — `models.py` is blank, `views.py` is blank. Virtually the entire notification layer (15+ SRS requirements) is missing despite being called from contract/dispute code.
- **Weakness #2:** The `GovernmentAccessMiddleware` is a serious operational problem: it blocks **all** government officer API access from any IP other than `127.0.0.1` and blocks weekends/outside 8:30–17:30. This will prevent all testing and development use of officer-role flows unless actively disabled.
- **Weakness #3:** No QR contract PDF generation is wired to the contract authentication endpoint. The PDF utility exists but is never called from `ContractViewSet.authenticate()`.
- **Weakness #4:** The dispute resolution workflow skips directly from filing to CLOSED (missing UNDER_REVIEW → DECISION_ISSUED → APPEALED state machine).
- **Weakness #5:** The frontend has hardcoded `http://127.0.0.1:8000` URLs scattered through component code, and the admin dashboard is purely officer management — it has no property search, config panel, audit log viewer, or systemwide dashboard required by SRS ADMIN module.
- **Realistic Maturity:** Advanced Prototype / Pre-MVP. The system can be demonstrated to show a login flow, property listing, and Woreda officer approval UI, but the end-to-end lifecycle is broken at multiple points.
- **Most Important Next Action:** Wire tax assessment creation into `ContractViewSet.authenticate()`, fix the GovernmentAccessMiddleware IP lockout for development, and implement the Notification model + in-app notification center.

---

## 2. Project Maturity Scorecard

| Area                 | Rating | Short Justification |
|----------------------|-------:|---------------------|
| Architecture         |    6/10| Good modular app structure; Celery included; critical middleware creates dev blockers; no API docs |
| Backend              |    5/10| Most modules have working CRUD; major gaps in notifications, admin, reports, dispute lifecycle |
| Frontend             |    4/10| 5 dashboard pages exist; hardcoded localhost URLs; no tax payment UI, no property register form completion, no Amharic content, no dispute type selector |
| Database             |    7/10| Schema is largely SRS-accurate; SystemConfig table missing; Notification model missing; Document file storage is string path, not FileField |
| Security             |    4/10| Good: bcrypt PIN, JWT RS256, HMAC webhook verification; Bad: CORS allows all origins, no rate limiting, no OTP brute-force lockout, no account lockout on failed PIN, ClamAV absent, hardcoded HMAC key |
| Testing              |    5/10| Auth, tax calculation, disputes, and contracts have solid unit tests; notifications, payments integration, admin, reports, and woreda tasks are untested |
| Code Quality         |    5/10| Consistent DRF patterns; some dead code; `any[]` TypeScript types pervasive; duplicate StatCard in landlord dashboard; `print()` debugging in production path |
| Maintainability      |    4/10| Tax brackets hardcoded in source (violates SRS NFR-MAINT-003); no OpenAPI docs; no `.env.example`; requirements.txt comment-gates test packages |
| API Design           |    5/10| DRF ViewSets used correctly; no versioning; inconsistent error response shapes; no pagination on several critical list endpoints |
| Production Readiness |    2/10| SQLite in dev; CORS all-origins; DEBUG defaults True; hardcoded secret keys; no HTTPS enforcement; GovernmentAccessMiddleware blocks everyone locally |
| **Overall**          |  **5/10**| **Solid foundation with critical gaps preventing any real-user workflow completion** |

---

## 3. SRS vs Implementation Matrix

| Feature/Requirement | SRS Priority | Code Status | Evidence | Gap |
|---|---|---|---|---|
| FR-AUTH-001: User registration with OTP | Must Have | Partial | `users/views.py RegisterView` exists but no OTP verification step — account activates immediately | OTP verification skipped entirely |
| FR-AUTH-002: Admin-creates officer account | Must Have | Backend only | `RegisterView` accepts any role including WOREDA_OFFICER | No admin-UI panel; no welcome SMS |
| FR-AUTH-003: Phone+PIN login, JWT issuance | Must Have | Implemented | `LoginView` — bcrypt check, JWT with role/sub_city_id/woreda_id claims | Missing: 5-fail lockout, rate limiting |
| FR-AUTH-004: Fayda OIDC | Should Have | Missing | No OIDC flow, no fayda_id encryption endpoint | Entirely absent |
| FR-AUTH-005: JWT RS256 + token blacklist | Must Have | Implemented | `settings.py` RS256 + simplejwt blacklist configured; logout endpoint absent | No logout/revoke endpoint exposed |
| FR-AUTH-006: RBAC enforcement | Must Have | Partial | Per-view role checks exist; no permission matrix class; ADMIN role gets no route in login redirect | Inconsistent; no centralized permission class |
| FR-AUTH-007: PIN reset via OTP | Must Have | Missing | No endpoint exists | Entirely absent |
| FR-AUTH-008: Account deactivation | Must Have | Implemented | `DeactivateOfficerView` — token blacklist + AuditLog | Only works for officers; no ADMIN redirect on login |
| FR-AUTH-009: Multi-device sessions | Should Have | Missing | No session tracking model | Entirely absent |
| FR-PROP-001: Property registration form (3-step) | Must Have | Partial | Backend `PropertyViewSet` CRUD exists; frontend `register-property` route exists | Form not confirmed complete; no auto-save to localStorage |
| FR-PROP-002: Title deed upload + ClamAV | Must Have | Partial | `Document` model exists with `file_path`; no FileField; no upload endpoint found; no ClamAV | File upload backend absent |
| FR-PROP-003: Property status lifecycle | Must Have | Implemented | Status choices, submit/approve/reject actions in `PropertyViewSet` | No AuditLog on transitions |
| FR-PROP-004: Landlord property dashboard | Must Have | Implemented | `landlord/page.tsx` loads from `/api/properties/` with status filtering | Minor: duplicate StatCard "Total Properties" rendered twice |
| FR-PROP-005: Woreda officer verification queue | Must Have | Implemented | Woreda dashboard loads properties filtered by woreda | No pagination; MOCK compliance chart data hardcoded |
| FR-PROP-006: Property approval/rejection | Must Have | Implemented | `approve`/`reject` actions; 20-char reason validation; no landlord SMS | Missing SMS on decision |
| FR-PROP-007: Edit locked by status | Must Have | Partial | Backend enforces DRAFT/REJECTED for submit; no frontend edit-lock UI | UI does not enforce this |
| FR-PROP-008: Multiple properties per landlord | Must Have | Implemented | No cap on Property FK to User | — |
| FR-PROP-009: Admin/officer property search | Should Have | Missing | No search/filter endpoint | Absent |
| FR-CONT-001: Contract drafting | Must Have | Implemented | `ContractViewSet.perform_create` with lease duration + advance cap | No ACTIVE-property-only check |
| FR-CONT-002: Advance cap enforcement (2×) | Must Have | Implemented | `if advance > (rent * 2)` in `perform_create` | Validated at API level ✓ |
| FR-CONT-003: Rent hike cap on renewal | Must Have | Missing | No renewal endpoint; no SystemConfig table | Absent |
| FR-CONT-004: SMS to tenant on contract submit | Must Have | Partial | `send_sms` called in `request_otp` path but NOT in `submit_to_tenant` | SMS not sent on actual submission |
| FR-CONT-005: Tenant contract review via link | Must Have | Implemented | `PublicContractView.review` — token-based, no login required | No Amharic/English side-by-side |
| FR-CONT-006: Tenant digital signing via OTP | Must Have | Implemented | Full OTP flow in `PublicContractView.sign` | OTP not rate-limited; no brute-force protection |
| FR-CONT-007: 30-day registration countdown + Day 25/30 alerts | Must Have | Partial | `contracts/tasks.py check_registration_deadlines` exists | Task not registered in Celery beat; Day 30 overdue flag but no officer in-app notification |
| FR-CONT-008: Woreda contract auth queue | Must Have | Partial | Woreda dashboard shows contracts by woreda | No PENDING_AUTHENTICATION filter in UI |
| FR-CONT-009: Contract review with compliance flags | Must Have | Partial | Woreda dashboard shows contracts | No auto compliance flag banners in UI |
| FR-CONT-010: Contract authentication + Registration Number | Must Have | Partial | `ContractViewSet.authenticate` generates REG-YEAR-ID number | Registration number format wrong (SRS: [SubCityCode]-[WoredaCode]-[YYYY]-[XXXXXX]); no TaxAssessment created; no QR PDF generated |
| FR-CONT-011: Contract rejection by officer | Must Have | Missing | No reject action on contracts (only properties have reject) | Absent from ContractViewSet |
| FR-CONT-012: QR-coded contract PDF | Must Have | Partial | `core/pdf_utils.py generate_contract_pdf` + `generate_secure_qr` exists | Never called from authenticate endpoint; no download endpoint wired in URLs |
| FR-CONT-013: Audit log for contracts | Must Have | Partial | AuditLog model exists; not written on contract state changes | AuditLog never created by contract code |
| FR-CONT-014: Contract renewal | Should Have | Missing | `parent_contract` FK exists in model | No renewal endpoint |
| FR-CONT-015: Contract termination | Should Have | Missing | TERMINATED status exists in model | No termination endpoint |
| FR-CONT-016: Tenant contract view | Must Have | Partial | Tenant dashboard shows contracts | "View Full Contract" button has no action; dispute filing doesn't link to contract |
| FR-TAX-001: Auto Schedule B on authentication | Must Have | Partial | `calculate_schedule_b_tax` utility correct; `tax/tasks.py create_annual_assessments` exists | Not triggered on contract.authenticate(); must be manually called |
| FR-TAX-002: Tax assessment display to landlord | Must Have | Partial | Tax dashboard shows assessments list | No step-by-step breakdown UI; `breakdown` endpoint exists but not called |
| FR-TAX-003: Tax assessment PDF | Must Have | Missing | `assessment_pdf_path` field in model | No PDF generation endpoint for assessment |
| FR-TAX-004: Annual tax cycle Celery task | Must Have | Partial | `create_annual_assessments` task exists | Not registered in Celery beat schedule |
| FR-TAX-005: Late payment interest | Must Have | Missing | No interest calculation logic | Absent |
| FR-TAX-006: Vacant property imputed income | Should Have | Missing | No vacancy detection task | Absent |
| FR-TAX-007: Tax history per property | Must Have | Missing | Model supports it; no history endpoint or UI | Absent |
| FR-TAX-008: Tax clearance certificate | Must Have | Missing | `clearance_pdf_path` in TaxPayment; no generation logic | Absent |
| FR-PAY-001: Chapa payment integration | Must Have | Partial | `initialize_chapa` endpoint calls Chapa API | Hardcoded `https://webhook.site/placeholder` callback; uses CHAPA_WEBHOOK_SECRET as Authorization Bearer (wrong — should be CHAPA_SECRET_KEY) |
| FR-PAY-002: PRN generation | Must Have | Missing | `prn_code` field in TaxPayment | No PRN generation endpoint |
| FR-PAY-003: Payment status tracking | Must Have | Partial | Status machine in model | No FAILED handling; no retry logic |
| FR-PAY-004: Payment receipt PDF | Must Have | Missing | `receipt_pdf_path` in model | No generation logic |
| FR-PAY-005: Failed payment handling | Must Have | Missing | No failure SMS; no retry logic | Absent |
| FR-PAY-006: Chapa webhook HMAC verification | Must Have | Implemented | `ChapaWebhookView.webhook` with HMAC-SHA256 compare | ✓ Correctly implemented |
| FR-PAY-007: PRN reconciliation by Tax Officer | Must Have | Missing | No PRN panel endpoint | Absent |
| FR-PAY-008: SIGTAS CSV export | Must Have | Implemented | `reports/views.py SIGTASExportView` — 13 correct columns | No date-range filter; no woreda-level scope (only sub_city) |
| FR-WOREDA-001 through FR-WOREDA-012 | Must Have | Partial/Skeleton | Woreda dashboard page exists with property/contract/dispute sections | `woreda/views.py` empty; summons, walk-in mode, compliance dashboard all missing; mock compliance chart data |
| FR-TAXOFF-001 through FR-TAXOFF-011 | Must Have | Partial | Tax dashboard shows assessments + SIGTAS export + Chapa init | PRN panel absent; clearance absent; monthly revenue report absent; multi-property overview absent |
| FR-DISP-001: Dispute filing | Must Have | Partial | `DisputeViewSet.perform_create` with 100-char validation | Frontend form sends title+description but not dispute_type/incident_date/woreda required by backend |
| FR-DISP-002: Dispute assignment to officer | Must Have | Partial | `assigned_officer` field; `woreda` assigned from contract | No SMS to officer; no auto-assignment logic for non-contract disputes |
| FR-DISP-003: Dispute status tracking | Must Have | Broken | `resolve` action jumps directly to CLOSED | Skips UNDER_REVIEW and DECISION_ISSUED states; no state machine enforcement |
| FR-DISP-004: Summons generation | Must Have | Missing | No summons model or generation | Absent |
| FR-DISP-005: Administrative ruling | Must Have | Broken | `resolve` endpoint sets ruling but goes to CLOSED | Should go to DECISION_ISSUED, not CLOSED |
| FR-DISP-006: Appeal workflow | Must Have | Missing | APPEALED status exists in model | No appeal endpoint |
| FR-DISP-007: Dispute history timeline | Must Have | Missing | No timeline endpoint | Absent |
| FR-DISP-008: Dispute notifications | Must Have | Missing | `notifications/utils.py send_sms` exists; no dispute SMS calls | Absent |
| FR-NOTIF-001 through FR-NOTIF-012 | Mix | Mostly Missing | `send_sms` utility exists; `notifications/models.py` is empty | No Notification model; no in-app notification center; no bell icon; no notification endpoints |
| FR-ADMIN-001: User management | Must Have | Partial | Officers list + deactivate; no create/edit from admin panel | Admin UI only shows officer list; can't create users |
| FR-ADMIN-002: Sub-City/Woreda config | Must Have | Backend only | SubCity/Woreda models exist | No admin config panel UI; no seeded data management |
| FR-ADMIN-003: Rent hike ceiling config | Must Have | Missing | No SystemConfig model | Hardcoded 11.5% nowhere in code either |
| FR-ADMIN-004: Tax bracket config | Must Have | Missing | No SystemConfig model; brackets hardcoded in `tax/utils.py` | Violates NFR-MAINT-003 |
| FR-ADMIN-005: Audit log viewer | Must Have | Missing | AuditLog model exists | No viewer endpoint or UI |
| FR-ADMIN-006: System-wide dashboard | Must Have | Missing | Admin dashboard only shows officer management | Absent |
| FR-ADMIN-007: Full DB CSV export | Should Have | Missing | — | Absent |
| FR-ADMIN-008: AfroMessage balance monitor | Should Have | Missing | — | Absent |
| FR-REP-001 through FR-REP-006 | Mix | Mostly Missing | SIGTAS CSV export is the only report | Landlord PDF, Woreda monthly, Sub-City revenue, compliance dashboard all absent |
| NFR-PERF-001: Page load <3s | Must Have | Not verifiable | No performance testing | — |
| NFR-SEC-004: bcrypt cost 12 | Must Have | Implemented | `bcrypt.gensalt(12)` ✓ | — |
| NFR-SEC-006: 5-fail lockout for 15 min | Must Have | Missing | LoginView has no counter | Absent |
| NFR-SEC-007: ClamAV scanning | Must Have | Missing | `is_clean` field in Document model | No scanning implementation |
| NFR-SEC-010: AES-256 for sensitive fields | Must Have | Missing | `fayda_id = BinaryField` but no encryption logic | TIN stored plaintext |
| NFR-MAINT-001: OpenAPI docs at /api/docs/ | Must Have | Missing | drf-spectacular not in requirements.txt | Absent |
| NFR-MAINT-003: Tax brackets in SystemConfig | Must Have | Missing | Brackets hardcoded in `tax/utils.py` | Violates requirement |
| NFR-USE-001: Amharic/English UI | Must Have | Partial | i18n library configured; `i18n.ts` exists; login page has language toggle | Only login page uses i18n; dashboards have no Amharic content |
| NFR-USE-005: Auto-save to localStorage | Must Have | Missing | SRS requires 60-sec auto-save on forms | Absent |
| NFR-REL-004: PWA Service Worker | Must Have | Missing | No service worker or PWA manifest | Absent |

---

## 4. Mature / Strong Areas

### Tax Calculation Engine
**File:** [`tax/utils.py`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/tax/utils.py)  
The Schedule B calculation is mathematically precise using `Decimal` with `ROUND_HALF_UP`, correctly applies the 20% standard deduction, and implements progressive brackets per Proclamation 1395/2025. The Ethiopian fiscal year calculation correctly handles the September 11 new year boundary.  
**Test coverage:** Excellent — `test_pytest.py` has 20+ parameterized boundary tests.  
**Remaining weakness:** Tax brackets are hardcoded in source; should be read from `SystemConfig` per NFR-MAINT-003.

### Authentication Core (Login + PIN Hashing)
**File:** [`users/views.py LoginView`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/users/views.py)  
bcrypt with cost factor 12, RS256 JWT with role/sub_city_id/woreda_id claims, token blacklist via simplejwt, AuditLog on failed attempts.  
**Remaining weaknesses:** No 5-fail lockout, no rate limiting, no logout endpoint.

### Database Schema
All 9 app models are present, well-structured with UUIDs, correct FK relationships, status lifecycle fields, and proper `unique_together` constraints. The schema is ~90% SRS-compliant.

### Chapa Webhook HMAC Verification
**File:** [`payments/views.py ChapaWebhookView`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/payments/views.py)  
Correct HMAC-SHA256 implementation using `hmac.compare_digest` (timing-safe).

### Contract Tenant Signing Flow
**File:** [`contracts/views.py PublicContractView`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/contracts/views.py)  
Token-based public access, OTP generation, 5-minute OTP expiry via `is_valid()`, status transition to SIGNED, signing timestamp recorded.

### QR Code Infrastructure
**File:** [`core/pdf_utils.py`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/core/pdf_utils.py)  
HMAC-SHA256 signed QR payload generation is implemented and correct. ReportLab PDF generation works. Just needs to be wired to the authenticate endpoint.

### Docker Compose
Complete 5-service setup: PostgreSQL 15, Redis 7, Django backend with Gunicorn, Celery worker, Next.js frontend. Health checks and restart policies are configured.

---

## 5. Immature Areas

### Notifications Module
**Evidence:** [`notifications/models.py`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/notifications/models.py) — empty (4 lines). `notifications/views.py` — empty.  
`send_sms()` is a standalone function with no retry logic, no logging to a Notification record, and no API key configured in `settings.py`. The SRS requires 12 notification types (NOTIF-001 through NOTIF-012). Zero are fully implemented.  
**Required to mature:** Create Notification model, implement retry logic (3 attempts), add `AFROMESSAGE_API_KEY` to settings/env, wire all send-points.

### Woreda Module
**Evidence:** [`woreda/models.py`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/woreda/models.py) and `woreda/views.py` — both empty. The woreda app is not even registered in `core/urls.py`.  
The woreda dashboard UI (`woreda/page.tsx`) calls `/api/properties/`, `/api/contracts/`, and `/api/disputes/` — it has no dedicated woreda API layer. Walk-in mode, summons generation, and the compliance dashboard are entirely absent.

### Admin Module
**Evidence:** Admin dashboard (`admin/page.tsx`) only contains officer list and deactivate/report actions. No SystemConfig table exists anywhere, meaning the rent hike ceiling and tax bracket configuration required by FR-ADMIN-003/004 cannot function at all.

### Dispute Lifecycle
**Evidence:** [`disputes/views.py resolve()`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/disputes/views.py#L63) sets `dispute.status = 'CLOSED'` directly, bypassing the required UNDER_REVIEW → DECISION_ISSUED → APPEALED → CLOSED state machine. Ruling validation minimum is 20 characters but SRS requires 50. No appeal endpoint exists.

### Government Access Middleware
**Evidence:** [`users/middleware.py`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/users/middleware.py)  
Blocks all WOREDA_OFFICER, TAX_OFFICER, and ADMIN API access unless:
- Accessing from an IP in `ALLOWED_GOVERNMENT_IPS` (defaults to `['127.0.0.1']` only)
- Accessing on a weekday (Mon–Fri) — rejects Saturdays (Ethiopian business day)
- Accessing between 08:30–17:30 EAT

This is **fundamentally broken for any realistic deployment** because Woreda offices work Saturdays, Docker networking uses non-loopback IPs, and the IP whitelist is unconfigured. The SRS says Mon–Sat 08:00–18:00.

### Frontend State Management
The entire app uses `localStorage.get('access_token')` directly in page components with no token refresh logic. There is no token expiry handling — expired JWTs will silently cause all API calls to fail with 401 with only a redirect to login.

---

## 6. Missing Features

### Critical Missing Features

**FR-AUTH-007: PIN Reset** — No forgot-PIN workflow exists. Users who forget PINs cannot recover access.

**FR-CONT-011: Contract Rejection by Officer** — The most common officer action after reviewing a contract. `ContractViewSet` has no reject action; only properties can be rejected.

**FR-TAX-001 (trigger):** Tax assessment is NOT automatically created when a contract is authenticated. The `authenticate` action in ContractViewSet never calls `calculate_schedule_b_tax`. Assessments can only be created via the annual Celery task.

**FR-NOTIF (entire module):** The Notification model is empty. No in-app notification center exists. The bell icon referenced in the SRS is absent from NavBar. All 12 notification requirements are unmet.

**SystemConfig Table:** The SRS requires tax brackets and rent hike ceiling to be database-configurable (FR-ADMIN-003/004, NFR-MAINT-003/004). Neither the model nor any migration for SystemConfig exists.

### High Priority Missing Features

**FR-PAY-002: PRN Generation** — Offline bank payment is a primary payment channel for ETB-based tax. No PRN generation endpoint, no PRN formatting, no PRN-to-assessment linkage beyond the model field.

**FR-AUTH-001 (OTP step):** Registration skips OTP verification. Anyone can register with any phone number without proving ownership.

**FR-TAX-008: Tax Clearance Certificate** — The primary output users need after paying tax. Model has `clearance_pdf_path` but no generation logic.

**File Upload API:** The `Document` model uses `file_path` (CharFields) not Django `FileField`. No upload endpoint exists in `properties/urls.py`. Title deed upload, which is Required for Woreda review, cannot function.

### Medium Priority Missing Features

**FR-CONT-003: Annual Rent Hike Cap** — Enforcement on renewal requires both a SystemConfig lookup and a renewal endpoint; neither exists. The `parent_contract` FK is in the model but no renewal flow.

**FR-DISP-004 through FR-DISP-007:** Summons, ruling entry, appeal filing, and dispute history timeline — all absent.

**FR-WOREDA-009 through FR-WOREDA-012:** Woreda grievance intake, compliance dashboard, walk-in mode, summons — all absent.

**FR-TAXOFF-003, 007–009:** Overdue flagging task, multi-property overview, monthly revenue report — absent.

### Low Priority Missing Features

**FR-AUTH-004: Fayda OIDC** — Should Have; no implementation.  
**FR-AUTH-009: Multi-device sessions** — Should Have; no session model.  
**FR-REP-001 through FR-REP-006:** Reports module is essentially just the SIGTAS export.  
**PWA manifest and Service Worker** — NFR-REL-004; absent.

---

## 7. Partially Implemented / Disconnected Features

### Feature: QR Contract PDF Generation
**Existing:** `core/pdf_utils.py` has `generate_contract_pdf()` and `generate_secure_qr()`.  
**Missing:** `ContractViewSet.authenticate()` never calls `generate_contract_pdf()`. No `pdf` action endpoint registered. The landlord dashboard calls `/api/contracts/{id}/pdf/` which returns 404.  
**Gap:** Wire `generate_contract_pdf(contract)` into authenticate(), save result to `contract.pdf_path`, add a `pdf` action returning `FileResponse`.

### Feature: Tax Assessment Creation on Authentication  
**Existing:** `calculate_schedule_b_tax()` utility + `TaxAssessment` model + `create_annual_assessments` Celery task.  
**Missing:** `ContractViewSet.authenticate()` never creates a TaxAssessment. The annual task does not cover newly registered contracts; only pre-existing REGISTERED ones.  
**Gap:** After `contract.save()` in authenticate(), call `calculate_schedule_b_tax()` and `TaxAssessment.objects.create()`.

### Feature: Celery Beat Task Registration
**Existing:** `check_registration_deadlines` and `create_annual_assessments` tasks are defined as `@shared_task`.  
**Missing:** `core/celery.py` has no `beat_schedule` configuration. Tasks are never automatically triggered.  
**Gap:** Add `app.conf.beat_schedule = {...}` to `core/celery.py` and add `celery-beat` service to docker-compose.

### Feature: Dispute Filing Frontend
**Existing:** `DisputesDashboard` page with modal; `DisputeViewSet` backend.  
**Missing:** Modal form sends only `{title, description}`. Backend requires `dispute_type`, `incident_date`, `woreda`. The dispute_type dropdown required by SRS is absent. Submission will fail with a 400 error because of missing required backend fields.  
**Gap:** Add dispute_type dropdown (6 choices from SRS), incident_date picker, and optionally link to contract.

### Feature: SIGTAS CSV Export Scoping
**Existing:** `SIGTASExportView` generates 13-column CSV correctly.  
**Missing:** No date-range filter parameters. Filters by `landlord__sub_city` but Tax Officers should filter by the property's sub_city, not the landlord's sub_city (landlords may be from a different district).  
**Gap:** Add date_from/date_to query parameters; fix sub_city filter to `assessment__property__sub_city`.

### Feature: Property Registration Multi-Step Form
**Existing:** `register-property` route exists; backend `PropertyViewSet` CRUD works.  
**Missing:** No confirmation the frontend form includes all 12 required fields (Cadastral UPI, Floor Area, Construction Year, Building Type selector, etc.). No document upload UI. No 60-second localStorage auto-save.

### Feature: Woreda Officer Contract Authentication Queue
**Existing:** Woreda dashboard loads all contracts for the woreda.  
**Missing:** Only shows all statuses — does not filter to `PENDING_AUTHENTICATION`. No "Authenticate" action button in the contracts section. Contract rejection action is absent.

---

## 8. Features That Can Be Completed Without External Dependencies

| Feature | Existing Foundation | Remaining Work | Complexity | Can Complete Locally? |
|---|---|---|---|---|
| **Wire tax assessment creation to contract auth** | `calculate_schedule_b_tax()` + `TaxAssessment` model + `ContractViewSet.authenticate()` | 10 lines in `authenticate()` method | Small | ✅ Yes |
| **Wire QR PDF to contract auth endpoint** | `generate_contract_pdf()` + `authenticate()` method | Add call + save path + `pdf` action endpoint | Small | ✅ Yes |
| **Celery beat schedule registration** | Tasks defined; docker-compose has celery worker | Add `beat_schedule` in `core/celery.py`; add celery-beat service in docker-compose | Small | ✅ Yes |
| **Contract rejection by officer** | `PropertyViewSet.reject()` as template; `ContractViewSet` | Add `reject` action to `ContractViewSet`, 20-char reason validation | Small | ✅ Yes |
| **Fix dispute status machine** | `Dispute` model with all statuses; `resolve` endpoint | Add `acknowledge` → UNDER_REVIEW, update `resolve` → DECISION_ISSUED, add `appeal` endpoint | Small | ✅ Yes |
| **SystemConfig model + tax bracket migration** | Tax brackets in `tax/utils.py` | Add `SystemConfig` model, migration, seed with current brackets; update `calculate_schedule_b_tax()` to read DB | Medium | ✅ Yes |
| **Notification model + in-app center** | `send_sms()` utility; `AuditLog` as structural template | `Notification` model, list/mark-read endpoints, bell icon in NavBar | Medium | ✅ Yes |
| **OTP registration verification** | `OTP` model; `send_sms()` utility; `RegisterView` | Add OTP-send step and verify step to registration flow | Medium | ✅ Yes |
| **PIN reset via OTP** | `OTP` model; `send_sms()`; login flow as template | Add `/auth/forgot-pin/` + `/auth/reset-pin/` endpoints | Medium | ✅ Yes |
| **File upload for documents** | `Document` model | Add `FileField` to Document, upload endpoint, file type/size validation, serve endpoint | Medium | ✅ Yes |
| **PRN generation** | `TaxPayment.prn_code` field; format defined in SRS | Add `generate_prn` action in `TaxPaymentViewSet` | Medium | ✅ Yes |
| **Login account lockout (5 attempts, 15 min)** | `LoginView`; `AuditLog` for failed attempts | Add failed-attempt counter in cache/DB; lock logic | Medium | ✅ Yes |
| **Tax assessment PDF generation** | `TaxAssessment` model; ReportLab dependency installed | Generate PDF similar to contract PDF; store + serve | Medium | ✅ Yes |
| **Payment receipt PDF generation** | `TaxPayment` model; ReportLab installed | Generate receipt PDF after CONFIRMED status | Medium | ✅ Yes |
| **Tax clearance certificate generation** | `TaxPayment.clearance_pdf_path`; HMAC + QR utilities | Generate clearance cert PDF with QR; trigger on CONFIRMED | Medium | ✅ Yes |
| **Fix dispute filing frontend form** | `DisputesDashboard` modal exists | Add dispute_type dropdown, incident_date, woreda fields | Small | ✅ Yes |
| **SIGTAS date range filter** | `SIGTASExportView` baseline | Add `date_from`/`date_to` query params; fix sub_city filter | Small | ✅ Yes |
| **Admin audit log viewer** | `AuditLog` model; admin dashboard exists | Add list endpoint with filters; frontend table UI | Medium | ✅ Yes |
| **Sub-City/Woreda data seeding** | SubCity/Woreda models; management commands dir exists | Write management command to seed 11 sub-cities + woredas | Small | ✅ Yes |
| **Late payment interest calculation** | `TaxAssessment.due_date`; Celery task infrastructure | Add interest calc function; daily Celery task to update | Medium | ✅ Yes |

---

## 9. Critical Bugs / Technical Risks

### BUG-001 — GovernmentAccessMiddleware Blocks All Officer Access
**Severity:** Critical  
**Location:** [`users/middleware.py:49`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/users/middleware.py#L49)  
**Problem:** `ALLOWED_GOVERNMENT_IPS` defaults to `['127.0.0.1']`. In Docker, the backend container gets requests from the frontend container's network IP (e.g., `172.x.x.x`), not loopback. All Woreda Officer, Tax Officer, and Admin API calls will be rejected with HTTP 403 "Untrusted Network" in any multi-container deployment.  
**Impact:** The entire officer workflow is inaccessible in Docker deployment.  
**Fix:** Add `ALLOWED_GOVERNMENT_IPS` to `.env` and docker-compose environment; or disable IP check in development mode.

### BUG-002 — Contract Authentication Never Creates TaxAssessment
**Severity:** Critical  
**Location:** [`contracts/views.py:52-64`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/contracts/views.py#L52)  
**Problem:** `ContractViewSet.authenticate()` sets status to REGISTERED and saves but never creates a TaxAssessment. The entire tax workflow cannot start without this trigger.  
**Impact:** No landlord will ever receive a tax bill after contract registration.  
**Fix:** Add `calculate_schedule_b_tax()` call and `TaxAssessment.objects.create()` inside authenticate().

### BUG-003 — Chapa Payment Uses Webhook Secret as API Bearer Token
**Severity:** High  
**Location:** [`payments/views.py:39`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/payments/views.py#L39)  
**Problem:** `Authorization: Bearer {settings.CHAPA_WEBHOOK_SECRET}` — the webhook signing secret is being used as the API authentication key. Chapa uses a separate `CHAPA_SECRET_KEY` for API calls and `CHAPA_WEBHOOK_SECRET` only for webhook verification.  
**Impact:** All Chapa payment initialization calls will fail with 401.  
**Fix:** Add `CHAPA_SECRET_KEY` to settings and use it for the API Bearer token.

### BUG-004 — Duplicate StatCard in Landlord Dashboard
**Severity:** Medium  
**Location:** [`idhrts_frontend/src/app/dashboard/landlord/page.tsx:54-55`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_frontend/src/app/dashboard/landlord/page.tsx#L54)  
**Problem:** Lines 54 and 55 both render `<StatCard label="Total Properties" value={total} />`. The 4th stat card should show "Rejected" count but `rejected` variable is never rendered.  
**Fix:** Replace duplicate with `<StatCard variant="inline" label="Rejected" value={rejected} />`.

### BUG-005 — Dispute resolve() Skips Required States
**Severity:** High  
**Location:** [`disputes/views.py:63`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/disputes/views.py#L63)  
**Problem:** The resolve action sets `dispute.status = 'CLOSED'` directly. The SRS state machine requires UNDER_REVIEW → DECISION_ISSUED before CLOSED. No APPEALED transition exists.  
**Impact:** The 15-working-day appeal window cannot function; ruling_text is set on CLOSED disputes with no appeal opportunity.  
**Fix:** Implement proper state machine: acknowledge → UNDER_REVIEW, resolve → DECISION_ISSUED, appeal → APPEALED, close → CLOSED.

### BUG-006 — Hardcoded API URL in Frontend
**Severity:** High  
**Location:** [`src/app/dashboard/tenant/page.tsx:136`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_frontend/src/app/dashboard/tenant/page.tsx#L136), [`landlord/page.tsx:114`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_frontend/src/app/dashboard/landlord/page.tsx#L114)  
**Problem:** PDF download uses `http://127.0.0.1:8000` hardcoded, bypassing the centralized `api` client. Will fail in Docker or any deployed environment.  
**Fix:** Use the `api` client or `process.env.NEXT_PUBLIC_API_URL`.

### BUG-007 — CORS Allows All Origins in Production
**Severity:** High  
**Location:** [`core/settings.py:157`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/core/settings.py#L157)  
**Problem:** `CORS_ALLOW_ALL_ORIGINS = True` by default. The docker-compose also sets this to True. This allows any origin to make credentialed API requests.  
**Fix:** Set to False in production; add specific `CORS_ALLOWED_ORIGINS` for the frontend domain.

### BUG-008 — GovernmentAccessMiddleware Rejects Saturdays (Ethiopian Business Day)
**Severity:** High  
**Location:** [`users/middleware.py:36`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/users/middleware.py#L36)  
**Problem:** `if now.weekday() >= 5` blocks Saturday (weekday=5). Woredas work Monday–Saturday per SRS §2.3. The SRS requires 08:00–18:00 access; middleware enforces 08:30–17:30.  
**Fix:** Change to `now.weekday() >= 6` (Sunday only); adjust time bounds to 08:00–18:00.

### BUG-009 — No JWT Logout Endpoint
**Severity:** Medium  
**Location:** [`users/urls.py`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/users/urls.py)  
**Problem:** No logout endpoint exists. simplejwt `TokenBlacklistView` is not registered. Users cannot invalidate tokens. The NavBar likely has a "Logout" button that calls nothing functional.  
**Fix:** Add `path('logout/', TokenBlacklistView.as_view(), name='logout')` to users/urls.py.

### BUG-010 — OTP Not Rate-Limited
**Severity:** Medium  
**Location:** [`contracts/views.py:80-99`](file:///c:/Users/hp/Downloads/Telegram%20Desktop/SPM/idhrts_backend/contracts/views.py#L80); `users/views.py RegisterView`  
**Problem:** `request_otp` for contract signing and registration have no rate limiting. An attacker can spam OTP requests, triggering infinite SMS send attempts (AfroMessage credits drain). The SRS requires max 3 OTP requests/hour (NFR-SEC-015).  
**Fix:** Add DRF throttle class (e.g., `UserRateThrottle` at 3/hour) on OTP endpoints.

---

## 10. Testing Assessment

### What Is Tested (Backend)
- **Authentication:** `users/tests.py` — 9 well-structured tests covering login success/failure, registration, duplicate phone, bcrypt verification, JWT claims.
- **Tax Calculation:** `tax/test_pytest.py` — 20+ parameterized tests for fiscal year boundaries and Schedule B bracket calculations. This is the strongest test suite in the project.
- **Contracts:** `contracts/test_pytest.py` — Advance cap, duration enforcement, signing flow tested.
- **Disputes:** `disputes/tests.py` — 8+ tests for creation, description validation, woreda scoping.
- **Properties:** `properties/test_pytest.py` — Submit/approve/reject lifecycle tested.

### What Is NOT Tested
- **Notifications:** No tests; module is empty.
- **Chapa webhook processing:** No test for webhook handler or HMAC verification failure path.
- **PRN generation:** Not implemented, not tested.
- **Celery tasks:** `check_registration_deadlines`, `create_annual_assessments` — no task execution tests with mock time.
- **PDF generation:** `core/pdf_utils.py` — no tests for PDF output or QR code content.
- **SIGTAS CSV export:** No test verifying column order or data accuracy.
- **GovernmentAccessMiddleware:** No test verifying IP/time/day blocking logic.
- **Admin deactivation cascade:** Token blacklist behavior on deactivation not tested in integration.

### Frontend Tests
The `e2e/` directory, `__tests__` subdirectories, and result files exist, suggesting Playwright and Jest were set up. The many `fix*.py` scripts in the frontend root (8 scripts) indicate significant test-fixing effort. The `full_suite_results.txt` (24KB) shows test runs, but without reading it, coverage level is not verifiable.

### Recommended Test Priorities
1. Integration test for the complete contract auth → TaxAssessment creation flow
2. Celery task execution with `freezegun` to verify Day 25/30 behavior
3. Webhook HMAC rejection test
4. SIGTAS CSV column validation test
5. GovernmentAccessMiddleware unit tests

---

## 11. Security Assessment

### SEC-001: No Account Lockout on Failed PIN
**Severity:** High  
**Evidence:** `LoginView` catches `User.DoesNotExist` and bcrypt failure, logs to AuditLog, but has no counter or lockout mechanism.  
**SRS Requirement:** FR-AUTH-003 requires 5-fail lock for 15 minutes with SMS notification.  
**Risk:** PIN brute-force attack on any 4-digit PIN (only 10,000 combinations).

### SEC-002: OTP Not Rate-Limited
**Severity:** High  
**Evidence:** `request_otp` action has `AllowAny` permission and no throttle class.  
**Risk:** SMS credit exhaustion; ability to spam any phone number with OTPs.

### SEC-003: Tax Brackets Hardcoded (No Auth Required to Access)
**Severity:** Medium  
**Evidence:** Brackets in `tax/utils.py:20-27` — any code-level access reveals the calculation.  
**Risk:** Minor; more a maintainability issue.

### SEC-004: CORS Allows All Origins
**Severity:** High  
**Evidence:** `settings.py:157` `CORS_ALLOW_ALL_ORIGINS = True`.  
**Risk:** Any domain can make authenticated API requests using stored tokens.

### SEC-005: Hardcoded Secrets in Settings
**Severity:** High  
**Evidence:** `settings.py:13` insecure SECRET_KEY default; `settings.py:160` `HMAC_SECRET_KEY = 'super-secret-hmac-key'`; `settings.py:161` `CHAPA_WEBHOOK_SECRET = 'chapa-secret'`.  
**Risk:** If deployed without environment variable override, QR codes can be forged.

### SEC-006: JWT Token Stored in localStorage
**Severity:** Medium  
**Evidence:** `src/lib/api.ts:10` `localStorage.getItem('access_token')`.  
**Risk:** XSS vulnerability can steal tokens. HttpOnly cookies are more secure per the middleware comment itself.

### SEC-007: No ClamAV File Scanning
**Severity:** High  
**Evidence:** No ClamAV dependency in requirements.txt; `Document.is_clean = BooleanField(default=True)` — all uploaded files are auto-marked clean without scanning.  
**Risk:** Malware can be uploaded disguised as title deeds.

### SEC-008: TIN Stored Plaintext
**Severity:** Medium  
**Evidence:** `users/models.py:42` — TIN is a plain CharField.  
**SRS Requirement:** NFR-SEC-010 requires AES-256 encryption for TIN and income data.

### SEC-009: GovernmentAccessMiddleware IP Check Can Be Bypassed
**Severity:** Medium  
**Evidence:** `users/middleware.py:45-46` — Uses `HTTP_X_FORWARDED_FOR` first, which can be spoofed by clients to add fake IPs. The middleware splits on comma and takes the first value without validating it's from a trusted proxy.  
**Risk:** Attacker can add `X-Forwarded-For: 127.0.0.1` header to bypass IP restriction.

### SEC-010: No CSRF Exemption Needed (Currently DRF JWT-Only) — But AllowAny Webhooks
**Severity:** Low  
**Evidence:** The Chapa webhook uses `AllowAny` with `permission_classes`, which correctly bypasses JWT auth. HMAC verification is the correct mechanism here. This is acceptable.

---

## 12. Recommended Development Roadmap

### Phase 1 — Fix Critical Broken Connections (Estimated: 3–5 days)

1. **Wire tax assessment creation in `ContractViewSet.authenticate()`** (BUG-002) — 10 lines
2. **Wire QR PDF generation in `ContractViewSet.authenticate()`** — add `pdf` action — 30 lines
3. **Add logout endpoint** — 2 lines in urls.py + import
4. **Fix Chapa API key bug** (BUG-003) — add `CHAPA_SECRET_KEY` setting
5. **Fix duplicate StatCard** (BUG-004) — 1 line change
6. **Fix dispute status machine** (BUG-005) — add `acknowledge` and `appeal` actions; fix `resolve` to DECISION_ISSUED
7. **Fix GovernmentAccessMiddleware Saturday bug and IP bypass** (BUG-008, SEC-009) — 3 line changes
8. **Add Celery beat schedule** — 10 lines in `core/celery.py`

### Phase 2 — Finish Partially Implemented Features (Estimated: 1–2 weeks)

1. **Notification model + send + retry** — Create model, wire to all existing send points, add 3-retry logic
2. **OTP registration verification** — Add two-step registration flow
3. **Contract rejection by Woreda Officer** — Add reject action to ContractViewSet
4. **Dispute filing frontend form fix** — Add dispute_type, incident_date, woreda
5. **File upload API for documents** — Convert `file_path` to FileField; add upload endpoint
6. **SIGTAS date-range filter fix** — 5 lines
7. **Sub-city/Woreda data seeding** — Management command

### Phase 3 — Implement Missing Core SRS Features (Estimated: 2–3 weeks)

1. **SystemConfig model** — Tax brackets + rent hike ceiling; migrate from hardcoded values
2. **PIN reset via OTP** — Two endpoints
3. **PRN generation** — Format + endpoint + SMS delivery
4. **Account lockout (5-fail, 15min)** — Cache-based counter in LoginView
5. **OTP rate limiting** — DRF throttle on OTP endpoints
6. **Tax clearance certificate PDF** — Generate on payment CONFIRMED
7. **Payment receipt PDF** — Generate on CONFIRMED
8. **Late payment interest calculation** — Daily Celery task
9. **Admin audit log viewer** — List endpoint + frontend table
10. **In-app notification center** — Bell icon in NavBar + notification list endpoint

### Phase 4 — Testing and Hardening (Estimated: 1 week)

1. Add integration tests for complete contract lifecycle
2. Add Celery task tests with `freezegun`
3. Add SIGTAS export validation test
4. Fix CORS configuration (restrict origins in production)
5. Remove hardcoded secret defaults (require env vars)
6. Add ClamAV or equivalent file scanning
7. Add TIN encryption at rest

### Phase 5 — External Integrations (Estimated: 1–2 weeks, external dependency)

1. AfroMessage API key configuration and live testing
2. Chapa sandbox configuration and end-to-end payment test
3. Fayda OIDC mock integration
4. PWA manifest and Service Worker

---

## 13. Final Professional Verdict

### SRS Implementation Percentage

**Estimated: ~30–35% of Must Have requirements fully implemented end-to-end.**

Basis for estimate:
- ~40% of backend endpoints for Must Have features exist
- Most backend features lack at least one of: SMS notification, audit logging, or PDF output
- Frontend workflows are present for ~50% of features but ~25% are actually functional end-to-end
- Several "implemented" features have critical bugs that prevent actual use (Chapa auth, GovernmentAccessMiddleware, contract authentication)
- The Notification module (12 requirements) is 0% implemented
- The Admin config module (4 requirements) is 0% implemented

### Current Stage
**Advanced Prototype** — not yet MVP.

The system can be _demonstrated_ to show login → property list → contract list → woreda dashboard navigation, but no complete SRS-defined workflow can be executed start-to-finish without manual database intervention.

### Is It Ready for Demonstration?
**Partially.** Login flow, landlord property display, and the woreda dashboard load correctly. The tax dashboard and admin officer management work. However, any demonstration of the _end-to-end_ rental lifecycle (register → contract → sign → authenticate → tax bill → pay → clearance) will fail at the authenticate step due to no TaxAssessment creation and no PDF.

### Is It Ready for Real Users?
**No.** Critical security issues (no lockout, no OTP rate limiting, CORS all-origins), missing core workflows (PIN reset, OTP registration verification, payment reconciliation, notifications), and the GovernmentAccessMiddleware deployment blocker make it unsuitable for real users.

### Is It Production-Ready?
**No.** SQLite default in development, hardcoded secrets, CORS open, no HTTPS enforcement, no ClamAV, no PWA service worker, no OpenAPI documentation, and incomplete core workflows.

### Top 5 Actions for the Development Team

1. **Wire `calculate_schedule_b_tax()` + `generate_contract_pdf()` into `ContractViewSet.authenticate()`** — This single change unlocks the entire tax and PDF workflow that is already built but disconnected.

2. **Create the `Notification` model and wire all SMS send-points** — The `send_sms()` utility exists; creating the model and wiring it to property approval, contract submission, contract authentication, and tax assessment creation events would fulfill ~40% of the notification SRS requirements in one sprint.

3. **Fix the GovernmentAccessMiddleware IP whitelist and Saturday bug** — This is a pure blocker for all officer testing. A 3-line fix unblocks the entire Woreda and Tax Officer workflows for development and Docker testing.

4. **Add the `SystemConfig` model and migrate tax brackets out of source code** — This is an explicit SRS maintainability requirement (NFR-MAINT-003) and enables the Admin to configure tax brackets and rent hike ceilings without code changes.

5. **Add OTP registration verification and PIN reset** — These are fundamental auth requirements (FR-AUTH-001, FR-AUTH-007) without which landlords cannot properly onboard and cannot recover from lost PINs.
