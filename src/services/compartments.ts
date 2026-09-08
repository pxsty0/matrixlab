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
import { Compartment, Cabinet, Product } from "../types";
import { cleanStr, toIsoDate, addAuditEntry } from "./helpers";
import { toCabinet } from "./cabinets";

export const toCompartment = (
  id: string,
  data: any,
  cabinet?: Cabinet,
  products?: Product[],
): Compartment => ({
  id,
  cabinetId: cleanStr(data.cabinetId),
  cabinet,
  code: cleanStr(data.code).toUpperCase(),
  name: cleanStr(data.name),
  dataMatrix: cleanStr(data.dataMatrix),
  createdAt: toIsoDate(data.createdAt),
  updatedAt: toIsoDate(data.updatedAt),
  products,
  _count: products ? { products: products.length } : undefined,
});

export const CompartmentAPI = {
  getAll: async (cabinetId?: string): Promise<Compartment[]> => {
    const compsCol = collection(db, "compartments");
    const [compsSnap, cabsSnap, prodsSnap] = await Promise.all([
      cabinetId
        ? getDocs(query(compsCol, where("cabinetId", "==", cabinetId)))
        : getDocs(query(compsCol, orderBy("code", "asc"))),
      getDocs(collection(db, "cabinets")),
      getDocs(collection(db, "products")),
    ]);

    const cabsMap: Record<string, Cabinet> = {};
    cabsSnap.docs.forEach((d) => {
      cabsMap[d.id] = toCabinet(d.id, d.data());
    });

    const prodsCountByComp: Record<string, number> = {};
    prodsSnap.docs.forEach((d) => {
      const p = d.data();
      const code = cleanStr(p.compartmentCode || p.compartmentId);
      if (code) {
        prodsCountByComp[code] = (prodsCountByComp[code] || 0) + 1;
      }
    });

    return compsSnap.docs
      .map((d) => {
        const data = d.data();
        const cab = cabsMap[data.cabinetId];
        const count = prodsCountByComp[data.code] || 0;
        const comp = toCompartment(d.id, data, cab);
        comp._count = { products: count };
        return comp;
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  },

  getById: async (id: string): Promise<Compartment> => {
    const compRef = doc(db, "compartments", id);
    const snap = await getDoc(compRef);
    if (!snap.exists()) throw new Error("Bölme bulunamadı.");

    const compData = snap.data();
    const [cabSnap, prodsSnap] = await Promise.all([
      getDoc(doc(db, "cabinets", compData.cabinetId)),
      getDocs(
        query(
          collection(db, "products"),
          where("compartmentCode", "==", compData.code),
        ),
      ),
    ]);

    const cab = cabSnap.exists()
      ? toCabinet(cabSnap.id, cabSnap.data())
      : undefined;
    const prods = prodsSnap.docs.map((d) => {
      const p = d.data();
      return {
        id: d.id,
        compartmentCode: compData.code,
        name: cleanStr(p.name),
        sku: cleanStr(p.sku),
        quantity: Number(p.quantity) || 0,
        imageUrl: p.imageUrl || null,
        dataMatrix: p.dataMatrix || "",
        createdAt: toIsoDate(p.createdAt),
        updatedAt: toIsoDate(p.updatedAt),
      } as Product;
    });

    return toCompartment(snap.id, compData, cab, prods);
  },

  create: async (payload: {
    cabinetId: string;
    code: string;
    name: string;
    dataMatrix?: string;
  }): Promise<Compartment> => {
    const code = cleanStr(payload.code).toUpperCase();
    const name = cleanStr(payload.name);
    if (!payload.cabinetId) throw new Error("Bağlı dolap seçilmelidir.");
    if (!code) throw new Error("Raf / Bölme kodu zorunludur.");
    if (!name) throw new Error("Bölme adı zorunludur.");

    const docRef = doc(db, "compartments", code);
    const existingDocSnap = await getDoc(docRef);
    if (existingDocSnap.exists()) {
      throw new Error(
        `'${code}' ID'li bir raf zaten mevcut! Her raf ID'si benzersiz olmalıdır.`,
      );
    }

    const existingQuerySnap = await getDocs(
      query(collection(db, "compartments"), where("code", "==", code)),
    );
    if (!existingQuerySnap.empty) {
      throw new Error(
        `'${code}' ID'li bir raf zaten mevcut! Her raf ID'si benzersiz olmalıdır.`,
      );
    }

    const cabSnap = await getDoc(doc(db, "cabinets", payload.cabinetId));
    if (!cabSnap.exists()) throw new Error("Seçilen dolap bulunamadı.");

    const now = new Date().toISOString();
    const docData = {
      cabinetId: payload.cabinetId,
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
      "COMPARTMENT_CREATE",
      `Yeni bölme oluşturuldu: ${code} (${name}) - Dolap: ${cabSnap.data().code || cabSnap.id}`,
    );
    await batch.commit();

    return toCompartment(
      docRef.id,
      docData,
      toCabinet(cabSnap.id, cabSnap.data()),
      [],
    );
  },

  update: async (
    id: string,
    payload: Partial<Compartment>,
  ): Promise<Compartment> => {
    const compRef = doc(db, "compartments", id);
    const snap = await getDoc(compRef);
    if (!snap.exists()) throw new Error("Güncellenecek bölme bulunamadı.");

    const current = snap.data();
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (payload.cabinetId) updates.cabinetId = cleanStr(payload.cabinetId);
    if (payload.name !== undefined) updates.name = cleanStr(payload.name);
    if (payload.dataMatrix !== undefined)
      updates.dataMatrix = cleanStr(payload.dataMatrix);

    if (payload.code !== undefined) {
      const newCode = cleanStr(payload.code).toUpperCase();
      if (newCode !== cleanStr(current.code).toUpperCase()) {
        const checkDoc = await getDoc(doc(db, "compartments", newCode));
        if (checkDoc.exists() && checkDoc.id !== id) {
          throw new Error(
            `'${newCode}' ID'li bir raf zaten mevcut! Her raf ID'si benzersiz olmalıdır.`,
          );
        }
        const checkQuery = await getDocs(
          query(collection(db, "compartments"), where("code", "==", newCode)),
        );
        if (checkQuery.docs.some((d) => d.id !== id)) {
          throw new Error(
            `'${newCode}' ID'li bir raf zaten mevcut! Her raf ID'si benzersiz olmalıdır.`,
          );
        }
        updates.code = newCode;
      }
    }

    const batch = writeBatch(db);
    batch.update(compRef, updates);
    addAuditEntry(
      batch,
      "COMPARTMENT_UPDATE",
      `Bölme güncellendi: ${updates.code || snap.data().code} (${updates.name || snap.data().name})`,
    );
    await batch.commit();

    return CompartmentAPI.getById(id);
  },

  delete: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const compRef = doc(db, "compartments", id);
    const snap = await getDoc(compRef);
    if (!snap.exists()) throw new Error("Bölme bulunamadı.");

    const data = snap.data();
    const prodsSnap = await getDocs(
      query(
        collection(db, "products"),
        where("compartmentCode", "==", data.code),
      ),
    );
    if (!prodsSnap.empty) {
      throw new Error(
        `Bu bölmede ${prodsSnap.size} adet ürün bulunuyor. Önce ürünleri taşıyın veya silin.`,
      );
    }

    const batch = writeBatch(db);
    batch.delete(compRef);
    addAuditEntry(
      batch,
      "COMPARTMENT_DELETE",
      `Bölme silindi: ${data.code} (${data.name})`,
    );
    await batch.commit();

    return { success: true, message: "Bölme başarıyla silindi" };
  },
};
