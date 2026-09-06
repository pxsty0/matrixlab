import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  limit as firestoreLimit,
  writeBatch,
} from "firebase/firestore";
import { db, auth, isFirebaseConfigured } from "../lib/firebase";
import { User, UserRole } from "../types";
import { cleanStr, toIsoDate, addAuditEntry } from "./helpers";
import { AuditLogAPI } from "./auditLogs";

const toUser = (id: string, data: any): User => {
  const createdAt = toIsoDate(data.createdAt);
  return {
    id,
    username: cleanStr(data.username || data.name).toLowerCase(),
    name: cleanStr(data.name),
    email: cleanStr(data.email).toLowerCase(),
    role: (data.role as UserRole) || "user",
    createdAt,
    updatedAt: data.updatedAt ? toIsoDate(data.updatedAt) : createdAt,
  };
};

export const UserAPI = {
  getAll: async (): Promise<User[]> => {
    if (!isFirebaseConfigured()) return [];
    const snap = await getDocs(collection(db, "users"));
    return snap.docs
      .map((d) => toUser(d.id, d.data()))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  },

  getProfile: async (
    uid: string,
    email?: string | null,
  ): Promise<User | null> => {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (userSnap.exists()) {
      return toUser(userSnap.id, userSnap.data());
    }
    if (email) {
      const q = query(
        collection(db, "users"),
        where("email", "==", email.toLowerCase().trim()),
        firestoreLimit(1),
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const docData = querySnap.docs[0].data();
        try {
          // Auto-heal: Firestore rules check exists(/databases/$(database)/documents/users/$(request.auth.uid))
          await setDoc(
            doc(db, "users", uid),
            {
              ...docData,
              email: email.toLowerCase().trim(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
        } catch (_healErr) {}
        return toUser(uid, docData);
      }
    }
    return null;
  },

  createProfile: async (
    uid: string,
    input: { name: string; email: string; username?: string; role?: UserRole },
  ): Promise<User> => {
    const docRef = doc(db, "users", uid);
    const name = cleanStr(input.name);
    const email = cleanStr(input.email).toLowerCase();
    const username = cleanStr(input.username) || name;
    const role: UserRole = input.role || "user";
    const now = new Date().toISOString();

    const data = {
      username,
      name,
      email,
      role,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, data);
    await AuditLogAPI.create({
      type: "USER_CREATE",
      details: `Yeni kullanıcı profili oluşturuldu: "${name}" (${email}) - Rol: ${role}`,
    });

    return toUser(uid, data);
  },

  update: async (userId: string, input: any): Promise<User> => {
    if (!userId) throw new Error("Kullanıcı ID gereklidir.");
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error("Kullanıcı bulunamadı.");

    const current = snap.data();
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (input.name !== undefined) updates.name = cleanStr(input.name);
    if (input.email !== undefined)
      updates.email = cleanStr(input.email).toLowerCase();
    if (input.role !== undefined) updates.role = input.role;

    const changes: string[] = [];
    if (updates.name && updates.name !== current.name)
      changes.push(`Ad: "${current.name}" ➔ "${updates.name}"`);
    if (updates.email && updates.email !== current.email)
      changes.push(`E-posta: "${current.email}" ➔ "${updates.email}"`);
    if (updates.role && updates.role !== current.role)
      changes.push(`Rol: "${current.role}" ➔ "${updates.role}"`);

    const isRoleChange = Boolean(updates.role && updates.role !== current.role);
    const detailMsg = `Kullanıcı güncellendi: "${updates.name || current.name}" (${updates.email || current.email})${changes.length > 0 ? ` [${changes.join(", ")}]` : ""}`;

    const batch = writeBatch(db);
    batch.update(userRef, updates);
    addAuditEntry(
      batch,
      isRoleChange ? "USER_ROLE_CHANGE" : "USER_UPDATE",
      detailMsg,
    );
    await batch.commit();

    const updatedSnap = await getDoc(userRef);
    return toUser(updatedSnap.id, updatedSnap.data());
  },

  delete: async (userId: string): Promise<void> => {
    if (!userId) throw new Error("Kullanıcı ID gereklidir.");
    if (auth.currentUser?.uid === userId) {
      throw new Error("Kendi aktif hesabınızı silemezsiniz.");
    }

    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error("Kullanıcı bulunamadı.");

    const current = snap.data();
    const batch = writeBatch(db);
    batch.delete(userRef);
    addAuditEntry(
      batch,
      "USER_DELETE",
      `Kullanıcı hesabı silindi: "${current.name}" (${current.email}) - Rol: ${current.role}`,
    );
    await batch.commit();
  },
};
