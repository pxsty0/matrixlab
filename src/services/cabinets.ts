import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Cabinet, Compartment, Product } from "../types";
import { cleanStr, toIsoDate, addAuditEntry } from "./helpers";

export const toCabinet = (
  id: string,
  data: any,
  compartments?: Compartment[],
): Cabinet => ({
  id,
  code: cleanStr(data.code).toUpperCase(),
  name: cleanStr(data.name),
  dataMatrix: cleanStr(data.dataMatrix),
  createdAt: toIsoDate(data.createdAt),
  updatedAt: toIsoDate(data.updatedAt),
  compartments,
  totalCompartments: compartments ? compartments.length : undefined,
  totalProducts: compartments
    ? compartments.reduce((sum, c) => sum + (c._count?.products ?? 0), 0)
    : undefined,
});

export const CabinetAPI = {
  getAll: async (): Promise<Cabinet[]> => {
    const [cabsSnap, compsSnap, prodsSnap] = await Promise.all([
      getDocs(query(collection(db, "cabinets"), orderBy("code", "asc"))),
      getDocs(collection(db, "compartments")),
      getDocs(collection(db, "products")),
    ]);

    const prodsCountByComp: Record<string, number> = {};
    prodsSnap.docs.forEach((d) => {
      const p = d.data();
      const code = cleanStr(p.compartmentCode || p.compartmentId);
      if (code) {
        prodsCountByComp[code] = (prodsCountByComp[code] || 0) + 1;
      }
    });

    const compsByCab: Record<string, Compartment[]> = {};
    compsSnap.docs.forEach((d) => {
      const data = d.data();
      const comp: Compartment = {
        id: d.id,
        cabinetId: cleanStr(data.cabinetId),
        code: cleanStr(data.code).toUpperCase(),
        name: cleanStr(data.name),
        dataMatrix: cleanStr(data.dataMatrix),
        createdAt: toIsoDate(data.createdAt),
        updatedAt: toIsoDate(data.updatedAt),
        _count: { products: prodsCountByComp[data.code] || 0 },
      };
      if (!compsByCab[comp.cabinetId]) compsByCab[comp.cabinetId] = [];
      compsByCab[comp.cabinetId].push(comp);
    });

    return cabsSnap.docs.map((d) => {
      const comps = (compsByCab[d.id] || []).sort((a, b) =>
        a.code.localeCompare(b.code),
      );
      return toCabinet(d.id, d.data(), comps);
    });
  },

  getById: async (id: string): Promise<Cabinet> => {
    const snap = await getDoc(doc(db, "cabinets", id));
    if (!snap.exists()) throw new Error("Dolap bulunamadı.");
    return toCabinet(snap.id, snap.data());
  },

  create: async (payload: {
    code: string;
    name: string;
    dataMatrix?: string;
  }): Promise<Cabinet> => {
    const code = cleanStr(payload.code).toUpperCase();
    const name = cleanStr(payload.name);
    if (!code) throw new Error("Dolap ID / Kodu zorunludur.");
    if (!name) throw new Error("Dolap adı zorunludur.");

    const existingSnap = await getDocs(collection(db, "cabinets"));
    const exists = existingSnap.docs.some(
      (d) => cleanStr(d.data().code).toUpperCase() === code,
    );
    if (exists) throw new Error(`'${code}' kodlu bir dolap zaten mevcut!`);

    const now = new Date().toISOString();
    const docRef = doc(collection(db, "cabinets"));
    const docData = {
      code,
      name,
      dataMatrix: cleanStr(payload.dataMatrix) || code,
      createdAt: now,
      updatedAt: now,
    };

    const batch = writeBatch(db);
    batch.set(docRef, docData);
    addAuditEntry(
      batch,
      "CABINET_CREATE",
      `Yeni dolap tanımlandı: ${code} (${name})`,
    );
    await batch.commit();

    return toCabinet(docRef.id, docData, []);
  },

  update: async (id: string, payload: Partial<Cabinet>): Promise<Cabinet> => {
    const cabRef = doc(db, "cabinets", id);
    const snap = await getDoc(cabRef);
    if (!snap.exists()) throw new Error("Güncellenecek dolap bulunamadı.");

    const current = snap.data();
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (payload.code !== undefined)
      updates.code = cleanStr(payload.code).toUpperCase();
    if (payload.name !== undefined) updates.name = cleanStr(payload.name);
    if (payload.dataMatrix !== undefined)
      updates.dataMatrix = cleanStr(payload.dataMatrix);

    const batch = writeBatch(db);
    batch.update(cabRef, updates);
    addAuditEntry(
      batch,
      "CABINET_UPDATE",
      `Dolap güncellendi: ${updates.code || current.code} (${updates.name || current.name})`,
    );
    await batch.commit();

    const updatedSnap = await getDoc(cabRef);
    return toCabinet(updatedSnap.id, updatedSnap.data());
  },

  delete: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const compsSnap = await getDocs(
      query(collection(db, "compartments"), where("cabinetId", "==", id)),
    );
    if (!compsSnap.empty) {
      throw new Error(
        `Bu dolapta ${compsSnap.size} adet bölme var. Önce bölmeleri silmelisiniz.`,
      );
    }

    const cabRef = doc(db, "cabinets", id);
    const snap = await getDoc(cabRef);
    if (!snap.exists()) throw new Error("Silinecek dolap bulunamadı.");

    const data = snap.data();
    const batch = writeBatch(db);
    batch.delete(cabRef);
    addAuditEntry(
      batch,
      "CABINET_DELETE",
      `Dolap silindi: ${data.code} (${data.name})`,
    );
    await batch.commit();

    return { success: true, message: "Dolap başarıyla silindi" };
  },
};
