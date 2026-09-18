import * as utils from '@iobroker/adapter-core';
import { DeviceManagement } from '@iobroker/dm-utils';
import {
	createFunctionTemplate,
	getWatchStatus,
	isUpdateTimedOut,
	type DeviceConfiguration,
	type FunctionTemplate,
	type LimitConfiguration,
	type LimitMode,
	type WatchedStateConfiguration,
	type WatchStatus,
} from './lib/evaluation';
import { configurationBackupNeedsUpdate } from './lib/configuration-backup';
import type { MonitoringData } from './lib/monitoring-data';
import { notificationCategoryForTransition, type NotificationCategory } from './lib/notifications';
import { averageInterval, intervalDisplay, parseUpdateHistory, UPDATE_HISTORY_SIZE } from './lib/update-history';

const t = (en: string, de: string): ioBroker.Translated => ({ en, de });
const COLORS: Record<WatchStatus, string> = {
	invalid: '#6d4c41',
	timeout: '#1976d2',
	alarm: '#c62828',
	warning: '#d6a500',
	ok: '#3f7d45',
	unknown: '#607d8b',
};
const svgIcon = (content: string): string => `data:image/svg+xml,${encodeURIComponent(content)}`;
const STATUS_ICONS = {
	invalid: svgIcon(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#6d4c41"/><path d="M8.2 8.2l7.6 7.6M9.2 14.8l-1.4 1.4a2.8 2.8 0 01-4-4l2.4-2.4a2.8 2.8 0 014 0M14.8 9.2l1.4-1.4a2.8 2.8 0 014 4l-2.4 2.4a2.8 2.8 0 01-4 0" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>',
	),
	timeout: svgIcon(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1976d2"/><circle cx="12" cy="12" r="5.7" fill="none" stroke="white" stroke-width="1.8"/><path d="M12 8.4v4l2.8 1.7" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
	),
	ok: svgIcon(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#2e9d38"/><path d="M7 12.5l3.1 3.1L17.5 8" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
	),
	warning: svgIcon(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#e6a700"/><path d="M12 6.4l6.1 10.7H5.9L12 6.4z" fill="white"/><path d="M12 9.3v4.2" stroke="#b77900" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="15.6" r="1" fill="#b77900"/></svg>',
	),
	alarm: svgIcon(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#d62828"/><path d="M12 6.8v7" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.35" fill="white"/></svg>',
	),
	unknown: svgIcon(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#607d8b"/><path d="M9.5 9a2.7 2.7 0 115 1.4c-.8 1.2-2.5 1.4-2.5 3" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.2" fill="white"/></svg>',
	),
};
const LEGACY_RUNTIME_STATE_IDS = [
	'value',
	'status',
	'display',
	'warning',
	'alarm',
	'updateTimeout',
	'lastUpdate',
	'previousUpdate',
	'updateInterval',
	'lastUpdateDisplay',
	'previousUpdateDisplay',
	'updateIntervalDisplay',
	'averageUpdateInterval',
	'averageUpdateIntervalDisplay',
	'updateHistory',
	'updateHistorySource',
] as const;
const OBSOLETE_DIRECT_STATE_IDS = [
	'display',
	'lastUpdate',
	'previousUpdate',
	'updateInterval',
	'lastUpdateDisplay',
	'previousUpdateDisplay',
	'updateIntervalDisplay',
	'averageUpdateInterval',
	'averageUpdateIntervalDisplay',
	'updateHistory',
	'updateHistorySource',
	'details',
] as const;
const OBSOLETE_DATA_STATE_IDS = ['value', 'status', 'warning', 'alarm', 'updateTimeout'] as const;
const DEVICE_CARD_DETAILS_ID = '__card_details';
function safeId(value: string, fallback: string): string {
	return (
		value
			.trim()
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9_-]+/g, '_')
			.replace(/^_+|_+$/g, '') || fallback
	);
}
function uniqueId(base: string, used: Set<string>): string {
	let id = base;
	let i = 2;
	while (used.has(id)) {
		id = `${base}_${i++}`;
	}
	return id;
}
function limitDisplay(limit: LimitConfiguration, unit = ''): string {
	const suffix = unit ? ` ${unit}` : '';
	if (limit.mode === 'below') {
		return `< ${limit.min ?? '—'}${suffix}`;
	}
	if (limit.mode === 'above') {
		return `> ${limit.max ?? '—'}${suffix}`;
	}
	return `${limit.min ?? '—'}–${limit.max ?? '—'}${suffix}`;
}
function timestampDisplay(timestamp: number): string {
	const date = new Date(timestamp);
	const pad = (value: number, length = 2): string => String(value).padStart(length, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}
function escapeHtml(value: unknown): string {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

class DeviceMonitoringManagement extends DeviceManagement<DeviceMonitoring, string> {
	public constructor(adapter: DeviceMonitoring) {
		super(adapter, true);
	}
	public async refreshCards(): Promise<void> {
		await this.sendCommandToGui({ command: 'all' });
	}
	protected getInstanceInfo(): any {
		return {
			apiVersion: 'v3',
			communicationStateId: 'info.deviceManager',
			actions: [
				{
					id: 'addDevice',
					icon: 'add',
					title: t('+ Add device', '+ Gerät hinzufügen'),
					variant: 'contained',
					style: { backgroundColor: '#455a64', color: '#fff' },
					handler: async (context: any) => {
						const data = await context.showForm(deviceForm(), {
							title: t('Add device', 'Gerät hinzufügen'),
							data: { name: '' },
							buttons: ['apply', 'cancel'],
						});
						if (!data?.name) {
							return { refresh: false };
						}
						await this.adapter.addDevice(String(data.name));
						return { refresh: true };
					},
				},
			],
		};
	}
	protected async loadDevices(context: any): Promise<void> {
		const devices = await this.adapter.getDevicesWithStatus();
		context.setTotalDevices(devices.length);
		for (const entry of devices) {
			context.addDevice(this.deviceInfo(entry.device));
		}
	}
	private deviceInfo(device: DeviceConfiguration): any {
		const actions: any[] = [
			{
				id: 'addState',
				icon: 'add',
				description: t('Add monitored state', 'Überwachungs-State hinzufügen'),
				handler: async (_id: string, context: any) => {
					const validSourceIds = await this.adapter.getValidSourceIds();
					const data = await context.showForm(
						stateForm(this.adapter.getFunctionTemplates(), this.adapter.getFunctionNames(), device.states),
						{
							title: t('Add monitored state', 'Überwachungs-State hinzufügen'),
							data: defaultStateForm(validSourceIds),
							buttons: ['apply', 'cancel'],
							applyDisabledRule: addStateDisabledRule(device.states),
						},
					);
					if (!data?.sourceId || !data?.name) {
						return { refresh: 'none' };
					}
					await this.adapter.addWatchedState(device.id, data);
					const update = this.updatedDeviceInfo(device.id);
					// An infoUpdate is important here: it makes newly added customInfo
					// items visible immediately in Device Manager implementations that
					// only reconcile existing card items on an action response.
					await this.sendCommandToGui({ command: 'infoUpdate', deviceId: device.id, info: update });
					return { update };
				},
			},
		];
		if (device.states.length) {
			actions.push({
				id: 'editStates',
				icon: 'settings',
				description: t('Edit monitored states', 'Überwachungs-States bearbeiten'),
				handler: async (_deviceId: string, context: any) => {
					const validSourceIds = await this.adapter.getValidSourceIds();
					const formData = {
						_validSourceIds: validSourceIds,
						...Object.fromEntries(device.states.map(watched => [watched.id, watched])),
					};
					const data = await context.showForm(
						statesForm(device.states, this.adapter.getFunctionTemplates(), this.adapter.getFunctionNames()),
						{
							title: t('Edit monitored states', 'Überwachungs-States bearbeiten'),
							data: formData,
							buttons: ['apply', 'cancel'],
							applyDisabledRule: editStatesDisabledRule(device.states),
						},
					);
					if (!data) {
						return { refresh: 'none' };
					}
					await this.adapter.replaceWatchedStates(device.id, data);
					return { update: this.updatedDeviceInfo(device.id) };
				},
			});
		}
		actions.push(
			{
				id: 'rename',
				icon: 'edit',
				description: t('Rename device', 'Gerät umbenennen'),
				handler: async (_id: string, context: any) => {
					const data = await context.showForm(deviceForm(), {
						title: t('Rename device', 'Gerät umbenennen'),
						data: { name: device.name },
						buttons: ['apply', 'cancel'],
					});
					if (!data?.name) {
						return { refresh: 'none' };
					}
					await this.adapter.renameDevice(device.id, String(data.name));
					return { refresh: 'devices' };
				},
			},
			{
				id: 'delete',
				icon: 'delete',
				color: 'secondary',
				description: t('Delete device', 'Gerät löschen'),
				confirmation: t('Delete this device?', 'Dieses Gerät löschen?'),
				handler: async () => {
					await this.adapter.removeDevice(device.id);
					return { refresh: 'devices' };
				},
			},
		);
		return {
			id: device.id,
			name: device.name,
			icon: { stateId: `${this.adapter.namespace}.devices.${device.id}.icon` },
			backgroundColor: { stateId: `${this.adapter.namespace}.devices.${device.id}.color` },
			customInfo: {
				id: device.id,
				schema: {
					type: 'panel',
					style: { marginTop: '-56px' },
					items: {
						_cardDetails: {
							type: 'state',
							oid: `devices.${device.id}.${DEVICE_CARD_DETAILS_ID}.details`,
							control: 'html',
							label: '',
							newLine: true,
							xs: 12,
						},
					},
				},
			},
			actions,
		};
	}
	private updatedDeviceInfo(deviceId: string): any {
		const device = this.adapter.getDeviceConfiguration(deviceId);
		return device ? this.deviceInfo(device) : { id: deviceId, name: deviceId };
	}
}

function deviceForm(): any {
	return {
		type: 'panel',
		items: { name: { type: 'text', label: t('Device name', 'Gerätename'), newLine: true, xs: 12 } },
	};
}
function defaultLimit(mode: LimitMode): LimitConfiguration {
	return { enabled: false, mode };
}
function defaultStateForm(validSourceIds: string[]): any {
	return {
		name: '',
		sourceId: '',
		_validSourceIds: validSourceIds,
		function: '',
		warning: defaultLimit('outside'),
		alarm: defaultLimit('outside'),
		staleWarning: { enabled: false, minutes: 60 },
	};
}
function stateForm(
	functionTemplates: Record<string, FunctionTemplate>,
	functionNames: string[],
	states: WatchedStateConfiguration[],
	stateId?: string,
): any {
	const functions = [...new Set([...functionNames, ...Object.keys(functionTemplates)])].sort();
	const key = (path: string): string => (stateId ? `${stateId}.${path}` : path);
	const data = (path: string): string => (stateId ? `data[${JSON.stringify(stateId)}].${path}` : `data.${path}`);
	const existingNames = JSON.stringify(states.map(state => state.name.trim().toLowerCase()));
	const otherStateIds = JSON.stringify(states.filter(state => state.id !== stateId).map(state => state.id));
	const nameValidator = stateId
		? `return (${data('_delete')} || (() => { const name = String(${data('name')} || '').trim().toLowerCase(); return !!name && !${otherStateIds}.some(id => !data[id]?._delete && String(data[id]?.name || '').trim().toLowerCase() === name); })())`
		: `return (() => { const name = String(${data('name')} || '').trim().toLowerCase(); return !!name && !${existingNames}.includes(name); })()`;
	const sourceValidator = `return (${stateId ? `${data('_delete')} || ` : ''}(Array.isArray(data._validSourceIds) && data._validSourceIds.includes(String(${data('sourceId')} || '').trim())))`;
	const templates = JSON.stringify(functionTemplates);
	const templateValue = (path: string): Record<string, unknown> => ({
		calculateFunc: `(${templates}[${data('function')}] ? ${templates}[${data('function')}].${path} : ${data(path)})`,
		ignoreOwnChanges: true,
	});
	const sectionHeader = (text: ioBroker.Translated, backgroundColor: string): Record<string, unknown> => ({
		type: 'staticText',
		text,
		newLine: true,
		xs: 12,
		style: {
			backgroundColor,
			color: '#fff',
			fontWeight: 700,
			borderRadius: '4px',
			padding: '8px',
		},
	});
	const limits = (prefix: 'warning' | 'alarm', label: ioBroker.Translated, color: string): Record<string, any> => ({
		[key(`${prefix}Header`)]: sectionHeader(label, color),
		[key(`${prefix}.enabled`)]: {
			type: 'checkbox',
			label: t('Enabled', 'Aktiviert'),
			newLine: true,
			xs: 4,
		},
		[key(`${prefix}.mode`)]: {
			type: 'select',
			label: t('Violation when value is …', 'Verletzung, wenn der Wert …'),
			xs: 8,
			options: [
				{ value: 'below', label: t('below the limit', 'unter dem Grenzwert liegt') },
				{ value: 'above', label: t('above the limit', 'über dem Grenzwert liegt') },
				{ value: 'outside', label: t('outside the allowed range', 'außerhalb des erlaubten Bereichs liegt') },
				{ value: 'inside', label: t('inside the forbidden range', 'im verbotenen Bereich liegt') },
			],
			hidden: `!${data(`${prefix}.enabled`)}`,
		},
		[key(`${prefix}.min`)]: {
			type: 'number',
			label: t('Lower limit', 'Untergrenze'),
			newLine: true,
			xs: 6,
			hidden: `!${data(`${prefix}.enabled`)} || ${data(`${prefix}.mode`)} === 'above'`,
		},
		[key(`${prefix}.max`)]: {
			type: 'number',
			label: t('Upper limit', 'Obergrenze'),
			xs: 6,
			hidden: `!${data(`${prefix}.enabled`)} || ${data(`${prefix}.mode`)} === 'below'`,
		},
	});
	return {
		type: 'panel',
		items: {
			[key('name')]: {
				type: 'text',
				label: t('Name', 'Name'),
				newLine: true,
				xs: 12,
				validator: nameValidator,
				validatorErrorText: t(
					'Name is required and must be unique within the device',
					'Der Name ist erforderlich und muss innerhalb des Geräts eindeutig sein',
				),
				validatorNoSaveOnError: true,
			},
			[key('sourceId')]: {
				type: 'objectId',
				label: t('ioBroker state', 'ioBroker-State'),
				newLine: true,
				xs: 12,
				customFilter: { type: 'state', common: { type: 'number' } },
				validator: sourceValidator,
				validatorErrorText: t(
					'Please select an existing ioBroker state',
					'Bitte einen vorhandenen ioBroker-State auswählen',
				),
				validatorNoSaveOnError: true,
			},
			[key('function')]: {
				type: 'autocomplete',
				label: t('Function', 'Funktion'),
				options: functions,
				freeSolo: true,
				onChangeDependsOn: [
					...[
						'warning.enabled',
						'warning.mode',
						'warning.min',
						'warning.max',
						'alarm.enabled',
						'alarm.mode',
						'alarm.min',
						'alarm.max',
						'staleWarning.enabled',
						'staleWarning.minutes',
					].map(path => ({ attr: key(path), onChange: templateValue(path) })),
				],
				help: functions.length
					? t(`Existing functions: ${functions.join(', ')}`, `Vorhandene Funktionen: ${functions.join(', ')}`)
					: undefined,
				newLine: true,
				xs: 12,
			},
			[key('_saveAsTemplate')]: {
				type: 'checkbox',
				label: t(
					'Save or update this selection as function template',
					'Diese Auswahl als Funktionsvorlage speichern oder aktualisieren',
				),
				newLine: true,
				xs: 12,
			},
			...limits('warning', t('Warning limits', 'Warngrenzen'), '#d6a500'),
			...limits('alarm', t('Alarm limits', 'Alarmgrenzen'), '#c62828'),
			[key('staleWarningHeader')]: sectionHeader(t('Update timeout', 'Aktualisierungs-Timeout'), '#1976d2'),
			[key('staleWarning.enabled')]: {
				type: 'checkbox',
				label: t('Warn if the state is not updated', 'Warnen, wenn der State nicht aktualisiert wird'),
				newLine: true,
				xs: 12,
			},
			[key('staleWarning.minutes')]: {
				type: 'number',
				label: t('Timeout in minutes', 'Zeitlimit in Minuten'),
				min: 1,
				step: 1,
				newLine: true,
				xs: 12,
				hidden: `!${data('staleWarning.enabled')}`,
			},
		},
	};
}
function addStateDisabledRule(states: WatchedStateConfiguration[]): string {
	const existingNames = JSON.stringify(states.map(state => state.name.trim().toLowerCase()));
	return `!String(data.name || '').trim() || ${existingNames}.includes(String(data.name || '').trim().toLowerCase()) || !Array.isArray(data._validSourceIds) || !data._validSourceIds.includes(String(data.sourceId || '').trim())`;
}
function editStatesDisabledRule(states: WatchedStateConfiguration[]): string {
	const stateIds = JSON.stringify(states.map(state => state.id));
	return `(() => { const ids = ${stateIds}; return !Array.isArray(data._validSourceIds) || ids.some(id => { const state = data[id]; if (!state || state._delete) return false; const name = String(state.name || '').trim().toLowerCase(); return !name || !data._validSourceIds.includes(String(state.sourceId || '').trim()) || ids.some(otherId => otherId !== id && !data[otherId]?._delete && String(data[otherId]?.name || '').trim().toLowerCase() === name); }); })()`;
}
function statesForm(
	states: WatchedStateConfiguration[],
	functionTemplates: Record<string, FunctionTemplate>,
	functionNames: string[],
): any {
	return {
		type: 'tabs',
		items: Object.fromEntries(
			states.map(watched => {
				const form = stateForm(functionTemplates, functionNames, states, watched.id);
				form.items[`${watched.id}._delete`] = {
					type: 'checkbox',
					label: t('Delete this monitored state', 'Diesen Überwachungs-State löschen'),
					newLine: true,
					xs: 12,
				};
				return [watched.id, { ...form, label: watched.name }];
			}),
		),
	};
}
class DeviceMonitoring extends utils.Adapter {
	private devices: DeviceConfiguration[] = [];
	private functionTemplates: Record<string, FunctionTemplate> = {};
	private nextDeviceNumber = 1;
	private subscribed = new Set<string>();
	private invalidSources = new Set<string>();
	private sourceUnits = new Map<string, string>();
	private updateHistoryQueues = new Map<string, Promise<void>>();
	private notificationStatuses = new Map<string, WatchStatus>();
	private notificationLastSent = new Map<string, number>();
	private cardDetails = new Map<string, string>();
	private cardDetailsQueues = new Map<string, Promise<void>>();
	private legacyRuntimeStatesRemoved = false;
	private resetUpdateHistories = new Set<string>();
	private displayLanguage: 'de' | 'en' = 'en';
	private deviceManagement?: DeviceMonitoringManagement;
	private sortRefreshTimer?: NodeJS.Timeout;
	private staleCheckTimer?: NodeJS.Timeout;
	private configurationBackupTimer?: NodeJS.Timeout;
	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({ ...options, name: 'device-monitoring' });
		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		this.on('objectChange', this.onObjectChange.bind(this));
		this.on('message', this.onMessage.bind(this));
		this.on('unload', callback => {
			if (this.sortRefreshTimer) {
				clearInterval(this.sortRefreshTimer);
			}
			if (this.staleCheckTimer) {
				clearInterval(this.staleCheckTimer);
			}
			if (this.configurationBackupTimer) {
				clearTimeout(this.configurationBackupTimer);
			}
			callback();
		});
	}
	private async onReady(): Promise<void> {
		const systemConfig = await this.getForeignObjectAsync('system.config');
		this.displayLanguage = systemConfig?.common?.language === 'de' ? 'de' : 'en';
		this.deviceManagement = new DeviceMonitoringManagement(this);
		const legacyDevices = this.normalizeDevices(this.config.devices);
		this.devices = legacyDevices.length ? legacyDevices : await this.loadDevicesFromObjects();
		if (!legacyDevices.length && !this.devices.length) {
			if (await this.restoreDeviceConfigurationBackup(false)) {
				this.log.info('Restored the device configuration from the instance backup');
			}
		}
		await this.ensureState('info.deviceInfo', t('Device information', 'Geräteinformationen'), 'string', 'json');
		await this.rebuildObjects();
		if (legacyDevices.length) {
			await this.removeLegacyDeviceConfig();
		}
		await this.refreshSubscriptions();
		await this.updateAll();
		await this.setState('info.connection', true, true);
		this.sortRefreshTimer = setInterval(() => {
			void this.deviceManagement?.refreshCards();
		}, 10_000);
		this.staleCheckTimer = setInterval(() => {
			void this.updateAll();
		}, 60_000);
		this.scheduleConfigurationBackup();
	}
	private async onMessage(message: ioBroker.Message): Promise<void> {
		if (message.command === 'backupDeviceConfiguration') {
			try {
				const updated = await this.backupDeviceConfiguration();
				this.sendTo(
					message.from,
					message.command,
					{ result: updated ? 'backupUpdated' : 'backupCurrent' },
					message.callback,
				);
			} catch (error) {
				this.sendTo(message.from, message.command, { error: String(error) }, message.callback);
			}
			return;
		}
		if (message.command === 'restoreDeviceConfiguration') {
			try {
				const restored = await this.restoreDeviceConfigurationBackup(true);
				this.sendTo(
					message.from,
					message.command,
					{ result: restored ? 'backupRestored' : 'backupMissing' },
					message.callback,
				);
			} catch (error) {
				this.sendTo(message.from, message.command, { error: String(error) }, message.callback);
			}
			return;
		}
		if (!message.command?.startsWith('dm:')) {
			this.log.debug(`Unhandled command: ${message.command}`);
		}
	}
	private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
		if (!state) {
			return;
		}
		const affectedDevices = new Set<string>();
		for (const device of this.devices) {
			for (const watched of device.states) {
				if (watched.sourceId === id) {
					await this.updateValue(device, watched, state);
					affectedDevices.add(device.id);
				}
			}
		}
		for (const deviceId of affectedDevices) {
			const device = this.devices.find(entry => entry.id === deviceId);
			if (device) {
				await this.updateDeviceSummary(device);
			}
		}
		if (affectedDevices.size) {
			await this.updateDeviceInfo();
		}
	}
	private async onObjectChange(id: string, object: ioBroker.Object | null | undefined): Promise<void> {
		if (!this.subscribed.has(id)) {
			return;
		}
		if (this.isValidSourceObject(object)) {
			this.invalidSources.delete(id);
			this.sourceUnits.set(id, typeof object.common.unit === 'string' ? object.common.unit : '');
		} else {
			this.invalidSources.add(id);
			this.sourceUnits.delete(id);
		}
		const affectedDevices = new Set<string>();
		for (const device of this.devices) {
			for (const watched of device.states) {
				if (watched.sourceId === id) {
					const state = await this.getForeignStateAsync(id);
					await this.updateValue(device, watched, state);
					affectedDevices.add(device.id);
				}
			}
		}
		for (const deviceId of affectedDevices) {
			const device = this.devices.find(entry => entry.id === deviceId);
			if (device) {
				await this.updateDeviceSummary(device);
			}
		}
		if (affectedDevices.size) {
			await this.updateDeviceInfo();
			await this.deviceManagement?.refreshCards();
		}
	}
	public getFunctionTemplates(): Record<string, FunctionTemplate> {
		return JSON.parse(JSON.stringify(this.functionTemplates));
	}
	public localize(en: string, de: string): string {
		return this.displayLanguage === 'de' ? de : en;
	}
	public getFunctionNames(): string[] {
		return [...new Set(this.devices.flatMap(device => device.states.map(state => state.function)).filter(Boolean))];
	}
	public getDeviceConfiguration(deviceId: string): DeviceConfiguration | undefined {
		return this.devices.find(device => device.id === deviceId);
	}
	public async getDevicesWithStatus(): Promise<
		{
			device: DeviceConfiguration;
			status: WatchStatus;
		}[]
	> {
		const rank: Record<WatchStatus, number> = { invalid: 0, timeout: 1, alarm: 2, warning: 3, unknown: 4, ok: 5 };
		const result = await Promise.all(
			this.devices.map(async device => ({ device, status: await this.getDeviceStatus(device) })),
		);
		return result.sort((a, b) => rank[a.status] - rank[b.status] || a.device.name.localeCompare(b.device.name));
	}
	public async addDevice(name: string): Promise<void> {
		const used = new Set(this.devices.map(device => device.id));
		let id: string;
		do {
			id = `device_${String(this.nextDeviceNumber++).padStart(3, '0')}`;
		} while (used.has(id));
		await this.saveDevices([...this.devices, { id, name: name.trim(), states: [] }]);
	}
	public async renameDevice(id: string, name: string): Promise<void> {
		await this.saveDevices(this.devices.map(d => (d.id === id ? { ...d, name: name.trim() } : d)));
	}
	public async removeDevice(id: string): Promise<void> {
		await this.delObjectAsync(`devices.${id}`, { recursive: true });
		await this.saveDevices(this.devices.filter(d => d.id !== id));
	}
	public async addWatchedState(deviceId: string, data: any): Promise<void> {
		const device = this.devices.find(d => d.id === deviceId);
		if (!device) {
			return;
		}
		const usedIds = new Set([DEVICE_CARD_DETAILS_ID, ...device.states.map(s => s.id)]);
		const id = uniqueId(safeId(String(data.name), 'state'), usedIds);
		this.saveFunctionTemplate(data);
		await this.saveDevices(
			this.devices.map(d =>
				d.id === deviceId ? { ...d, states: [...d.states, this.normalizeState(data, id)] } : d,
			),
			false,
		);
	}
	public async updateWatchedState(deviceId: string, stateId: string, data: any): Promise<void> {
		this.saveFunctionTemplate(data);
		await this.saveDevices(
			this.devices.map(d =>
				d.id === deviceId
					? {
							...d,
							states: d.states.map(state =>
								state.id === stateId ? this.normalizeState(data, stateId) : state,
							),
						}
					: d,
			),
		);
	}
	public async replaceWatchedStates(deviceId: string, data: Record<string, any>): Promise<void> {
		const device = this.devices.find(entry => entry.id === deviceId);
		if (!device) {
			return;
		}
		for (const watched of device.states) {
			this.saveFunctionTemplate(data[watched.id]);
		}
		const states = device.states
			.filter(watched => !data[watched.id]?._delete)
			.map(watched => this.normalizeState(data[watched.id] || watched, watched.id));
		await this.saveDevices(
			this.devices.map(entry => (entry.id === deviceId ? { ...entry, states } : entry)),
			false,
		);
	}
	public async removeWatchedState(deviceId: string, stateId: string): Promise<void> {
		await this.delObjectAsync(`devices.${deviceId}.${stateId}`, { recursive: true });
		await this.saveDevices(
			this.devices.map(d => (d.id === deviceId ? { ...d, states: d.states.filter(s => s.id !== stateId) } : d)),
		);
	}
	private normalizeState(data: any, id: string): WatchedStateConfiguration {
		const limit = (input: any, fallback: LimitMode): LimitConfiguration => ({
			enabled: input?.enabled === true,
			mode: ['below', 'above', 'outside', 'inside'].includes(input?.mode) ? input.mode : fallback,
			min: typeof input?.min === 'number' ? input.min : undefined,
			max: typeof input?.max === 'number' ? input.max : undefined,
		});
		return {
			id,
			name: String(data.name || id).trim(),
			sourceId: String(data.sourceId || '').trim(),
			function: String(data.function || '').trim(),
			warning: limit(data.warning, 'outside'),
			alarm: limit(data.alarm, 'outside'),
			staleWarning: {
				enabled: data.staleWarning?.enabled === true,
				minutes:
					typeof data.staleWarning?.minutes === 'number' && data.staleWarning.minutes > 0
						? data.staleWarning.minutes
						: 60,
			},
		};
	}
	private saveFunctionTemplate(data: any): void {
		const functionName = String(data?.function || '').trim();
		if (!functionName || data?._saveAsTemplate !== true) {
			return;
		}
		this.functionTemplates[functionName] = createFunctionTemplate(this.normalizeState(data, 'template'));
	}
	private normalizeDevices(value: unknown): DeviceConfiguration[] {
		if (!Array.isArray(value)) {
			return [];
		}
		const used = new Set<string>();
		return value
			.filter(item => item && typeof item === 'object')
			.map((item: any, i) => {
				const configuredId = String(item.id || '');
				const match = /^device_(\d+)$/.exec(configuredId);
				let number = match && Number(match[1]) > 0 ? Number(match[1]) : this.nextDeviceNumber;
				let id = `device_${String(number).padStart(3, '0')}`;
				while (used.has(id)) {
					number = this.nextDeviceNumber;
					id = `device_${String(number).padStart(3, '0')}`;
					this.nextDeviceNumber++;
				}
				used.add(id);
				this.nextDeviceNumber = Math.max(this.nextDeviceNumber, number + 1);
				return {
					id,
					name: String(item.name || `Device ${i + 1}`),
					states: Array.isArray(item.states)
						? item.states.map((s: any, j: number) =>
								this.normalizeState(s, safeId(String(s.id || s.name || ''), `state_${j + 1}`)),
							)
						: [],
				};
			});
	}
	private async saveDevices(devices: DeviceConfiguration[], refreshCards = true): Promise<void> {
		this.devices = devices;
		const activeCardDetails = new Set(
			devices.flatMap(device => device.states.map(watched => `${device.id}.${watched.id}`)),
		);
		for (const key of this.cardDetails.keys()) {
			if (!activeCardDetails.has(key)) {
				this.cardDetails.delete(key);
			}
		}
		await this.rebuildObjects();
		await this.removeLegacyDeviceConfig();
		await this.refreshSubscriptions();
		await this.updateAll();
		if (refreshCards) {
			await this.deviceManagement?.refreshCards();
		}
		this.scheduleConfigurationBackup();
	}
	private scheduleConfigurationBackup(): void {
		if (this.configurationBackupTimer) {
			clearTimeout(this.configurationBackupTimer);
			this.configurationBackupTimer = undefined;
		}
		const minutes = Number(this.config.configurationBackupDelayMinutes ?? 60);
		if (!Number.isFinite(minutes) || minutes <= 0) {
			return;
		}
		this.configurationBackupTimer = setTimeout(
			() => {
				this.configurationBackupTimer = undefined;
				void this.backupDeviceConfiguration().catch(error =>
					this.log.error(`Could not back up device configuration: ${String(error)}`),
				);
			},
			Math.min(minutes, 35_791) * 60_000,
		);
	}
	private async backupDeviceConfiguration(): Promise<boolean> {
		const devicesFolder = await this.getObjectAsync('devices');
		if (!devicesFolder?.native) {
			throw new Error('The devices folder does not exist');
		}
		const instanceId = `system.adapter.${this.namespace}`;
		const instanceObject = (await this.getForeignObjectAsync(instanceId)) as ioBroker.InstanceObject | null;
		if (!instanceObject) {
			throw new Error(`The instance object ${instanceId} does not exist`);
		}
		if (!configurationBackupNeedsUpdate(devicesFolder.native, instanceObject.native.deviceConfigurationBackup)) {
			return false;
		}
		instanceObject.native.deviceConfigurationBackup = structuredClone(devicesFolder.native);
		await this.setForeignObjectAsync(instanceId, instanceObject);
		this.log.info('Updated the device configuration backup in the instance object');
		return true;
	}
	private async restoreDeviceConfigurationBackup(rebuild: boolean): Promise<boolean> {
		const instanceId = `system.adapter.${this.namespace}`;
		const instanceObject = (await this.getForeignObjectAsync(instanceId)) as ioBroker.InstanceObject | null;
		const backup = instanceObject?.native.deviceConfigurationBackup;
		if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
			return false;
		}
		this.nextDeviceNumber =
			typeof backup.nextDeviceNumber === 'number' && backup.nextDeviceNumber > 0
				? Math.floor(backup.nextDeviceNumber)
				: 1;
		const devices = this.normalizeDevices(backup.devices);
		if (!devices.length) {
			return false;
		}
		this.functionTemplates = this.normalizeFunctionTemplates(backup.functionTemplates);
		this.devices = devices;
		if (rebuild) {
			await this.rebuildObjects();
			await this.refreshSubscriptions();
			await this.updateAll();
			await this.deviceManagement?.refreshCards();
			this.scheduleConfigurationBackup();
		}
		return true;
	}
	private async rebuildObjects(): Promise<void> {
		await this.setObjectAsync('devices', {
			type: 'folder',
			common: { name: t('Devices', 'Geräte') },
			native: {
				devices: this.devices,
				nextDeviceNumber: this.nextDeviceNumber,
				functionTemplates: this.functionTemplates,
			},
		});
		const expected = new Set<string>();
		for (const device of this.devices) {
			expected.add(device.id);
			expected.add(`${device.id}.color`);
			expected.add(`${device.id}.icon`);
			expected.add(`${device.id}.${DEVICE_CARD_DETAILS_ID}`);
			await this.setObjectAsync(`devices.${device.id}`, {
				type: 'device',
				common: { name: device.name },
				native: {},
			});
			await this.ensureState(`devices.${device.id}.color`, t('Card color', 'Kachelfarbe'), 'string', 'text');
			await this.ensureState(`devices.${device.id}.icon`, t('Card icon', 'Kachelsymbol'), 'string', 'text');
			await this.setObjectAsync(`devices.${device.id}.${DEVICE_CARD_DETAILS_ID}`, {
				type: 'channel',
				common: { name: t('Device Manager data', 'Device-Manager-Daten'), expert: true },
				native: {},
			});
			await this.ensureState(
				`devices.${device.id}.${DEVICE_CARD_DETAILS_ID}.details`,
				t('Device card details', 'Kacheldetails'),
				'string',
				'html',
				undefined,
				true,
			);
			for (const watched of device.states) {
				expected.add(`${device.id}.${watched.id}`);
				const base = `devices.${device.id}.${watched.id}`;
				const existingChannel = await this.getObjectAsync(base);
				if (
					existingChannel?.type === 'channel' &&
					typeof existingChannel.native?.sourceId === 'string' &&
					existingChannel.native.sourceId !== watched.sourceId
				) {
					this.resetUpdateHistories.add(base);
				}
				await this.setObjectAsync(base, {
					type: 'channel',
					common: { name: watched.name },
					native: { sourceId: watched.sourceId, function: watched.function },
				});
				const unit = await this.getSourceUnit(watched.sourceId);
				await this.ensureState(`${base}.value`, t('Current value', 'Aktueller Wert'), 'mixed', 'value', unit);
				await this.ensureState(`${base}.status`, t('Status', 'Status'), 'string', 'text');
				await this.ensureState(`${base}.warning`, t('Warning', 'Warnung'), 'boolean', 'indicator');
				await this.ensureState(`${base}.alarm`, t('Alarm', 'Alarm'), 'boolean', 'indicator.alarm');
				await this.ensureState(
					`${base}.updateTimeout`,
					t('Update timeout', 'Aktualisierungs-Timeout'),
					'boolean',
					'indicator.maintenance',
				);
				await this.ensureState(`${base}.sourceId`, t('Source state', 'Quell-State'), 'string', 'text');
				await this.setObjectAsync(`${base}.data`, {
					type: 'channel',
					common: { name: t('Monitoring data', 'Überwachungsdaten'), expert: true },
					native: {},
				});
				await this.ensureState(
					`${base}.data.lastUpdate`,
					t('Last update', 'Letzte Aktualisierung'),
					'number',
					'value.time',
					undefined,
					true,
				);
				await this.ensureState(
					`${base}.data.previousUpdate`,
					t('Previous update', 'Vorherige Aktualisierung'),
					'number',
					'value.time',
					undefined,
					true,
				);
				await this.ensureState(
					`${base}.data.updateInterval`,
					t('Update interval', 'Aktualisierungsintervall'),
					'number',
					'value.interval',
					'ms',
					true,
				);
				await this.ensureState(
					`${base}.data.averageUpdateInterval`,
					t('Average update interval', 'Durchschnittliches Aktualisierungsintervall'),
					'number',
					'value.interval',
					'ms',
					true,
				);
				await this.ensureState(
					`${base}.data.updateHistory`,
					t('Last update timestamps', 'Letzte Aktualisierungszeitstempel'),
					'string',
					'json',
					undefined,
					true,
				);
				await this.ensureState(
					`${base}.data.details`,
					t('Monitoring details', 'Überwachungsdetails'),
					'string',
					'html',
					undefined,
					true,
				);
			}
		}
		const objects = await this.getAdapterObjectsAsync();
		for (const id of Object.keys(objects)) {
			const fullId = id.startsWith(`${this.namespace}.`) ? id : `${this.namespace}.${id}`;
			if (!fullId.startsWith(`${this.namespace}.devices.`)) {
				continue;
			}
			const relative = fullId.slice(`${this.namespace}.devices.`.length);
			if (!relative) {
				continue;
			}
			const parts = relative.split('.');
			const key = parts.length === 1 ? parts[0] : `${parts[0]}.${parts[1]}`;
			if (!expected.has(key)) {
				await this.delObjectAsync(`devices.${key}`, { recursive: true });
			}
		}
	}
	private async loadDevicesFromObjects(): Promise<DeviceConfiguration[]> {
		const folder = await this.getObjectAsync('devices');
		if (typeof folder?.native?.nextDeviceNumber === 'number' && folder.native.nextDeviceNumber > 0) {
			this.nextDeviceNumber = Math.floor(folder.native.nextDeviceNumber);
		}
		this.functionTemplates = this.normalizeFunctionTemplates(folder?.native?.functionTemplates);
		return this.normalizeDevices(folder?.native?.devices);
	}
	private normalizeFunctionTemplates(value: unknown): Record<string, FunctionTemplate> {
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			return {};
		}
		const templates: Record<string, FunctionTemplate> = {};
		for (const [name, template] of Object.entries(value as Record<string, any>)) {
			const functionName = name.trim();
			if (!functionName || !template || typeof template !== 'object') {
				continue;
			}
			const mode = (input: unknown): LimitMode =>
				['below', 'above', 'outside', 'inside'].includes(String(input)) ? (input as LimitMode) : 'outside';
			const number = (input: unknown): number | undefined =>
				typeof input === 'number' && Number.isFinite(input) ? input : undefined;
			templates[functionName] = {
				warning: {
					enabled: template.warning?.enabled === true,
					mode: mode(template.warning?.mode),
					min: number(template.warning?.min),
					max: number(template.warning?.max),
				},
				alarm: {
					enabled: template.alarm?.enabled === true,
					mode: mode(template.alarm?.mode),
					min: number(template.alarm?.min),
					max: number(template.alarm?.max),
				},
				staleWarning: {
					enabled: template.staleWarning?.enabled === true,
					minutes: number(template.staleWarning?.minutes) || 60,
				},
			};
		}
		return templates;
	}
	private async removeLegacyDeviceConfig(): Promise<void> {
		const instanceId = `system.adapter.${this.namespace}`;
		const object = await this.getForeignObjectAsync(instanceId);
		if (!object || !Object.prototype.hasOwnProperty.call(object.native, 'devices')) {
			return;
		}
		const { devices: _devices, ...native } = object.native as ioBroker.AdapterConfig;
		await this.setForeignObjectAsync(instanceId, { ...(object as ioBroker.InstanceObject), native });
	}
	private async ensureState(
		id: string,
		name: ioBroker.Translated,
		type: ioBroker.CommonType,
		role: string,
		unit?: string,
		expert = false,
	): Promise<void> {
		await this.setObjectAsync(id, {
			type: 'state',
			common: {
				name,
				type,
				role,
				read: true,
				write: false,
				...(unit ? { unit } : {}),
				...(expert ? { expert: true } : {}),
			},
			native: {},
		});
	}
	private async refreshSubscriptions(): Promise<void> {
		for (const id of this.subscribed) {
			this.unsubscribeForeignStates(id);
			this.unsubscribeForeignObjects(id);
		}
		this.subscribed = new Set(this.devices.flatMap(d => d.states.map(s => s.sourceId)).filter(Boolean));
		for (const id of this.subscribed) {
			this.subscribeForeignStates(id);
			this.subscribeForeignObjects(id);
		}
		await this.refreshSourceValidity();
	}
	private isValidSourceObject(object: ioBroker.Object | null | undefined): object is ioBroker.StateObject {
		return object?.type === 'state';
	}
	public async getValidSourceIds(): Promise<string[]> {
		const objects = await this.getForeignObjectsAsync('*', 'state');
		return Object.keys(objects);
	}
	private async refreshSourceValidity(): Promise<void> {
		this.invalidSources.clear();
		this.sourceUnits.clear();
		await Promise.all(
			[...this.subscribed].map(async id => {
				const object = await this.getForeignObjectAsync(id);
				if (this.isValidSourceObject(object)) {
					this.sourceUnits.set(id, typeof object.common.unit === 'string' ? object.common.unit : '');
				} else {
					this.invalidSources.add(id);
				}
			}),
		);
	}
	public async getSourceUnit(sourceId: string): Promise<string> {
		if (this.sourceUnits.has(sourceId)) {
			return this.sourceUnits.get(sourceId) || '';
		}
		const object = await this.getForeignObjectAsync(sourceId);
		const unit = object?.type === 'state' && typeof object.common.unit === 'string' ? object.common.unit : '';
		this.sourceUnits.set(sourceId, unit);
		return unit;
	}
	private async readMonitoringData(base: string, sourceId: string): Promise<Partial<MonitoringData>> {
		const [
			currentValue,
			bundledValue,
			status,
			bundledStatus,
			warning,
			bundledWarning,
			alarm,
			bundledAlarm,
			updateTimeout,
			bundledUpdateTimeout,
			source,
			lastUpdate,
			previousUpdate,
			updateInterval,
			average,
			history,
		] = await Promise.all([
			this.getStateAsync(`${base}.value`),
			this.getStateAsync(`${base}.data.value`),
			this.getStateAsync(`${base}.status`),
			this.getStateAsync(`${base}.data.status`),
			this.getStateAsync(`${base}.warning`),
			this.getStateAsync(`${base}.data.warning`),
			this.getStateAsync(`${base}.alarm`),
			this.getStateAsync(`${base}.data.alarm`),
			this.getStateAsync(`${base}.updateTimeout`),
			this.getStateAsync(`${base}.data.updateTimeout`),
			this.getStateAsync(`${base}.sourceId`),
			this.getStateAsync(`${base}.data.lastUpdate`),
			this.getStateAsync(`${base}.data.previousUpdate`),
			this.getStateAsync(`${base}.data.updateInterval`),
			this.getStateAsync(`${base}.data.averageUpdateInterval`),
			this.getStateAsync(`${base}.data.updateHistory`),
		]);
		if (status || bundledStatus) {
			return {
				sourceId: typeof source?.val === 'string' ? source.val : sourceId,
				value: currentValue?.val ?? bundledValue?.val,
				status:
					typeof (status ?? bundledStatus)?.val === 'string'
						? ((status ?? bundledStatus)?.val as WatchStatus)
						: undefined,
				warning:
					typeof (warning ?? bundledWarning)?.val === 'boolean'
						? Boolean((warning ?? bundledWarning)?.val)
						: undefined,
				alarm:
					typeof (alarm ?? bundledAlarm)?.val === 'boolean'
						? Boolean((alarm ?? bundledAlarm)?.val)
						: undefined,
				updateTimeout:
					typeof (updateTimeout ?? bundledUpdateTimeout)?.val === 'boolean'
						? Boolean((updateTimeout ?? bundledUpdateTimeout)?.val)
						: undefined,
				lastUpdate: typeof lastUpdate?.val === 'number' ? lastUpdate.val : undefined,
				previousUpdate: typeof previousUpdate?.val === 'number' ? previousUpdate.val : undefined,
				updateInterval: typeof updateInterval?.val === 'number' ? updateInterval.val : undefined,
				averageUpdateInterval: typeof average?.val === 'number' ? average.val : undefined,
				updateHistory: parseUpdateHistory(history?.val),
			};
		}
		const legacy = await Promise.all(LEGACY_RUNTIME_STATE_IDS.map(id => this.getStateAsync(`${base}.${id}`)));
		const value = (id: (typeof LEGACY_RUNTIME_STATE_IDS)[number]): ioBroker.StateValue | undefined =>
			legacy[LEGACY_RUNTIME_STATE_IDS.indexOf(id)]?.val;
		return {
			sourceId:
				typeof value('updateHistorySource') === 'string' ? String(value('updateHistorySource')) : undefined,
			value: value('value'),
			status: typeof value('status') === 'string' ? (value('status') as WatchStatus) : undefined,
			warning: typeof value('warning') === 'boolean' ? Boolean(value('warning')) : undefined,
			alarm: typeof value('alarm') === 'boolean' ? Boolean(value('alarm')) : undefined,
			updateTimeout: typeof value('updateTimeout') === 'boolean' ? Boolean(value('updateTimeout')) : undefined,
			lastUpdate: typeof value('lastUpdate') === 'number' ? Number(value('lastUpdate')) : undefined,
			previousUpdate: typeof value('previousUpdate') === 'number' ? Number(value('previousUpdate')) : undefined,
			updateInterval: typeof value('updateInterval') === 'number' ? Number(value('updateInterval')) : undefined,
			averageUpdateInterval:
				typeof value('averageUpdateInterval') === 'number' ? Number(value('averageUpdateInterval')) : undefined,
			updateHistory: parseUpdateHistory(value('updateHistory')),
		};
	}
	private async removeLegacyRuntimeStates(): Promise<void> {
		if (this.legacyRuntimeStatesRemoved) {
			return;
		}
		const objects = await this.getAdapterObjectsAsync();
		for (const device of this.devices) {
			for (const watched of device.states) {
				const base = `devices.${device.id}.${watched.id}`;
				for (const id of OBSOLETE_DIRECT_STATE_IDS) {
					const relativeId = `${base}.${id}`;
					const fullId = `${this.namespace}.${relativeId}`;
					if (objects[fullId] || objects[relativeId]) {
						await this.delObjectAsync(relativeId);
					}
				}
				for (const id of OBSOLETE_DATA_STATE_IDS) {
					const relativeId = `${base}.data.${id}`;
					const fullId = `${this.namespace}.${relativeId}`;
					if (objects[fullId] || objects[relativeId]) {
						await this.delObjectAsync(relativeId);
					}
				}
			}
		}
		this.legacyRuntimeStatesRemoved = true;
	}
	private async updateAll(): Promise<void> {
		for (const device of this.devices) {
			for (const watched of device.states) {
				const state = await this.getForeignStateAsync(watched.sourceId);
				await this.updateValue(device, watched, state);
			}
			await this.updateDeviceSummary(device);
			await this.updateDeviceCardDetails(device);
		}
		await this.updateDeviceInfo();
		await this.removeLegacyRuntimeStates();
	}
	private async updateDeviceInfo(): Promise<void> {
		const devices = await Promise.all(
			this.devices.map(async device => {
				const states = await Promise.all(
					device.states.map(async watched => {
						const sourceState = await this.getForeignStateAsync(watched.sourceId);
						const updateTimeout = isUpdateTimedOut(sourceState, watched.staleWarning);
						const status = this.getWatchedStatus(watched, sourceState, updateTimeout);
						return {
							id: watched.id,
							name: watched.name,
							sourceId: watched.sourceId,
							function: watched.function,
							sourceValid: status !== 'invalid',
							status,
							warning: status === 'warning',
							alarm: status === 'alarm',
							updateTimeout,
						};
					}),
				);
				return { id: device.id, name: device.name, status: await this.getDeviceStatus(device), states };
			}),
		);
		await this.setStateChangedAsync('info.deviceInfo', {
			val: JSON.stringify({ devices }),
			ack: true,
		});
	}
	private async getDeviceStatus(device: DeviceConfiguration): Promise<WatchStatus> {
		const rank: Record<WatchStatus, number> = { invalid: 0, timeout: 1, alarm: 2, warning: 3, unknown: 4, ok: 5 };
		let status: WatchStatus = 'ok';
		for (const watched of device.states) {
			const state = await this.getForeignStateAsync(watched.sourceId);
			const current = this.getWatchedStatus(watched, state);
			if (rank[current] < rank[status]) {
				status = current;
			}
		}
		return status;
	}
	private getWatchedStatus(
		watched: WatchedStateConfiguration,
		state: ioBroker.State | null | undefined,
		updateTimeout = isUpdateTimedOut(state, watched.staleWarning),
	): WatchStatus {
		return this.invalidSources.has(watched.sourceId)
			? 'invalid'
			: getWatchStatus(state?.val ?? null, watched.warning, watched.alarm, updateTimeout);
	}
	private async updateDeviceSummary(device: DeviceConfiguration): Promise<void> {
		const status = await this.getDeviceStatus(device);
		await Promise.all([
			this.setStateChangedAsync(`devices.${device.id}.color`, { val: COLORS[status], ack: true }),
			this.setStateChangedAsync(`devices.${device.id}.icon`, { val: STATUS_ICONS[status], ack: true }),
		]);
	}
	private async updateDeviceCardDetails(device: DeviceConfiguration): Promise<void> {
		const previous = this.cardDetailsQueues.get(device.id) ?? Promise.resolve();
		const current = previous
			.catch(() => undefined)
			.then(async () => {
				const details = device.states
					.map(watched => this.cardDetails.get(`${device.id}.${watched.id}`) || '')
					.filter(Boolean)
					.join('');
				await this.setStateChangedAsync(`devices.${device.id}.${DEVICE_CARD_DETAILS_ID}.details`, {
					val: details,
					ack: true,
				});
			});
		this.cardDetailsQueues.set(device.id, current);
		try {
			await current;
		} finally {
			if (this.cardDetailsQueues.get(device.id) === current) {
				this.cardDetailsQueues.delete(device.id);
			}
		}
	}
	private async updateDetailsDisplay(
		device: DeviceConfiguration,
		watched: WatchedStateConfiguration,
		status: WatchStatus,
		display: string,
		unit: string,
		data: MonitoringData,
	): Promise<void> {
		const base = `devices.${device.id}.${watched.id}`;
		const tooltip: string[] = [];
		if (watched.warning.enabled) {
			tooltip.push(
				this.localize(
					`Warning limit: ${limitDisplay(watched.warning, unit)}`,
					`Warngrenze: ${limitDisplay(watched.warning, unit)}`,
				),
			);
		}
		if (watched.alarm.enabled) {
			tooltip.push(
				this.localize(
					`Alarm limit: ${limitDisplay(watched.alarm, unit)}`,
					`Alarmgrenze: ${limitDisplay(watched.alarm, unit)}`,
				),
			);
		}
		if (watched.staleWarning.enabled) {
			tooltip.push(`Timeout: ${watched.staleWarning.minutes} min`);
		}
		const lastTimestamp = data.lastUpdate === null ? '-' : timestampDisplay(data.lastUpdate);
		const previousTimestamp = data.previousUpdate === null ? '-' : timestampDisplay(data.previousUpdate);
		const updateInterval = data.updateInterval === null ? '-' : intervalDisplay(data.updateInterval);
		const averageUpdateInterval =
			data.averageUpdateInterval === null ? '-' : intervalDisplay(data.averageUpdateInterval);
		const intervalLabel = this.localize('Interval:', 'Intervall:');
		const averageLabel = this.localize('Average:', 'Durchschnitt:');
		const title = tooltip.length ? ` title="${escapeHtml(tooltip.join('\n'))}"` : '';
		const details =
			`<div${title} style="width:268px;max-width:none;box-sizing:border-box;text-align:center;line-height:1.2;margin:4px 0 10px">` +
			`<img src="${STATUS_ICONS[status]}" style="display:block;width:24px;height:24px;margin:0 auto 3px">` +
			`<div style="color:${COLORS[status]}">${escapeHtml(display)}</div>` +
			`<div>${escapeHtml(this.localize('Previous:', 'Vorletzter:'))} ${escapeHtml(previousTimestamp)}</div>` +
			`<div>${escapeHtml(this.localize('Last:', 'Letzter:'))} ${escapeHtml(lastTimestamp)}</div>` +
			`<div>${escapeHtml(intervalLabel)} ${escapeHtml(updateInterval)}</div>` +
			`<div>${escapeHtml(averageLabel)} ${escapeHtml(averageUpdateInterval)}</div>` +
			`</div>`;
		await this.setStateChangedAsync(`${base}.data.details`, { val: details, ack: true });
		this.cardDetails.set(`${device.id}.${watched.id}`, details);
		await this.updateDeviceCardDetails(device);
	}
	private async updateValue(
		device: DeviceConfiguration,
		watched: WatchedStateConfiguration,
		sourceState: ioBroker.State | null | undefined,
	): Promise<void> {
		const key = `${device.id}.${watched.id}`;
		const previous = this.updateHistoryQueues.get(key) ?? Promise.resolve();
		const current = previous.catch(() => undefined).then(() => this.updateValueNow(device, watched, sourceState));
		this.updateHistoryQueues.set(key, current);
		try {
			await current;
		} finally {
			if (this.updateHistoryQueues.get(key) === current) {
				this.updateHistoryQueues.delete(key);
			}
		}
	}
	private async updateValueNow(
		device: DeviceConfiguration,
		watched: WatchedStateConfiguration,
		sourceState: ioBroker.State | null | undefined,
	): Promise<void> {
		const base = `devices.${device.id}.${watched.id}`;
		const previousData = await this.readMonitoringData(base, watched.sourceId);
		const sameSource = !this.resetUpdateHistories.has(base) && previousData.sourceId === watched.sourceId;
		let updateHistory = sameSource ? parseUpdateHistory(previousData.updateHistory) : [];
		if (sameSource && !updateHistory.length) {
			updateHistory = [previousData.previousUpdate, previousData.lastUpdate]
				.filter((entry): entry is number => typeof entry === 'number' && Number.isFinite(entry) && entry > 0)
				.sort((a, b) => a - b);
		}
		const timestamp = sourceState?.ts;
		const lastTimestamp = updateHistory.at(-1);
		if (
			typeof timestamp === 'number' &&
			Number.isFinite(timestamp) &&
			timestamp > 0 &&
			(lastTimestamp === undefined || timestamp > lastTimestamp)
		) {
			updateHistory = [...updateHistory, timestamp].slice(-UPDATE_HISTORY_SIZE);
		}
		const lastUpdate = updateHistory.at(-1) ?? null;
		const previousUpdate = updateHistory.at(-2) ?? null;
		const updateInterval = lastUpdate === null || previousUpdate === null ? null : lastUpdate - previousUpdate;
		const averageUpdateInterval = averageInterval(updateHistory);
		const value = sourceState?.val ?? null;
		const updateTimedOut = isUpdateTimedOut(sourceState, watched.staleWarning);
		const status = this.getWatchedStatus(watched, sourceState, updateTimedOut);
		const unit = await this.getSourceUnit(watched.sourceId);
		const display =
			status === 'invalid'
				? `${watched.name}: ⚠ ${watched.sourceId}`
				: `${watched.name}: ${value === null ? '—' : `${String(value)}${unit ? ` ${unit}` : ''}`}`;
		const data: MonitoringData = {
			sourceId: watched.sourceId,
			value,
			unit,
			status,
			warning: status === 'warning',
			alarm: status === 'alarm',
			updateTimeout: updateTimedOut,
			lastUpdate,
			previousUpdate,
			updateInterval,
			averageUpdateInterval,
			updateHistory,
		};
		await Promise.all([
			this.setStateChangedAsync(`${base}.value`, { val: data.value, ack: true }),
			this.setStateChangedAsync(`${base}.status`, { val: data.status, ack: true }),
			this.setStateChangedAsync(`${base}.warning`, { val: data.warning, ack: true }),
			this.setStateChangedAsync(`${base}.alarm`, { val: data.alarm, ack: true }),
			this.setStateChangedAsync(`${base}.updateTimeout`, { val: data.updateTimeout, ack: true }),
			this.setStateChangedAsync(`${base}.sourceId`, { val: data.sourceId, ack: true }),
			this.setStateChangedAsync(`${base}.data.lastUpdate`, { val: data.lastUpdate, ack: true }),
			this.setStateChangedAsync(`${base}.data.previousUpdate`, { val: data.previousUpdate, ack: true }),
			this.setStateChangedAsync(`${base}.data.updateInterval`, { val: data.updateInterval, ack: true }),
			this.setStateChangedAsync(`${base}.data.averageUpdateInterval`, {
				val: data.averageUpdateInterval,
				ack: true,
			}),
			this.setStateChangedAsync(`${base}.data.updateHistory`, {
				val: JSON.stringify(data.updateHistory),
				ack: true,
			}),
		]);
		this.resetUpdateHistories.delete(base);
		await this.notifyStatusTransition(device, watched, status, display);
		await this.updateDetailsDisplay(device, watched, status, display, unit, data);
	}
	private async notifyStatusTransition(
		device: DeviceConfiguration,
		watched: WatchedStateConfiguration,
		status: WatchStatus,
		display: string,
	): Promise<void> {
		const key = `${device.id}.${watched.id}`;
		const previous = this.notificationStatuses.get(key);
		this.notificationStatuses.set(key, status);
		if (!previous) {
			return;
		}
		const category = notificationCategoryForTransition(previous, status);
		if (!category || !this.isNotificationEnabled(category)) {
			return;
		}
		if (category === 'deviceTimeout' && !watched.staleWarning.enabled) {
			return;
		}
		const location = `${device.name} / ${watched.name}`;
		const message: Record<NotificationCategory, string> = {
			deviceWarning: this.localize(`Warning for ${location}: ${display}`, `Warnung bei ${location}: ${display}`),
			deviceAlarm: this.localize(`Alarm for ${location}: ${display}`, `Alarm bei ${location}: ${display}`),
			deviceTimeout: this.localize(
				`Update timeout for ${location} (${watched.sourceId})`,
				`Aktualisierungs-Timeout bei ${location} (${watched.sourceId})`,
			),
			invalidSource: this.localize(
				`Invalid or deleted source for ${location}: ${watched.sourceId}`,
				`Ungültige oder gelöschte Quelle bei ${location}: ${watched.sourceId}`,
			),
			deviceRecovered: this.localize(
				`${location} is OK again: ${display}`,
				`${location} ist wieder in Ordnung: ${display}`,
			),
		};
		const notificationKey = `${key}|${category}|${message[category]}`;
		const now = Date.now();
		const lastSent = this.notificationLastSent.get(notificationKey);
		if (lastSent !== undefined && now - lastSent < 10_000) {
			return;
		}
		this.notificationLastSent.set(notificationKey, now);
		try {
			await this.registerNotification('device-monitoring', category, message[category]);
		} catch (error) {
			this.log.warn(`Could not register notification ${category}: ${String(error)}`);
		}
	}
	private isNotificationEnabled(category: NotificationCategory): boolean {
		const configured = this.config.enabledNotifications as readonly string[] | undefined;
		return !Array.isArray(configured) || configured.includes(category);
	}
}

if (require.main !== module) {
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new DeviceMonitoring(options);
} else {
	new DeviceMonitoring();
}
