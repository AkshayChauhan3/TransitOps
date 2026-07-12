# TransitOps ERP 🚀

TransitOps is an enterprise-grade Logistics and Fleet Management system designed to optimize supply chain operations, ensure strict data isolation across regional branches, and provide robust real-time analytics for dispatchers and fleet managers.

## 🌟 Key Features

### 🛡️ Enterprise Security & Multi-Tenancy
- **Role-Based Access Control (RBAC)**: Strict permission boundaries for `SUPER_ADMIN`, `BRANCH_ADMIN`, `FLEET_MANAGER`, and `DISPATCHER`.
- **Branch-Level Isolation**: Users can only query, modify, or delete resources associated with their assigned regional branch. A Vadodara Dispatcher cannot tamper with Surat Driver data.
- **Advanced Authentication**: JWT-based authentication featuring short-lived access tokens, secure 7-day refresh token rotation, and brute-force lockout protection (5 failed attempts).

### 🚚 Advanced Dispatch Engine
- **Transactional Integrity**: Employs raw PostgreSQL `SELECT ... FOR UPDATE` row-level locks to completely eliminate race conditions if multiple dispatchers attempt to assign the same vehicle simultaneously.
- **Smart Validation**: Blocks dispatching of `SUSPENDED` or `OFF_DUTY` drivers, strictly checks driver license expirations, and mathematically validates trip cargo weight against the assigned vehicle's `maxLoadCapacity`.

### 🛠️ Predictive Maintenance & Health
- Tracks real-time vehicle status (`AVAILABLE`, `ON_TRIP`, `IN_SHOP`, `RETIRED`).
- Maintenance logs automatically lock vehicles from being dispatched. Status intelligently restores to `AVAILABLE` only if the vehicle wasn't retired during maintenance.

### 💰 Financial & Analytics Workflows
- **Dynamic Profit Margin**: Dynamically calculates per-trip profit by correlating customer revenue invoices with real-time operational expenses (Fuel, Tolls, and Maintenance).
- **Soft-Delete Data Integrity**: Critical resources are never permanently deleted from the database. A strict `deletedAt` architecture ensures that historical financial aggregates remain mathematically flawless even if a dispatcher removes a vehicle from the active roster.

---

## 🏗️ Technology Stack

**Frontend**
- React 18 (Vite)
- TypeScript
- TailwindCSS (Styling)
- Framer Motion (Micro-animations)
- Lucide React (Icons)
- Recharts (Analytics Data Visualization)
- Axios & React Query (Data Fetching & Caching)

**Backend**
- Node.js & Express.js
- TypeScript
- Prisma ORM
- PostgreSQL (Neon Serverless)
- JSON Web Tokens (JWT) & bcrypt

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (Local or Neon)

### Environment Variables
Duplicate the `.env.example` in the `/Server` directory to `.env` and fill in the necessary details:
```env
DATABASE_URL="postgresql://user:password@host:5432/transitops"
JWT_SECRET="your_super_secret_key"
JWT_REFRESH_SECRET="your_refresh_secret_key"
PORT=3000
```

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AkshayChauhan3/TransitOps.git
   cd TransitOps
   ```

2. **Backend Setup:**
   ```bash
   cd Server
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

### Default Logins (Development)
- **Super Admin**: `super@transitops.com` / `password123`
- **Vadodara Branch Admin**: `admin@vadodara.com` / `password123`
- **Vadodara Fleet Manager**: `fleet@vadodara.com` / `password123`
- **Vadodara Dispatcher**: `dispatch@vadodara.com` / `password123`

---

## 📖 API Documentation
The backend API is comprehensively documented via the OpenAPI standard. View `openapi.yaml` in the `/Server` directory or import it into Postman to test the full Dispatch Engine workflow.

---
*Built for the ultimate logistics hackathon challenge. Code hard, ship fast, and optimize everything.*
