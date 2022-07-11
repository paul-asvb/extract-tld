const fs = require('fs');
const f = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const LIST_URL = 'https://publicsuffix.org/list/public_suffix_list.dat';

async function getData() {
  const response = await f(LIST_URL);
  const data = await response.text();

  return data;
}

async function run() {
  const data = await getData();

  const sections = new RegExp(
    '^//\\s*===BEGIN (ICANN|PRIVATE) DOMAINS===\\s*$',
  );
  const comment = new RegExp('^//.*?');
  const splitter = new RegExp('(\\!|\\*\\.)?(.+)');

  let section;
  const tlds = {};

  const lines = data.split(new RegExp('[\r\n]+'));

  for (let line of lines) {
    line = line.trim();

    if (sections.test(line)) {
      section = sections.exec(line)[1].toLowerCase();
      // Adds the sections "icann" and "private" to the map.
      tlds[section] = {};
      continue;
    }

    if (comment.test(line)) {
      continue;
    }

    if (!splitter.test(line)) {
      continue;
    }
    if (!section) {
      continue;
    }

    line = splitter.exec(line);

    const tld = line[2];
    let level = tld.split('.').length;
    const modifier = line[1];

    if (modifier == '*.') {
      level++;
    }

    if (modifier === '!') {
      level--;
    }

    tlds[section][tld] = level;
  }

  fs.writeFileSync('./tlds.json', JSON.stringify(tlds, null, 2));
}

run();
