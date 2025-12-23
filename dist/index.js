"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.credentials = exports.nodes = exports.ZohoBooksOAuth2Api = exports.ZohoBooks = void 0;
const ZohoBooks_node_1 = require("./nodes/ZohoBooks.node");
Object.defineProperty(exports, "ZohoBooks", { enumerable: true, get: function () { return ZohoBooks_node_1.ZohoBooks; } });
const ZohoBooksOAuth2Api_credentials_1 = require("./credentials/ZohoBooksOAuth2Api.credentials");
Object.defineProperty(exports, "ZohoBooksOAuth2Api", { enumerable: true, get: function () { return ZohoBooksOAuth2Api_credentials_1.ZohoBooksOAuth2Api; } });
exports.nodes = [ZohoBooks_node_1.ZohoBooks];
exports.credentials = [ZohoBooksOAuth2Api_credentials_1.ZohoBooksOAuth2Api];
//# sourceMappingURL=index.js.map