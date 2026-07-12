export type UserRole = 'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId?: number | null;
}

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  model: string;
  type: string;
  status: VehicleStatus;
  region: string;
  dispatchable: boolean;
  maxCapacity: number; // in kg
}

export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';

export interface Driver {
  id: string;
  name: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string; // ISO date string
  status: DriverStatus;
  dispatchable: boolean;
}

export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export interface Trip {
  id: string;
  tripNumber: string;
  source: string;
  destination: string;
  vehicleId: string;
  vehicle?: Vehicle;
  driverId: string;
  driver?: Driver;
  cargoWeight: number; // in kg
  distance: number; // in km
  status: TripStatus;
  startOdometer?: number;
  endOdometer?: number;
  fuelConsumed?: number; // in liters
  createdAt: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  description: string;
  cost: number;
  status: 'ACTIVE' | 'CLOSED';
  startDate: string;
  endDate?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  liters: number;
  cost: number;
  date: string;
  tripId?: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  type: 'TOLL' | 'MAINTENANCE' | 'OTHER';
  amount: number;
  date: string;
  description: string;
}

export interface DashboardMetrics {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilizationPercent: number;
}

export interface OperationalCostSummary {
  fuelCost: number;
  maintenanceCost: number;
  otherCost: number;
  totalCost: number;
}

export interface VehicleReportItem {
  id: string;
  registrationNumber: string;
  model: string;
  fuelEfficiency: number; // km per liter or similar
  fleetUtilizationPercent: number;
  operationalCost: number;
  roi: number; // return on investment metric
}
