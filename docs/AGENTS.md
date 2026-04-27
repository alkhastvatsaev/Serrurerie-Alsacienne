Serrurerie Bruxelloise OS - Intelligence & Agents Architecture

## 🌐 Overview

Serrurerie Bruxelloise OS (Smartlock Manager) is an advanced operations management platform tailored for locksmiths and security professionals. Unlike traditional CRMs, Serrurerie Bruxelloise OS utilizes a suite of AI-driven cognitive agents to automate dispatching, optimize van stocks, and proactively generate revenue opportunities from real-time local events.

Built on a modern stack (Next.js 16, React 19, Firebase, Zustand), the architecture separates the UI application layer from the intelligent background services.

---

## 🤖 Core Agents

The project's "brain" lives in the `src/services` directory, consisting of two primary agents:

### 1. Intelligence Serrurerie Bruxelloise (Autonomous Dispatch Agent)

**File:** `src/services/ai-agent.ts`

The Autonomous Dispatch Agent acts as the operational core of the service network. It calculates the most optimal technician assignments dynamically.

**Key Capabilities:**

- **Smart Dispatch Engine:** Evaluates new interventions against real-time technician geographic locations (`geo-utils`), live van stocks, general inventory reserves, and scheduled workloads.
- **Zone Awareness:** Adheres to configured territorial bounding boxes (`Zone[]`), mapping out specific operational areas assigned to each technician.
- **Explainable AI (Reasoning Engine):** Rather than just assigning a job, it generates plain-text reasoning for its suggestions so human dispatchers understand _why_ a technician was recommended.
- **B2B Cognitive Prediction:** B2B prospect rating that analyzes external partner data to score and predict high-conversion targets.

### 2. BRUXELLES SENTINEL v6.0 (Commercial Conversion Engine)

**File:** `src/services/news-sentinel.ts`

The Sentinel is a proactive revenue engine ("SecurityScanningAgent") that listens to external signals and translates them into actionable business tasks.

**Key Capabilities:**

- **Local Event Scanning:** Aggregates data from feeds (e.g., Le Soir, Google News) regarding accidents, fires, burglaries, or vandalism in the target region (Bruxelles).
- **Contextual Business Translation (Locksmith Angle):** Automatically determines the specific locksmithing opportunity for every incident. Examples:
  - _Fire_: "Contrôle accès après incendie. Remplacement cylindres."
  - _Burglary_: "Renforcement porte (cornières anti-pinces) + serrure A2P\*\*\*."
  - _Vandalism_: "Fermeture provisoire avant remplacement vitrage."
- **Risk & Revenue Metrics:** Enriches raw news with business metrics like `credibilityAttr`, `impactRadius`, `socialVelocity`, and calculated `potentialRevenue`.

---

## 🏗️ System Architecture

### 1. Frontend & Visualization Layer

- **Framework:** Next.js 16 (App Router) + React 19.
- **State Management:** Zustand (`src/store/useStore.ts`) handles memory-first global state (App State, Tech tracking). It features offline resilience (Safe Storage) and real-time integration.
- **Mapping Ecosystem:** Uses React Leaflet (`@pbe/react-yandex-maps` / `leaflet`) to visually plot zones, technician routes, and live Sentinel incidents.
- **Aesthetics Elements:** Defined in `DESIGN_SYSTEM.md`, utilizing a strict Glassmorphism aesthetic with color-coded technicans (Marc=Blue, Sophie=Orange, Lucas=Green) integrated throughout the maps and UI.

### 2. Backend & Data Layer

- **Database:** Firebase Firestore acts as the source of truth, providing real-time syncing for `interventions`, `messages`, and `zones`.
- **API Routes (`src/app/api/...`):** Next.js serverless functions acting as a gateway for external services. Includes routes for `news` (Sentinel), `voice` (Twilio phone integrations), and `send-email` (Resend).

### 3. Real-Time Synchronization Engine

The system bridges localized agent memory and global operations. `useStore` initializes complex Firebase listeners (`initListeners`) that sync client-side states with the cloud in real-time. This tracks interventions, technician movements, and stock levels immediately across all dashboards.

---

## 🔄 The Agentic Lifecycle (Interaction Flow)

1. **Lead Generation**: The Sentinel pipeline intercepts a local burglary event via `api/news`.
2. **Analysis**: The `SecurityScanningAgent` parses the data, calculates an e.g., €800 revenue potential, generates a sales pitch, and alerts the UI.
3. **Dispatch Initialization**: The human dispatcher reviews the generated alert and creates an `Intervention`.
4. **Agent Routing**: `Intelligence Serrurerie Bruxelloise` takes over, pulling coordinates from `geo-utils` and running `getSmartDispatch`. It finds that "Marc" is within the geographic polygon and has an "A2P\*\*\* Lock" currently assigned to his `VanStock`.
5. **Execution**: The job is proposed to Marc. Once accepted, Firebase syncs the updated Status, modifying the global map and inventory states in real time.
