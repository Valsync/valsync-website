import { getStore } from "@netlify/blobs";
import { decodePair, encodePair, pairEnabled, type PairRecord } from "./_pairing";

const cleanup = async () => {
  if (!pairEnabled()) return;
  const store = getStore({ name: "valsync-phone-pairs", consistency: "strong" });
  const deadline = Date.now() + 25000;
  for await (const page of store.list({ paginate: true })) {
    for (const blob of page.blobs) {
      if (Date.now() > deadline) return;
      const entry = await store.getWithMetadata(blob.key);
      if (!entry?.etag) continue;
      if (blob.key.startsWith("limits/")) {
        if (Number(entry.metadata.expiresAt) < Date.now()) await store.delete(blob.key);
        continue;
      }
      const record = decodePair<PairRecord>(entry.data);
      if (!record) continue;
      const expires = record.phoneHash ? record.expiresAt : record.pendingUntil;
      if (!record.revoked && expires > Date.now()) continue;
      // Invalidate the version before deletion so an in-flight sync cannot restore it.
      const result = await store.set(blob.key, encodePair({ ...record, revoked: true, snapshot: undefined }), { onlyIfMatch: entry.etag });
      if (result.modified) await store.delete(blob.key);
    }
  }
};

export default cleanup;
export const config = { schedule: "@hourly" };
