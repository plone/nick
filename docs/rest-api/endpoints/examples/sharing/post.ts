import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.updateSharing({
  token: login.data.token,
  data: {
    entries: [
      {
        id: 'Administrators',
        roles: {
          Contributor: true,
          Reader: true,
        },
        type: 'user',
      },
    ],
    inherit: true,
  },
});
