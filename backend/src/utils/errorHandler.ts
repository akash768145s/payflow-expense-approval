import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from './errors';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  // If it is a known app custom error
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: error.constructor.name,
      message: error.message,
    });
    return;
  }

  // Catch Fastify validation errors if they occur
  if (error.validation) {
    reply.status(400).send({
      error: 'ValidationError',
      message: error.message,
    });
    return;
  }

  // Fallback for unexpected errors
  request.log.error(error);

  reply.status(500).send({
    error: 'InternalServerError',
    message: 'An unexpected internal server error occurred.',
  });
}
