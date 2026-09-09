/**
 * Coverage Check — verificación de cobertura por punto-en-polígono.
 *
 * Trabaja sobre un GeoJSON FeatureCollection (window.SUPERMU_COVERAGE) cuyas
 * features son las zonas de cobertura (Polygon/MultiPolygon), en [lng, lat].
 *
 * Lógica pura (sin DOM/red), testeable con node:test.
 * UMD: CommonJS (tests) y window.CoverageCheck (tema).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CoverageCheck = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Ray-casting. `ring` = array de [lng, lat]. Los bordes horizontales no
  // causan división por cero porque el guardia (yi>lat)!==(yj>lat) los excluye.
  function pointInRing(lng, lat, ring) {
    var inside = false;
    var n = ring ? ring.length : 0;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var xi = ring[i][0], yi = ring[i][1];
      var xj = ring[j][0], yj = ring[j][1];
      if (((yi > lat) !== (yj > lat)) &&
          (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  function pointInFeature(lng, lat, feature) {
    var g = feature && feature.geometry;
    if (!g) return false;
    if (g.type === 'Polygon') {
      return pointInRing(lng, lat, g.coordinates[0]);
    }
    if (g.type === 'MultiPolygon') {
      for (var i = 0; i < g.coordinates.length; i++) {
        if (pointInRing(lng, lat, g.coordinates[i][0])) return true;
      }
      return false;
    }
    return false;
  }

  // Devuelve el nombre de la zona que contiene el punto, o null si ninguna.
  function findZone(lng, lat, fc) {
    if (!fc || !fc.features) return null;
    for (var i = 0; i < fc.features.length; i++) {
      if (pointInFeature(lng, lat, fc.features[i])) {
        return (fc.features[i].properties && fc.features[i].properties.zone) || '';
      }
    }
    return null;
  }

  function isCovered(lng, lat, fc) {
    return findZone(lng, lat, fc) !== null;
  }

  return {
    pointInRing: pointInRing,
    pointInFeature: pointInFeature,
    findZone: findZone,
    isCovered: isCovered
  };
});
