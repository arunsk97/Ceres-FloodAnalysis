# Field Journal: Flood Damage Assessment PWA

**A highly resilient, offline-first Progressive Web App (PWA) designed for agricultural disaster recovery in Rural Appalachia.**

This platform empowers field agents to conduct rapid damage assessments in areas with zero-to-intermittent connectivity. Built with a modern **Angular 16** frontend and a paginated **ASP.NET Core** backend, the application guarantees data integrity and zero-loss capture through a sophisticated local persistence layer.

---

## 🛠 Technology Stack

### Frontend
- **Angular 16**: Reactive UI framework with RxJS data streams.
- **Dexie.js (IndexedDB)**: Robust local-first persistence for offline drafting.
- **Service Workers**: Enables full application accessibility without an active network.
- **Lazy Loading**: Native HTTP pagination for historical records to minimize mobile data usage.

### Backend
- **ASP.NET Core**: Scalable Web API implementing RESTful standards.
- **Entity Framework Core**: Object-Relational Mapping (ORM) for efficient SQL transactions.
- **SQLite**: Lightweight, relational database for reliable assessment storage.

---

## 🏗 Architectural Design Patterns

### 1. Offline-First Synchronization
Instead of "checking for network" at every button click, the app assumes an offline state by default. All new assessments and edits are committed directly to **IndexedDB**. 
- **Auto-Sync:** A dedicated `NetworkService` listens for OS-level connectivity changes. When the device detects internet, it automatically dispatches a consolidated JSON payload to the `.NET Sync Endpoint`.
- **Eager Sync:** Assessments created while already online are instantly pushed to ensure real-time reporting.

### 2. "True Wipe" Storage Strategy
To support field work on lower-end mobile devices, the application implements a strict storage cleanup policy. Once a pending assessment is successfully acknowledged by the backend API:
- It is **permanently deleted** from the local device's IndexedDB.
- It moves from "Draft" state to "Master History" state.

### 3. Progressive Lazy Loading
Historical data is never stored locally. To save bandwidth and device RAM:
- The dashboard utilizes **API-level pagination** (Skip/Take).
- History is fetched in 5-item chunks directly to application RAM.
- **Image Stripping:** Large Base64 photo strings are automatically omitted during historical fetches to ensure the Dashboard remains buttery smooth even with thousands of records.

---

## 🚀 Getting Started

### Prerequisites
- .NET 10 SDK
- Node.js (v18+)
- Angular CLI

### 1. Run the Backend API
Navigate to the backend directory and launch the server. The SQLite database will be provisioned automatically.
```bash
cd Backend/FloodAssessment.Api
dotnet run
```

### 2. Run the PWA Frontend
Navigate to the frontend directory and start the development server.
```bash
cd Frontend
npm install
npm run start
```

### 3. Deploy to Netlify (Frontend)
Ensure the `Base Directory` is set to `Frontend` and the `Publish Directory` is `Frontend/dist/frontend`. An included `_redirects` file ensures correct SPA routing.

---

## 🧭 Application Flow

### Data Lifecycle
1. **Initiation**: Worker opens the app (accessible offline via Service Workers).
2. **Capture**: Forms validate inputs (e.g., preventing negative chicken counts), capture GPS coordinates, and encode photos to Base64.
3. **Persistence**: The assessment is saved as a "Pending" record in IndexedDB.
4. **Syncing**: 
   - **Online Path**: The `SyncService` immediately POSTs the record.
   - **Offline Path**: The `NetworkService` monitors connectivity. Once online, it triggers a `PushSync`.
5. **Conflict Resolution**: The Backend implements **Upsert Logic**. If a record ID already exists (e.g., from multiple offline edits), it updates the record; otherwise, it creates a new one.
6. **Wipeout**: After successful server confirmation, the local record is wiped to save space.
7. **Recall**: The Dashboard uses lazy loading to pull lightweight history from the server for review.

---

## 🛡 Security & Resilience
- **Input Sanitization**: Client-side and server-side validation for all assessment metrics.
- **Simulation Mode**: A custom toggle in "Settings" allows engineers to simulate offline modes to verify sync logic without manually disabling Wi-Fi.
- **Data Export**: Built-in CSV export generator that is context-aware (downloads master DB when online, local drafts when offline).
