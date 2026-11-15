// Complete in-memory Supabase-compatible mock query builder
// Powers the entire application without any Supabase cloud connection

import { getMockStore } from './mockStore';

export class MockQueryBuilder {
  private tableName: string;
  private filters: ((item: any) => boolean)[] = [];
  private sortFn?: (a: any, b: any) => number;
  private limitCount?: number;
  private offsetCount = 0;
  private isSingle = false;
  private isMaybeSingle = false;
  private selectClause = '*';
  private action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' = 'SELECT';
  private insertPayload: any = null;
  private updatePayload: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*', options?: { count?: string; head?: boolean }) {
    this.selectClause = columns;
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.sortFn = (a: any, b: any) => {
      const valA = a[column];
      const valB = b[column];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return ascending ? 1 : -1;
      if (valB === undefined || valB === null) return ascending ? -1 : 1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return ascending ? valA - valB : valB - valA;
      }
      return ascending
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    };
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => {
      if (value === null || value === undefined) return item[column] == null;
      return String(item[column]) === String(value);
    });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item) => {
      if (value === null || value === undefined) return item[column] != null;
      return String(item[column]) !== String(value);
    });
    return this;
  }

  ilike(column: string, pattern: string) {
    const raw = pattern.replace(/^%|%$/g, '').toLowerCase();
    this.filters.push((item) => {
      const val = item[column];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(raw);
    });
    return this;
  }

  like(column: string, pattern: string) {
    return this.ilike(column, pattern);
  }

  in(column: string, values: any[]) {
    const set = new Set(values.map((v) => String(v)));
    this.filters.push((item) => set.has(String(item[column])));
    return this;
  }

  is(column: string, value: any) {
    return this.eq(column, value);
  }

  not(column: string, operator: string, value: any) {
    if (operator === 'is' && value === null) {
      this.filters.push((item) => item[column] != null && item[column] !== '');
    } else {
      this.filters.push((item) => String(item[column]) !== String(value));
    }
    return this;
  }

  or(filterString: string) {
    // Basic multi-column ILIKE support: `col1.ilike.%val%,col2.ilike.%val%`
    const conditions = filterString.split(',').map((c) => c.trim());
    this.filters.push((item) => {
      for (const cond of conditions) {
        const parts = cond.split('.');
        if (parts.length >= 3) {
          const col = parts[0];
          const op = parts[1];
          const pattern = parts.slice(2).join('.').replace(/^%|%$/g, '').toLowerCase();
          const val = item[col];
          if (val && op.toLowerCase() === 'ilike' && String(val).toLowerCase().includes(pattern)) {
            return true;
          }
        }
      }
      return false;
    });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  insert(data: any | any[]) {
    this.action = 'INSERT';
    this.insertPayload = data;
    return this;
  }

  update(data: any) {
    this.action = 'UPDATE';
    this.updatePayload = data;
    return this;
  }

  upsert(data: any | any[], options?: any) {
    this.action = 'INSERT';
    this.insertPayload = data;
    return this;
  }

  delete(options?: any) {
    this.action = 'DELETE';
    return this;
  }

  private execute() {
    const store = getMockStore();
    const table = store.getTable(this.tableName);

    if (this.action === 'INSERT') {
      const itemsToInsert = Array.isArray(this.insertPayload)
        ? this.insertPayload
        : [this.insertPayload];

      const inserted = itemsToInsert.map((item) => ({
        ...item,
        id: item.id || `gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      table.unshift(...inserted);
      return {
        data: this.isSingle || !Array.isArray(this.insertPayload) ? inserted[0] : inserted,
        error: null,
      };
    }

    if (this.action === 'UPDATE') {
      const matched: any[] = [];
      table.forEach((item, index) => {
        const matches = this.filters.every((fn) => fn(item));
        if (matches) {
          const updated = {
            ...item,
            ...this.updatePayload,
            updated_at: new Date().toISOString(),
          };
          table[index] = updated;
          matched.push(updated);
        }
      });
      return {
        data: this.isSingle ? (matched[0] || null) : matched,
        error: null,
      };
    }

    if (this.action === 'DELETE') {
      const deleted: any[] = [];
      for (let i = table.length - 1; i >= 0; i--) {
        if (this.filters.every((fn) => fn(table[i]))) {
          deleted.push(table[i]);
          table.splice(i, 1);
        }
      }
      return { data: deleted, error: null };
    }

    // Default SELECT
    let result = table.filter((item) => this.filters.every((fn) => fn(item)));

    if (this.sortFn) {
      result.sort(this.sortFn);
    }

    // Dynamic Foreign Relation Joins
    // Handles '*, dlp_work_stretches(*)' on 'dlp_corridors'
    if (this.tableName.toLowerCase() === 'dlp_corridors' && this.selectClause.includes('dlp_work_stretches')) {
      const allStretches = store.getTable('dlp_work_stretches');
      result = result.map((corridor) => ({
        ...corridor,
        dlp_work_stretches: allStretches.filter(
          (s) => String(s.corridor_id) === String(corridor.id)
        ),
      }));
    }

    if (this.offsetCount > 0 || this.limitCount !== undefined) {
      const start = this.offsetCount || 0;
      const end = this.limitCount !== undefined ? start + this.limitCount : undefined;
      result = result.slice(start, end);
    }

    if (this.isSingle) {
      return { data: result[0] || null, error: null };
    }
    if (this.isMaybeSingle) {
      return { data: result[0] || null, error: null };
    }

    return { data: result, count: result.length, error: null };
  }

  // Makes MockQueryBuilder directly awaitable with `await query`
  then(resolve: (value: { data: any; count?: number; error: any }) => any, reject?: (reason: any) => any): Promise<any> {
    try {
      const res = this.execute();
      return Promise.resolve(resolve(res));
    } catch (err) {
      if (reject) return Promise.reject(reject(err));
      throw err;
    }
  }
}

export function createMockSupabaseClient() {
  return {
    from: (table: string) => new MockQueryBuilder(table),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null as any }),
      getSession: async () => ({ data: { session: null }, error: null as any }),
    },
    rpc: async (_fnName?: string, _args?: any) => ({
      data: { allowed: true, remaining: 10, retry_after: 0 } as any,
      error: null as any,
    }),
  };
}
