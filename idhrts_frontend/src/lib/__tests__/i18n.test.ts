import i18n from '../i18n';

describe('i18n Configuration', () => {
  it('should be configured with default language en', () => {
    expect(i18n.language).toBe('en');
  });

  it('should have resources for en and am', () => {
    expect(i18n.options.resources).toHaveProperty('en');
    expect(i18n.options.resources).toHaveProperty('am');
  });
});
