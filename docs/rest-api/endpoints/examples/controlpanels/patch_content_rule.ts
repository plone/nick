import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.updateControlpanelContentRule({
  token: login.data.token,
  path: '/@controlpanels/content-rules/rule-1',
  data: {
    title: 'New Content Rule 1',
    description: 'Description for Content Rule 1',
    event: 'onAfterModify',
    cascading: false,
    enabled: false,
    stop: false,
  },
});
