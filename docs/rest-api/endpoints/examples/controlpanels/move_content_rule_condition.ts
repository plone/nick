import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.updateControlpanelContentRuleCondition({
  token: login.data.token,
  path: '/@controlpanels/content-rules/rule-1/condition/1',
  data: {
    'form.button.Move': '_move_up',
  },
});
