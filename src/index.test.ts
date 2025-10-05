import fs from "node:fs";
import { test, describe, beforeEach, afterEach } from "node:test";

import chai from "chai";
import esmock from "esmock";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import { Yarn4Vulnerability } from "./types.js";

chai.should();
chai.use(sinonChai);

let bailWithError: any;
let generateReport: any;
let parseYarn4Vulnerability: any;
let writeReport: any;
let renderReport: any;

const yarn4Example: Yarn4Vulnerability = {
	value: "@babel/plugin-proposal-async-generator-functions",
	children: {
		ID: "@babel/plugin-proposal-async-generator-functions (deprecation)",
		Issue: "This proposal has been merged to the ECMAScript standard and thus this plugin is no longer maintained. Please use @babel/plugin-transform-async-generator-functions instead.",
		Severity: "moderate",
		"Vulnerable Versions": "7.20.7",
		"Tree Versions": ["7.20.7"],
		Dependents: [
			"@react-native/babel-preset@virtual:fa1aaada1e83d92484e50c1705d8cad4ea9edeba2d201f71711bf6e589c6f4be4661cfb82eaca366a77cf172749451baa7caa9fce6fcf57ff489b0bad358e308#npm:0.74.87",
		],
	},
};

describe("index", () => {
	let processExitStub: sinon.SinonStub;
	let processErrorStub: sinon.SinonStub;
	let consoleInfoMock: sinon.SinonStub;
	let consoleErrorMock: sinon.SinonStub;
	let fsReadFileMock: sinon.SinonStub;
	let fsWriteFileMock: sinon.SinonStub;

	beforeEach(async () => {
		processExitStub = sinon.stub(process, "exit");
		processErrorStub = sinon.stub(process.stderr, "write");
		consoleInfoMock = sinon.stub(console, "info");
		consoleErrorMock = sinon.stub(console, "error");
		fsWriteFileMock = sinon.stub();
		fsReadFileMock = sinon
			.stub(fs.promises, "readFile")
			.resolves(
				'<%= data.vulnerabilities.length %> unique from <%= formatNumber(data.summary.vulnerabilities) %> overall vulnerabilities | <%= data.summary.totalDependencies %> dependencies. <%= formatDate(new Date("2021-04-16T00:00:00.000+02:00")) %> - <%= severityClass(data.severity) %>',
			);
		const indexModule = await esmock(
			"./index.ts",
			{
				"node:fs/promises": {
					readFile: fsReadFileMock,
					writeFile: fsWriteFileMock,
				},
			},
			{
				"node:process": {
					exit: processExitStub,
					stderr: { write: processErrorStub },
				},
			},
		);

		bailWithError = indexModule.bailWithError;
		generateReport = indexModule.generateReport;
		parseYarn4Vulnerability = indexModule.parseYarn4Vulnerability;
		writeReport = indexModule.writeReport;
		renderReport = indexModule.renderReport;
	});

	afterEach(() => {
		sinon.restore();
	});

	test("parseYarn4Vulnerability should return vulnerability correctly", () => {
		const result = parseYarn4Vulnerability(yarn4Example);

		result.should.deep.equal({
			key: "@babel/plugin-proposal-async-generator-functions@7.20.7-@babel/plugin-proposal-async-generator-functions (deprecation)",
			module_name: "@babel/plugin-proposal-async-generator-functions",
			severity: "moderate",
			children: yarn4Example.children,
		});
	});

	test("writeReport should work correctly", async () => {
		const codeExample = "reportCode";
		const templatePath = "myTemplate.html";

		await writeReport(templatePath, codeExample);

		fsReadFileMock.should.not.be.called;
		fsWriteFileMock.should.be.calledOnce;

		const result = await renderReport(
			{
				vulnerabilities: [1, 2],
				summary: {
					vulnerabilities: 123,
					severityCounts: { critical: 1, high: 2, moderate: 3, low: 4, info: 5 },
				},
				date: "2023-01-23T18:54:20.000Z",
			},
			"FIXME 222",
		);

		result.should.contain("2 unique from 123 overall vulnerabilities");

		fsReadFileMock.should.be.calledOnce;
		fsWriteFileMock.should.be.calledOnceWith(templatePath, codeExample);
	});

	test("generateReport should work correctly", async () => {
		const outputPath = "yarnAuditReport.html";
		const templatePath = "myTemplate.html";

		const vulnerability1 = parseYarn4Vulnerability(yarn4Example);
		const vulnerability2 = parseYarn4Vulnerability({
			...yarn4Example,
			value: "test-package",
			children: {
				...yarn4Example.children,
				ID: "test-id",
				"Tree Versions": ["1.0.0"],
			},
		});

		await generateReport(
			[vulnerability1, vulnerability2],
			{
				vulnerabilities: { info: 0, low: 3, moderate: 83, high: 223, critical: 33 },
			},
			{
				output: outputPath,
				template: templatePath,
				theme: "materia",
				fatalExitCode: true,
			},
		);

		fsReadFileMock.should.be.calledOnce;
		fsWriteFileMock.should.be.calledOnce;
		consoleInfoMock.should.be.calledOnce;
		consoleInfoMock.should.be.calledWithExactly(`Found 2 vulnerabilities. Report saved to "${outputPath}"`);
		processExitStub.should.be.calledOnce;
		processExitStub.should.be.calledWithExactly(1);
	});

	test("generateReport should return correct code if no vulnerabilities", async () => {
		await generateReport(
			[],
			{
				vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 },
			},
			{
				output: "yarn-audit-report.html",
				template: "template.ejs",
				theme: "materia",
				fatalExitCode: true,
			},
		);

		fsReadFileMock.should.be.calledOnce;
		fsWriteFileMock.should.be.calledOnce;
		consoleInfoMock.should.be.calledOnce;
		consoleInfoMock.should.be.calledWithExactly("No vulnerabilities found.");
		processExitStub.should.be.calledOnce;
		processExitStub.should.be.calledWithExactly(0);
	});

	test("bailWithError should return correct code with isFatalExitCode", async () => {
		bailWithError("message", new Error("message2"), true);

		consoleErrorMock.should.be.calledOnce;
		processExitStub.should.be.calledOnce;
		processExitStub.should.be.calledWithExactly(1);
	});

	test("bailWithError should return correct code", async () => {
		bailWithError("message", new Error("message3"), false);

		consoleErrorMock.should.be.calledOnce;
		processExitStub.should.be.calledOnce;
		processExitStub.should.be.calledWithExactly(0);
	});
});
