import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.getControlpanelContentRule({
  token: login.data.token,
  path: '/@controlpanels/content-rules/rule-1',
});
