/**
 * Point of contact for events.
 * @module events
 * @example import events from './events';
 */

// External imports
import { mapKeys } from 'es-toolkit/object';
import { Knex } from 'knex';

// Internal imports
import { mapAsync } from '../helpers/utils/utils';

type EventHandler = (
  context: any,
  trx: Knex.Transaction,
  ...params: any[]
) => Promise<void>;

interface EventPlugin {
  [eventName: string]: EventHandler;
}

/**
 * An event registry.
 * @class Events
 */
class Events {
  public events: {
    [eventName: string]: EventHandler[];
  };
  static instance: Events;

  /**
   * Construct a Config.
   * @constructs Config
   */
  constructor() {
    this.events = {};

    if (!Events.instance) {
      Events.instance = this;
    }

    return Events.instance;
  }

  /**
   * Register an event.
   * @param {EventPlugin} plugin Plugin with events.
   * @param {number | 'bottom'} position Position to insert
   */
  register(plugin: EventPlugin, position: number | 'bottom' = 'bottom') {
    const self = this;
    mapKeys(plugin, (handler, event) => {
      if (!Array.isArray(self.events[event])) {
        self.events[event] = [];
      }
      if (position === 'bottom') {
        self.events[event].push(handler);
      } else {
        self.events[event].splice(position as number, 0, handler);
      }
      return event;
    });
  }

  /**
   * Trigger an event.
   * @param {string} name The name of the event.
   * @param {Object} document The document related to the event.
   * @param {Object} user The user related to the event.
   * @param {Knex.Transaction} trx The transaction related to the event.
   * @param {...any} params Additional parameters to pass to the event handlers.
   * @returns {Promise<void>} A promise that resolves when all event handlers have been executed.
   */
  async trigger(
    event: string,
    document: any,
    user: any,
    trx: Knex.Transaction,
    ...params: any[]
  ): Promise<void> {
    const self = this;
    if (!self.events[event]) return;
    await mapAsync(
      self.events[event],
      async (handler) => await handler(document, user, trx, ...params),
    );
  }
}

// Create an instance of the Events registry
const events = new Events();

export default events;
