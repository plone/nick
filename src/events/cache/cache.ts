/**
 * Purge events for caching
 * @module events/cache
 */

// Internal imports
import { purgeXkey } from '../../helpers/cache/cache';

export const purge = {
  onAfterModified: async (document: any) => {
    purgeXkey(document.uuid);
  },

  onBeforeDelete: async (document: any) => {
    purgeXkey(document.uuid);
  },

  onAfterMove: async (document: any) => {
    purgeXkey(document.uuid);
  },

  onAfterDeleteUser: async (_document: any, user: any) => {
    purgeXkey(user.id);
    purgeXkey('users');
  },

  onAfterUpdateUser: async (_document: any, user: any) => {
    purgeXkey(user.id);
    purgeXkey('users');
  },

  onAfterAddUser: async (_document: any, user: any) => {
    purgeXkey(user.id);
    purgeXkey('users');
  },

  onAfterDeleteGroup: async (
    _document: any,
    _user: any,
    _trx: any,
    group: any,
  ) => {
    purgeXkey(group.id);
    purgeXkey('groups');
  },

  onAfterUpdateGroup: async (
    _document: any,
    _user: any,
    _trx: any,
    group: any,
  ) => {
    purgeXkey(group.id);
    purgeXkey('groups');
  },

  onAfterAddGroup: async (
    _document: any,
    _user: any,
    _trx: any,
    group: any,
  ) => {
    purgeXkey(group.id);
    purgeXkey('groups');
  },
};
