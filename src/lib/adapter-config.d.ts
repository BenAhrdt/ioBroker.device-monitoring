import type { DeviceConfiguration } from './evaluation';
import type { NotificationCategory } from './notifications';
declare global {
	namespace ioBroker {
		interface AdapterConfig {
			/** Legacy storage; migrated to the objects below `devices` on startup. */
			devices?: DeviceConfiguration[];
			/** Minutes of inactivity before the device configuration is backed up. Zero disables automatic backups. */
			configurationBackupDelayMinutes?: number;
			/** Exact copy of the `native` part of the adapter's `devices` folder. */
			deviceConfigurationBackup?: Record<string, unknown>;
			/** Notification categories enabled by the user. */
			enabledNotifications?: NotificationCategory[];
		}
	}
}
export {};
