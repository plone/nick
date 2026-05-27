import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.updateControlpanel({
  token: login.data.token,
  path: '/@controlpanels/mail',
  data: {
    host: 'mail.someserver.com',
    port: 25,
  },
});
