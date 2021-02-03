'use strict'

module.exports = {
    extends: '@istanbuljs/nyc-config-typescript',
    all: true,
    exclude: [
        'coverage',
        'dist',
        'node_modules',
        'testing',
        'tests',
    ],
    include: [
        'lib',
    ],
    reporter: [
        'text',
        'html',
        'lcov',
    ]
}
