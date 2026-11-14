# Biashara Rahisi
## Maelezo ya Mahitaji ya Programu — Rasimu v0.1

**Status:** Development baseline  
**Target market:** Tanzanian small and medium-sized businesses  
**Product:** Secure multi-tenant business management web application  
**Research status:** Field validation deferred; this is an implementation baseline.

## 1. Overview

TBMS is a modular platform for managing commercial, financial, operational, employee, and service activities for businesses in Tanzania. It supports retail, wholesale, hospitality, professional services, personal services, and related models.

## 2. Objectives

1. Maintain consistent business transaction records.
2. Support accountable sales, purchasing, inventory, and expense workflows.
3. Show revenue, expenditure, cash, liabilities, receivables, and profitability clearly.
4. Restrict access according to user responsibilities and organization membership.
5. Provide modular employee and service-management capabilities.
6. Support Kiswahili and English interfaces.
7. Preserve an audit history for important financial and administrative actions.

## 3. Users and Roles

- Platform administrator
- Business owner
- Business manager
- Cashier or sales operator
- Inventory officer
- Employee or service operator

A user must never access another organization's private records.

## 4. MVP Functional Requirements

- **FR-001 Authentication:** Authenticate registered users and maintain secure sessions.
- **FR-002 Organizations:** Create and manage a business organization profile.
- **FR-003 Membership:** Owners manage authorized users and roles.
- **FR-004 Products:** Manage products, categories, prices, and measurement units.
- **FR-005 Customers:** Create and maintain customer records.
- **FR-006 Suppliers:** Maintain supplier information.
- **FR-007 Purchasing:** Record purchases and their stock effects.
- **FR-008 Sales:** Record sales, line items, payment status, and customers.
- **FR-009 Inventory:** Track stock receipts, deductions, and adjustments.
- **FR-010 Expenses:** Record and categorize operating expenses.
- **FR-011 Reporting:** Present revenue, expenses, receivables, and estimated profitability.
- **FR-012 Dashboard:** Show organization-specific operational and financial indicators.
- **FR-013 Auditability:** Preserve relevant user actions and financial or stock changes.
- **FR-014 Localization:** Provide Kiswahili and English interface content.

## 5. Deferred Scope

Employee attendance and remuneration; service catalogs and jobs; commissions; multiple branches and warehouses; advanced accounting and reconciliations; mobile-money and payment-gateway integrations; statutory tax integrations; automated notifications; and advanced analytics.

## 6. Architecture

- **Frontend:** Angular, TypeScript, SCSS, responsive UI, Angular Material.
- **API:** NestJS REST API with validation, authorization, and OpenAPI documentation.
- **Database:** PostgreSQL with Prisma ORM and controlled migrations.
- **Security:** Strong password hashing, secure sessions or carefully implemented tokens, server-side authorization, input validation, and audit logging.
- **Operations:** Docker Compose for local PostgreSQL, environment configuration, backups, and CI checks.

## 7. Non-Functional Requirements

### Security and tenancy

Every business-owned record must be scoped to an authorized organization. Every request must be authorized server-side. Production deployment must use HTTPS. Privileged actions must be auditable.

### Integrity

Financial and inventory mutations must use database transactions. Monetary values must use exact decimal or minor-unit representations. Completed transactions must not be silently overwritten.

### Usability

The application must work on desktop, tablet, and mobile browsers, provide accessible controls and validation feedback, and support equivalent Kiswahili and English translations.

### Reliability and maintainability

Use modular source organization, versioned API contracts, automated tests, controlled migrations, error logging, documented backups, and recovery procedures.

## 8. Primary Data Domains

Organizations; users; memberships; roles and permissions; customers; suppliers; product categories; products; purchases and purchase lines; sales and sale lines; payments and receivables; inventory movements; expense categories and expenses; audit events; and localization resources.

Each record must have a stable identifier, ownership scope, and creation/update metadata.

## 9. Business Rules

1. Users access business data only through an authorized organization membership.
2. Every inventory movement has a source transaction or documented reason.
3. A stock-based sale and its inventory movement succeed or fail together.
4. Duplicate submissions must not create duplicate postings.
5. Revenue, cash receipts, credit, expenses, and profit remain distinct concepts.
6. Corrections preserve the original transaction and an audit history.
7. An organization may disable inventory features when they are not needed.
8. Cross-organization access must be rejected even when an identifier is known.

## 10. API and UI Expectations

The API should be versioned, return consistent validation and error responses, expose OpenAPI documentation, and derive organization context from authenticated membership. The frontend should provide a responsive shell, authentication flow, organization dashboard, permission-based navigation, and clear loading, empty, success, and failure states.

## 11. MVP Acceptance Criteria

The MVP is ready for pilot evaluation when:

1. An owner can create an organization and access only its data.
2. Authorized users can manage products, customers, and suppliers.
3. A purchase increases inventory through a traceable transaction.
4. A stock-based sale records revenue and reduces stock correctly.
5. Expenses appear in appropriate reports.
6. Dashboard indicators reconcile with transactions.
7. Unauthorized operations and cross-organization access are rejected.
8. Critical workflows pass automated tests.
9. The interface supports Kiswahili and English.
10. Setup, deployment, backup, and recovery procedures are documented.

## 12. Development Strategy

Implement incrementally, starting with organization isolation, authentication, authorization, and one complete sales/inventory vertical slice. Reuse shared validation, tenancy, audit, and transaction services as later modules are added.

## 13. Approved Research Context

Research validation is deferred and must not be presented as completed. Approved context:

- Locations: Morogoro and Dar es Salaam.
- Participants: owners, managers, and employees.
- Sample: 15 participants; Morogoro 8 and Dar es Salaam 7.
- Roles: 6 owners, 4 managers, and 5 employees.
- Method: semi-structured interviews, 15–20 minutes each.
- Language: participant chooses Kiswahili or English.
- Documentation: written notes, with optional audio after separate explicit permission.
- Consent: documented verbal informed consent.
- Retention: pending final approval; raw data must be coded, access-controlled, and securely deleted under the approved schedule.

## 14. Open Decisions

- Final retention period for raw research data.
- Detailed role-permission matrix.
- Accounting and tax treatment for each business type.
- Performance targets and expected tenant workload.
- Production hosting, backup, and disaster-recovery objectives.
- Final pricing, branding, and commercial packaging.


