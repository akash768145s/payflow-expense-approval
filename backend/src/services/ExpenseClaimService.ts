import { ExpenseClaimRepository } from '../repositories/ExpenseClaimRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { StateMachineService } from './StateMachineService';
import { User, ExpenseClaim } from '@prisma/client';
import { Role, Status } from '../types/constants';
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../utils/errors';

export class ExpenseClaimService {
  private claimRepository: ExpenseClaimRepository;
  private auditLogRepository: AuditLogRepository;
  private stateMachineService: StateMachineService;

  constructor(
    claimRepository: ExpenseClaimRepository,
    auditLogRepository: AuditLogRepository,
    stateMachineService: StateMachineService
  ) {
    this.claimRepository = claimRepository;
    this.auditLogRepository = auditLogRepository;
    this.stateMachineService = stateMachineService;
  }

  private validateClaimInput(amount: number, category: string, description: string): void {
    if (amount <= 0) {
      throw new BadRequestError('Amount must be greater than 0');
    }
    if (!category || category.trim() === '') {
      throw new BadRequestError('Category is required');
    }
    if (description && description.length > 1000) {
      throw new BadRequestError('Description must be maximum 1000 characters');
    }
  }

  async getClaim(id: string, currentUser: User) {
    const claim = await this.claimRepository.findById(id, currentUser.organizationId);
    if (!claim) {
      throw new NotFoundError('Claim not found');
    }

    // Employees can only view their own claims
    if (currentUser.role === Role.EMPLOYEE && claim.createdById !== currentUser.id) {
      throw new NotFoundError('Claim not found');
    }

    return claim;
  }

  async listClaims(currentUser: User) {
    if (currentUser.role === Role.EMPLOYEE) {
      return this.claimRepository.findByCreatedBy(currentUser.id, currentUser.organizationId);
    }
    // Managers and Finance can view all claims in their organization
    return this.claimRepository.findByOrganization(currentUser.organizationId);
  }

  async createClaim(
    currentUser: User,
    data: { amount: number; category: string; description: string }
  ): Promise<ExpenseClaim> {
    if (currentUser.role !== Role.EMPLOYEE) {
      throw new ForbiddenError('Only employees can create expense claims');
    }

    this.validateClaimInput(data.amount, data.category, data.description);

    return this.claimRepository.createClaim({
      organizationId: currentUser.organizationId,
      createdById: currentUser.id,
      amount: data.amount,
      category: data.category,
      description: data.description,
    });
  }

  async updateClaim(
    id: string,
    currentUser: User,
    data: { amount?: number; category?: string; description?: string }
  ): Promise<ExpenseClaim> {
    const claim = await this.getClaim(id, currentUser);

    if (currentUser.role !== Role.EMPLOYEE) {
      throw new ForbiddenError('Only employees can edit claims');
    }

    if (claim.createdById !== currentUser.id) {
      throw new ForbiddenError('You can only edit your own claims');
    }

    if (claim.status !== Status.DRAFT) {
      throw new ConflictError('Only draft claims can be edited');
    }

    const updatedAmount = data.amount !== undefined ? data.amount : Number(claim.amount);
    const updatedCategory = data.category !== undefined ? data.category : claim.category;
    const updatedDescription = data.description !== undefined ? data.description : claim.description;

    this.validateClaimInput(updatedAmount, updatedCategory, updatedDescription);

    return this.claimRepository.updateClaim(id, {
      amount: updatedAmount,
      category: updatedCategory,
      description: updatedDescription,
    });
  }

  async deleteClaim(id: string, currentUser: User): Promise<void> {
    const claim = await this.getClaim(id, currentUser);

    if (currentUser.role !== Role.EMPLOYEE) {
      throw new ForbiddenError('Only employees can delete claims');
    }

    if (claim.createdById !== currentUser.id) {
      throw new ForbiddenError('You can only delete your own claims');
    }

    if (claim.status !== Status.DRAFT) {
      throw new ConflictError('Only draft claims can be deleted');
    }

    await this.claimRepository.deleteClaim(id);
  }

  async submitClaim(id: string, currentUser: User, note?: string): Promise<ExpenseClaim> {
    const claim = await this.getClaim(id, currentUser);

    if (currentUser.role !== Role.EMPLOYEE) {
      throw new ForbiddenError('Only employees can submit claims');
    }

    if (claim.createdById !== currentUser.id) {
      throw new ForbiddenError('You can only submit your own claims');
    }

    // State machine check
    this.stateMachineService.validateTransition(claim.status as Status, Status.SUBMITTED);

    const updatedClaim = await this.claimRepository.updateClaim(id, { status: Status.SUBMITTED });

    // Create Audit Log
    await this.auditLogRepository.createLog({
      claimId: id,
      changedById: currentUser.id,
      fromStatus: claim.status as Status,
      toStatus: Status.SUBMITTED,
      note: note || 'Claim submitted for approval',
    });

    return updatedClaim;
  }

  async approveClaim(id: string, currentUser: User, note?: string): Promise<ExpenseClaim> {
    const claim = await this.getClaim(id, currentUser);

    if (currentUser.role !== Role.MANAGER) {
      throw new ForbiddenError('Only managers can approve claims');
    }

    // Managers cannot approve their own claims
    if (claim.createdById === currentUser.id) {
      throw new ForbiddenError('Managers cannot approve their own expense claims');
    }

    // State machine check
    this.stateMachineService.validateTransition(claim.status as Status, Status.APPROVED);

    const updatedClaim = await this.claimRepository.updateClaim(id, { status: Status.APPROVED });

    // Create Audit Log
    await this.auditLogRepository.createLog({
      claimId: id,
      changedById: currentUser.id,
      fromStatus: claim.status as Status,
      toStatus: Status.APPROVED,
      note: note || 'Claim approved by manager',
    });

    return updatedClaim;
  }

  async rejectClaim(id: string, currentUser: User, note?: string): Promise<ExpenseClaim> {
    const claim = await this.getClaim(id, currentUser);

    if (currentUser.role !== Role.MANAGER) {
      throw new ForbiddenError('Only managers can reject claims');
    }

    // Managers cannot reject/approve their own claims
    if (claim.createdById === currentUser.id) {
      throw new ForbiddenError('Managers cannot reject their own expense claims');
    }

    // State machine check
    this.stateMachineService.validateTransition(claim.status as Status, Status.REJECTED);

    const updatedClaim = await this.claimRepository.updateClaim(id, { status: Status.REJECTED });

    // Create Audit Log
    await this.auditLogRepository.createLog({
      claimId: id,
      changedById: currentUser.id,
      fromStatus: claim.status as Status,
      toStatus: Status.REJECTED,
      note: note || 'Claim rejected by manager',
    });

    return updatedClaim;
  }

  async markPaidClaim(id: string, currentUser: User, note?: string): Promise<ExpenseClaim> {
    const claim = await this.getClaim(id, currentUser);

    if (currentUser.role !== Role.FINANCE) {
      throw new ForbiddenError('Only finance users can mark claims as paid');
    }

    // State machine check
    this.stateMachineService.validateTransition(claim.status as Status, Status.PAID);

    const updatedClaim = await this.claimRepository.updateClaim(id, { status: Status.PAID });

    // Create Audit Log
    await this.auditLogRepository.createLog({
      claimId: id,
      changedById: currentUser.id,
      fromStatus: claim.status as Status,
      toStatus: Status.PAID,
      note: note || 'Claim paid by finance',
    });

    return updatedClaim;
  }
}
