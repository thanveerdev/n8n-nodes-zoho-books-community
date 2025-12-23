# n8n-nodes-zoho-books-community

Custom n8n community node for Zoho Books with OAuth2 support.

## Features

- OAuth2 credential with selectable Zoho data center (.com, .eu, .in, .com.au, .jp, .ca, .com.cn, .sa) and sandbox toggle.
- Organizations: list/get.
- Contacts: list/get/create/update/delete (with custom fields helper, extra body fields, and a mapped-field dropdown; email/phone in mapped/extra fields auto-create a primary contact person).
- Invoices: list/get/create/update/delete (with custom fields helper and extra body fields).
- Payments (customer payments): list/get/create/delete (with custom fields helper and extra body fields).
- Custom fields helper maps `label/name` + `value` into `custom_fields` payload. Extra body fields lets you inject arbitrary API fields without editing raw JSON.
- Generic "API Request" operation to hit any `/books/v3` endpoint with JSON query/body helpers and optional `organization_id` injection.

## Setup

1. Create a Zoho OAuth client (server-based) in the right data center. Use scope `ZohoBooks.fullaccess.all`.  
   Reference: [Zoho Books API – Organization ID & OAuth](https://www.zoho.com/books/api/v3/introduction/#organization-id).
2. In n8n, add credentials using **Zoho Books OAuth2 API**:
   - Set Client ID/Secret from Zoho.
   - Choose the data center and environment (production/sandbox).
   - Complete the OAuth flow.
3. Install this package in your n8n instance (e.g. `npm i n8n-nodes-zoho-books-community` in the n8n user folder or use the UI custom nodes installer).

## Usage

- **Organization → List/Get**: quickly fetch available organizations.
- **Contacts/Invoices/Payments**: dedicated CRUD-style ops with org id + paging filters.
- **API Request (Generic)**:
  - Set the HTTP method and endpoint (e.g. `/invoices`).
  - Provide query/body as JSON strings. Optional `organization_id` field can be set directly on the node.

## Build

```bash
npm install
npm run build
```

The compiled files will be placed in `dist/` as required by n8n.

## Notes

- `organization_id` is required by most Zoho Books endpoints; provide it either via the dedicated field or inside the query JSON.
- Respect Zoho Books rate limits (per plan and per minute) to avoid HTTP 429 responses.

