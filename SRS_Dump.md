Software Requirements Specification
Integrated Digital House Rental and Tax Management System
Version: 1.0
Date: August 24, 2026
Status: Final
Group: Group 10
Course: Software Project Management (SPM)
Institution: Addis Ababa University
Team Members: Eyob Kassaye (PM), Mikeale Alemu (Lead Dev), Kaleab Adane (Frontend), Dagmawit Yilma (QA), Rediet Manaye (Docs)
Sprint: August 25 – September 14, 2026
Total Effort: 131 person-hours
Revision History
Version
Date
Author(s)
Description
1.0
August 24, 2026
Dagmawit Yilma, Rediet Manaye
Initial SRS — completed after requirements gathering phase
Table of Contents
1. Introduction
   1.1 Purpose
   1.2 Scope
   1.3 Definitions, Acronyms & Abbreviations
   1.4 References
   1.5 Overview
2. Overall Description
   2.1 Product Perspective
   2.2 Product Functions
   2.3 User Classes and Characteristics
   2.4 Operating Environment
   2.5 Design and Implementation Constraints
   2.6 Assumptions and Dependencies
3. Functional Requirements
   3.1 AUTH — Authentication & Identity Management
   3.2 PROP — Property Registration
   3.3 CONTRACT — Rental Contract Management
   3.4 TAX — Tax Assessment & Calculation
   3.5 PAY — Payment Processing
   3.6 WOREDA — Woreda Officer Dashboard
   3.7 TAXOFF — Tax Officer Dashboard
   3.8 DISP — Dispute Management
   3.9 NOTIF — Notification System
   3.10 ADMIN — System Administration
   3.11 REPORT — Reports & Analytics
4. Non-Functional Requirements
   4.1 Performance
   4.2 Security
   4.3 Usability
   4.4 Reliability
   4.5 Maintainability
   4.6 Compliance
5. External Interface Requirements
6. Use Cases
7. Data Model
8. Appendices
1. Introduction
1.1 Purpose
This document is the complete Software Requirements Specification (SRS) for the Integrated Digital House Rental and Tax Management System (IDHRTS). It defines all functional and non-functional requirements, user roles, use cases, system constraints, data model, and external interface specifications for Group 10's Software Project Management deliverable. This document serves as the authoritative technical reference for developers, testers, Woreda Housing Officers, Tax Officers, and all project stakeholders. A developer SHALL be able to implement the system directly from this document without seeking external clarification, and a QA engineer SHALL be able to derive test cases directly from each requirement's Acceptance Criteria.
1.2 Scope
The Integrated Digital House Rental and Tax Management System (IDHRTS) is a web-based Progressive Web Application (PWA) designed to digitize and enforce the residential rental contract registration and rental income tax collection processes in Addis Ababa, Ethiopia. The system addresses the operational gap between informal rental markets and the legal requirements established by Proclamation No. 1320/2024 (Residential Housing Rent Control and Administration) and Proclamation No. 1395/2025 (Income Tax Amendment — Schedule B).
The system serves five distinct user roles: Landlord (Property Owner), Tenant, Woreda Housing Officer, Tax Officer (Revenue Bureau), and System Administrator. It covers the complete end-to-end rental lifecycle: property registration → contract drafting → tenant digital signing → Woreda officer authentication → QR-coded contract PDF issuance → automatic Schedule B tax assessment → payment via Chapa gateway or PRN → SIGTAS CSV export → tax clearance certificate.
The system does NOT directly connect to SIGTAS, the Cadastre/LIS database, or any government intranet system. Integration with SIGTAS is achieved through a human-in-the-loop workflow and SIGTAS-compatible CSV batch export. Cadastre verification is performed visually by Woreda Officers through the dashboard. The system does NOT replace SIGTAS; it acts as a front-end data collection and management layer that feeds into SIGTAS via officer-mediated import.
1.3 Definitions, Acronyms & Abbreviations
Term
Definition
IDHRTS
Integrated Digital House Rental and Tax Management System (this system)
AAHDAB
Addis Ababa Housing Development and Administration Bureau — city agency overseeing housing policy
AACRB
Addis Ababa City Revenue Bureau — sub-city agency responsible for rental income tax collection
AACGLRIA
Addis Ababa City Government Land and Rural Integrated Administration — manages Cadastre/LIS
SIGTAS
Standard Integrated Government Tax Administration System — Ethiopia's national tax software
LIS
Land Information System — Cadastre database holding land parcel and ownership records
TIN
Tax Identification Number — assigned by ERCA to all taxpayers
UPI
Unique Parcel Identification number — assigned by LIS to each land parcel
Schedule B
Section of Ethiopian Income Tax Proclamation governing rental income taxation
Proclamation 1320/2024
Ethiopian Residential Housing Rent Control and Administration Proclamation (current)
Proclamation 1395/2025
Ethiopian Income Tax Amendment Proclamation — updated Schedule B rental tax brackets
Proclamation 983/2016
Tax Administration Proclamation — governs late payment penalties and interest
Proclamation 1284/2023
Personal Data Protection Proclamation — data privacy requirements
Fayda ID
Ethiopia's national biometric digital identity system (MOSIP-based, OIDC/OAuth2 API)
OTP
One-Time Password — a 6-digit code sent via SMS for authentication or signing
PRN
Payment Reference Number — generated for offline bank or Telebirr USSD payment
Chapa
Ethiopian payment aggregator supporting Telebirr, CBE Birr, Awash Bank, Visa/Mastercard
AfroMessage
Ethiopian SMS gateway API used for OTP delivery and system notifications
PWA
Progressive Web App — web application installable on mobile without an app store
JWT
JSON Web Token — signed token used for stateless API authentication (RS256 algorithm)
RBAC
Role-Based Access Control — permission model based on user role
QR Contract
QR-code-embedded HMAC-signed authenticated contract PDF issued after Woreda registration
SIGTAS CSV
SIGTAS-compatible CSV batch export file used for manual import by tax officers
Woreda
Lowest administrative unit in Ethiopian government (district level), ~300 in Addis Ababa
Category C Taxpayer
Individual landlord with annual rental income under ETB 500,000 — eligible for 20% standard deduction
ETB
Ethiopian Birr — the official currency of Ethiopia
HMAC-SHA256
Hash-based Message Authentication Code using SHA-256 — used to sign QR code payloads
ClamAV
Open-source antivirus engine used for scanning uploaded documents
PRN
Payment Reference Number — unique alphanumeric code for offline tax payment
EAT
East Africa Time (UTC+3) — local time zone for Addis Ababa
1.4 References
Ethiopian Civil Code (1960) — Lease provisions, Articles 2888–2985
Proclamation No. 1320/2024 — Residential Housing Rent Control and Administration
Addis Ababa City Administration Directive No. 7/2016 — Rental Administration Implementation
Addis Ababa City Administration Directive No. 184/2025 — Updated Rental Administration Rules
Addis Ababa City Administration Directive No. 164/2017 — Grievance Hearing Committee Procedures
Income Tax Proclamation No. 979/2016 — Schedule B Rental Income (original)
Income Tax Amendment Proclamation No. 1395/2025 — Updated Schedule B Tax Brackets
Tax Administration Proclamation No. 983/2016 — Interest and Penalty Provisions
Personal Data Protection Proclamation No. 1284/2023 — Privacy Requirements
Group 10 Assignment Description v2.0 (August 19, 2026) — Project Scope and Objectives
Group 10 Project Plan v2.0 (August 19, 2026) — Team Roles, Schedule, and Sprint Plan
Chapa Payment Gateway API Documentation — https://developer.chapa.co
AfroMessage SMS API Documentation — https://afromessage.com/developers
Fayda NIDP OIDC Developer Portal — https://faydapartners.et
Digital Ethiopia 2025 Strategy Document — Ministry of Innovation and Technology
1.5 Overview
This document is organized into eight sections. Section 1 provides background context, definitions, and references. Section 2 describes the overall system from a product perspective including user roles, operating environment, and constraints. Section 3 specifies all functional requirements organized by module with Acceptance Criteria. Section 4 defines non-functional requirements covering performance, security, usability, reliability, maintainability, and legal compliance. Section 5 describes all external interface requirements including user interfaces, hardware, software APIs, and communication protocols. Section 6 provides complete use case specifications for all ten primary workflows. Section 7 describes the data model with all entities and their attributes. Section 8 contains appendices with tax calculation examples, SIGTAS CSV format, Sub-City/Woreda reference data, and format specifications.
2. Overall Description
2.1 Product Perspective
The IDHRTS is a new, standalone web-based system. It does not replace any existing government system but acts as a digital front-end layer that feeds into existing government processes through human-in-the-loop integration and data exports. The system interfaces with the following external services:
Chapa Payment Gateway (chapa.co) — REST API for processing Telebirr, CBE Birr, Awash Bank, and card tax payments
AfroMessage SMS API (afromessage.com) — REST API for OTP delivery and all system SMS notifications
Fayda OIDC Mock Sandbox (github.com/National-ID-Program-Ethiopia) — OpenID Connect for optional national ID linking
SIGTAS (indirect) — Tax Officer downloads SIGTAS-compatible CSV and manually imports it into the SIGTAS terminal
Cadastre/LIS (indirect) — Woreda Officer visually verifies uploaded title deed scans inside the dashboard
System Context Diagram (text representation):
  [Landlord Mobile PWA] ──────────────────┐  [Tenant Mobile PWA]  ─────────────────┐ │  [Woreda Officer Browser] ───────────┐ │ │  [Tax Officer Browser]   ──────────┐ │ │ │  [System Admin Browser]  ─────────┐│ │ │ │                                   ││ │ │ │                           ┌───────▼▼─▼─▼─▼──────────────┐                           │   IDHRTS Django REST API      │                           │   + Next.js (React-based) Progressive Web Application        │                           │   + PostgreSQL Database       │                           └──┬─────────┬─────────┬───────┘                              │         │         │                    [Chapa]  [AfroMessage] [Fayda OIDC Mock]                    Payment   SMS API    Identity Verification                    Gateway                              │                    [SIGTAS CSV Export] → Tax Officer → SIGTAS Terminal                    [Title Deed Scan]  → Woreda Officer → Visual Verify
2.2 Product Functions (High-Level)
Function Group
Brief Description
User Registration & Authentication
Phone OTP + optional Fayda OIDC login for all 5 roles; JWT session management
Property Registration
Landlord registers property with address, building details, and title deed upload
Woreda Property Verification
Woreda Officer reviews and approves/rejects property registration with notes
Contract Drafting
System generates standardized lease contract from property data and landlord inputs
Tenant Digital Signing
Tenant reviews contract in Amharic/English and signs via SMS OTP verification
Woreda Contract Authentication
Officer reviews compliance flags, authenticates contract, generates Registration Number
QR-Coded Contract PDF Generation
System issues tamper-proof HMAC-signed authenticated contract PDF with QR code
Schedule B Tax Calculation
Auto-calculates annual rental income tax using Proclamation 1395/2025 brackets
Tax Payment via Chapa
Landlord pays tax via Telebirr/CBE Birr/bank card through Chapa checkout
PRN Generation & Reconciliation
System generates Payment Reference Number for bank/Telebirr offline payment
Tax Officer Dashboard
Reconciles payments, exports SIGTAS CSV, issues tax clearance certificates
Compliance Monitoring
Flags unregistered properties, overdue tax declarations, and vacant properties
Dispute Management
Tenant/Landlord files grievance; tracked through 3-tier resolution workflow
Notification System
SMS + in-app alerts for all key lifecycle events across all user roles
2.3 User Classes and Characteristics
Role
Technical Level
Primary Access Method
Primary Language
Landlord (Property Owner)
Low–Medium
Mobile PWA or Woreda-assisted walk-in
Amharic (primary), English
Tenant
Low–Medium
Mobile PWA via SMS secure link
Amharic (primary), English
Woreda Housing Officer
Medium
Desktop web browser at Woreda office
Amharic and English
Tax Officer (Revenue Bureau)
Medium–High
Desktop web browser at Sub-City office
English and Amharic
System Administrator
High
Desktop web browser
English
Landlord: Typically an adult Ethiopian property owner aged 30–65. Technology literacy varies widely. Older landlords in inner-city kebeles (Arada, Kirkos) may require Woreda Officer-assisted registration. Primary concern is completing registration to maintain legal standing. Expects a simple, step-by-step form interface in Amharic.
Tenant: Typically a working-age urban professional or student. Moderately smartphone-literate. Accesses the system primarily through an SMS link. Main concern is reviewing and signing the contract quickly on a mobile device without downloading an app.
Woreda Housing Officer: A civil servant assigned to one specific Woreda. Works at a desktop PC during business hours (Mon–Sat, 08:00–18:00 EAT). Handles 20–50 registration requests per month. Requires a fast, queue-based interface with clear compliance flag alerts.
Tax Officer: Works at the Sub-City Revenue Bureau. Responsible for tax collection across all Woredas in their Sub-City jurisdiction. Needs batch operations: PRN confirmation, SIGTAS CSV export, clearance certificate issuance, and delinquent taxpayer tracking.
System Administrator: A technical officer from the development team or IT department. Responsible for user management, system configuration, audit log review, and data exports. Requires full access to all system functions.
2.4 Operating Environment
Platform: The IDHRTS is deployed as a web-based Progressive Web App (PWA) accessible on any modern browser without installation. The frontend is built with React and the backend is Django REST Framework. Supported desktop browsers: Chrome 90+, Firefox 88+, Microsoft Edge 90+, Safari 14+. Mobile support: Android 8+ and iOS 13+ via PWA manifest; the PWA can be installed to the home screen without an app store.
Server environment: Ubuntu 20.04 LTS, Python 3.11, Django 4.2, PostgreSQL 14+, Redis (for token blacklisting and Celery task queue), Nginx as reverse proxy. Deployment target: cloud VM or university server.
Network: 4G LTE connectivity is assumed as baseline for landlords and tenants using mobile PWA. Woreda office desktops have wired or Wi-Fi connectivity. The PWA Service Worker implements offline draft caching via IndexedDB so that form data is preserved through power outages — a common concern at Woreda offices. SMS is the fallback communication channel for all critical notifications when internet is unavailable.
Languages: All landlord and tenant-facing user interfaces must be available in both Amharic (Ge'ez script) and English. Officer and admin interfaces default to English with an Amharic toggle. All error messages to end users are in Amharic.
2.5 Design and Implementation Constraints
Legal: System MUST enforce 30-day contract registration window per Proclamation 1320/2024 Art. 22
Legal: System MUST enforce 2-month advance payment cap per Proclamation 1320/2024 Art. 13
Legal: System MUST enforce minimum 24-month lease duration per Proclamation 1320/2024 Art. 6
Legal: Tax calculation MUST use exact Schedule B brackets from Proclamation 1395/2025
Legal: Personal data handling MUST comply with Data Protection Proclamation 1284/2023
Legal: All monetary audit records MUST be retained for 7 years per Tax Administration Proclamation 983/2016
Integration: No direct API access to SIGTAS, Cadastre/LIS, or any government intranet system (use human-in-loop and CSV export)
Payment: Must use Chapa sandbox API in MVP; production requires NBE-compliant payment operator registration
Identity: Fayda OIDC production access requires formal NIDP Relying Party agreement; MVP uses mock sandbox
Export: System must generate SIGTAS-compatible CSV format matching Schedule B batch upload template
Currency: All monetary values stored and displayed in Ethiopian Birr (ETB) only
Calendar: All dates display both Gregorian and Ethiopian calendar format in user-facing interfaces
Stack: Django REST Framework + PostgreSQL + Next.js (React-based) Progressive Web Application as defined in Project Plan v2.0
Accessibility: PWA must function on 3G connectivity minimum and on 5-inch screen for core workflows
2.6 Assumptions and Dependencies
Chapa sandbox API (api.chapa.co) remains available and functional throughout the development sprint
AfroMessage test SMS API (afromessage.com) is available for development and testing
NIDP mock OIDC sandbox (github.com/National-ID-Program-Ethiopia) is accessible for Fayda integration testing
All landlords and tenants have a valid Ethiopian phone number (Ethio Telecom or Safaricom Ethiopia)
Woreda officers have access to a desktop computer with a modern browser and reliable internet during working hours (Mon–Sat, 08:00–18:00 EAT)
The SIGTAS CSV format follows the standard Schedule B individual landlord batch upload template
The annual rent hike ceiling for 2026/27 is 11.5% (as announced by Addis Ababa City Administration); this will be configurable by the Admin
Tax brackets from Proclamation 1395/2025 remain unchanged during the development sprint
A4 printers are available at Woreda offices for printing contract PDFs and summons letters
The university server environment supports Python 3.11 and PostgreSQL 14+
3. Functional Requirements
Each functional requirement is specified with: Requirement ID, Name, Priority (Must Have / Should Have / Nice to Have), a description using the word SHALL, and three or more Acceptance Criteria that a QA engineer can use to verify the requirement.
3.1 Module AUTH — Authentication & Identity Management
FR-AUTH-001: User Registration (Landlord/Tenant)
Priority: Must Have
Description: The system SHALL allow Landlords and Tenants to self-register by providing their full name in Amharic (mandatory), full name in English (mandatory), Ethiopian phone number (format +251XXXXXXXXX, mandatory), and a 4-digit PIN. Upon submission, the system SHALL send a 6-digit OTP to the provided phone number via AfroMessage API. The account SHALL only be activated after successful OTP verification.
Acceptance Criteria:
A user with a valid Ethiopian phone number (+251 prefix) can complete registration within 3 steps without assistance.
OTP is delivered via SMS within 60 seconds of registration submission under normal network conditions.
Attempting to register with a phone number already in the system returns a clear error: 'This phone number is already registered.'
FR-AUTH-002: User Registration (Government Officer — Admin-Initiated)
Priority: Must Have
Description: The system SHALL allow System Administrators to create accounts for Woreda Housing Officers and Tax Officers by providing: full name in English and Amharic, Ethiopian phone number, assigned Sub-City, assigned Woreda, and role (WOREDA_OFFICER or TAX_OFFICER). The officer SHALL receive a welcome SMS containing a temporary 4-digit PIN and instructions to change it at first login. The system SHALL enforce a mandatory PIN change on first login.
Acceptance Criteria:
Admin can create a new officer account from the User Management panel within 5 fields.
Officer receives a welcome SMS with temporary PIN within 2 minutes of account creation.
Officer is forced to set a new PIN before accessing any officer functionality on first login.
FR-AUTH-003: Phone Number + SMS OTP Login
Priority: Must Have
Description: The system SHALL authenticate all users via a two-step flow for standard login: (1) user enters registered phone number, (2) user enters their 4-digit PIN. Upon successful PIN validation, the user SHALL receive a signed RS256 JWT access token (24-hour expiry) and a refresh token (7-day expiry). After 5 consecutive failed PIN attempts the account SHALL be locked for 15 minutes. OTP SHALL NOT be required for standard login, but SHALL be used for registration, PIN reset, and sensitive actions like contract signing.
Acceptance Criteria:
Standard login requires only phone number and PIN.
After 5 failed PIN attempts, the account is locked for 15 minutes and the user receives an SMS notification.
Successful login returns a JWT with correct claims: user_id, role, sub_city_id, and iat (issued at timestamp).
FR-AUTH-004: Fayda OIDC Mock Login
Priority: Should Have
Description: The system SHALL support optional identity verification through the Fayda National Digital ID OIDC mock sandbox, allowing Landlords and Tenants to link their Fayda Digital ID to their account via an OAuth2 authorization code flow. The Fayda ID returned by the OIDC provider SHALL be stored encrypted (AES-256) in the user record. Once linked, a 'Fayda Verified' badge SHALL appear on the user's profile.
Acceptance Criteria:
User can initiate Fayda OIDC flow from the Profile Settings page using an 'Link Fayda ID' button.
Successful OIDC callback stores the fayda_id field encrypted in the User record.
A 'Fayda Verified' badge is displayed on the landlord's profile visible to Woreda Officers.
FR-AUTH-005: JWT Token Issuance and Session Management
Priority: Must Have
Description: The system SHALL issue RS256-signed JWT access tokens with a 24-hour expiry and refresh tokens with a 7-day expiry upon successful authentication. The system SHALL maintain a token blacklist in Redis to support immediate revocation upon logout. Access tokens SHALL be rejected with HTTP 401 if expired or blacklisted.
Acceptance Criteria:
Access token payload contains user_id, role, sub_city_id, woreda_id, and issued_at claims.
Expired tokens are rejected with HTTP 401 and a JSON error body indicating token expiry.
Logging out adds the token to the Redis blacklist and the token is rejected on the next request within 30 seconds.
FR-AUTH-006: Role Assignment and RBAC Enforcement
Priority: Must Have
Description: The system SHALL enforce Role-Based Access Control on every API endpoint by validating the caller's role claim from the JWT against a predefined permission matrix. Valid roles are: LANDLORD, TENANT, WOREDA_OFFICER, TAX_OFFICER, ADMIN. Unauthorized access SHALL return HTTP 403 with a localized error message in both Amharic and English.
Acceptance Criteria:
A Tenant JWT cannot access the landlord contract-drafting POST /api/contracts endpoint (returns HTTP 403).
A Woreda Officer JWT cannot access the Tax Officer SIGTAS CSV export endpoint (returns HTTP 403).
An Admin JWT can access all endpoints across all roles.
FR-AUTH-007: PIN Reset via SMS OTP
Priority: Must Have
Description: The system SHALL allow users to reset their 4-digit PIN through the following flow: (1) user enters their registered phone number on the 'Forgot PIN' screen, (2) system sends a 6-digit reset OTP via AfroMessage, (3) user enters the OTP within 5 minutes, (4) user sets and confirms a new 4-digit PIN. The reset OTP SHALL be single-use and expire after 5 minutes. All active sessions SHALL be invalidated immediately after a successful PIN reset.
Acceptance Criteria:
Reset OTP is invalidated immediately after first use and cannot be reused.
New PIN takes effect on the next login attempt immediately after reset.
All previously issued JWT tokens for the user are invalidated within 1 minute of PIN reset.
FR-AUTH-008: Account Deactivation (Admin)
Priority: Must Have
Description: The system SHALL allow System Administrators to deactivate any user account from the User Management panel. Deactivation SHALL immediately invalidate all the user's active JWT tokens via the Redis blacklist. Deactivated users SHALL not be able to log in and SHALL receive a localized error message: 'Your account has been suspended. Please contact the Woreda Housing Office.'
Acceptance Criteria:
A deactivated user's existing JWT is rejected within 30 seconds of deactivation.
Login attempt by a deactivated user returns HTTP 403 with the suspension message.
Account deactivation event is logged in the AuditLog with admin user ID, timestamp, and target user ID.
FR-AUTH-009: Multi-Device Session Handling
Priority: Should Have
Description: The system SHALL support simultaneous sessions from up to 3 devices per user, tracking each session by a device fingerprint (SHA-256 hash of user-agent + IP address). The user SHALL be able to view all active sessions from their Profile Settings page and revoke any individual session. Attempting to log in from a 4th device SHALL prompt the user to revoke an existing session first.
Acceptance Criteria:
User can see a list of up to 3 active sessions with device description and last active timestamp.
Revoking a session from the profile immediately invalidates that session's JWT.
4th device login attempt displays a modal listing existing sessions and requiring revocation of one.
3.2 Module PROP — Property Registration
FR-PROP-001: Landlord Property Registration Form
Priority: Must Have
Description: The system SHALL provide a multi-step property registration form (3 steps: Location, Building Details, Financial Details) with the following fields: Sub-City (dropdown from seeded list of 11 Addis Ababa Sub-Cities), Woreda (filtered by selected Sub-City), Kebele (free text), House Number (free text, mandatory), Cadastral UPI (optional free text), Building Type (APARTMENT / VILLA / CONDOMINIUM / TRADITIONAL / COMMERCIAL_RESIDENTIAL), Number of Rooms (integer, min 1), Floor Area in square meters (decimal, min 5), Construction Year (integer, 1900–2026), Number of Units being rented (integer, min 1), and Monthly Rent per Unit in ETB (decimal, positive). The form SHALL auto-save draft data to browser localStorage every 60 seconds.
Acceptance Criteria:
Attempting to submit the form with any mandatory field empty displays a validation error on that field in Amharic.
Monthly Rent field accepts only positive numeric values and rejects letters, symbols, and zero.
After a browser crash and restart, the form restores all previously entered data from localStorage within 5 seconds.
FR-PROP-002: Title Deed / Proof of Ownership Upload
Priority: Must Have
Description: The system SHALL require a Landlord to upload at least one document as proof of ownership. Accepted document types are: Title Deed (ካርታ), Land Holding Certificate (የይዞታ ማረጋገጫ), and Court-Issued Ownership Order. Supported file formats are PDF, JPG, and PNG only. Maximum file size is 10 MB per file. Uploaded files SHALL be scanned by ClamAV before storage. If malware is detected the file SHALL be rejected and an admin alert logged.
Acceptance Criteria:
Attempting to upload a file larger than 10 MB displays an error: 'File exceeds 10 MB limit.'
Attempting to upload an unsupported format (.exe, .docx, .zip) is rejected with a format error.
Uploaded files are accessible in the Woreda Officer's property review panel and can be viewed full-screen.
FR-PROP-003: Property Status Tracking
Priority: Must Have
Description: The system SHALL track each property through a defined lifecycle: DRAFT (saved but not submitted), PENDING_REVIEW (submitted to Woreda, awaiting officer decision), ACTIVE (approved by Woreda Officer), SUSPENDED (flagged for a compliance issue), ARCHIVED (landlord-initiated or system-initiated end of rental activity). Only ACTIVE properties may be linked to new rental contracts. All status transitions SHALL be validated by the system and logged in the AuditLog.
Acceptance Criteria:
A DRAFT property can be submitted (status changes to PENDING_REVIEW) but cannot skip directly to ACTIVE.
A Landlord attempting to draft a contract for a PENDING_REVIEW or SUSPENDED property receives error: 'Property must be Active.'
Every status change creates an AuditLog entry with: actor user ID, role, previous status, new status, and timestamp.
FR-PROP-004: Landlord Property Dashboard
Priority: Must Have
Description: The system SHALL display a dashboard for authenticated Landlords listing all their registered properties. Each card SHALL display: property address (Woreda + House Number), status badge (colored by state), monthly rent in ETB, number of units, active contract count, and last updated date. The dashboard SHALL support filtering by status and sorting by registration date (newest/oldest).
Acceptance Criteria:
Dashboard loads within 3 seconds for a landlord with up to 50 properties on a 4G connection.
Filtering by status 'ACTIVE' shows only ACTIVE properties and hides all others.
Each property card is clickable and navigates to the full property detail view.
FR-PROP-005: Woreda Officer Property Verification Queue
Priority: Must Have
Description: The system SHALL display a queue for Woreda Housing Officers showing all properties in PENDING_REVIEW status within the officer's assigned Woreda, sorted by submission date with the oldest submission first. Each queue item SHALL display: property address, landlord full name, submission date (Gregorian and Ethiopian calendar), and days pending.
Acceptance Criteria:
Officer sees only PENDING_REVIEW properties in their assigned Woreda — properties from other Woredas are never shown.
Days pending is computed correctly: today's date minus submission date in calendar days.
A new submission appears in the queue within 1 minute of the landlord clicking 'Submit for Review'.
FR-PROP-006: Woreda Officer Property Approval/Rejection with Notes
Priority: Must Have
Description: The system SHALL allow a Woreda Housing Officer to approve a property (status → ACTIVE) or reject it (status → DRAFT, resetting for landlord correction) from the property review detail panel. Approval requires no note. Rejection requires a mandatory written reason of at least 20 characters explaining what needs to be corrected. Upon decision, the Landlord SHALL receive an SMS notification via AfroMessage stating the outcome.
Acceptance Criteria:
Clicking 'Approve' sets property status to ACTIVE and sends landlord an SMS: 'Your property at [address] has been approved.'
Clicking 'Reject' without a written reason (or fewer than 20 characters) is blocked with a validation error.
Landlord receives the rejection SMS including the officer's written reason within 2 minutes of officer action.
FR-PROP-007: Property Edit by Landlord (DRAFT or REJECTED state only)
Priority: Must Have
Description: The system SHALL allow a Landlord to edit a property's details — including all fields from FR-PROP-001 and uploaded documents — only when the property is in DRAFT or REJECTED state. For all other states (PENDING_REVIEW, ACTIVE, SUSPENDED, ARCHIVED), the edit form SHALL be locked and the system SHALL display a localized message explaining the restriction and the current status.
Acceptance Criteria:
Edit form is fully accessible for a property in DRAFT state.
Edit form shows a locked read-only view with a message for ACTIVE properties: 'This property is Active and cannot be edited.'
After editing a REJECTED property and re-submitting, the status changes from DRAFT to PENDING_REVIEW.
FR-PROP-008: Multiple Properties per Landlord
Priority: Must Have
Description: The system SHALL support a single Landlord account owning and managing an unlimited number of registered properties with no system-imposed cap. Each property SHALL have an independent status, document record, contract history, and tax assessment history.
Acceptance Criteria:
A Landlord can register a second property immediately after the first without any restrictions.
Each property has its own independent status — approving one property does not affect others.
Tax assessments are generated per property (not per landlord), and each assessment links to its specific property ID.
FR-PROP-009: Property Search and Filter (Admin/Officer)
Priority: Should Have
Description: The system SHALL provide Admin and Woreda Officer users with a property search interface supporting multi-field filtering: Sub-City (Admin only — Officers see their Woreda only), Status, Landlord Name (partial match), Landlord TIN, House Number (partial match), and submission date range. Results SHALL be paginated at 20 records per page with total count displayed.
Acceptance Criteria:
A search combining Sub-City + Status filters returns only properties matching both criteria.
Results are paginated at 20 per page with navigation controls and total result count.
A Woreda Officer's search is automatically restricted to their assigned Woreda regardless of filter inputs.
3.3 Module CONTRACT — Rental Contract Management
FR-CONT-001: Contract Drafting by Landlord
Priority: Must Have
Description: The system SHALL allow an authenticated Landlord to initiate a rental contract draft for an ACTIVE property by providing: Tenant phone number (+251 format), agreed monthly rent in ETB, advance payment amount in ETB, lease start date (Gregorian calendar), lease duration in months, and payment method (BANK_TRANSFER / TELEBIRR / CBE_BIRR). The system SHALL enforce a minimum lease duration of 24 months per Proclamation 1320/2024 Article 6. Property details (address, building type, rooms) SHALL be auto-populated from the registered property record and SHALL NOT be editable by the Landlord.
Acceptance Criteria:
Attempting to set lease duration below 24 months is rejected with: 'Minimum lease duration is 24 months per Proclamation 1320/2024 Art. 6.'
Property address, building type, and room count are auto-filled from the property record and displayed as read-only.
Contract draft is saved automatically and is resumable from the 'My Contracts' dashboard without data loss.
FR-CONT-002: Advance Payment Cap Enforcement
Priority: Must Have
Description: The system SHALL enforce the advance payment cap defined in Proclamation No. 1320/2024 Article 13 by rejecting any contract submission where the advance payment amount exceeds two times (2×) the agreed monthly rent. The system SHALL calculate and display the maximum allowed advance payment in real time as the landlord types the monthly rent amount. Error messages SHALL cite Proclamation 1320/2024 Article 13 in both Amharic and English.
Acceptance Criteria:
Submitting a contract with advance payment of ETB 15,000 when monthly rent is ETB 5,000 is rejected (3× > 2×).
Submitting a contract with advance payment of exactly ETB 10,000 when monthly rent is ETB 5,000 is accepted (2× = limit).
The 'Maximum Advance' helper text below the advance field updates in real time to show: 'Maximum: ETB [2 × monthly rent]'.
FR-CONT-003: Annual Rent Hike Cap Enforcement
Priority: Must Have
Description: The system SHALL enforce the annual rent increase ceiling configured by the System Administrator during contract renewal. The default ceiling is 11.5% for 2026/27. The system SHALL calculate the maximum allowable new monthly rent as: previous_rent × (1 + ceiling_pct / 100) and SHALL reject renewal submissions where the proposed new rent exceeds this calculated maximum. The rejection message SHALL state the maximum allowable rent in ETB.
Acceptance Criteria:
Renewal with proposed rent 15% above previous rent is rejected when ceiling is 11.5%.
Renewal with proposed rent at exactly 11.5% above previous rent is accepted.
Rejection error shows: 'Maximum allowed new rent is ETB [calculated max]. Please reduce the rent amount.'
FR-CONT-004: Tenant Notification via SMS
Priority: Must Have
Description: The system SHALL automatically send an SMS notification to the Tenant's phone number (as provided by the Landlord in the contract draft) immediately upon contract submission for tenant review. The SMS SHALL be sent via AfroMessage API and SHALL contain in Amharic: the landlord's name, property address, a unique secure review link valid for 7 days, and simple instructions to tap the link to review and sign the contract.
Acceptance Criteria:
SMS is sent to the tenant's number within 2 minutes of the landlord clicking 'Submit for Tenant Review'.
The review link in the SMS is unique per contract and expires after 7 days from sending.
If AfroMessage API returns an error, the system retries delivery 3 times at 30-second intervals and logs the final outcome.
FR-CONT-005: Tenant Contract Review Interface
Priority: Must Have
Description: The system SHALL provide Tenants with a read-only contract review page accessible via the secure SMS link without requiring prior account login. The page SHALL display all contract terms in both Amharic and English in a side-by-side layout including: property full address, landlord full name, monthly rent in ETB, advance payment in ETB, lease start date (both Gregorian and Ethiopian calendar), lease end date (calculated), lease duration, payment method, and all statutory compliance notes citing relevant proclamations.
Acceptance Criteria:
All contract fields are visible in both Amharic and English without any truncation.
The page is accessible via the secure link without login credentials — the link itself authenticates the session.
The review page renders correctly and is fully usable on a 5-inch Android phone screen in portrait mode.
FR-CONT-006: Tenant Digital Signing via OTP
Priority: Must Have
Description: The system SHALL allow a Tenant to digitally sign a reviewed contract by tapping the 'Sign Contract' button. This action SHALL trigger a 6-digit OTP sent to the Tenant's registered phone number via AfroMessage API. The Tenant SHALL enter the OTP within 5 minutes to confirm consent. Successful OTP entry SHALL set the contract status to SIGNED, record the signing timestamp (UTC), and start the 30-day registration countdown.
Acceptance Criteria:
The signing OTP expires after 5 minutes and cannot be used after expiry.
Contract status changes from PENDING_TENANT_SIGNATURE to SIGNED only after correct OTP entry.
Signing timestamp is permanently recorded in the RentalContract record and is visible in the audit log.
FR-CONT-007: 30-Day Registration Countdown and Alerts
Priority: Must Have
Description: The system SHALL enforce the 30-day contract registration window per Proclamation 1320/2024 Article 22. A Celery periodic task SHALL run daily and: (1) on Day 25 after signing_date, send an SMS warning to the Landlord if the contract is still in SIGNED status (not yet submitted for Woreda authentication), stating that 5 days remain and citing Proclamation 1320/2024; (2) on Day 30, send an escalation SMS and set a OVERDUE_REGISTRATION flag on the contract.
Acceptance Criteria:
Day 25 alert SMS is sent to the Landlord on exactly Day 25 after signing_date, not earlier or later.
On Day 30, the contract's overdue flag is set and the Woreda Officer receives an in-app notification.
The registration deadline (signing_date + 30 days) is clearly displayed on the contract detail page.
FR-CONT-008: Woreda Officer Contract Authentication Queue
Priority: Must Have
Description: The system SHALL display a queue for Woreda Housing Officers listing all contracts in PENDING_AUTHENTICATION status for properties within their assigned Woreda, sorted by submission date with the oldest first. Each queue item SHALL display: contract ID, landlord full name, tenant full name, property address, monthly rent in ETB, and number of calendar days since the Landlord submitted for authentication.
Acceptance Criteria:
Queue contains only contracts for properties in the officer's assigned Woreda.
Days since submission is calculated as: today − submission_to_woreda_date, displayed as an integer.
Queue updates within 1 minute when a Landlord submits a new contract for authentication.
FR-CONT-009: Woreda Officer Contract Review
Priority: Must Have
Description: The system SHALL provide a Woreda Housing Officer with a full-page contract review panel displaying: all contract terms (landlord, tenant, property, rent, advance, dates), uploaded title deed and ID scan files (viewable at full screen via click-to-enlarge), landlord profile summary (name, phone, TIN), tenant profile summary, and automatic compliance flag banners for any detected violations including: advance cap breach, lease duration below 24 months, and rent hike cap violation on renewal.
Acceptance Criteria:
All uploaded documents are viewable in a full-screen modal within the panel — officer need not leave the page.
Compliance flags are generated automatically and displayed in a prominent red banner at the top of the panel.
The panel is fully functional on a 1366×768 desktop monitor — all key action buttons are visible without scrolling.
FR-CONT-010: Contract Authentication and Registration
Priority: Must Have
Description: The system SHALL allow a Woreda Housing Officer to authenticate a contract by clicking 'Authenticate & Register' and confirming via a modal dialog. This action SHALL: (1) generate a unique Contract Registration Number in format [SubCityCode]-[WoredaCode]-[YYYY]-[XXXXXX], (2) record the officer's user ID, name, and timestamp, (3) set contract status to REGISTERED, (4) trigger QR-coded contract PDF generation, (5) trigger automatic Schedule B tax assessment creation (FR-TAX-001).
Acceptance Criteria:
Contract Registration Number is unique across the entire system and matches the defined format.
Contract status changes to REGISTERED within 5 seconds of officer confirmation.
A TaxAssessment record is automatically created in the database within 10 seconds of authentication.
FR-CONT-011: Contract Rejection by Officer with Written Reason
Priority: Must Have
Description: The system SHALL allow a Woreda Housing Officer to reject a contract by clicking 'Reject' and entering a mandatory written reason of at least 20 characters explaining the specific problem (e.g., 'Title deed does not match the property address stated in the contract — please upload the correct document.'). Rejection SHALL set contract status to REJECTED, notify both Landlord and Tenant via SMS including the rejection reason, and allow the Landlord to edit the contract and resubmit.
Acceptance Criteria:
Clicking 'Reject' without a written reason (or fewer than 20 characters) is blocked with a validation message.
Both Landlord and Tenant receive an SMS within 2 minutes of rejection including the rejection reason text.
After rejection, the Landlord can edit the contract and resubmit without creating a duplicate record.
FR-CONT-012: QR-Coded Authenticated Contract PDF Generation
Priority: Must Have
Description: The system SHALL generate a downloadable authenticated contract PDF within 30 seconds of Woreda Officer authentication. The PDF SHALL contain: complete contract terms in Amharic and English, Contract Registration Number, registration date (Gregorian and Ethiopian), Woreda Officer full name, Woreda office name, and a tamper-proof QR code. The QR code SHALL encode an HMAC-SHA256-signed JSON payload. Both Landlord and Tenant SHALL receive an SMS download link immediately after PDF generation.
Acceptance Criteria:
PDF is generated within 30 seconds of authentication and the download link is delivered via SMS.
QR code on the PDF is scannable by any standard QR reader and decodes to a valid JSON payload.
PDF is printable on A4 paper at 300 DPI with all text and QR code clearly legible.
FR-CONT-013: Contract History & Audit Log
Priority: Must Have
Description: The system SHALL maintain a complete, immutable AuditLog for every contract, recording every state change with: UTC timestamp, actor user ID, actor role, action type, previous state, new state, and any additional notes. This log SHALL be visible to Woreda Officers and System Admins. No AuditLog record SHALL be modifiable or deletable by any user including Admins. Records SHALL be retained for a minimum of 7 years.
Acceptance Criteria:
Every contract state change (DRAFT→PENDING_TENANT_SIGNATURE, SIGNED→PENDING_AUTHENTICATION, etc.) creates a new AuditLog row.
An Admin attempting to delete an AuditLog record via any interface receives an error.
AuditLog entries for contracts created 7 years ago remain accessible in the system.
FR-CONT-014: Contract Renewal Workflow
Priority: Should Have
Description: The system SHALL allow a Landlord to initiate a contract renewal starting 60 days before the lease end date. The Landlord SHALL propose a new monthly rent. The system SHALL validate the proposed rent against the configured annual hike cap (FR-CONT-003). The renewal SHALL follow the full workflow: tenant SMS notification → tenant digital signing → Woreda Officer authentication → new QR contract PDF generation. The renewal contract SHALL be linked to the original contract by parent_contract_id.
Acceptance Criteria:
Renewal initiation option appears in the Landlord dashboard 60 days before lease end date.
A proposed rent exceeding the hike cap is rejected with the maximum allowable rent displayed.
Renewal creates a new RentalContract record linked to the original via parent_contract_id.
FR-CONT-015: Contract Termination Workflow
Priority: Should Have
Description: The system SHALL allow either the Landlord or Tenant to initiate a contract termination request by providing a termination reason and proposed termination date. The Woreda Officer SHALL review and confirm the termination. Upon confirmed termination, the contract status SHALL change to TERMINATED, both parties SHALL be notified via SMS, and the property's active_units count SHALL be decremented accordingly.
Acceptance Criteria:
Either the Landlord or Tenant can submit a termination request from the contract detail view.
Termination takes effect only after Woreda Officer confirmation — unilateral system termination is not permitted.
After confirmed termination, the property's active contract count is updated within 5 minutes.
FR-CONT-016: Active Contract View for Tenant
Priority: Must Have
Description: The system SHALL provide authenticated Tenants with a read-only view of their current active authenticated contract showing: all contract terms, Contract Registration Number, registration date, Woreda Officer name who registered it, QR-coded PDF download link, rent payment history (if recorded), and contract timeline (filing → signing → authentication). The PDF download link SHALL remain valid and accessible at any time after authentication.
Acceptance Criteria:
Tenant can view all contract details including Registration Number from their dashboard.
The authenticated contract PDF download link is always active and downloadable.
The contract timeline shows all events (signed, submitted, authenticated) with timestamps in both calendar formats.
3.4 Module TAX — Tax Assessment & Calculation
FR-TAX-001: Automatic Schedule B Tax Calculation on Contract Registration
Priority: Must Have
Description: The system SHALL automatically calculate the annual Schedule B rental income tax and create a TaxAssessment record within 10 seconds of contract authentication (FR-CONT-010). Calculation method for Category C taxpayers (annual gross rent < ETB 500,000): Step 1: Gross Annual Rent = monthly_rent_etb × 12. Step 2: Standard Deduction = 20% × Gross Annual Rent (no bookkeeping required). Step 3: Taxable Income = Gross Annual Rent − Deduction. Step 4: Apply progressive brackets per Proclamation 1395/2025: 0–24,000 ETB: 0%; 24,001–48,000 ETB: 15%; 48,001–84,000 ETB: 20%; 84,001–120,000 ETB: 25%; 120,001–168,000 ETB: 30%; above 168,000 ETB: 35%. The system SHALL store: gross_annual_rent_etb, deduction_etb, taxable_income_etb, tax_due_etb, effective_rate_pct, and fiscal_year in the TaxAssessment record.
Acceptance Criteria:
For a monthly rent of ETB 5,000: Gross=60,000; Deduction=12,000; Taxable=48,000; Tax=0+(24,000×0%)+(24,000×15%)=ETB 3,600. System stores tax_due_etb=3600.00.
A TaxAssessment record is created in the database within 10 seconds of the Woreda Officer clicking 'Authenticate'.
The effective_rate_pct field is computed as (tax_due_etb / gross_annual_rent_etb) × 100 and stored with 2 decimal places.
FR-TAX-002: Tax Assessment Notice Display to Landlord
Priority: Must Have
Description: The system SHALL display a complete tax assessment notice to the Landlord on the 'Tax Assessment' page showing a step-by-step breakdown: Monthly Rent (ETB), Gross Annual Rent (× 12), Standard Deduction (20%), Taxable Income, Tax Bracket Applied, Tax Due in ETB (bold, prominent), Effective Tax Rate %, Ethiopian Fiscal Year (e.g., 2025/2026), and Payment Due Date. Each calculation step SHALL be shown on a separate row for full transparency.
Acceptance Criteria:
All 8 assessment components are displayed in a clearly labeled table on the assessment page.
Ethiopian fiscal year is displayed in both Ethiopian calendar format (e.g., 2018 EFY) and Gregorian (e.g., 2025/2026).
Payment due date is calculated and displayed prominently with a countdown showing days remaining.
FR-TAX-003: Tax Assessment PDF Generation
Priority: Must Have
Description: The system SHALL generate a downloadable PDF tax assessment notice upon request from the Landlord or Tax Officer. The PDF SHALL be formatted as an official government-style document containing: system logo, Landlord TIN and full name, Property ID and address, Fiscal Year, all calculation steps (as in FR-TAX-002), Tax Due amount in ETB, Payment Due Date, payment instructions (Chapa or PRN), and a verification QR code.
Acceptance Criteria:
PDF is generated within 30 seconds of clicking 'Download Assessment PDF'.
PDF contains all 8 assessment components with correct values matching the on-screen display.
PDF is printable on A4 paper with all text legible at standard printer resolution.
FR-TAX-004: Annual Tax Declaration Cycle
Priority: Must Have
Description: The system SHALL automatically generate new annual TaxAssessment records for all REGISTERED contracts at the start of each Ethiopian fiscal year (Hamle 1, approximately July 8 Gregorian). A Celery periodic task SHALL run annually to create these assessments. Landlords SHALL receive an SMS notification via AfroMessage 30 days before the annual tax payment filing deadline reminding them of the amount due.
Acceptance Criteria:
New TaxAssessment records are created for all active contracts within 24 hours of Ethiopian fiscal year start (Hamle 1).
Landlords receive a reminder SMS 30 calendar days before the tax payment deadline.
Previous fiscal year assessment records remain accessible in the tax history for the property.
FR-TAX-005: Late Payment Interest Calculation
Priority: Must Have
Description: The system SHALL calculate and display late payment interest on overdue TaxAssessment records per the statutory interest provisions of Tax Administration Proclamation 983/2016. Interest SHALL be calculated as a monthly compounding rate applied to the outstanding principal tax from the day after the payment due date. The system SHALL display the principal tax due, accrued interest, and total outstanding amount separately on the assessment page.
Acceptance Criteria:
Interest begins accruing on the day immediately following the payment due date.
Principal tax due and accrued interest are displayed as separate line items — never combined into a single unlabeled total.
Total outstanding (principal + interest) is updated daily by a Celery periodic task.
FR-TAX-006: Vacant Property Imputed Rental Income
Priority: Should Have
Description: The system SHALL flag properties that have been in ACTIVE status for more than 6 consecutive months with no REGISTERED active rental contract. For flagged properties, the system SHALL calculate an estimated imputed rental income based on the property's Sub-City, Building Type, and Floor Area. The assigned Tax Officer SHALL receive an in-app notification for manual review. The officer SHALL be able to dismiss the flag with a written reason.
Acceptance Criteria:
A property ACTIVE for 6 months with no registered contract is flagged by a Celery task running monthly.
Flagged properties appear in a dedicated 'Vacant Property Flags' tab on the Tax Officer dashboard.
Officer dismissing a flag must enter at least 20 characters of written justification.
FR-TAX-007: Tax History per Property
Priority: Must Have
Description: The system SHALL maintain and display a complete tax history for each property accessible to the Landlord (read-only), Tax Officer (full access), and System Admin. The history SHALL list all historical TaxAssessment records in reverse chronological order, each showing: Fiscal Year, Gross Rent, Tax Due, Amount Paid, Payment Method, Payment Date, Clearance Certificate link (if issued), and Assessment Status (PENDING / PAID / OVERDUE / WAIVED).
Acceptance Criteria:
All assessment records for the property appear in the tax history in reverse chronological order.
Each assessment shows its full status with correct amounts and dates.
Tax history records for properties with assessments 7 years old remain accessible.
FR-TAX-008: Tax Clearance Certificate Generation
Priority: Must Have
Description: The system SHALL automatically generate a QR-coded Tax Clearance Certificate within 60 seconds of a tax payment being confirmed (status = CONFIRMED). The certificate SHALL contain: Landlord full name, TIN, Property ID and address, Ethiopian Fiscal Year, Amount Paid in ETB, Payment Date, Issuing Officer Name (or 'System Auto-Issued' for Chapa webhook payments), a unique Certificate Number, Issue Date, and an HMAC-SHA256 signed QR code linking to a public verification page.
Acceptance Criteria:
Certificate is generated within 60 seconds of Chapa webhook confirmation or officer manual confirmation.
QR code on the certificate links to a public URL (no login required) that displays certificate authenticity.
Certificate PDF is downloadable by the Landlord from the Tax History page at any time after issuance.
3.5 Module PAY — Payment Processing
FR-PAY-001: Chapa Payment Gateway Integration (Sandbox)
Priority: Must Have
Description: The system SHALL integrate with the Chapa payment gateway sandbox API to process rental income tax payments. Integration flow: (1) Landlord clicks 'Pay Tax via Chapa' on the assessment page; (2) Django backend calls Chapa POST /transaction/initialize with: amount, currency='ETB', email (or phone), tx_ref (unique payment ID), callback_url (webhook), return_url; (3) Chapa returns a checkout_url; (4) System redirects Landlord to Chapa-hosted checkout page; (5) Landlord selects Telebirr, CBE Birr, Awash Bank, Visa, or Mastercard and completes payment; (6) Chapa sends a POST webhook to the system's /api/payments/chapa/webhook/ endpoint; (7) System verifies HMAC signature (FR-PAY-006) and updates TaxPayment status to CONFIRMED.
Acceptance Criteria:
Clicking 'Pay via Chapa' calls the Chapa initialize API and redirects the browser to the checkout URL within 5 seconds.
A valid Chapa webhook with correct HMAC signature correctly updates the TaxPayment status to CONFIRMED.
A tampered Chapa webhook with invalid HMAC signature is rejected with HTTP 400 and logged as a security event.
FR-PAY-002: Payment Reference Number (PRN) Generation
Priority: Must Have
Description: The system SHALL allow Landlords to request a PRN as an offline payment alternative. Upon request, the system SHALL: generate a unique PRN in format PRN-[WoredaCode]-[YYYYMMDD]-[XXXXXX] (6-digit sequential per woreda per day), create a TaxPayment record with status PROCESSING, store the PRN linked to the TaxAssessment, and send the PRN to the Landlord via AfroMessage SMS within 2 minutes. The PRN SHALL remain valid for 30 calendar days from generation.
Acceptance Criteria:
PRN is unique system-wide, correctly formatted, and sent via SMS within 2 minutes of request.
PRN is stored in the TaxPayment record associated with the correct TaxAssessment.
Attempting to generate a second PRN for the same assessment while one is still PROCESSING is blocked.
FR-PAY-003: Payment Status Tracking
Priority: Must Have
Description: The system SHALL track each TaxPayment through a defined state machine: PENDING (payment record created, no action yet), PROCESSING (Chapa checkout initiated or PRN issued), CONFIRMED (payment verified via webhook or manual officer confirmation), FAILED (Chapa reports payment failure), REFUNDED (refund has been processed). The Landlord SHALL see the current payment status on the assessment page at all times.
Acceptance Criteria:
A payment initiated via Chapa transitions from PENDING to PROCESSING immediately after checkout URL is generated.
A Chapa failure webhook correctly sets the payment status to FAILED within 2 minutes.
All status transitions are recorded in the AuditLog with timestamp and actor.
FR-PAY-004: Payment Receipt Generation (PDF)
Priority: Must Have
Description: The system SHALL generate a downloadable PDF payment receipt immediately upon payment confirmation. The receipt SHALL contain: Payment ID, Property ID and address, Landlord full name and TIN, Assessment Fiscal Year, Amount Paid in ETB, Payment Method (Telebirr / CBE Birr / Awash / Card / PRN Bank / PRN Telebirr), Payment Date and Time (EAT timezone), Chapa Transaction Reference (if applicable), and PRN Code (if applicable).
Acceptance Criteria:
Receipt PDF is available for download within 60 seconds of payment confirmation.
Receipt contains all required fields with correct values matching the TaxPayment record.
Receipt is printable on A4 paper with all amounts and references clearly legible.
FR-PAY-005: Failed Payment Handling and Retry
Priority: Must Have
Description: The system SHALL detect failed Chapa payment webhooks (status = 'failed') and immediately send an SMS notification to the Landlord explaining the failure and providing instructions to retry. The system SHALL allow the Landlord to initiate a new payment attempt for the same TaxAssessment without creating a duplicate assessment or deleting the failed payment record.
Acceptance Criteria:
Landlord receives a failure SMS within 5 minutes of Chapa sending a failure webhook.
The failed TaxPayment record remains visible in payment history with status FAILED.
Clicking 'Retry Payment' creates a new TaxPayment record in PENDING state while the old FAILED record persists.
FR-PAY-006: Chapa Webhook Signature Verification
Priority: Must Have
Description: The system SHALL verify the authenticity of all incoming Chapa webhook POST requests to /api/payments/chapa/webhook/ by computing the HMAC-SHA256 of the raw request body using the configured Chapa secret key and comparing the result to the value in the X-Chapa-Signature HTTP header. Any request failing signature verification SHALL be rejected immediately with HTTP 400 and a security event logged with the source IP address.
Acceptance Criteria:
A webhook with the correct HMAC-SHA256 signature is accepted and processed within 5 seconds.
A webhook with an incorrect or missing X-Chapa-Signature header is rejected with HTTP 400.
All signature verification failures are logged in the AuditLog as SECURITY_EVENT type with the source IP.
FR-PAY-007: PRN Payment Reconciliation by Tax Officer
Priority: Must Have
Description: The system SHALL display a PRN reconciliation panel in the Tax Officer dashboard listing all TaxPayment records in PROCESSING state with a non-null prn_code field, filtered to the officer's Sub-City jurisdiction. Each item SHALL show: PRN code, Landlord name and TIN, Property ID, Assessment amount, and days since PRN was issued. The Tax Officer SHALL confirm a PRN payment (with an optional note) after verifying the physical bank slip or Telebirr screenshot presented by the Landlord.
Acceptance Criteria:
Only PROCESSING PRN payments for the officer's Sub-City appear in the reconciliation panel.
Clicking 'Confirm Payment' for a PRN updates the TaxPayment status to CONFIRMED and triggers Tax Clearance Certificate generation.
Confirmation is logged in the AuditLog with the officer's user ID, timestamp, and any entered note.
FR-PAY-008: SIGTAS-Compatible CSV Export
Priority: Must Have
Description: The system SHALL allow Tax Officers to export all CONFIRMED TaxPayment records for a specified date range and Sub-City as a downloadable CSV file compatible with the SIGTAS Schedule B individual landlord batch upload format. The CSV SHALL contain exactly these 13 columns in order: TIN, Taxpayer Name, Property ID, Fiscal Year, Gross Rent ETB, Deduction ETB, Taxable Income ETB, Tax Due ETB, Amount Paid ETB, Payment Date (YYYY-MM-DD), Payment Method, Payment Reference, Assessment Period.
Acceptance Criteria:
CSV export contains exactly 13 columns in the specified order with correct headers.
Export correctly filters by the entered date range (inclusive) and the officer's Sub-City.
Export of 10,000 records completes and triggers a download within 10 seconds.
3.6 Module WOREDA — Woreda Officer Dashboard
FR-WOREDA-001: Woreda Officer Login and Jurisdiction Enforcement
Priority: Must Have
Description: The system SHALL authenticate Woreda Housing Officers using the standard Phone OTP login flow (FR-AUTH-003) and SHALL enforce at the API level that every data query made by a Woreda Officer is automatically scoped to their assigned Sub-City and Woreda. No configuration option or URL parameter SHALL allow an officer to access data from another Woreda.
Acceptance Criteria:
Officer's JWT contains sub_city_id and woreda_id claims set at account creation time.
All officer API endpoints filter by woreda_id from the JWT — a direct URL to another woreda's data returns HTTP 403.
Session expires after 8 hours of inactivity and the officer is redirected to the login page.
FR-WOREDA-002: Pending Contract Registrations Queue
Priority: Must Have
Description: The system SHALL display a sortable, filterable queue of all contracts in PENDING_AUTHENTICATION status for the officer's Woreda. Queue item fields: Contract ID, Property Address, Landlord Name, Tenant Name, Monthly Rent ETB, Days Since Submission. Filtering options: submission date range, landlord name (partial match). Sort options: oldest first (default), newest first, highest rent.
Acceptance Criteria:
Queue shows only contracts for the officer's assigned Woreda.
Sort by 'Oldest First' places the contract with the earliest submission date at the top.
Queue item count in the page header matches the actual number of items in the list.
FR-WOREDA-003: Pending Property Verifications Queue
Priority: Must Have
Description: The system SHALL display a separate queue for properties in PENDING_REVIEW status within the officer's Woreda, sorted by submission date (oldest first). Each item shows: Property Address, Landlord Name, Building Type, Floor Area sqm, Monthly Rent ETB, and Submission Date.
Acceptance Criteria:
Only PENDING_REVIEW properties in the officer's Woreda are shown.
Each item is clickable and navigates to the full property review detail panel.
A newly submitted property appears in the queue within 1 minute.
FR-WOREDA-004: Contract Detail Review Panel
Priority: Must Have
Description: The system SHALL provide a full-page contract review panel displaying: all contract fields, title deed and ID document scans (full-screen zoomable), landlord profile summary, tenant profile summary, and automatic compliance flags displayed as red banner alerts at the top of the panel for: advance cap violation, lease duration below 24 months, and rent hike cap violation. Officer action buttons (Authenticate / Reject) SHALL be permanently visible in a sticky footer.
Acceptance Criteria:
Uploaded document scans are viewable in a full-screen lightbox within the panel without navigating away.
A contract with advance payment exceeding 2× monthly rent shows a red banner: 'Advance Payment Cap Violation — Proclamation 1320/2024 Art. 13'.
Action buttons remain visible in the sticky footer even when the officer scrolls to the bottom of long contracts.
FR-WOREDA-005: One-Click Authentication with Confirmation Dialog
Priority: Must Have
Description: The system SHALL allow a Woreda Housing Officer to authenticate a contract by clicking 'Authenticate & Register'. This SHALL open a confirmation dialog displaying the key contract facts (Property, Landlord, Tenant, Rent, Lease Dates). The officer SHALL click 'Confirm' to complete authentication, which is irreversible once confirmed.
Acceptance Criteria:
Confirmation dialog shows Property Address, Landlord Name, Tenant Name, Monthly Rent, Lease Start, Lease End.
Authentication completes within 10 seconds of 'Confirm' click and the contract disappears from the pending queue.
There is no 'undo' option — authentication is permanently recorded in the AuditLog.
FR-WOREDA-006: Rejection with Mandatory Written Reason
Priority: Must Have
Description: The system SHALL require a written rejection reason of at least 20 characters before allowing a Woreda Officer to reject a contract or property application. The rejection reason SHALL be stored in the record, included in the SMS notification to both parties, and logged in the AuditLog.
Acceptance Criteria:
The 'Confirm Rejection' button is disabled until the text area contains at least 20 characters.
The rejection reason text is included verbatim in the SMS sent to the Landlord.
The rejection reason is visible in the contract's AuditLog event for that rejection action.
FR-WOREDA-007: Issuance of Registration Notice PDF
Priority: Must Have
Description: The system SHALL generate a printable Registration Notice PDF upon contract authentication that the Woreda Officer can print and hand to the Landlord as a physical receipt. The PDF SHALL contain: Contract Registration Number, Property Address, Landlord Full Name, Registration Date (Gregorian and Ethiopian), Woreda Office Name, Officer Name, and a blank area for the officer's manual stamp and signature.
Acceptance Criteria:
Registration Notice PDF is generated within 10 seconds of authentication alongside the QR Contract PDF.
PDF contains all required fields including both calendar date formats.
A printed version on A4 paper at 300 DPI has all text legible and the stamp area clearly marked.
FR-WOREDA-008: Registered Contracts Search and Filter
Priority: Must Have
Description: The system SHALL allow Woreda Officers to search all REGISTERED contracts within their Woreda using the following filters: Landlord Name (partial), Landlord TIN (exact), Contract Registration Number (exact), Property House Number (partial), and registration date range. Results SHALL be paginated at 20 per page.
Acceptance Criteria:
Search by partial Landlord Name returns all REGISTERED contracts where the name contains the search string.
Search results are paginated at 20 per page with page navigation controls.
A Woreda Officer's search never returns contracts from other Woredas.
FR-WOREDA-009: Grievance Intake Form
Priority: Must Have
Description: The system SHALL provide a dispute intake form for Woreda Officers to log a grievance on behalf of a walk-in Landlord or Tenant. Fields: Dispute Type (dropdown), Filer name and phone (pre-filled if found in system; manual entry if not), Respondent name and phone, Property Address, Incident Date, Description (min 100 characters), and optional evidence document upload (PDF/JPG/PNG, max 5MB).
Acceptance Criteria:
Officer can create a dispute for a walk-in person not yet registered in the system.
Dispute is automatically assigned to the officer's Woreda.
If phone numbers are available, both parties receive an SMS confirmation of dispute filing within 2 minutes.
FR-WOREDA-010: Woreda-Level Compliance Dashboard
Priority: Must Have
Description: The system SHALL display a compliance statistics dashboard for the officer's Woreda showing: total ACTIVE registered properties, total PENDING_REVIEW properties, total REGISTERED contracts, count of contracts with OVERDUE_REGISTRATION flag, total open disputes, and a monthly trend chart showing registrations per month for the past 12 months.
Acceptance Criteria:
All statistics are accurate as of the previous midnight update.
Monthly trend chart correctly shows 12 months of registration data.
Dashboard loads within 3 seconds with all data populated.
FR-WOREDA-011: Walk-In Registration Assistance Mode
Priority: Must Have
Description: The system SHALL allow a Woreda Housing Officer to perform assisted registration for a walk-in Landlord in a single assisted session: (1) create Landlord account, (2) register property with scanned document upload, (3) draft contract, (4) record tenant information, (5) authenticate the contract immediately. All actions in assisted mode SHALL be logged under the officer's user ID with an explicit trust context (distinguishing officer action from tenant self-service) and an 'ASSISTED_MODE' flag in the AuditLog.
Acceptance Criteria:
Officer can create a new Landlord account from the officer dashboard in fewer than 5 fields.
Entire assisted registration flow can be completed without the landlord having a smartphone, but requires explicit logging of the officer's identity, landlord's identity, timestamp, and a mandatory physical or verbal confirmation.
All AuditLog entries for assisted-mode actions include the ASSISTED_MODE flag and both the officer ID and the created landlord ID.
FR-WOREDA-012: Summons Issuance
Priority: Must Have
Description: The system SHALL allow a Woreda Housing Officer to generate a formal Summons Letter PDF addressed to a Landlord or Tenant from either a property record, contract record, or dispute record. The summons SHALL contain: recipient full name, recipient address, reason for summons (officer-entered, min 50 characters), date and time to appear at the Woreda office, Woreda office full address, and a unique Summons Reference Number in format SUM-[WoredaCode]-[YYYYMMDD]-[NNN].
Acceptance Criteria:
Summons PDF is generated within 10 seconds and downloadable.
Summons Reference Number is unique and correctly formatted.
Summons generation is logged in the AuditLog and linked to the originating record (property/contract/dispute).
3.7 Module TAXOFF — Tax Officer Dashboard
FR-TAXOFF-001: Tax Officer Login and Sub-City Jurisdiction Enforcement
Priority: Must Have
Description: The system SHALL authenticate Tax Officers using Phone OTP login and SHALL enforce at the API level that all data queries are scoped to the officer's assigned Sub-City. The JWT SHALL contain sub_city_id as a claim used to filter all tax data.
Acceptance Criteria:
Officer's JWT contains sub_city_id — direct URL to another sub-city's data returns HTTP 403.
Session expires after 8 hours of inactivity.
Role enforcement prevents Tax Officers from accessing Woreda Officer authentication endpoints.
FR-TAXOFF-002: Active Tax Assessments List
Priority: Must Have
Description: The system SHALL display all TaxAssessment records in PENDING or OVERDUE status for properties in the officer's Sub-City. Each record shows: Landlord Name, TIN, Property Address, Gross Annual Rent ETB, Tax Due ETB, Assessment Due Date, and Status. Sortable by: due date, tax amount, days overdue. Filterable by: status, Woreda, date range.
Acceptance Criteria:
List shows only assessments for properties in the officer's Sub-City.
Overdue assessments are visually highlighted in the list.
Sort by 'Days Overdue' places the most delinquent assessments at the top.
FR-TAXOFF-003: Overdue Tax Flagging
Priority: Must Have
Description: The system SHALL automatically flag TaxAssessment records where the due date has passed and status is not PAID or WAIVED. Flagged records SHALL display the number of days overdue as a red badge. A Celery task SHALL update overdue calculations daily at midnight.
Acceptance Criteria:
The overdue flag appears the calendar day after the due date (Day 1 = first overdue day).
Days overdue is calculated as: today − due_date in calendar days.
Flagged assessments appear in a dedicated 'Overdue' tab on the Tax Officer dashboard.
FR-TAXOFF-004: PRN Payment Manual Confirmation
Priority: Must Have
Description: The system SHALL provide a PRN reconciliation panel (as specified in FR-PAY-007) allowing the Tax Officer to manually confirm offline PRN payments after reviewing physical payment evidence. Confirmation SHALL trigger Tax Clearance Certificate generation and Landlord SMS notification.
Acceptance Criteria:
All unconfirmed PRN payments for the officer's Sub-City are listed in the reconciliation panel.
Manual confirmation updates TaxPayment status to CONFIRMED and triggers certificate generation within 60 seconds.
Landlord receives SMS confirmation within 2 minutes of officer action.
FR-TAXOFF-005: SIGTAS CSV Export
Priority: Must Have
Description: The system SHALL provide SIGTAS-compatible CSV export functionality as specified in FR-PAY-008, scoped to the Tax Officer's Sub-City.
Acceptance Criteria:
Export is filtered to the officer's Sub-City by default.
Export contains all 13 required columns.
Export completes within 10 seconds for 10,000 records.
FR-TAXOFF-006: Tax Clearance Certificate Issuance
Priority: Must Have
Description: The system SHALL allow a Tax Officer to manually trigger Tax Clearance Certificate generation (as specified in FR-TAX-008) for a PAID assessment. The certificate SHALL include the issuing officer's name and be logged in the AuditLog.
Acceptance Criteria:
Certificate can only be issued for assessments with status PAID.
Certificate includes the officer's full name as the issuing authority.
Issuance is logged in the AuditLog with officer ID and timestamp.
FR-TAXOFF-007: Multi-Property Landlord Overview
Priority: Must Have
Description: The system SHALL allow a Tax Officer to search for a Landlord by TIN or phone number and view a consolidated profile page showing: Landlord details, list of all properties in the officer's Sub-City, and for each property: active contract, latest assessment, total assessed amount (this fiscal year), amount paid, and outstanding balance. A grand total of outstanding tax across all properties SHALL be displayed.
Acceptance Criteria:
Search by TIN returns the correct Landlord profile.
Grand total outstanding tax matches the sum of all individual property outstanding amounts.
Officer can navigate from the overview to the individual assessment for each property.
FR-TAXOFF-008: Tax Investigation Flag
Priority: Should Have
Description: The system SHALL allow a Tax Officer to flag a Landlord account for suspected tax under-declaration by providing a written reason of at least 50 characters and selecting the specific property or assessment in question. Flagged accounts SHALL be highlighted in the Admin dashboard for supervisory review. Landlords SHALL NOT be notified of investigation flags.
Acceptance Criteria:
Flag cannot be created with fewer than 50 characters of written reason.
Flagged accounts appear in a dedicated 'Under Investigation' section visible to Admin only.
Investigation flag creation is logged in the AuditLog with officer ID, timestamp, and reason.
FR-TAXOFF-009: Monthly Revenue Report
Priority: Must Have
Description: The system SHALL generate a monthly revenue report for the Tax Officer's Sub-City for any selected month. The report SHALL include: total tax assessed, total collected, total outstanding, and a breakdown by payment method (Chapa Telebirr, Chapa CBE, Chapa Card, PRN Bank, PRN Telebirr, Manual). Report SHALL be displayable as both a bar chart and a data table, and downloadable as PDF.
Acceptance Criteria:
Report is generated within 10 seconds for the selected month.
Chart and table data values are identical — no discrepancy between visual and tabular data.
Downloadable PDF report prints correctly on A4 paper.
FR-TAXOFF-010: Landlord TIN Search
Priority: Must Have
Description: The system SHALL allow Tax Officers to search for any Landlord by TIN (exact) or phone number (exact) to quickly access their profile and initiate actions (view assessments, confirm PRN, issue clearance). The search input SHALL be on the Tax Officer dashboard homepage for quick access.
Acceptance Criteria:
Search by TIN returns the correct Landlord profile within 2 seconds.
Search by phone number (with or without +251 prefix) returns the correct profile.
Searching with a non-existent TIN returns a clear 'No records found' message.
FR-TAXOFF-011: Tax Assessment Override (with Supervisor Approval)
Priority: Nice to Have
Description: The system SHALL allow a Tax Officer to submit a request to override a TaxAssessment amount (e.g., due to a data entry error in the original contract), providing a written reason of at least 50 characters. The override request SHALL be sent to the System Admin for approval via an in-app notification. The assessment amount SHALL only change after Admin approval. Both the request and the approval SHALL be logged in the AuditLog.
Acceptance Criteria:
Override request cannot be submitted with fewer than 50 characters of written justification.
Assessment amount remains unchanged until Admin approves the override request.
Both the officer's request and the Admin's approval/rejection are logged in the AuditLog.
3.8 Module DISP — Dispute Management
FR-DISP-001: Dispute / Grievance Filing by Tenant or Landlord
Priority: Must Have
Description: The system SHALL allow authenticated Tenants and Landlords to file a dispute by: (1) selecting a dispute type from: UNLAWFUL_RENT_INCREASE, ILLEGAL_EVICTION_NOTICE, UNREGISTERED_CONTRACT, UTILITY_DISCONNECTION, DEPOSIT_NOT_RETURNED, OTHER; (2) entering a description of at least 100 characters; (3) entering the incident date; (4) optionally uploading supporting evidence (PDF/JPG/PNG, max 5MB per file, max 3 files). The filer SHALL optionally link the dispute to an active contract from a dropdown.
Acceptance Criteria:
All 6 dispute types are available in the dropdown menu.
Submitting a description with fewer than 100 characters is blocked with a character count display.
Evidence file uploads support PDF, JPG, and PNG formats and reject all other types.
FR-DISP-002: Dispute Assignment to Woreda Officer
Priority: Must Have
Description: The system SHALL automatically assign a newly filed dispute to the Woreda Housing Officer responsible for the Sub-City and Woreda where the relevant property is located. If the dispute is not linked to a specific property, it SHALL be assigned to the officer covering the filer's registered residential Woreda. The assigned officer SHALL receive an in-app notification and an SMS alert within 2 minutes.
Acceptance Criteria:
Dispute is assigned to the correct Woreda Officer automatically without manual intervention.
Officer receives SMS notification within 2 minutes of dispute submission.
Dispute appears in the officer's pending dispute queue immediately after assignment.
FR-DISP-003: Dispute Status Tracking
Priority: Must Have
Description: The system SHALL track each dispute through states: FILED (submitted but not yet reviewed), UNDER_REVIEW (officer has acknowledged and begun reviewing), DECISION_ISSUED (officer has entered an administrative ruling), APPEALED (a party has filed an appeal within the 15 working day window), CLOSED (dispute resolved with no pending appeal). State transitions SHALL be validated and logged.
Acceptance Criteria:
Status transitions follow the defined sequence — FILED → UNDER_REVIEW is the only valid transition from FILED.
Both filer and respondent can view current dispute status from their dashboard at any time.
Every status change creates an AuditLog entry with actor, timestamp, and new status.
FR-DISP-004: Summons Generation by Officer
Priority: Must Have
Description: The system SHALL allow Woreda Officers to generate a Summons Letter PDF (as specified in FR-WOREDA-012) directly from the dispute detail view, pre-filled with the relevant party's information and the dispute reference.
Acceptance Criteria:
Summons can be generated from the dispute detail page with one click.
Summons reference number is stored in the Dispute record.
PDF is generated within 10 seconds.
FR-DISP-005: Administrative Ruling Entry
Priority: Must Have
Description: The system SHALL allow a Woreda Housing Officer to enter the administrative ruling for a dispute that is in UNDER_REVIEW status. The ruling text SHALL have a minimum of 50 characters. Saving the ruling SHALL: set dispute status to DECISION_ISSUED, record the ruling timestamp (UTC), calculate and display the 15-working-day appeal deadline, and notify both parties via SMS and in-app notification.
Acceptance Criteria:
Ruling text below 50 characters is rejected with a validation message.
Ruling timestamp is immutable once saved — no edit option is available.
Appeal deadline displayed is exactly 15 working days (Monday–Friday, excluding Addis Ababa public holidays) after the ruling date.
FR-DISP-006: Appeal to Sub-City Grievance Committee
Priority: Must Have
Description: The system SHALL allow either the Landlord or Tenant to file an appeal within 15 working days of a DECISION_ISSUED ruling. The system SHALL automatically calculate and prominently display the appeal deadline on the dispute detail page. Filing an appeal SHALL: set dispute status to APPEALED, notify the assigned officer, and display instructions for the in-person Sub-City Grievance Committee hearing.
Acceptance Criteria:
Appeal deadline is correctly calculated as 15 working days from ruling_date (excluding weekends and public holidays).
Attempting to file an appeal after the deadline returns: 'The 15-working-day appeal window has closed.'
Filing an appeal triggers an in-app notification to the Woreda Officer within 1 minute.
FR-DISP-007: Dispute History Timeline View
Priority: Must Have
Description: The system SHALL display a chronological event timeline for each dispute showing all actions: filing submission, status changes, document uploads, summons issuance, ruling entry, and appeal filing. Each event SHALL show: event type icon, description, timestamp in both Gregorian and Ethiopian calendar, and actor name/role. The timeline SHALL be visible to all parties involved in the dispute.
Acceptance Criteria:
Timeline shows all events in strict chronological order from oldest to newest.
Every event displays both Gregorian and Ethiopian calendar timestamps.
Timeline is accessible to both the Landlord and Tenant involved in the dispute.
FR-DISP-008: Dispute Notifications to Parties
Priority: Must Have
Description: The system SHALL send both SMS (via AfroMessage) and in-app notifications to all relevant parties at every dispute status change: FILED (to officer), UNDER_REVIEW (to filer and respondent), DECISION_ISSUED (to filer and respondent with ruling summary), APPEALED (to officer), CLOSED (to filer and respondent). Failed SMS deliveries SHALL be retried 3 times at 30-second intervals.
Acceptance Criteria:
Both filer and respondent receive SMS and in-app notification within 2 minutes of every status change.
In-app notification bell icon count increments for each unread notification.
Failed SMS triggers 3 automatic retries before the failure is logged for admin review.
3.9 Module NOTIF — Notification System
FR-NOTIF-001: SMS OTP Delivery via AfroMessage API
Priority: Must Have
Description: The system SHALL deliver all authentication and signing OTP codes via HTTPS POST requests to the AfroMessage API. OTP SMS messages SHALL be written in Amharic with the 6-digit code displayed prominently. Delivery failures SHALL trigger up to 3 automatic retries at 30-second intervals. All AfroMessage API errors SHALL be logged with timestamp, recipient phone (masked), and error code.
Acceptance Criteria:
OTP SMS is delivered within 60 seconds under normal network conditions.
Delivery failure triggers 3 automatic retries before the event is logged as failed.
AfroMessage API errors are logged in the system error log with masked phone number and error code.
FR-NOTIF-002: SMS Alert — Contract Registration Deadline Warning (Day 25)
Priority: Must Have
Description: The system SHALL automatically send an SMS to the Landlord on Day 25 after contract signing_date if the contract status is still SIGNED (not yet PENDING_AUTHENTICATION or REGISTERED). The SMS SHALL be in Amharic and SHALL cite Proclamation 1320/2024 and include the registration deadline date.
Acceptance Criteria:
Alert SMS is sent on exactly Day 25 — not Day 24 or Day 26.
SMS includes the contract ID and registration deadline date.
Alert is logged in the Notification table with type='DEADLINE_WARNING_DAY25'.
FR-NOTIF-003: SMS Alert — Contract Registration Deadline Breach (Day 30)
Priority: Must Have
Description: The system SHALL automatically send an escalation SMS to the Landlord on Day 30 after signing_date if the contract is still not REGISTERED, and SHALL set the OVERDUE_REGISTRATION flag on the RentalContract record. The Woreda Officer SHALL receive an in-app notification listing all newly overdue contracts in their Woreda.
Acceptance Criteria:
Escalation SMS is sent to the Landlord on exactly Day 30.
OVERDUE_REGISTRATION flag is set on the RentalContract record within the same daily Celery task run.
Woreda Officer receives an in-app notification listing the overdue contract within the next Celery beat cycle.
FR-NOTIF-004: SMS Alert — Tenant Contract Review Request
Priority: Must Have
Description: The system SHALL send an SMS to the Tenant immediately upon contract submission by the Landlord for tenant review (as specified in FR-CONT-004).
Acceptance Criteria:
SMS is sent within 2 minutes of landlord submission.
SMS contains a unique secure review link valid for 7 days.
If AfroMessage fails, 3 retries are attempted before logging failure.
FR-NOTIF-005: SMS Alert — Contract Authentication Approved
Priority: Must Have
Description: The system SHALL notify both Landlord and Tenant via SMS immediately upon contract authentication by the Woreda Officer. The SMS SHALL include the Contract Registration Number and a download link for the QR-coded contract PDF.
Acceptance Criteria:
Both parties receive the authentication SMS within 2 minutes of officer authentication.
SMS includes the Contract Registration Number in the defined format.
SMS contains a direct download link for the authenticated contract PDF.
FR-NOTIF-006: SMS Alert — Contract Rejected
Priority: Must Have
Description: The system SHALL notify both Landlord and Tenant via SMS immediately upon contract rejection by the Woreda Officer, including the officer's rejection reason text.
Acceptance Criteria:
Both parties receive rejection SMS within 2 minutes of officer rejection.
SMS includes the rejection reason text verbatim.
Landlord's SMS includes instructions to correct and resubmit.
FR-NOTIF-007: SMS Alert — Tax Assessment Issued
Priority: Must Have
Description: The system SHALL notify the Landlord via SMS within 2 minutes of a TaxAssessment record being created (triggered by contract authentication). The SMS SHALL state: the property address, fiscal year, tax amount due in ETB, and payment due date.
Acceptance Criteria:
SMS is sent within 2 minutes of TaxAssessment record creation.
SMS correctly states the tax amount and due date.
Notification is logged in the Notification table linked to the TaxAssessment record.
FR-NOTIF-008: SMS Alert — Tax Payment Due Reminder (30 Days Before Deadline)
Priority: Must Have
Description: The system SHALL automatically send a payment reminder SMS to Landlords 30 calendar days before their annual tax payment deadline. A Celery task SHALL run daily, identify assessments with due_date exactly 30 days in the future, and send reminders.
Acceptance Criteria:
Reminder SMS is sent 30 days before the due date — not 29 or 31 days.
SMS states the outstanding amount and due date.
Reminder is not sent if the assessment is already PAID.
FR-NOTIF-009: SMS Alert — Tax Payment Confirmed
Priority: Must Have
Description: The system SHALL notify the Landlord via SMS within 2 minutes of a tax payment being confirmed (Chapa webhook or officer manual confirmation). The SMS SHALL include a receipt download link and Tax Clearance Certificate download link.
Acceptance Criteria:
SMS is sent within 2 minutes of CONFIRMED status being set on TaxPayment.
SMS contains a working download link for the payment receipt PDF.
SMS contains a working download link for the Tax Clearance Certificate PDF.
FR-NOTIF-010: SMS Alert — Dispute Status Change
Priority: Must Have
Description: The system SHALL notify all relevant parties via SMS at every dispute status change as specified in FR-DISP-008.
Acceptance Criteria:
Both filer and respondent receive SMS within 2 minutes of each status change.
SMS describes the new status in Amharic.
Failed delivery triggers 3 retries at 30-second intervals.
FR-NOTIF-011: In-App Notification Center
Priority: Must Have
Description: The system SHALL display a bell icon in the application header with an unread count badge. Clicking the bell SHALL open a notification panel listing all notifications for the current user in reverse chronological order, each showing: notification type icon, message, timestamp, and read/unread status. Marking as read shall update the unread count in real time.
Acceptance Criteria:
Bell icon badge updates within 1 minute of a new notification being created.
Notification panel shows all user notifications in reverse chronological order.
Clicking a notification marks it as read and decrements the unread count.
FR-NOTIF-012: Notification Preference Settings
Priority: Nice to Have
Description: The system SHALL allow users to opt out of non-mandatory informational SMS notifications (e.g., marketing-style reminders) via a Notification Settings page. Legally required notifications — including OTP delivery, deadline alerts, contract authentication results, and tax assessment notices — SHALL NOT be opt-outable.
Acceptance Criteria:
User can toggle off 'Informational Reminders' SMS category without affecting OTP delivery.
Opting out of informational SMS does not affect in-app notifications.
Legally required notifications (OTP, deadlines, authentication results) cannot be opted out.
3.10 Module ADMIN — System Administration
FR-ADMIN-001: User Management (Create, Edit, Deactivate)
Priority: Must Have
Description: The system SHALL allow System Administrators to create, edit, and deactivate accounts for any user role (LANDLORD, TENANT, WOREDA_OFFICER, TAX_OFFICER, ADMIN) from the User Management panel. Editing SHALL allow updating: full name, phone number, assigned Sub-City (for officers), assigned Woreda (for Woreda Officers), and role. Deactivation SHALL immediately invalidate all active JWT tokens.
Acceptance Criteria:
Admin can create a new Woreda Officer account within 5 form fields.
Editing a user's Woreda assignment takes effect immediately on the next API request.
Deactivating a user invalidates their JWT within 30 seconds.
FR-ADMIN-002: Sub-City and Woreda Configuration
Priority: Must Have
Description: The system SHALL allow System Administrators to seed and manage the list of Addis Ababa's 11 Sub-Cities and their Woredas via the Admin Configuration panel. Admin SHALL be able to add, edit, and deactivate Sub-Cities and Woredas. The SubCity and Woreda tables SHALL be pre-seeded with all 11 Addis Ababa Sub-Cities as listed in Appendix C.
Acceptance Criteria:
All 11 Addis Ababa Sub-Cities are pre-seeded in the database on initial deployment.
Admin can add a new Woreda to any Sub-City without a code deployment.
Deactivated Woredas no longer appear in the property registration form dropdown.
FR-ADMIN-003: Annual Rent Hike Ceiling Configuration
Priority: Must Have
Description: The system SHALL allow System Administrators to update the annual rent hike ceiling percentage via the System Configuration panel (SystemConfig table, key='RENT_HIKE_CEILING_PCT') without any code changes or server restart. The default value is 11.5 (representing 11.5% for 2026/27). The change SHALL take effect immediately for all new contract renewal validations.
Acceptance Criteria:
Admin can update the rent hike ceiling from 11.5% to 12% via the Config panel without a deployment.
New ceiling value takes effect immediately — subsequent contract renewal validations use the updated value.
Config change is logged in the AuditLog with old value, new value, admin ID, and timestamp.
FR-ADMIN-004: Tax Bracket Configuration
Priority: Must Have
Description: The system SHALL store tax brackets as a JSON value in the SystemConfig table (key='TAX_BRACKET_JSON') allowing System Administrators to update the tax brackets without code changes in the event that Proclamation 1395/2025 is amended. The JSON format SHALL define: lower bound, upper bound (null for the top bracket), and rate percentage for each bracket.
Acceptance Criteria:
Admin can update the tax bracket JSON via the System Configuration panel.
Updated brackets are used immediately for all new TaxAssessment calculations.
Existing TaxAssessment records retain their originally calculated values — retroactive recalculation is not triggered.
FR-ADMIN-005: Audit Log Viewer
Priority: Must Have
Description: The system SHALL provide System Administrators with a full audit log viewer displaying all AuditLog records with: timestamp, user ID, user role, action type, affected record type, affected record ID, old value (JSON), new value (JSON), and IP address. The viewer SHALL support filtering by: date range, user role, action type, and record type. Results SHALL be paginated at 50 per page.
Acceptance Criteria:
Admin can filter audit logs by date range and action type and get accurate results.
Every create, update, and delete action in the system is represented in the audit log.
Audit log records are read-only — no edit or delete option is available even for Admins.
FR-ADMIN-006: System-Wide Dashboard
Priority: Must Have
Description: The system SHALL display a system-wide dashboard for System Administrators showing: total registered properties (by status), total contracts (by status), total tax assessments (by payment status), total disputes (by status), total SMS credits remaining (from AfroMessage balance API), and a citywide monthly registration trend chart for the past 12 months.
Acceptance Criteria:
All statistics on the dashboard are accurate as of midnight the previous day.
Dashboard loads within 5 seconds with all data populated.
Monthly trend chart correctly shows 12 months of data.
FR-ADMIN-007: Data Export (Full Database CSV)
Priority: Should Have
Description: The system SHALL allow System Administrators to download full CSV exports of any database table for backup and analysis purposes. Exports SHALL be available for: User, Property, RentalContract, TaxAssessment, TaxPayment, Dispute, AuditLog, and Notification tables. Exports SHALL include all columns.
Acceptance Criteria:
Admin can export any listed table as a CSV from the Admin panel.
Exported CSV contains all columns of the selected table.
Export of AuditLog with 100,000+ records completes within 60 seconds.
FR-ADMIN-008: AfroMessage SMS Balance Monitor
Priority: Should Have
Description: The system SHALL display the current AfroMessage SMS credit balance on the Admin dashboard by querying the AfroMessage balance API on page load. If the balance falls below a configurable threshold (default: 500 credits), an alert banner SHALL appear on the Admin dashboard.
Acceptance Criteria:
Balance is fetched from AfroMessage API on each Admin dashboard load.
Alert banner appears when balance falls below the configured threshold.
If AfroMessage API is unavailable, a fallback message 'Balance unavailable' is shown without crashing the dashboard.
3.11 Module REPORT — Reports & Analytics
FR-REP-001: Landlord Personal Tax Summary Report (PDF)
Priority: Must Have
Description: The system SHALL generate a downloadable PDF tax summary report for Landlords covering a selected Ethiopian fiscal year. The report SHALL list all properties owned, each with: monthly rent, gross annual rent, 20% deduction, taxable income, tax assessed, amount paid, outstanding balance, and payment date. A grand total row SHALL be included.
Acceptance Criteria:
Report is generated for the selected fiscal year within 30 seconds.
All properties with assessments in the selected year are included.
Grand total row correctly sums all tax due and paid amounts.
FR-REP-002: Woreda Monthly Registration Report (PDF + CSV)
Priority: Must Have
Description: The system SHALL generate a monthly registration report for Woreda Officers covering a selected calendar month. Report SHALL include: total properties registered, total contracts registered, total rejections (property + contract), average days to process, and a list of all registered contracts with key fields. Available as both PDF and CSV.
Acceptance Criteria:
Report generates correctly for any past calendar month within 30 seconds.
CSV version contains the same data as the PDF version.
Average processing days is calculated correctly as: mean of (authenticated_at − submission_date) in days.
FR-REP-003: Sub-City Tax Revenue Report (PDF + CSV)
Priority: Must Have
Description: The system SHALL generate a tax revenue report for Tax Officers covering a selected fiscal year and the officer's Sub-City. Report SHALL include: total tax assessed, total collected, total outstanding, collection rate percentage, breakdown by Woreda, and breakdown by payment method. Available as PDF and CSV.
Acceptance Criteria:
Report is generated for the selected fiscal year and Sub-City within 30 seconds.
Collection rate percentage is calculated as (total_collected / total_assessed) × 100.
Breakdown by Woreda correctly partitions data by all Woredas in the Sub-City.
FR-REP-004: Citywide Compliance Dashboard
Priority: Should Have
Description: The system SHALL provide System Administrators with a citywide compliance overview showing: total ACTIVE properties per Sub-City (map or bar chart), registration compliance rate (registered vs. unregistered estimates), overdue tax assessments per Sub-City, and dispute resolution rate per Woreda.
Acceptance Criteria:
Dashboard is accessible to Admin role only.
All citywide statistics are accurate as of midnight the previous day.
Bar chart correctly shows per-Sub-City breakdowns.
FR-REP-005: SIGTAS Batch Export Report
Priority: Must Have
Description: The system SHALL provide the SIGTAS-compatible CSV export function as specified in FR-PAY-008, accessible from both the Tax Officer dashboard and the Reports section.
Acceptance Criteria:
Export is accessible from the Reports menu.
Export produces a valid CSV with 13 required columns.
Export is restricted to the officer's Sub-City jurisdiction.
FR-REP-006: Dispute Resolution Statistics Report
Priority: Should Have
Description: The system SHALL generate a dispute resolution statistics report showing: total disputes filed per Woreda, breakdown by dispute type, average time to DECISION_ISSUED in working days, appeal rate percentage, and dispute closure rate. Available per month and per Sub-City.
Acceptance Criteria:
Report generates for the selected period and Sub-City within 30 seconds.
Average resolution time is computed in working days (Monday–Friday).
Appeal rate is calculated as (appealed / decision_issued) × 100.
4. Non-Functional Requirements
4.1 Performance Requirements
NFR-PERF-001: Page load time for any page in the PWA SHALL be less than 3 seconds on a 4G LTE connection (≥10 Mbps download) as measured by Chrome DevTools Performance panel.
NFR-PERF-002: API response time for all standard read queries (GET endpoints) SHALL be less than 500 milliseconds at the 95th percentile (p95) under normal load (≤100 concurrent users).
NFR-PERF-003: The system SHALL handle 500 concurrent users performing standard operations (property browsing, contract viewing, dashboard loading) without degradation in response time beyond 1 second additional latency.
NFR-PERF-004: File uploads up to 10MB SHALL complete within 30 seconds on a 4G LTE connection. Progress indicators SHALL be displayed during upload.
NFR-PERF-005: The SIGTAS CSV export for 10,000 records SHALL be generated and available for download within 10 seconds of the Tax Officer clicking 'Export'.
4.2 Security Requirements
NFR-SEC-001: All API endpoints SHALL require a valid RS256-signed JWT in the Authorization: Bearer header. Requests without a valid JWT SHALL be rejected with HTTP 401.
NFR-SEC-002: Every API endpoint SHALL check the caller's role against a predefined permission matrix. Role violations SHALL be rejected with HTTP 403.
NFR-SEC-003: All data in transit between the client, server, and external APIs SHALL be encrypted using TLS 1.2 at minimum. TLS 1.0 and 1.1 SHALL be disabled.
NFR-SEC-004: User PINs SHALL be hashed using bcrypt with a minimum cost factor of 12 before storage. Plain-text PINs SHALL never be stored or logged.
NFR-SEC-005: OTP codes SHALL expire after exactly 5 minutes from generation and SHALL be invalidated immediately after first use. Expired or used OTPs SHALL return HTTP 400.
NFR-SEC-006: After 5 consecutive failed OTP authentication attempts on the same phone number, the account SHALL be locked for 15 minutes and the user notified via SMS.
NFR-SEC-007: All uploaded files SHALL be scanned by ClamAV or equivalent open-source antivirus before being stored. Files triggering a malware alert SHALL be quarantined and an admin alert generated.
NFR-SEC-008: QR codes embedded in authenticated contract PDFs and tax clearance certificates SHALL encode an HMAC-SHA256 signed JSON payload. Tampered QR payloads SHALL fail verification on the public verification page.
NFR-SEC-009: All incoming Chapa webhook POST requests SHALL be verified using HMAC-SHA256 signature verification before processing. Failed verifications SHALL be rejected with HTTP 400 and logged as security events.
NFR-SEC-010: Personal data fields — including phone numbers, Fayda ID numbers, TINs, and income data — SHALL be stored encrypted at rest using AES-256 encryption.
NFR-SEC-011: The full AuditLog SHALL be retained for a minimum of 7 years per Tax Administration Proclamation 983/2016. No AuditLog record SHALL be modifiable or deletable.
NFR-SEC-012: The system SHALL operate on HTTPS only. All HTTP requests to port 80 SHALL be permanently redirected (HTTP 301) to HTTPS.
NFR-SEC-013: CSRF protection SHALL be enabled on all state-changing endpoints (POST, PUT, PATCH, DELETE). Django's built-in CSRF middleware SHALL be active in production.
NFR-SEC-014: All database queries SHALL use Django ORM parameterized queries only. Raw SQL string interpolation SHALL be prohibited in code reviews.
NFR-SEC-015: The OTP generation endpoint SHALL be rate-limited to a maximum of 3 requests per hour per phone number. Requests exceeding this limit SHALL return HTTP 429 with a Retry-After header.
4.3 Usability Requirements
NFR-USE-001: All Landlord and Tenant-facing user interface text, labels, error messages, and notifications SHALL be available in both Amharic (Ge'ez script) and English, switchable at any time via a language toggle.
NFR-USE-002: Woreda Officer and Tax Officer dashboards SHALL default to English with an Amharic language toggle available in the header.
NFR-USE-003: The PWA SHALL implement a mobile-first responsive design. All core user workflows (registration, contract review, signing, payment initiation) SHALL be fully completable on a 5-inch (360×640px) Android screen in portrait mode.
NFR-USE-004: The PWA SHALL be installable from the browser via the standard 'Add to Home Screen' prompt on Android and iOS without requiring the Google Play Store or Apple App Store.
NFR-USE-005: All multi-step forms (property registration, contract drafting) SHALL auto-save draft data to browser localStorage/IndexedDB every 60 seconds and restore it automatically after a browser crash or accidental navigation away.
NFR-USE-006: All critical error messages displayed to Landlords and Tenants SHALL be in Amharic as the primary language, with an English translation available via a toggle.
NFR-USE-007: All tax calculation result screens SHALL display the complete step-by-step calculation (monthly rent → gross annual → deduction → taxable income → bracket → tax due) in a clearly labeled table. No result SHALL be shown without its derivation.
NFR-USE-008: All generated contract and report PDFs SHALL be printable on A4 (210 × 297 mm) paper at standard Woreda office printer quality (300 DPI). All text, QR codes, and tables SHALL be legible when printed.
4.4 Reliability Requirements
NFR-REL-001: System uptime target is 99% during Addis Ababa business hours (Monday–Saturday, 08:00–18:00 EAT), equivalent to no more than 4.4 hours of unplanned downtime per month during business hours.
NFR-REL-002: Planned maintenance downtime SHALL be scheduled only during off-peak hours (22:00–04:00 EAT) with a minimum of 24 hours advance notice to all registered users via in-app notification.
NFR-REL-003: Automated PostgreSQL database backups SHALL run daily at 01:00 EAT. Backups SHALL be retained for a minimum of 30 days and stored in a separate geographic location from the primary server.
NFR-REL-004: The PWA Service Worker SHALL cache all unsaved form field data in IndexedDB so that a complete power outage or browser crash at the Woreda office results in zero data loss — all fields SHALL be restored when the browser is reopened.
NFR-REL-005: Failed Chapa webhook delivery attempts (network errors, timeouts) SHALL be retried automatically by the Celery task queue with exponential backoff: 30 seconds, 2 minutes, 10 minutes — for a total of 3 retry attempts before flagging for admin review.
4.5 Maintainability Requirements
NFR-MAINT-001: All Django REST Framework API endpoints SHALL be documented with OpenAPI 3.0 annotations (using drf-spectacular or equivalent) and served via an interactive Swagger UI at /api/docs/ in development and staging environments.
NFR-MAINT-002: Automated test coverage for all backend business logic modules (tax calculation, RBAC enforcement, contract lifecycle, PRN generation) SHALL achieve a minimum of 70% line coverage as measured by pytest-cov.
NFR-MAINT-003: The tax bracket table SHALL be stored as a JSON value in the SystemConfig database table (key='TAX_BRACKET_JSON') and SHALL NOT be hardcoded in the application source code. Tax calculation engine SHALL read brackets from this config at runtime.
NFR-MAINT-004: The annual rent hike ceiling percentage SHALL be stored in the SystemConfig table (key='RENT_HIKE_CEILING_PCT') and configurable by System Administrators via the admin panel without any server deployment or restart.
NFR-MAINT-005: All Python code SHALL conform to PEP 8 style guidelines enforced by flake8 in the CI pipeline. All JavaScript/React code SHALL conform to ESLint Airbnb ruleset. CI pipelines SHALL fail on lint errors.
4.6 Compliance Requirements
NFR-COMP-001: The system SHALL enforce the 30-day contract registration window per Proclamation 1320/2024 Article 22 by: (a) displaying a countdown on the contract status page, (b) sending Day 25 SMS warning, and (c) flagging as OVERDUE_REGISTRATION on Day 30.
NFR-COMP-002: The system SHALL reject any contract submission where the advance payment amount exceeds two times the monthly rent, per Proclamation 1320/2024 Article 13. This validation SHALL occur at the API level and cannot be bypassed by the client.
NFR-COMP-003: The system SHALL reject any contract with a lease duration below 24 months, per Proclamation 1320/2024 Article 6. This validation SHALL occur at the API level and cannot be bypassed by the client.
NFR-COMP-004: All tax calculations SHALL use the exact progressive tax bracket rates from Proclamation 1395/2025: 0%, 15%, 20%, 25%, 30%, 35% applied to taxable income after the 20% standard deduction for Category C taxpayers. Any change to these rates requires an Admin configuration update, not a code change.
NFR-COMP-005: All personal data collection, storage, and processing SHALL comply with Personal Data Protection Proclamation No. 1284/2023. This includes: consent recording at registration, right to access personal data, encrypted storage of sensitive fields, and a documented data retention policy.
NFR-COMP-006: All monetary audit records (TaxPayment, TaxAssessment, AuditLog) SHALL be retained for a minimum of 7 years from creation date, per Tax Administration Proclamation 983/2016. No deletion of these records SHALL be possible through any system interface.
5. External Interface Requirements
5.1 User Interfaces
5.1.1 Landlord Interfaces
Registration / Login screen — phone number entry, OTP input, PIN setup (Amharic and English)
My Properties dashboard — property cards with status badges, filter by status, sort by date
Property registration form — 3-step form (Location / Building / Financial), auto-save, document upload
My Contracts dashboard — contract cards with status, linked property, tenant name
Contract drafting form — 2-step form (Tenant Info / Financial Terms), compliance helper tooltips
Contract status tracker — countdown to registration deadline, download PDF button
Tax assessment detail view — full step-by-step calculation breakdown table
Tax payment screen — Chapa checkout button, PRN request button
Tax clearance certificate view — QR-coded certificate with download button
Tax history page — list of all assessments per property
Notification center — bell icon with unread count, notification list
Profile settings — language toggle, linked Fayda ID, active sessions management
5.1.2 Tenant Interfaces
Registration / Login screen — phone number entry, OTP input, PIN setup
Contract review screen — side-by-side Amharic/English display, all contract terms visible
OTP signing screen — 6-digit OTP input with countdown timer
My Contracts view — active contract with Registration Number, PDF download, timeline
Dispute filing form — dispute type dropdown, description textarea, evidence upload
Notification center — all system notifications
5.1.3 Woreda Officer Interfaces
Officer login screen — phone OTP login
Pending contract authentication queue — sortable, filterable list
Pending property verification queue — sortable list
Contract detail review panel — all fields, uploaded scans, compliance flags, sticky action buttons
Property review panel — all fields, uploaded documents, approve/reject buttons
Registered contracts search — multi-field filter, paginated results
Summons generation tool — form with recipient and reason, generates PDF
Walk-in assistance form — guided flow for assisted landlord registration
Grievance intake form — dispute type, parties, description, evidence upload
Woreda compliance statistics dashboard — summary stats and monthly trend chart
5.1.4 Tax Officer Interfaces
Officer login screen
Tax assessments list — filterable by status, Woreda, date; overdue highlighted
PRN confirmation panel — list of unconfirmed PRN payments with confirm button
SIGTAS CSV export tool — date range picker, Sub-City filter, download button
Tax clearance certificate issuance — assessment search, issue button
Landlord TIN/phone search — quick access to landlord profile
Multi-property landlord overview — consolidated tax position across all properties
Monthly revenue report — chart + table, PDF download
Overdue flagging view — dedicated overdue tab with days overdue badges
5.1.5 System Administrator Interfaces
Admin dashboard — system-wide statistics, monthly trend charts, SMS balance
User management table — search, filter, create, edit, deactivate users
Sub-City and Woreda configuration panel — add/edit/deactivate Sub-Cities and Woredas
System configuration panel — rent hike ceiling, tax bracket JSON, fiscal year start
Audit log viewer — searchable, filterable, paginated full audit trail
Data export panel — per-table CSV download for all database tables
Under investigation panel — flagged landlord accounts awaiting review
Tax assessment override approval queue
5.2 Hardware Interfaces
No dedicated hardware is required for the system to operate.
Woreda Officer desktop: standard PC (Windows 10+) with keyboard, mouse, and an A4 color or B&W printer for contract PDFs, registration notices, and summons letters.
Landlord / Tenant device: any Android (8+) or iOS (13+) smartphone with a Chrome or Safari browser supporting PWA installation. Minimum screen size: 5 inches.
Server: Ubuntu 20.04 LTS virtual machine with minimum 4 vCPUs, 8GB RAM, 100GB SSD.
5.3 Software Interfaces
External System
Interface Type
Purpose
Protocol / URL
Chapa Payment Gateway
REST API + Webhook (HTTPS POST)
Tax payment processing via Telebirr, CBE Birr, bank card
https://api.chapa.co/v1/
AfroMessage SMS API
REST API (HTTPS POST)
OTP delivery and all system SMS notifications
https://api.afromessage.com/api/
Fayda OIDC Mock Sandbox
OpenID Connect / OAuth 2.0
Optional landlord/tenant digital identity verification
https://github.com/National-ID-Program-Ethiopia
PostgreSQL 14+
Django ORM / psycopg2 driver
Primary relational data store for all system data
localhost:5432 / pg driver
Redis
Django cache backend / Celery broker
JWT token blacklisting, Celery task queue, OTP rate limiting
localhost:6379
ReportLab / WeasyPrint
Python library (PyPI)
PDF generation for contracts, receipts, certificates, and reports
PyPI package
qrcode Python library
Python library (PyPI)
QR code generation for contract PDFs and clearance certificates
PyPI package
ClamAV
Local UNIX socket / clamd
Antivirus scanning of all uploaded documents before storage
Local socket /var/run/clamav/clamd.ctl
Celery + Celery Beat
Python task queue
Periodic tasks: daily overdue flags, day-25/30 alerts, annual tax cycle
Redis broker
5.4 Communications Interfaces
HTTPS (TLS 1.2+): All external API calls (Chapa, AfroMessage, Fayda) and all browser-to-server communication. HTTP is redirected to HTTPS.
WebSocket (optional): Django Channels may be used for real-time in-app notification updates (bell icon badge count) without page refresh.
SMTP / SendGrid (secondary): Email notifications may be used as a secondary channel for Woreda Officers and Tax Officers who have email addresses. SMS remains the primary notification channel for all Landlords and Tenants.
Celery / Redis: Internal asynchronous task queue for periodic jobs (daily deadline checks, annual assessment cycle) and background jobs (PDF generation, SMS delivery).
6. Use Cases
This section provides complete use case specifications for the 10 primary system workflows.
UC-01: Landlord Registers a Property
Actor: Landlord
Preconditions: Landlord is authenticated (logged in with valid JWT). Landlord has a verified phone number. The Landlord account is in ACTIVE status.
Main Success Scenario:
Landlord navigates to 'My Properties' dashboard and clicks 'Register New Property'.
System presents Step 1 (Location): Landlord selects Sub-City from dropdown, selects Woreda (filtered list), enters Kebele and House Number. Landlord optionally enters Cadastral UPI.
Landlord clicks 'Next' — system validates Step 1 fields. Landlord proceeds to Step 2 (Building Details): selects Building Type, enters Number of Rooms, Floor Area in sqm, and Construction Year.
Landlord clicks 'Next' — system validates Step 2. Landlord proceeds to Step 3 (Financial Details): enters Number of Units and Monthly Rent per Unit in ETB.
Landlord uploads Title Deed document (PDF/JPG/PNG, ≤10MB). System scans with ClamAV. Upload progress bar shown.
Landlord clicks 'Submit for Review'. System validates all mandatory fields. Auto-save clears.
System creates Property record with status=PENDING_REVIEW and logs event in AuditLog.
System sends in-app notification to all Woreda Officers assigned to the selected Woreda: 'New property pending review at [address]'.
Landlord is redirected to the property detail page showing status badge: 'Pending Review'.
Alternate Flows:
4a: Title deed upload fails — file exceeds 10MB or is an unsupported format → system shows error 'File must be PDF, JPG, or PNG and under 10 MB.' Landlord selects a different file.
6a: System detects a property with the same House Number and Woreda already registered under this Landlord's account → system shows warning 'A property at this address is already registered. Do you want to continue?' Landlord can proceed or cancel.
Any step: Network error during upload → system shows 'Upload failed — please check your connection and try again.' Draft is preserved in localStorage.
Postconditions: Property record created with status=PENDING_REVIEW. Woreda Officer sees the property in their verification queue. Landlord sees the property in their dashboard with 'Pending Review' status.
Linked Requirements: FR-PROP-001, FR-PROP-002, FR-PROP-003, FR-PROP-004, FR-PROP-005, FR-NOTIF-011
UC-02: Landlord Drafts and Submits a Rental Contract
Actor: Landlord
Preconditions: Landlord is authenticated. A property owned by the Landlord is in ACTIVE status. The Landlord has the Tenant's Ethiopian phone number.
Main Success Scenario:
Landlord navigates to 'My Properties', selects an ACTIVE property, and clicks 'Draft New Contract'.
System presents Contract Drafting Step 1 (Tenant Information): Landlord enters Tenant phone number (+251 format). System checks if the phone belongs to a registered user and pre-fills name if found.
System presents Step 2 (Contract Terms): Landlord enters Agreed Monthly Rent in ETB, Advance Payment in ETB, Lease Start Date (date picker with both calendar formats), Lease Duration in months, and selects Payment Method.
System validates: Advance Payment ≤ 2 × Monthly Rent (FR-CONT-002) and Lease Duration ≥ 24 months (FR-CONT-001). Shows helper text showing maximum allowed advance payment as landlord types.
System auto-populates property details (address, building type, rooms) as read-only fields.
Landlord reviews all terms and clicks 'Submit for Tenant Review'.
System creates RentalContract record with status=PENDING_TENANT_SIGNATURE and records submission_to_tenant_date.
System sends SMS to Tenant phone number with secure 7-day review link (FR-NOTIF-004).
Landlord is redirected to contract detail page showing status: 'Awaiting Tenant Signature'.
Alternate Flows:
4a: Advance payment exceeds 2× monthly rent → system immediately shows red validation error: 'Advance payment exceeds the legal maximum (Proclamation 1320/2024 Art. 13). Maximum: ETB [2 × rent].' Submit button remains disabled.
4b: Lease duration is less than 24 months → system shows red error: 'Minimum lease duration is 24 months per Proclamation 1320/2024 Art. 6.' Submit button remains disabled.
8a: AfroMessage SMS delivery fails after 3 retries → system shows admin alert and Landlord sees: 'SMS delivery failed. The tenant will need to access the contract via their dashboard or you may share the link manually.'
Postconditions: RentalContract record created with status=PENDING_TENANT_SIGNATURE. Tenant receives SMS with review link. Landlord's dashboard shows contract in 'Awaiting Tenant Signature' status. 30-day countdown begins from signing_date (not yet — countdown starts after tenant signs).
Linked Requirements: FR-CONT-001, FR-CONT-002, FR-CONT-003, FR-CONT-004, FR-PROP-003
UC-03: Tenant Reviews and Digitally Signs a Contract
Actor: Tenant
Preconditions: Tenant has received an SMS with a secure review link. The RentalContract is in PENDING_TENANT_SIGNATURE status. The secure link has not expired (within 7 days).
Main Success Scenario:
Tenant taps the SMS link. Browser opens the contract review page (no login required — link is authenticated).
System displays all contract terms in Amharic and English side-by-side: property address, landlord name, monthly rent, advance payment, lease dates, lease duration, payment method.
System displays compliance notes: minimum 24-month lease confirmed, advance payment within legal cap, payment via formal bank channel as required.
Tenant reads all terms carefully. If Tenant needs to ask the Landlord about any terms, they can contact the Landlord using the displayed phone number.
Tenant clicks 'Sign Contract'. System shows confirmation modal: 'By signing, you confirm you have read and agreed to all terms listed.'
Tenant clicks 'Confirm'. System calls AfroMessage API to send 6-digit signing OTP to Tenant's phone number.
Tenant enters 6-digit OTP within 5 minutes.
System verifies OTP (single-use, not expired). Sets contract status=SIGNED, records signing_date (UTC timestamp), starts 30-day registration countdown.
System shows confirmation screen: 'Contract signed successfully. The Landlord will now register the contract at the Woreda Housing Office. You will be notified when it is officially registered.'
Alternate Flows:
7a: OTP expires (5-minute timer runs out) → system shows: 'OTP expired. Request a new OTP.' Tenant clicks 'Resend OTP' and a new code is sent. (Old OTP is invalidated.)
7b: Tenant enters wrong OTP 3 times → system shows: 'Incorrect OTP. [2] attempts remaining.' After 5 failures, account is locked for 15 minutes.
1a: Secure link is expired (7+ days) → system shows: 'This review link has expired. Please ask the Landlord to resend the contract review invitation.'
Postconditions: RentalContract status changed to SIGNED. Signing timestamp recorded. 30-day registration countdown begins. Landlord receives in-app notification: 'Tenant [name] has signed the contract for [property address].'
Linked Requirements: FR-CONT-005, FR-CONT-006, FR-CONT-007, FR-AUTH-003, FR-NOTIF-004
UC-04: Woreda Officer Authenticates and Registers a Contract
Actor: Woreda Housing Officer
Preconditions: Woreda Housing Officer is authenticated and their account is assigned to the relevant Woreda. The RentalContract is in PENDING_AUTHENTICATION status for a property in the officer's Woreda. The Landlord has submitted the contract for Woreda review.
Main Success Scenario:
Officer opens their dashboard and sees the contract in the 'Pending Authentication' queue.
Officer clicks on the contract. System opens the contract detail review panel.
Officer reviews: all contract terms, uploaded title deed scan (viewed full-screen by clicking), uploaded landlord ID scan, uploaded tenant ID scan.
System automatically checks and displays compliance flags: Advance Payment Cap (≤ 2× rent), Lease Duration (≥ 24 months), Rent Hike Cap (for renewals). All flags show green checkmarks if compliant.
Officer verifies property ownership by visually inspecting the title deed scan and comparing with the property address in the contract.
If all checks pass, officer clicks 'Authenticate & Register'. Confirmation dialog appears showing: Property, Landlord, Tenant, Rent ETB, Lease Start, Lease End.
Officer clicks 'Confirm'. System generates Contract Registration Number (format: BC-05-2026-000342), records officer ID, name, and timestamp.
System triggers: (a) QR-coded contract PDF generation, (b) TaxAssessment creation (FR-TAX-001), (c) Registration Notice PDF generation.
System sends SMS to both Landlord and Tenant with Registration Number and PDF download link (FR-NOTIF-005). Contract disappears from the pending queue.
Alternate Flows:
4a: Compliance flag detected — Advance payment exceeds 2× monthly rent → system shows red banner: 'Advance Payment Cap Violation'. Officer can still proceed if they determine it is a data error, but action is logged.
5a: Officer has concerns about the title deed → Officer clicks 'Reject', enters reason: 'Title deed document appears to be for a different address — please upload the correct document.' Both parties receive SMS with rejection reason.
7a: PDF generation fails (service error) → system retries 3 times automatically. If all retries fail, Admin is alerted and officer sees: 'PDF generation failed — Admin has been notified.' Contract remains in REGISTERED state.
Postconditions: Contract status = REGISTERED. Contract Registration Number generated and stored. QR-coded PDF generated and accessible. TaxAssessment created automatically. Both Landlord and Tenant notified via SMS. Registration Notice PDF available for printing.
Linked Requirements: FR-CONT-008, FR-CONT-009, FR-CONT-010, FR-CONT-012, FR-TAX-001, FR-NOTIF-005, FR-WOREDA-005
UC-05: Landlord Pays Annual Rental Income Tax via Chapa
Actor: Landlord
Preconditions: Landlord is authenticated. A TaxAssessment record exists for one of their properties with status=PENDING. The Landlord has a Telebirr, CBE Birr, or bank card account.
Main Success Scenario:
Landlord opens 'Tax Assessment' page. System displays full tax calculation breakdown including Tax Due in ETB and Payment Due Date.
Landlord clicks 'Pay Tax Online (Chapa)'.
Django backend calls Chapa POST /transaction/initialize with: amount, currency='ETB', tx_ref (unique payment ID), callback_url, return_url.
Chapa API returns checkout_url. System sets TaxPayment status=PROCESSING and redirects browser to Chapa hosted checkout page.
Landlord selects payment method on Chapa checkout: Telebirr / CBE Birr / Awash Bank / Visa / Mastercard.
Landlord completes the payment on Chapa's page (enters Telebirr PIN or card details).
Chapa sends a POST webhook to the system's /api/payments/chapa/webhook/ endpoint.
System verifies HMAC-SHA256 signature (FR-PAY-006). Sets TaxPayment status=CONFIRMED. Triggers Tax Clearance Certificate generation.
System sends Landlord SMS: 'Your tax payment of ETB [amount] has been confirmed. Download your receipt and Tax Clearance Certificate: [link]' (FR-NOTIF-009).
Alternate Flows:
6a: Landlord abandons the Chapa checkout page without completing payment → Chapa sends a 'failed' webhook → system sets TaxPayment status=FAILED → Landlord receives failure SMS → 'Retry Payment' button appears on assessment page.
7a: Chapa webhook delivery fails (network error) → Celery retries with exponential backoff (30s, 2m, 10m) → If all retries fail, Admin is alerted and Tax Officer can manually confirm payment via PRN panel.
3a: Chapa API is unavailable → system shows: 'Online payment is currently unavailable. Please use the PRN option to pay at a bank or via Telebirr.' PRN request button is displayed.
Postconditions: TaxPayment status=CONFIRMED. TaxAssessment status=PAID. Tax Clearance Certificate generated. Payment receipt PDF generated. Landlord notified via SMS with download links.
Linked Requirements: FR-PAY-001, FR-PAY-003, FR-PAY-004, FR-PAY-006, FR-TAX-002, FR-TAX-008, FR-NOTIF-009
UC-06: Landlord Requests PRN and Pays at Bank Counter
Actor: Landlord
Preconditions: Landlord is authenticated. A TaxAssessment exists with status=PENDING. Landlord does not have a Telebirr or bank card account, or prefers to pay in person.
Main Success Scenario:
Landlord opens 'Tax Assessment' page and clicks 'Request Payment Reference Number (PRN)'.
System generates a unique PRN in format PRN-[WoredaCode]-[YYYYMMDD]-[XXXXXX].
System creates TaxPayment record with status=PROCESSING, stores PRN linked to TaxAssessment.
System sends SMS to Landlord with PRN and payment instructions: 'Go to any CBE, Awash, or Dashen Bank branch, or open Telebirr *127# and enter this PRN to pay your tax of ETB [amount].'
Landlord visits bank branch, presents the PRN to the teller, and pays the amount.
Landlord returns to the Woreda Tax Office with the bank payment receipt (printed or screenshot).
Tax Officer opens the PRN reconciliation panel, finds the PRN, and reviews the presented receipt.
Tax Officer clicks 'Confirm PRN Payment'. System sets TaxPayment status=CONFIRMED and triggers Tax Clearance Certificate generation (FR-TAX-008).
Landlord receives SMS confirmation with receipt and certificate download links (FR-NOTIF-009).
Alternate Flows:
1a: Landlord already has an active PRN for this assessment (PROCESSING) → system shows: 'A Payment Reference Number is already active for this assessment: PRN-05-20260914-001234. It is valid until [expiry date].' No new PRN is generated.
6a: Bank cannot find the PRN in their system → Landlord contacts the system support. Admin verifies and may reissue PRN if the original has expired (30-day validity).
Postconditions: TaxPayment status=CONFIRMED. TaxAssessment status=PAID. Tax Clearance Certificate generated. Landlord receives confirmation SMS.
Linked Requirements: FR-PAY-002, FR-PAY-007, FR-TAX-008, FR-TAXOFF-004, FR-NOTIF-009
UC-07: Tax Officer Exports SIGTAS CSV for Batch Import
Actor: Tax Officer
Preconditions: Tax Officer is authenticated and assigned to a Sub-City. Multiple TaxPayment records in CONFIRMED status exist for the officer's Sub-City in the target date range.
Main Success Scenario:
Tax Officer navigates to 'Reports' → 'SIGTAS Export'.
System displays: Sub-City (pre-filled, read-only — officer's jurisdiction), Date Range picker (From / To).
Officer selects a date range (e.g., August 1–31, 2026) and clicks 'Generate Export'.
System queries all TaxPayment records with status=CONFIRMED, payment_date within the range, and property in the officer's Sub-City.
System generates a CSV file with exactly 13 columns: TIN, Taxpayer Name, Property ID, Fiscal Year, Gross Rent ETB, Deduction ETB, Taxable Income ETB, Tax Due ETB, Amount Paid ETB, Payment Date, Payment Method, Payment Reference, Assessment Period.
Browser triggers a file download: SIGTAS_Export_[SubCity]_[FromDate]_[ToDate].csv.
Officer opens the CSV file and verifies record count matches the display.
Officer logs in to their SIGTAS terminal at the Sub-City office and imports the CSV using SIGTAS's standard batch import function.
Alternate Flows:
3a: No CONFIRMED payments exist for the selected date range → system displays: 'No confirmed payments found for this period. The CSV export is empty.' Officer can adjust the date range.
6a: Export for 10,000+ records takes longer than 10 seconds → system shows a loading spinner and progress indicator. Export is prepared in the background and a download link is provided.
Postconditions: SIGTAS-compatible CSV file downloaded to officer's computer. Officer has the data needed to import into SIGTAS for official tax recording.
Linked Requirements: FR-TAXOFF-005, FR-PAY-008, FR-REP-005
UC-08: Tenant Files a Dispute Against Landlord
Actor: Tenant
Preconditions: Tenant is authenticated. An active REGISTERED contract exists between the Tenant and Landlord. The Tenant has experienced a violation (e.g., unlawful rent increase notice).
Main Success Scenario:
Tenant navigates to 'My Contracts', selects the relevant contract, and clicks 'File a Dispute'.
System presents Dispute Filing Form. Tenant selects Dispute Type from dropdown: UNLAWFUL_RENT_INCREASE.
Tenant enters a description of at least 100 characters explaining the incident.
Tenant enters the incident date using the date picker.
Tenant optionally uploads supporting evidence (photo of rent increase notice as JPG).
Tenant optionally links the dispute to the active contract (pre-filled from the contract context).
Tenant reviews the form and clicks 'Submit Dispute'.
System creates a Dispute record with status=FILED, records filed_by=Tenant, against_user_id=Landlord, linked to the contract and property.
System automatically assigns the dispute to the Woreda Officer for the property's Woreda.
System sends in-app notification and SMS to the assigned Woreda Officer (FR-DISP-002). Tenant sees confirmation: 'Dispute filed successfully. Reference: DISP-2026-001234.'
Alternate Flows:
3a: Description is fewer than 100 characters → system shows real-time character count: '[X]/100 characters minimum required' and the Submit button remains disabled.
5a: Evidence file exceeds 5MB or is an unsupported format → system shows format/size error and allows reselection.
8a: No Woreda Officer is assigned to the relevant Woreda → dispute is assigned to the nearest Sub-City Admin and an alert is sent to System Admin.
Postconditions: Dispute record created with status=FILED. Woreda Officer assigned and notified. Tenant and Landlord both receive SMS and in-app notification of the filing.
Linked Requirements: FR-DISP-001, FR-DISP-002, FR-DISP-003, FR-DISP-008, FR-NOTIF-010
UC-09: System Triggers 30-Day Registration Deadline Alert
Actor: System (Automated Celery Task)
Preconditions: One or more RentalContracts are in SIGNED status with signing_date more than 24 days ago. The daily Celery Beat task is scheduled to run at 07:00 EAT every day.
Main Success Scenario:
Celery Beat scheduler triggers the check_registration_deadlines task at 07:00 EAT.
Task queries all RentalContracts where status=SIGNED AND signing_date = today − 25 days.
For each contract found on Day 25: task calls AfroMessage API to send Day-25 warning SMS to Landlord in Amharic: 'You have 5 days left to register your rental contract (Reg. Deadline: [date]). Visit your Woreda Housing Office immediately. — Proclamation 1320/2024.'
Task creates a Notification record for each Day-25 alert sent, type='DEADLINE_WARNING_DAY25'.
Task queries all RentalContracts where status=SIGNED AND signing_date = today − 30 days.
For each contract found on Day 30: task sends escalation SMS to Landlord. Task sets contract OVERDUE_REGISTRATION flag=True.
Task sends in-app notification to the relevant Woreda Officer listing all newly overdue contracts in their Woreda.
Task logs all actions to the system log with count of Day-25 and Day-30 alerts sent.
Alternate Flows:
2a: AfroMessage API is unavailable → task logs failure, marks SMS as failed in Notification table, and retries 3 times at 30-minute intervals.
5a: Contract moves to REGISTERED status between task scheduling and execution → task skips it (query condition ensures SIGNED status at query time).
Postconditions: Day-25 warning SMS sent to all Landlords with contracts at Day 25. Day-30 escalation SMS sent and OVERDUE_REGISTRATION flag set for all Day-30 contracts. Woreda Officers notified of overdue contracts. All actions logged.
Linked Requirements: FR-CONT-007, FR-NOTIF-002, FR-NOTIF-003
UC-10: Woreda Officer Performs Walk-In Assisted Registration
Actor: Woreda Housing Officer + Walk-In Landlord
Preconditions: A Landlord is physically present at the Woreda Housing Office with their title deed, national ID, and a verbal or written agreement with a Tenant. The Landlord does not have a smartphone or a registered system account. The Officer is authenticated.
Main Success Scenario:
Officer opens the 'Walk-In Assistance' mode from the officer dashboard.
Officer creates a new Landlord account: enters Landlord's full name (Amharic and English), phone number, and PIN on the Landlord's behalf. System creates account with ASSISTED_MODE flag.
Officer proceeds to Property Registration: enters all property details (address, building type, rooms, rent) from the physical documents. Uploads scanned title deed from the office scanner.
Officer submits property for registration. System creates Property record in PENDING_REVIEW status.
In assisted mode, the Officer can immediately approve the property (bypassing the normal queue) since they are physically present and have already verified the documents. Property status → ACTIVE.
Officer proceeds to Contract Drafting: enters contract terms from the written agreement. Enters Tenant phone number.
Officer sends SMS to Tenant for signing. If Tenant is also physically present, Officer can enter the OTP on the Tenant's behalf after reading it to them.
Tenant signs (OTP entered). Contract status → SIGNED.
Officer immediately authenticates the contract (since they are the reviewing officer and all documents are present). Contract status → REGISTERED. Registration Number generated. QR PDF generated.
Officer prints the Registration Notice PDF and the QR Contract PDF and hands physical copies to the Landlord.
Alternate Flows:
7a: Tenant is not physically present and does not respond to the SMS within the session → Officer records the contract as PENDING_TENANT_SIGNATURE. Landlord is advised to return when the Tenant is available to sign.
3a: Scanner is unavailable → Officer photographs the title deed with their phone and uploads via the officer dashboard's mobile-compatible upload interface.
Postconditions: Landlord account created. Property registered and ACTIVE. Contract SIGNED, PENDING_AUTHENTICATION (or immediately REGISTERED if same-session). QR Contract PDF and Registration Notice PDF printed and handed to Landlord. All actions logged with ASSISTED_MODE=True.
Linked Requirements: FR-WOREDA-011, FR-PROP-001, FR-PROP-002, FR-CONT-001, FR-CONT-006, FR-CONT-010, FR-WOREDA-005
7. Data Model — Entity Descriptions
The following table describes all system entities with their key attributes, data types, and relationships.
Entity
Key Attributes
Relationships
User
id (UUID PK), phone_number (unique, encrypted), fayda_id (nullable, encrypted), full_name_amharic, full_name_english, email (nullable), pin_hash (bcrypt), role (ENUM: LANDLORD/TENANT/WOREDA_OFFICER/TAX_OFFICER/ADMIN), is_active (bool), assigned_sub_city_id (FK nullable), assigned_woreda_id (FK nullable), created_at, updated_at
Has many Properties (if LANDLORD). Has many RentalContracts (as landlord or tenant). Has many Disputes (filed or assigned). Has many Notifications.
Property
id (UUID PK), landlord_id (FK User), sub_city_id (FK SubCity), woreda_id (FK Woreda), kebele, house_number, cadastral_upi (nullable), building_type (ENUM: APARTMENT/VILLA/CONDOMINIUM/TRADITIONAL/COMMERCIAL_RESIDENTIAL), num_rooms (int), floor_area_sqm (decimal), construction_year (int), num_units_rented (int), monthly_rent_etb (decimal), title_deed_file_path, status (ENUM: DRAFT/PENDING_REVIEW/ACTIVE/SUSPENDED/ARCHIVED), verified_by (FK User nullable), verified_at (timestamp nullable), created_at, updated_at
Belongs to User (Landlord). Belongs to SubCity and Woreda. Has many RentalContracts.
RentalContract
id (UUID PK), property_id (FK Property), landlord_id (FK User), tenant_id (FK User), monthly_rent_etb (decimal), advance_payment_etb (decimal), lease_start_date (date), lease_duration_months (int), payment_method (ENUM: BANK_TRANSFER/TELEBIRR/CBE_BIRR), status (ENUM: DRAFT/PENDING_TENANT_SIGNATURE/SIGNED/PENDING_AUTHENTICATION/REGISTERED/REJECTED/TERMINATED/EXPIRED), signing_date (timestamp nullable), registration_deadline (date nullable), registration_number (unique nullable), qr_contract_pdf_path (nullable), authenticated_by (FK User nullable), authenticated_at (timestamp nullable), rejection_reason (nullable), overdue_registration_flag (bool), parent_contract_id (FK self nullable), is_assisted_mode (bool), created_at, updated_at
Belongs to Property, Landlord (User), Tenant (User). Has one TaxAssessment. Has many AuditLog entries. Optionally links to parent RentalContract (for renewals).
TaxAssessment
id (UUID PK), contract_id (FK RentalContract), landlord_id (FK User), property_id (FK Property), fiscal_year (string e.g. '2025/2026'), gross_annual_rent_etb (decimal), deduction_etb (decimal), deduction_type (ENUM: STANDARD/ACTUAL), taxable_income_etb (decimal), tax_due_etb (decimal), effective_rate_pct (decimal), status (ENUM: PENDING/PAID/OVERDUE/WAIVED), due_date (date), assessment_pdf_path (nullable), late_interest_etb (decimal default 0), total_outstanding_etb (decimal), created_at, updated_at
Belongs to RentalContract, Property, Landlord. Has many TaxPayments. Has one TaxClearance.
TaxPayment
id (UUID PK), assessment_id (FK TaxAssessment), amount_paid_etb (decimal), payment_method (ENUM: CHAPA_TELEBIRR/CHAPA_CBE/CHAPA_CARD/PRN_BANK/PRN_TELEBIRR/MANUAL), chapa_transaction_id (nullable), chapa_tx_ref (unique nullable), prn_code (nullable), prn_expiry_date (date nullable), payment_date (timestamp nullable), confirmed_by (FK User nullable), confirmed_at (timestamp nullable), receipt_pdf_path (nullable), status (ENUM: PENDING/PROCESSING/CONFIRMED/FAILED/REFUNDED), created_at, updated_at
Belongs to TaxAssessment. May be confirmed by a User (Tax Officer).
TaxClearance
id (UUID PK), assessment_id (FK TaxAssessment UNIQUE), payment_id (FK TaxPayment), landlord_id (FK User), property_id (FK Property), fiscal_year, certificate_number (unique), issued_by (FK User nullable), issued_at (timestamp), qr_clearance_pdf_path, qr_hmac_sig
Belongs to TaxAssessment (one-to-one). Linked to TaxPayment.
Dispute
id (UUID PK), filed_by (FK User), against_user_id (FK User nullable), contract_id (FK RentalContract nullable), property_id (FK Property nullable), dispute_type (ENUM: UNLAWFUL_RENT_INCREASE/ILLEGAL_EVICTION_NOTICE/UNREGISTERED_CONTRACT/UTILITY_DISCONNECTION/DEPOSIT_NOT_RETURNED/OTHER), description (text min 100 chars), incident_date (date), evidence_file_paths (JSON array), assigned_to (FK User nullable), status (ENUM: FILED/UNDER_REVIEW/DECISION_ISSUED/APPEALED/CLOSED), ruling_text (text nullable), ruling_date (timestamp nullable), appeal_deadline (date nullable), woreda_id (FK Woreda), created_at, updated_at
Filed by a User. Optionally linked to RentalContract and Property. Assigned to a Woreda Officer (User). Has many DisputeAuditLog events.
Notification
id (UUID PK), user_id (FK User), type (ENUM: OTP_DELIVERY/DEADLINE_WARNING_DAY25/DEADLINE_BREACH_DAY30/TENANT_REVIEW_REQUEST/AUTH_APPROVED/AUTH_REJECTED/TAX_ISSUED/TAX_REMINDER/TAX_CONFIRMED/DISPUTE_UPDATE/SYSTEM_INFO), message_amharic (text), message_english (text), sms_sent (bool), sms_sent_at (timestamp nullable), sms_attempts (int default 0), in_app_read (bool default False), read_at (timestamp nullable), related_record_type (string), related_record_id (UUID), created_at
Belongs to User. References a related record (polymorphic).
AuditLog
id (UUID PK), user_id (FK User nullable), user_role (string), action (ENUM: CREATE/UPDATE/DELETE/AUTHENTICATE/REJECT/APPROVE/LOGIN/LOGOUT/SECURITY_EVENT/ASSISTED_MODE), record_type (string — model name), record_id (UUID), old_value (JSON nullable), new_value (JSON nullable), ip_address (string), user_agent (string nullable), is_assisted_mode (bool), created_at (immutable timestamp)
Read-only. References any record type. Cannot be modified or deleted.
SubCity
id (int PK), name_amharic, name_english, code (2-char unique e.g. 'YK' for Yeka)
Has many Woredas. Referenced by User (officer assignment), Property.
Woreda
id (int PK), sub_city_id (FK SubCity), name_amharic, name_english, woreda_code (3-digit unique within Sub-City), is_active (bool)
Belongs to SubCity. Has many Properties. Has many Users (officers).
SystemConfig
id (int PK), key (string UNIQUE e.g. RENT_HIKE_CEILING_PCT / TAX_BRACKET_JSON / FISCAL_YEAR_START), value (text), description (text), updated_by (FK User), updated_at (timestamp)
Global configuration. Modified via Admin panel only. Changes logged in AuditLog.
8. Appendices
Appendix A: Schedule B Tax Calculation Examples
These worked examples use the exact tax brackets from Proclamation 1395/2025 and the 20% standard deduction applicable to Category C taxpayers (individual landlords with annual rental income below ETB 500,000 who do not maintain accounting books).
Example A1: Low-Income Rental (Monthly Rent ETB 2,500)
Calculation Step
Formula
Amount (ETB)
Monthly Rent
Given
2,500.00
Gross Annual Rent
2,500 × 12
30,000.00
Standard Deduction (20%)
30,000 × 20%
6,000.00
Taxable Income
30,000 − 6,000
24,000.00
Tax on 0–24,000 ETB bracket (0%)
24,000 × 0%
0.00
Total Annual Tax Due
—
0.00
Effective Tax Rate
0 / 30,000 × 100%
0.00%
Example A2: Mid-Range Rental (Monthly Rent ETB 5,000)
Calculation Step
Formula
Amount (ETB)
Monthly Rent
Given
5,000.00
Gross Annual Rent
5,000 × 12
60,000.00
Standard Deduction (20%)
60,000 × 20%
12,000.00
Taxable Income
60,000 − 12,000
48,000.00
Tax on first 24,000 ETB (0%)
24,000 × 0%
0.00
Tax on next 24,000 ETB (24,001–48,000 at 15%)
24,000 × 15%
3,600.00
Total Annual Tax Due
0 + 3,600
3,600.00
Effective Tax Rate
3,600 / 60,000 × 100%
6.00%
Example A3: High-Range Rental (Monthly Rent ETB 15,000)
Calculation Step
Formula
Amount (ETB)
Monthly Rent
Given
15,000.00
Gross Annual Rent
15,000 × 12
180,000.00
Standard Deduction (20%)
180,000 × 20%
36,000.00
Taxable Income
180,000 − 36,000
144,000.00
Tax on 0–24,000 ETB (0%)
24,000 × 0%
0.00
Tax on 24,001–48,000 ETB (15%)
24,000 × 15%
3,600.00
Tax on 48,001–84,000 ETB (20%)
36,000 × 20%
7,200.00
Tax on 84,001–120,000 ETB (25%)
36,000 × 25%
9,000.00
Tax on 120,001–144,000 ETB (30%)
24,000 × 30%
7,200.00
Total Annual Tax Due
0+3,600+7,200+9,000+7,200
27,000.00
Effective Tax Rate
27,000 / 180,000 × 100%
15.00%
Appendix B: SIGTAS CSV Export Format
The following table defines the columns in the SIGTAS-compatible CSV batch upload file (Schedule B individual landlord template):
Column #
Column Name
Data Type
Example Value
Source Field
1
TIN
String (10 chars)
0021345678
User.tin (or fayda_id-derived TIN)
2
Taxpayer Name
String
Abebe Girma
User.full_name_english
3
Property ID
UUID String
3fa85f64-...
Property.id
4
Fiscal Year
String
2025/2026
TaxAssessment.fiscal_year
5
Gross Rent ETB
Decimal (2dp)
60000.00
TaxAssessment.gross_annual_rent_etb
6
Deduction ETB
Decimal (2dp)
12000.00
TaxAssessment.deduction_etb
7
Taxable Income ETB
Decimal (2dp)
48000.00
TaxAssessment.taxable_income_etb
8
Tax Due ETB
Decimal (2dp)
3600.00
TaxAssessment.tax_due_etb
9
Amount Paid ETB
Decimal (2dp)
3600.00
TaxPayment.amount_paid_etb
10
Payment Date
Date (YYYY-MM-DD)
2026-08-15
TaxPayment.payment_date
11
Payment Method
String (ENUM)
CHAPA_TELEBIRR
TaxPayment.payment_method
12
Payment Reference
String
CHX-2026-001234
TaxPayment.chapa_tx_ref or prn_code
13
Assessment Period
String
2025/2026 Q1
TaxAssessment.fiscal_year + period
Appendix C: Addis Ababa Sub-City and Woreda Reference List
All 11 Sub-Cities of Addis Ababa and their Woreda codes (to be pre-seeded in the SubCity and Woreda tables):
Sub-City
Code
Woredas
Lemi-Kura
LK
01, 02, 03, 04, 05, 06, 07, 08
Yeka
YK
01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13
Bole
BL
01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11
Kirkos
KR
01, 02, 03, 04, 05, 06, 07, 08, 09, 10
Nifas Silk-Lafto
NS
01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11
Kolfe-Keranio
KK
01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15
Gulele
GL
01, 02, 03, 04, 05, 06, 07, 08, 09, 10
Lideta
LD
01, 02, 03, 04, 05, 06, 07, 08
Addis Ketema
AK
01, 02, 03, 04, 05, 06, 07, 08, 09, 10
Arada
AR
01, 02, 03, 04, 05, 06, 07, 08
Akaki-Kality
AC
01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13
Appendix D: Contract Registration Number Format
Format: [SubCityCode]-[WoredaCode]-[YYYY]-[XXXXXX]
SubCityCode: 2-character Sub-City code (e.g., BL for Bole, YK for Yeka)
WoredaCode: 2-digit zero-padded Woreda number within the Sub-City (e.g., 05)
YYYY: 4-digit Gregorian year of registration
XXXXXX: 6-digit zero-padded sequential number, resetting to 000001 at start of each year per Woreda
Example: BL-05-2026-000342 (Bole Sub-City, Woreda 05, year 2026, sequential #342)
Example: YK-03-2026-001089 (Yeka Sub-City, Woreda 03, year 2026, sequential #1089)
Appendix E: PRN (Payment Reference Number) Format
Format: PRN-[WoredaCode]-[YYYYMMDD]-[XXXXXX]
PRN: Fixed prefix
WoredaCode: 2-digit zero-padded Woreda code within the landlord's property Woreda
YYYYMMDD: Date of PRN generation in Gregorian format
XXXXXX: 6-digit zero-padded sequential number, resetting daily per Woreda
Example: PRN-05-20260914-001234 (Woreda 05, generated Sep 14 2026, sequential #1234)
PRN validity: 30 calendar days from generation date
After expiry: Landlord must request a new PRN; expired PRN cannot be used for payment
Appendix F: QR Code Content Structure (Authenticated Contract PDF)
The QR code embedded in all authenticated contract PDFs encodes a Base64-encoded, HMAC-SHA256 signed JSON payload with the following structure:
{  "version": "1.0",  "contract_id": "<UUID of RentalContract>",  "registration_number": "<e.g. BL-05-2026-000342>",  "landlord_tin": "<Landlord TIN>",  "landlord_name": "<Landlord full name in English>",  "tenant_name": "<Tenant full name in English>",  "property_id": "<UUID of Property>",  "property_address": "<Sub-City, Woreda, Kebele, House Number>",  "monthly_rent_etb": 5000.00,  "lease_start_date": "2026-09-01",  "lease_end_date": "2028-08-31",  "registered_at": "2026-08-15T10:30:00Z",  "registered_by_officer": "<Officer full name>",  "registered_by_woreda": "Bole Sub-City, Woreda 05",  "verification_url": "https://idhrts.et/verify/contract/<registration_number>",  "hmac_sig": "<HMAC-SHA256 hex digest of all above fields using server secret key>"}
Verification process: Scanning the QR code opens the verification_url (public page, no login required). The server recomputes the HMAC signature using the stored contract data and the server secret key. If the recomputed signature matches the hmac_sig in the payload, the page displays: '✓ AUTHENTIC — This contract was registered by the Addis Ababa Housing Authority.' If the signatures do not match, the page displays: '✗ INVALID — This QR code may have been tampered with.'
Appendix G: Dispute Types Reference
Dispute Type Code
Display Name (English)
Display Name (Amharic)
Description
UNLAWFUL_RENT_INCREASE
Unlawful Rent Increase
ሕገወጥ የቤት ኪራይ ጭማሪ
Landlord has increased rent beyond the legal annual ceiling or without proper notice
ILLEGAL_EVICTION_NOTICE
Illegal Eviction Notice
ሕገወጥ የማስለቀቅ ማሳወቂያ
Landlord has issued an eviction notice without legal grounds under Proclamation 1320/2024
UNREGISTERED_CONTRACT
Unregistered Contract
ያልተመዘገበ ውል
Landlord has refused or failed to register the signed contract at the Woreda office
UTILITY_DISCONNECTION
Utility Disconnection
አገልግሎት ማቋረጥ
Landlord has disconnected water, electricity, or other utilities as a means of eviction
DEPOSIT_NOT_RETURNED
Deposit Not Returned
ቅድሚያ ክፍያ ያልተመለሰ
Landlord has not returned the advance deposit after lease termination without legal justification
OTHER
Other
ሌላ
Any other dispute not covered by the above categories
8. Requirements Traceability Matrix (RTM)
This matrix maps the primary functional requirements to their corresponding use cases, data entities, and external interfaces to ensure full traceability and testability.
Req ID
Requirement Summary
Use Case
Data Entity
Interface/API
Verification
FR-AUTH-001
User Registration (Phone + PIN + OTP)
N/A
User
AfroMessage SMS
User Profile Test
FR-AUTH-003
Standard Login (Phone + PIN)
N/A
User
N/A
JWT validation
FR-PROP-001
Property Registration Form
UC-01
Property
N/A
Form submission
FR-CONT-001
Contract Drafting & Validation
UC-02
RentalContract
N/A
Logic bounds check
FR-CONT-006
Tenant Digital Signing (OTP)
UC-03
RentalContract
AfroMessage SMS
OTP matching
FR-CONT-010
Contract Authentication
UC-04
RentalContract
N/A
Status == REGISTERED
FR-TAX-001
Auto Tax Calculation
UC-04
TaxAssessment
N/A
Math check
FR-PAY-001
Chapa Payment
UC-05
TaxPayment
Chapa Gateway
Webhook processing
FR-PAY-008
SIGTAS CSV Export
UC-07
TaxPayment
SIGTAS CSV
Format validation
FR-DISP-001
Dispute Filing
UC-08
Dispute
N/A
Creation check
FR-WOREDA-011
Walk-in Registration (Assisted)
UC-10
User, Property
N/A
Audit log ASSISTED_MODE