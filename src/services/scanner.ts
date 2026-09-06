import {
  collection,
  getDocs,
  query,
  where,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { ScanLookupResult } from "../types";
import { cleanStr } from "./helpers";
import { ProductAPI } from "./products";
import { CompartmentAPI } from "./compartments";
import { toCabinet } from "./cabinets";

export const ScannerAPI = {
  lookup: async (code: string): Promise<ScanLookupResult> => {
    const trimmed = code.trim();
    const upperTrimmed = trimmed.toUpperCase();

    const [prodQuery, compQuery, cabQuery] = await Promise.all([
      getDocs(
        query(
          collection(db, "products"),
          where("dataMatrix", "==", trimmed),
          firestoreLimit(1),
        ),
      ).catch(() => null),
      getDocs(
        query(
          collection(db, "compartments"),
          where("dataMatrix", "==", trimmed),
          firestoreLimit(1),
        ),
      ).catch(() => null),
      getDocs(
        query(
          collection(db, "cabinets"),
          where("dataMatrix", "==", trimmed),
          firestoreLimit(1),
        ),
      ).catch(() => null),
    ]);

    let matchedProdDoc =
      prodQuery && !prodQuery.empty ? prodQuery.docs[0] : null;
    let matchedCompDoc =
      compQuery && !compQuery.empty ? compQuery.docs[0] : null;
    let matchedCabDoc = cabQuery && !cabQuery.empty ? cabQuery.docs[0] : null;

    if (!matchedProdDoc && !matchedCompDoc && !matchedCabDoc) {
      const [prodsSnap, compsSnap, cabsSnap] = await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(collection(db, "compartments")),
        getDocs(collection(db, "cabinets")),
      ]);

      matchedProdDoc =
        prodsSnap.docs.find(
          (d) =>
            cleanStr(d.data().dataMatrix || d.data().sku).toUpperCase() ===
            upperTrimmed,
        ) || null;

      if (!matchedProdDoc) {
        matchedCompDoc =
          compsSnap.docs.find(
            (d) =>
              cleanStr(d.data().dataMatrix || d.data().code).toUpperCase() ===
              upperTrimmed,
          ) || null;
      }

      if (!matchedProdDoc && !matchedCompDoc) {
        matchedCabDoc =
          cabsSnap.docs.find(
            (d) =>
              cleanStr(d.data().dataMatrix || d.data().code).toUpperCase() ===
              upperTrimmed,
          ) || null;
      }
    }

    if (matchedProdDoc) {
      const product = await ProductAPI.getById(matchedProdDoc.id);
      return { success: true, type: "PRODUCT", data: product };
    }

    if (matchedCompDoc) {
      const comp = await CompartmentAPI.getById(matchedCompDoc.id);
      return { success: true, type: "COMPARTMENT", data: comp };
    }

    if (matchedCabDoc) {
      const comps = await CompartmentAPI.getAll(matchedCabDoc.id);
      const cab = toCabinet(matchedCabDoc.id, matchedCabDoc.data(), comps);
      return { success: true, type: "CABINET", data: cab };
    }

    throw new Error(`'${code}' koduna ait ürün, bölme veya dolap bulunamadı.`);
  },
};
