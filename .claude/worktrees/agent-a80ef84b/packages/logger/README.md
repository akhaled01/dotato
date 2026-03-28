# @dotato/logger

Centralized logging package for the Dotato monorepo using Consola.

## Features

- ✅ **info**, **debug**, **error**, **warn** log levels
- ✅ Timestamps on all log output
- ✅ Beautiful console formatting with colors
- ✅ TypeScript-first with full type safety
- ✅ Zero configuration required

## Usage

```typescript
import { logger } from '@dotato/logger';

logger.info('Server started on port 3000');
logger.debug('Debug information', { userId: 123 });
logger.error('Something went wrong', error);
logger.warn('Deprecated API usage detected');
```

## Advanced Usage

For advanced Consola features, you can import the raw instance:

```typescript
import { consola } from '@dotato/logger';

consola.success('Operation completed!');
consola.box('Important message');
```

## API

### `logger.info(message, ...args)`
Log informational messages with timestamps.

### `logger.debug(message, ...args)`
Log debug information with timestamps.

### `logger.error(message, ...args)`
Log errors with timestamps.

### `logger.warn(message, ...args)`
Log warnings with timestamps.
