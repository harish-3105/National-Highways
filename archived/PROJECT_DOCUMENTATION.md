# National Highways Management & Analytics Platform (NH-STAT)
## Project Plan & Architectural Specification

This document details the overall plan, scope, and technical framework for the National Highways of India (NH-STAT) platform.

---

## 📌 Executive Summary
The platform is an enterprise-grade data management and GIS analytics portal tailored for the National Highways Authority of India (NHAI) / Ministry of Road Transport and Highways (MoRTH). It provides division-level administrative control, bulk rolling data ingestion, route infrastructure mapping, safety blackspot analysis, contractor warranty (DLP) monitoring, and legal case tracking.

---

## 🏛️ Core Modules

### 1. Hierarchical Role-Based Access Control (RBAC)
- **Organizational Hierarchy**: Central HQ -> Regional Divisions -> Local Sub-Divisions (PIUs).
- **Permissions**:
  - `SUPER_ADMIN` (Central HQ): Full access to national data, system settings, and user provisioning.
  - `DIVISION_OFFICER` (Regional Division): Access scoped to highways, DLP contracts, legal cases, and safety data within their division.
  - `SUB_DIVISION_MANAGER` (Sub-Division): Scoped to local stretch maintenance, field updates, and regional legal filings.
  - `ANALYST / AUDITOR`: Read-only reporting and spatial query access.

---

### 2. Bulk Data Engine & Rolling CSV Ingestion
- **Bulk CSV Upload**: Drag-and-drop ingestion interface for historical highway datasets.
- **Data Validation & Parsing**: Pre-ingestion schema validation to check required headers, data types, and coordinate ranges.
- **Rolling Data Pipeline**: Time-series incremental appends (e.g. daily/monthly traffic, new accident logs, updated road condition metrics).
- **Audit Logging**: Tracks dataset upload history, uploader identity, timestamp, and affected Division jurisdiction.

---

### 3. Interactive GIS Map & Route Lane Classifier
- **High-Performance Map Rendering**: Interactive Leaflet / Mapbox GIS interface.
- **Lane Specifications & Visual Styling**:
  - 🟢 **2-Lane Highway**
  - 🔵 **4-Lane Dual Carriageway**
  - 🟣 **6-Lane Expressway**
  - 🟡 **2-Lane with Paved Bike / Service Lane**
- **Search & Filters**: Search by Highway Number (e.g. NH-44, NH-48), Division, or stretch name.
- **Attribute Inspector**: Clickable route polylines showing stretch length (km), start/end coordinates, division in-charge, and pavement condition index (PCI).

---

### 4. Accident Blackspot & Road Safety Analytics
- **Blackspot Mapping**: Spatial clustering and heatmap overlays for high-accident stretches.
- **Multi-Dimensional Filters**:
  - Temporal (Monthly, Quarterly, Yearly)
  - Time of day (Daytime vs. Nighttime)
  - Weather condition (Monsoon, Fog, Clear)
- **Safety Metrics**: Total accidents, fatality rates, casualty severity index.
- **Analytical Reporting**: Top 10 dangerous stretches, division rankings, and trend analysis charts.

---

### 5. Defect Liability Period (DLP) & Expiry Alert System
- **Warranty Lifecycle Management**: Tracks contractor information, road stretch, construction completion date, and 5-year DLP expiration date.
- **Automated Email Notifications**: Trigger engine that sends automated email alerts to division and sub-division officers prior to DLP expiry (e.g., 90 days, 60 days, 30 days).
- **DLP Dashboard**: Real-time status indicators (🟢 Active, 🟡 Expiring Soon, 🔴 Expired) to ensure contractor accountability before warranty handoff.

---

### 6. Legal Case & Bidirectional Lawyer Dashboard
- **Sub-Division Litigation Tracker**: Manages court cases across sub-divisions (Land Acquisition, Arbitration, Environmental Clearances, Contractor Disputes).
- **Bidirectional View**:
  - **View by Sub-Division**: See total active cases, case status (Pending, On-going, Disposed), and assigned counsel.
  - **View by Lawyer / Advocate**: See all cases assigned to a specific lawyer, hearing schedules, win/disposed statistics, and workload distribution.
- **Court Level Tracking**: High Court, Supreme Court, District Court, National Green Tribunal (NGT), Arbitral Tribunals.

---

## 🛠️ Proposed Tech Stack
- **Frontend**: React + TypeScript + Vite, Tailwind CSS, Leaflet (GIS), Recharts (Analytics), Lucide Icons.
- **Backend API**: Node.js / Express.js REST API with SQLite / Prisma ORM.
- **Data Processing**: PapaParse for CSV stream parsing & schema verification.
- **Email Service**: Nodemailer / SMTP trigger engine for DLP expiration alerts.
