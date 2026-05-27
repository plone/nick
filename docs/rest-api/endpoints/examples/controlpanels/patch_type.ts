import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.updateControlpanelType({
  token: login.data.token,
  path: '/@controlpanels/dexterity-types/Page',
  data: {
    description: 'Some Description',
    preview_image_link: true,
  },
});
