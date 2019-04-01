/* 01. Apr. 2019 - changes by @brakmic */
/* Ported from https://github.com/sourcegraph/javascript-typescript-langserver */

import * as url from 'url';

/**
 * Converts a uri to an absolute path.
 * The OS style is determined by the URI. E.g. `file:///c:/foo` always results in `c:\foo`
 *
 * @param uri a file:// uri
 */
export function uri2path(uri: string): string {
    const parts = url.parse(uri)
    if (parts.protocol !== 'file:') {
        throw new Error('Cannot resolve non-file uri to path: ' + uri)
    }

    let filePath = parts.pathname || ''

    // If the path starts with a drive letter, return a Windows path
    if (/^\/[a-z]:\//i.test(filePath)) {
        filePath = filePath.substr(1).replace(/\//g, '\\')
    }

    return decodeURIComponent(filePath)
}

/**
 * Normalizes URI encoding by encoding _all_ special characters in the pathname
 */
export function normalizeUri(uri: string): string {
    const parts = url.parse(uri)
    if (!parts.pathname) {
        return uri
    }
    const pathParts = parts.pathname.split('/').map(segment => encodeURIComponent(decodeURIComponent(segment)))
    // Decode Windows drive letter colon
    if (/^[a-z]%3A$/i.test(pathParts[1])) {
        pathParts[1] = decodeURIComponent(pathParts[1])
    }
    parts.pathname = pathParts.join('/')
    return url.format(parts)
}