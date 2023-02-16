// https://developer.wordpress.org/block-editor/reference-guides/core-blocks/
const elements = document.getElementsByClassName("toc-header");
const arrayElements = Object.values(elements);
const snippets = arrayElements.map((element) => {
  const headingElement = element.lastChild as HTMLHeadingElement;
  const paragraphElement = element.nextElementSibling as HTMLParagraphElement;
  if (!headingElement || !paragraphElement) {
    return {};
  }
  return {
    [headingElement.textContent ?? "_"]: {
      prefix: [`wp:${headingElement.id}`],
      body: [`<!-- wp:${headingElement.id} $1/-->`],
      description: `${paragraphElement.innerText.replace(
        " (Source)",
        ""
      )} https://developer.wordpress.org/block-editor/reference-guides/core-blocks/#${
        headingElement.id
      }`,
    },
  };
});

const target = {};
for (const snippet of snippets) {
  Object.assign(target, snippet);
}

const snippetsJson = JSON.stringify(target);
console.log(snippetsJson);
