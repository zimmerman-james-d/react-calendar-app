import { EventDefinition, SaveData } from '../types';

// Compact binary encoding for the "Copy as Text" / "Load from Text" flow.
// Unrelated to the .tclx file format, which stays plain JSON — see
// SaveLoadControls.tsx. Only used here, so there's no legacy data to stay
// compatible with; a version byte is included so this format itself can
// still evolve later without breaking previously-pasted strings.

const FORMAT_VERSION = 1;
const EPOCH_MS = Date.UTC(2020, 0, 1);
const START_DATE_TOKEN = 'start-date';

function dayNumFromDate(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - EPOCH_MS) / 86400000);
}

function dateFromDayNum(days: number): string {
  return new Date(EPOCH_MS + days * 86400000).toISOString().split('T')[0];
}

class ByteWriter {
  private bytes: number[] = [];

  u8(n: number) {
    this.bytes.push(n & 0xff);
  }

  varint(n: number) {
    n = n >>> 0;
    while (n > 0x7f) {
      this.bytes.push((n & 0x7f) | 0x80);
      n >>>= 7;
    }
    this.bytes.push(n);
  }

  svarint(n: number) {
    this.varint(n < 0 ? -n * 2 - 1 : n * 2);
  }

  str(s: string) {
    const encoded = new TextEncoder().encode(s);
    this.varint(encoded.length);
    for (const b of encoded) this.bytes.push(b);
  }

  date(dateStr: string) {
    this.varint(dayNumFromDate(dateStr));
  }

  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

class ByteReader {
  private pos = 0;

  constructor(private bytes: Uint8Array) {}

  u8(): number {
    return this.bytes[this.pos++];
  }

  varint(): number {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = this.bytes[this.pos++];
      result |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte & 0x80);
    return result >>> 0;
  }

  svarint(): number {
    const n = this.varint();
    return n % 2 === 1 ? -(n + 1) / 2 : n / 2;
  }

  str(): string {
    const len = this.varint();
    const slice = this.bytes.subarray(this.pos, this.pos + len);
    this.pos += len;
    return new TextDecoder().decode(slice);
  }

  date(): string {
    return dateFromDayNum(this.varint());
  }
}

// Flags byte bits
const FLAG_HAS_DATE = 1 << 0;
const FLAG_HAS_RECURRENCE = 1 << 1;
const FLAG_HAS_RELATIVE_TO = 1 << 2;
const FLAG_HAS_RELATIVE_RECURRENCE = 1 << 3;
const FLAG_HAS_EXCEPTIONS = 1 << 4;
const FLAG_DELETED = 1 << 5;
const FLAG_HAS_GROUP_ID = 1 << 6;

// Target-reference discriminator bytes (used for relativeTo.targetId and
// relativeRecurrence.targetId, both of which reference another definition's
// `id`, or the literal string "start-date").
const TARGET_START_DATE = 0;
const TARGET_INDEX = 1;
const TARGET_COMPOUND = 2;
const TARGET_LITERAL = 3;

function buildIdIndex(defs: EventDefinition[]): Map<string, number> {
  const idIndex = new Map<string, number>();
  defs.forEach((def, i) => {
    idIndex.set(def.id, i);
    if (def.groupId) idIndex.set(def.groupId, i);
  });
  return idIndex;
}

function writeTargetRef(w: ByteWriter, targetId: string, idIndex: Map<string, number>) {
  if (targetId === START_DATE_TOKEN) {
    w.u8(TARGET_START_DATE);
    return;
  }
  if (idIndex.has(targetId)) {
    w.u8(TARGET_INDEX);
    w.varint(idIndex.get(targetId)!);
    return;
  }
  // A user can target one specific occurrence of a recurring series (via
  // SingleEventForm's "relative to" dropdown), which produces a compound id
  // like `${def.id}-${date}` (see eventUtils.tsx). Match the known-id prefix
  // and keep only the (much shorter) literal suffix.
  for (const [origId, idx] of idIndex) {
    if (targetId.startsWith(origId + '-')) {
      w.u8(TARGET_COMPOUND);
      w.varint(idx);
      w.str(targetId.slice(origId.length + 1));
      return;
    }
  }
  w.u8(TARGET_LITERAL);
  w.str(targetId);
}

function readTargetRef(r: ByteReader, resolvedIds: string[]): string {
  const kind = r.u8();
  if (kind === TARGET_START_DATE) return START_DATE_TOKEN;
  if (kind === TARGET_INDEX) return resolvedIds[r.varint()];
  if (kind === TARGET_COMPOUND) {
    const idx = r.varint();
    const suffix = r.str();
    return `${resolvedIds[idx]}-${suffix}`;
  }
  return r.str(); // TARGET_LITERAL
}

export function encodeCompact(data: SaveData): Uint8Array {
  const defs = data.eventDefinitions;
  const idIndex = buildIdIndex(defs);

  const w = new ByteWriter();
  w.u8(FORMAT_VERSION);
  w.str(data.calendarName || '');
  w.date(data.startDate || dateFromDayNum(0));
  w.varint(defs.length);

  for (const def of defs) {
    const hasExceptions = !!(def.exceptions && Object.keys(def.exceptions).length > 0);
    let flags = 0;
    if (def.date) flags |= FLAG_HAS_DATE;
    if (def.recurrence) flags |= FLAG_HAS_RECURRENCE;
    if (def.relativeTo) flags |= FLAG_HAS_RELATIVE_TO;
    if (def.relativeRecurrence) flags |= FLAG_HAS_RELATIVE_RECURRENCE;
    if (hasExceptions) flags |= FLAG_HAS_EXCEPTIONS;
    if (def.deleted) flags |= FLAG_DELETED;
    if (def.groupId) flags |= FLAG_HAS_GROUP_ID;
    w.u8(flags);

    w.str(def.title);

    if (def.date) {
      w.date(def.date);
    }

    if (def.recurrence) {
      const r = def.recurrence;
      if (r.relativeToStartDate) {
        w.u8(1);
        w.svarint(r.relativeToStartDate.startOffset);
        w.svarint(r.relativeToStartDate.endOffset);
      } else {
        w.u8(0);
        w.date(r.startRecur!);
        w.date(r.endRecur!);
      }
      w.varint(r.recurrenceCycle);
      w.varint(r.weeklySelections.length);
      for (const week of r.weeklySelections) {
        let bits = 0;
        for (const day of week) bits |= 1 << day;
        w.u8(bits);
      }
    }

    if (def.relativeTo) {
      writeTargetRef(w, def.relativeTo.targetId, idIndex);
      w.svarint(def.relativeTo.offset);
    }

    if (def.relativeRecurrence) {
      const rr = def.relativeRecurrence;
      const rrFlags =
        (rr.targetType === 'group' ? 1 : 0) |
        (rr.dayOf ? 2 : 0) |
        (rr.daysBefore ? 4 : 0) |
        (rr.daysAfter ? 8 : 0);
      w.u8(rrFlags);
      if (rr.targetType === 'group') {
        w.varint(idIndex.get(rr.targetGroupId!) ?? 0);
      } else {
        writeTargetRef(w, rr.targetId!, idIndex);
      }
      if (rr.daysBefore) w.svarint(rr.beforeOffset);
      if (rr.daysAfter) w.svarint(rr.afterOffset);
    }

    if (hasExceptions) {
      const keys = Object.keys(def.exceptions!);
      w.varint(keys.length);
      for (const k of keys) {
        w.date(k);
        w.date(def.exceptions![k]);
      }
    }
  }

  return w.toUint8Array();
}

export function decodeCompact(bytes: Uint8Array): SaveData {
  const r = new ByteReader(bytes);
  const version = r.u8();
  if (version !== FORMAT_VERSION) {
    throw new Error('This text was saved with a newer version of the app and cannot be read here.');
  }

  const calendarName = r.str();
  const startDate = r.date();
  const count = r.varint();

  // Pass 1: read every definition's raw fields, deferring target-reference
  // resolution (a reference can point at a later definition in the array).
  type RawTargetRef = { targetId: string };
  type Raw = {
    flags: number;
    title: string;
    date?: string;
    recurrence?: {
      relativeToStartDate?: { startOffset: number; endOffset: number };
      startRecur?: string;
      endRecur?: string;
      recurrenceCycle: number;
      weeklySelections: number[][];
    };
    relativeTo?: RawTargetRef & { offset: number };
    relativeRecurrence?: {
      targetType: 'single' | 'group';
      targetGroupIndex?: number;
      target?: RawTargetRef;
      dayOf: boolean;
      daysBefore: boolean;
      daysAfter: boolean;
      beforeOffset: number;
      afterOffset: number;
    };
    exceptions?: Record<string, string>;
  };

  const raws: Raw[] = [];

  // Deferred target refs need the *final* resolved id string, but readTargetRef
  // needs `resolvedIds` up front. Since ids are freshly generated and don't
  // need to match anything from the original save, generate them all now,
  // before resolving any reference.
  const resolvedIds = Array.from({ length: count }, () => crypto.randomUUID());
  const resolvedGroupIds: (string | undefined)[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const flags = r.u8();
    const title = r.str();
    const raw: Raw = { flags, title };

    if (flags & FLAG_HAS_DATE) raw.date = r.date();

    if (flags & FLAG_HAS_RECURRENCE) {
      const sub = r.u8();
      if (sub === 1) {
        raw.recurrence = {
          relativeToStartDate: { startOffset: r.svarint(), endOffset: r.svarint() },
          recurrenceCycle: 0,
          weeklySelections: [],
        };
      } else {
        raw.recurrence = {
          startRecur: r.date(),
          endRecur: r.date(),
          recurrenceCycle: 0,
          weeklySelections: [],
        };
      }
      raw.recurrence.recurrenceCycle = r.varint();
      const weekCount = r.varint();
      const weeklySelections: number[][] = [];
      for (let wk = 0; wk < weekCount; wk++) {
        const bits = r.u8();
        const days: number[] = [];
        for (let d = 0; d < 7; d++) if (bits & (1 << d)) days.push(d);
        weeklySelections.push(days);
      }
      raw.recurrence.weeklySelections = weeklySelections;
    }

    if (flags & FLAG_HAS_RELATIVE_TO) {
      const targetId = readTargetRef(r, resolvedIds);
      const offset = r.svarint();
      raw.relativeTo = { targetId, offset };
    }

    if (flags & FLAG_HAS_RELATIVE_RECURRENCE) {
      const rrFlags = r.u8();
      const targetType: 'single' | 'group' = rrFlags & 1 ? 'group' : 'single';
      const dayOf = !!(rrFlags & 2);
      const daysBefore = !!(rrFlags & 4);
      const daysAfter = !!(rrFlags & 8);
      let targetGroupIndex: number | undefined;
      let target: RawTargetRef | undefined;
      if (targetType === 'group') {
        targetGroupIndex = r.varint();
      } else {
        target = { targetId: readTargetRef(r, resolvedIds) };
      }
      const beforeOffset = daysBefore ? r.svarint() : 0;
      const afterOffset = daysAfter ? r.svarint() : 0;
      raw.relativeRecurrence = {
        targetType,
        targetGroupIndex,
        target,
        dayOf,
        daysBefore,
        daysAfter,
        beforeOffset,
        afterOffset,
      };
    }

    if (flags & FLAG_HAS_EXCEPTIONS) {
      const n = r.varint();
      const exceptions: Record<string, string> = {};
      for (let e = 0; e < n; e++) {
        const k = r.date();
        const v = r.date();
        exceptions[k] = v;
      }
      raw.exceptions = exceptions;
    }

    if (flags & FLAG_HAS_GROUP_ID) resolvedGroupIds[i] = crypto.randomUUID();

    raws.push(raw);
  }

  // Pass 2: assemble EventDefinitions, resolving group-target references
  // (which need `resolvedGroupIds`, only fully known once every definition
  // has been read).
  const eventDefinitions: EventDefinition[] = raws.map((raw, i) => {
    const def: EventDefinition = { id: resolvedIds[i], title: raw.title };
    if (raw.flags & FLAG_HAS_GROUP_ID) def.groupId = resolvedGroupIds[i];
    if (raw.flags & FLAG_DELETED) def.deleted = true;
    if (raw.date) def.date = raw.date;

    if (raw.recurrence) {
      def.recurrence = {
        recurrenceCycle: raw.recurrence.recurrenceCycle,
        weeklySelections: raw.recurrence.weeklySelections,
      };
      if (raw.recurrence.relativeToStartDate) {
        def.recurrence.relativeToStartDate = raw.recurrence.relativeToStartDate;
      } else {
        def.recurrence.startRecur = raw.recurrence.startRecur;
        def.recurrence.endRecur = raw.recurrence.endRecur;
      }
    }

    if (raw.relativeTo) {
      def.relativeTo = { targetId: raw.relativeTo.targetId, offset: raw.relativeTo.offset };
    }

    if (raw.relativeRecurrence) {
      const rr = raw.relativeRecurrence;
      def.relativeRecurrence = {
        targetType: rr.targetType,
        dayOf: rr.dayOf,
        daysBefore: rr.daysBefore,
        daysAfter: rr.daysAfter,
        beforeOffset: rr.beforeOffset,
        afterOffset: rr.afterOffset,
      };
      if (rr.targetType === 'group') {
        def.relativeRecurrence.targetGroupId = resolvedGroupIds[rr.targetGroupIndex!];
      } else {
        def.relativeRecurrence.targetId = rr.target!.targetId;
      }
    }

    if (raw.exceptions) def.exceptions = raw.exceptions;

    return def;
  });

  return { calendarName, startDate, eventDefinitions };
}
