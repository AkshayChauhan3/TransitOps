import { z } from 'zod';
import { 
  Role, 
  VehicleStatus, 
  DriverStatus, 
  TripStatus, 
  MaintenanceStatus, 
  ExpenseType 
} from '@prisma/client';

// ==========================================
// Auth Schemas
// ==========================================

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
});

// ==========================================
// Vehicle Schemas
// ==========================================

export const createVehicleSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  name: z.string().min(1, "Vehicle name is required"),
  model: z.string().min(1, "Model is required"),
  type: z.string().min(1, "Vehicle type is required"),
  maxLoadCapacity: z.number().positive("Capacity must be positive"),
  odometer: z.number().nonnegative("Odometer cannot be negative"),
  acquisitionCost: z.number().nonnegative("Cost cannot be negative"),
  region: z.string().min(1, "Region is required"),
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.nativeEnum(VehicleStatus).optional()
});

// ==========================================
// Driver Schemas
// ==========================================

export const createDriverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseCategory: z.string().min(1, "License category is required"),
  // Accept string date from API, transform to Date object
  licenseExpiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  contactNumber: z.string().min(1, "Contact number is required"),
  safetyScore: z.number().min(0).max(100, "Score must be between 0 and 100")
});

export const updateDriverSchema = createDriverSchema.partial().extend({
  status: z.nativeEnum(DriverStatus).optional()
});

// ==========================================
// Trip Schemas
// ==========================================

export const createTripSchema = z.object({
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  cargoWeight: z.number().positive("Cargo weight must be positive"),
  plannedDistance: z.number().positive("Planned distance must be positive"),
  // Optional at creation time, assigned later
  vehicleId: z.string().uuid("Invalid vehicle ID").optional(),
  driverId: z.string().uuid("Invalid driver ID").optional(),
});

export const updateTripSchema = createTripSchema.partial();

export const completeTripSchema = z.object({
  finalOdometer: z.number().positive("Final odometer must be positive"),
  fuelConsumed: z.number().positive("Fuel consumed must be positive"),
  actualDistance: z.number().positive("Actual distance must be positive").optional(),
  revenue: z.number().nonnegative("Revenue cannot be negative").optional()
});

// ==========================================
// Maintenance Schemas
// ==========================================

export const openMaintenanceSchema = z.object({
  vehicleId: z.string().uuid("Invalid vehicle ID"),
  serviceType: z.string().min(1, "Service type is required"),
  description: z.string().optional(),
  cost: z.number().nonnegative("Cost cannot be negative"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
});

export const closeMaintenanceSchema = z.object({
  technicianName: z.string().min(1, "Technician name is required")
});

// ==========================================
// Fuel & Expenses Schemas
// ==========================================

export const createFuelLogSchema = z.object({
  vehicleId: z.string().uuid("Invalid vehicle ID"),
  tripId: z.string().uuid("Invalid trip ID").optional(),
  liters: z.number().positive("Liters must be positive"),
  cost: z.number().nonnegative("Cost cannot be negative"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  fuelStation: z.string().optional(),
  receiptNo: z.string().optional(),
});

export const createExpenseSchema = z.object({
  vehicleId: z.string().uuid("Invalid vehicle ID"),
  tripId: z.string().uuid("Invalid trip ID").optional(),
  type: z.nativeEnum(ExpenseType),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
});

// ==========================================
// Export Inferred TypeScript Types
// ==========================================
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type CompleteTripInput = z.infer<typeof completeTripSchema>;
export type OpenMaintenanceInput = z.infer<typeof openMaintenanceSchema>;
