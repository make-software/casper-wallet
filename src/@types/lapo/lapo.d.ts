declare module '@lapo/asn1js' {
  export class ASN1 {
    static decode(data: string | ArrayBuffer | Uint8Array): {
      toPrettyString(): string;
    };
  }
}

declare module '@lapo/asn1js/base64.js' {
  export class Base64 {
    static unarmor(input: string): Uint8Array;
  }
}
