// ─────────────────────────────────────────────
// ENUMS  (mirror prisma/schema.prisma exactly)
// ─────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'BRANCH_ADMIN'
  | 'FLEET_MANAGER'
  | 'DISPATCHER'
  | 'SAFETY_OFFICER'
  | 'FINANCIAL_ANALYST';

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';

export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';

export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export type MaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type ExpenseType = 'TOLL' | 'OTHER';

// ─────────────────────────────────────────────
// MODELS  (id: number — Int autoincrement in DB)
// ─────────────────────────────────────────────

export interface Branch {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  contactNumber: string;
  adminId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  branchId: number | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Vehicle {
  id: number;
  registrationNumber: string;
  name: string;
  model: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
  branchId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string; // ISO date string
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
  branchId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Trip {
  id: number;
  source: string;
  destination: string;
  vehicleId: number | null;
  vehicle?: Pick<Vehicle, 'registrationNumber' | 'odometer'>;
  driverId: number | null;
  driver?: Pick<Driver, 'name'>;
  branchId: number;
  createdById: number;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance: number | null;
  finalOdometer: number | null;
  revenue: number | null;
  status: TripStatus;
  dispatchedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface MaintenanceLog {
  id: number;
  vehicleId: number;
  vehicle?: Vehicle;
  branchId: number;
  serviceType: string;
  description: string | null;
  cost: number;
  date: string;
  startedAt: string | null;
  completedAt: string | null;
  technicianName: string | null;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface FuelLog {
  id: number;
  vehicleId: number;
  vehicle?: Pick<Vehicle, 'registrationNumber' | 'branchId'>;
  tripId: number | null;
  liters: number;
  cost: number;
  date: string;
  fuelStation: string | null;
  receiptNo: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Expense {
  id: number;
  vehicleId: number;
  vehicle?: Vehicle;
  tripId: number | null;
  type: ExpenseType;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ─────────────────────────────────────────────
// DASHBOARD  (mirrors GET /api/dashboard/kpis)
// ─────────────────────────────────────────────

export interface DashboardKPIs {
  fleet: {
    total: number;
    active: number;
    inMaintenance: number;
    utilizationPercentage: number;
  };
  trips: {
    active: number;
    pending: number;
  };
  drivers: {
    onDuty: number;
  };
}

export interface DashboardAlerts {
  expiringLicenses: Array<Pick<Driver, 'id' | 'name' | 'licenseExpiryDate'>>;
  overdueMaintenance: Array<
    MaintenanceLog & { vehicle: Pick<Vehicle, 'registrationNumber'> }
  >;
  lockedAccounts: Array<Pick<User, 'id' | 'email' | 'name' | 'lockedUntil'>>;
}

// ─────────────────────────────────────────────
// REPORTS  (mirrors GET /api/reports/*)
// ─────────────────────────────────────────────

export interface OperationalCostSummary {
  vehicleId: number;
  breakdown: {
    fuel: number;
    maintenance: number;
    otherExpenses: number;
  };
  totalOperationalCost: number;
}

export interface VehicleReportItem {
  id: number;
  registrationNumber: string;
  model: string;
  fuelEfficiency: number;
  fleetUtilizationPercent: number;
  operationalCost: number;
  roi: number;
}

// ─────────────────────────────────────────────
// AUTH  (mirrors POST /api/auth/login response)
// ─────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser extends Pick<User, 'id' | 'name' | 'email' | 'role' | 'branchId'> {}
