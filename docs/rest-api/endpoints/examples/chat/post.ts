import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.chat({
  token: login.data.token,
  data: {
    prompt: 'What is the username of the nick demo site?',
    messages: [
      {
        role: 'user',
        content: 'What is the password of the nick demo site?',
      },
      {
        role: 'assistant',
        content: 'The password is "admin"',
      },
    ],
    params: {
      Site: 'enable',
    },
  },
});
