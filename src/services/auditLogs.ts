import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";
import {
  AuditLog,
  CreateAuditLogInput,
  DashboardStats,
  Product,
} from "../types";
import { cleanNum, toIsoDate, getActor } from "./helpers";
import { CabinetAPI } from "./cabinets";
import { ProductAPI } from "./products";

export const AuditLogAPI = {
  getAll: async (params?: {
    productId?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    data: AuditLog[];
    pagination: { total: number; limit: number; offset: number };
  }> => {
    const col = collection(db, "auditLogs");
    const q = params?.productId
      ? query(col, where("productId", "==", params.productId))
      : query(col);

    const logsSnap = await getDocs(q);

    let allLogs: AuditLog[] = logsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        type: data.type || "AUDIT",
        actorName: data.actorName || "",
        actorEmail: data.actorEmail || "",
        details: data.details || "",
        change: cleanNum(data.change, 0),
        productId: data.productId || null,
        createdAt: toIsoDate(data.createdAt),
      };
    });

    allLogs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (params?.type && params.type !== "ALL") {
      allLogs = allLogs.filter((m) => m.type === params.type);
    }

    const total = allLogs.length;
    const limitCount = params?.limit ?? 100;
    const offsetCount = params?.offset ?? 0;
    const paginatedData = allLogs.slice(offsetCount, offsetCount + limitCount);

    return {
      data: paginatedData,
      pagination: { total, limit: limitCount, offset: offsetCount },
    };
  },

  getStats: async (cachedProducts?: Product[]): Promise<DashboardStats> => {
    const [cabs, prods, logsRes] = await Promise.all([
      CabinetAPI.getAll(),
      cachedProducts ? Promise.resolve(cachedProducts) : ProductAPI.getAll(),
      AuditLogAPI.getAll({ limit: 50 }),
    ]);

    const totalStockQuantity = prods.reduce((sum, p) => sum + p.quantity, 0);
    const totalCompartments = cabs.reduce(
      (sum, c) => sum + (c.compartments ? c.compartments.length : 0),
      0,
    );

    const stockTypes = new Set(["IN", "OUT", "TRANSFER", "PRODUCT_CREATE"]);
    const recentMovements = logsRes.data
      .filter(
        (m) =>
          stockTypes.has(m.type) || (m.change !== undefined && m.change !== 0),
      )
      .slice(0, 10);

    return {
      totalProducts: prods.length,
      totalStockQuantity,
      totalCabinets: cabs.length,
      totalCompartments,
      recentLogs: logsRes.data.slice(0, 10),
      recentMovements,
    };
  },

  create: async (input: CreateAuditLogInput): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    const actor = getActor();
    await addDoc(collection(db, "auditLogs"), {
      type: input.type,
      actorName: actor.name,
      actorEmail: actor.email,
      details: input.details,
      change: input.change ?? 0,
      productId: input.productId || null,
      createdAt: new Date().toISOString(),
    });
  },
};
