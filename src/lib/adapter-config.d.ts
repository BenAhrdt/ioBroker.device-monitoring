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
			/** Whether enabled notification categories are also sent to ioBroker's notification system. Defaults to true. */
			sendNotificationsViaNotify?: boolean;
			/** Title template used for warning notifications and info.message. */
			warningTitleTemplate?: string;
			/** Template used for warning notifications and info.message. */
			warningMessageTemplate?: string;
			/** Title template used for alarm notifications and info.message. */
			alarmTitleTemplate?: string;
			/** Template used for alarm notifications and info.message. */
			alarmMessageTemplate?: string;
			/** Title template used for timeout notifications and info.message. */
			timeoutTitleTemplate?: string;
			/** Template used for timeout notifications and info.message. */
			timeoutMessageTemplate?: string;
			/** Title template used for invalid-source notifications and info.message. */
			invalidSourceTitleTemplate?: string;
			/** Template used for invalid-source notifications and info.message. */
			invalidSourceMessageTemplate?: string;
			/** Title template used for recovery notifications and info.message. */
			recoveredTitleTemplate?: string;
			/** Template used for recovery notifications and info.message. */
			recoveredMessageTemplate?: string;
		}
	}
}
export {};
