import {bimport} from "./bimport";
import {brequire} from "./brequire";

/**
 * When running in a BEE, bimport and brequire are implemented by it
 */
(<any>globalThis).bimport === void 0 && ((<any>globalThis).bimport = bimport);
(<any>globalThis).brequire === void 0 && ((<any>globalThis).brequire = brequire);
