import type { DeviceConfiguration } from './evaluation';
declare global {
	namespace ioBroker {
		interface AdapterConfig {
			/** Legacy storage; migrated to the objects below `devices` on startup. */
			devices?: DeviceConfiguration[];
		}
	}
}
export {};
