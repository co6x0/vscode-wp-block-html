import { readFile, writeFile } from "node:fs/promises";

const CORE_BLOCKS_URL =
  "https://developer.wordpress.org/block-editor/reference-guides/core-blocks/";
const SNIPPETS_PATH = new URL("../../snippets.json", import.meta.url);
const LEGACY_ALIASES_BY_BLOCK_NAME = {
  categories: ["categories-list"],
  "post-comment": ["post-comment-deprecated"],
};

const decodeHtml = (value) => {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#039;", "'")
    .replaceAll("&#8217;", "'")
    .replaceAll("&#8216;", "'")
    .replaceAll("&#8220;", "\"")
    .replaceAll("&#8221;", "\"")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
};

const toText = (html) => {
  return decodeHtml(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
};

const getHeadingText = (headingHtml) => {
  return toText(headingHtml);
};

const getHeadingId = (headingHtml) => {
  return headingHtml.match(/\bid=["']([^"']+)["']/i)?.[1];
};

const getDescription = (sectionHtml) => {
  const paragraph = sectionHtml.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "";
  return toText(paragraph).replace(/\s*\(\s*Source\s*\)\s*$/i, "").trim();
};

const getCoreBlockName = (sectionHtml) => {
  const match = sectionHtml.match(
    /<li\b[^>]*>\s*(?:<strong\b[^>]*>\s*)?Name:\s*(?:<\/strong>\s*)?(?:<code\b[^>]*>\s*)?core\/([^<\s]+)(?:\s*<\/code>)?/i
  );
  return match?.[1];
};

const getExistingSnippetsByPrefix = async () => {
  const snippets = JSON.parse(await readFile(SNIPPETS_PATH, "utf8"));
  return Object.fromEntries(
    Object.values(snippets).flatMap((snippet) => {
      const prefixes = Array.isArray(snippet.prefix)
        ? snippet.prefix
        : [snippet.prefix];
      return prefixes.filter(Boolean).map((prefix) => [prefix, snippet]);
    })
  );
};

const isDefaultSelfClosingBody = (prefix, body) => {
  return (
    Array.isArray(body) &&
    body.length === 1 &&
    body[0] === `<!-- ${prefix} $1/-->`
  );
};

const buildSnippet = (block, existingSnippetsByPrefix, actualPrefixes) => {
  const prefix = `wp:${block.name}`;
  const aliases = [
    ...(block.id !== block.name ? [`wp:${block.id}`] : []),
    ...(LEGACY_ALIASES_BY_BLOCK_NAME[block.name] ?? []).map(
      (alias) => `wp:${alias}`
    ),
  ];
  const prefixes = [
    prefix,
    ...aliases.filter((alias) => !actualPrefixes.has(alias)),
  ];
  const existingSnippet = prefixes
    .map((candidate) => existingSnippetsByPrefix[candidate])
    .find(Boolean);
  const existingBody = existingSnippet?.body;
  const body =
    existingBody && !isDefaultSelfClosingBody(prefix, existingBody)
      ? existingBody
      : [`<!-- ${prefix} $1/-->`];

  return {
    prefix: prefixes,
    body,
    description: `${block.description} ${CORE_BLOCKS_URL}#${block.id}`.trim(),
  };
};

const fetchCoreBlocks = async () => {
  const response = await fetch(CORE_BLOCKS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${CORE_BLOCKS_URL}: ${response.status}`);
  }

  const html = await response.text();
  const sections = [...html.matchAll(/(<h2\b[\s\S]*?<\/h2>)([\s\S]*?)(?=<h2\b|<\/main>)/gi)];

  return sections
    .map(([, headingHtml, sectionHtml]) => {
      const id = getHeadingId(headingHtml);
      const title = getHeadingText(headingHtml);
      const name = getCoreBlockName(sectionHtml);
      const description = getDescription(sectionHtml);

      if (!id || !title || !name || !description) {
        return undefined;
      }

      return { id, title, name, description };
    })
    .filter(Boolean);
};

const main = async () => {
  const existingSnippetsByPrefix = await getExistingSnippetsByPrefix();
  const blocks = await fetchCoreBlocks();
  const actualPrefixes = new Set(blocks.map((block) => `wp:${block.name}`));
  const snippets = Object.fromEntries(
    blocks.map((block) => [
      block.title,
      buildSnippet(block, existingSnippetsByPrefix, actualPrefixes),
    ])
  );

  await writeFile(SNIPPETS_PATH, `${JSON.stringify(snippets, null, 2)}\n`);
  console.log(`Generated ${blocks.length} snippets from ${CORE_BLOCKS_URL}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
