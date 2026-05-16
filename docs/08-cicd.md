# CI/CD

GitHub Actions runs on pushes and pull requests to `main`.

The workflow installs dependencies, checks formatting, runs lint and typecheck, applies migrations, runs tests against PostgreSQL, and builds the production app.
