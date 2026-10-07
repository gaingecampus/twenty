// Render model output as text, never as HTML. Preserve unstructured responses.
export const parseFieldSummarySections = (text: string) => {
  const sections: { title: string; body: string }[] = [];
  let title = '';
  let lines: string[] = [];
  const flush = () => {
    const body = lines.join('\n').trim();
    if (body) sections.push({ title, body });
    lines = [];
  };
  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(진행 내용|주요 결정|다음 과제)\s*$/);
    if (heading) {
      flush();
      title = heading[1];
    } else {
      lines.push(line);
    }
  }
  flush();
  return sections;
};
