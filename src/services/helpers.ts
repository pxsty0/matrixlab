import { Timestamp, doc, collection } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export const toIsoDate = (val: unknown): string => {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (
    typeof val === "object" &&
    val !== null &&
    "toDate" in val &&
    typeof (val as any).toDate === "function"
  ) {
    return (val as any).toDate().toISOString();
  }
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toISOString();
  }
  return String(val);
};


export const cleanStr = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v.trim() : fallback;

export const cleanNum = (v: unknown, fallback = 0, min?: number): number => {
  const n = typeof v === "number" ? v : Number(v);
  const val = isNaN(n) ? fallback : n;
  return min !== undefined && val < min ? min : val;
};

export const getActor = () => {
  const u = auth.currentUser;
  return {
    id: u?.uid || null,
    email: u?.email || "",
    name: u?.displayName || u?.email || "",
  };
};

export const addAuditEntry = (
  batchOrTx: { set: (ref: any, data: any) => any },
  type: string,
  details: string,
  change = 0,
  productId?: string | null,
) => {
  const logRef = doc(collection(db, "auditLogs"));
  const actor = getActor();
  batchOrTx.set(logRef, {
    type,
    actorName: actor.name,
    actorEmail: actor.email,
    actorId: actor.id,
    userId: actor.id,
    userEmail: actor.email,
    details,
    change: change ?? 0,
    productId: productId || null,
    createdAt: new Date().toISOString(),
  });
};
