import { MockAdService } from './mock-ad-service';

const mockAdService = new MockAdService();

export function getAdService() {
  return mockAdService;
}
