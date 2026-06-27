import { FastifyRequest, FastifyReply } from 'fastify';
import { ExpenseClaimService } from '../services/ExpenseClaimService';
import { createClaimSchema, updateClaimSchema, actionNoteSchema, sendBackSchema } from '../validators';
import { BadRequestError } from '../utils/errors';

export class ExpenseClaimController {
  private claimService: ExpenseClaimService;

  constructor(claimService: ExpenseClaimService) {
    this.claimService = claimService;
  }

  listClaims = async (request: FastifyRequest, reply: FastifyReply) => {
    const claims = await this.claimService.listClaims(request.currentUser!);
    return { claims };
  };

  getClaim = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const claim = await this.claimService.getClaim(id, request.currentUser!);
    return { claim };
  };

  createClaim = async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = createClaimSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new BadRequestError(parseResult.error.errors[0].message);
    }

    const claim = await this.claimService.createClaim(request.currentUser!, parseResult.data);
    reply.status(210); // Standard OK or 201 Created
    reply.send({ claim });
  };

  updateClaim = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parseResult = updateClaimSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new BadRequestError(parseResult.error.errors[0].message);
    }

    const claim = await this.claimService.updateClaim(id, request.currentUser!, parseResult.data);
    return { claim };
  };

  deleteClaim = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await this.claimService.deleteClaim(id, request.currentUser!);
    return { success: true };
  };

  submitClaim = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parseResult = actionNoteSchema.safeParse(request.body || {});
    const note = parseResult.success ? parseResult.data.note : undefined;

    const claim = await this.claimService.submitClaim(id, request.currentUser!, note);
    return { claim };
  };

  approveClaim = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parseResult = actionNoteSchema.safeParse(request.body || {});
    const note = parseResult.success ? parseResult.data.note : undefined;

    const claim = await this.claimService.approveClaim(id, request.currentUser!, note);
    return { claim };
  };

  rejectClaim = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parseResult = actionNoteSchema.safeParse(request.body || {});
    const note = parseResult.success ? parseResult.data.note : undefined;

    const claim = await this.claimService.rejectClaim(id, request.currentUser!, note);
    return { claim };
  };

  markPaidClaim = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parseResult = actionNoteSchema.safeParse(request.body || {});
    const note = parseResult.success ? parseResult.data.note : undefined;

    const claim = await this.claimService.markPaidClaim(id, request.currentUser!, note);
    return { claim };
  };

  sendBackClaim = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parseResult = sendBackSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new BadRequestError(parseResult.error.errors[0].message);
    }

    const claim = await this.claimService.sendBackClaim(id, request.currentUser!, parseResult.data.reason);
    return { claim };
  };
}
