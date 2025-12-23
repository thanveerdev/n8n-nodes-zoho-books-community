import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IRequestOptions,
	JsonObject
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

type Requester = IExecuteFunctions | ILoadOptionsFunctions;

const SUPPORTED_DATA_CENTERS = [
	'com',
	'eu',
	'in',
	'com.au',
	'jp',
	'ca',
	'com.cn',
	'sa'
];

function ensureEndpoint(endpoint: string): string {
	if (!endpoint.startsWith('/')) {
		return `/${endpoint}`;
	}
	return endpoint;
}

function parseJsonParameter(
	parameter: string,
	name: string,
	context: IExecuteFunctions
): IDataObject {
	if (!parameter) return {};
	try {
		const value = JSON.parse(parameter);
		if (value === null || typeof value !== 'object' || Array.isArray(value)) {
			throw new Error(`${name} must be a JSON object`);
		}
		return value as IDataObject;
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Invalid JSON in ${name}: ${(error as Error).message}`
		);
	}
}

function applyExtraFields(
	body: IDataObject,
	extra: IDataObject[] = []
): IDataObject {
	for (const field of extra) {
		if (!field.name) continue;
		body[field.name as string] = field.value;
	}
	return body;
}

function applyContactPersonFromExtra(
	body: IDataObject,
	extra: IDataObject[] = []
): IDataObject[] {
	const contactPersonKeys = new Set([
		'email',
		'phone',
		'mobile',
		'first_name',
		'last_name',
		'is_primary_contact'
	]);

	const contactPersons = (body.contact_persons as IDataObject[]) || [];
	const contactPerson: IDataObject = {};
	let hasContactPersonData = false;

	for (const field of extra) {
		if (!field.name) continue;
		if (contactPersonKeys.has(field.name as string)) {
			hasContactPersonData = true;
			if (field.name === 'is_primary_contact') {
				const val = field.value;
				contactPerson.is_primary_contact =
					val === true || val === 'true' || val === '1';
			} else {
				contactPerson[field.name as string] = field.value;
			}
		}
	}

	if (hasContactPersonData) {
		if (!contactPerson.first_name && typeof body.contact_name === 'string') {
			contactPerson.first_name = body.contact_name;
		}
		if (contactPerson.is_primary_contact === undefined) {
			contactPerson.is_primary_contact = true;
		}
		contactPersons.push(contactPerson);
		body.contact_persons = contactPersons;
	}

	return extra.filter((field) => !contactPersonKeys.has(field.name as string));
}

async function zohoBooksApiRequest(
	this: Requester,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {}
): Promise<any> {
	const credentials = (await this.getCredentials('zohoBooksOAuth2Api')) as {
		dataCenter?: string;
		environment?: string;
		baseUrl?: string;
		sandboxBaseUrl?: string;
	};

	const dataCenter = credentials.dataCenter || 'com';
	if (!SUPPORTED_DATA_CENTERS.includes(dataCenter)) {
		throw new NodeOperationError(
			this.getNode(),
			`Unsupported Zoho data center "${dataCenter}". Update credentials.`
		);
	}

	const baseUrl =
		credentials.environment === 'sandbox'
			? credentials.sandboxBaseUrl
			: credentials.baseUrl;

	const options: IRequestOptions = {
		method,
		body: Object.keys(body).length ? body : undefined,
		qs: Object.keys(qs).length ? qs : undefined,
		uri: `${baseUrl}${ensureEndpoint(endpoint)}`,
		json: true
	};

	try {
		return await this.helpers.requestOAuth2.call(
			this,
			'zohoBooksOAuth2Api',
			options
		);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export class ZohoBooks implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zoho Books',
		name: 'zohoBooks',
		icon: 'file:zohoBooks.svg',
		group: ['transform'],
		version: 1,
		description: 'Interact with Zoho Books API',
		defaults: {
			name: 'Zoho Books'
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'zohoBooksOAuth2Api',
				required: true
			}
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Organization', value: 'organization' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'Invoice', value: 'invoice' },
					{ name: 'Payment', value: 'payment' },
					{ name: 'API Request (Generic)', value: 'apiRequest' }
				],
				default: 'organization'
			},

			// Organization operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['organization']
					}
				},
				options: [
					{
						name: 'List Organizations',
						value: 'list',
						description: 'List all organizations available to the token'
					},
					{
						name: 'Get Organization',
						value: 'get',
						description: 'Get a single organization by ID'
					}
				],
				default: 'list'
			},
			{
				displayName: 'Organization',
				name: 'organizationId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getOrganizations'
				},
				displayOptions: {
					show: {
						resource: ['organization'],
						operation: ['get']
					}
				},
				default: '',
				description: 'Choose an organization from your Zoho Books account'
			},

			// Contact operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['contact']
					}
				},
				options: [
					{ name: 'List', value: 'list', description: 'List contacts' },
					{ name: 'Get', value: 'get', description: 'Get a contact' },
					{ name: 'Create', value: 'create', description: 'Create a contact' },
					{ name: 'Update', value: 'update', description: 'Update a contact' },
					{ name: 'Delete', value: 'delete', description: 'Delete a contact' }
				],
				default: 'list'
			},
			{
				displayName: 'Organization ID',
				name: 'organizationIdContact',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['contact']
					}
				},
				default: '',
				description: 'Zoho Books organization_id'
			},
			{
				displayName: 'Contact ID',
				name: 'contactId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['get', 'update', 'delete']
					}
				},
				default: '',
				description: 'ID of the contact'
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['list']
					}
				},
				default: {},
				options: [
					{
						displayName: 'Page',
						name: 'page',
						type: 'number',
						default: 1
					},
					{
						displayName: 'Per Page',
						name: 'perPage',
						type: 'number',
						default: 200
					},
					{
						displayName: 'Search Text',
						name: 'searchText',
						type: 'string',
						default: ''
					}
				]
			},
			{
				displayName: 'Body (JSON)',
				name: 'bodyContact',
				type: 'string',
				typeOptions: { rows: 5 },
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['create', 'update']
					}
				},
				default: '',
				description: 'Raw contact payload as JSON'
			},
			{
				displayName: 'Extra Body Fields',
				name: 'extraFieldsContact',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['create', 'update']
					}
				},
				default: {},
				placeholder: 'Add Field',
				options: [
					{
						name: 'field',
						displayName: 'Field',
						values: [
							{
								displayName: 'Name (API key)',
								name: 'name',
								type: 'string',
								default: ''
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: ''
							}
						]
					}
				]
			},
			{
				displayName: 'Mapped Fields (Dropdown)',
				name: 'mappedFieldsContact',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['create', 'update']
					}
				},
				default: {},
				placeholder: 'Add Field',
				options: [
					{
						name: 'field',
						displayName: 'Field',
						values: [
							{
								displayName: 'Field Key',
								name: 'fieldKey',
								type: 'options',
								options: [
									{ name: 'Contact Name', value: 'contact_name' },
									{ name: 'Company Name', value: 'company_name' },
									{ name: 'Contact Type', value: 'contact_type' },
									{ name: 'Display Name', value: 'display_name' },
									{ name: 'Email (contact person)', value: 'email' },
									{ name: 'Phone (contact person)', value: 'phone' },
									{ name: 'Mobile (contact person)', value: 'mobile' },
									{ name: 'Website', value: 'website' },
									{ name: 'Currency Code', value: 'currency_code' },
									{ name: 'Payment Terms', value: 'payment_terms' },
									{ name: 'Payment Terms Label', value: 'payment_terms_label' },
									{ name: 'Notes', value: 'notes' },
									{ name: 'Billing Address', value: 'billing_address' },
									{ name: 'Shipping Address', value: 'shipping_address' },
									{ name: 'Contact Person First Name', value: 'first_name' },
									{ name: 'Contact Person Last Name', value: 'last_name' },
									{ name: 'Is Primary Contact (true/false)', value: 'is_primary_contact' }
								],
								default: 'contact_name'
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: ''
							}
						]
					}
				]
			},
			{
				displayName: 'Custom Fields',
				name: 'customFieldsContact',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['create', 'update']
					}
				},
				default: {},
				placeholder: 'Add Field',
				options: [
					{
						name: 'customField',
						displayName: 'Field',
						values: [
							{
								displayName: 'Label or API Name',
								name: 'name',
								type: 'string',
								default: ''
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: ''
							}
						]
					}
				]
			},

			// Invoice operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['invoice']
					}
				},
				options: [
					{ name: 'List', value: 'list', description: 'List invoices' },
					{ name: 'Get', value: 'get', description: 'Get an invoice' },
					{ name: 'Create', value: 'create', description: 'Create an invoice' },
					{ name: 'Update', value: 'update', description: 'Update an invoice' },
					{ name: 'Delete', value: 'delete', description: 'Delete an invoice' }
				],
				default: 'list'
			},
			{
				displayName: 'Organization ID',
				name: 'organizationIdInvoice',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['invoice']
					}
				},
				default: '',
				description: 'Zoho Books organization_id'
			},
			{
				displayName: 'Invoice ID',
				name: 'invoiceId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['get', 'update', 'delete']
					}
				},
				default: '',
				description: 'ID of the invoice'
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFieldsInvoice',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['list']
					}
				},
				default: {},
				options: [
					{
						displayName: 'Page',
						name: 'page',
						type: 'number',
						default: 1
					},
					{
						displayName: 'Per Page',
						name: 'perPage',
						type: 'number',
						default: 200
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						default: '',
						options: [
							{ name: 'Any', value: '' },
							{ name: 'Draft', value: 'draft' },
							{ name: 'Unpaid', value: 'unpaid' },
							{ name: 'Partially Paid', value: 'partially_paid' },
							{ name: 'Paid', value: 'paid' },
							{ name: 'Void', value: 'void' }
						]
					}
				]
			},
			{
				displayName: 'Body (JSON)',
				name: 'bodyInvoice',
				type: 'string',
				typeOptions: { rows: 5 },
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['create', 'update']
					}
				},
				default: '',
				description: 'Raw invoice payload as JSON'
			},
			{
				displayName: 'Extra Body Fields',
				name: 'extraFieldsInvoice',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['create', 'update']
					}
				},
				default: {},
				placeholder: 'Add Field',
				options: [
					{
						name: 'field',
						displayName: 'Field',
						values: [
							{
								displayName: 'Name (API key)',
								name: 'name',
								type: 'string',
								default: ''
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: ''
							}
						]
					}
				]
			},
			{
				displayName: 'Mapped Fields (Dropdown)',
				name: 'mappedFieldsInvoice',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['create', 'update']
					}
				},
				default: {},
				placeholder: 'Add Field',
				options: [
					{
						name: 'field',
						displayName: 'Field',
						values: [
							{
								displayName: 'Field Key',
								name: 'fieldKey',
								type: 'options',
								options: [
									{ name: 'Customer ID', value: 'customer_id' },
									{ name: 'Invoice Number', value: 'invoice_number' },
									{ name: 'Invoice Date', value: 'date' },
									{ name: 'Due Date', value: 'due_date' },
									{ name: 'Status', value: 'status' },
									{ name: 'Reference Number', value: 'reference_number' },
									{ name: 'Currency Code', value: 'currency_code' },
									{ name: 'Exchange Rate', value: 'exchange_rate' },
									{ name: 'Discount', value: 'discount' },
									{ name: 'Discount Type', value: 'discount_type' },
									{ name: 'Pricebook ID', value: 'pricebook_id' },
									{ name: 'Notes', value: 'notes' },
									{ name: 'Terms', value: 'terms' },
									{ name: 'Allow Partial Payments', value: 'allow_partial_payments' },
									{ name: 'Billing Address', value: 'billing_address' },
									{ name: 'Shipping Address', value: 'shipping_address' }
								],
								default: 'customer_id'
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: ''
							}
						]
					}
				]
			},
			{
				displayName: 'Custom Fields',
				name: 'customFieldsInvoice',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['create', 'update']
					}
				},
				default: {},
				placeholder: 'Add Field',
				options: [
					{
						name: 'customField',
						displayName: 'Field',
						values: [
							{
								displayName: 'Label or API Name',
								name: 'name',
								type: 'string',
								default: ''
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: ''
							}
						]
					}
				]
			},

			// Payment operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['payment']
					}
				},
				options: [
					{ name: 'List', value: 'list', description: 'List payments' },
					{ name: 'Get', value: 'get', description: 'Get a payment' },
					{ name: 'Create', value: 'create', description: 'Create a payment' },
					{ name: 'Delete', value: 'delete', description: 'Delete a payment' }
				],
				default: 'list'
			},
			{
				displayName: 'Organization ID',
				name: 'organizationIdPayment',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment']
					}
				},
				default: '',
				description: 'Zoho Books organization_id'
			},
			{
				displayName: 'Payment ID',
				name: 'paymentId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['get', 'delete']
					}
				},
				default: '',
				description: 'ID of the payment'
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFieldsPayment',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['list']
					}
				},
				default: {},
				options: [
					{
						displayName: 'Page',
						name: 'page',
						type: 'number',
						default: 1
					},
					{
						displayName: 'Per Page',
						name: 'perPage',
						type: 'number',
						default: 200
					},
					{
						displayName: 'Customer ID',
						name: 'customerId',
						type: 'string',
						default: ''
					}
				]
			},
			{
				displayName: 'Body (JSON)',
				name: 'bodyPayment',
				type: 'string',
				typeOptions: { rows: 5 },
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['create']
					}
				},
				default: '',
				description: 'Raw payment payload as JSON'
			},
			{
				displayName: 'Extra Body Fields',
				name: 'extraFieldsPayment',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['create']
					}
				},
				default: {},
				placeholder: 'Add Field',
				options: [
					{
						name: 'field',
						displayName: 'Field',
						values: [
							{
								displayName: 'Name (API key)',
								name: 'name',
								type: 'string',
								default: ''
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: ''
							}
						]
					}
				]
			},
			{
				displayName: 'Mapped Fields (Dropdown)',
				name: 'mappedFieldsPayment',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['create']
					}
				},
				default: {},
				placeholder: 'Add Field',
				options: [
					{
						name: 'field',
						displayName: 'Field',
						values: [
							{
								displayName: 'Field Key',
								name: 'fieldKey',
								type: 'options',
								options: [
									{ name: 'Customer ID', value: 'customer_id' },
									{ name: 'Payment Mode', value: 'payment_mode' },
									{ name: 'Payment Number', value: 'payment_number' },
									{ name: 'Payment Date', value: 'payment_date' },
									{ name: 'Amount', value: 'amount' },
									{ name: 'Currency Code', value: 'currency_code' },
									{ name: 'Exchange Rate', value: 'exchange_rate' },
									{ name: 'Reference Number', value: 'reference_number' },
									{ name: 'Bank Charges', value: 'bank_charges' },
									{ name: 'Account ID', value: 'account_id' }
								],
								default: 'customer_id'
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: ''
							}
						]
					}
				]
			},
			{
				displayName: 'Custom Fields',
				name: 'customFieldsPayment',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['create']
					}
				},
				default: {},
				placeholder: 'Add Field',
				options: [
					{
						name: 'customField',
						displayName: 'Field',
						values: [
							{
								displayName: 'Label or API Name',
								name: 'name',
								type: 'string',
								default: ''
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: ''
							}
						]
					}
				]
			},

			// Generic API request
			{
				displayName: 'Operation',
				name: 'apiOperation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['apiRequest']
					}
				},
				options: [
					{
						name: 'Raw API Request',
						value: 'request',
						description: 'Send a custom request to any Zoho Books endpoint'
					}
				],
				default: 'request'
			},
			{
				displayName: 'HTTP Method',
				name: 'method',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['apiRequest'],
						apiOperation: ['request']
					}
				},
				options: [
					{ name: 'GET', value: 'GET' },
					{ name: 'POST', value: 'POST' },
					{ name: 'PUT', value: 'PUT' },
					{ name: 'PATCH', value: 'PATCH' },
					{ name: 'DELETE', value: 'DELETE' }
				],
				default: 'GET'
			},
			{
				displayName: 'Endpoint',
				name: 'endpoint',
				type: 'string',
				required: true,
				placeholder: '/invoices',
				displayOptions: {
					show: {
						resource: ['apiRequest'],
						apiOperation: ['request']
					}
				},
				default: '',
				description: 'Path after /books/v3 (e.g. /invoices)'
			},
			{
				displayName: 'Organization ID',
				name: 'organizationIdApi',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['apiRequest'],
						apiOperation: ['request']
					}
				},
				default: '',
				description:
					'Optional organization_id query param; leave blank to supply it in the query JSON'
			},
			{
				displayName: 'Query (JSON)',
				name: 'query',
				type: 'string',
				typeOptions: { rows: 3 },
				displayOptions: {
					show: {
						resource: ['apiRequest'],
						apiOperation: ['request']
					}
				},
				default: '',
				description: 'Key-value pairs as JSON (e.g. {"status":"sent"})'
			},
			{
				displayName: 'Send Body',
				name: 'sendBody',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['apiRequest'],
						apiOperation: ['request']
					}
				},
				default: false
			},
			{
				displayName: 'Body (JSON)',
				name: 'body',
				type: 'string',
				typeOptions: { rows: 5 },
				displayOptions: {
					show: {
						resource: ['apiRequest'],
						apiOperation: ['request'],
						sendBody: [true]
					}
				},
				default: '',
				description: 'JSON payload for POST/PUT/PATCH operations'
			}
		]
	};

	methods = {
		loadOptions: {
			async getOrganizations(this: ILoadOptionsFunctions) {
				const response = await zohoBooksApiRequest.call(
					this,
					'GET',
					'/organizations'
				);
				const organizations = (response.organizations || []) as Array<{
					name: string;
					organization_id: string;
				}>;
				return organizations.map((org) => ({
					name: org.name,
					value: org.organization_id
				}));
			}
		}
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;

				if (resource === 'organization') {
					const operation = this.getNodeParameter('operation', i) as string;

					if (operation === 'list') {
						const response = await zohoBooksApiRequest.call(
							this,
							'GET',
							'/organizations'
						);
						const organizations =
							(response.organizations as IDataObject[]) || [];
						returnData.push(...this.helpers.returnJsonArray(organizations));
					}

					if (operation === 'get') {
						const organizationId = this.getNodeParameter(
							'organizationId',
							i
						) as string;
						const response = await zohoBooksApiRequest.call(
							this,
							'GET',
							`/organizations/${organizationId}`
						);
						const organization =
							(response.organization as IDataObject) || response;
						returnData.push({ json: organization });
					}
				} else if (resource === 'contact') {
					const operation = this.getNodeParameter('operation', i) as string;
					const organizationId = this.getNodeParameter(
						'organizationIdContact',
						i
					) as string;

					if (operation === 'list') {
						const additionalFields = this.getNodeParameter(
							'additionalFields',
							i,
							{}
						) as IDataObject;
						const qs: IDataObject = {
							organization_id: organizationId
						};
						if (additionalFields.page) qs.page = additionalFields.page;
						if (additionalFields.perPage) qs.per_page = additionalFields.perPage;
						if (additionalFields.searchText)
							qs.search_text = additionalFields.searchText;

						const response = await zohoBooksApiRequest.call(
							this,
							'GET',
							'/contacts',
							{},
							qs
						);
						const contacts = (response.contacts as IDataObject[]) || [];
						returnData.push(...this.helpers.returnJsonArray(contacts));
					}

					if (operation === 'get') {
						const contactId = this.getNodeParameter('contactId', i) as string;
						const qs: IDataObject = { organization_id: organizationId };
						const response = await zohoBooksApiRequest.call(
							this,
							'GET',
							`/contacts/${contactId}`,
							{},
							qs
						);
						const contact = (response.contact as IDataObject) || response;
						returnData.push({ json: contact });
					}

					if (operation === 'create') {
						const rawBody = this.getNodeParameter('bodyContact', i) as string;
						const body = parseJsonParameter(rawBody, 'Body', this);
						const extraWrapper = this.getNodeParameter(
							'extraFieldsContact',
							i,
							{}
						) as IDataObject;
						const extra = (extraWrapper.field || []) as IDataObject[];
						const mappedWrapper = this.getNodeParameter(
							'mappedFieldsContact',
							i,
							{}
						) as IDataObject;
						const mappedFields = (mappedWrapper.field || []) as IDataObject[];
						const mappedAsExtra = mappedFields.map((f) => ({
							name: f.fieldKey,
							value: f.value
						}));
						extra.push(...mappedAsExtra);
						const remainingExtra = applyContactPersonFromExtra(body, extra);
						applyExtraFields(body, remainingExtra);
						const customFieldsWrapper = this.getNodeParameter(
							'customFieldsContact',
							i,
							{}
						) as IDataObject;
						const customFields = (customFieldsWrapper.customField ||
							[]) as IDataObject[];
						if (customFields.length) {
							body.custom_fields = customFields.map((f) => ({
								label: f.name,
								value: f.value
							}));
						}
						const qs: IDataObject = { organization_id: organizationId };
						const response = await zohoBooksApiRequest.call(
							this,
							'POST',
							'/contacts',
							body,
							qs
						);
						returnData.push({ json: response });
					}

					if (operation === 'update') {
						const contactId = this.getNodeParameter('contactId', i) as string;
						const rawBody = this.getNodeParameter('bodyContact', i) as string;
						const body = parseJsonParameter(rawBody, 'Body', this);
						const extraWrapper = this.getNodeParameter(
							'extraFieldsContact',
							i,
							{}
						) as IDataObject;
						const extra = (extraWrapper.field || []) as IDataObject[];
						const mappedWrapper = this.getNodeParameter(
							'mappedFieldsContact',
							i,
							{}
						) as IDataObject;
						const mappedFields = (mappedWrapper.field || []) as IDataObject[];
						const mappedAsExtra = mappedFields.map((f) => ({
							name: f.fieldKey,
							value: f.value
						}));
						extra.push(...mappedAsExtra);
						const remainingExtra = applyContactPersonFromExtra(body, extra);
						applyExtraFields(body, remainingExtra);
						const customFieldsWrapper = this.getNodeParameter(
							'customFieldsContact',
							i,
							{}
						) as IDataObject;
						const customFields = (customFieldsWrapper.customField ||
							[]) as IDataObject[];
						if (customFields.length) {
							body.custom_fields = customFields.map((f) => ({
								label: f.name,
								value: f.value
							}));
						}
						const qs: IDataObject = { organization_id: organizationId };
						const response = await zohoBooksApiRequest.call(
							this,
							'PUT',
							`/contacts/${contactId}`,
							body,
							qs
						);
						returnData.push({ json: response });
					}

					if (operation === 'delete') {
						const contactId = this.getNodeParameter('contactId', i) as string;
						const qs: IDataObject = { organization_id: organizationId };
						const response = await zohoBooksApiRequest.call(
							this,
							'DELETE',
							`/contacts/${contactId}`,
							{},
							qs
						);
						returnData.push({ json: response });
					}
				} else if (resource === 'invoice') {
					const operation = this.getNodeParameter('operation', i) as string;
					const organizationId = this.getNodeParameter(
						'organizationIdInvoice',
						i
					) as string;

					if (operation === 'list') {
						const additionalFields = this.getNodeParameter(
							'additionalFieldsInvoice',
							i,
							{}
						) as IDataObject;
						const qs: IDataObject = {
							organization_id: organizationId
						};
						if (additionalFields.page) qs.page = additionalFields.page;
						if (additionalFields.perPage) qs.per_page = additionalFields.perPage;
						if (additionalFields.status) qs.status = additionalFields.status;

						const response = await zohoBooksApiRequest.call(
							this,
							'GET',
							'/invoices',
							{},
							qs
						);
						const invoices = (response.invoices as IDataObject[]) || [];
						returnData.push(...this.helpers.returnJsonArray(invoices));
					}

					if (operation === 'get') {
						const invoiceId = this.getNodeParameter('invoiceId', i) as string;
						const qs: IDataObject = { organization_id: organizationId };
						const response = await zohoBooksApiRequest.call(
							this,
							'GET',
							`/invoices/${invoiceId}`,
							{},
							qs
						);
						const invoice = (response.invoice as IDataObject) || response;
						returnData.push({ json: invoice });
					}

					if (operation === 'create') {
						const rawBody = this.getNodeParameter('bodyInvoice', i) as string;
						const body = parseJsonParameter(rawBody, 'Body', this);
						const extraWrapper = this.getNodeParameter(
							'extraFieldsInvoice',
							i,
							{}
						) as IDataObject;
						const extra = (extraWrapper.field || []) as IDataObject[];
						const mappedWrapper = this.getNodeParameter(
							'mappedFieldsInvoice',
							i,
							{}
						) as IDataObject;
						const mappedFields = (mappedWrapper.field || []) as IDataObject[];
						const mappedAsExtra = mappedFields.map((f) => ({
							name: f.fieldKey,
							value: f.value
						}));
						extra.push(...mappedAsExtra);
						applyExtraFields(body, extra);
						const customFieldsWrapper = this.getNodeParameter(
							'customFieldsInvoice',
							i,
							{}
						) as IDataObject;
						const customFields = (customFieldsWrapper.customField ||
							[]) as IDataObject[];
						if (customFields.length) {
							body.custom_fields = customFields.map((f) => ({
								label: f.name,
								value: f.value
							}));
						}
						const qs: IDataObject = { organization_id: organizationId };
						const response = await zohoBooksApiRequest.call(
							this,
							'POST',
							'/invoices',
							body,
							qs
						);
						returnData.push({ json: response });
					}

					if (operation === 'update') {
						const invoiceId = this.getNodeParameter('invoiceId', i) as string;
						const rawBody = this.getNodeParameter('bodyInvoice', i) as string;
						const body = parseJsonParameter(rawBody, 'Body', this);
						const extraWrapper = this.getNodeParameter(
							'extraFieldsInvoice',
							i,
							{}
						) as IDataObject;
						const extra = (extraWrapper.field || []) as IDataObject[];
						const mappedWrapper = this.getNodeParameter(
							'mappedFieldsInvoice',
							i,
							{}
						) as IDataObject;
						const mappedFields = (mappedWrapper.field || []) as IDataObject[];
						const mappedAsExtra = mappedFields.map((f) => ({
							name: f.fieldKey,
							value: f.value
						}));
						extra.push(...mappedAsExtra);
						applyExtraFields(body, extra);
						const customFieldsWrapper = this.getNodeParameter(
							'customFieldsInvoice',
							i,
							{}
						) as IDataObject;
						const customFields = (customFieldsWrapper.customField ||
							[]) as IDataObject[];
						if (customFields.length) {
							body.custom_fields = customFields.map((f) => ({
								label: f.name,
								value: f.value
							}));
						}
						const qs: IDataObject = { organization_id: organizationId };
						const response = await zohoBooksApiRequest.call(
							this,
							'PUT',
							`/invoices/${invoiceId}`,
							body,
							qs
						);
						returnData.push({ json: response });
					}

					if (operation === 'delete') {
						const invoiceId = this.getNodeParameter('invoiceId', i) as string;
						const qs: IDataObject = { organization_id: organizationId };
						const response = await zohoBooksApiRequest.call(
							this,
							'DELETE',
							`/invoices/${invoiceId}`,
							{},
							qs
						);
						returnData.push({ json: response });
					}
				} else if (resource === 'payment') {
					const operation = this.getNodeParameter('operation', i) as string;
					const organizationId = this.getNodeParameter(
						'organizationIdPayment',
						i
					) as string;

					if (operation === 'list') {
						const additionalFields = this.getNodeParameter(
							'additionalFieldsPayment',
							i,
							{}
						) as IDataObject;
						const qs: IDataObject = {
							organization_id: organizationId
						};
						if (additionalFields.page) qs.page = additionalFields.page;
						if (additionalFields.perPage) qs.per_page = additionalFields.perPage;
						if (additionalFields.customerId)
							qs.customer_id = additionalFields.customerId;

						const response = await zohoBooksApiRequest.call(
							this,
							'GET',
							'/customerpayments',
							{},
							qs
						);
						const payments = (response.customerpayments as IDataObject[]) || [];
						returnData.push(...this.helpers.returnJsonArray(payments));
					}

					if (operation === 'get') {
						const paymentId = this.getNodeParameter('paymentId', i) as string;
						const qs: IDataObject = { organization_id: organizationId };
						const response = await zohoBooksApiRequest.call(
							this,
							'GET',
							`/customerpayments/${paymentId}`,
							{},
							qs
						);
						const payment = (response.payment as IDataObject) || response;
						returnData.push({ json: payment });
					}

					if (operation === 'create') {
						const rawBody = this.getNodeParameter('bodyPayment', i) as string;
						const body = parseJsonParameter(rawBody, 'Body', this);
						const extraWrapper = this.getNodeParameter(
							'extraFieldsPayment',
							i,
							{}
						) as IDataObject;
						const extra = (extraWrapper.field || []) as IDataObject[];
						const mappedWrapper = this.getNodeParameter(
							'mappedFieldsPayment',
							i,
							{}
						) as IDataObject;
						const mappedFields = (mappedWrapper.field || []) as IDataObject[];
						const mappedAsExtra = mappedFields.map((f) => ({
							name: f.fieldKey,
							value: f.value
						}));
						extra.push(...mappedAsExtra);
						applyExtraFields(body, extra);
						const customFieldsWrapper = this.getNodeParameter(
							'customFieldsPayment',
							i,
							{}
						) as IDataObject;
						const customFields = (customFieldsWrapper.customField ||
							[]) as IDataObject[];
						if (customFields.length) {
							body.custom_fields = customFields.map((f) => ({
								label: f.name,
								value: f.value
							}));
						}
						const qs: IDataObject = { organization_id: organizationId };
						const response = await zohoBooksApiRequest.call(
							this,
							'POST',
							'/customerpayments',
							body,
							qs
						);
						returnData.push({ json: response });
					}

					if (operation === 'delete') {
						const paymentId = this.getNodeParameter('paymentId', i) as string;
						const qs: IDataObject = { organization_id: organizationId };
						const response = await zohoBooksApiRequest.call(
							this,
							'DELETE',
							`/customerpayments/${paymentId}`,
							{},
							qs
						);
						returnData.push({ json: response });
					}
				} else if (resource === 'apiRequest') {
					const method = this.getNodeParameter('method', i) as IHttpRequestMethods;
					const endpoint = this.getNodeParameter('endpoint', i) as string;
					const rawQuery = this.getNodeParameter('query', i, '') as string;
					const sendBody = this.getNodeParameter('sendBody', i, false) as boolean;
					const rawBody = this.getNodeParameter('body', i, '') as string;
					const organizationId = this.getNodeParameter(
						'organizationIdApi',
						i,
						''
					) as string;

					const qs = parseJsonParameter(rawQuery, 'Query', this);
					if (organizationId) {
						qs.organization_id = organizationId;
					}

					const body = sendBody
						? parseJsonParameter(rawBody, 'Body', this)
						: {};

					const response = await zohoBooksApiRequest.call(
						this,
						method,
						endpoint,
						body,
						qs
					);

					returnData.push({ json: response });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message }
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

