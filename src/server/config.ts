import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from './server.js';

const serverDebugger = debug('typescript-rest:server:config:build');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ServerConfig {
    public static configure() {
        try {
            const CONFIG_FILE = this.searchConfigFile();
            if (CONFIG_FILE && fs.existsSync(CONFIG_FILE)) {
                const config = fs.readJSONSync(CONFIG_FILE);
                serverDebugger('rest.config file found: %j', config);
                if (config.serviceFactory) {
                    if (config.serviceFactory.indexOf('.') === 0) {
                        config.serviceFactory = path.join(process.cwd(), config.serviceFactory);
                    }
                    // Note: registerServiceFactory is now async, but configure() is called at module load
                    // Users should call this manually if they need to wait for it
                    Server.registerServiceFactory(config.serviceFactory);
                }
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    }

    public static searchConfigFile() {
        serverDebugger('Searching for rest.config file');
        let configFile = path.join(__dirname, 'rest.config');
        while (!fs.existsSync(configFile)) {
            const fileOnParent = path.normalize(path.join(path.dirname(configFile), '..', 'rest.config'));
            if (configFile === fileOnParent) {
                return null;
            }
            configFile = fileOnParent;
        }
        return configFile;
    }
}
