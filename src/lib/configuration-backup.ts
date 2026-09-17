import { isDeepStrictEqual } from 'node:util';

/**
 * Returns whether the exact native device configuration differs from its stored backup.
 *
 * @param devicesNative Current native content of the devices folder.
 * @param backup Native content stored in the instance object.
 */
export function configurationBackupNeedsUpdate(devicesNative: Record<string, unknown>, backup: unknown): boolean {
	return !isDeepStrictEqual(devicesNative, backup);
}
