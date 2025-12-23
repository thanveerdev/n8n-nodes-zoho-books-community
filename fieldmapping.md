# Zoho Books Field Mapping (Labels ↔ API Names)

Commonly used fields grouped by resource. Use the API name in JSON bodies or query parameters; labels reflect what you typically see in UI/CSV.

## Contacts
- Contact Name → `contact_name`
- Company Name → `company_name`
- Customer/Vendor Type → `contact_type` (customer | vendor)
- Display Name → `display_name`
- Primary Email → `email` (but prefer setting on `contact_persons` for reliable email delivery)
- Primary Phone → `phone` (but prefer setting on `contact_persons`)
- Mobile → `mobile` (but prefer setting on `contact_persons`)
- Website → `website`
- Currency Code → `currency_code`
- Payment Terms → `payment_terms`
- Payment Terms Label → `payment_terms_label`
- Notes → `notes`
- GST Treatment (IN) → `gst_treatment`
- Place of Supply (IN) → `place_of_contact`
- Tax Authority ID (US/CA) → `tax_authority_id`
- Tax Exemption ID (US/CA) → `tax_exemption_id`
- Billing Address → `billing_address` (object)
- Shipping Address → `shipping_address` (object)
- Contact Persons → `contact_persons` (array of objects)
  - First Name → `first_name`
  - Last Name → `last_name`
  - Email → `email`
  - Phone → `phone`
  - Mobile → `mobile`
  - Is Primary → `is_primary_contact` (true/false)
- Custom Fields → `custom_fields` (array of `{ label, value }`)

## Invoices
- Customer ID → `customer_id`
- Invoice Number → `invoice_number`
- Invoice Date → `date`
- Due Date → `due_date`
- Status → `status`
- Reference Number → `reference_number`
- Currency Code → `currency_code`
- Exchange Rate → `exchange_rate`
- Discount → `discount`
- Discount Type → `discount_type` (entity_level | item_level)
- Pricebook ID → `pricebook_id`
- Notes → `notes`
- Terms → `terms`
- Billing Address → `billing_address` (object)
- Shipping Address → `shipping_address` (object)
- Line Items → `line_items` (array of objects)
  - Item ID → `item_id`
  - Name → `name`
  - Description → `description`
  - Quantity → `quantity`
  - Rate/Price → `rate`
  - Unit → `unit`
  - Tax ID → `tax_id`
  - Tax Name → `tax_name`
  - Discount → `discount`
  - Line Item Custom Fields → `line_item_custom_fields`
- Allow Partial Payments → `allow_partial_payments`
- Custom Fields → `custom_fields` (array of `{ label, value }`)

## Customer Payments
- Customer ID → `customer_id`
- Payment Mode → `payment_mode`
- Payment Number → `payment_number`
- Payment Date → `payment_date`
- Amount → `amount`
- Currency Code → `currency_code`
- Exchange Rate → `exchange_rate`
- Invoices → `invoices` (array of objects to apply payment)
  - Invoice ID → `invoice_id`
  - Amount Applied → `amount_applied`
- Notes → `notes`
- Bank Charges → `bank_charges`
- Reference Number → `reference_number`
- Account ID (ledger) → `account_id`
- Custom Fields → `custom_fields` (array of `{ label, value }`)

## Address Object (for Contacts/Invoices)
- Attention → `attention`
- Address Line 1 → `address`
- Address Line 2 → `street2`
- City → `city`
- State → `state`
- Zip/Postal Code → `zip`
- Country → `country`
- Fax → `fax`
- Phone → `phone`

## Custom Fields Notes
- For any resource, `custom_fields` expects an array of `{ label, value }`.
- If your Zoho Books org uses API names for custom fields, use those in `label`; otherwise the display label works.
- Line item custom fields go under `line_item_custom_fields` on each line item.





