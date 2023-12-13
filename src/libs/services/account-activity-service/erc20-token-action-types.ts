export class Erc20TokenActionType {
  static byId: Record<number, string> = [
    { id: 1, name: 'Mint' },
    { id: 2, name: 'Transfer' },
    { id: 3, name: 'Approve' },
    { id: 4, name: 'Burn' }
  ].reduce(
    (acc, item) => {
      acc[item.id] = item.name;
      return acc;
    },
    {} as Record<number, string>
  );

  static getActionNameById(id: number) {
    return this.byId[id];
  }
}
