import { EventDefinition } from '../types';
import { parseISODate, toISODate, daysBetween } from './rebaseStartDate';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * An event written relative to one instance of a recurring series stores its
 * target as the series' definition id plus that instance's literal date
 * (see the id built in useEventGenerator). When the series is anchored to the
 * start date, moving the start date moves every instance, so the stored id
 * stops resolving and the dependent event silently disappears from the
 * calendar rather than moving with its target.
 *
 * Rewriting the embedded date by the same shift keeps those references
 * pointing at the same instance. Series pinned to literal dates do not move,
 * so references into them are left alone.
 */
export function remapInstanceReferences(
    eventDefinitions: EventDefinition[],
    oldStartDate: string,
    newStartDate: string
): EventDefinition[] {
    if (!oldStartDate || !newStartDate) return eventDefinitions;

    const shiftDays = daysBetween(oldStartDate, newStartDate);
    if (shiftDays === 0) return eventDefinitions;

    return eventDefinitions.map(def => {
        const targetId = def.relativeTo?.targetId;
        if (!targetId || targetId === 'start-date') return def;

        const owner = eventDefinitions.find(d => targetId.startsWith(d.id + '-'));
        if (!owner?.recurrence?.relativeToStartDate) return def;

        const instanceDate = targetId.slice(owner.id.length + 1);
        if (!ISO_DATE.test(instanceDate)) return def;

        const moved = parseISODate(instanceDate);
        moved.setUTCDate(moved.getUTCDate() + shiftDays);

        return { ...def, relativeTo: { ...def.relativeTo!, targetId: `${owner.id}-${toISODate(moved)}` } };
    });
}
