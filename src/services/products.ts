import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Product,
  Compartment,
  Cabinet,
  AuditLog,
  ProductOwner,
  PRODUCT_OWNERS,
} from "../types";
import {
  cleanStr,
  cleanNum,
  toIsoDate,
  getActor,
  addAuditEntry,
} from "./helpers";
import { toCabinet } from "./cabinets";
import { toCompartment } from "./compartments";
import { toast } from "react-toastify";

export const toProduct = (
  id: string,
  data: any,
  compartment?: Compartment,
  movements?: AuditLog[],
): Product => {
  const cCode = cleanStr(data.compartmentCode || data.compartmentId);
  return {
    id,
    compartmentCode: cCode,
    compartmentId: cCode,
    compartment,
    name: cleanStr(data.name),
    sku: cleanStr(data.sku).toUpperCase(),
    owner:
      typeof data.owner === "string"
        ? PRODUCT_OWNERS.find((o) => o.name === data.owner) || {
            name: data.owner,
            logo: "",
          }
        : (data.owner as ProductOwner) || null,
    description: data.description ? cleanStr(data.description) : null,
    quantity: cleanNum(data.quantity, 0, 0),
    imageUrl: data.imageUrl ? cleanStr(data.imageUrl) : null,
    dataMatrix: cleanStr(data.dataMatrix),
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
    auditLogs: movements,
    stockMovements: movements,
    isAssigned: Boolean(data.isAssigned),
    assignment: data.assignment
      ? {
          assignedToName: cleanStr(data.assignment.assignedToName),
          assignedQuantity: cleanNum(data.assignment.assignedQuantity, 1, 1),
          assignedToPhone: data.assignment.assignedToPhone || null,
          assignedToEmail: data.assignment.assignedToEmail || null,
          assignedStartDate: cleanStr(
            data.assignment.assignedStartDate || data.assignment.assignedDate,
          ),
          assignedEndDate: cleanStr(data.assignment.assignedEndDate),
          assignedDate: cleanStr(
            data.assignment.assignedStartDate || data.assignment.assignedDate,
          ),
          note: data.assignment.note || null,
          assignedByEmail: data.assignment.assignedByEmail || null,
        }
      : null,
  };
};

export const ProductAPI = {
  getAll: async (params?: {
    search?: string;
    cabinetId?: string;
    compartmentCode?: string;
    compartmentId?: string;
  }): Promise<Product[]> => {
    const [prodsSnap, compsSnap, cabsSnap] = await Promise.all([
      getDocs(query(collection(db, "products"), orderBy("updatedAt", "desc"))),
      getDocs(collection(db, "compartments")),
      getDocs(collection(db, "cabinets")),
    ]);

    const cabsMap: Record<string, Cabinet> = {};
    cabsSnap.docs.forEach((d) => {
      cabsMap[d.id] = toCabinet(d.id, d.data());
    });

    const compsMap: Record<string, Compartment> = {};
    compsSnap.docs.forEach((d) => {
      const data = d.data();
      const comp = toCompartment(d.id, data, cabsMap[data.cabinetId]);
      compsMap[data.code] = comp;
      compsMap[d.id] = comp;
    });

    let products = prodsSnap.docs.map((d) => {
      const data = d.data();
      const cCode = cleanStr(data.compartmentCode || data.compartmentId);
      return toProduct(d.id, data, compsMap[cCode]);
    });

    if (params?.cabinetId) {
      products = products.filter(
        (p) => p.compartment?.cabinetId === params.cabinetId,
      );
    }

    const targetComp = cleanStr(
      params?.compartmentCode || params?.compartmentId,
    );
    if (targetComp) {
      products = products.filter(
        (p) =>
          p.compartmentCode === targetComp ||
          p.compartment?.code === targetComp ||
          p.compartmentId === targetComp ||
          p.compartment?.id === targetComp,
      );
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.dataMatrix.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.compartmentCode && p.compartmentCode.toLowerCase().includes(q)),
      );
    }

    return products;
  },

  getById: async (id: string): Promise<Product> => {
    const prodRef = doc(db, "products", id);
    const snap = await getDoc(prodRef);
    if (!snap.exists()) throw new Error("Ürün bulunamadı.");

    const prodData = snap.data();
    let compartment: Compartment | undefined;

    const cCode = cleanStr(prodData.compartmentCode || prodData.compartmentId);
    if (cCode) {
      const compSnap = await getDocs(
        query(collection(db, "compartments"), where("code", "==", cCode)),
      );
      if (!compSnap.empty) {
        const cDoc = compSnap.docs[0];
        const cData = cDoc.data();
        const cabSnap = await getDoc(doc(db, "cabinets", cData.cabinetId));
        const cab = cabSnap.exists()
          ? toCabinet(cabSnap.id, cabSnap.data())
          : undefined;
        compartment = toCompartment(cDoc.id, cData, cab);
      }
    }

    let movements: AuditLog[] = [];
    try {
      const movsSnap = await getDocs(
        query(collection(db, "auditLogs"), where("productId", "==", id)),
      );
      movements = movsSnap.docs
        .map((d) => {
          const m = d.data();
          return {
            id: d.id,
            productId: m.productId || id,
            type: m.type || "AUDIT",
            actorName: m.actorName || m.userName || "",
            actorEmail: m.actorEmail || m.userEmail || "",
            details: m.details || m.note || "",
            change: cleanNum(m.change ?? m.quantity, 0),
            createdAt: toIsoDate(m.createdAt),
          } as AuditLog;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    } catch (e) {
      toast.warning(
        "Ürünün log geçmişi yüklenemedi: " +
          (e instanceof Error ? e.message : ""),
      );
    }

    return toProduct(snap.id, prodData, compartment, movements);
  },

  create: async (formData: FormData): Promise<Product> => {
    const name = cleanStr(formData.get("name"));
    const sku = cleanStr(formData.get("sku")).toUpperCase();
    const compartmentCode = cleanStr(
      formData.get("compartmentCode") || formData.get("compartmentId"),
    );
    const quantity = cleanNum(formData.get("quantity"), 0, 0);
    const ownerStr = cleanStr(formData.get("owner"));
    const owner = PRODUCT_OWNERS.find((o) => o.name === ownerStr) || null;
    const description = cleanStr(formData.get("description")) || null;
    const dataMatrix = cleanStr(formData.get("dataMatrix")) || sku;
    const imageUrl = cleanStr(formData.get("imageUrl")) || null;

    if (!name) throw new Error("Ürün adı zorunludur.");
    if (!sku) throw new Error("Ürün SKU / Barkod kodu zorunludur.");
    if (!compartmentCode)
      throw new Error("Ürünün yerleşeceği raf seçilmelidir.");

    const now = new Date().toISOString();
    const prodRef = doc(collection(db, "products"));

    const prodData = {
      name,
      sku,
      compartmentCode,
      compartmentId: compartmentCode,
      quantity,
      owner: owner?.name,
      description,
      dataMatrix,
      imageUrl,
      isAssigned: false,
      assignment: null,
      createdAt: now,
      updatedAt: now,
    };

    const batch = writeBatch(db);
    batch.set(prodRef, prodData);
    addAuditEntry(
      batch,
      "PRODUCT_CREATE",
      `Yeni ürün eklendi: "${name}" (${sku}) - Başlangıç Stoğu: ${quantity} adet, Raf: ${compartmentCode}, Sahip: ${owner?.name || "Sahip Yok"}${description ? `, Açıklama: ${description}` : ""}`,
      quantity,
      prodRef.id,
    );
    await batch.commit();

    return ProductAPI.getById(prodRef.id);
  },

  update: async (id: string, formData: FormData): Promise<Product> => {
    const prodRef = doc(db, "products", id);
    const snap = await getDoc(prodRef);
    if (!snap.exists()) throw new Error("Güncellenecek ürün bulunamadı.");

    const existing = snap.data();
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (formData.has("name")) updates.name = cleanStr(formData.get("name"));
    if (formData.has("sku"))
      updates.sku = cleanStr(formData.get("sku")).toUpperCase();
    if (formData.has("compartmentCode") || formData.has("compartmentId")) {
      const cCode = cleanStr(
        formData.get("compartmentCode") || formData.get("compartmentId"),
      );
      updates.compartmentCode = cCode;
      updates.compartmentId = cCode;
    }
    if (formData.has("owner")) {
      const ownerStr = cleanStr(formData.get("owner"));
      updates.owner =
        PRODUCT_OWNERS.find((o) => o.name === ownerStr)?.name || null;
    }
    if (formData.has("description"))
      updates.description = cleanStr(formData.get("description")) || null;
    if (formData.has("quantity"))
      updates.quantity = cleanNum(formData.get("quantity"), 0, 0);
    if (formData.has("imageUrl"))
      updates.imageUrl = cleanStr(formData.get("imageUrl")) || null;
    if (formData.has("dataMatrix"))
      updates.dataMatrix = cleanStr(formData.get("dataMatrix"));

    const changes: string[] = [];
    if (updates.name && updates.name !== existing.name)
      changes.push(`Ad: "${existing.name}" ➔ "${updates.name}"`);
    if (updates.sku && updates.sku !== existing.sku)
      changes.push(`SKU: "${existing.sku}" ➔ "${updates.sku}"`);
    if (
      updates.compartmentCode &&
      updates.compartmentCode !== existing.compartmentCode
    )
      changes.push(
        `Raf: "${existing.compartmentCode}" ➔ "${updates.compartmentCode}"`,
      );
    if (
      updates.quantity !== undefined &&
      updates.quantity !== existing.quantity
    )
      changes.push(`Stok: ${existing.quantity} ➔ ${updates.quantity}`);
    if (updates.owner !== undefined && updates.owner !== existing.owner) {
      const oldOwnerName =
        typeof existing.owner === "string"
          ? existing.owner
          : existing.owner?.name || "-";
      const newOwnerName =
        typeof updates.owner === "string"
          ? updates.owner
          : updates.owner?.name || "-";
      changes.push(`Sahip: "${oldOwnerName}" ➔ "${newOwnerName}"`);
    }

    const stockDiff =
      updates.quantity !== undefined
        ? updates.quantity - (existing.quantity || 0)
        : 0;
    const detailMsg = `Ürün güncellendi: "${updates.name || existing.name}" (${updates.sku || existing.sku})${changes.length > 0 ? ` [${changes.join(", ")}]` : ""}`;

    const batch = writeBatch(db);
    batch.update(prodRef, updates);
    addAuditEntry(batch, "PRODUCT_UPDATE", detailMsg, stockDiff, id);
    await batch.commit();

    return ProductAPI.getById(id);
  },

  delete: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const prodRef = doc(db, "products", id);
    const snap = await getDoc(prodRef);
    if (!snap.exists()) throw new Error("Ürün bulunamadı.");

    const data = snap.data();
    const batch = writeBatch(db);
    batch.delete(prodRef);
    addAuditEntry(
      batch,
      "PRODUCT_DELETE",
      `Ürün silindi: "${data.name}" (${data.sku}) - Son Stok: ${data.quantity || 0}, Raf: ${data.compartmentCode || "-"}`,
      -(data.quantity || 0),
      id,
    );
    await batch.commit();

    return { success: true, message: "Ürün başarıyla silindi" };
  },

  adjustStock: async (
    id: string,
    payload: { change: number; type?: "IN" | "OUT" | "AUDIT"; note?: string },
  ): Promise<{ product: Product; auditLog: AuditLog; movement?: AuditLog }> => {
    const change = cleanNum(payload.change, 0);
    if (change === 0) throw new Error("Stok değişim miktarı sıfır olamaz.");

    const prodRef = doc(db, "products", id);
    const actor = getActor();

    let createdLog: AuditLog | null = null;

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(prodRef);
      if (!snap.exists()) throw new Error("Ürün bulunamadı.");

      const prod = snap.data();
      const currentQty = cleanNum(prod.quantity, 0, 0);
      const newQty = currentQty + change;
      if (newQty < 0) throw new Error(`Yetersiz stok! Mevcut: ${currentQty}`);

      const now = new Date().toISOString();
      const movType = payload.type || (change > 0 ? "IN" : "OUT");

      tx.update(prodRef, {
        quantity: newQty,
        updatedAt: now,
      });

      const noteText = payload.note ? ` (Not: ${payload.note})` : "";
      const directionText =
        change > 0
          ? `+${change} adet eklendi`
          : `${Math.abs(change)} adet düşüldü`;
      const detailMsg = `Stok Güncellendi: "${prod.name}" (${prod.sku}) için ${directionText}. [Önceki: ${currentQty}, Yeni: ${newQty}, Raf: ${prod.compartmentCode || "-"}]${noteText}`;

      const logRef = doc(collection(db, "auditLogs"));
      createdLog = {
        id: logRef.id,
        type: movType,
        actorName: actor.name,
        actorEmail: actor.email,
        details: detailMsg,
        change,
        productId: id,
        createdAt: now,
      };

      tx.set(logRef, {
        type: movType,
        actorName: actor.name,
        actorEmail: actor.email,
        details: detailMsg,
        change,
        productId: id,
        createdAt: now,
      });
    });

    const fullProduct = await ProductAPI.getById(id);
    return {
      product: fullProduct,
      auditLog: createdLog!,
      movement: createdLog!,
    };
  },

  transfer: async (
    id: string,
    payload: {
      targetCompartmentCode?: string;
      targetCompartmentId?: string;
      note?: string;
    },
  ): Promise<{ product: Product; auditLog: AuditLog; movement?: AuditLog }> => {
    const targetCode = cleanStr(
      payload.targetCompartmentCode || payload.targetCompartmentId,
    ).toUpperCase();
    if (!targetCode) throw new Error("Hedef raf seçilmelidir.");

    const prodRef = doc(db, "products", id);
    const actor = getActor();

    let createdLog: AuditLog | null = null;

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(prodRef);
      if (!snap.exists()) throw new Error("Ürün bulunamadı.");

      const prod = snap.data();
      const fromComp = prod.compartmentCode || "Bilinmeyen Raf";
      const now = new Date().toISOString();
      const noteText = payload.note ? ` (Not: ${payload.note})` : "";
      const detailMsg = `Raf Transferi: "${prod.name}" (${prod.sku}) ürünü [${fromComp}] ➔ [${targetCode}] rafına taşındı. (Mevcut Stok: ${prod.quantity || 0})${noteText}`;

      tx.update(prodRef, {
        compartmentCode: targetCode,
        compartmentId: targetCode,
        updatedAt: now,
      });

      const logRef = doc(collection(db, "auditLogs"));
      createdLog = {
        id: logRef.id,
        type: "TRANSFER",
        actorName: actor.name,
        actorEmail: actor.email,
        details: detailMsg,
        change: 0,
        productId: id,
        createdAt: now,
      };

      tx.set(logRef, {
        type: "TRANSFER",
        actorName: actor.name,
        actorEmail: actor.email,
        details: detailMsg,
        change: 0,
        productId: id,
        createdAt: now,
      });
    });

    const fullProduct = await ProductAPI.getById(id);
    return {
      product: fullProduct,
      auditLog: createdLog!,
      movement: createdLog!,
    };
  },

  assign: async (
    id: string,
    payload: {
      assignedToName: string;
      assignedQuantity?: number;
      assignedToPhone?: string | null;
      assignedToEmail?: string | null;
      assignedStartDate?: string;
      assignedEndDate: string;
      assignedDate?: string;
      note?: string | null;
    },
  ): Promise<Product> => {
    const assignedName = cleanStr(payload.assignedToName);
    if (!assignedName) throw new Error("Zimmetlenecek kişinin adı zorunludur.");
    if (!cleanStr(payload.assignedEndDate))
      throw new Error("Zimmet bitiş tarihi zorunludur.");

    const assignedQty = cleanNum(payload.assignedQuantity, 1, 1);
    const prodRef = doc(db, "products", id);
    const actor = getActor();

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(prodRef);
      if (!snap.exists()) throw new Error("Ürün bulunamadı.");

      const prod = snap.data();
      const currentStock = cleanNum(prod.quantity, 0, 0);
      const prevAssignedQty =
        prod.isAssigned && prod.assignment
          ? cleanNum(prod.assignment.assignedQuantity, 0, 0)
          : 0;
      const delta = assignedQty - prevAssignedQty;

      if (delta > currentStock) {
        throw new Error(
          `Yetersiz stok! Mevcut: ${currentStock}, Gereken: ${delta}`,
        );
      }

      const newStock = currentStock - delta;
      const now = new Date().toISOString();
      const startDate =
        cleanStr(payload.assignedStartDate || payload.assignedDate) ||
        now.split("T")[0];
      const endDate = cleanStr(payload.assignedEndDate);
      const phone = cleanStr(payload.assignedToPhone);
      const email = cleanStr(payload.assignedToEmail);
      const note = cleanStr(payload.note);

      const assignment = {
        assignedToName: assignedName,
        assignedQuantity: assignedQty,
        assignedToPhone: phone || null,
        assignedToEmail: email || null,
        assignedStartDate: startDate,
        assignedEndDate: endDate,
        assignedDate: startDate,
        note: note || null,
        assignedByEmail: actor.email,
      };

      tx.update(prodRef, {
        quantity: newStock,
        isAssigned: true,
        assignment,
        updatedAt: now,
      });

      const contactParts = [
        phone ? `Tel: ${phone}` : null,
        email ? `E-posta: ${email}` : null,
      ]
        .filter(Boolean)
        .join(", ");

      const detailMsg = `Zimmet Verildi: "${prod.name}" (${prod.sku}) ürününden ${assignedQty} adet ${assignedName} adına zimmetlendi. [Dönem: ${startDate} - ${endDate}${contactParts ? ` | İletişim: ${contactParts}` : ""}${note ? ` | Not: ${note}` : ""}] | Stok: ${currentStock} ➔ ${newStock} (Değişim: -${delta})`;

      const logRef = doc(collection(db, "auditLogs"));
      tx.set(logRef, {
        type: "OUT",
        actorName: actor.name,
        actorEmail: actor.email,
        details: detailMsg,
        change: -delta,
        productId: id,
        createdAt: now,
      });
    });

    return ProductAPI.getById(id);
  },

  unassign: async (id: string, returnNote?: string): Promise<Product> => {
    const prodRef = doc(db, "products", id);
    const actor = getActor();

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(prodRef);
      if (!snap.exists()) throw new Error("Ürün bulunamadı.");

      const prod = snap.data();
      const returnQty = prod.assignment?.assignedQuantity ?? 1;
      const currentStock = cleanNum(prod.quantity, 0, 0);
      const newStock = currentStock + returnQty;
      const now = new Date().toISOString();
      const prevAssignee = prod.assignment?.assignedToName || "Bilinmeyen Kişi";
      const prevStartDate = prod.assignment?.assignedStartDate || "-";
      const prevEndDate = prod.assignment?.assignedEndDate || "-";

      tx.update(prodRef, {
        quantity: newStock,
        isAssigned: false,
        assignment: null,
        updatedAt: now,
      });

      const noteClean = cleanStr(returnNote);
      const detailMsg = `Zimmet İade Alındı: "${prod.name}" (${prod.sku}) ürünü ${prevAssignee} tarafından iade edildi (+${returnQty} adet depoya döndü). [Zimmet Dönemi: ${prevStartDate} - ${prevEndDate}] | Güncel Stok: ${currentStock} ➔ ${newStock}${noteClean ? ` | İade Notu: ${noteClean}` : ""}`;

      const logRef = doc(collection(db, "auditLogs"));
      tx.set(logRef, {
        type: "IN",
        actorName: actor.name,
        actorEmail: actor.email,
        details: detailMsg,
        change: returnQty,
        productId: id,
        createdAt: now,
      });
    });

    return ProductAPI.getById(id);
  },
};
