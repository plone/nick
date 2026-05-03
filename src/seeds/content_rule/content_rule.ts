/**
 * Content Rule seed.
 * @module seeds/content_rule/content_rule
 */

// Type imports
import type { Knex } from 'knex';

// External imports
import { omit } from 'es-toolkit/object';

// Internal imports
import { fileExists } from '../../helpers/fs/fs';
import { stripI18n } from '../../helpers/i18n/i18n';
import { mapAsync } from '../../helpers/utils/utils';
import models from '../../models';

const contentRuleFields = ['id', 'title', 'description', 'event', 'enabled'];

export const seedContentRule = async (
  trx: Knex.Transaction,
  profilePath: string,
): Promise<void> => {
  const ContentRule = models.get('ContentRule');
  if (await fileExists(`${profilePath}/content_rules`)) {
    const profile = stripI18n(
      (await import(`${profilePath}/content_rules`)).default,
    );
    if (profile.purge) {
      await ContentRule.delete({}, trx);
    }
    await mapAsync(
      profile.content_rules,
      async (content_rule: any, index: number) => {
        await ContentRule.create(
          {
            id: content_rule.id || `rule-${index + 1}`,
            title: content_rule.title || `Rule ${index + 1}`,
            description: content_rule.description || '',
            event: content_rule.event,
            enabled: content_rule.enabled || false,
            json: {
              ...omit(content_rule, contentRuleFields),
              cascading: content_rule.cascading || false,
              stop: content_rule.stop || false,
              actions: content_rule.actions || [],
              conditions: content_rule.conditions || [],
            },
          },
          {},
          trx,
        );
      },
    );
    console.log('Content rules imported');
  }
};
