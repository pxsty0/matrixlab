import { PRODUCT_OWNERS, ProductOwner } from "../config/constants";

export type UserRole = "admin" | "staff" | "user";
export type EntityType = "product" | "compartment" | "cabinet";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  type: string;
  actorName: string;
  actorEmail: string;
  details: string;
  change?: number;
  productId?: string | null;
  createdAt: string;
}

export interface CreateAuditLogInput {
  type: string;
  details: string;
  change?: number;
  productId?: string | null;
}

export interface Cabinet {
  id: string;
  code: string;
  name: string;
  dataMatrix: string;
  createdAt: string;
  updatedAt: string;
  compartments?: Compartment[];
  totalCompartments?: number;
  totalProducts?: number;
}

export interface Compartment {
  id: string;
  cabinetId: string;
  cabinet?: Cabinet;
  code: string;
  name: string;
  dataMatrix: string;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
  _count?: {
    products: number;
  };
}

interface ProductAssignment {
  assignedToName: string;
  assignedQuantity: number;
  assignedToPhone?: string | null;
  assignedToEmail?: string | null;
  assignedStartDate: string;
  assignedEndDate: string;
  assignedDate?: string;
  note?: string | null;
  assignedByEmail?: string | null;
}

export { PRODUCT_OWNERS, type ProductOwner };

export interface Product {
  id: string;
  compartmentCode: string;
  compartmentId?: string;
  compartment?: Compartment;
  name: string;
  sku: string;
  owner: ProductOwner | null;
  description?: string | null;
  quantity: number;
  imageUrl: string | null;
  dataMatrix: string;
  createdAt: string;
  updatedAt: string;
  auditLogs?: AuditLog[];
  stockMovements?: AuditLog[];
  isAssigned?: boolean;
  assignment?: ProductAssignment | null;
}

export interface DashboardStats {
  totalProducts: number;
  totalStockQuantity: number;
  totalCabinets: number;
  totalCompartments: number;
  recentLogs?: AuditLog[];
  recentMovements?: AuditLog[];
}

export interface ScanLookupResult {
  success: boolean;
  type: EntityType;
  data: Product | Compartment | Cabinet;
}
