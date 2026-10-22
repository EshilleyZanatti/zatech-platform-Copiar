
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

const buckets = new Map<string, { count: number; start: number }>();

@Injectable()
export class ThrottlerGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now - bucket.start > 60_000) {
      buckets.set(key, { count: 1, start: now });
      return true;
    }

    if (bucket.count >= 120) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count++;
    return true;
  }
}

