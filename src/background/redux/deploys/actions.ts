import { createAction } from 'typesafe-actions';

export const deploysReseted = createAction('DEPLOYS_RESETED')<void>();

export const deployPayloadReceived = createAction('DEPLOY_PAYLOAD_RECEIVED')<{
  id: string;
  json: string;
}>();
