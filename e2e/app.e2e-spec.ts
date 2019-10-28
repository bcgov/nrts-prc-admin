import { BaseApp2Page } from './app.po';

describe('nrts-prc-admin App', () => {
  let page: BaseApp2Page;

  beforeEach(() => {
    page = new BaseApp2Page();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect<any>(page.getParagraphText()).toEqual('app works!');
  });
});
