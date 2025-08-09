import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * Cache configuration options
 */
export interface CacheOptions {
    maxAge?: number;
    isPublic?: boolean;
    noCache?: boolean;
    noStore?: boolean;
    mustRevalidate?: boolean;
}

/**
 * ETag generation options
 */
export interface ETagOptions {
    weak?: boolean;
    algorithm?: 'md5' | 'sha1' | 'sha256';
}

/**
 * Cache headers interface
 */
export interface CacheHeaders extends Record<string, string | undefined> {
    'Cache-Control'?: string;
    'ETag'?: string;
    'Last-Modified'?: string;
    'Expires'?: string;
}

/**
 * Service for managing caching mechanisms and ETag generation
 */
@Injectable()
export class CacheService {
    private readonly defaultOptions: CacheOptions = {
        maxAge: 300, // 5 minutes
        isPublic: true,
        noCache: false,
        noStore: false,
        mustRevalidate: false,
    };

    private readonly defaultETagOptions: ETagOptions = {
        weak: false,
        algorithm: 'md5',
    };

    /**
     * Generate ETag for given content
     */
    generateETag(content: any, options: ETagOptions = {}): string {
        const opts = { ...this.defaultETagOptions, ...options };

        // Convert content to string for hashing
        const contentString = typeof content === 'string'
            ? content
            : JSON.stringify(content);

        // Generate hash
        const hash = createHash(opts.algorithm!)
            .update(contentString, 'utf8')
            .digest('hex');

        // Return ETag with proper format
        return opts.weak ? `W/"${hash}"` : `"${hash}"`;
    }

    /**
     * Compare ETags for conditional requests
     */
    compareETags(clientETag: string, serverETag: string): boolean {
        if (!clientETag || !serverETag) {
            return false;
        }

        // Remove W/ prefix for weak ETags comparison
        const normalizeETag = (etag: string) => etag.replace(/^W\//, '');

        return normalizeETag(clientETag) === normalizeETag(serverETag);
    }

    /**
     * Check if request matches any of the provided ETags
     */
    matchesAnyETag(ifNoneMatch: string, serverETag: string): boolean {
        if (!ifNoneMatch || !serverETag) {
            return false;
        }

        // Handle wildcard
        if (ifNoneMatch.trim() === '*') {
            return true;
        }

        // Split multiple ETags and check each one
        const clientETags = ifNoneMatch
            .split(',')
            .map(etag => etag.trim());

        return clientETags.some(clientETag =>
            this.compareETags(clientETag, serverETag)
        );
    }

    /**
     * Generate Cache-Control header value
     */
    generateCacheControl(options: CacheOptions = {}): string {
        const opts = { ...this.defaultOptions, ...options };
        const directives: string[] = [];

        if (opts.noStore) {
            directives.push('no-store');
            return directives.join(', ');
        }

        if (opts.noCache) {
            directives.push('no-cache');
        } else {
            directives.push(opts.isPublic ? 'public' : 'private');

            if (opts.maxAge !== undefined) {
                directives.push(`max-age=${opts.maxAge}`);
            }
        }

        if (opts.mustRevalidate) {
            directives.push('must-revalidate');
        }

        return directives.join(', ');
    }

    /**
     * Generate complete cache headers
     */
    generateCacheHeaders(
        content: any,
        cacheOptions: CacheOptions = {},
        etagOptions: ETagOptions = {}
    ): CacheHeaders {
        const headers: CacheHeaders = {};

        // Generate ETag
        headers['ETag'] = this.generateETag(content, etagOptions);

        // Generate Cache-Control
        headers['Cache-Control'] = this.generateCacheControl(cacheOptions);

        // Add Last-Modified if not no-cache
        if (!cacheOptions.noCache && !cacheOptions.noStore) {
            headers['Last-Modified'] = new Date().toUTCString();
        }

        // Add Expires header for public caches
        const finalOptions = { ...this.defaultOptions, ...cacheOptions };
        if (finalOptions.isPublic && finalOptions.maxAge && !finalOptions.noCache && !finalOptions.noStore) {
            const expiresDate = new Date(Date.now() + (finalOptions.maxAge * 1000));
            headers['Expires'] = expiresDate.toUTCString();
        }

        return headers;
    }

    /**
     * Get cache options based on resource sensitivity
     */
    getCacheOptionsForResource(resourceType: 'public' | 'private' | 'sensitive'): CacheOptions {
        switch (resourceType) {
            case 'public':
                return {
                    maxAge: 300, // 5 minutes
                    isPublic: true,
                    noCache: false,
                    noStore: false,
                };

            case 'private':
                return {
                    maxAge: 60, // 1 minute
                    isPublic: false,
                    noCache: false,
                    noStore: false,
                };

            case 'sensitive':
                return {
                    noCache: true,
                    noStore: true,
                    isPublic: false,
                };

            default:
                return this.defaultOptions;
        }
    }

    /**
     * Check if request should return 304 Not Modified
     */
    shouldReturn304(ifNoneMatch?: string, serverETag?: string): boolean {
        if (!ifNoneMatch || !serverETag) {
            return false;
        }

        return this.matchesAnyETag(ifNoneMatch, serverETag);
    }

    /**
     * Parse If-None-Match header
     */
    parseIfNoneMatch(ifNoneMatchHeader?: string): string[] {
        if (!ifNoneMatchHeader) {
            return [];
        }

        if (ifNoneMatchHeader.trim() === '*') {
            return ['*'];
        }

        return ifNoneMatchHeader
            .split(',')
            .map(etag => etag.trim())
            .filter(etag => etag.length > 0);
    }
}