import { APP_CONFIG } from '../config/app-config.js';
import { eventBus } from './event-bus.js';
import { pageRegistry } from './page-registry.js';
import { moduleRegistry } from './module-registry.js';

export const appContext = Object.freeze({
  config: APP_CONFIG,
  eventBus,
  pageRegistry,
  moduleRegistry
});
