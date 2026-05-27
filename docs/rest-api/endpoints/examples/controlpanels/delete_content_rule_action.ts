import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.deleteControlpanelContentRuleAction({
  token: login.data.token,
  path: '/@controlpanels/content-rules/content-rule-1/action/0',
});
