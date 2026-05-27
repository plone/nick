import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.restoreRecyclebinItem({
  token: login.data.token,
  params: { id: '455ca717-0c68-43a0-88ac-629a72658675' },
  data: {
    target_path: '/news',
  },
});
