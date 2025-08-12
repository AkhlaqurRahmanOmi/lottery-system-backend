import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware to enhance application security
 * Requirements: 10.3, 10.4
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityHeadersMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Content Security Policy (CSP)
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for development
        "style-src 'self' 'unsafe-inline'", // Allow inline styles
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "media-src 'self'",
        "object-src 'none'",
        "child-src 'none'",
        "worker-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
        "manifest-src 'self'",
      ].join('; ')
    );

    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');

    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy (formerly Feature Policy)
    res.setHeader(
      'Permissions-Policy',
      [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'interest-cohort=()',
        'payment=()',
        'usb=()',
      ].join(', ')
    );

    // Strict Transport Security (HSTS) - only in production with HTTPS
    if (process.env.NODE_ENV === 'production' && req.secure) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Cross-Origin Embedder Policy
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    // Cross-Origin Opener Policy
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Cross-Origin Resource Policy
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Remove server information
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // Custom security headers
    res.setHeader('X-Content-Security-Policy', 'default-src \'self\'');
    res.setHeader('X-WebKit-CSP', 'default-src \'self\'');

    // Cache control for sensitive endpoints
    if (this.isSensitiveEndpoint(req.path)) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }

    // Log security-related requests
    this.logSecurityEvents(req, res);

    next();
  }

  /**
   * Check if the endpoint is sensitive and requires additional security measures
   */
  private isSensitiveEndpoint(path: string): boolean {
    const sensitivePatterns = [
      '/api/auth/',
      '/api/admin/',
      '/graphql',
      '/api/submission/',
      '/api/reward/',
    ];

    return sensitivePatterns.some(pattern => path.startsWith(pattern));
  }

  /**
   * Log security-related events
   */
  private logSecurityEvents(req: Request, res: Response): void {
    // Log suspicious user agents
    const userAgent = req.get('User-Agent') || '';
    const suspiciousAgents = [
      'sqlmap',
      'nikto',
      'nessus',
      'openvas',
      'nmap',
      'masscan',
      'zap',
      'burp',
      'w3af',
      'skipfish',
    ];

    if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
      this.logger.warn(`Suspicious user agent detected: ${userAgent}`, {
        ip: req.ip,
        url: req.url,
        method: req.method,
      });
    }

    // Log requests with suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-host',
      'x-originating-ip',
      'x-remote-ip',
      'x-remote-addr',
    ];

    for (const header of suspiciousHeaders) {
      if (req.get(header)) {
        this.logger.warn(`Request with suspicious header: ${header}`, {
          ip: req.ip,
          url: req.url,
          method: req.method,
          headerValue: req.get(header),
        });
      }
    }

    // Log requests with unusual content types
    const contentType = req.get('Content-Type') || '';
    const unusualContentTypes = [
      'application/x-www-form-urlencoded; charset=utf-7',
      'text/xml',
      'application/soap+xml',
    ];

    if (unusualContentTypes.some(type => contentType.includes(type))) {
      this.logger.warn(`Request with unusual content type: ${contentType}`, {
        ip: req.ip,
        url: req.url,
        method: req.method,
      });
    }

    // Log requests with suspicious query parameters
    const queryString = req.url.split('?')[1];
    if (queryString) {
      const suspiciousParams = [
        'union',
        'select',
        'script',
        'javascript',
        'vbscript',
        'onload',
        'onerror',
        'eval',
        'expression',
      ];

      const lowerQuery = queryString.toLowerCase();
      if (suspiciousParams.some(param => lowerQuery.includes(param))) {
        this.logger.warn(`Request with suspicious query parameters`, {
          ip: req.ip,
          url: req.url,
          method: req.method,
          query: queryString.substring(0, 200), // Limit log size
        });
      }
    }
  }
}