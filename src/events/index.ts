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

interface Events {
  register: (plugin: EventPlugin, position?: number | 'bottom') => void;
  trigger: (
    event: string,
    document: any,
    user: any,
    trx: Knex.Transaction,
    ...params: any[]
  ) => Promise<void>;
  events: {
    [eventName: string]: EventHandler[];
  };
}

const events: Events = {
  events: {},
  register: (plugin: EventPlugin, position: number | 'bottom' = 'bottom') => {
    mapKeys(plugin, (handler, event) => {
      if (!Array.isArray(events.events[event])) {
        events.events[event] = [];
      }
      if (position === 'bottom') {
        events.events[event].push(handler);
      } else {
        events.events[event].splice(position as number, 0, handler);
      }
      return event;
    });
  },

  trigger: async (
    event: string,
    document: any,
    user: any,
    trx: Knex.Transaction,
    ...params: any[]
  ): Promise<void> => {
    if (!events.events[event]) return;
    await mapAsync(
      events.events[event],
      async (handler) => await handler(document, user, trx, ...params),
    );
  },
};

export default events;
