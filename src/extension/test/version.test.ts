import { EXTENSION_NAME, EXTENSION_VERSION } from '../src/version';

describe('version', () => {
  it('exposes the extension name', () => {
    expect(EXTENSION_NAME).toBe('PhishLens');
  });

  it('exposes a semver-like version string', () => {
    expect(EXTENSION_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
