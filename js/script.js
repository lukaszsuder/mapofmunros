'use strict';

import { munrosList } from './munroslist.js';
import {
  MAP_KEY,
  MAP_CENTER,
  MAP_MARKER_COLOR,
  MAP_MARKER_SCALE,
  MAP_STYLE,
  MAP_ZOOM,
  MAP_FLYTO_ZOOM,
  MAP_FLYTO_ZOOM_OUT,
  MAP_FLYOUT_SPEED,
} from './config.js';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
require('babel-core/register');
require('babel-polyfill');

// const munrosList = {
//   results: [],
// };

// Selectors LIBRARY
const munroSearch = document.getElementById('munroSearch');
const popUps = document.getElementsByClassName('mapboxgl-popup');
// SPINNER
const spinnerEl = document.querySelector('.spinner');
const spinnerBgEl = document.querySelector('.spinner-bg');

function spinner(para) {
  if (para === 1) {
    spinnerEl.classList.add('spinner-show');
    spinnerBgEl.classList.add('spinner-background');
  }
  if (para === 0) {
    spinnerEl.classList.remove('spinner-show');
    spinnerBgEl.classList.remove('spinner-background');
  }
}

const getMap = function () {
  mapboxgl.accessToken = MAP_KEY;
  return new mapboxgl.Map({
    container: 'map',
    style: MAP_STYLE,
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
  });
};
const map = getMap();

const renderMap = function () {
  map.on('load', () => {
    map.addSource(
      'dem',
      {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      },
      'places',
      {
        type: 'geojson',
        data: munrosList,
      }
    );
    map.addLayer(
      {
        id: 'hillshading',
        source: 'dem',
        type: 'hillshade',
      },
      'waterway-river-canal-shadow'
    );
  });
};

const renderPolyline = function (cords) {
  map.addSource('route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: cords,
      },
    },
  });
  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#000',
      'line-width': 3,
    },
  });
};

class DisplayOnMap {
  flyToMunro(currentMunro) {
    map.flyTo({
      center: [currentMunro.latlng_lng, currentMunro.latlng_lat],
      zoom: MAP_FLYTO_ZOOM,
    });
  }

  createPopUp(currentMunro) {
    /** Check if there is already a popup on the map and if so, remove it */
    if (popUps[0]) popUps[0].remove();

    // Create popup
    const popup = new mapboxgl.Popup({ closeOnClick: true })
      .setLngLat([currentMunro.latlng_lng, currentMunro.latlng_lat])
      .setHTML(
        `<h3>${currentMunro.name}</h3>
        <h4>"${currentMunro.meaning}"</h4>
        <p>Height: ${currentMunro.height} m<br>
        ${currentMunro.region}
        </p>`
      )
      .addTo(map);

    const closeBtn = document.querySelector('.mapboxgl-popup-close-button');
    closeBtn.addEventListener('click', () =>
      map.flyTo({
        //center: MAP_CENTER,
        //zoom: MAP_FLYTO_ZOOM_OUT,
        //speed: MAP_FLYOUT_SPEED,
      })
    );
  }

  addMarkers(munrosList) {
    for (const marker of munrosList.results) {
      const el = document.createElement('div');
      el.id = `marker-${marker.smcid}`;
      el.className = 'marker';

      el.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        this.flyToMunro(marker);
        this.createPopUp(marker);

        // Remove Polyline if exist
        this.removePolyline(marker.line);

        const activeItem = document.getElementsByClassName('active');

        if (activeItem[0]) {
          activeItem[0].classList.remove('active');
        }
        const listing = document.getElementById(`listing-${marker.smcid}`);
        listing.classList.add('active');

        // Set scrollbar in the centre when clicked
        listing.scrollIntoView({
          block: 'center',
        });
      });

      new mapboxgl.Marker(el, { offset: [0, -23] })
        .setLngLat([marker.latlng_lng, marker.latlng_lat])
        .addTo(map);
    }
  }

  removePolyline(el) {
    if (!map.getLayer('route')) {
      renderPolyline(el);
    } else {
      map.removeLayer('route').removeSource('route');
      renderPolyline(el);
    }
  }
}
const currentMunro = new DisplayOnMap();

let sortedArray = '';
const sortArray = function (sort, list) {
  const noResults = document.getElementById('no-results');
  if (list) {
    sortedArray = list;
    noResults.innerHTML = '';

    if (list.length === 0) {
      noResults.innerHTML = `Sorry. We couldn't find any matches`;
    }
  } else {
    sortedArray = munrosList.results.sortBy(sort);
    noResults.innerHTML = '';
  }
};
const renderList = function (sort, list = false) {
  if (sort === 'height') {
    sort = '-height';
  }

  sortArray(sort, list);

  const listings = document.getElementById('sidebar__listings');
  listings.innerHTML = '';
  for (let i = 0; i < sortedArray.length; i++) {
    const listing = listings.appendChild(document.createElement('li'));

    /* Assign the `item` class to each listing for styling. */
    listing.className = 'sidebar__listings__item';

    listing.id = `listing-${sortedArray[i].smcid}`;
    const link = listing.appendChild(document.createElement('a'));
    link.href = '#';
    link.className =
      'sidebar__listings__item__title sidebar__listings__item--click';

    link.id = `link-${sortedArray[i].smcid}`;
    link.innerHTML = `${sortedArray[i].name} `;

    //Event listner when someone click on map or click on marker
    link.addEventListener('click', function () {
      for (const feature of sortedArray) {
        if (this.id === `link-${feature.smcid}`) {
          munroSearch.value = '';
          currentMunro.flyToMunro(feature);
          currentMunro.createPopUp(feature);

          // Remove Polyline if exist
          currentMunro.removePolyline(feature.line);

          // Set scrollbar in the centre when clicked
          listing.scrollIntoView({
            block: 'center',
          });
        }
      }

      const activeItem = document.getElementsByClassName('active');
      if (activeItem[0]) {
        activeItem[0].classList.remove('active');
      }
      this.parentNode.classList.add('active');
    });

    /* Add details to the individual listing. */
    const details = listing.appendChild(document.createElement('div'));
    details.className = 'sidebar__listing__describe';
    details.innerHTML = `${sortedArray[i].height}m `;
    if (sortedArray[i].region) {
      details.innerHTML += `- ${sortedArray[i].region}`;
    }
  }
};

//Sorting function
Array.prototype.sortBy = function (p) {
  return this.slice(0).sort(function (a, b) {
    return a[p] > b[p] ? 1 : a[p] < b[p] ? -1 : 0;
  });
};

// Sort menu
const sortBtn = document.querySelector('.sidebar__sort__list');
sortBtn.addEventListener('click', function (e) {
  e.stopPropagation();
  e.preventDefault();
  const activeItem = document.getElementsByClassName(
    'sidebar__sort--link--active'
  );

  if (activeItem[0]) {
    activeItem[0].classList.remove('sidebar__sort--link--active');
  }

  const sortBtnClicked = document.getElementById(e.target.id);
  sortBtnClicked.classList.add('sidebar__sort--link--active');

  renderList(e.target.id);
});

// SEARCH

const searchBar = document.getElementById('munroSearch');
searchBar.addEventListener('keyup', function (e) {
  const searchString = e.target.value.toLowerCase();
  const filteredMunros = munrosList.results.filter(searchMunro => {
    return searchMunro.name.toLowerCase().includes(searchString);
  });

  // TUTAJ Trzeba zrobić funkcje. Ta sama ma być w gdy klikniesz na liscie w pozycje.
  document
    .querySelector('.sidebar__search [type="reset"]')
    .addEventListener('click', function () {
      this.parentNode.querySelector('input').focus();

      renderList('smcid');
    });

  renderList('smcid', filteredMunros);
});

function buildLocationList(munrosList) {
  renderList('smcid');
}

const munrosApi = async function () {
  try {
    spinner(1);
    renderMap(
      currentMunro.addMarkers(munrosList),
      buildLocationList(munrosList)
    );

    spinner(0);
  } catch (err) {
    spinner(1);
    console.error(`${err} 🔥🔥🔥🔥 munroApi ERROR`);
    throw err;
  }
};
munrosApi();
