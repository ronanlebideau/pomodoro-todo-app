// src/hooks.server.ts
import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  try {
    return await resolve(event);
  } catch (e) {
    console.error('❌ handle crash on', event.url.pathname, e);
    throw e;
  }
};

export const handleError: HandleServerError = ({ error, event }) => {
  console.error('❌ handleError on', event.url.pathname, error);
  return {
    message: 'Internal Server Error'
  };
};
