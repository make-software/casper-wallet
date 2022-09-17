import { createAction } from 'typesafe-actions';

export const deployPayloadReceived = createAction('DEPLOY_PAYLOAD_RECEIVED')<{
  id: string;
  json: string;
}>();
