const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../assets/coverage-check.js');

// Cargar el GeoJSON real desde el asset coverage-zones.js
const assetSrc = fs.readFileSync(path.join(__dirname, '../assets/coverage-zones.js'), 'utf8');
const json = assetSrc.slice(assetSrc.indexOf('{'), assetSrc.lastIndexOf('}') + 1);
const FC = JSON.parse(json);

// Puntos interiores conocidos (verificados con implementación de referencia).
const insidePoints = {
  'Cobertura nor oriente': [-75.55374, 6.25934],
  'NORTE': [-75.578107, 6.292509],
  'Cobertura Sur Occidente': [-75.601206, 6.195821],
  'Cobertura Sur': [-75.621759, 6.161396],
  'Cobertura Sur Oriente': [-75.56761, 6.200954],
  'Cobertura Nor Occidente': [-75.601031, 6.235502],
  'Cobertura San Cristobal': [-75.634485, 6.280684]
};

test('el asset carga como FeatureCollection con 7 zonas', () => {
  assert.equal(FC.type, 'FeatureCollection');
  assert.equal(FC.features.length, 7);
});

test('cada punto interior conocido cae en su zona', () => {
  for (const [zone, pt] of Object.entries(insidePoints)) {
    assert.equal(C.findZone(pt[0], pt[1], FC), zone, `punto de ${zone}`);
    assert.equal(C.isCovered(pt[0], pt[1], FC), true);
  }
});

test('un punto lejano (Bogotá) está fuera de cobertura', () => {
  assert.equal(C.findZone(-74.07, 4.6, FC), null);
  assert.equal(C.isCovered(-74.07, 4.6, FC), false);
});

test('un punto en el mar (0,0) está fuera de cobertura', () => {
  assert.equal(C.isCovered(0, 0, FC), false);
});

test('pointInRing con un cuadrado simple', () => {
  const sq = [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]];
  assert.equal(C.pointInRing(5, 5, sq), true);
  assert.equal(C.pointInRing(15, 5, sq), false);
  assert.equal(C.pointInRing(5, 15, sq), false);
});
