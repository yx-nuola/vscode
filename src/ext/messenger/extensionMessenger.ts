import { Messenger } from 'vscode-messenger';

export const extensionMessenger = new Messenger({
  ignoreHiddenViews: false,
  uniqueHandlers: true,
});
