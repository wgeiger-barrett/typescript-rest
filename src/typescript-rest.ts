import { ServerConfig } from './server/config.js';
import * as Errors from './server/model/errors.js';
import * as Return from './server/model/return-types.js';

export * from './decorators/parameters.js';
export * from './decorators/methods.js';
export * from './decorators/services.js';
export * from './server/model/server-types.js';
export * from './server/server.js';

export { Return };
export { Errors };
export { DefaultServiceFactory } from './server/server-container.js';

ServerConfig.configure();
