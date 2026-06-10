/**
 * Requests.
 * @module requests
 */

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { v4 as uuid } from 'uuid';

dayjs.extend(utc);

type Request = {
  created?: string;
  url: string;
};

/**
 * A requests registry.
 * @class Requests
 */
class Requests {
  public requests: { [key: string]: any };
  public started: string;
  static instance: Requests;

  /**
   * Construct a Requests.
   * @constructs Requests
   */
  constructor() {
    this.requests = {};
    this.started = dayjs.utc().format();

    if (!Requests.instance) {
      Requests.instance = this;
    }

    return Requests.instance;
  }

  /**
   * Register a request.
   * @param {string} name The name of the request.
   * @param {Handler} model The model to register.
   */
  register(request: Request): string {
    const id = uuid();
    const created = dayjs.utc().format();
    this.requests = { ...this.requests, [id]: { ...request, created } };
    return id;
  }

  /**
   * Mark a request as done.
   * @param {string} id The ID of the request.
   */
  done(id: string) {
    delete this.requests[id];
  }
}

// Create an instance of the Requests registry and register all requests
const requests = new Requests();

// Export the instance and all requests
export default requests;
