export const toJson = (res: Response): Promise<any> => res.json();

export const handleError = (err: Error) => {
  console.error(err);
};
