# TransitOps Frontend

TransitOps is a transport and logistics management frontend client (mini-ERP) built using a modern, fast, and type-safe stack. It integrates directly with the TransitOps REST API.

## Features
- **Modern UI/UX**: Stunning dark glassmorphism styling, clean custom animations, responsive layouts (mobile-first with collapsible sidebar), and user status badges.
- **Dynamic Role-Based Access Control (RBAC)**: Menus, actions, pages, and interactive UI views change dynamically based on the current user's role:
  - **Fleet Manager (`FLEET_MANAGER`)**: Full CRUD over Vehicles and Drivers, full lifecycle control over Trips (Plan, Dispatch, Cancel, Complete), start/close Maintenance events, log Fuel/Expenses, view operational cost summaries, and export CSV reports.
  - **Driver (`DRIVER`)**: Read-only access to Vehicles and Drivers, lifecycle control for Completing assigned Trips.
  - **Safety Officer (`SAFETY_OFFICER`)**: Full CRUD over Drivers (tracking license expiries/suspensions), read-only access to Vehicles/Trips.
  - **Financial Analyst (`FINANCIAL_ANALYST`)**: Read-only access to Vehicles/Drivers/Trips, logging fuel/expenses, viewing operational cost summaries, and exporting reports.
- **Robust Client Validations**: Dynamic form validations using React Hook Form + Zod, including cargo capacity validations against live vehicle specs.
- **API Cache & Revalidations**: Handled globally via TanStack Query.
- **Global Error Handling**: Automated session logouts on API 401s, custom inline error banners for backend conflict/business rules, and visual loading skeletons.

---

## Tech Stack
- **Framework**: React 19 (via Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (native build-time compilation) + Google Fonts (Plus Jakarta Sans)
- **State Management**: TanStack Query v5 + Axios
- **Forms & Validation**: React Hook Form + Zod
- **Routing**: React Router v7

---

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+)

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Verify target API endpoint configurations inside `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

### Running Locally
To launch the hot-reloading development server:
```bash
npm run dev
```

### Production Build
To run compiler checks and bundle assets for production deployment:
```bash
npm run build
```

---

## File Structure

```
src/
  ├── api/
  │   └── axiosClient.ts       # Axios instance with auth headers & auto-401 logout
  ├── components/
  │   ├── Layout.tsx           # Dashboard layout with sidebar navigation
  │   ├── ProtectedRoute.tsx   # Access-control guard
  │   ├── Skeletons.tsx        # UI loading placeholder components
  │   └── Toast.tsx            # Global notification container
  ├── context/
  │   ├── AuthContext.tsx      # Handles login token and session storage
  │   └── ToastContext.tsx     # Context wrapper to trigger notices from any component
  ├── pages/
  │   ├── Dashboard.tsx        # KPI metrics & utilization analytics
  │   ├── Vehicles.tsx         # Fleet vehicles CRUD & region filters
  │   ├── Drivers.tsx          # Driver profiles & expiry notifications
  │   ├── Trips.tsx            # Trip tracking & live load checkers
  │   ├── Maintenance.tsx      # Maintenance logging & completion
  │   ├── Expenses.tsx         # Fuel logs & cost lookups
  │   ├── Reports.tsx          # Vehicle ROI table & CSV download
  │   └── Login.tsx            # Authentication form
  ├── types/
  │   └── index.ts             # TypeScript definitions matching API structures
  ├── App.tsx                  # Main router setup & query client configuration
  └── main.tsx                 # Client entry point
```
