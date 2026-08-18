/**
 * A minimal stand-in for the Drizzle `db` object.
 *
 * Drizzle queries are built by chaining (`db.select().from().where().limit(1)`)
 * and only execute when awaited. This mock mirrors that shape with a Proxy: any
 * method returns the same chain, and awaiting the chain resolves to the next
 * value from a queue the test controls.
 *
 * Results are therefore matched to queries **by order of execution**, not by
 * table. A test must queue one result per awaited query, in the order the route
 * runs them. `chains` records every call so assertions can inspect what the
 * route actually tried to write.
 */

export type ChainOp = { name: string; args: unknown[] };
export type RecordedChain = { ops: ChainOp[] };

class DbMock {
  /** Results handed out, in order, to each awaited query. */
  private results: unknown[] = [];
  /** Every chain started since the last reset, in order. */
  chains: RecordedChain[] = [];

  readonly db: Record<string, unknown>;

  constructor() {
    this.db = {
      select: (...args: unknown[]) => this.startChain("select", args),
      insert: (...args: unknown[]) => this.startChain("insert", args),
      update: (...args: unknown[]) => this.startChain("update", args),
      delete: (...args: unknown[]) => this.startChain("delete", args),
      execute: (...args: unknown[]) => this.startChain("execute", args),
      // Transactions run inline against the same mock.
      transaction: async (cb: (tx: unknown) => unknown) => cb(this.db),
      // Drizzle's relational API. `findFirst`/`findMany` consume one queued
      // result each, in the same execution order as the chained builders, so a
      // route may mix the two styles freely.
      query: this.buildQueryProxy(),
    };
  }

  /** `db.query.<table>.findFirst()` / `.findMany()` over the same queue. */
  private buildQueryProxy() {
    const take = (name: string, method: string, args: unknown[]) => {
      this.chains.push({ ops: [{ name: `query.${name}.${method}`, args }] });
      const next = this.results.length > 0 ? this.results.shift() : [];
      if (next instanceof Error) return Promise.reject(next);
      if (method === "findFirst") {
        return Promise.resolve(Array.isArray(next) ? (next[0] ?? undefined) : next);
      }
      return Promise.resolve(Array.isArray(next) ? next : []);
    };

    return new Proxy(
      {},
      {
        get: (_t, table) => {
          if (typeof table === "symbol") return undefined;
          return {
            findFirst: (...args: unknown[]) => take(String(table), "findFirst", args),
            findMany: (...args: unknown[]) => take(String(table), "findMany", args),
          };
        },
      },
    );
  }

  private startChain(name: string, args: unknown[]) {
    const record: RecordedChain = { ops: [{ name, args }] };
    this.chains.push(record);

    const proxy: unknown = new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (typeof prop === "symbol") return undefined;

          // Awaiting the chain executes it and consumes one queued result.
          if (prop === "then") {
            return (onFulfilled?: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) => {
              const next = this.results.length > 0 ? this.results.shift() : [];
              if (next instanceof Error) {
                return Promise.reject(next).then(onFulfilled, onRejected);
              }
              return Promise.resolve(next).then(onFulfilled, onRejected);
            };
          }

          return (...callArgs: unknown[]) => {
            record.ops.push({ name: String(prop), args: callArgs });
            return proxy;
          };
        },
      },
    );

    return proxy;
  }

  /**
   * Queue the results for the next awaited queries, in execution order.
   * Queue an `Error` instance to make a query reject.
   */
  queue(...results: unknown[]) {
    this.results.push(...results);
  }

  /** Every chain that began with the given root method (e.g. "update"). */
  chainsStartingWith(name: string) {
    return this.chains.filter((c) => c.ops[0]?.name === name);
  }

  /** First argument passed to the named op of the first matching chain. */
  firstArgOf(rootName: string, opName: string): unknown {
    const chain = this.chainsStartingWith(rootName)[0];
    return chain?.ops.find((o) => o.name === opName)?.args[0];
  }

  /** Number of results still queued — should be 0 if a test queued exactly right. */
  get pendingResults() {
    return this.results.length;
  }

  reset() {
    this.results = [];
    this.chains = [];
  }
}

export const dbMock = new DbMock();
