import type { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class ZohoBooksOAuth2Api implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    extends: string[];
    properties: INodeProperties[];
    test: ICredentialTestRequest;
}
