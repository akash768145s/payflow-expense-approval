import { Status } from '../types/constants';
import { ConflictError } from '../utils/errors';

export class StateMachineService {
  private allowedTransitions: Record<Status, Status[]> = {
    [Status.DRAFT]: [Status.SUBMITTED],
    [Status.SUBMITTED]: [Status.APPROVED, Status.REJECTED],
    [Status.APPROVED]: [Status.PAID],
    [Status.REJECTED]: [],
    [Status.PAID]: [],
  };

  validateTransition(fromStatus: Status, toStatus: Status): void {
    const allowed = this.allowedTransitions[fromStatus];
    if (!allowed || !allowed.includes(toStatus)) {
      throw new ConflictError(`Invalid status transition: Claim status cannot change from ${fromStatus} to ${toStatus}.`);
    }
  }
}
