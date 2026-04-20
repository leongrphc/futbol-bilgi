import { getIapConfig } from '../config';
import type { IapPlatform, VerifyPurchaseInput } from '../verification';
import { AppleIapProvider } from './apple';
import { GoogleIapProvider } from './google';
import { MockIapProvider } from './mock';
import type { IapProvider } from './types';

export function getIapProvider(platform: IapPlatform, input: VerifyPurchaseInput): IapProvider {
  const config = getIapConfig();

  if (config.mock.enabled) {
    const hasMockReceipt = typeof input.receipt === 'string' && input.receipt.startsWith('mock:');
    const hasMockToken = typeof input.purchaseToken === 'string' && input.purchaseToken.startsWith('mock:');

    if (hasMockReceipt || hasMockToken) {
      return new MockIapProvider();
    }
  }

  if (platform === 'ios') {
    return new AppleIapProvider();
  }

  return new GoogleIapProvider();
}
