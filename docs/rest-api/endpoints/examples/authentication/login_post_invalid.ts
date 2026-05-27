import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });

const { data } = await cli.login({
  data: {
    login: 'doesntexist',
    password: 'wrong',
  },
});
