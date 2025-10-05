export type Severity = "info" | "low" | "moderate" | "high" | "critical";

export type Yarn4Vulnerability = {
	value: string;
	children: {
		ID: number | string;
		Issue: string;
		Severity: Severity;
		"Vulnerable Versions": string;
		"Tree Versions": string[];
		Dependents: string[];
		URL?: string;
	};
};

export type Vulnerability = {
	key: string;
	module_name: string;
	severity: Severity;
	children: Yarn4Vulnerability["children"];
};

export type AuditVulnerabilityCounts = Record<Severity, number>;

export type AuditMetadata = {
	vulnerabilities: AuditVulnerabilityCounts;
};

export type Options = {
	output: string;
	template: string;
	theme: string;
	fatalExitCode: boolean;
	pdf?: boolean;
};
