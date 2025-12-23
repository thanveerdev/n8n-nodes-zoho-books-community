"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZohoBooksOAuth2Api = void 0;
class ZohoBooksOAuth2Api {
    name = 'zohoBooksOAuth2Api';
    displayName = 'Zoho Books OAuth2 API';
    documentationUrl = 'https://www.zoho.com/books/api/v3/introduction/#organization-id';
    extends = ['oAuth2Api'];
    properties = [
        {
            displayName: 'Data Center',
            name: 'dataCenter',
            type: 'options',
            default: 'com',
            description: 'Zoho data center to use for authentication and API calls',
            options: [
                { name: 'United States (.com)', value: 'com' },
                { name: 'Europe (.eu)', value: 'eu' },
                { name: 'India (.in)', value: 'in' },
                { name: 'Australia (.com.au)', value: 'com.au' },
                { name: 'Japan (.jp)', value: 'jp' },
                { name: 'Canada (.ca)', value: 'ca' },
                { name: 'China (.com.cn)', value: 'com.cn' },
                { name: 'Saudi Arabia (.sa)', value: 'sa' }
            ]
        },
        {
            displayName: 'Environment',
            name: 'environment',
            type: 'options',
            default: 'production',
            options: [
                { name: 'Production', value: 'production' },
                { name: 'Sandbox', value: 'sandbox' }
            ],
            description: 'Use sandbox when your Zoho Books account is set up in the sandbox environment'
        },
        {
            displayName: 'Scope',
            name: 'scope',
            type: 'hidden',
            default: 'ZohoBooks.fullaccess.all',
            description: 'Default OAuth scope for Zoho Books'
        },
        {
            displayName: 'Auth URL',
            name: 'authUrl',
            type: 'hidden',
            default: '={{"https://accounts.zoho." + $self.dataCenter + "/oauth/v2/auth"}}',
            description: 'Zoho authorization URL (auto-derived from data center)'
        },
        {
            displayName: 'Token URL',
            name: 'accessTokenUrl',
            type: 'hidden',
            default: '={{"https://accounts.zoho." + $self.dataCenter + "/oauth/v2/token"}}',
            description: 'Zoho token URL (auto-derived from data center)'
        },
        {
            displayName: 'Sandbox Base URL',
            name: 'sandboxBaseUrl',
            type: 'hidden',
            default: '={{"https://sandbox.zohoapis." + $self.dataCenter + "/books/v3"}}',
            description: 'Base URL used when environment is set to sandbox'
        },
        {
            displayName: 'Production Base URL',
            name: 'baseUrl',
            type: 'hidden',
            default: '={{"https://www.zohoapis." + $self.dataCenter + "/books/v3"}}',
            description: 'Base URL used for production calls'
        }
    ];
    test = {
        request: {
            method: 'GET',
            url: '={{$self.environment === "sandbox" ? $self.sandboxBaseUrl : $self.baseUrl}}/organizations'
        }
    };
}
exports.ZohoBooksOAuth2Api = ZohoBooksOAuth2Api;
//# sourceMappingURL=ZohoBooksOAuth2Api.credentials.js.map