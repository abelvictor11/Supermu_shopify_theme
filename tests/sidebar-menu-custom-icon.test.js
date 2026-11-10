const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const schema = JSON.parse(fs.readFileSync(path.join(root, 'config/settings_schema.json'), 'utf8'));
const iconSnippet = fs.readFileSync(path.join(root, 'snippets/sidebar-menu-icon.liquid'), 'utf8');
const menuSnippet = fs.readFileSync(path.join(root, 'snippets/sidebar-menu.liquid'), 'utf8');

test('theme editor exposes the custom sidebar icon settings', () => {
  const group = schema.find((entry) => entry.name === 'Menú Lateral (Sidebar)');
  assert.ok(group, 'sidebar settings group should exist');

  const byId = Object.fromEntries(group.settings.filter((setting) => setting.id).map((setting) => [setting.id, setting]));
  assert.equal(byId.sidebar_menu_custom_icon_enabled?.type, 'checkbox');
  assert.equal(byId.sidebar_menu_custom_icon_enabled?.default, true);
  assert.equal(byId.sidebar_menu_custom_icon_handle?.type, 'text');
  assert.equal(byId.sidebar_menu_custom_icon_handle?.default, 'navidad');
  assert.equal(byId.sidebar_menu_custom_icon_image?.type, 'image_picker');
});

test('custom icon is selected by normalized handle and keeps the SVG fallback', () => {
  assert.match(iconSnippet, /sidebar_menu_custom_icon_enabled/);
  assert.match(iconSnippet, /sidebar_menu_custom_icon_image\s*!=\s*blank/);
  assert.match(iconSnippet, /sidebar_menu_custom_icon_handle\s*\|\s*handleize/);
  assert.match(iconSnippet, /link\.handle\s*\|\s*handleize/);
  assert.match(iconSnippet, /sidebar-menu__custom-icon/);
  assert.match(iconSnippet, /aria-hidden=["']true["']/);
  assert.match(iconSnippet, /sidebar_menu_custom_icon_image\.src\s*\|\s*escape/);
  assert.doesNotMatch(iconSnippet, /sidebar_menu_custom_icon_image[\s\S]*?image_url:/);
  assert.match(iconSnippet, /case icon/);
  assert.match(iconSnippet, /Default: shopping bag/);
});

test('custom icon is constrained to the existing sidebar icon box', () => {
  assert.match(menuSnippet, /\.sidebar-menu__custom-icon\s*\{/);
  assert.match(menuSnippet, /width:\s*24px/);
  assert.match(menuSnippet, /height:\s*24px/);
  assert.match(menuSnippet, /object-fit:\s*contain/);
});
