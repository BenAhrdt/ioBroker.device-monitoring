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
					const data = await context.showForm(
						stateForm(this.adapter.getFunctionTemplates(), this.adapter.getFunctionNames()),
						{
							title: t('Add monitored state', 'Überwachungs-State hinzufügen'),
							data: defaultStateForm(),
							buttons: ['apply', 'cancel'],
						},
					);
					if (!data?.sourceId || !data?.name) {
						return { refresh: 'none' };
					}
					await this.adapter.addWatchedState(device.id, data);
					return { refresh: 'devices' };
				},
			},
		];
		if (device.states.length) {
			actions.push({
				id: 'editStates',
				icon: 'settings',
				description: t('Edit monitored states', 'Überwachungs-States bearbeiten'),
				handler: async (_deviceId: string, context: any) => {
					const data = await context.showForm(
						statesForm(device.states, this.adapter.getFunctionTemplates(), this.adapter.getFunctionNames()),
						{
							title: t('Edit monitored states', 'Überwachungs-States bearbeiten'),
							data: Object.fromEntries(device.states.map(watched => [watched.id, watched])),
							buttons: ['apply', 'cancel'],
						},
					);
					if (!data) {
						return { refresh: 'none' };
					}
					await this.adapter.replaceWatchedStates(device.id, data);
					return { refresh: 'devices' };
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
			indicators: device.states.map((watched, order) => ({
				id: `state_${watched.id}`,
				value: { stateId: `${this.adapter.namespace}.devices.${device.id}.${watched.id}.status` },
				icon: STATUS_ICONS.unknown,
				text: { stateId: `${this.adapter.namespace}.devices.${device.id}.${watched.id}.display` },
				levels: [
					{ value: 'invalid', color: 'error', icon: STATUS_ICONS.invalid },
					{ value: 'timeout', color: 'info', icon: STATUS_ICONS.timeout },
					{ value: 'alarm', color: 'error', icon: STATUS_ICONS.alarm },
					{ value: 'warning', color: 'warning', icon: STATUS_ICONS.warning },
					{ value: 'ok', color: 'ok', icon: STATUS_ICONS.ok },
					{ color: 'inactive', icon: STATUS_ICONS.unknown },
				],
				tooltip: watched.function || watched.name,
				hideIfEmpty: false,
				order,
			})),
			actions,
		};
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
function defaultStateForm(): Partial<WatchedStateConfiguration> {
	return {
		name: '',
		sourceId: '',
		function: '',
		warning: defaultLimit('outside'),
		alarm: defaultLimit('outside'),
		staleWarning: { enabled: false, minutes: 60 },
	};
}
function stateForm(
	functionTemplates: Record<string, FunctionTemplate>,
	functionNames: string[],
	stateId?: string,
): any {
	const functions = [...new Set([...functionNames, ...Object.keys(functionTemplates)])].sort();
	const key = (path: string): string => (stateId ? `${stateId}.${path}` : path);
	const data = (path: string): string => (stateId ? `data[${JSON.stringify(stateId)}].${path}` : `data.${path}`);
	const sourceValidator = `(${stateId ? `${data('_delete')} || ` : ''}(async () => { const object = await getObject(${data('sourceId')}); return !!${data('sourceId')} && object?.type === 'state' && object?.common?.type === 'number'; })())`;
	const target = stateId ? `data[${JSON.stringify(stateId)}]` : 'data';
	const templates = JSON.stringify(functionTemplates);
	const applyFunctionTemplate = `(() => { const template = ${templates}[${data('function')}]; if (template) { ${target}.warning = { ...${target}.warning, ...template.warning }; ${target}.alarm = { ...${target}.alarm, ...template.alarm }; ${target}.staleWarning = { ...${target}.staleWarning, ...template.staleWarning }; } return ${data('function')}; })()`;
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
			[key('name')]: { type: 'text', label: t('Name', 'Name'), newLine: true, xs: 12 },
			[key('sourceId')]: {
				type: 'objectId',
				label: t('ioBroker state', 'ioBroker-State'),
				newLine: true,
				xs: 12,
				customFilter: { type: 'state', common: { type: 'number' } },
				validator: sourceValidator,
				validatorErrorText: t(
					'Please select an existing numeric ioBroker state',
					'Bitte einen vorhandenen numerischen ioBroker-State auswählen',
				),
				validatorNoSaveOnError: true,
			},
			[key('function')]: {
				type: 'autocomplete',
				label: t('Function', 'Funktion'),
				options: functions,
				freeSolo: true,
				onChange: { alsoDependsOn: [], calculateFunc: applyFunctionTemplate },
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
			[key('_saveAsTemplate')]: {
				type: 'checkbox',
				label: t(
					'Save or update this selection as function template',
					'Diese Auswahl als Funktionsvorlage speichern oder aktualisieren',
				),
				newLine: true,
				xs: 12,
				hidden: `!${data('function')}`,
			},
		},
	};
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
				const form = stateForm(functionTemplates, functionNames, watched.id);
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
	private deviceManagement?: DeviceMonitoringManagement;
	private sortRefreshTimer?: NodeJS.Timeout;
	private staleCheckTimer?: NodeJS.Timeout;
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
			callback();
		});
	}
	private async onReady(): Promise<void> {
		this.deviceManagement = new DeviceMonitoringManagement(this);
		const legacyDevices = this.normalizeDevices(this.config.devices);
		this.devices = legacyDevices.length ? legacyDevices : await this.loadDevicesFromObjects();
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
	}
	private onMessage(message: ioBroker.Message): void {
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
					await this.updateValue(device, watched, await this.getForeignStateAsync(id));
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
	public getFunctionNames(): string[] {
		return [...new Set(this.devices.flatMap(device => device.states.map(state => state.function)).filter(Boolean))];
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
		const id = uniqueId(safeId(String(data.name), 'state'), new Set(device.states.map(s => s.id)));
		this.saveFunctionTemplate(data);
		await this.saveDevices(
			this.devices.map(d =>
				d.id === deviceId ? { ...d, states: [...d.states, this.normalizeState(data, id)] } : d,
			),
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
		await this.saveDevices(this.devices.map(entry => (entry.id === deviceId ? { ...entry, states } : entry)));
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
	private async saveDevices(devices: DeviceConfiguration[]): Promise<void> {
		this.devices = devices;
		await this.rebuildObjects();
		await this.removeLegacyDeviceConfig();
		await this.refreshSubscriptions();
		await this.updateAll();
		await this.deviceManagement?.refreshCards();
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
			await this.setObjectAsync(`devices.${device.id}`, {
				type: 'device',
				common: { name: device.name },
				native: {},
			});
			await this.ensureState(`devices.${device.id}.color`, t('Card color', 'Kachelfarbe'), 'string', 'text');
			await this.ensureState(`devices.${device.id}.icon`, t('Card icon', 'Kachelsymbol'), 'string', 'text');
			for (const watched of device.states) {
				expected.add(`${device.id}.${watched.id}`);
				const base = `devices.${device.id}.${watched.id}`;
				const unit = await this.getSourceUnit(watched.sourceId);
				await this.setObjectAsync(base, {
					type: 'channel',
					common: { name: watched.name },
					native: { sourceId: watched.sourceId, function: watched.function },
				});
				await this.ensureState(`${base}.value`, t('Current value', 'Aktueller Wert'), 'mixed', 'value', unit);
				await this.ensureState(`${base}.status`, t('Status', 'Status'), 'string', 'text');
				await this.ensureState(`${base}.display`, t('Display value', 'Anzeigewert'), 'string', 'text');
				await this.ensureState(`${base}.warning`, t('Warning', 'Warnung'), 'boolean', 'indicator');
				await this.ensureState(`${base}.alarm`, t('Alarm', 'Alarm'), 'boolean', 'indicator.alarm');
				await this.ensureState(
					`${base}.updateTimeout`,
					t('Update timeout', 'Aktualisierungs-Timeout'),
					'boolean',
					'indicator.maintenance',
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
	): Promise<void> {
		await this.setObjectAsync(id, {
			type: 'state',
			common: { name, type, role, read: true, write: false, ...(unit ? { unit } : {}) },
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
		return object?.type === 'state' && object.common.type === 'number';
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
	private async getSourceUnit(sourceId: string): Promise<string> {
		if (this.sourceUnits.has(sourceId)) {
			return this.sourceUnits.get(sourceId) || '';
		}
		const object = await this.getForeignObjectAsync(sourceId);
		const unit = object?.type === 'state' && typeof object.common.unit === 'string' ? object.common.unit : '';
		this.sourceUnits.set(sourceId, unit);
		return unit;
	}
	private async updateAll(): Promise<void> {
		for (const device of this.devices) {
			for (const watched of device.states) {
				await this.updateValue(device, watched, await this.getForeignStateAsync(watched.sourceId));
			}
			await this.updateDeviceSummary(device);
		}
		await this.updateDeviceInfo();
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
	private async updateValue(
		device: DeviceConfiguration,
		watched: WatchedStateConfiguration,
		sourceState: ioBroker.State | null | undefined,
	): Promise<void> {
		const base = `devices.${device.id}.${watched.id}`;
		const value = sourceState?.val ?? null;
		const updateTimedOut = isUpdateTimedOut(sourceState, watched.staleWarning);
		const status = this.getWatchedStatus(watched, sourceState, updateTimedOut);
		const unit = await this.getSourceUnit(watched.sourceId);
		await Promise.all([
			this.setStateChangedAsync(`${base}.value`, { val: value, ack: true }),
			this.setStateChangedAsync(`${base}.status`, { val: status, ack: true }),
			this.setStateChangedAsync(`${base}.display`, {
				val:
					status === 'invalid'
						? `${watched.name}: ⚠ ${watched.sourceId}`
						: `${watched.name}: ${value === null ? '—' : `${String(value)}${unit ? ` ${unit}` : ''}`}`,
				ack: true,
			}),
			this.setStateChangedAsync(`${base}.warning`, { val: status === 'warning', ack: true }),
			this.setStateChangedAsync(`${base}.alarm`, { val: status === 'alarm', ack: true }),
			this.setStateChangedAsync(`${base}.updateTimeout`, { val: updateTimedOut, ack: true }),
		]);
	}
}

if (require.main !== module) {
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new DeviceMonitoring(options);
} else {
	new DeviceMonitoring();
}
