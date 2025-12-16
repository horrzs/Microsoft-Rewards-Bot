# Error Reporting

## What it does
Automatically sends anonymized error reports to help improve the project. When enabled, the bot reports genuine bugs (not user configuration errors) to a central Discord webhook.

## Privacy
- **No sensitive data is sent:** Emails, passwords, tokens, and file paths are automatically redacted.
- **Only genuine bugs are reported:** User configuration errors (wrong password, missing files) are filtered out.
- **Completely optional:** Disable in config.jsonc if you prefer not to participate.

## How to configure
In src/config.jsonc:

```jsonc
{
  "errorReporting": {
    "enabled": true  // Set to false to disable
  }
}
```

## What gets reported
- Error message (sanitized)
- Stack trace (truncated, paths removed)
- Bot version
- OS platform and architecture
- Node.js version
- Timestamp

## What is filtered out
- Login failures (your credentials are never sent)
- Account suspensions/bans
- Configuration errors (missing files, invalid settings)
- Network timeouts
- Expected errors (daily limit reached, activity not available)

---
**[Back to Documentation](index.md)**