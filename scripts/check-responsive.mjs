import { readFileSync } from "node:fs";

const cssPath = process.argv[2] ?? new URL("../dist/main.css", import.meta.url);
const css = readFileSync(cssPath, "utf8");

function mediaBodies(condition) {
	const marker = `@media ${condition}{`;
	const bodies = [];
	let cursor = 0;

	while ((cursor = css.indexOf(marker, cursor)) !== -1) {
		const start = cursor + marker.length;
		let depth = 1;
		let end = start;

		for (; end < css.length && depth > 0; end += 1) {
			if (css[end] === "{") depth += 1;
			if (css[end] === "}") depth -= 1;
		}

		bodies.push(css.slice(start, end - 1));
		cursor = end;
	}

	return bodies;
}

function declarations(body, selector) {
	const start = body.indexOf(`${selector}{`);
	if (start === -1) return new Map();

	const raw = body.slice(start + selector.length + 1, body.indexOf("}", start));
	return new Map(
		raw
			.split(";")
			.filter(Boolean)
			.map((declaration) => {
				const separator = declaration.indexOf(":");
				return [
					declaration.slice(0, separator),
					declaration.slice(separator + 1),
				];
			}),
	);
}

function requireDeclaration(body, selector, property, expected) {
	const actual = declarations(body, selector).get(property);
	if (actual !== expected) {
		throw new Error(
			`${selector} must set ${property}:${expected}; received ${actual ?? "<missing>"}`,
		);
	}
}

const tabletBody = mediaBodies("(max-width:75em)").find((body) =>
	body.includes(".layout-mobile #itemDetailPage .infoWrapper{"),
);

if (!tabletBody) throw new Error("Missing the tablet detail-page media block");

requireDeclaration(
	tabletBody,
	".layout-mobile #itemDetailPage .detailRibbon",
	"flex-direction",
	"column",
);
requireDeclaration(
	tabletBody,
	".layout-mobile #itemDetailPage .infoWrapper",
	"flex-basis",
	"auto",
);

const episodeTabletBody = mediaBodies(
	"(min-width:40.01em) and (max-width:75em)",
)[0];

if (!episodeTabletBody) {
	throw new Error("Missing the iPad-class episode detail-page media block");
}

requireDeclaration(
	episodeTabletBody,
	":is(.layout-desktop,.layout-tv) #itemDetailPage .detailPagePrimaryContainer",
	"grid-template-areas",
	'"poster info" "poster content" "buttons buttons"',
);
requireDeclaration(
	episodeTabletBody,
	":is(.layout-desktop,.layout-tv) #itemDetailPage .detailPagePrimaryContainer>.detailPagePrimaryContent .detailSection",
	"grid-template-columns",
	"minmax(0,1fr) minmax(15rem,40%)",
);
requireDeclaration(
	episodeTabletBody,
	".layout-mobile #itemDetailPage .detailPagePrimaryContainer",
	"grid-template-areas",
	'"poster name" "poster info" "poster content" "buttons buttons"',
);
requireDeclaration(
	episodeTabletBody,
	".layout-mobile #itemDetailPage .detailPagePrimaryContainer>.detailRibbon,.layout-mobile #itemDetailPage .detailPagePrimaryContainer>.detailRibbon>.infoWrapper",
	"display",
	"contents",
);
requireDeclaration(
	episodeTabletBody,
	".layout-mobile #itemDetailPage .detailPagePrimaryContainer>.detailPagePrimaryContent",
	"grid-area",
	"content",
);

const episodeSelector =
	'.layout-mobile #itemDetailPage:has(.parentName a[data-type=Series]):not(:has(.listItem))';

requireDeclaration(
	episodeTabletBody,
	`${episodeSelector} .detailRibbon`,
	"--card-width",
	"clamp(12rem,36vw,22rem)",
);
requireDeclaration(
	episodeTabletBody,
	`${episodeSelector} .detailRibbon .detailImageContainer .card`,
	"min-width",
	"0!important",
);

console.log("Responsive detail-page CSS contract passed");
