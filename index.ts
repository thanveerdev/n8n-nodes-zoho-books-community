import { ZohoBooks } from './nodes/ZohoBooks.node';
import { ZohoBooksOAuth2Api } from './credentials/ZohoBooksOAuth2Api.credentials';

export { ZohoBooks, ZohoBooksOAuth2Api };

export const nodes = [ZohoBooks];
export const credentials = [ZohoBooksOAuth2Api];

