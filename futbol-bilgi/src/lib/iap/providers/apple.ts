import { getIapConfig } from '../config';
import { hashValue, type VerifyPurchaseInput, type VerifyPurchaseResult } from '../verification';
import type { IapProvider } from './types';

export class AppleIapProvider implements IapProvider {
  async verify(input: VerifyPurchaseInput): Promise<VerifyPurchaseResult> {
    const config = getIapConfig();

    return {
      isValid: false,
      status: 'error',
      productId: input.productId,
      transactionId: input.transactionId ?? 'ios-unconfigured',
      originalTransactionId: null,
      amountCents: null,
      currency: null,
      purchasedAt: new Date().toISOString(),
      expiresAt: null,
      rawResponse: {
        provider: 'apple',
        reason: config.apple.enabled ? 'credentials_not_configured' : 'provider_disabled',
      },
      receiptHash: hashValue(input.receipt),
      purchaseTokenHash: null,
    };
  }
}
