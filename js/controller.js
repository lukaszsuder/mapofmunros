'use strict';
// USE AS SCRIPT.JS - draft version. LATER WILL BE CONTROLLER.JS

//import { munrosList } from './munroslist.js';
import icons from '../img/icons.svg';
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

const munrosList = {
  results: [],
};

// LIBRARY
const munroSearch = document.getElementById('munroSearch');

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

    //addMarkers(munrosList);
    //buildLocationList(munrosList);
  });
};

function addMarkers(munrosList) {
  /* For each feature in the GeoJSON object above: */
  for (const marker of munrosList.results) {
    /* Create a div element for the marker. */
    const el = document.createElement('div');

    /* Assign a unique `id` to the marker. */
    el.id = `marker-${marker.id}`;

    /* Assign the `marker` class to each marker for styling. */
    el.className = 'marker';

    el.addEventListener('click', e => {
      /* Fly to the point */
      flyToStore(marker);
      /* Close all other popups and display popup for clicked store */
      createPopUp(marker);
      /* Highlight listing in sidebar */
      const activeItem = document.getElementsByClassName('active');
      e.stopPropagation();
      if (activeItem[0]) {
        activeItem[0].classList.remove('active');
      }
      const listing = document.getElementById(`listing-${marker.id}`);
      listing.classList.add('active');

      // Set scrollbar in the centre when clicked
      listing.scrollIntoView({
        block: 'center',
      });
    });

    new mapboxgl.Marker(el, { offset: [0, -23] })
      .setLngLat(marker.coordinates)
      .addTo(map);
  }
}

const renderList = function (sort, list = false) {
  if (sort === 'height') {
    sort = '-height';
  }
  let sortedArray = '';
  const egoto = document.getElementById('no-results');
  const blockInput = document.getElementById('munroSearch');
  if (list) {
    sortedArray = list;
    egoto.innerHTML = '';
    blockInput.classList.remove('no-results');
    if (list.length === 0) {
      blockInput.classList.add('no-results');
      egoto.innerHTML = `Sorry. We couldn't find any matches`;
    }
  } else {
    sortedArray = munrosList.results.sortBy(sort);

    blockInput.classList.remove('no-results');
    egoto.innerHTML = '';
  }
  const listings = document.getElementById('sidebar__listings');

  listings.innerHTML = '';

  for (let i = 0; i < sortedArray.length; i++) {
    const listing = listings.appendChild(document.createElement('li'));

    /* Assign the `item` class to each listing for styling. */
    listing.className = 'sidebar__listings__item';

    listing.id = `listing-${sortedArray[i].id}`;
    const link = listing.appendChild(document.createElement('a'));
    link.href = '#';
    link.className =
      'sidebar__listings__item__title sidebar__listings__item--click';

    link.id = `link-${sortedArray[i].id}`;
    link.innerHTML = `${sortedArray[i].name} `;

    //Event listner when someone click on map or click
    link.addEventListener('click', function () {
      for (const feature of sortedArray) {
        if (this.id === `link-${feature.id}`) {
          munroSearch.value = '';
          flyToStore(feature);
          createPopUp(feature);
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
const getSort = document.querySelector('.sidebar__sort__list');
getSort.addEventListener('click', function (e) {
  e.stopPropagation();
  e.preventDefault();
  const activeItem = document.getElementsByClassName(
    'sidebar__sort--link--active'
  );

  if (activeItem[0]) {
    activeItem[0].classList.remove('sidebar__sort--link--active');
  }

  const clicked = document.getElementById(e.target.id);
  clicked.classList.add('sidebar__sort--link--active');

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

      renderList('id');
    });

  renderList('id', filteredMunros);
});

function buildLocationList(munrosList) {
  renderList('id');
}

function flyToStore(currentMunro) {
  map.flyTo({
    center: currentMunro.coordinates,
    zoom: MAP_FLYTO_ZOOM,
  });
}

function createPopUp(currentMunro) {
  const popUps = document.getElementsByClassName('mapboxgl-popup');
  /** Check if there is already a popup on the map and if so, remove it */
  if (popUps[0]) popUps[0].remove();

  // Create popup
  const popup = new mapboxgl.Popup({ closeOnClick: true })
    .setLngLat(currentMunro.coordinates)
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

const munrosApi = async function () {
  try {
    // Spinner ADD
    spinner(1);
    const fetchUrl = fetch('https://munroapi.herokuapp.com/munros');
    const results = await fetchUrl;

    if (!results.ok) {
      return;
    } else {
      // Spinner REMOVE
      spinner(0);
      const data = await results.json();

      // *** Creating munrosList Array from fetched data.

      let createId = 0;
      munrosList.results = data.map(received => {
        createId++;

        return {
          id: createId,
          name: received.name,
          height: received.height,
          coordinates: [received.latlng_lng, received.latlng_lat],
          meaning: received.meaning,
          region: received.region,
        };
      });

      renderMap(addMarkers(munrosList), buildLocationList(munrosList));
    }
  } catch (err) {
    console.error(`${err} 🔥🔥🔥🔥 munroApi ERROR`);
    throw err;
  }
};
munrosApi();
