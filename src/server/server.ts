import debug from 'debug';
import express from 'express';
import _ from 'lodash-es';
import { glob } from 'glob';
import { pathToFileURL } from 'url';
import path from 'path';
import 'multer';
import {
    FileLimits, HttpMethod, ParameterConverter,
    ServiceAuthenticator, ServiceFactory
} from './model/server-types.js';
import { ServerContainer } from './server-container.js';

const serverDebugger = debug('typescript-rest:server:build');

/**
 * The Http server main class.
 */
export class Server {
    /**
     * Create the routes for all classes decorated with our decorators
     */
    public static buildServices(router: express.Router, ...types: Array<any>) {
        if (!Server.locked) {
            serverDebugger('Creating typescript-rest services handlers');
            const serverContainer = ServerContainer.get();
            serverContainer.router = router;
            serverContainer.buildServices(types);
        }
    }

    /**
     * An alias for Server.loadServices()
     */
    public static async loadControllers(router: express.Router, patterns: string | Array<string>, baseDir?: string) {
        await Server.loadServices(router, patterns, baseDir);
    }

    /**
     * Load all services from the files that matches the patterns provided
     */
    public static async loadServices(router: express.Router, patterns: string | Array<string>, baseDir?: string) {
        if (!Server.locked) {
            serverDebugger('Loading typescript-rest services %j. BaseDir: %s', patterns, baseDir);
            const importedTypes: Array<Function> = [];
            baseDir = baseDir || process.cwd();

            const patternArray = Array.isArray(patterns) ? patterns : [patterns];
            const files = await glob(patternArray, { cwd: baseDir, absolute: true });

            for (const file of files) {
                const fileUrl = pathToFileURL(file).href;
                const serviceModule = await import(fileUrl);
                _.values(serviceModule)
                    .filter((service: Function) => typeof service === 'function')
                    .forEach((service: Function) => {
                        importedTypes.push(service);
                    });
            }

            try {
                Server.buildServices(router, ...importedTypes);
            } catch (e: any) {
                serverDebugger('Error loading services for pattern: %j. Error: %o', patterns, e);
                serverDebugger('ImportedTypes: %o', importedTypes);
                throw new TypeError(`Error loading services for pattern: ${JSON.stringify(patterns)}. Error: ${e.message}`);
            }
        }
    }

    /**
     * Makes the server immutable. Any configuration change request to the Server
     * is ignored when immutable is true
     * @param value true to make immutable
     */
    public static immutable(value: boolean) {
        Server.locked = value;
    }

    /**
     * Return true if the server is immutable. Any configuration change request to the Server
     * is ignored when immutable is true
     */
    public static isImmutable() {
        return Server.locked;
    }

    /**
     * Retrieve the express router that serves the rest endpoints
     */
    public static server() {
        return ServerContainer.get().router;
    }

    /**
     * Return all paths accepted by the Server
     */
    public static getPaths(): Array<string> {
        const result = new Array<string>();
        ServerContainer.get().getPaths().forEach(value => {
            result.push(value);
        });

        return result;
    }

    /**
     * Register a custom serviceFactory. It will be used to instantiate the service Objects
     * If You plan to use a custom serviceFactory, You must ensure to call this method before any typescript-rest service declaration.
     */
    public static async registerServiceFactory(serviceFactory: ServiceFactory | string) {
        if (!Server.locked) {
            let factory: ServiceFactory;
            if (typeof serviceFactory === 'string') {
                const fileUrl = serviceFactory.startsWith('file://') ? serviceFactory : pathToFileURL(serviceFactory).href;
                const mod = await import(fileUrl);
                factory = mod.default ? mod.default : mod;
            } else {
                factory = serviceFactory as ServiceFactory;
            }

            serverDebugger('Registering a new serviceFactory');
            ServerContainer.get().serviceFactory = factory;
        }
    }

    /**
     * Register a service authenticator. It will be used to authenticate users before the service method
     * invocations occurs.
     */
    public static registerAuthenticator(authenticator: ServiceAuthenticator, name: string = 'default') {
        if (!Server.locked) {
            serverDebugger('Registering a new authenticator with name %s', name);
            ServerContainer.get().authenticator.set(name, authenticator);
        }
    }

    /**
     * Return the set oh HTTP verbs configured for the given path
     * @param servicePath The path to search HTTP verbs
     */
    public static getHttpMethods(servicePath: string): Array<HttpMethod> {
        const result = new Array<HttpMethod>();
        ServerContainer.get().getHttpMethods(servicePath).forEach(value => {
            result.push(value);
        });

        return result;
    }

    /**
     * A string used for signing cookies. This is optional and if not specified,
     * will not parse signed cookies.
     * @param secret the secret used to sign
     */
    public static setCookiesSecret(secret: string) {
        if (!Server.locked) {
            serverDebugger('Setting a new secret for cookies: %s', secret);
            ServerContainer.get().cookiesSecret = secret;
        }
    }

    /**
     * Specifies a function that will be used to decode a cookie's value.
     * This function can be used to decode a previously-encoded cookie value
     * into a JavaScript string.
     * The default function is the global decodeURIComponent, which will decode
     * any URL-encoded sequences into their byte representations.
     *
     * NOTE: if an error is thrown from this function, the original, non-decoded
     * cookie value will be returned as the cookie's value.
     * @param decoder The decoder function
     */
    public static setCookiesDecoder(decoder: (val: string) => string) {
        if (!Server.locked) {
            serverDebugger('Setting a new secret decoder');
            ServerContainer.get().cookiesDecoder = decoder;
        }
    }

    /**
     * Set where to store the uploaded files
     * @param dest Destination folder
     */
    public static setFileDest(dest: string) {
        if (!Server.locked) {
            serverDebugger('Setting a new destination for files: %s', dest);
            ServerContainer.get().fileDest = dest;
        }
    }

    /**
     * Set a Function to control which files are accepted to upload
     * @param filter The filter function
     */
    public static setFileFilter(filter: (req: Express.Request, file: Express.Multer.File,
        callback: (error: Error, acceptFile: boolean) => void) => void) {
        if (!Server.locked) {
            serverDebugger('Setting a new filter for files');
            ServerContainer.get().fileFilter = filter;
        }
    }

    /**
     * Set the limits of uploaded data
     * @param limit The data limit
     */
    public static setFileLimits(limit: FileLimits) {
        if (!Server.locked) {
            serverDebugger('Setting a new fileLimits: %j', limit);
            ServerContainer.get().fileLimits = limit;
        }
    }

    /**
     * Adds a converter for param values to have an ability to intercept the type that actually will be passed to service
     * @param converter The converter
     * @param type The target type that needs to be converted
     */
    public static addParameterConverter(converter: ParameterConverter, type: Function): void {
        if (!Server.locked) {
            serverDebugger('Adding a new parameter converter');
            ServerContainer.get().paramConverters.set(type, converter);
        }
    }

    /**
     * Remove the converter associated with the given type.
     * @param type The target type that needs to be converted
     */
    public static removeParameterConverter(type: Function): void {
        if (!Server.locked) {
            serverDebugger('Removing a parameter converter');
            ServerContainer.get().paramConverters.delete(type);
        }
    }

    /**
     * Makes the server ignore next middlewares for all endpoints.
     * It has the same effect than add @IgnoreNextMiddlewares to all
     * services.
     * @param value - true to ignore next middlewares. 
     */
    public static ignoreNextMiddlewares(value: boolean) {
        if (!Server.locked) {
            serverDebugger('Ignoring next middlewares: %b', value);
            ServerContainer.get().ignoreNextMiddlewares = value;
        }
    }

    private static locked = false;

}
