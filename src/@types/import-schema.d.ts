declare module '*.svg' {
  const content: JSX.Element;
  export default content;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module 'data-url:*' {
  const value: string;
  export default value;
}
