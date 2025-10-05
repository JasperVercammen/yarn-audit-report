# yarn-audit-report

## Generate HTML/PDF reports for Yarn 4 Audit

This tool generates beautiful HTML or PDF reports from Yarn 4 audit results, helping you visualize and analyze security
vulnerabilities in your project dependencies.

## Features

-   🔍 **Yarn 4 Support**: Built specifically for Yarn 4 audit format
-   📄 **HTML & PDF Output**: Generate both HTML and PDF reports
-   🎨 **Customizable Themes**: Choose from 24+ Bootstrap themes
-   📊 **Severity Overview**: Visual breakdown of vulnerability counts by severity
-   🔗 **Dependency Paths**: Expanded view of how vulnerabilities are introduced
-   📋 **Detailed Reports**: Complete vulnerability information including CVE details
-   ⚙️ **Custom Templates**: Use your own EJS templates for full customization

## Install

```bash
yarn add -D yarn-audit-report
# or globally
yarn global add yarn-audit-report
```

## Usage

⚠️ **Important**: This tool only supports **Yarn 4** audit format. For legacy Yarn versions, please use an older version
of this package.

### Generate HTML Report

```bash
yarn npm audit --json | yarn yarn-audit-report
```

### Generate PDF Report

```bash
yarn npm audit --json | yarn yarn-audit-report --pdf
```

By default, reports are saved as `yarn-audit-report.html` (or `.pdf` for PDF output). Vulnerabilities are grouped by
module name, version, and advisory details for accurate counting.

### Specify Output File

```bash
yarn npm audit --json | yarn yarn-audit-report --output my-security-report.html
yarn npm audit --json | yarn yarn-audit-report --pdf --output my-security-report.pdf
```

### Use Custom Templates

You can fully customize the generated report using your own EJS template:

```bash
yarn npm audit --json | yarn yarn-audit-report --template ./my-awesome-template.ejs
```

### Choose a Theme

Select from 24+ available [Bootswatch](https://bootswatch.com) themes:

```bash
yarn npm audit --json | yarn yarn-audit-report --theme darkly
# Available themes: cerulean, cosmo, cyborg, darkly, flatly, journal, litera,
# lumen, lux, materia, minty, morph, pulse, quartz, sandstone, simplex,
# sketchy, slate, solar, spacelab, superhero, united, vapor, yeti, zephyr
```

### Exit with Error Code

Make the command exit with code 1 when vulnerabilities are found (useful for CI/CD):

```bash
yarn npm audit --json | yarn yarn-audit-report --fatal-exit-code
```

## Command Line Options

| Option              | Description                               | Default                              |
| ------------------- | ----------------------------------------- | ------------------------------------ |
| `--output`          | Output file path                          | `yarn-audit-report.html` (or `.pdf`) |
| `--template`        | Path to custom EJS template               | Built-in template                    |
| `--theme`           | Bootswatch theme name                     | `materia`                            |
| `--pdf`             | Generate PDF instead of HTML              | `false`                              |
| `--fatal-exit-code` | Exit with code 1 if vulnerabilities found | `false`                              |

## Requirements

-   **Node.js**: >= 16
-   **Yarn**: 4.x only
-   For PDF generation: Chromium/Chrome (automatically downloaded by Puppeteer)

## Migration from yarn-audit-html

This package was renamed from `yarn-audit-html` and refactored to support only Yarn 4. Key changes:

-   ✅ Yarn 4 JSONL format support
-   ✅ PDF generation capability
-   ✅ Improved UI with severity overview
-   ✅ Expanded dependency path display
-   ❌ Removed Yarn 1/2/3 support (use older versions for legacy support)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

---

Inspired by [npm-audit-html](https://github.com/Filiosoft/npm-audit-html) package.
