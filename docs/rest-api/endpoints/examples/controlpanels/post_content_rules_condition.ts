import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.createControlpanelContentRuleCondition({
  token: login.data.token,
  data: {
    file_extension: 'jpg',
    type: 'file_extension',
  },
});
