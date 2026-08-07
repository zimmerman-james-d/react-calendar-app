import { encodeCompact, decodeCompact } from '../src/utils/compactSaveFormat';
import { deflateSync, inflateSync } from 'fflate';
import CryptoJS from 'crypto-js';
import { EventDefinition, SaveData } from '../src/types';

function byTitle(defs: EventDefinition[], title: string): EventDefinition {
  const found = defs.find(d => d.title === title);
  if (!found) throw new Error(`no definition titled "${title}"`);
  return found;
}

describe('compactSaveFormat round-trip', () => {
  it('round-trips an empty calendar', () => {
    const data: SaveData = { calendarName: 'Empty', startDate: '2026-07-30', eventDefinitions: [] };
    const decoded = decodeCompact(encodeCompact(data));
    expect(decoded).toEqual(data);
  });

  it('round-trips a single specific-date event', () => {
    const data: SaveData = {
      calendarName: 'Test',
      startDate: '2026-07-30',
      eventDefinitions: [{ id: 'x', title: 'Port Placement', date: '2026-08-05' }],
    };
    const decoded = decodeCompact(encodeCompact(data));
    expect(decoded.calendarName).toBe('Test');
    expect(decoded.startDate).toBe('2026-07-30');
    expect(byTitle(decoded.eventDefinitions, 'Port Placement').date).toBe('2026-08-05');
  });

  it('round-trips a recurring weekly event across multiple cycle weeks', () => {
    const data: SaveData = {
      calendarName: 'Test',
      startDate: '2026-07-30',
      eventDefinitions: [{
        id: 'x',
        groupId: 'g1',
        title: 'Steroids',
        recurrence: {
          startRecur: '2026-07-30',
          endRecur: '2026-09-10',
          weeklySelections: [[0, 1, 2, 3, 4, 5, 6], [1, 3, 5]],
          recurrenceCycle: 2,
        },
      }],
    };
    const decoded = decodeCompact(encodeCompact(data));
    const steroids = byTitle(decoded.eventDefinitions, 'Steroids');
    expect(steroids.recurrence).toEqual({
      startRecur: '2026-07-30',
      endRecur: '2026-09-10',
      weeklySelections: [[0, 1, 2, 3, 4, 5, 6], [1, 3, 5]],
      recurrenceCycle: 2,
    });
    expect(steroids.groupId).toBeTruthy();
  });

  it('round-trips a recurring event relative to the start-date window', () => {
    const data: SaveData = {
      calendarName: 'Test',
      startDate: '2026-07-30',
      eventDefinitions: [{
        id: 'x',
        groupId: 'g1',
        title: 'Labs',
        recurrence: {
          relativeToStartDate: { startOffset: 0, endOffset: 14 },
          weeklySelections: [[1, 3]],
          recurrenceCycle: 1,
        },
      }],
    };
    const decoded = decodeCompact(encodeCompact(data));
    expect(byTitle(decoded.eventDefinitions, 'Labs').recurrence).toEqual({
      relativeToStartDate: { startOffset: 0, endOffset: 14 },
      weeklySelections: [[1, 3]],
      recurrenceCycle: 1,
    });
  });

  it('round-trips relativeTo targeting "start-date"', () => {
    const data: SaveData = {
      calendarName: 'Test',
      startDate: '2026-07-30',
      eventDefinitions: [{ id: 'x', title: 'Pre-Med', relativeTo: { targetId: 'start-date', offset: -3 } }],
    };
    const decoded = decodeCompact(encodeCompact(data));
    expect(byTitle(decoded.eventDefinitions, 'Pre-Med').relativeTo).toEqual({ targetId: 'start-date', offset: -3 });
  });

  it('round-trips relativeTo targeting a plain event id, preserving the reference after ids are regenerated', () => {
    const data: SaveData = {
      calendarName: 'Test',
      startDate: '2026-07-30',
      eventDefinitions: [
        { id: 'anchor-id', title: 'Diagnosis', date: '2026-07-30' },
        { id: 'x', title: 'Follow-up Scan', relativeTo: { targetId: 'anchor-id', offset: 30 } },
      ],
    };
    const decoded = decodeCompact(encodeCompact(data));
    const diagnosis = byTitle(decoded.eventDefinitions, 'Diagnosis');
    const scan = byTitle(decoded.eventDefinitions, 'Follow-up Scan');
    expect(scan.relativeTo!.targetId).toBe(diagnosis.id);
    expect(scan.relativeTo!.offset).toBe(30);
  });

  it('round-trips relativeTo targeting a compound occurrence id (a specific date within a recurring series)', () => {
    // Mirrors what SingleEventForm's "relative to" dropdown produces when a
    // user targets one specific occurrence of a recurring series: a
    // `${seriesId}-${date}` compound id (see eventUtils.tsx / SingleEventForm.tsx).
    const data: SaveData = {
      calendarName: 'Test',
      startDate: '2026-07-30',
      eventDefinitions: [
        {
          id: 'series-id', groupId: 'series-group', title: 'Vincristine',
          recurrence: { startRecur: '2026-07-30', endRecur: '2026-08-20', weeklySelections: [[4]], recurrenceCycle: 1 },
        },
        { id: 'x', title: 'Pre-med', relativeTo: { targetId: 'series-id-2026-08-07', offset: -1 } },
      ],
    };
    const decoded = decodeCompact(encodeCompact(data));
    const series = byTitle(decoded.eventDefinitions, 'Vincristine');
    const premed = byTitle(decoded.eventDefinitions, 'Pre-med');
    expect(premed.relativeTo!.targetId).toBe(`${series.id}-2026-08-07`);
  });

  it('round-trips relativeRecurrence targeting a group, resolving to the CORRECT series (not a naive id-index lookup)', () => {
    // This is the case that broke during prototyping: targetGroupId
    // references a definition's `groupId`, a *different* field than `id`.
    // Include a decoy series first so an id-only index would misresolve.
    const data: SaveData = {
      calendarName: 'Test',
      startDate: '2026-07-30',
      eventDefinitions: [
        {
          id: 'decoy-id', groupId: 'decoy-group', title: 'Asparaginase',
          recurrence: { startRecur: '2026-07-30', endRecur: '2026-08-20', weeklySelections: [[2]], recurrenceCycle: 1 },
        },
        {
          id: 'target-id', groupId: 'target-group', title: 'Vincristine',
          recurrence: { startRecur: '2026-07-30', endRecur: '2026-08-20', weeklySelections: [[4]], recurrenceCycle: 1 },
        },
        {
          id: 'x', title: 'No Fluconazole',
          relativeRecurrence: {
            targetGroupId: 'target-group', targetType: 'group',
            daysBefore: true, beforeOffset: 1, daysAfter: true, afterOffset: 1, dayOf: true,
          },
        },
      ],
    };
    const decoded = decodeCompact(encodeCompact(data));
    const decoy = byTitle(decoded.eventDefinitions, 'Asparaginase');
    const target = byTitle(decoded.eventDefinitions, 'Vincristine');
    const noFluc = byTitle(decoded.eventDefinitions, 'No Fluconazole');
    expect(noFluc.relativeRecurrence!.targetGroupId).toBe(target.groupId);
    expect(noFluc.relativeRecurrence!.targetGroupId).not.toBe(decoy.groupId);
    expect(noFluc.relativeRecurrence).toMatchObject({
      targetType: 'group', daysBefore: true, beforeOffset: 1, daysAfter: true, afterOffset: 1, dayOf: true,
    });
  });

  it('round-trips relativeRecurrence targeting a single event and start-date', () => {
    const data: SaveData = {
      calendarName: 'Test',
      startDate: '2026-07-30',
      eventDefinitions: [
        { id: 'single-id', title: 'Diagnosis', date: '2026-07-30' },
        {
          id: 'a', title: 'Reminder A',
          relativeRecurrence: {
            targetId: 'single-id', targetType: 'single',
            daysBefore: true, beforeOffset: 2, daysAfter: false, afterOffset: 0, dayOf: false,
          },
        },
        {
          id: 'b', title: 'Reminder B',
          relativeRecurrence: {
            targetId: 'start-date', targetType: 'single',
            daysBefore: false, beforeOffset: 0, daysAfter: true, afterOffset: 5, dayOf: true,
          },
        },
      ],
    };
    const decoded = decodeCompact(encodeCompact(data));
    const diagnosis = byTitle(decoded.eventDefinitions, 'Diagnosis');
    const reminderA = byTitle(decoded.eventDefinitions, 'Reminder A');
    const reminderB = byTitle(decoded.eventDefinitions, 'Reminder B');
    expect(reminderA.relativeRecurrence!.targetId).toBe(diagnosis.id);
    expect(reminderA.relativeRecurrence).toMatchObject({ daysBefore: true, beforeOffset: 2, daysAfter: false, dayOf: false });
    expect(reminderB.relativeRecurrence!.targetId).toBe('start-date');
    expect(reminderB.relativeRecurrence).toMatchObject({ daysAfter: true, afterOffset: 5, dayOf: true, daysBefore: false });
  });

  it('round-trips exceptions', () => {
    const data: SaveData = {
      calendarName: 'Test',
      startDate: '2026-07-30',
      eventDefinitions: [{
        id: 'x', groupId: 'g', title: 'Vincristine',
        recurrence: { startRecur: '2026-07-30', endRecur: '2026-08-20', weeklySelections: [[4]], recurrenceCycle: 1 },
        exceptions: { '2026-08-07': '2026-08-08', '2026-08-14': '2026-08-15' },
      }],
    };
    const decoded = decodeCompact(encodeCompact(data));
    expect(byTitle(decoded.eventDefinitions, 'Vincristine').exceptions).toEqual({
      '2026-08-07': '2026-08-08',
      '2026-08-14': '2026-08-15',
    });
  });

  it('round-trips deleted: true', () => {
    const data: SaveData = {
      calendarName: 'Test',
      startDate: '2026-07-30',
      eventDefinitions: [
        { id: 'a', title: 'Active', date: '2026-08-01' },
        { id: 'b', title: 'Removed', date: '2026-08-02', deleted: true },
      ],
    };
    const decoded = decodeCompact(encodeCompact(data));
    expect(byTitle(decoded.eventDefinitions, 'Active').deleted).toBeFalsy();
    expect(byTitle(decoded.eventDefinitions, 'Removed').deleted).toBe(true);
  });

  it('round-trips negative offsets correctly (zigzag varint correctness)', () => {
    const data: SaveData = {
      calendarName: 'Test',
      startDate: '2026-07-30',
      eventDefinitions: [
        { id: 'a', title: 'Before Start', relativeTo: { targetId: 'start-date', offset: -45 } },
        {
          id: 'b', groupId: 'g', title: 'Windowed',
          recurrence: { relativeToStartDate: { startOffset: -10, endOffset: -1 }, weeklySelections: [[0]], recurrenceCycle: 1 },
        },
      ],
    };
    const decoded = decodeCompact(encodeCompact(data));
    expect(byTitle(decoded.eventDefinitions, 'Before Start').relativeTo!.offset).toBe(-45);
    expect(byTitle(decoded.eventDefinitions, 'Windowed').recurrence!.relativeToStartDate).toEqual({ startOffset: -10, endOffset: -1 });
  });

  it('round-trips unicode in title and calendarName', () => {
    const data: SaveData = {
      calendarName: 'Calendário • 治療スケジュール 🩺',
      startDate: '2026-07-30',
      eventDefinitions: [{ id: 'x', title: 'Événement café ☕ — día 5', date: '2026-08-01' }],
    };
    const decoded = decodeCompact(encodeCompact(data));
    expect(decoded.calendarName).toBe(data.calendarName);
    expect(decoded.eventDefinitions[0].title).toBe(data.eventDefinitions[0].title);
  });

  it('round-trips a realistic mixed calendar end-to-end', () => {
    const data: SaveData = {
      calendarName: 'Full Regimen',
      startDate: '2026-07-30',
      eventDefinitions: [
        { id: '1', title: 'Diagnosis', date: '2026-07-30' },
        { id: '2', title: 'Pre-Med', relativeTo: { targetId: 'start-date', offset: -1 } },
        {
          id: '3', groupId: 'g3', title: 'Vincristine',
          recurrence: { startRecur: '2026-07-30', endRecur: '2026-10-30', weeklySelections: [[4]], recurrenceCycle: 1 },
        },
        {
          id: '4', title: 'No Fluconazole',
          relativeRecurrence: { targetGroupId: 'g3', targetType: 'group', daysBefore: true, beforeOffset: 1, daysAfter: true, afterOffset: 1, dayOf: true },
        },
        { id: '5', title: 'Specific Follow-up Scan', relativeTo: { targetId: '3-2026-08-06', offset: 2 } },
      ],
    };
    const decoded = decodeCompact(encodeCompact(data));
    expect(decoded.eventDefinitions).toHaveLength(5);
    expect(decoded.calendarName).toBe('Full Regimen');
    expect(decoded.startDate).toBe('2026-07-30');
  });
});

describe('compactSaveFormat full pipeline (deflate + AES, matching the real Copy/Paste flow)', () => {
  it('survives compression and encryption round-trip', () => {
    const data: SaveData = {
      calendarName: 'Pipeline Test',
      startDate: '2026-07-30',
      eventDefinitions: [
        { id: '1', title: 'Diagnosis', date: '2026-07-30' },
        {
          id: '2', groupId: 'g2', title: 'Steroids',
          recurrence: { startRecur: '2026-07-30', endRecur: '2026-08-12', weeklySelections: [[0, 1, 2, 3, 4, 5, 6]], recurrenceCycle: 1 },
        },
      ],
    };

    const password = 'correct-horse-battery-staple';
    const encoded = encodeCompact(data);
    const compressed = deflateSync(encoded);
    const encrypted = CryptoJS.AES.encrypt(CryptoJS.lib.WordArray.create(compressed), password).toString();

    // ... string gets copied into Teams, pasted back later ...

    const decryptedWordArray = CryptoJS.AES.decrypt(encrypted, password);
    const decryptedBytes = new Uint8Array(decryptedWordArray.sigBytes);
    for (let i = 0; i < decryptedWordArray.sigBytes; i++) {
      decryptedBytes[i] = (decryptedWordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    const decompressed = inflateSync(decryptedBytes);
    const decoded = decodeCompact(decompressed);

    expect(decoded.calendarName).toBe('Pipeline Test');
    expect(byTitle(decoded.eventDefinitions, 'Steroids').recurrence!.weeklySelections).toEqual([[0, 1, 2, 3, 4, 5, 6]]);
  });

  it('fails to decrypt cleanly with the wrong password', () => {
    // Matches SaveLoadControls.tsx's handleDecryptAndLoadText: the wrong
    // password can make CryptoJS's PKCS7 unpadding produce a garbage (even
    // negative) sigBytes, so the whole decrypt->bytes->inflate chain needs
    // to be treated as one failure-prone unit, not just the inflate step.
    const data: SaveData = { calendarName: 'X', startDate: '2026-07-30', eventDefinitions: [] };
    const compressed = deflateSync(encodeCompact(data));
    const encrypted = CryptoJS.AES.encrypt(CryptoJS.lib.WordArray.create(compressed), 'right-password').toString();

    expect(() => {
      const decryptedWordArray = CryptoJS.AES.decrypt(encrypted, 'wrong-password');
      const decryptedBytes = new Uint8Array(decryptedWordArray.sigBytes);
      for (let i = 0; i < decryptedWordArray.sigBytes; i++) {
        decryptedBytes[i] = (decryptedWordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      }
      inflateSync(decryptedBytes);
    }).toThrow();
  });
});
