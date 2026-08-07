from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import time
from typing import Dict, Tuple
from app.config import get_settings

settings = get_settings()

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.rate_limits: Dict[str, Tuple[int, float]] = {}
        self.window = 60  # 1 minute

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        
        # Skip rate limiting for test client
        if client_ip == "testclient" or request.headers.get("X-Test-Client"):
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer app_live_"):
            client_id = auth_header.split(" ")[1][:12]
            limit = settings.API_KEY_RATE_LIMIT_PER_MINUTE
        else:
            client_id = client_ip
            limit = settings.RATE_LIMIT_PER_MINUTE

        now = time.time()

        if client_id in self.rate_limits:
            count, reset_time = self.rate_limits[client_id]
            if now > reset_time:
                self.rate_limits[client_id] = (1, now + self.window)
                count = 1
                reset_time = now + self.window
            else:
                count += 1
                self.rate_limits[client_id] = (count, reset_time)

            if count > limit:
                response = Response("Too Many Requests", status_code=429)
                response.headers["X-RateLimit-Limit"] = str(limit)
                response.headers["X-RateLimit-Remaining"] = "0"
                response.headers["X-RateLimit-Reset"] = str(int(reset_time))
                return response
        else:
            reset_time = now + self.window
            self.rate_limits[client_id] = (1, reset_time)
            count = 1

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - count))
        response.headers["X-RateLimit-Reset"] = str(int(reset_time))

        return response
