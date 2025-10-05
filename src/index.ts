import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

import ejs from "ejs";
import { marked } from "marked";
import puppeteer from "puppeteer";

import { AuditMetadata, Options, Severity, Yarn4Vulnerability, Vulnerability } from "./types.js";

const bootstrapClassSeverityMap: Record<Severity, string> = {
	critical: "danger",
	high: "warning",
	moderate: "info",
	low: "primary",
	info: "secondary",
};
const severitySortPriority = Object.keys(bootstrapClassSeverityMap);

export function parseYarn4Vulnerability(vulnerability: Yarn4Vulnerability): Vulnerability {
	const { value: module_name, children } = vulnerability;
	const version = children["Tree Versions"][0] || "unknown";
	const key = `${module_name}@${version}-${children.ID}`;

	return {
		key,
		module_name,
		severity: children.Severity,
		children,
	};
}

export async function generateReport(vulnerabilities: Vulnerability[], summary: AuditMetadata, options: Options) {
	vulnerabilities.sort(
		(left, right) => severitySortPriority.indexOf(left.severity) - severitySortPriority.indexOf(right.severity),
	);

	const report = await renderReport(
		{
			reportDate: new Date(),
			vulnerabilities,
			theme: options.theme,
			isPDF: !!options.pdf,
			summary: {
				vulnerabilities: Object.values(summary.vulnerabilities).reduce((sum, value) => sum + value, 0),
				severityCounts: summary.vulnerabilities,
			},
		},
		options.template,
	);

	if (options.pdf) {
		await generatePDF(report, options.output);
	} else {
		await writeReport(options.output, report);
	}

	if (vulnerabilities.length > 0) {
		console.info(`Found ${vulnerabilities.length} vulnerabilities. Report saved to "${options.output}"`);
		if (options.fatalExitCode) {
			process.exit(1);
		}
	} else {
		console.info("No vulnerabilities found.");
		if (options.fatalExitCode) {
			process.exit(0);
		}
	}
}

export async function renderReport(data: ejs.Data, template: string) {
	const htmlTemplate = await readFile(template, "utf8");
	const locale = Intl.DateTimeFormat().resolvedOptions().locale;

	return ejs.render(htmlTemplate, {
		data,
		formatNumber: (number: number) => new Intl.NumberFormat(locale).format(number),
		formatDate: (dateStr: string) =>
			new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "long" }).format(new Date(dateStr)),
		severityClass: (severity: Severity) => bootstrapClassSeverityMap[severity],
		markdown: (code: string) => marked(code, { mangle: false, headerIds: false }),
	});
}

export async function writeReport(outputPath: string, report: string) {
	await writeFile(outputPath, report, { encoding: "utf8" });
}

export async function generatePDF(htmlContent: string, outputPath: string) {
	const browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	try {
		const page = await browser.newPage();
		await page.setContent(htmlContent, { waitUntil: "networkidle0" });

		const pdf = await page.pdf({
			format: "A4",
			margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
			printBackground: true,
			preferCSSPageSize: true,
		});

		await writeFile(outputPath, pdf);
	} finally {
		await browser.close();
	}
}

export function bailWithError(message: string, error: Error, isFatalExitCode: boolean) {
	console.error(`${message}\n`, error);
	process.exit(isFatalExitCode ? 1 : 0);
}
