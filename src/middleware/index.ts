/**
 * Middleware.
 * @module middleware
 */

// Type imports
import type { Express } from 'express';

/**
 * A middleware registry.
 * @class Middleware
 */
class Middleware {
  public middlewares: any[];
  static instance: Middleware;

  /**
   * Construct a Middleware.
   * @constructs Middleware
   */
  constructor() {
    this.middlewares = [];

    if (!Middleware.instance) {
      Middleware.instance = this;
    }

    return Middleware.instance;
  }

  /**
   * Register a middleware.
   * @param {any} handler The middleware handler to register.
   */
  register(handler: any): void {
    this.middlewares.push(handler);
  }

  /**
   * Use middlewares.
   * @param {app} app The Express app to use the middlewares with.
   */
  use(app: Express): void {
    for (const middleware of this.middlewares) {
      app.use(middleware);
    }
  }
}

// Create an instance of the Middleware registry
const middleware = new Middleware();

// Export the instance and all middlewares
export default middleware;
