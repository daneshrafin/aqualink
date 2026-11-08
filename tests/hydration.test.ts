import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Browsers and the prerendering server can have different default locales and
// time zones. Compare real initial page markup without browser-only effects.
const renderPages = `
  const React = require('react');
  global.React = React;
  const {renderToStaticMarkup} = require('react-dom/server');
  const {createHash} = require('node:crypto');
  const {PreferencesProvider} = require('./lib/preferences.tsx');
  const {DemoProvider} = require('./lib/store.tsx');
  const output = {};
  for (const route of ['', 'operations/', 'dashboard/']) {
    const Page = require('./app/' + route + 'page.tsx').default;
    const html = renderToStaticMarkup(React.createElement(PreferencesProvider, null,
      React.createElement(DemoProvider, null, React.createElement(Page))));
    output['/' + route] = createHash('sha256').update(html).digest('hex');
  }
  process.stdout.write(JSON.stringify(output));
`;

test('initial Home, Response desk and Planner markup is stable across locale and time zone', () => {
  const render = (locale: string, timeZone: string) => JSON.parse(execFileSync(
    process.execPath, ['--import', 'tsx', '-e', renderPages], {
      cwd: fileURLToPath(new URL('../', import.meta.url)),
      env: {...process.env, LANG: locale, LC_ALL: locale, TZ: timeZone},
      encoding: 'utf8',
      timeout: 30000,
    },
  ));
  assert.deepEqual(render('bn_BD.UTF-8', 'America/Los_Angeles'), render('en_US.UTF-8', 'UTC'));
});

test('dashboard?demo=1 keeps the same first render on server, desktop and mobile', () => {
  const script = `
    const React = require('react'); global.React = React;
    const {renderToStaticMarkup} = require('react-dom/server');
    const {PreferencesProvider} = require('./lib/preferences.tsx');
    const Page = require('./app/dashboard/page.tsx').default;
    const render = () => renderToStaticMarkup(React.createElement(PreferencesProvider, null, React.createElement(Page)));
    const server = render();
    const results = [];
    for (const width of [1440, 390]) {
      global.window = {location:{search:'?demo=1'},innerWidth:width};
      results.push({width, matches:render() === server});
    }
    delete global.window;
    process.stdout.write(JSON.stringify(results));
  `;
  const result = JSON.parse(execFileSync(process.execPath, ['--import','tsx','-e',script], {
    cwd:fileURLToPath(new URL('../',import.meta.url)), encoding:'utf8', timeout:30000,
  }));
  assert.deepEqual(result, [{width:1440,matches:true},{width:390,matches:true}]);
});

test('responder workspace renders usable sample tasks without a configured database', () => {
  const script = `
    delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const React=require('react'); global.React=React;
    const {renderToStaticMarkup}=require('react-dom/server');
    const {PreferencesProvider}=require('./lib/preferences.tsx');
    const {DemoProvider}=require('./lib/store.tsx');
    const Page=require('./app/ngo/tasks/page.tsx').default;
    process.stdout.write(renderToStaticMarkup(React.createElement(PreferencesProvider,null,
      React.createElement(DemoProvider,null,React.createElement(Page)))));
  `;
  const html=execFileSync(process.execPath,['--import','tsx','-e',script],{
    cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8',timeout:30000,
  });
  assert.ok((html.match(/class="response-task-card"/g)||[]).length>=5);
  for(const label of ['Save progress','Estimated cost','Field team','Water quality concern','Sanitation / hygiene problem','Other issue'])assert.ok(html.includes(label),label);
  assert.ok(!html.includes('Supabase setup required'));
});
