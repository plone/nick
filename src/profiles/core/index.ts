/**
 * Profile configuration and setup.
 */

// Internal imports
import blocks from '../../blocks';
import { slate } from '../../blocks/slate/slate';
import { title } from '../../blocks/title/title';
import events from '../../events';
import { purge } from '../../events/cache/cache';
import { content_rules } from '../../events/content_rules/content_rules';
import { push } from '../../events/push/push';
import config from '../../helpers/config/config';

export function init(): void {
  // Register blocks
  blocks.register('title', title);
  blocks.register('slate', slate);

  // Register events
  events.register(content_rules);

  // Add purge events if enabled
  if (config.settings.cache.enabled && config.settings.cache.purge) {
    events.register(purge);
  }

  // Add push events if enabled
  if (config.settings.push?.enabled) {
    events.register(push);
  }
}
