﻿;
goog.provide('pn.app.AppEvents');


/** @enum {string} */
pn.app.AppEvents = {

  SHOW_DEBUG_MESSAGE: 'show-debug-message',

  // EDIT COMMANDS
  ENTITY_SAVE: 'entity-save',
  ENTITY_CLONE: 'entity-clone',
  ENTITY_DELETE: 'entity-delete',
  ENTITY_CANCEL: 'entity-cancel',

  // DATA LOADER
  QUERY: 'load-entity-lists',
  LOADED_LIST: 'loaded-list',
  CACHED_LOADED_LIST: 'cached-loaded-list',
  LOADED_ENTITY: 'loaded-entity',
  ENTITY_CLONED: 'entity-cloned',
  ENTITY_SAVED: 'entity-saved',
  ENTITY_DELETED: 'entity-deleted',

  // MESSAGES
  CLEAR_MESSAGE: 'clear-message',
  SHOW_MESSAGE: 'show-message',
  SHOW_MESSAGES: 'show-messages',
  SHOW_ERROR: 'show-error',
  SHOW_ERRORS: 'show-errors',
  ENTITY_VALIDATION_ERROR: 'entity-validation-error'
};
