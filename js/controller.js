// DO ZROBIENIA
/*
Gdy klikne na mape to scroolbar ustawia się w tym samym miejscu.
List się podswietla tylko jak  ustawić scrolowanie na dany PublicKeyCredential. Na srodek listy
*/
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

// Get spinner and spinner background
const spinnerEl = document.querySelector('.spinner');
const spinnerBgEl = document.querySelector('.spinner-bg');

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

function buildLocationList(munrosList) {
  //////////////////////////
  //// SEARCHING

  const lookingFor = 'Ben';
  const founded = munrosList.results.filter(el => el.name.includes(lookingFor));

  ///////////////////////////////
  //  END SEARCHING

  //Sorting function
  Array.prototype.sortBy = function (p) {
    return this.slice(0).sort(function (a, b) {
      return a[p] > b[p] ? 1 : a[p] < b[p] ? -1 : 0;
    });
  };

  const renderList = function (sort) {
    if (sort === 'height') {
      sort = '-height';
    }
    const sortedArray = munrosList.results.sortBy(sort);
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
  renderList('id');

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

// 05.12.2021
// Wersja działająca.
// Kopia zapasowa przed umieszczaniem reszty w funkcjach i klasach

// 'use strict';
// // USE AS SCRIPT.JS - draft version. LATER WILL BE CONTROLLER.JS

// //import { munrosList } from './munroslist.js';
// import icons from '../img/icons.svg';
// import {
//   MAP_KEY,
//   MAP_CENTER,
//   MAP_MARKER_COLOR,
//   MAP_MARKER_SCALE,
//   MAP_STYLE,
//   MAP_ZOOM,
//   MAP_FLYTO_ZOOM,
//   MAP_FLYTO_ZOOM_OUT,
//   MAP_FLYOUT_SPEED,
// } from './config.js';

// import mapboxgl from 'mapbox-gl';
// import 'mapbox-gl/dist/mapbox-gl.css';

// require('babel-core/register');
// require('babel-polyfill');

// const munrosList = {
//   results: [],
// };

// // Get spinner and spinner background
// const spinner = document.querySelector('.spinner');
// const spinnerBg = document.querySelector('.spinner-bg');

// const munrosApi = async function () {
//   try {
//     // Spinner ADD
//     spinner.classList.add('spinner-show');
//     spinnerBg.classList.add('spinner-background');
//     const fetchUrl = fetch('https://munroapi.herokuapp.com/munros');

//     const results = await fetchUrl;

//     if (!results.ok) {
//       return;
//     } else {
//       // Spinner REMOVE
//       spinner.classList.remove('spinner-show');
//       spinnerBg.classList.remove('spinner-background');

//       const data = await results.json();

//       let createId = 0;

//       munrosList.results = data.map(received => {
//         createId++;

//         return {
//           id: createId,
//           name: received.name,
//           height: received.height,
//           coordinates: [received.latlng_lng, received.latlng_lat],
//           meaning: received.meaning,
//           region: received.region,
//         };
//       });

//       // Loading Main map
//       mapboxgl.accessToken = MAP_KEY;
//       const map = new mapboxgl.Map({
//         container: 'map',
//         style: MAP_STYLE,
//         center: MAP_CENTER,
//         zoom: MAP_ZOOM,
//       });

//       const stores = {
//         type: 'FeatureCollection',
//         features: [],
//       };

//       map.on('load', () => {
//         map.addSource(
//           'dem',
//           {
//             type: 'raster-dem',
//             url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
//           },
//           'places',
//           {
//             type: 'geojson',
//             data: stores,
//           }
//         );
//         map.addLayer(
//           {
//             id: 'hillshading',
//             source: 'dem',
//             type: 'hillshade',
//           },
//           'waterway-river-canal-shadow'
//         );
//         addMarkers(munrosList);
//         buildLocationList(munrosList);
//       });

//       function addMarkers(munros) {
//         /* For each feature in the GeoJSON object above: */
//         for (const marker of munros.results) {
//           /* Create a div element for the marker. */

//           const el = document.createElement('div');

//           /* Assign a unique `id` to the marker. */
//           el.id = `marker-${marker.id}`;

//           /* Assign the `marker` class to each marker for styling. */
//           el.className = 'marker';

//           el.addEventListener('click', e => {
//             /* Fly to the point */
//             flyToStore(marker);
//             /* Close all other popups and display popup for clicked store */
//             createPopUp(marker);
//             /* Highlight listing in sidebar */
//             const activeItem = document.getElementsByClassName('active');
//             e.stopPropagation();
//             if (activeItem[0]) {
//               activeItem[0].classList.remove('active');
//             }
//             const listing = document.getElementById(`listing-${marker.id}`);
//             listing.classList.add('active');
//           });

//           /**
//            * Create a marker using the div element
//            * defined above and add it to the map.
//            **/

//           new mapboxgl.Marker(el, { offset: [0, -23] })
//             .setLngLat(marker.coordinates)
//             .addTo(map);
//         }
//       }

//       function buildLocationList(stores) {
//         //////////////////////////
//         //// SEARCHING

//         const lookingFor = 'Ben';
//         const founded = stores.results.filter(el =>
//           el.name.includes(lookingFor)
//         );

//         ///////////////////////////////
//         //  END SEARCHING

//         /*
//         WORKING ON

// if  !clicks sort by
// sortedArray = id.
// Else if name sortedArray = name

//         */
//         //Sorting function
//         Array.prototype.sortBy = function (p) {
//           return this.slice(0).sort(function (a, b) {
//             return a[p] > b[p] ? 1 : a[p] < b[p] ? -1 : 0;
//           });
//         };

//         const getSort = document.querySelector('.sidebar__sort');
//         // Get clicked value
//         getSort.addEventListener('click', function (e) {
//           return e.target.id;
//         });

//         console.log(sortedArray);

//         /// FUNCTION LOADLIST / RENDER LIST
//         /*
//         function initList(){
// If !render list {
//   sortedAway = ('id)
// }
// }
// initList()

//         */
//         // SORTOWANIE: name, -height, region, id
//         const sortedArray = stores.results.sortBy('id');
//         for (let i = 0; i < sortedArray.length; i++) {
//           const listings = document.getElementById('sidebar__listings');
//           const listing = listings.appendChild(document.createElement('li'));

//           /* Assign the `item` class to each listing for styling. */
//           listing.className = 'sidebar__listings__item';

//           listing.id = `listing-${sortedArray[i].id}`;
//           const link = listing.appendChild(document.createElement('a'));
//           link.href = '#';
//           link.className =
//             'sidebar__listings__item__title sidebar__listings__item--click';
//           //link.className = 'sidebar__listings__item__title';
//           link.id = `link-${sortedArray[i].id}`;
//           link.innerHTML = `${sortedArray[i].name} `;

//           //Event listner when someone click on map or click
//           link.addEventListener('click', function () {
//             for (const feature of sortedArray) {
//               if (this.id === `link-${feature.id}`) {
//                 flyToStore(feature);
//                 createPopUp(feature);
//               }
//             }

//             const activeItem = document.getElementsByClassName('active');
//             if (activeItem[0]) {
//               activeItem[0].classList.remove('active');
//             }
//             this.parentNode.classList.add('active');
//           });

//           /* Add details to the individual listing. */
//           const details = listing.appendChild(document.createElement('div'));
//           details.className = 'sidebar__listing__describe';
//           details.innerHTML = `${sortedArray[i].height}m `;
//           if (sortedArray[i].region) {
//             details.innerHTML += `- ${sortedArray[i].region}`;
//           }
//         }
//       }

//       function flyToStore(currentFeature) {
//         map.flyTo({
//           center: currentFeature.coordinates,
//           zoom: MAP_FLYTO_ZOOM,
//         });
//       }

//       function createPopUp(currentFeature) {
//         const popUps = document.getElementsByClassName('mapboxgl-popup');
//         /** Check if there is already a popup on the map and if so, remove it */
//         if (popUps[0]) popUps[0].remove();

//         // Create popup
//         const popup = new mapboxgl.Popup({ closeOnClick: true })
//           .setLngLat(currentFeature.coordinates)
//           .setHTML(
//             `<h3>${currentFeature.name}</h3>
//             <h4>"${currentFeature.meaning}"</h4>
//             <p>Height: ${currentFeature.height} m<br>
//             ${currentFeature.region}
//             </p>`
//           )
//           .addTo(map);
//         const closeBtn = document.querySelector('.mapboxgl-popup-close-button');

//         closeBtn.addEventListener('click', () =>
//           map.flyTo({
//             //center: MAP_CENTER,
//             //zoom: MAP_FLYTO_ZOOM_OUT,
//             //speed: MAP_FLYOUT_SPEED,
//           })
//         );
//       }
//     }
//   } catch (err) {
//     console.error(`${err} 🔥🔥🔥🔥 munroApi ERROR`);
//     throw err;
//   }
// };
// munrosApi();
