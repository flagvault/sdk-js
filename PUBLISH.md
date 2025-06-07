# Publishing Guide for FlagVault JavaScript SDK

## Pre-publish Checklist

- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated with release notes
- [ ] README.md is up to date
- [ ] Examples work with new changes

## Publishing Steps

### 1. Clean and Build

```bash
npm run clean
npm run build
```

### 2. Test Package Locally

```bash
# Pack the package
npm pack

# Test in another project
cd /tmp
mkdir test-flagvault
cd test-flagvault
npm init -y
npm install /path/to/flagvault-sdk-1.0.0.tgz

# Create test file
echo "const FlagVaultSDK = require('@flagvault/sdk').default; console.log(FlagVaultSDK);" > test.js
node test.js
```

### 3. Login to NPM

```bash
npm login
```

### 4. Publish (Dry Run First)

```bash
# Dry run to see what will be published
npm publish --dry-run

# If everything looks good, publish
npm publish
```

### 5. Verify Publication

1. Check npm page: https://www.npmjs.com/package/@flagvault/sdk
2. Install from npm in a test project:
   ```bash
   npm install @flagvault/sdk@latest
   ```

### 6. Create GitHub Release

1. Tag the release:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. Create release on GitHub with:
   - Release notes from CHANGELOG.md
   - Link to npm package
   - Migration guide for breaking changes

## Troubleshooting

### Package Already Exists

If you get "You cannot publish over the previously published versions", you need to bump the version:

```bash
npm version patch  # or minor/major
```

### Authentication Issues

Make sure you're logged in with the correct npm account that has publish access to `@flagvault` scope.

### Missing Files

Check `.npmignore` to ensure important files aren't excluded. Run `npm pack` and inspect the tarball:

```bash
npm pack
tar -tf flagvault-sdk-1.0.0.tgz
```

## Post-Publish

1. Update documentation site with new version
2. Announce release in Discord/Slack
3. Update example repositories
4. Monitor npm downloads and issues