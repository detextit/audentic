# Audentic

Enable voice agents for your website

## Overview

Audentic is a powerful tool that allows you to integrate voice-enabled AI agents into your website. It provides a seamless way to add voice interaction capabilities to enhance user experience and accessibility.

## Features

- 🎙️ Real-time voice interaction
- 🤖 AI-powered conversational agents
- 🌐 Easy website integration
- ⚡ Low-latency responses
- 🔒 Secure communication

## Development

### Logging

The application uses a custom logging utility that automatically handles different environments:

- In development: Debug logs are displayed in the console
- In production: Debug logs are suppressed, but info, warn, and error logs are still shown

To use the logger in your components:

```typescript
import { createLogger } from "@/utils/logger";

// Create a logger instance for your component
const logger = createLogger("ComponentName");

// Different log levels
logger.debug("Debug message", { data }); // Only shown in development
logger.info("Info message"); // Shown in all environments
logger.warn("Warning message"); // Shown in all environments
logger.error("Error message"); // Always shown

// You can also use the default logger
import { logger } from "@/utils/logger";
logger.info("Using default logger");
```

Environment is determined by the `NEXT_PUBLIC_NODE_ENV` environment variable.
