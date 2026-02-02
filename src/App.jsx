import React, { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { io } from 'socket.io-client'
import './App.css'

// Socket configuration
const SERVER_URL = 'http://98.70.26.155:3000'
const SOCKET_URL = `${SERVER_URL}/admin`

// Map style configuration for light theme
const lightStyle = {
  version: 8,
  name: 'Yatra Suraksha Light',
  sources: {
    'osm-tiles': {
      type: 'vector',
      tiles: ['http://135.235.138.50/planettiles/{z}/{x}/{y}.mvt'],
      maxzoom: 14
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#f8f9fa' }
    },
    {
      id: 'water-base',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'water',
      paint: { 
        'fill-color': '#7eb8da',
        'fill-opacity': 1
      }
    },
    {
      id: 'water-wave-1',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'water',
      paint: { 
        'fill-color': '#a3d4f5',
        'fill-opacity': 0.4
      }
    },
    {
      id: 'water-wave-2',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'water',
      paint: { 
        'fill-color': '#c5e8ff',
        'fill-opacity': 0.3
      }
    },
    {
      id: 'water-highlight',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'water',
      paint: { 
        'fill-color': '#ffffff',
        'fill-opacity': 0.1
      }
    },
    {
      id: 'landcover-grass',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'landcover',
      filter: ['==', 'class', 'grass'],
      paint: { 'fill-color': '#d8e8c8' }
    },
    {
      id: 'landcover-wood',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'landcover',
      filter: ['==', 'class', 'wood'],
      paint: { 'fill-color': '#a8d08d' }
    },
    {
      id: 'landuse-residential',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'residential'],
      paint: { 'fill-color': '#f0e6d2' }
    },
    {
      id: 'landuse-commercial',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'commercial'],
      paint: { 'fill-color': '#f5d6d6' }
    },
    {
      id: 'landuse-industrial',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'industrial'],
      paint: { 'fill-color': '#e0d4e8' }
    },
    {
      id: 'park',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'park',
      paint: { 'fill-color': '#c8e6c9' }
    },
    {
      id: 'building',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'building',
      paint: { 'fill-color': '#d9d0c9', 'fill-opacity': 0.8 }
    },
    {
      id: 'building-3d',
      type: 'fill-extrusion',
      source: 'osm-tiles',
      'source-layer': 'building',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': '#d9d0c9',
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.8
      }
    },
    {
      id: 'road-minor',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'minor', 'service', 'track']],
      paint: { 'line-color': '#ffffff', 'line-width': 1 }
    },
    {
      id: 'road-secondary',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'secondary', 'tertiary']],
      paint: { 'line-color': '#ffd700', 'line-width': 1.5 }
    },
    {
      id: 'road-primary',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'primary']],
      paint: { 'line-color': '#ffa500', 'line-width': 2 }
    },
    {
      id: 'road-trunk',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'trunk']],
      paint: { 'line-color': '#ff6347', 'line-width': 2.5 }
    },
    {
      id: 'road-motorway',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'motorway']],
      paint: { 'line-color': '#e74c3c', 'line-width': 3 }
    },
    {
      id: 'railway',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'rail'],
      paint: { 'line-color': '#777', 'line-width': 2, 'line-dasharray': [3, 3] }
    },
    {
      id: 'boundary-country',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'boundary',
      filter: ['==', 'admin_level', 2],
      paint: { 'line-color': '#9e9e9e', 'line-width': 2, 'line-dasharray': [5, 3] }
    },
    {
      id: 'boundary-state',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'boundary',
      filter: ['==', 'admin_level', 4],
      paint: { 'line-color': '#bdbdbd', 'line-width': 1.5, 'line-dasharray': [4, 2] }
    },
    {
      id: 'place-label-city',
      type: 'symbol',
      source: 'osm-tiles',
      'source-layer': 'place',
      filter: ['==', 'class', 'city'],
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 16,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
      },
      paint: { 'text-color': '#333', 'text-halo-color': '#fff', 'text-halo-width': 2 }
    },
    {
      id: 'place-label-town',
      type: 'symbol',
      source: 'osm-tiles',
      'source-layer': 'place',
      filter: ['==', 'class', 'town'],
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 13,
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
      },
      paint: { 'text-color': '#555', 'text-halo-color': '#fff', 'text-halo-width': 1.5 }
    },
    {
      id: 'place-label-village',
      type: 'symbol',
      source: 'osm-tiles',
      'source-layer': 'place',
      filter: ['==', 'class', 'village'],
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
      },
      paint: { 'text-color': '#666', 'text-halo-color': '#fff', 'text-halo-width': 1 }
    },
    {
      id: 'road-label',
      type: 'symbol',
      source: 'osm-tiles',
      'source-layer': 'transportation_name',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 10,
        'symbol-placement': 'line',
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
      },
      paint: { 'text-color': '#333', 'text-halo-color': '#fff', 'text-halo-width': 1 }
    },
    {
      id: 'poi-label',
      type: 'symbol',
      source: 'osm-tiles',
      'source-layer': 'poi',
      minzoom: 14,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 10,
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-offset': [0, 1]
      },
      paint: { 'text-color': '#666', 'text-halo-color': '#fff', 'text-halo-width': 1 }
    }
  ]
}

// Map style configuration for dark theme
// eslint-disable-next-line no-unused-vars
const darkStyle = {
  version: 8,
  name: 'Yatra Suraksha Dark',
  sources: {
    'osm-tiles': {
      type: 'vector',
      tiles: ['http://135.235.138.50/planettiles/{z}/{x}/{y}.mvt'],
      maxzoom: 14
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#1a1a2e' }
    },
    {
      id: 'water',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'water',
      paint: { 'fill-color': '#1e3a5f' }
    },
    {
      id: 'landcover-grass',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'landcover',
      filter: ['==', 'class', 'grass'],
      paint: { 'fill-color': '#1e3d1e' }
    },
    {
      id: 'landcover-wood',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'landcover',
      filter: ['==', 'class', 'wood'],
      paint: { 'fill-color': '#1a4d1a' }
    },
    {
      id: 'landuse-residential',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'residential'],
      paint: { 'fill-color': '#252538' }
    },
    {
      id: 'landuse-commercial',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'commercial'],
      paint: { 'fill-color': '#2d2538' }
    },
    {
      id: 'landuse-industrial',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'industrial'],
      paint: { 'fill-color': '#2a2a3d' }
    },
    {
      id: 'park',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'park',
      paint: { 'fill-color': '#1e3d2e' }
    },
    {
      id: 'building',
      type: 'fill',
      source: 'osm-tiles',
      'source-layer': 'building',
      paint: { 'fill-color': '#2a2a3e', 'fill-opacity': 0.9 }
    },
    {
      id: 'building-3d',
      type: 'fill-extrusion',
      source: 'osm-tiles',
      'source-layer': 'building',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': '#3a3a5e',
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.9
      }
    },
    {
      id: 'road-minor',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'minor', 'service', 'track']],
      paint: { 'line-color': '#3d3d5c', 'line-width': 1 }
    },
    {
      id: 'road-secondary',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'secondary', 'tertiary']],
      paint: { 'line-color': '#5c5c7a', 'line-width': 1.5 }
    },
    {
      id: 'road-primary',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'primary']],
      paint: { 'line-color': '#7a7a9c', 'line-width': 2 }
    },
    {
      id: 'road-trunk',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'trunk']],
      paint: { 'line-color': '#ff7f50', 'line-width': 2.5 }
    },
    {
      id: 'road-motorway',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'motorway']],
      paint: { 'line-color': '#ff6b6b', 'line-width': 3 }
    },
    {
      id: 'railway',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'rail'],
      paint: { 'line-color': '#555', 'line-width': 2, 'line-dasharray': [3, 3] }
    },
    {
      id: 'boundary-country',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'boundary',
      filter: ['==', 'admin_level', 2],
      paint: { 'line-color': '#6a6a8a', 'line-width': 2, 'line-dasharray': [5, 3] }
    },
    {
      id: 'boundary-state',
      type: 'line',
      source: 'osm-tiles',
      'source-layer': 'boundary',
      filter: ['==', 'admin_level', 4],
      paint: { 'line-color': '#5a5a7a', 'line-width': 1.5, 'line-dasharray': [4, 2] }
    },
    {
      id: 'place-label-city',
      type: 'symbol',
      source: 'osm-tiles',
      'source-layer': 'place',
      filter: ['==', 'class', 'city'],
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 16,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
      },
      paint: { 'text-color': '#e0e0e0', 'text-halo-color': '#1a1a2e', 'text-halo-width': 2 }
    },
    {
      id: 'place-label-town',
      type: 'symbol',
      source: 'osm-tiles',
      'source-layer': 'place',
      filter: ['==', 'class', 'town'],
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 13,
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
      },
      paint: { 'text-color': '#b0b0b0', 'text-halo-color': '#1a1a2e', 'text-halo-width': 1.5 }
    },
    {
      id: 'place-label-village',
      type: 'symbol',
      source: 'osm-tiles',
      'source-layer': 'place',
      filter: ['==', 'class', 'village'],
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
      },
      paint: { 'text-color': '#909090', 'text-halo-color': '#1a1a2e', 'text-halo-width': 1 }
    },
    {
      id: 'road-label',
      type: 'symbol',
      source: 'osm-tiles',
      'source-layer': 'transportation_name',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 10,
        'symbol-placement': 'line',
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
      },
      paint: { 'text-color': '#a0a0a0', 'text-halo-color': '#1a1a2e', 'text-halo-width': 1 }
    },
    {
      id: 'poi-label',
      type: 'symbol',
      source: 'osm-tiles',
      'source-layer': 'poi',
      minzoom: 14,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 10,
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-offset': [0, 1]
      },
      paint: { 'text-color': '#808080', 'text-halo-color': '#1a1a2e', 'text-halo-width': 1 }
    }
  ]
}

// Additional Map Themes
const satelliteStyle = {
  version: 8,
  name: 'Satellite View',
  sources: {
    'osm-tiles': {
      type: 'vector',
      tiles: ['http://135.235.138.50/planettiles/{z}/{x}/{y}.mvt'],
      maxzoom: 14
    }
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#0f1419' } },
    { id: 'water', type: 'fill', source: 'osm-tiles', 'source-layer': 'water', paint: { 'fill-color': '#1a3a5c' } },
    { id: 'landcover-grass', type: 'fill', source: 'osm-tiles', 'source-layer': 'landcover', filter: ['==', 'class', 'grass'], paint: { 'fill-color': '#2d4a2d' } },
    { id: 'landcover-wood', type: 'fill', source: 'osm-tiles', 'source-layer': 'landcover', filter: ['==', 'class', 'wood'], paint: { 'fill-color': '#1e3d1e' } },
    { id: 'landuse-residential', type: 'fill', source: 'osm-tiles', 'source-layer': 'landuse', filter: ['==', 'class', 'residential'], paint: { 'fill-color': '#2a2a35' } },
    { id: 'park', type: 'fill', source: 'osm-tiles', 'source-layer': 'park', paint: { 'fill-color': '#1e3d2e' } },
    { id: 'building', type: 'fill', source: 'osm-tiles', 'source-layer': 'building', paint: { 'fill-color': '#3a3a4a', 'fill-opacity': 0.9 } },
    { id: 'building-3d', type: 'fill-extrusion', source: 'osm-tiles', 'source-layer': 'building', minzoom: 14, paint: { 'fill-extrusion-color': '#4a4a5a', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 0.9 } },
    { id: 'road-minor', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'minor', 'service', 'track']], paint: { 'line-color': '#4a4a5a', 'line-width': 1 } },
    { id: 'road-secondary', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'secondary', 'tertiary']], paint: { 'line-color': '#6a6a7a', 'line-width': 1.5 } },
    { id: 'road-primary', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'primary']], paint: { 'line-color': '#8a8a9a', 'line-width': 2 } },
    { id: 'road-motorway', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'motorway']], paint: { 'line-color': '#ffa500', 'line-width': 3 } },
    { id: 'boundary-country', type: 'line', source: 'osm-tiles', 'source-layer': 'boundary', filter: ['==', 'admin_level', 2], paint: { 'line-color': '#ffcc00', 'line-width': 2, 'line-dasharray': [5, 3] } },
    { id: 'place-label-city', type: 'symbol', source: 'osm-tiles', 'source-layer': 'place', filter: ['==', 'class', 'city'], layout: { 'text-field': ['get', 'name'], 'text-size': 16, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] }, paint: { 'text-color': '#fff', 'text-halo-color': '#000', 'text-halo-width': 2 } },
    { id: 'place-label-town', type: 'symbol', source: 'osm-tiles', 'source-layer': 'place', filter: ['==', 'class', 'town'], layout: { 'text-field': ['get', 'name'], 'text-size': 13, 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'] }, paint: { 'text-color': '#ddd', 'text-halo-color': '#000', 'text-halo-width': 1.5 } }
  ]
}

const terrainStyle = {
  version: 8,
  name: 'Terrain',
  sources: {
    'osm-tiles': {
      type: 'vector',
      tiles: ['http://135.235.138.50/planettiles/{z}/{x}/{y}.mvt'],
      maxzoom: 14
    }
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#e8dcc8' } },
    { id: 'water', type: 'fill', source: 'osm-tiles', 'source-layer': 'water', paint: { 'fill-color': '#8ecae6' } },
    { id: 'landcover-grass', type: 'fill', source: 'osm-tiles', 'source-layer': 'landcover', filter: ['==', 'class', 'grass'], paint: { 'fill-color': '#a8d5a2' } },
    { id: 'landcover-wood', type: 'fill', source: 'osm-tiles', 'source-layer': 'landcover', filter: ['==', 'class', 'wood'], paint: { 'fill-color': '#6a994e' } },
    { id: 'landuse-residential', type: 'fill', source: 'osm-tiles', 'source-layer': 'landuse', filter: ['==', 'class', 'residential'], paint: { 'fill-color': '#f4e4c8' } },
    { id: 'park', type: 'fill', source: 'osm-tiles', 'source-layer': 'park', paint: { 'fill-color': '#95d5b2' } },
    { id: 'building', type: 'fill', source: 'osm-tiles', 'source-layer': 'building', paint: { 'fill-color': '#d4c4a8', 'fill-opacity': 0.8 } },
    { id: 'building-3d', type: 'fill-extrusion', source: 'osm-tiles', 'source-layer': 'building', minzoom: 14, paint: { 'fill-extrusion-color': '#c4b498', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 0.8 } },
    { id: 'road-minor', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'minor', 'service', 'track']], paint: { 'line-color': '#f5f0e6', 'line-width': 1 } },
    { id: 'road-secondary', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'secondary', 'tertiary']], paint: { 'line-color': '#e9c46a', 'line-width': 1.5 } },
    { id: 'road-primary', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'primary']], paint: { 'line-color': '#f4a261', 'line-width': 2 } },
    { id: 'road-motorway', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'motorway']], paint: { 'line-color': '#e76f51', 'line-width': 3 } },
    { id: 'boundary-country', type: 'line', source: 'osm-tiles', 'source-layer': 'boundary', filter: ['==', 'admin_level', 2], paint: { 'line-color': '#8b5a2b', 'line-width': 2, 'line-dasharray': [5, 3] } },
    { id: 'place-label-city', type: 'symbol', source: 'osm-tiles', 'source-layer': 'place', filter: ['==', 'class', 'city'], layout: { 'text-field': ['get', 'name'], 'text-size': 16, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] }, paint: { 'text-color': '#5c4033', 'text-halo-color': '#fff', 'text-halo-width': 2 } },
    { id: 'place-label-town', type: 'symbol', source: 'osm-tiles', 'source-layer': 'place', filter: ['==', 'class', 'town'], layout: { 'text-field': ['get', 'name'], 'text-size': 13, 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'] }, paint: { 'text-color': '#6b5344', 'text-halo-color': '#fff', 'text-halo-width': 1.5 } }
  ]
}

const oceanStyle = {
  version: 8,
  name: 'Ocean Blue',
  sources: {
    'osm-tiles': {
      type: 'vector',
      tiles: ['http://135.235.138.50/planettiles/{z}/{x}/{y}.mvt'],
      maxzoom: 14
    }
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#e0f4ff' } },
    { id: 'water', type: 'fill', source: 'osm-tiles', 'source-layer': 'water', paint: { 'fill-color': '#0077b6' } },
    { id: 'landcover-grass', type: 'fill', source: 'osm-tiles', 'source-layer': 'landcover', filter: ['==', 'class', 'grass'], paint: { 'fill-color': '#90e0ef' } },
    { id: 'landcover-wood', type: 'fill', source: 'osm-tiles', 'source-layer': 'landcover', filter: ['==', 'class', 'wood'], paint: { 'fill-color': '#48cae4' } },
    { id: 'landuse-residential', type: 'fill', source: 'osm-tiles', 'source-layer': 'landuse', filter: ['==', 'class', 'residential'], paint: { 'fill-color': '#caf0f8' } },
    { id: 'park', type: 'fill', source: 'osm-tiles', 'source-layer': 'park', paint: { 'fill-color': '#ade8f4' } },
    { id: 'building', type: 'fill', source: 'osm-tiles', 'source-layer': 'building', paint: { 'fill-color': '#a9d6e5', 'fill-opacity': 0.8 } },
    { id: 'building-3d', type: 'fill-extrusion', source: 'osm-tiles', 'source-layer': 'building', minzoom: 14, paint: { 'fill-extrusion-color': '#89c2d9', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 0.8 } },
    { id: 'road-minor', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'minor', 'service', 'track']], paint: { 'line-color': '#fff', 'line-width': 1 } },
    { id: 'road-secondary', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'secondary', 'tertiary']], paint: { 'line-color': '#61a5c2', 'line-width': 1.5 } },
    { id: 'road-primary', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'primary']], paint: { 'line-color': '#468faf', 'line-width': 2 } },
    { id: 'road-motorway', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'motorway']], paint: { 'line-color': '#023e8a', 'line-width': 3 } },
    { id: 'boundary-country', type: 'line', source: 'osm-tiles', 'source-layer': 'boundary', filter: ['==', 'admin_level', 2], paint: { 'line-color': '#03045e', 'line-width': 2, 'line-dasharray': [5, 3] } },
    { id: 'place-label-city', type: 'symbol', source: 'osm-tiles', 'source-layer': 'place', filter: ['==', 'class', 'city'], layout: { 'text-field': ['get', 'name'], 'text-size': 16, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] }, paint: { 'text-color': '#03045e', 'text-halo-color': '#fff', 'text-halo-width': 2 } },
    { id: 'place-label-town', type: 'symbol', source: 'osm-tiles', 'source-layer': 'place', filter: ['==', 'class', 'town'], layout: { 'text-field': ['get', 'name'], 'text-size': 13, 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'] }, paint: { 'text-color': '#0077b6', 'text-halo-color': '#fff', 'text-halo-width': 1.5 } }
  ]
}

const midnightStyle = {
  version: 8,
  name: 'Midnight',
  sources: {
    'osm-tiles': {
      type: 'vector',
      tiles: ['http://135.235.138.50/planettiles/{z}/{x}/{y}.mvt'],
      maxzoom: 14
    }
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#0d0d1a' } },
    { id: 'water', type: 'fill', source: 'osm-tiles', 'source-layer': 'water', paint: { 'fill-color': '#1a1a3a' } },
    { id: 'landcover-grass', type: 'fill', source: 'osm-tiles', 'source-layer': 'landcover', filter: ['==', 'class', 'grass'], paint: { 'fill-color': '#1a2a1a' } },
    { id: 'landcover-wood', type: 'fill', source: 'osm-tiles', 'source-layer': 'landcover', filter: ['==', 'class', 'wood'], paint: { 'fill-color': '#0d1a0d' } },
    { id: 'landuse-residential', type: 'fill', source: 'osm-tiles', 'source-layer': 'landuse', filter: ['==', 'class', 'residential'], paint: { 'fill-color': '#1a1a2a' } },
    { id: 'park', type: 'fill', source: 'osm-tiles', 'source-layer': 'park', paint: { 'fill-color': '#0d2a1a' } },
    { id: 'building', type: 'fill', source: 'osm-tiles', 'source-layer': 'building', paint: { 'fill-color': '#2a2a3a', 'fill-opacity': 0.9 } },
    { id: 'building-3d', type: 'fill-extrusion', source: 'osm-tiles', 'source-layer': 'building', minzoom: 14, paint: { 'fill-extrusion-color': '#3a3a4a', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 0.9 } },
    { id: 'road-minor', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'minor', 'service', 'track']], paint: { 'line-color': '#3a3a4a', 'line-width': 1 } },
    { id: 'road-secondary', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'secondary', 'tertiary']], paint: { 'line-color': '#5a5a6a', 'line-width': 1.5 } },
    { id: 'road-primary', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'primary']], paint: { 'line-color': '#7a7a8a', 'line-width': 2 } },
    { id: 'road-motorway', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'motorway']], paint: { 'line-color': '#9b5de5', 'line-width': 3 } },
    { id: 'boundary-country', type: 'line', source: 'osm-tiles', 'source-layer': 'boundary', filter: ['==', 'admin_level', 2], paint: { 'line-color': '#f72585', 'line-width': 2, 'line-dasharray': [5, 3] } },
    { id: 'place-label-city', type: 'symbol', source: 'osm-tiles', 'source-layer': 'place', filter: ['==', 'class', 'city'], layout: { 'text-field': ['get', 'name'], 'text-size': 16, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] }, paint: { 'text-color': '#fff', 'text-halo-color': '#0d0d1a', 'text-halo-width': 2 } },
    { id: 'place-label-town', type: 'symbol', source: 'osm-tiles', 'source-layer': 'place', filter: ['==', 'class', 'town'], layout: { 'text-field': ['get', 'name'], 'text-size': 13, 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'] }, paint: { 'text-color': '#aaa', 'text-halo-color': '#0d0d1a', 'text-halo-width': 1.5 } }
  ]
}

const vintageStyle = {
  version: 8,
  name: 'Vintage',
  sources: {
    'osm-tiles': {
      type: 'vector',
      tiles: ['http://135.235.138.50/planettiles/{z}/{x}/{y}.mvt'],
      maxzoom: 14
    }
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#f5f0e1' } },
    { id: 'water', type: 'fill', source: 'osm-tiles', 'source-layer': 'water', paint: { 'fill-color': '#b8d4e3' } },
    { id: 'landcover-grass', type: 'fill', source: 'osm-tiles', 'source-layer': 'landcover', filter: ['==', 'class', 'grass'], paint: { 'fill-color': '#d4e6c3' } },
    { id: 'landcover-wood', type: 'fill', source: 'osm-tiles', 'source-layer': 'landcover', filter: ['==', 'class', 'wood'], paint: { 'fill-color': '#b8d4a3' } },
    { id: 'landuse-residential', type: 'fill', source: 'osm-tiles', 'source-layer': 'landuse', filter: ['==', 'class', 'residential'], paint: { 'fill-color': '#f0e6d2' } },
    { id: 'park', type: 'fill', source: 'osm-tiles', 'source-layer': 'park', paint: { 'fill-color': '#c8deb8' } },
    { id: 'building', type: 'fill', source: 'osm-tiles', 'source-layer': 'building', paint: { 'fill-color': '#e0d6c2', 'fill-opacity': 0.8 } },
    { id: 'building-3d', type: 'fill-extrusion', source: 'osm-tiles', 'source-layer': 'building', minzoom: 14, paint: { 'fill-extrusion-color': '#d0c6b2', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 0.8 } },
    { id: 'road-minor', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'minor', 'service', 'track']], paint: { 'line-color': '#fff', 'line-width': 1 } },
    { id: 'road-secondary', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'secondary', 'tertiary']], paint: { 'line-color': '#d4a574', 'line-width': 1.5 } },
    { id: 'road-primary', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'primary']], paint: { 'line-color': '#c4956a', 'line-width': 2 } },
    { id: 'road-motorway', type: 'line', source: 'osm-tiles', 'source-layer': 'transportation', filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'motorway']], paint: { 'line-color': '#a67c52', 'line-width': 3 } },
    { id: 'boundary-country', type: 'line', source: 'osm-tiles', 'source-layer': 'boundary', filter: ['==', 'admin_level', 2], paint: { 'line-color': '#8b7355', 'line-width': 2, 'line-dasharray': [5, 3] } },
    { id: 'place-label-city', type: 'symbol', source: 'osm-tiles', 'source-layer': 'place', filter: ['==', 'class', 'city'], layout: { 'text-field': ['get', 'name'], 'text-size': 16, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] }, paint: { 'text-color': '#5c4a3a', 'text-halo-color': '#f5f0e1', 'text-halo-width': 2 } },
    { id: 'place-label-town', type: 'symbol', source: 'osm-tiles', 'source-layer': 'place', filter: ['==', 'class', 'town'], layout: { 'text-field': ['get', 'name'], 'text-size': 13, 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'] }, paint: { 'text-color': '#6c5a4a', 'text-halo-color': '#f5f0e1', 'text-halo-width': 1.5 } }
  ]
}

// Map themes configuration
const mapThemes = {
  default: { name: 'Default', style: lightStyle, icon: '🗺️', preview: '#f8f9fa' },
  dark: { name: 'Dark', style: darkStyle, icon: '🌑', preview: '#1a1a2e' },
  satellite: { name: 'Satellite', style: satelliteStyle, icon: '🛰️', preview: '#0f1419' },
  terrain: { name: 'Terrain', style: terrainStyle, icon: '⛰️', preview: '#e8dcc8' },
  ocean: { name: 'Ocean', style: oceanStyle, icon: '🌊', preview: '#0077b6' },
  midnight: { name: 'Midnight', style: midnightStyle, icon: '🌃', preview: '#0d0d1a' },
  vintage: { name: 'Vintage', style: vintageStyle, icon: '📜', preview: '#f5f0e1' }
}

// Check WebGL support
function checkWebGLSupport() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch {
    return false
  }
}

function App() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const socketRef = useRef(null)
  const markersRef = useRef({}) // Store markers by userId
  const updateUserMarkerRef = useRef(null) // Ref to hold latest updateUserMarker
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(null)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [mapTheme, setMapTheme] = useState('default') // 'default', 'satellite', 'terrain', 'ocean', 'midnight', 'vintage'
  const [showMapThemeSelector, setShowMapThemeSelector] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [users, setUsers] = useState({}) // Store user data
  const [selectedUser, setSelectedUser] = useState(null) // Selected user for detail view
  const [userLocationHistory, setUserLocationHistory] = useState([])
  const [alerts, setAlerts] = useState([]) // Store all alerts
  // eslint-disable-next-line no-unused-vars
  const [showAlertsPanel, setShowAlertsPanel] = useState(false) // Toggle alerts panel (used for auto-show on SOS)
  const [selectedAlert, setSelectedAlert] = useState(null) // Selected alert for detail view
  
  // Video-related state
  const [videos, setVideos] = useState([]) // Store all videos
  const [videoPagination, setVideoPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [videoStats, setVideoStats] = useState(null) // Video statistics
  const [selectedVideo, setSelectedVideo] = useState(null) // Selected video for detail view
  const [videosLoading, setVideosLoading] = useState(false)
  const [videoFilterContext, setVideoFilterContext] = useState(null) // Context for filtered videos (user/alert)
  const [showUserRoute, setShowUserRoute] = useState(false) // Toggle route display on map
  
  // Geofence-related state
  const [geofences, setGeofences] = useState([])
  const [geofenceStats, setGeofenceStats] = useState(null)
  const [showGeofencePanel, setShowGeofencePanel] = useState(false)
  const [selectedGeofence, setSelectedGeofence] = useState(null)
  const [showGeofencesOnMap, setShowGeofencesOnMap] = useState(true)
  const [geofenceFormMode, setGeofenceFormMode] = useState(null) // 'create' or 'edit'
  const [geofenceFormData, setGeofenceFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    radius: 1000,
    fenceType: 'safety',
    isActive: true
  })
  const [isPickingLocation, setIsPickingLocation] = useState(false) // Map click mode for location selection
  
  // Safety Score-related state
  const [safetyScores, setSafetyScores] = useState([])
  const [safetyStats, setSafetyStats] = useState(null)
  
  const [mapStats, setMapStats] = useState({
    zoom: 5,
    center: { lng: 78.9629, lat: 20.5937 },
    pitch: 0,
    bearing: 0
  })

  // Toggle user route on map
  const toggleUserRoute = useCallback(() => {
    if (!map.current || !mapLoaded) return
    
    const sourceId = 'user-route-source'
    const layerId = 'user-route-layer'
    const pointsLayerId = 'user-route-points'
    
    const arrowsLayerId = 'user-route-arrows'
    
    if (showUserRoute) {
      // Remove route
      if (map.current.getLayer(arrowsLayerId)) map.current.removeLayer(arrowsLayerId)
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId)
      if (map.current.getLayer(pointsLayerId)) map.current.removeLayer(pointsLayerId)
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId)
      setShowUserRoute(false)
    } else {
      // Draw route from location history
      if (userLocationHistory.length < 2) {
        console.log('Not enough location points to draw route')
        return
      }
      
      // Create coordinates array from history (most recent first, so reverse for path)
      const coordinates = userLocationHistory
        .filter(loc => loc.longitude && loc.latitude)
        .map(loc => [loc.longitude, loc.latitude])
        .reverse()
      
      if (coordinates.length < 2) return
      
      // Remove existing if any
      if (map.current.getLayer(arrowsLayerId)) map.current.removeLayer(arrowsLayerId)
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId)
      if (map.current.getLayer(pointsLayerId)) map.current.removeLayer(pointsLayerId)
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId)

      // Add source with GeoJSON
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: coordinates
              }
            },
            ...coordinates.map((coord, index) => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: coord
              },
              properties: {
                index: index,
                isStart: index === 0,
                isEnd: index === coordinates.length - 1
              }
            }))
          ]
        }
      })
      
      // Add line layer
      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        filter: ['==', '$type', 'LineString'],
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        }
      })
      
      // Add direction arrows layer
      // Load arrow image if not exists
      if (!map.current.hasImage('route-arrow')) {
        // Create arrow icon as canvas
        const size = 24
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        
        // Draw arrow pointing right (will be rotated by symbol-rotation)
        ctx.fillStyle = '#1d4ed8'
        ctx.beginPath()
        ctx.moveTo(size * 0.2, size * 0.3)
        ctx.lineTo(size * 0.8, size * 0.5)
        ctx.lineTo(size * 0.2, size * 0.7)
        ctx.lineTo(size * 0.35, size * 0.5)
        ctx.closePath()
        ctx.fill()
        
        map.current.addImage('route-arrow', { width: size, height: size, data: ctx.getImageData(0, 0, size, size).data })
      }
      
      map.current.addLayer({
        id: arrowsLayerId,
        type: 'symbol',
        source: sourceId,
        filter: ['==', '$type', 'LineString'],
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 80,
          'icon-image': 'route-arrow',
          'icon-size': 0.6,
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        }
      })
      
      // Add points layer
      map.current.addLayer({
        id: pointsLayerId,
        type: 'circle',
        source: sourceId,
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': [
            'case',
            ['get', 'isStart'], 8,
            ['get', 'isEnd'], 8,
            4
          ],
          'circle-color': [
            'case',
            ['get', 'isStart'], '#22c55e',
            ['get', 'isEnd'], '#ef4444',
            '#3b82f6'
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      })
      
      // Fit bounds to show entire route
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord)
      }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]))
      
      map.current.fitBounds(bounds, {
        padding: 80,
        duration: 1000
      })
      
      setShowUserRoute(true)
    }
  }, [showUserRoute, userLocationHistory, mapLoaded])

  // Draw geofences on map
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Helper function to create circle polygon from center and radius
    const createCirclePolygon = (center, radiusMeters, points = 64) => {
      const coords = []
      const km = radiusMeters / 1000
      const distanceX = km / (111.32 * Math.cos((center[1] * Math.PI) / 180))
      const distanceY = km / 110.574

      for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI)
        const x = distanceX * Math.cos(theta)
        const y = distanceY * Math.sin(theta)
        coords.push([center[0] + x, center[1] + y])
      }
      coords.push(coords[0]) // Close the polygon
      return coords
    }

    // Remove existing geofence layers and sources
    geofences.forEach(geo => {
      const sourceId = `geofence-source-${geo.id}`
      const fillLayerId = `geofence-fill-${geo.id}`
      const outlineLayerId = `geofence-outline-${geo.id}`
      const labelLayerId = `geofence-label-${geo.id}`
      
      if (map.current.getLayer(fillLayerId)) map.current.removeLayer(fillLayerId)
      if (map.current.getLayer(outlineLayerId)) map.current.removeLayer(outlineLayerId)
      if (map.current.getLayer(labelLayerId)) map.current.removeLayer(labelLayerId)
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId)
    })

    // Draw geofences if visible
    if (showGeofencesOnMap && geofences.length > 0) {
      geofences.forEach(geo => {
        if (!geo.latitude || !geo.longitude || !geo.radius) return
        
        const sourceId = `geofence-source-${geo.id}`
        const fillLayerId = `geofence-fill-${geo.id}`
        const outlineLayerId = `geofence-outline-${geo.id}`
        const labelLayerId = `geofence-label-${geo.id}`
        
        // Define colors based on geofence type
        const colors = {
          safety: { fill: 'rgba(34, 197, 94, 0.2)', outline: '#22c55e' },
          restricted: { fill: 'rgba(239, 68, 68, 0.3)', outline: '#ef4444' }
        }
        const color = colors[geo.fenceType] || colors.safety
        
        // Create circle coordinates
        const circleCoords = createCirclePolygon([geo.longitude, geo.latitude], geo.radius)
        
        // Add source
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [circleCoords]
              },
              properties: {
                name: geo.name,
                type: geo.type,
                isActive: geo.isActive
              }
            }]
          }
        })
        
        // Add fill layer
        map.current.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': color.fill,
            'fill-opacity': geo.isActive ? 0.6 : 0.3
          }
        })
        
        // Add outline layer
        map.current.addLayer({
          id: outlineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': color.outline,
            'line-width': geo.isActive ? 3 : 1.5,
            'line-opacity': geo.isActive ? 0.9 : 0.5,
            'line-dasharray': geo.isActive ? [1] : [4, 2]
          }
        })
        
        // Add label layer
        map.current.addLayer({
          id: labelLayerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'text-field': geo.name,
            'text-size': 12,
            'text-anchor': 'center',
            'text-allow-overlap': false
          },
          paint: {
            'text-color': color.outline,
            'text-halo-color': 'rgba(0, 0, 0, 0.7)',
            'text-halo-width': 2
          }
        })
      })
    }
  }, [geofences, showGeofencesOnMap, mapLoaded])

  // Draw geofence preview on map when creating/editing
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const previewSourceId = 'geofence-preview-source'
    const previewFillId = 'geofence-preview-fill'
    const previewOutlineId = 'geofence-preview-outline'
    const previewCenterId = 'geofence-preview-center'

    // Helper function to create circle polygon
    const createCirclePolygon = (center, radiusMeters, points = 64) => {
      const coords = []
      const km = radiusMeters / 1000
      const distanceX = km / (111.32 * Math.cos((center[1] * Math.PI) / 180))
      const distanceY = km / 110.574

      for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI)
        const x = distanceX * Math.cos(theta)
        const y = distanceY * Math.sin(theta)
        coords.push([center[0] + x, center[1] + y])
      }
      coords.push(coords[0])
      return coords
    }

    // Remove existing preview layers
    if (map.current.getLayer(previewFillId)) map.current.removeLayer(previewFillId)
    if (map.current.getLayer(previewOutlineId)) map.current.removeLayer(previewOutlineId)
    if (map.current.getLayer(previewCenterId)) map.current.removeLayer(previewCenterId)
    if (map.current.getSource(previewSourceId)) map.current.removeSource(previewSourceId)

    // Draw preview if form is active and has valid coordinates
    if (geofenceFormMode && geofenceFormData.latitude && geofenceFormData.longitude) {
      const lat = parseFloat(geofenceFormData.latitude)
      const lng = parseFloat(geofenceFormData.longitude)
      const radius = parseInt(geofenceFormData.radius) || 1000

      if (!isNaN(lat) && !isNaN(lng)) {
        const circleCoords = createCirclePolygon([lng, lat], radius)
        const isRestricted = geofenceFormData.fenceType === 'restricted'

        map.current.addSource(previewSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [circleCoords] }
              },
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [lng, lat] }
              }
            ]
          }
        })

        // Fill layer
        map.current.addLayer({
          id: previewFillId,
          type: 'fill',
          source: previewSourceId,
          filter: ['==', '$type', 'Polygon'],
          paint: {
            'fill-color': isRestricted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)',
            'fill-opacity': 0.6
          }
        })

        // Outline layer
        map.current.addLayer({
          id: previewOutlineId,
          type: 'line',
          source: previewSourceId,
          filter: ['==', '$type', 'Polygon'],
          paint: {
            'line-color': isRestricted ? '#ef4444' : '#22c55e',
            'line-width': 3,
            'line-dasharray': [4, 2]
          }
        })

        // Center point layer
        map.current.addLayer({
          id: previewCenterId,
          type: 'circle',
          source: previewSourceId,
          filter: ['==', '$type', 'Point'],
          paint: {
            'circle-radius': 8,
            'circle-color': isRestricted ? '#ef4444' : '#22c55e',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff'
          }
        })
      }
    }
  }, [geofenceFormMode, geofenceFormData.latitude, geofenceFormData.longitude, geofenceFormData.radius, geofenceFormData.fenceType, mapLoaded])

  // Map click handler for location picking
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const handleMapClick = (e) => {
      if (isPickingLocation && geofenceFormMode) {
        const { lng, lat } = e.lngLat
        setGeofenceFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6)
        }))
        setIsPickingLocation(false)
        map.current.getCanvas().style.cursor = ''
      }
    }

    map.current.on('click', handleMapClick)

    // Update cursor when picking
    if (isPickingLocation) {
      map.current.getCanvas().style.cursor = 'crosshair'
    } else {
      map.current.getCanvas().style.cursor = ''
    }

    return () => {
      map.current?.off('click', handleMapClick)
    }
  }, [isPickingLocation, geofenceFormMode, mapLoaded])

  // Draw safety scores on map as markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Remove existing safety score markers
    const existingMarkers = document.querySelectorAll('.safety-score-marker')
    existingMarkers.forEach(marker => marker.remove())

    // Clean up any existing safety score layers/sources
    safetyScores.forEach((score, index) => {
      const markerId = `safety-marker-${score.id || index}`
      if (map.current.getLayer(markerId)) map.current.removeLayer(markerId)
      if (map.current.getSource(markerId)) map.current.removeSource(markerId)
    })

    // Add safety score markers to the map
    if (safetyScores.length > 0) {
      console.log(`Rendering ${safetyScores.length} safety scores on map`)
      let renderedCount = 0
      let skippedCount = 0
      
      safetyScores.forEach(score => {
        // Support multiple coordinate field names
        const lat = score.latitude || score.lat || score.location?.latitude || score.location?.lat || score.coordinates?.lat
        const lng = score.longitude || score.lng || score.lon || score.location?.longitude || score.location?.lng || score.coordinates?.lng || score.coordinates?.lon
        
        if (!lat || !lng) {
          skippedCount++
          return
        }
        
        renderedCount++

        // Get score value - support multiple field names
        const scoreValue = score.score ?? score.safetyScore ?? score.safety_score ?? score.value ?? score.rating ?? 0

        // Determine color based on score
        const getScoreColor = (val) => {
          if (val >= 80) return { bg: '#22c55e', border: '#16a34a' } // Green - Safe
          if (val >= 50) return { bg: '#f59e0b', border: '#d97706' } // Yellow/Orange - Moderate
          return { bg: '#ef4444', border: '#dc2626' } // Red - Danger
        }
        const colors = getScoreColor(scoreValue)

        // Create custom marker element - simple small dot
        const markerEl = document.createElement('div')
        markerEl.className = 'safety-score-marker'
        markerEl.style.cssText = `
          width: 12px;
          height: 12px;
          background: ${colors.bg};
          border: 2px solid ${colors.border};
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        `

        // Add hover effect
        markerEl.addEventListener('mouseenter', () => {
          markerEl.style.transform = 'scale(1.5)'
          markerEl.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.5)'
          markerEl.style.zIndex = '1000'
        })
        markerEl.addEventListener('mouseleave', () => {
          markerEl.style.transform = 'scale(1)'
          markerEl.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.3)'
          markerEl.style.zIndex = ''
        })

        // Create popup content
        const popupContent = `
          <div style="padding: 8px; min-width: 150px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: ${colors.bg};">
              🛡️ Safety Score: ${scoreValue}/100
            </div>
            <div style="font-size: 12px; color: #e2e8f0; margin-bottom: 4px;">
              📍 ${score.locationName || score.name || score.location_name || 'Unknown Location'}
            </div>
            ${score.category ? `<div style="font-size: 11px; color: #94a3b8;">🏷️ ${score.category}</div>` : ''}
            ${score.factors ? `
              <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 10px; color: #94a3b8;">
                ${score.factors.weather ? `🌤 Weather: ${score.factors.weather}<br/>` : ''}
                ${score.factors.crowd ? `👥 Crowd: ${score.factors.crowd}<br/>` : ''}
                ${score.factors.terrain ? `⛰️ Terrain: ${score.factors.terrain}` : ''}
              </div>
            ` : ''}
          </div>
        `

        // Create the marker with popup
        new maplibregl.Marker({ element: markerEl })
          .setLngLat([lng, lat])
          .setPopup(
            new maplibregl.Popup({ 
              offset: 25, 
              closeButton: false,
              className: 'safety-score-popup'
            }).setHTML(popupContent)
          )
          .addTo(map.current)
      })
      
      console.log(`Safety scores - Rendered: ${renderedCount}, Skipped (no coords): ${skippedCount}`)
    }
  }, [safetyScores, mapLoaded])

  // Create custom marker element with profile photo and status ring
  const createMarkerElement = useCallback((user) => {
    const container = document.createElement('div')
    container.className = 'user-marker-container'
    container.setAttribute('data-user-id', user.userId || user._id)
    
    // Status ring color based on active/online status
    const isActive = user.isOnline !== false && user.isActive !== false && user.status !== 'inactive'
    const statusColor = isActive ? '#10b981' : '#6b7280' // green for active, gray for inactive
    
    // Handle profile picture - check all possible field names
    const profileImg = user.profilePicture || user.profilePhoto || user.avatar || user.image || user.photo
    const userName = user.name || user.userName || 'User'
    const fallbackImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff&size=40`
    
    // Use profile image if it's a valid URL, otherwise use fallback
    const imgSrc = profileImg && profileImg.startsWith('http') ? profileImg : fallbackImg
    
    console.log('Creating marker for user:', userName, 'profilePicture:', profileImg, 'using:', imgSrc)
    
    container.innerHTML = `
      <div class="user-marker" style="--status-color: ${statusColor}">
        <div class="status-ring ${isActive ? 'active' : 'inactive'}"></div>
        <div class="profile-photo">
          <img 
            src="${imgSrc}" 
            alt="${userName}"
            onerror="this.onerror=null; this.src='${fallbackImg}'"
          />
        </div>
        <div class="marker-pulse ${isActive ? 'active' : ''}"></div>
      </div>
      <div class="marker-label">${userName}</div>
    `
    
    return container
  }, [])

  // Handle user click to show details
  const handleUserClick = useCallback((userId) => {
    setSelectedUser(prevSelected => {
      // Get user from current state
      const user = users[userId] || Object.values(users).find(u => (u.userId || u._id) === userId)
      if (user) {
        // Request ALL location history (no limit or very high limit)
        if (socketRef.current?.connected) {
          socketRef.current.emit('admin:get-user-location', { userId, limit: 10000 })
        }
        
        // Fly to user location - handle both coordinate formats
        const lng = user.longitude ?? user.location?.coordinates?.[0]
        const lat = user.latitude ?? user.location?.coordinates?.[1]
        if (lng && lat && map.current) {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 15,
            duration: 1500
          })
        }
        
        return {
          ...user,
          userId
        }
      }
      return prevSelected
    })
  }, [users])

  // Update or create marker for a user
  const updateUserMarker = useCallback((userData) => {
    const userId = userData.userId || userData._id
    
    // Handle both coordinate formats:
    // Server format: { latitude, longitude }
    // Legacy format: { location: { coordinates: [lng, lat] } }
    let lng, lat
    if (userData.longitude !== undefined && userData.latitude !== undefined) {
      lng = userData.longitude
      lat = userData.latitude
    } else if (userData.location?.coordinates) {
      [lng, lat] = userData.location.coordinates
    } else {
      console.log('No valid coordinates for user:', userData?.name || userId)
      return // No valid coordinates
    }
    
    // Normalize user data for internal state
    const normalizedUser = {
      ...userData,
      userId,
      longitude: lng,
      latitude: lat,
      // Map server fields to our expected fields
      isOnline: userData.isOnline ?? userData.isActive ?? true,
      profilePicture: userData.profilePicture || userData.profilePhoto || userData.avatar,
      phone: userData.phone || userData.phoneNumber,
      lastUpdated: userData.timestamp || new Date().toISOString()
    }
    
    // Always update user state (for the list)
    setUsers(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        ...normalizedUser
      }
    }))
    
    // Only update map markers if map is ready
    if (!map.current || !mapLoaded) {
      console.log('Map not ready, user added to list but skipping marker for:', userData?.name || userId)
      return
    }
    
    // Check if marker exists
    if (markersRef.current[userId]) {
      // Update existing marker position with animation
      markersRef.current[userId].setLngLat([lng, lat])
      
      // Update marker element for status changes and profile picture
      const el = markersRef.current[userId].getElement()
      const isActive = normalizedUser.isOnline !== false
      const statusRing = el.querySelector('.status-ring')
      const markerPulse = el.querySelector('.marker-pulse')
      const profileImg = el.querySelector('.profile-photo img')
      
      if (statusRing) {
        statusRing.className = `status-ring ${isActive ? 'active' : 'inactive'}`
        el.querySelector('.user-marker').style.setProperty('--status-color', isActive ? '#10b981' : '#6b7280')
      }
      if (markerPulse) {
        markerPulse.className = `marker-pulse ${isActive ? 'active' : ''}`
      }
      
      // Update profile picture if available and different
      if (profileImg && normalizedUser.profilePicture) {
        const currentSrc = profileImg.getAttribute('src')
        if (currentSrc !== normalizedUser.profilePicture && normalizedUser.profilePicture.startsWith('http')) {
          profileImg.src = normalizedUser.profilePicture
        }
      }
    } else {
      // Create new marker
      const markerEl = createMarkerElement(normalizedUser)
      
      // Add click handler to marker
      markerEl.addEventListener('click', () => {
        handleUserClick(userId)
      })
      
      const marker = new maplibregl.Marker({
        element: markerEl,
        anchor: 'bottom'
      })
        .setLngLat([lng, lat])
        .addTo(map.current)
      
      markersRef.current[userId] = marker
    }
  }, [mapLoaded, createMarkerElement, handleUserClick])

  // Keep ref updated with latest callback
  useEffect(() => {
    updateUserMarkerRef.current = updateUserMarker
  }, [updateUserMarker])

  // Remove user marker (used for cleanup and when user disconnects)
  // eslint-disable-next-line no-unused-vars
  const removeUserMarker = useCallback((userId) => {
    if (markersRef.current[userId]) {
      markersRef.current[userId].remove()
      delete markersRef.current[userId]
    }
    setUsers(prev => {
      const newUsers = { ...prev }
      delete newUsers[userId]
      return newUsers
    })
  }, [])

  // ========== GEOFENCE HANDLERS ==========
  
  // Fetch all geofences
  const fetchGeofences = useCallback((filters = {}) => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit('admin:get-all-geofences', filters)
  }, [])

  // Fetch geofence statistics
  const fetchGeofenceStats = useCallback(() => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit('admin:get-geofence-stats', {})
  }, [])

  // Create geofence
  const createGeofence = useCallback((data) => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit('admin:create-geofence', data)
  }, [])

  // Update geofence
  const updateGeofence = useCallback((geofenceId, data) => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit('admin:update-geofence', { geofenceId, ...data })
  }, [])

  // Delete geofence
  const deleteGeofence = useCallback((geofenceId) => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit('admin:delete-geofence', { geofenceId })
  }, [])

  // Toggle geofence active status
  const toggleGeofence = useCallback((geofenceId) => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit('admin:toggle-geofence', { geofenceId })
  }, [])

  // Handle geofence form submit
  const handleGeofenceFormSubmit = useCallback((e) => {
    e.preventDefault()
    const data = {
      name: geofenceFormData.name,
      description: geofenceFormData.description,
      latitude: parseFloat(geofenceFormData.latitude),
      longitude: parseFloat(geofenceFormData.longitude),
      radius: parseInt(geofenceFormData.radius),
      fenceType: geofenceFormData.fenceType,
      isActive: geofenceFormData.isActive
    }
    
    if (geofenceFormMode === 'create') {
      createGeofence(data)
    } else if (geofenceFormMode === 'edit' && selectedGeofence) {
      updateGeofence(selectedGeofence.id, data)
    }
    setIsPickingLocation(false)
  }, [geofenceFormMode, geofenceFormData, selectedGeofence, createGeofence, updateGeofence])

  // Close geofence form
  const closeGeofenceForm = useCallback(() => {
    setGeofenceFormMode(null)
    setIsPickingLocation(false)
  }, [])

  // Open geofence form for creating
  const openCreateGeofenceForm = useCallback(() => {
    setGeofenceFormData({
      name: '',
      description: '',
      latitude: '',
      longitude: '',
      radius: 1000,
      fenceType: 'safety',
      isActive: true
    })
    setGeofenceFormMode('create')
  }, [])

  // Open geofence form for editing
  const openEditGeofenceForm = useCallback((geofence) => {
    setGeofenceFormData({
      name: geofence.name || '',
      description: geofence.description || '',
      latitude: geofence.latitude?.toString() || '',
      longitude: geofence.longitude?.toString() || '',
      radius: geofence.radius || 1000,
      fenceType: geofence.fenceType || 'safety',
      isActive: geofence.isActive !== false
    })
    setSelectedGeofence(geofence)
    setGeofenceFormMode('edit')
  }, [])

  // ========== SAFETY SCORE HANDLERS ==========
  
  // Fetch all safety scores
  const fetchSafetyScores = useCallback((filters = {}) => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit('admin:get-all-safety-scores', filters)
  }, [])

  // Fetch safety statistics
  const fetchSafetyStats = useCallback(() => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit('admin:get-safety-stats', {})
  }, [])

  // Fetch nearby safety scores
  const fetchNearbySafetyScores = useCallback((latitude, longitude, radiusKm = 50) => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit('admin:get-nearby-safety-scores', { latitude, longitude, radiusKm })
  }, [])

  // Initialize Socket.IO connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    })

    socketRef.current.on('connect', () => {
      console.log('Connected to admin socket')
      setSocketConnected(true)
      
      // Request all users' locations on connect
      socketRef.current.emit('admin:get-all-locations', {})
      
      // Request all active alerts on connect
      socketRef.current.emit('admin:get-active-alerts', {})
      
      // Request all geofences on connect
      socketRef.current.emit('admin:get-all-geofences', {})
      
      // Request geofence stats
      socketRef.current.emit('admin:get-geofence-stats', {})
      
      // Request all safety scores on connect (will display on map)
      socketRef.current.emit('admin:get-all-safety-scores', {})
    })

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from admin socket')
      setSocketConnected(false)
    })

    // Listen for initial online users list
    socketRef.current.on('users:online', (data) => {
      console.log('Online users:', data)
      // This gives us online users, but we need locations from admin:all-locations
    })

    // Listen for user coming online
    socketRef.current.on('user:online', (data) => {
      console.log('User online:', data)
      setUsers(prev => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          ...data,
          isOnline: true
        }
      }))
      // Update marker if exists
      if (markersRef.current[data.userId]) {
        const el = markersRef.current[data.userId].getElement()
        const statusRing = el.querySelector('.status-ring')
        const markerPulse = el.querySelector('.marker-pulse')
        if (statusRing) {
          statusRing.className = 'status-ring active'
          el.querySelector('.user-marker').style.setProperty('--status-color', '#10b981')
        }
        if (markerPulse) {
          markerPulse.className = 'marker-pulse active'
        }
      }
    })

    // Listen for user going offline
    socketRef.current.on('user:offline', (data) => {
      console.log('User offline:', data)
      setUsers(prev => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          ...data,
          isOnline: false
        }
      }))
      // Update marker appearance
      if (markersRef.current[data.userId]) {
        const el = markersRef.current[data.userId].getElement()
        const statusRing = el.querySelector('.status-ring')
        const markerPulse = el.querySelector('.marker-pulse')
        if (statusRing) {
          statusRing.className = 'status-ring inactive'
          el.querySelector('.user-marker').style.setProperty('--status-color', '#6b7280')
        }
        if (markerPulse) {
          markerPulse.className = 'marker-pulse'
        }
      }
    })

    // Listen for all users' locations
    socketRef.current.on('admin:all-locations', (data) => {
      console.log('Received all locations:', data)
      if (data.users && Array.isArray(data.users)) {
        data.users.forEach(user => {
          console.log('User data:', user.name, 'profilePicture:', user.profilePicture)
          updateUserMarkerRef.current?.(user)
        })
      }
    })

    // Listen for real-time user location updates
    socketRef.current.on('user:location', (locationData) => {
      console.log('User location update:', locationData)
      updateUserMarkerRef.current?.(locationData)
    })

    // Listen for user location history
    socketRef.current.on('admin:user-location-history', (data) => {
      console.log('User location history:', data)
      // Map location history to our expected format
      const mappedLocations = (data.locations || []).map(loc => ({
        ...loc,
        coordinates: [loc.longitude, loc.latitude]
      }))
      setUserLocationHistory(mappedLocations)
      if (data.user) {
        setSelectedUser(prev => prev ? { 
          ...prev, 
          ...data.user,
          profilePicture: data.user.profilePicture || prev.profilePicture
        } : null)
      }
    })

    // Listen for active alerts response
    socketRef.current.on('admin:active-alerts', (data) => {
      console.log('Active alerts:', data)
      if (data.alerts && Array.isArray(data.alerts)) {
        setAlerts(data.alerts.map(alert => ({
          ...alert,
          id: alert.alertId || alert.id || `alert-${Date.now()}-${Math.random()}`,
          timestamp: alert.timestamp || alert.createdAt || new Date().toISOString(),
          receivedAt: alert.timestamp || alert.createdAt || new Date().toISOString()
        })))
      }
    })

    // Listen for alert resolved
    socketRef.current.on('alert:resolved', (data) => {
      console.log('Alert resolved:', data)
      setAlerts(prev => prev.filter(alert => alert.id !== data.alertId && alert.alertId !== data.alertId))
      if (selectedAlert && (selectedAlert.id === data.alertId || selectedAlert.alertId === data.alertId)) {
        setSelectedAlert(null)
      }
    })

    // Listen for SOS emergency alerts
    socketRef.current.on('sos:emergency', (sosData) => {
      console.log('SOS Emergency:', sosData)
      
      // Create alert object
      const newAlert = {
        id: sosData.alertId || `sos-${Date.now()}`,
        alertId: sosData.alertId,
        type: 'sos',
        priority: 'critical',
        user: sosData.user,
        location: sosData.location,
        message: sosData.message,
        timestamp: sosData.timestamp,
        receivedAt: new Date().toISOString(),
        status: 'active'
      }
      
      // Add to alerts list
      setAlerts(prev => {
        // Check if alert already exists
        const exists = prev.some(a => a.alertId === sosData.alertId)
        if (exists) return prev
        return [newAlert, ...prev]
      })
      
      // Auto-show alerts panel on SOS
      setShowAlertsPanel(true)
      
      // Extract user info and location from SOS data
      if (sosData.user && sosData.location) {
        updateUserMarkerRef.current?.({
          userId: sosData.user.id,
          name: sosData.user.name,
          email: sosData.user.email,
          phone: sosData.user.phone,
          profilePicture: sosData.user.profilePicture,
          latitude: sosData.location.latitude,
          longitude: sosData.location.longitude,
          isEmergency: true,
          isOnline: true,
          alertId: sosData.alertId,
          sosMessage: sosData.message,
          timestamp: sosData.timestamp
        })
      }
    })

    // Listen for low battery alerts
    socketRef.current.on('alert:low-battery', (alertData) => {
      console.log('Low battery alert:', alertData)
      
      // Create alert object
      const newAlert = {
        id: alertData.alertId || `battery-${Date.now()}`,
        alertId: alertData.alertId,
        type: 'low-battery',
        priority: 'warning',
        user: alertData.user,
        battery: alertData.battery,
        location: alertData.location,
        timestamp: alertData.timestamp,
        receivedAt: new Date().toISOString(),
        status: 'active'
      }
      
      // Add to alerts list
      setAlerts(prev => {
        const exists = prev.some(a => a.alertId === alertData.alertId)
        if (exists) return prev
        return [newAlert, ...prev]
      })
      
      const userId = alertData.user?.id || alertData.userId
      if (userId) {
        setUsers(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            battery: alertData.battery,
            lowBattery: true,
            ...(alertData.location && {
              latitude: alertData.location.latitude,
              longitude: alertData.location.longitude
            })
          }
        }))
      }
    })

    // Listen for user location stopped alerts
    socketRef.current.on('user:location-stopped', (data) => {
      console.log('User stopped sharing:', data)
      
      // Create alert object
      const newAlert = {
        id: data.alertId || `stopped-${Date.now()}`,
        alertId: data.alertId,
        type: 'location-stopped',
        priority: 'info',
        userId: data.userId,
        user: users[data.userId] || { id: data.userId },
        reason: data.reason,
        timestamp: data.timestamp,
        receivedAt: new Date().toISOString(),
        status: 'active'
      }
      
      // Add to alerts list (only if significant)
      if (data.reason && data.reason !== 'user_initiated') {
        setAlerts(prev => [newAlert, ...prev])
      }
      
      const userId = data.userId
      // Update user status to inactive
      setUsers(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          isOnline: false,
          stoppedAt: data.timestamp
        }
      }))
      // Update marker appearance
      if (markersRef.current[userId]) {
        const el = markersRef.current[userId].getElement()
        const statusRing = el.querySelector('.status-ring')
        const markerPulse = el.querySelector('.marker-pulse')
        if (statusRing) {
          statusRing.className = 'status-ring inactive'
          el.querySelector('.user-marker').style.setProperty('--status-color', '#6b7280')
        }
        if (markerPulse) {
          markerPulse.className = 'marker-pulse'
        }
      }
    })

    // Listen for GPT user connections
    socketRef.current.on('gpt:user-connected', (data) => {
      console.log('GPT user connected:', data)
    })

    socketRef.current.on('gpt:user-disconnected', (data) => {
      console.log('GPT user disconnected:', data)
    })

    // ========== VIDEO EVENTS ==========
    
    // Listen for all videos response
    socketRef.current.on('admin:all-videos', (data) => {
      console.log('All videos:', data)
      setVideosLoading(false)
      if (data.videos) {
        setVideos(data.videos)
      }
      if (data.pagination) {
        setVideoPagination(data.pagination)
      }
    })

    // Listen for single video details
    socketRef.current.on('admin:video-details', (data) => {
      console.log('Video details:', data)
      setSelectedVideo(data)
    })

    // Listen for user's videos
    socketRef.current.on('admin:user-videos', (data) => {
      console.log('User videos:', data)
      setVideosLoading(false)
      if (data.videos) {
        setVideos(data.videos)
      }
      if (data.pagination) {
        setVideoPagination(data.pagination)
      }
      // Store user context if provided
      if (data.user) {
        setVideoFilterContext({ type: 'user', data: data.user })
      }
    })

    // Listen for alert's videos
    socketRef.current.on('admin:alert-videos', (data) => {
      console.log('Alert videos:', data)
      setVideosLoading(false)
      if (data.videos) {
        setVideos(data.videos)
      }
      // Store alert context and count if provided
      if (data.alert) {
        setVideoFilterContext({ type: 'alert', data: data.alert, count: data.count })
      }
    })

    // Listen for video statistics
    socketRef.current.on('admin:video-stats', (data) => {
      console.log('Video stats:', data)
      setVideoStats(data)
    })

    // Listen for video deleted
    socketRef.current.on('admin:video-deleted', (data) => {
      console.log('Video deleted:', data)
      setVideos(prev => prev.filter(v => v.id !== data.videoId))
      if (selectedVideo?.id === data.videoId) {
        setSelectedVideo(null)
      }
    })

    // Listen for bulk videos deleted
    socketRef.current.on('admin:videos-bulk-deleted', (data) => {
      console.log('Videos bulk deleted:', data)
      if (data.videoIds) {
        setVideos(prev => prev.filter(v => !data.videoIds.includes(v.id)))
        if (selectedVideo && data.videoIds.includes(selectedVideo.id)) {
          setSelectedVideo(null)
        }
      }
    })

    // ========== GEOFENCE EVENTS ==========
    
    // Listen for all geofences
    socketRef.current.on('admin:all-geofences', (data) => {
      console.log('All geofences:', data)
      if (data.geofences) {
        setGeofences(data.geofences)
      }
    })

    // Listen for single geofence details
    socketRef.current.on('admin:geofence-details', (data) => {
      console.log('Geofence details:', data)
      setSelectedGeofence(data)
    })

    // Listen for geofence created (broadcast)
    socketRef.current.on('admin:geofence-created', (geofence) => {
      console.log('Geofence created:', geofence)
      setGeofences(prev => [geofence, ...prev])
      setGeofenceFormMode(null) // Close form
    })

    // Listen for geofence updated (broadcast)
    socketRef.current.on('admin:geofence-updated', (updated) => {
      console.log('Geofence updated:', updated)
      setGeofences(prev => prev.map(g => g.id === updated.id ? updated : g))
      if (selectedGeofence?.id === updated.id) {
        setSelectedGeofence(updated)
      }
      setGeofenceFormMode(null) // Close form
    })

    // Listen for geofence deleted (broadcast)
    socketRef.current.on('admin:geofence-deleted', ({ geofenceId }) => {
      console.log('Geofence deleted:', geofenceId)
      setGeofences(prev => prev.filter(g => g.id !== geofenceId))
      if (selectedGeofence?.id === geofenceId) {
        setSelectedGeofence(null)
      }
    })

    // Listen for geofence toggled (broadcast)
    socketRef.current.on('admin:geofence-toggled', ({ geofenceId, isActive }) => {
      console.log('Geofence toggled:', geofenceId, isActive)
      setGeofences(prev => prev.map(g => g.id === geofenceId ? { ...g, isActive } : g))
      if (selectedGeofence?.id === geofenceId) {
        setSelectedGeofence(prev => ({ ...prev, isActive }))
      }
    })

    // Listen for geofences at location
    socketRef.current.on('admin:geofences-at-location', (data) => {
      console.log('Geofences at location:', data)
    })

    // Listen for geofence statistics
    socketRef.current.on('admin:geofence-stats', (data) => {
      console.log('Geofence stats:', data)
      setGeofenceStats(data)
    })

    // ========== SAFETY SCORE EVENTS ==========
    
    // Listen for all safety scores
    socketRef.current.on('admin:all-safety-scores', (data) => {
      console.log('All safety scores received:', data)
      console.log('Number of scores:', data.scores?.length || 0)
      if (data.scores?.length > 0) {
        console.log('Sample score structure:', JSON.stringify(data.scores[0], null, 2))
      }
      if (data.scores) {
        setSafetyScores(data.scores)
      }
    })

    // Listen for safety score details
    socketRef.current.on('admin:safety-score-details', (data) => {
      console.log('Safety score details:', data)
    })

    // Listen for nearby safety scores
    socketRef.current.on('admin:nearby-safety-scores', (data) => {
      console.log('Nearby safety scores:', data)
      if (data.scores) {
        setSafetyScores(data.scores)
      }
    })

    // Listen for safety statistics
    socketRef.current.on('admin:safety-stats', (data) => {
      console.log('Safety stats:', data)
      setSafetyStats(data)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch videos when a user is selected
  useEffect(() => {
    if (selectedUser) {
      const userId = selectedUser.userId || selectedUser._id || selectedUser.id
      if (userId && socketRef.current?.connected) {
        setVideosLoading(true)
        setVideos([]) // Clear previous videos
        socketRef.current.emit('admin:get-videos-by-user', { userId, page: 1, limit: 20 })
      }
    }
  }, [selectedUser])

  // Fetch videos when an alert is selected
  useEffect(() => {
    if (selectedAlert) {
      const alertId = selectedAlert.id || selectedAlert.alertId || selectedAlert._id
      if (alertId && socketRef.current?.connected) {
        setVideosLoading(true)
        setVideos([]) // Clear previous videos
        socketRef.current.emit('admin:get-videos-by-alert', { alertId })
      }
    }
  }, [selectedAlert])

  // Update markers when mapLoaded changes - request fresh data when map is ready
  useEffect(() => {
    if (mapLoaded && socketRef.current?.connected) {
      console.log('Map loaded, requesting all locations...')
      // Request fresh data when map is ready - this will create markers for all users
      socketRef.current.emit('admin:get-all-locations', {})
    }
  }, [mapLoaded])
  
  // Create markers for users that exist in state but don't have markers yet
  useEffect(() => {
    if (!mapLoaded || !map.current) return
    
    // Check for users without markers
    Object.entries(users).forEach(([userId, user]) => {
      if (!markersRef.current[userId] && user.longitude && user.latitude) {
        console.log('Creating missing marker for user:', user.name || userId)
        updateUserMarkerRef.current?.(user)
      }
    })
  }, [mapLoaded, users])

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      Object.keys(markersRef.current).forEach(userId => {
        if (markersRef.current[userId]) {
          markersRef.current[userId].remove()
        }
      })
      markersRef.current = {}
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (map.current) return

    // Check WebGL support first
    if (!checkWebGLSupport()) {
      setMapError({
        title: 'WebGL Not Available',
        message: 'Your browser does not support WebGL or it is disabled.',
        solutions: [
          'Enable hardware acceleration in browser settings',
          'Update your graphics drivers',
          'Try a different browser (Chrome, Firefox, Edge)',
          'Visit chrome://gpu to check WebGL status'
        ]
      })
      return
    }

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: lightStyle,
        center: [78.9629, 20.5937], // Center of India
        zoom: 5,
        pitch: 45,
        bearing: 0,
        antialias: true
      })
    } catch (error) {
      setMapError({
        title: 'Map Initialization Failed',
        message: error.message || 'Failed to initialize the map.',
        solutions: [
          'Check if the tile server is accessible',
          'Ensure WebGL is enabled in your browser',
          'Try refreshing the page'
        ]
      })
      return
    }

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right')
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left')
    map.current.addControl(new maplibregl.FullscreenControl(), 'bottom-right')

    map.current.on('load', () => {
      setMapLoaded(true)
      
      // Start water animation
      let animationFrame
      const animateWater = () => {
        if (!map.current) return
        
        const time = performance.now() / 1000
        
        // Create more visible color animation
        const r = Math.floor(100 + Math.sin(time * 0.5) * 20)
        const g = Math.floor(180 + Math.sin(time * 0.7 + 1) * 25)
        const b = Math.floor(220 + Math.sin(time * 0.6 + 2) * 20)
        const waterColor = `rgb(${r}, ${g}, ${b})`
        
        // Secondary wave color
        const r2 = Math.floor(140 + Math.sin(time * 0.6 + 1) * 30)
        const g2 = Math.floor(200 + Math.sin(time * 0.8) * 25)
        const b2 = Math.floor(240 + Math.sin(time * 0.5 + 2) * 15)
        const wave1Color = `rgb(${r2}, ${g2}, ${b2})`
        
        // Animate opacities too
        const wave1Opacity = 0.5 + Math.sin(time * 1.0) * 0.3
        const wave2Opacity = 0.4 + Math.sin(time * 0.8 + 1.5) * 0.25
        const highlightOpacity = 0.15 + Math.sin(time * 1.5 + 3) * 0.15
        
        try {
          map.current.setPaintProperty('water-base', 'fill-color', waterColor)
          map.current.setPaintProperty('water-wave-1', 'fill-color', wave1Color)
          map.current.setPaintProperty('water-wave-1', 'fill-opacity', wave1Opacity)
          map.current.setPaintProperty('water-wave-2', 'fill-opacity', wave2Opacity)
          map.current.setPaintProperty('water-highlight', 'fill-opacity', highlightOpacity)
        } catch {
          // Layer might not exist yet
        }
        
        animationFrame = requestAnimationFrame(animateWater)
      }
      
      animateWater()
      
      // Store cleanup function
      map.current._waterAnimation = () => {
        if (animationFrame) cancelAnimationFrame(animationFrame)
      }
    })

    // Update stats on move
    map.current.on('move', () => {
      const center = map.current.getCenter()
      setMapStats({
        zoom: map.current.getZoom().toFixed(2),
        center: { lng: center.lng.toFixed(4), lat: center.lat.toFixed(4) },
        pitch: map.current.getPitch().toFixed(0),
        bearing: map.current.getBearing().toFixed(0)
      })
    })

    return () => {
      if (map.current) {
        // Stop water animation
        if (map.current._waterAnimation) {
          map.current._waterAnimation()
        }
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Toggle UI theme (map stays light)
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme)
  }

  // Reset view
  const resetView = () => {
    if (map.current) {
      map.current.flyTo({
        center: [78.9629, 20.5937],
        zoom: 5,
        pitch: 45,
        bearing: 0,
        duration: 2000
      })
    }
  }

  // Close user detail panel
  const closeUserDetail = () => {
    setSelectedUser(null)
    setUserLocationHistory([])
  }

  // Subscribe to user updates
  const subscribeToUser = (userId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('admin:subscribe-user', { userId })
    }
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString()
  }

  // Get relative time
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'N/A'
    const now = new Date()
    const then = new Date(timestamp)
    const diff = Math.floor((now - then) / 1000) // in seconds
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  // Resolve an alert
  const resolveAlert = (alertId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('admin:resolve-alert', { alertId })
      // Optimistically remove from list
      setAlerts(prev => prev.filter(a => a.id !== alertId && a.alertId !== alertId))
      if (selectedAlert && (selectedAlert.id === alertId || selectedAlert.alertId === alertId)) {
        setSelectedAlert(null)
      }
    }
  }

  // Focus on alert location
  const focusOnAlert = (alert) => {
    if (alert.location && map.current) {
      const { latitude, longitude } = alert.location
      if (latitude && longitude) {
        map.current.flyTo({
          center: [longitude, latitude],
          zoom: 16,
          duration: 1500
        })
      }
    }
  }

  // Get alert icon class
  const getAlertIconClass = (type) => {
    switch (type) {
      case 'sos': return 'icon-sos'
      case 'low-battery': 
      case 'low_battery': return 'icon-battery'
      case 'location-stopped': return 'icon-location'
      case 'geofence': 
      case 'enter_restricted_geofence': return 'icon-geofence'
      default: return 'icon-alert'
    }
  }

  // Get alert priority color class
  const getAlertPriorityClass = (priority) => {
    switch (priority) {
      case 'critical': return 'priority-critical'
      case 'warning': return 'priority-warning'
      case 'info': return 'priority-info'
      default: return 'priority-default'
    }
  }

  // Get alert counts by priority
  const alertCounts = {
    critical: alerts.filter(a => a.priority === 'critical' || a.type === 'sos').length,
    warning: alerts.filter(a => a.priority === 'warning' || a.type === 'low-battery').length,
    total: alerts.length
  }

  // ========== VIDEO FUNCTIONS ==========
  
  // Fetch all videos with optional filters
  const fetchVideos = (options = {}) => {
    if (socketRef.current?.connected) {
      setVideosLoading(true)
      socketRef.current.emit('admin:get-all-videos', {
        page: options.page || 1,
        limit: options.limit || 10,
        userId: options.userId,
        alertId: options.alertId,
        sortBy: options.sortBy || 'createdAt',
        order: options.order || 'desc'
      })
    }
  }

  // Fetch video by ID (for detailed view)
  // eslint-disable-next-line no-unused-vars
  const fetchVideoById = (videoId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('admin:get-video', { videoId })
    }
  }

  // Fetch videos by user
  const fetchVideosByUser = (userId, page = 1, limit = 10) => {
    if (socketRef.current?.connected) {
      setVideosLoading(true)
      socketRef.current.emit('admin:get-videos-by-user', { userId, page, limit })
    }
  }

  // Fetch videos by alert
  const fetchVideosByAlert = (alertId) => {
    if (socketRef.current?.connected) {
      setVideosLoading(true)
      socketRef.current.emit('admin:get-videos-by-alert', { alertId })
    }
  }

  // Fetch video statistics
  const fetchVideoStats = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('admin:get-video-stats', {})
    }
  }

  // Delete a video
  const deleteVideo = (videoId) => {
    if (socketRef.current?.connected && confirm('Are you sure you want to delete this video?')) {
      socketRef.current.emit('admin:delete-video', { videoId })
    }
  }

  // Bulk delete videos (for admin actions)
  // eslint-disable-next-line no-unused-vars
  const bulkDeleteVideos = (videoIds) => {
    if (socketRef.current?.connected && confirm(`Are you sure you want to delete ${videoIds.length} videos?`)) {
      socketRef.current.emit('admin:bulk-delete-videos', { videoIds })
    }
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  // Format video duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Clear video filter and show all videos
  const clearVideoFilter = () => {
    setVideoFilterContext(null)
    fetchVideos()
  }

  return (
    <div className={`app-container ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}>
      {/* Full Screen Map */}
      <div ref={mapContainer} className="map-container" />

      {/* Route Controls - Shows when route is visible */}
      {showUserRoute && (
        <div className="route-controls">
          <button 
            className="clear-route-btn"
            onClick={() => {
              if (map.current) {
                const sourceId = 'user-route-source'
                const layerId = 'user-route-layer'
                const pointsLayerId = 'user-route-points'
                const arrowsLayerId = 'user-route-arrows'
                if (map.current.getLayer(arrowsLayerId)) map.current.removeLayer(arrowsLayerId)
                if (map.current.getLayer(layerId)) map.current.removeLayer(layerId)
                if (map.current.getLayer(pointsLayerId)) map.current.removeLayer(pointsLayerId)
                if (map.current.getSource(sourceId)) map.current.removeSource(sourceId)
                setShowUserRoute(false)
              }
            }}
          >
            <span className="icon">✕</span>
            Clear Route
          </button>
        </div>
      )}

      {/* Control Buttons - Bottom Left */}
      <div className="bottom-left-controls">
        <button 
          className={`control-btn geofence-btn ${showGeofencePanel ? 'active' : ''}`}
          onClick={() => {
            setShowGeofencePanel(!showGeofencePanel)
            if (!showGeofencePanel) {
              fetchGeofences()
              fetchGeofenceStats()
            }
          }}
          title="Geofence Management"
        >
          <span className="btn-icon">⬡</span>
          <span className="btn-label">Geofences</span>
        </button>
        <div className="control-btn-group">
          <div className="connection-indicator">
            <span className={`status-dot ${socketConnected ? 'online' : 'offline'}`}></span>
            <span>{socketConnected ? 'Live' : 'Offline'}</span>
          </div>
          <button 
            className="control-btn-item" 
            onClick={() => setShowMapThemeSelector(!showMapThemeSelector)} 
            title="Map Themes"
          >
            🎨
          </button>
          <button className="control-btn-item" onClick={toggleTheme} title={isDarkTheme ? 'Light Mode' : 'Dark Mode'}>
            {isDarkTheme ? '☀️' : '🌙'}
          </button>
          <button className="control-btn-item" onClick={resetView} title="Reset View">
            ⌖
          </button>
          <button 
            className="control-btn-item" 
            onClick={() => socketRef.current?.emit('admin:get-all-locations', {})}
            title="Refresh Users"
          >
            ↻
          </button>
        </div>

        {/* Map Theme Selector */}
        {showMapThemeSelector && (
          <div className="map-theme-selector">
            <div className="theme-selector-header">
              <span>🎨 Map Themes</span>
              <button onClick={() => setShowMapThemeSelector(false)}>✕</button>
            </div>
            <div className="theme-options">
              {Object.entries(mapThemes).map(([key, theme]) => (
                <button
                  key={key}
                  className={`theme-option ${mapTheme === key ? 'active' : ''}`}
                  onClick={() => {
                    setMapTheme(key)
                    if (map.current) {
                      map.current.setStyle(theme.style)
                      // Re-add geofences after style loads
                      map.current.once('style.load', () => {
                        // Trigger geofence redraw by toggling the state
                        setShowGeofencesOnMap(false)
                        setTimeout(() => setShowGeofencesOnMap(true), 100)
                      })
                    }
                    setShowMapThemeSelector(false)
                  }}
                  title={theme.name}
                >
                  <div className="theme-preview" style={{ background: theme.preview }}></div>
                  <span className="theme-icon">{theme.icon}</span>
                  <span className="theme-name">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Compact Map Info - Bottom Left Corner */}
      <div className="map-info-compact">
        <span>{mapStats.center.lat}°, {mapStats.center.lng}°</span>
        <span>Z:{mapStats.zoom}</span>
        <span>P:{mapStats.pitch}°</span>
        <span>B:{mapStats.bearing}°</span>
      </div>

      {/* Users List Panel - Left Side */}
      <div className="users-list-panel">
        <div className="panel-header">
          <h3>Tracked Users</h3>
          <span className="user-count">{Object.keys(users).length}</span>
        </div>
        <div className="users-list">
          {Object.entries(users).map(([userId, user]) => (
            <div 
              key={userId} 
              className={`user-list-item ${selectedUser?.userId === userId ? 'selected' : ''} ${user.isOnline === false ? 'inactive' : ''}`}
              onClick={() => handleUserClick(userId)}
            >
              <div className="user-list-avatar">
                <img 
                  src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=4f46e5&color=fff&size=32`}
                  alt={user.name || 'User'}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=4f46e5&color=fff&size=32`
                  }}
                />
                <span className={`user-status-dot ${user.isOnline !== false ? 'active' : 'inactive'}`}></span>
              </div>
              <div className="user-list-info">
                <span className="user-list-name">{user.name || 'Unknown User'}</span>
                <span className={`user-list-status ${user.isOnline !== false ? 'online' : 'offline'}`}>
                  {user.isOnline !== false ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ))}
          {Object.keys(users).length === 0 && (
            <div className="no-users-message">
              <p>No users being tracked</p>
              <p className="hint">Users will appear when they share their location</p>
            </div>
          )}
        </div>
      </div>

      {/* Alerts Panel - Fixed Top Right */}
      <div className={`alerts-panel ${alertCounts.critical > 0 ? 'has-critical' : ''}`}>
        <div className="alerts-header">
          <h3>Alerts {alertCounts.total > 0 && <span className="alert-count-badge">{alertCounts.total}</span>}</h3>
          <button 
            className="icon-btn"
            onClick={() => socketRef.current?.emit('admin:get-active-alerts', {})}
            title="Refresh Alerts"
          >
            ↻
          </button>
        </div>
        
        {/* Alert Stats */}
        <div className="alerts-stats">
          <div className="alert-stat critical">
            <span className="stat-count">{alertCounts.critical}</span>
            <span className="stat-label">Critical</span>
          </div>
          <div className="alert-stat warning">
            <span className="stat-count">{alertCounts.warning}</span>
            <span className="stat-label">Warning</span>
          </div>
          <div className="alert-stat total">
            <span className="stat-count">{alertCounts.total}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>

        {/* Alerts List */}
        <div className="alerts-list">
          {alerts.length === 0 ? (
            <div className="no-alerts-message">
              <div className="check-icon">✓</div>
              <p>No active alerts</p>
              <p className="hint">All clear! New alerts will appear here.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id || alert.alertId}
                className={`alert-item ${getAlertPriorityClass(alert.priority)} ${selectedAlert?.id === alert.id ? 'selected' : ''}`}
                onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
              >
                <div className={`alert-icon ${getAlertIconClass(alert.type)}`}></div>
                <div className="alert-content">
                  <div className="alert-title">
                    {alert.type === 'sos' && 'SOS Emergency'}
                    {(alert.type === 'low-battery' || alert.type === 'low_battery') && 'Low Battery'}
                    {alert.type === 'location-stopped' && 'Location Stopped'}
                    {(alert.type === 'geofence' || alert.type === 'enter_restricted_geofence') && 'Restricted Zone Alert'}
                    {!['sos', 'low-battery', 'low_battery', 'location-stopped', 'geofence', 'enter_restricted_geofence'].includes(alert.type) && 'Alert'}
                  </div>
                  <div className="alert-user">
                    {alert.user?.name || 'Unknown User'}
                  </div>
                  <div className="alert-time">
                    {getRelativeTime(alert.timestamp || alert.receivedAt)}
                  </div>
                </div>
                <div className="alert-item-actions">
                  {alert.location && (
                    <button 
                      className="mini-btn focus"
                      onClick={(e) => {
                        e.stopPropagation()
                        focusOnAlert(alert)
                      }}
                      title="Focus on map"
                    >
                      ◎
                    </button>
                  )}
                  <button 
                    className="mini-btn resolve"
                    onClick={(e) => {
                      e.stopPropagation()
                      resolveAlert(alert.alertId || alert.id)
                    }}
                    title="Resolve alert"
                  >
                    ✓
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Alert Detail Panel - Shows when an alert is selected */}
      {selectedAlert && (
        <div className="alert-detail-panel">
          <button className="close-btn" onClick={() => setSelectedAlert(null)}>×</button>
          
          {/* Left Side - Alert Header */}
          <div className="alert-detail-left">
            <div className={`alert-detail-icon ${getAlertPriorityClass(selectedAlert.priority)} ${getAlertIconClass(selectedAlert.type)}`}></div>
            <h2>
              {selectedAlert.type === 'sos' && 'SOS Emergency'}
              {(selectedAlert.type === 'low-battery' || selectedAlert.type === 'low_battery') && 'Low Battery'}
              {selectedAlert.type === 'location-stopped' && 'Location Stopped'}
              {(selectedAlert.type === 'geofence' || selectedAlert.type === 'enter_restricted_geofence') && 'Restricted Zone'}
              {!['sos', 'low-battery', 'low_battery', 'location-stopped', 'geofence', 'enter_restricted_geofence'].includes(selectedAlert.type) && 'Alert'}
            </h2>
            <span className={`alert-priority-badge ${getAlertPriorityClass(selectedAlert.priority)}`}>
              {selectedAlert.priority || 'info'}
            </span>
            
            {/* User Card */}
            <div className="alert-user-card">
              <img 
                src={selectedAlert.user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAlert.user?.name || 'User')}&background=ef4444&color=fff&size=48`}
                alt={selectedAlert.user?.name || 'User'}
                className="alert-user-avatar"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAlert.user?.name || 'User')}&background=ef4444&color=fff&size=48`
                }}
              />
              <span className="user-name">{selectedAlert.user?.name || 'Unknown User'}</span>
              {selectedAlert.user?.phone && <span className="user-contact">{selectedAlert.user.phone}</span>}
            </div>

            {/* Actions */}
            <div className="alert-detail-actions">
              {selectedAlert.location && (
                <button className="action-btn primary" onClick={() => focusOnAlert(selectedAlert)}>
                  <span className="icon">◎</span> Focus Map
                </button>
              )}
              {selectedAlert.user?.phone && (
                <a href={`tel:${selectedAlert.user.phone}`} className="action-btn call">
                  <span className="icon">✆</span> Call User
                </a>
              )}
              {selectedAlert.user?.id && (
                <button className="action-btn" onClick={() => { handleUserClick(selectedAlert.user.id); setSelectedAlert(null); }}>
                  <span className="icon">●</span> View User
                </button>
              )}
              <button className="action-btn resolve" onClick={() => resolveAlert(selectedAlert.alertId || selectedAlert.id)}>
                <span className="icon">✓</span> Resolve
              </button>
            </div>
          </div>

          {/* Right Side - Details Grid */}
          <div className="alert-detail-right">
            {/* Row 1: Alert Info */}
            <div className="info-row">
              <div className="info-block">
                <span className="info-label">Alert ID</span>
                <span className="info-value mono">{selectedAlert.alertId || selectedAlert.id}</span>
              </div>
              <div className="info-block">
                <span className="info-label">Type</span>
                <span className="info-value">{selectedAlert.type?.replace(/_/g, ' ').replace(/-/g, ' ')}</span>
              </div>
              <div className="info-block">
                <span className="info-label">Status</span>
                <span className={`info-value status-${selectedAlert.status || 'active'}`}>{selectedAlert.status || 'active'}</span>
              </div>
              <div className="info-block">
                <span className="info-label">Time</span>
                <span className="info-value">{getRelativeTime(selectedAlert.timestamp || selectedAlert.receivedAt)}</span>
              </div>
            </div>

            {/* Row 2: Location & Battery */}
            <div className="info-row">
              {selectedAlert.location && (
                <>
                  <div className="info-block wide">
                    <span className="info-label">Coordinates</span>
                    <span className="info-value mono">
                      {selectedAlert.location.latitude?.toFixed(6)}, {selectedAlert.location.longitude?.toFixed(6)}
                    </span>
                  </div>
                  {selectedAlert.location.accuracy && (
                    <div className="info-block">
                      <span className="info-label">Accuracy</span>
                      <span className="info-value">{Math.round(selectedAlert.location.accuracy)} m</span>
                    </div>
                  )}
                </>
              )}
              {(selectedAlert.battery !== undefined || selectedAlert.batteryLevel !== undefined) && (
                <div className="info-block">
                  <span className="info-label">Battery</span>
                  <span className={`info-value ${(selectedAlert.battery || selectedAlert.batteryLevel) <= 20 ? 'danger' : ''}`}>
                    {selectedAlert.battery ?? selectedAlert.batteryLevel}%
                  </span>
                </div>
              )}
              {selectedAlert.location?.altitude !== undefined && selectedAlert.location?.altitude !== null && (
                <div className="info-block">
                  <span className="info-label">Altitude</span>
                  <span className="info-value">{Math.round(selectedAlert.location.altitude)} m</span>
                </div>
              )}
              {selectedAlert.location?.speed !== undefined && selectedAlert.location?.speed !== null && (
                <div className="info-block">
                  <span className="info-label">Speed</span>
                  <span className="info-value">{(selectedAlert.location.speed * 3.6).toFixed(1)} km/h</span>
                </div>
              )}
            </div>

            {/* Row 3: Message/Reason if exists */}
            {(selectedAlert.message || selectedAlert.reason || selectedAlert.geofenceName) && (
              <div className="info-row message-row">
                {selectedAlert.message && (
                  <div className="info-block full">
                    <span className="info-label">Emergency Message</span>
                    <span className="info-value message">{selectedAlert.message}</span>
                  </div>
                )}
                {selectedAlert.reason && (
                  <div className="info-block full">
                    <span className="info-label">Reason</span>
                    <span className="info-value">{selectedAlert.reason}</span>
                  </div>
                )}
                {selectedAlert.geofenceName && (
                  <div className="info-block full">
                    <span className="info-label">Geofence Zone</span>
                    <span className="info-value">{selectedAlert.geofenceName}</span>
                  </div>
                )}
              </div>
            )}

            {/* Row 4: Additional Info */}
            <div className="info-row">
              <div className="info-block">
                <span className="info-label">Received At</span>
                <span className="info-value">{formatTime(selectedAlert.receivedAt || selectedAlert.timestamp)}</span>
              </div>
              {selectedAlert.user?.id && (
                <div className="info-block">
                  <span className="info-label">User ID</span>
                  <span className="info-value mono">{selectedAlert.user.id}</span>
                </div>
              )}
              {selectedAlert.user?.email && (
                <div className="info-block wide">
                  <span className="info-label">Email</span>
                  <span className="info-value">{selectedAlert.user.email}</span>
                </div>
              )}
            </div>

            {/* Row 5: Related Videos */}
            <div className="info-row videos-row">
              <div className="info-block full">
                <span className="info-label">
                  Related Videos {videos.length > 0 && <span className="count-badge">{videos.length}</span>}
                </span>
                <div className="embedded-videos-list">
                  {videosLoading ? (
                    <div className="videos-loading-inline">
                      <div className="loading-spinner-small"></div>
                      <span>Loading videos...</span>
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="no-videos-inline">No videos related to this alert</div>
                  ) : (
                    videos.slice(0, 10).map((video) => (
                      <div key={video.id} className="embedded-video-item">
                        <div className="video-thumb-tiny">
                          {video.thumbnailURL ? (
                            <img src={`${SERVER_URL}${video.thumbnailURL}`} alt="Thumb" />
                          ) : (
                            <span>🎬</span>
                          )}
                          {video.duration && <span className="duration">{formatDuration(video.duration)}</span>}
                        </div>
                        <div className="video-info-tiny">
                          <span className="user">{video.user?.name || 'Unknown'}</span>
                          <span className="time">{getRelativeTime(video.createdAt)}</span>
                        </div>
                        <button 
                          onClick={() => setSelectedVideo(video)}
                          className="play-btn-tiny"
                          title="Play Video"
                        >
                          ▶
                        </button>
                      </div>
                    ))
                  )}
                  {videos.length > 10 && (
                    <div className="more-videos-note">+{videos.length - 10} more videos</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* User Detail Panel - Shows when a user is selected */}
      {selectedUser && (
        <div className="user-detail-panel">
          <button className="close-btn" onClick={closeUserDetail}>×</button>
          
          {/* Left Side - User Summary */}
          <div className="user-detail-left">
            <div className="user-detail-avatar">
              <img 
                src={selectedUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || 'User')}&background=4f46e5&color=fff&size=80`}
                alt={selectedUser.name || 'User'}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || 'User')}&background=4f46e5&color=fff&size=80`
                }}
              />
            </div>
            <h2>{selectedUser.name || 'Unknown User'}</h2>
            <span className={`user-status-badge ${selectedUser.isOnline !== false ? 'active' : 'inactive'}`}>
              {selectedUser.isOnline !== false ? 'Online' : 'Offline'}
            </span>
            
            {/* Quick Stats Card */}
            <div className="user-quick-stats">
              <div className="quick-stat">
                <span className="stat-icon battery"></span>
                <span className={`stat-value ${(selectedUser.battery <= 20) ? 'danger' : ''}`}>
                  {selectedUser.battery ? `${Math.round(selectedUser.battery)}%` : 'N/A'}
                </span>
                <span className="stat-label">Battery</span>
              </div>
              <div className="quick-stat">
                <span className="stat-icon accuracy"></span>
                <span className="stat-value">{selectedUser.accuracy ? `${Math.round(selectedUser.accuracy)}m` : 'N/A'}</span>
                <span className="stat-label">Accuracy</span>
              </div>
              <div className="quick-stat">
                <span className="stat-icon speed"></span>
                <span className="stat-value">{selectedUser.speed ? Math.round(selectedUser.speed) : '0'}</span>
                <span className="stat-label">km/h</span>
              </div>
            </div>

            {/* Actions */}
            <div className="user-detail-actions">
              <button 
                className="action-btn primary" 
                onClick={() => {
                  if (selectedUser.longitude && selectedUser.latitude && map.current) {
                    map.current.flyTo({
                      center: [selectedUser.longitude, selectedUser.latitude],
                      zoom: 17,
                      duration: 1500
                    })
                  }
                }}
              >
                <span className="icon">◎</span> Focus Map
              </button>
              {(selectedUser.phone || selectedUser.phoneNumber) && (
                <a href={`tel:${selectedUser.phone || selectedUser.phoneNumber}`} className="action-btn call">
                  <span className="icon">✆</span> Call User
                </a>
              )}
              <button className="action-btn" onClick={() => subscribeToUser(selectedUser.userId)}>
                <span className="icon">◉</span> Subscribe
              </button>
              {userLocationHistory.length >= 2 && (
                <button 
                  className={`action-btn route ${showUserRoute ? 'active' : ''}`} 
                  onClick={toggleUserRoute}
                >
                  <span className="icon">↝</span> {showUserRoute ? 'Hide Location History' : 'View Location History'}
                </button>
              )}
            </div>
          </div>

          {/* Right Side - Details Grid */}
          <div className="user-detail-right">
            {/* Row 1: Basic Info */}
            <div className="info-row">
              <div className="info-block">
                <span className="info-label">User ID</span>
                <span className="info-value mono">{selectedUser.userId || 'N/A'}</span>
              </div>
              <div className="info-block">
                <span className="info-label">Status</span>
                <span className={`info-value ${selectedUser.isOnline !== false ? 'status-online' : 'status-offline'}`}>
                  {selectedUser.isOnline !== false ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="info-block">
                <span className="info-label">Last Updated</span>
                <span className="info-value">{formatTime(selectedUser.lastUpdated || selectedUser.timestamp)}</span>
              </div>
            </div>

            {/* Row 2: Contact Info */}
            <div className="info-row">
              <div className="info-block wide">
                <span className="info-label">Email</span>
                <span className="info-value">{selectedUser.email || 'N/A'}</span>
              </div>
              <div className="info-block">
                <span className="info-label">Phone</span>
                <span className="info-value">{selectedUser.phone || selectedUser.phoneNumber || 'N/A'}</span>
              </div>
            </div>

            {/* Row 3: Location Info */}
            <div className="info-row">
              <div className="info-block wide">
                <span className="info-label">Coordinates</span>
                <span className="info-value mono">
                  {selectedUser.latitude && selectedUser.longitude 
                    ? `${selectedUser.latitude?.toFixed(6)}, ${selectedUser.longitude?.toFixed(6)}`
                    : 'N/A'
                  }
                </span>
              </div>
              {selectedUser.altitude !== undefined && selectedUser.altitude !== null && (
                <div className="info-block">
                  <span className="info-label">Altitude</span>
                  <span className="info-value">{Math.round(selectedUser.altitude)} m</span>
                </div>
              )}
              {selectedUser.heading !== undefined && selectedUser.heading !== null && (
                <div className="info-block">
                  <span className="info-label">Heading</span>
                  <span className="info-value">{Math.round(selectedUser.heading)}°</span>
                </div>
              )}
            </div>

            {/* Row 4: Device Info */}
            <div className="info-row">
              {selectedUser.deviceModel && (
                <div className="info-block">
                  <span className="info-label">Device</span>
                  <span className="info-value">{selectedUser.deviceModel}</span>
                </div>
              )}
              {selectedUser.osVersion && (
                <div className="info-block">
                  <span className="info-label">OS Version</span>
                  <span className="info-value">{selectedUser.osVersion}</span>
                </div>
              )}
              {selectedUser.appVersion && (
                <div className="info-block">
                  <span className="info-label">App Version</span>
                  <span className="info-value">{selectedUser.appVersion}</span>
                </div>
              )}
              {!selectedUser.deviceModel && !selectedUser.osVersion && !selectedUser.appVersion && (
                <>
                  <div className="info-block">
                    <span className="info-label">Battery</span>
                    <span className={`info-value ${(selectedUser.battery <= 20) ? 'danger' : ''}`}>
                      {selectedUser.battery ? `${selectedUser.battery}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="info-block">
                    <span className="info-label">Speed</span>
                    <span className="info-value">{selectedUser.speed ? `${selectedUser.speed} km/h` : '0 km/h'}</span>
                  </div>
                  <div className="info-block">
                    <span className="info-label">Accuracy</span>
                    <span className="info-value">{selectedUser.accuracy ? `${Math.round(selectedUser.accuracy)} m` : 'N/A'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Row 5: Emergency Contacts if available */}
            {selectedUser.emergencyContact && (
              <div className="info-row">
                <div className="info-block wide">
                  <span className="info-label">Emergency Contact</span>
                  <span className="info-value">{selectedUser.emergencyContact.name || 'N/A'}</span>
                </div>
                <div className="info-block">
                  <span className="info-label">Emergency Phone</span>
                  <span className="info-value">{selectedUser.emergencyContact.phone || 'N/A'}</span>
                </div>
              </div>
            )}

            {/* Row 7: User Videos */}
            <div className="info-row videos-row">
              <div className="info-block full">
                <span className="info-label">
                  Videos {videos.length > 0 && <span className="count-badge">{videos.length}</span>}
                </span>
                <div className="embedded-videos-list">
                  {videosLoading ? (
                    <div className="videos-loading-inline">
                      <div className="loading-spinner-small"></div>
                      <span>Loading videos...</span>
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="no-videos-inline">No videos uploaded by this user</div>
                  ) : (
                    videos.slice(0, 10).map((video) => (
                      <div key={video.id} className="embedded-video-item">
                        <div className="video-thumb-tiny">
                          {video.thumbnailURL ? (
                            <img src={`${SERVER_URL}${video.thumbnailURL}`} alt="Thumb" />
                          ) : (
                            <span>🎬</span>
                          )}
                          {video.duration && <span className="duration">{formatDuration(video.duration)}</span>}
                        </div>
                        <div className="video-info-tiny">
                          <span className="time">{getRelativeTime(video.createdAt)}</span>
                          <span className="size">{video.fileSizeMB ? `${video.fileSizeMB} MB` : ''}</span>
                        </div>
                        <button 
                          onClick={() => setSelectedVideo(video)}
                          className="play-btn-tiny"
                          title="Play Video"
                        >
                          ▶
                        </button>
                      </div>
                    ))
                  )}
                  {videos.length > 10 && (
                    <div className="more-videos-note">+{videos.length - 10} more videos</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Detail Panel */}
      {selectedVideo && (
        <div className="video-detail-panel">
          <button className="close-btn" onClick={() => setSelectedVideo(null)}>×</button>
          
          <div className="video-detail-header">
            <div className="video-preview">
              <video 
                src={`${SERVER_URL}${selectedVideo.videoURL}`}
                poster={selectedVideo.thumbnailURL ? `${SERVER_URL}${selectedVideo.thumbnailURL}` : undefined}
                controls
                className="video-player"
              />
            </div>
          </div>

          <div className="video-detail-content">
            {/* User Info */}
            <div className="video-user-info">
              <img 
                src={selectedVideo.user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedVideo.user?.name || 'User')}&background=4f46e5&color=fff&size=40`}
                alt={selectedVideo.user?.name || 'User'}
                className="video-user-avatar"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedVideo.user?.name || 'User')}&background=4f46e5&color=fff&size=40`
                }}
              />
              <div className="video-user-details">
                <span className="name">{selectedVideo.user?.name || 'Unknown User'}</span>
                {selectedVideo.user?.email && <span className="email">{selectedVideo.user.email}</span>}
              </div>
            </div>

            {/* Video Details Grid */}
            <div className="detail-section">
              <h4>Video Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Video ID</span>
                  <span className="value video-id">{selectedVideo.id}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Duration</span>
                  <span className="value">{formatDuration(selectedVideo.duration)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">File Size</span>
                  <span className="value">{selectedVideo.fileSizeMB ? `${selectedVideo.fileSizeMB} MB` : formatFileSize(selectedVideo.fileSize)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Uploaded</span>
                  <span className="value">{formatTime(selectedVideo.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Related Alert */}
            {selectedVideo.relatedAlert && (
              <div className="detail-section">
                <h4>Related Alert</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Alert ID</span>
                    <span className="value alert-id">{selectedVideo.relatedAlert.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Type</span>
                    <span className="value">{selectedVideo.relatedAlert.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Severity</span>
                    <span className={`value severity-${selectedVideo.relatedAlert.severity}`}>{selectedVideo.relatedAlert.severity}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status</span>
                    <span className="value">{selectedVideo.relatedAlert.status}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="detail-actions">
              <a 
                href={`${SERVER_URL}${selectedVideo.videoURL}`}
                download
                className="detail-action-btn primary"
              >
                ⬇ Download
              </a>
              <button 
                className="detail-action-btn danger"
                onClick={() => {
                  deleteVideo(selectedVideo.id)
                  setSelectedVideo(null)
                }}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Geofence Management Panel */}
      {showGeofencePanel && (
        <div className="geofence-panel">
          <div className="geofence-panel-header">
            <h3>⬡ Geofence Management</h3>
            <button className="close-btn" onClick={() => setShowGeofencePanel(false)}>×</button>
          </div>
          
          <div className="geofence-panel-content">
            {/* Stats Section */}
            {geofenceStats && (
              <div className="geofence-stats">
                <div className="stat-item">
                  <span className="stat-value">{geofenceStats.total || 0}</span>
                  <span className="stat-label">Total</span>
                </div>
                <div className="stat-item active">
                  <span className="stat-value">{geofenceStats.active || 0}</span>
                  <span className="stat-label">Active</span>
                </div>
                <div className="stat-item inactive">
                  <span className="stat-value">{geofenceStats.inactive || 0}</span>
                  <span className="stat-label">Inactive</span>
                </div>
              </div>
            )}

            {/* Create/Edit Form */}
            {geofenceFormMode && (
              <div className="geofence-form">
                <h4>{geofenceFormMode === 'create' ? '➕ Create New Geofence' : '✏️ Edit Geofence'}</h4>
                <form onSubmit={handleGeofenceFormSubmit}>
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={geofenceFormData.name}
                      onChange={(e) => setGeofenceFormData({...geofenceFormData, name: e.target.value})}
                      placeholder="Geofence name"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Type</label>
                    <div className="fence-type-toggle">
                      <button
                        type="button"
                        className={`type-btn safety ${geofenceFormData.fenceType === 'safety' ? 'active' : ''}`}
                        onClick={() => setGeofenceFormData({...geofenceFormData, fenceType: 'safety'})}
                      >
                        ✓ Safety Zone
                      </button>
                      <button
                        type="button"
                        className={`type-btn restricted ${geofenceFormData.fenceType === 'restricted' ? 'active' : ''}`}
                        onClick={() => setGeofenceFormData({...geofenceFormData, fenceType: 'restricted'})}
                      >
                        🚫 Restricted Zone
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Location *</label>
                    <div className="location-picker">
                      <div className="location-inputs">
                        <input
                          type="number"
                          step="any"
                          value={geofenceFormData.latitude}
                          onChange={(e) => setGeofenceFormData({...geofenceFormData, latitude: e.target.value})}
                          placeholder="Latitude"
                          required
                        />
                        <input
                          type="number"
                          step="any"
                          value={geofenceFormData.longitude}
                          onChange={(e) => setGeofenceFormData({...geofenceFormData, longitude: e.target.value})}
                          placeholder="Longitude"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        className={`btn-pick-location ${isPickingLocation ? 'active' : ''}`}
                        onClick={() => setIsPickingLocation(!isPickingLocation)}
                      >
                        {isPickingLocation ? '📍 Click on Map...' : '🗺️ Pick on Map'}
                      </button>
                    </div>
                    {isPickingLocation && (
                      <div className="picking-hint">Click anywhere on the map to select location</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Radius: <span className="radius-value">{geofenceFormData.radius}m</span></label>
                    <div className="radius-slider-container">
                      <input
                        type="range"
                        min="50"
                        max="10000"
                        step="50"
                        value={geofenceFormData.radius}
                        onChange={(e) => setGeofenceFormData({...geofenceFormData, radius: parseInt(e.target.value)})}
                        className={`radius-slider ${geofenceFormData.fenceType}`}
                      />
                      <div className="slider-labels">
                        <span>50m</span>
                        <span>5km</span>
                        <span>10km</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={geofenceFormData.description}
                      onChange={(e) => setGeofenceFormData({...geofenceFormData, description: e.target.value})}
                      placeholder="Description (optional)"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={closeGeofenceForm}>
                      Cancel
                    </button>
                    <button type="submit" className={`btn-submit ${geofenceFormData.fenceType}`}>
                      {geofenceFormMode === 'create' ? 'Create' : 'Update'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Actions */}
            {!geofenceFormMode && (
              <div className="geofence-actions">
                <button className="btn-create" onClick={openCreateGeofenceForm}>
                  ➕ Create Geofence
                </button>
              </div>
            )}

            {/* Geofence List */}
            {!geofenceFormMode && (
              <div className="geofence-list">
                <h4>📍 Geofences ({geofences.length})</h4>
                {geofences.length === 0 ? (
                  <div className="empty-state">
                    <p>No geofences created yet</p>
                  </div>
                ) : (
                  geofences.map(geo => (
                    <div 
                      key={geo.id} 
                      className={`geofence-item ${geo.isActive ? 'active' : 'inactive'} ${geo.fenceType || 'safety'}`}
                      onClick={() => setSelectedGeofence(geo)}
                    >
                      <div className="geofence-item-header">
                        <span className={`geofence-type-badge ${geo.fenceType || 'safety'}`}>
                          {geo.fenceType === 'restricted' ? '🚫' : '✓'}
                        </span>
                        <span className="geofence-name">{geo.name}</span>
                        <span className={`status-dot ${geo.isActive ? 'active' : 'inactive'}`}></span>
                      </div>
                      <div className="geofence-item-details">
                        <span className="detail">📍 {geo.latitude?.toFixed(4)}, {geo.longitude?.toFixed(4)}</span>
                        <span className="detail">📏 {geo.radius}m</span>
                      </div>
                      <div className="geofence-item-actions">
                        <button 
                          className="btn-icon edit"
                          onClick={(e) => { e.stopPropagation(); openEditGeofenceForm(geo); }}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-icon toggle"
                          onClick={(e) => { e.stopPropagation(); toggleGeofence(geo.id, !geo.isActive); }}
                          title={geo.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {geo.isActive ? '⏸' : '▶️'}
                        </button>
                        <button 
                          className="btn-icon delete"
                          onClick={(e) => { e.stopPropagation(); deleteGeofence(geo.id); }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Status - Shows when map is loading */}
      {!mapLoaded && !mapError && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading Map Tiles...</p>
          <p className="loading-detail">Connecting to tile server at 135.235.138.50</p>
        </div>
      )}

      {/* Error Overlay - Shows when map fails to load */}
      {mapError && (
        <div className="error-overlay">
          <div className="error-content">
            <div className="error-icon">!</div>
            <h2>{mapError.title}</h2>
            <p className="error-message">{mapError.message}</p>
            <div className="error-solutions">
              <h4>Possible Solutions:</h4>
              <ul>
                {mapError.solutions.map((solution, index) => (
                  <li key={index}>{solution}</li>
                ))}
              </ul>
            </div>
            <button className="retry-btn" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App