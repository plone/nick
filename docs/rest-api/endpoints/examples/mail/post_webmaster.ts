import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });

const { data } = await cli.emailNotification({
  data: {
    name: 'John Doe',
    from: 'john@doe.com',
    subject: 'Hello!',
    message: 'Just want to say hi.',
  },
});
