#!/usr/bin/env node

import { fstatSync } from "node:fs";
import process from "node:process";

import { program, Option } from "commander";

import { bailWithError, generateReport, parseYarn4Vulnerability } from "./index.js";
import { AuditMetadata, Vulnerability, Options, Yarn4Vulnerability, AuditVulnerabilityCounts } from "./types.js";

async function run(argv: NodeJS.Process["argv"], input: typeof process.stdin) {
	program
		.option("-o, --output [output path]", "output file")
		.option(
			"-t, --template [ejs path]",
			"ejs template path",
			new URL("../templates/template.ejs", import.meta.url).pathname,
		)
		.addOption(
			new Option("--theme [theme name]", "Bootswatch theme. see https://bootswatch.com/#:~:text=Cerulean")
				.default("materia")
				.choices([
					"cerulean",
					"cosmo",
					"cyborg",
					"darkly",
					"flatly",
					"journal",
					"litera",
					"lumen",
					"lux",
					"materia",
					"minty",
					"morph",
					"pulse",
					"quartz",
					"sandstone",
					"simplex",
					"sketchy",
					"slate",
					"solar",
					"spacelab",
					"superhero",
					"united",
					"vapor",
					"yeti",
					"zephyr",
				]),
		)
		.option("--fatal-exit-code", "exit with code 1 if vulnerabilities were found", false)
		.option("--pdf", "generate PDF report instead of HTML", false)
		.parse(argv);

	const options = program.opts<Options>();

	if (!options.output) {
		options.output = options.pdf ? "yarn-audit-report.pdf" : "yarn-audit-report.html";
	}

	const vulnerabilities = new Map<string, Vulnerability>();
	const vulnerabilityCounts: AuditVulnerabilityCounts = {
		info: 0,
		low: 0,
		moderate: 0,
		high: 0,
		critical: 0,
	};

	if (!fstatSync(0).isFIFO()) {
		program.outputHelp();
		process.exit(1);
	}

	let text = "";
	input.on("readable", function (this: typeof process.stdin) {
		try {
			const chunk = this.read();

			if (chunk !== null) {
				text += chunk;

				const lines = text.split("\n");

				if (lines.length > 1) {
					text = lines.splice(-1, 1)[0];

					lines.forEach((line) => {
						if (line.trim()) {
							const yarn4Vulnerability = JSON.parse(line) as Yarn4Vulnerability;
							const vulnerability = parseYarn4Vulnerability(yarn4Vulnerability);

							vulnerabilityCounts[vulnerability.severity]++;

							if (!vulnerabilities.has(vulnerability.key)) {
								vulnerabilities.set(vulnerability.key, vulnerability);
							}
						}
					});
				}
			}
		} catch (error) {
			bailWithError("Failed to parse YARN Audit JSON!", error as Error, options.fatalExitCode);
		}
	});

	input.on("end", async function () {
		try {
			const summary: AuditMetadata = {
				vulnerabilities: vulnerabilityCounts,
			};

			await generateReport(Array.from(vulnerabilities.values()), summary, options);
		} catch (error) {
			bailWithError("Failed to generate report!", error as Error, options.fatalExitCode);
		}
	});
}

/* istanbul ignore if */
if (process.env.NODE_ENV !== "test") {
	run(process.argv, process.stdin);
}

export { run };
