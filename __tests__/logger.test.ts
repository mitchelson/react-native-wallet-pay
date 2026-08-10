describe('logger', () => {
  const originalDev = (global as { __DEV__?: boolean }).__DEV__;

  afterEach(() => {
    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('suppresses debug logs outside __DEV__', async () => {
    (global as { __DEV__?: boolean }).__DEV__ = false;
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { logger } = await import('../src/logger');
    logger.debug('secret payload');
    logger.error('visible error');

    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('emits debug logs in __DEV__', async () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { logger } = await import('../src/logger');
    logger.debug('dev only');

    expect(logSpy).toHaveBeenCalled();
  });
});
