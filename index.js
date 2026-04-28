import { stemmer as porterStemmer } from "https://cdn.jsdelivr.net/npm/stemmer@2.0.1/index.min.js";

const { Fuse } = globalThis;

function normalizeText(input) {
	return String(input || "")
		.toLowerCase()
		.replace(/&nbsp;|nbsp;/g, " ")
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter(Boolean)
		.map((token) => porterStemmer(token))
		.join(" ");
}

function collectDataValues(element) {
	return Object.values(element.dataset || {})
		.map((v) => String(v || "").trim())
		.filter(Boolean);
}

function main() {
	const input = document.getElementById("searchInput");
	const list = document.getElementById("jobList");
	const meta = document.getElementById("resultMeta");

	if (!input || !list || !meta || typeof Fuse === "undefined") {
		return;
	}

	const rows = Array.from(list.querySelectorAll(".job-listing"));
	const documents = rows.map((element, idx) => {
		const raw = collectDataValues(element).join(" ");
		return {
			id: idx,
			element,
			raw,
			normalized: normalizeText(raw)
		};
	});

	const fuse = new Fuse(documents, {
		keys: ["normalized"],
		includeScore: true,
		threshold: 0.38,
		ignoreLocation: true,
		minMatchCharLength: 2
	});

	const total = documents.length;

	const render = (visibleIds) => {
		rows.forEach((el, idx) => {
			const hidden = !visibleIds.has(idx);
			el.classList.toggle("hidden", hidden);
		});
		meta.textContent = `Showing ${visibleIds.size} / ${total} items`;
	};

	const search = () => {
		const query = input.value.trim();
		if (!query) {
			render(new Set(documents.map((d) => d.id)));
			return;
		}

		const normalizedQuery = normalizeText(query);
		const resultIds = new Set(fuse.search(normalizedQuery).map((r) => r.item.id));
		render(resultIds);
	};

	input.addEventListener("input", search);
	render(new Set(documents.map((d) => d.id)));
}

document.addEventListener("DOMContentLoaded", main);
