import { parseEip712Payload } from './parse-eip712-payload';

const typedData = {
  domain: {},
  types: {},
  primaryType: 'Order',
  message: {}
};

describe('parseEip712Payload', () => {
  it('forces rejectUnknownFields on when the dapp turns it off', () => {
    expect(
      parseEip712Payload(
        JSON.stringify({ typedData, options: { rejectUnknownFields: false } })
      ).options
    ).toEqual({ rejectUnknownFields: true });
  });

  it('forces rejectUnknownFields on when the dapp sends no options', () => {
    expect(parseEip712Payload(JSON.stringify({ typedData })).options).toEqual({
      rejectUnknownFields: true
    });
  });

  it('keeps the other dapp options', () => {
    const domainTypes = [{ name: 'name', type: 'string' }];
    expect(
      parseEip712Payload(
        JSON.stringify({ typedData, options: { domainTypes } })
      ).options
    ).toEqual({ domainTypes, rejectUnknownFields: true });
  });

  it('keeps the typed data as sent', () => {
    expect(parseEip712Payload(JSON.stringify({ typedData })).typedData).toEqual(
      typedData
    );
  });

  it.each(['{not json', 'null'])('marks %p as an invalid payload', raw => {
    expect(parseEip712Payload(raw)).toEqual({ isInvalidPayload: true });
  });

  it('returns nothing when no payload is stored', () => {
    expect(parseEip712Payload(undefined)).toEqual({});
  });
});
