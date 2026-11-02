#!/usr/bin/env node
/**
 * Mifron 公式サイトの仕様由来の数値を MifronPlugin のリポジトリから同期します。
 *
 * 使い方:
 *   MIFRON_PLUGIN_DIR=../MifronPlugin node tools/sync-spec.mjs
 *   node tools/sync-spec.mjs --check   # 差分があれば exit 1（CI 用）
 *
 * 同期する値（すべて MifronPlugin 側のファイルから機械的に取り出せるものだけ）:
 *   - クエスト件数 : src/main/resources/quests.yml のクエストID数
 *   - レリック種数 : docs/SPECIFICATION.md の「7. レリック」表の行数
 *   - メニュー項目数: docs/SPECIFICATION.md の「（N項目」表記
 *   - プラグインのバージョンと最終コミット
 *
 * 書き換える先:
 *   - mifron/data/spec.json                （機械可読なサマリ）
 *   - mifron/index.html, minecraft.html    （<b data-spec="..."> の中身）
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

const positional = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
const pluginDir = path.resolve(siteRoot, process.env.MIFRON_PLUGIN_DIR ?? positional ?? '../MifronPlugin');

const PAGES = ['mifron/index.html', 'mifron/minecraft.html'];
const SPEC_JSON = 'mifron/data/spec.json';

function fail(message) {
  console.error(`sync-spec: ${message}`);
  process.exit(2);
}

async function readPluginFile(relative) {
  const file = path.join(pluginDir, relative);
  if (!existsSync(file)) fail(`MifronPlugin のファイルが見つかりません: ${file}`);
  return readFile(file, 'utf8');
}

function git(...args) {
  try {
    return execFileSync('git', ['-C', pluginDir, ...args], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function countQuests(yml) {
  const ids = yml.match(/^ {2}[A-Z][0-9A-Za-z_-]*:/gm) ?? [];
  if (ids.length === 0) fail('quests.yml からクエストIDを抽出できませんでした');
  return new Set(ids.map((line) => line.trim().replace(/:$/, ''))).size;
}

function countRelics(markdown) {
  const section = markdown.split(/^##\s+7\.\s*レリック\s*$/m)[1]?.split(/^##\s/m)[0];
  if (!section) fail('SPECIFICATION.md の「7. レリック」節が見つかりませんでした');
  const rows = section.split('\n').filter((line) => /^\|\s*[a-z][a-z0-9_]*\s*\|/.test(line));
  if (rows.length === 0) fail('レリック表の行を抽出できませんでした');
  return rows.length;
}

function countMenuItems(markdown) {
  const match = markdown.match(/扇状メニュー[：:][\s\S]{0,400}?（(\d+)項目/);
  if (!match) fail('SPECIFICATION.md からメニュー項目数を抽出できませんでした');
  return Number(match[1]);
}

function pluginVersion(pom) {
  const match = pom.match(/<version>([^<]+)<\/version>/);
  return match ? match[1] : '';
}

async function syncFile(relative, replacements) {
  const file = path.join(siteRoot, relative);
  const before = await readFile(file, 'utf8');
  let after = before;

  for (const [key, text] of Object.entries(replacements)) {
    const pattern = new RegExp(`(<b data-spec="${key}">)[^<]*(</b>)`);
    if (!pattern.test(after)) {
      fail(`${relative} に data-spec="${key}" の <b> が見つかりません。マークアップを確認してください。`);
    }
    after = after.replace(pattern, `$1${text}$2`);
  }

  return { file, before, after };
}

const quests = countQuests(await readPluginFile('src/main/resources/quests.yml'));
const specification = await readPluginFile('docs/SPECIFICATION.md');
const relics = countRelics(specification);
const menuItems = countMenuItems(specification);
const version = pluginVersion(await readPluginFile('pom.xml'));

const spec = {
  source: 'tatudrag0n/MifronPlugin',
  commit: git('rev-parse', '--short', 'HEAD'),
  committedAt: git('log', '-1', '--format=%cs'),
  pluginVersion: version,
  menuItems,
  quests,
  relics,
};

const replacements = {
  'menu-items': `${menuItems}項目`,
  quests: `${quests}件`,
  relics: `${relics}種`,
};

const results = [];
for (const page of PAGES) results.push(await syncFile(page, replacements));

const specPath = path.join(siteRoot, SPEC_JSON);
const specText = `${JSON.stringify(spec, null, 2)}\n`;
const previousSpec = existsSync(specPath) ? await readFile(specPath, 'utf8') : '';

const changedPages = results.filter((r) => r.before !== r.after);
const specChanged = previousSpec !== specText;

console.log(`plugin: ${spec.source}@${spec.commit || 'unknown'} (${spec.committedAt || 'unknown'}) v${spec.pluginVersion || '?'}`);
console.log(`values: menu=${menuItems} quests=${quests} relics=${relics}`);

if (checkOnly) {
  const stale = [...changedPages.map((r) => path.relative(siteRoot, r.file)), ...(specChanged ? [SPEC_JSON] : [])];
  if (stale.length > 0) {
    console.error(`同期が必要です: ${stale.join(', ')}`);
    process.exit(1);
  }
  console.log('同期済みです。');
  process.exit(0);
}

await mkdir(path.dirname(specPath), { recursive: true });
if (specChanged) await writeFile(specPath, specText, 'utf8');
for (const result of changedPages) await writeFile(result.file, result.after, 'utf8');

const written = [...(specChanged ? [SPEC_JSON] : []), ...changedPages.map((r) => path.relative(siteRoot, r.file))];
console.log(written.length > 0 ? `updated: ${written.join(', ')}` : 'no changes');
