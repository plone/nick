import { describe, it } from 'vitest';
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Vocabularies', () => {
  it('should return the vocabularies', () =>
    testRequest(app, 'vocabularies/list'));

  it('should return a single vocabulary', () =>
    testRequest(app, 'vocabularies/get'));

  it('should return a actions vocabulary', () =>
    testRequest(app, 'vocabularies/get_actions'));

  it('should return a behaviors vocabulary', () =>
    testRequest(app, 'vocabularies/get_behaviors'));

  it('should return a groups vocabulary', () =>
    testRequest(app, 'vocabularies/get_groups'));

  it('should return a image scales vocabulary', () =>
    testRequest(app, 'vocabularies/get_image_scales'));

  it('should return a permissions vocabulary', () =>
    testRequest(app, 'vocabularies/get_permissions'));

  it('should return a subjects vocabulary', () =>
    testRequest(app, 'vocabularies/get_subjects'));

  it('should return a supported languages vocabulary', () =>
    testRequest(app, 'vocabularies/get_supported_languages'));

  it('should return a system groups vocabulary', () =>
    testRequest(app, 'vocabularies/get_system_groups'));

  it('should return a system users vocabulary', () =>
    testRequest(app, 'vocabularies/get_system_users'));

  it('should return a system types vocabulary', () =>
    testRequest(app, 'vocabularies/get_types'));

  it('should return a system users vocabulary', () =>
    testRequest(app, 'vocabularies/get_users'));

  it('should return a workflow states vocabulary', () =>
    testRequest(app, 'vocabularies/get_workflow_states'));

  it('should return a workflow transitions vocabulary', () =>
    testRequest(app, 'vocabularies/get_workflow_transitions'));

  it('should return a workflows vocabulary', () =>
    testRequest(app, 'vocabularies/get_workflows'));

  it('should return a boolean vocabulary', () =>
    testRequest(app, 'vocabularies/get_boolean'));

  it('should return a captcha-providers vocabulary', () =>
    testRequest(app, 'vocabularies/get_captcha_providers'));

  it('should return a fields vocabulary', () =>
    testRequest(app, 'vocabularies/get_fields'));

  it('should return a available languages vocabulary', () =>
    testRequest(app, 'vocabularies/get_available_languages'));

  it('should return a 404 if the vocabulary does not exist', () =>
    testRequest(app, 'vocabularies/get_notfound'));
});
