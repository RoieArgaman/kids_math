/**
 * Minimal in-memory Firestore Admin SDK fake for API route-handler unit tests.
 *
 * Supports exactly the surface the handlers under test use:
 *   collection(name).where(f, op, v).limit(n).get()
 *   collection(name).orderBy(f, dir).get()
 *   collection(name).add(data) -> { id }
 *   collection(name).doc(id).get() / .set() / .update() / .delete()
 *   runTransaction(fn) where fn receives { get, set, update, delete }
 *
 * It is intentionally NOT a general Firestore emulator — it only models the
 * behaviors these routes rely on (equality `where`, `limit`, ordered list,
 * doc existence, cascade delete). Keep it small; extend deliberately.
 */

export type DocData = Record<string, unknown>;

interface Snapshot {
  readonly id: string;
  readonly exists: boolean;
  /** Writable handle to this doc — enables query-then-update. */
  readonly ref: FakeDocRef;
  data(): DocData | undefined;
}

function snap(
  rows: Map<string, DocData>,
  id: string,
  data: DocData | undefined,
  strictUpdate: boolean,
): Snapshot {
  return {
    id,
    exists: data !== undefined,
    // Lazy: most snapshots are only read, so don't allocate a ref up front.
    get ref() {
      return new FakeDocRef(rows, id, strictUpdate);
    },
    data: () => (data ? { ...data } : undefined),
  };
}

class FakeQuery {
  private filters: Array<[string, unknown]> = [];
  private order: [string, "asc" | "desc"] | null = null;
  private max = Infinity;

  constructor(
    private readonly rows: Map<string, DocData>,
    private readonly strictUpdate: boolean,
  ) {}

  where(field: string, _op: string, value: unknown): FakeQuery {
    this.filters.push([field, value]);
    return this;
  }

  orderBy(field: string, dir: "asc" | "desc" = "asc"): FakeQuery {
    this.order = [field, dir];
    return this;
  }

  limit(n: number): FakeQuery {
    this.max = n;
    return this;
  }

  async get(): Promise<{ empty: boolean; size: number; docs: Snapshot[] }> {
    let entries = [...this.rows.entries()].filter(([, data]) =>
      this.filters.every(([f, v]) => data[f] === v),
    );
    if (this.order) {
      const [f, dir] = this.order;
      // Real Firestore EXCLUDES documents missing the ordered field. Matching that is the point:
      // a legacy user doc without `createdAt` is invisible to `orderBy("createdAt")` in
      // production, and a lenient fake would hide that from every admin-list test.
      entries = entries.filter(([, data]) => data[f] !== undefined);
      entries = entries.sort(([, a], [, b]) => {
        const av = String(a[f] ?? "");
        const bv = String(b[f] ?? "");
        return dir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
      });
    }
    entries = entries.slice(0, this.max);
    const docs = entries.map(([id, data]) => snap(this.rows, id, data, this.strictUpdate));
    return { empty: docs.length === 0, size: docs.length, docs };
  }
}

class FakeDocRef {
  constructor(
    private readonly rows: Map<string, DocData>,
    readonly id: string,
    private readonly strictUpdate = false,
  ) {}

  async get(): Promise<Snapshot> {
    return snap(this.rows, this.id, this.rows.get(this.id), this.strictUpdate);
  }

  async set(data: DocData): Promise<void> {
    this.rows.set(this.id, { ...data });
  }

  async update(patch: DocData): Promise<void> {
    const cur = this.rows.get(this.id);
    // Real Firestore `update()` on a missing doc fails with NOT_FOUND; the
    // lenient default (upsert) is kept so existing tests are unaffected.
    if (cur === undefined && this.strictUpdate) {
      throw new Error(`NOT_FOUND: no document to update: ${this.id}`);
    }
    this.rows.set(this.id, { ...(cur ?? {}), ...patch });
  }

  async delete(): Promise<void> {
    this.rows.delete(this.id);
  }
}

class FakeCollection {
  constructor(
    private readonly rows: Map<string, DocData>,
    private readonly nextId: () => string,
    private readonly strictUpdate: boolean,
  ) {}

  where(field: string, op: string, value: unknown): FakeQuery {
    return new FakeQuery(this.rows, this.strictUpdate).where(field, op, value);
  }

  orderBy(field: string, dir: "asc" | "desc" = "asc"): FakeQuery {
    return new FakeQuery(this.rows, this.strictUpdate).orderBy(field, dir);
  }

  doc(id: string): FakeDocRef {
    return new FakeDocRef(this.rows, id, this.strictUpdate);
  }

  async add(data: DocData): Promise<{ id: string }> {
    const id = this.nextId();
    this.rows.set(id, { ...data });
    return { id };
  }
}

export interface FakeFirestoreOptions {
  /** Seed initial docs per collection: { users: { id1: {...} } }. */
  seed?: Record<string, Record<string, DocData>>;
  /** When set, EVERY collection access throws this error (simulates outage). */
  throwOnAccess?: Error;
  /**
   * Opt-in: make `update()` on a missing doc reject like real Firestore
   * (NOT_FOUND) instead of silently creating it. Default off — the lenient
   * upsert is what the existing tests were written against.
   */
  strictUpdate?: boolean;
  /**
   * Invoked whenever `tx.get` reads inside `runTransaction`. Lets a test
   * interleave a competing write between a transaction's read and its commit
   * to reproduce a lost-update race. This is a deliberate cheap substitute for
   * a real retry/contention model — do not grow one here.
   */
  onTransactionRead?: (ref: FakeDocRef) => void | Promise<void>;
}

export class FakeFirestore {
  private readonly store = new Map<string, Map<string, DocData>>();
  private idCounter = 0;
  private readonly throwOnAccess?: Error;
  private readonly strictUpdate: boolean;
  private readonly onTransactionRead?: (ref: FakeDocRef) => void | Promise<void>;

  constructor(opts: FakeFirestoreOptions = {}) {
    this.throwOnAccess = opts.throwOnAccess;
    this.strictUpdate = opts.strictUpdate ?? false;
    this.onTransactionRead = opts.onTransactionRead;
    for (const [name, docs] of Object.entries(opts.seed ?? {})) {
      const rows = new Map<string, DocData>();
      for (const [id, data] of Object.entries(docs)) rows.set(id, { ...data });
      this.store.set(name, rows);
    }
  }

  private rowsFor(name: string): Map<string, DocData> {
    let rows = this.store.get(name);
    if (!rows) {
      rows = new Map();
      this.store.set(name, rows);
    }
    return rows;
  }

  collection(name: string): FakeCollection {
    if (this.throwOnAccess) throw this.throwOnAccess;
    return new FakeCollection(
      this.rowsFor(name),
      () => `id_${++this.idCounter}`,
      this.strictUpdate,
    );
  }

  async runTransaction<T>(
    fn: (tx: {
      get: (ref: FakeDocRef) => Promise<Snapshot>;
      set: (ref: FakeDocRef, data: DocData) => void;
      update: (ref: FakeDocRef, patch: DocData) => void;
      delete: (ref: FakeDocRef) => void;
    }) => Promise<T>,
  ): Promise<T> {
    if (this.throwOnAccess) throw this.throwOnAccess;
    // Writes are buffered and applied in order once `fn` resolves, like a real
    // transaction commit: ordering is deterministic, and a throwing `fn`
    // commits nothing.
    const pending: Array<() => Promise<void>> = [];
    const result = await fn({
      get: async (ref) => {
        await this.onTransactionRead?.(ref);
        return ref.get();
      },
      set: (ref, data) => {
        pending.push(() => ref.set(data));
      },
      update: (ref, patch) => {
        pending.push(() => ref.update(patch));
      },
      delete: (ref) => {
        pending.push(() => ref.delete());
      },
    });
    for (const write of pending) await write();
    return result;
  }

  /** Test-side inspection helper. */
  docs(collection: string): Array<{ id: string; data: DocData }> {
    return [...(this.store.get(collection)?.entries() ?? [])].map(([id, data]) => ({
      id,
      data,
    }));
  }
}
