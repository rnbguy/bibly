#!/usr/bin/env node
"use strict";

const meow = require('meow');
const split = require('split');
const fs = require('fs-extra');
const getStdin = require('get-stdin');
const bibly = require('../lib/index');

let cli = meow(`
  Usage
    $ bibly < keys

  Options
    --help            Show this message
    --latex FILE      Fetch missing references from LaTeX FILE
    --bibtex FILE     Generate entries into BibTeX FILE
    --sort            Sort entries by key

  Examples
    $ echo "DBLP:conf/popl/CousotC77" | bibly
    $ bibly --latex main.tex
`, {
  default: {
  }
});

(async () => {
  let entries;

  if (cli.flags.bibtex)
    fs.removeSync(cli.flags.bibtex);

  if (cli.flags.latex)
    entries = await bibly.missing(cli.flags.latex);

  else if (!process.stdin.isTTY)
    entries = (await getStdin()).split("\n").filter(x => x);

  else
    cli.showHelp();

  if (cli.flags.sort)
    entries = entries.sort();

  let records = [];
  records.push(`% generated by ${cli.pkg.name} version ${cli.pkg.version}`);
  records.push(``);

  for (let obj of await Promise.all(entries.map(bibly.fetch))) {
    if (obj.record) {
      records.push(obj.record);
    } else {
      records.push(`% unable to fetch entry: ${obj.key}`);
      if (obj.error)
        records.push(`% ${obj.error}`);
    }
  }

  if (cli.flags.bibtex)
    fs.writeFileSync(cli.flags.bibtex, records.join('\n'));

  else
    for (let record of records)
      console.log(record);
})();
