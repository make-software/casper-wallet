import { By } from 'selenium-webdriver';

export const getUrlPath = (url: string) => url.split('#/')[1];

export const byText = (text: string) => By.xpath(`//*[text()='${text}']`);

export const byTestId = (dataTestId: string) =>
  By.xpath(`//*[@data-testid='${dataTestId}']`);

export const byInputName = (name: string) =>
  By.xpath(`//input[@name='${name}']`);

export const byButtonText = (text: string) =>
  By.xpath(`//button[text()='${text}']`);
