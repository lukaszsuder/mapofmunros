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

var _ = require('lodash');

require('babel-core/register');
require('babel-polyfill');

const munrosList2 = {
  results: [],
};

// Get spinner and spinner background
const testSpinner = document.querySelector('.spinner');
const testSpinnerBg = document.querySelector('.spinner-bg');

const munrosApi = async function () {
  try {
    // Spinner ADD
    testSpinner.classList.add('spinner-show');
    testSpinnerBg.classList.add('spinner-background');
    const fetchUrl = fetch('https://munroapi.herokuapp.com/munros');

    const results = await fetchUrl;

    if (!results.ok) {
      return;
    } else {
      // Spinner REMOVE
      testSpinner.classList.remove('spinner-show');
      testSpinnerBg.classList.remove('spinner-background');

      const data = await results.json();

      let createId = 0;

      munrosList2.results = data.map(received => {
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

      // Loading Main map
      mapboxgl.accessToken = MAP_KEY;
      const map = new mapboxgl.Map({
        container: 'map',
        style: MAP_STYLE,
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
      });

      const stores = {
        type: 'FeatureCollection',
        features: [],
      };

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
            data: stores,
          }
        );
        map.addLayer(
          {
            id: 'hillshading',
            source: 'dem',
            type: 'hillshade',
            // insert below waterway-river-canal-shadow;
            // where hillshading sits in the Mapbox Outdoors style
          },
          'waterway-river-canal-shadow'
        );
        addMarkers2(munrosList2);
        buildLocationList2(munrosList2);
      });

      // MAP WITHOUT SHADING
      // map.on('load', () => {
      //   /* Add the data to your map as a layer */
      //   map.addSource('places', {
      //     type: 'geojson',
      //     data: stores,
      //   });

      //   // addMarkers2(munrosList);
      //   // buildLocationList2(munrosList);
      //   addMarkers2(munrosList2);
      //   buildLocationList2(munrosList2);
      // });
      // END  MAP WITHOUT SHADING

      function addMarkers2(munros) {
        /* For each feature in the GeoJSON object above: */
        for (const marker of munros.results) {
          /* Create a div element for the marker. */

          const el = document.createElement('div');

          /* Assign a unique `id` to the marker. */
          el.id = `marker-${marker.id}`;

          /* Assign the `marker` class to each marker for styling. */
          el.className = 'marker';

          el.addEventListener('click', e => {
            /* Fly to the point */
            flyToStore2(marker);
            /* Close all other popups and display popup for clicked store */
            createPopUp2(marker);
            /* Highlight listing in sidebar */
            const activeItem = document.getElementsByClassName('active');
            e.stopPropagation();
            if (activeItem[0]) {
              activeItem[0].classList.remove('active');
            }
            const listing = document.getElementById(`listing-${marker.id}`);
            listing.classList.add('active');
          });

          /**
           * Create a marker using the div element
           * defined above and add it to the map.
           **/

          new mapboxgl.Marker(el, { offset: [0, -23] })
            .setLngLat(marker.coordinates)
            .addTo(map);
        }
      }

      function buildLocationList2(stores) {
        /*
Search.
Pobiera z formy treść i porównóje stringa ze stringiem (name z API.
.reduce(szukane => array.name.contain(szukane))

        */
        const czegoSzukamy = 'Ben';
        const znalezione = stores.results.filter(el =>
          el.name.includes(czegoSzukamy)
        );
        console.log(znalezione);

        /*

If !sort { sort = height}
else { button === name {sortuj array by name}
else button === region {sortuj array by name}
else button === height {sortuj array by name}

Sortowanie poniżej działa. Wystarczy teraz napisać powyższą funkcję i będzie działać
*/

        Array.prototype.sortBy = function (p) {
          return this.slice(0).sort(function (a, b) {
            return a[p] > b[p] ? 1 : a[p] < b[p] ? -1 : 0;
          });
        };

        // SORTOWANIE: name, -height, region, id
        const sortedArray = stores.results.sortBy('id');

        for (let i = 0; i < sortedArray.length; i++) {
          const listings = document.getElementById('sidebar__listings');
          const listing = listings.appendChild(document.createElement('li'));

          /* Assign the `item` class to each listing for styling. */
          listing.className = 'sidebar__listings__item';

          listing.id = `listing-${sortedArray[i].id}`;
          const link = listing.appendChild(document.createElement('a'));
          link.href = '#';
          link.className =
            'sidebar__listings__item__title sidebar__listings__item--click';
          //link.className = 'sidebar__listings__item__title';
          link.id = `link-${sortedArray[i].id}`;
          link.innerHTML = `${sortedArray[i].name} `;

          //Event listner when someone click on map or click
          link.addEventListener('click', function () {
            for (const feature of sortedArray) {
              if (this.id === `link-${feature.id}`) {
                flyToStore2(feature);
                createPopUp2(feature);
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

        //// Poniżej stara wersja bez SORTOWANIA
        // for (let i = 0; i < stores.results.length; i++) {
        //   const listings = document.getElementById('listings');
        //   const listing = listings.appendChild(document.createElement('div'));

        //   /* Assign the `item` class to each listing for styling. */
        //   listing.className = 'item';

        //   listing.id = `listing-${stores.results[i].id}`;
        //   const link = listing.appendChild(document.createElement('a'));
        //   link.href = '#';
        //   link.className = 'title';
        //   link.id = `link-${stores.results[i].id}`;
        //   link.innerHTML = `${stores.results[i].name.slice(0, 20)} `;

        //   //Event listner when someone click on map or click
        //   link.addEventListener('click', function () {
        //     for (const feature of stores.results) {
        //       if (this.id === `link-${feature.id}`) {
        //         flyToStore2(feature);
        //         createPopUp2(feature);
        //       }
        //     }

        //     const activeItem = document.getElementsByClassName('active');
        //     if (activeItem[0]) {
        //       activeItem[0].classList.remove('active');
        //     }
        //     this.parentNode.classList.add('active');
        //   });

        //   /* Add details to the individual listing. */
        //   const details = listing.appendChild(document.createElement('div'));
        //   details.innerHTML = `${stores.results[i].height} m`;
        //   if (stores.results[i].region) {
        //     details.innerHTML += `<br> ${stores.results[i].region}`;
        //   }
        // }
      }

      function flyToStore2(currentFeature) {
        map.flyTo({
          center: currentFeature.coordinates,
          zoom: MAP_FLYTO_ZOOM,
        });
      }

      function createPopUp2(currentFeature) {
        const popUps = document.getElementsByClassName('mapboxgl-popup');
        /** Check if there is already a popup on the map and if so, remove it */
        if (popUps[0]) popUps[0].remove();

        const popup = new mapboxgl.Popup({ closeOnClick: false })
          .setLngLat(currentFeature.coordinates)
          .setHTML(
            `<h3>${currentFeature.name}</h3><h4>${currentFeature.height} m</h4><p>${currentFeature.meaning}</p>`
          )
          .addTo(map);
        const closeBtn = document.querySelector('.mapboxgl-popup-close-button');

        closeBtn.addEventListener('click', () =>
          map.flyTo({
            //center: MAP_CENTER,
            zoom: MAP_FLYTO_ZOOM_OUT,
            speed: MAP_FLYOUT_SPEED,
          })
        );
      }
    }
  } catch (err) {
    console.error(`${err} 🔥🔥🔥🔥 munroApi ERROR`);
    throw err;
  }
};
munrosApi();

/////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////
/////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////
///////////////////////////////////
//////////////////////////////////
//////////////////////////////////

/////////////////////  ORIGINALS /////////////////////

// function addMarkers() {
//   /* For each feature in the GeoJSON object above: */
//   for (const marker of stores.features) {
//     /* Create a div element for the marker. */
//     const el = document.createElement('div');
//     /* Assign a unique `id` to the marker. */
//     el.id = `marker-${marker.properties.id}`;
//     /* Assign the `marker` class to each marker for styling. */
//     el.className = 'marker';

//     el.addEventListener('click', e => {
//       /* Fly to the point */
//       flyToStore(marker);
//       /* Close all other popups and display popup for clicked store */
//       createPopUp(marker);
//       /* Highlight listing in sidebar */
//       const activeItem = document.getElementsByClassName('active');
//       e.stopPropagation();
//       if (activeItem[0]) {
//         activeItem[0].classList.remove('active');
//       }
//       const listing = document.getElementById(
//         `listing-${marker.properties.id}`
//       );
//       listing.classList.add('active');
//     });

//     /**
//      * Create a marker using the div element
//      * defined above and add it to the map.
//      **/
//     new mapboxgl.Marker(el, { offset: [0, -23] })
//       .setLngLat(marker.geometry.coordinates)
//       .addTo(map);
//   }
// }

// function buildLocationList(stores) {
//   for (const store of stores.features) {
//     /* Add a new listing section to the sidebar. */
//     const listings = document.getElementById('listings');
//     const listing = listings.appendChild(document.createElement('div'));
//     /* Assign a unique `id` to the listing. */
//     listing.id = `listing-${store.properties.id}`;
//     /* Assign the `item` class to each listing for styling. */
//     listing.className = 'item';

//     /* Add the link to the individual listing created above. */
//     const link = listing.appendChild(document.createElement('a'));
//     link.href = '#';
//     link.className = 'title';
//     link.id = `link-${store.properties.id}`;
//     link.innerHTML = `${store.properties.name}`;

//     //Event listner when someone click on map or click
//     link.addEventListener('click', function () {
//       for (const feature of stores.features) {
//         console.log('1:' + feature);
//         if (this.id === `link-${feature.properties.id}`) {
//           console.log('2:' + feature.properties.id);
//           flyToStore(feature);
//           createPopUp(feature);
//         }
//       }
//       const activeItem = document.getElementsByClassName('active');
//       if (activeItem[0]) {
//         activeItem[0].classList.remove('active');
//       }
//       this.parentNode.classList.add('active');
//     });

//     /* Add details to the individual listing. */
//     const details = listing.appendChild(document.createElement('div'));
//     details.innerHTML = `${store.properties.height}`;
//     if (store.properties.region) {
//       details.innerHTML += ` · ${store.properties.region}`;
//     }
//     if (store.properties.distance) {
//       const roundedDistance = Math.round(store.properties.distance * 100) / 100;
//       details.innerHTML += `<div><strong>${roundedDistance} miles away</strong></div>`;
//     }
//   }
// }

// function flyToStore(currentFeature) {
//   map.flyTo({
//     center: currentFeature.geometry.coordinates,
//     zoom: 15,
//   });
// }

// function createPopUp(currentFeature) {
//   const popUps = document.getElementsByClassName('mapboxgl-popup');
//   /** Check if there is already a popup on the map and if so, remove it */
//   if (popUps[0]) popUps[0].remove();

//   const popup = new mapboxgl.Popup({ closeOnClick: false })
//     .setLngLat(currentFeature.geometry.coordinates)
//     .setHTML(`<h3>Sweetgreen</h3><h4>${currentFeature.properties.address}</h4>`)
//     .addTo(map);
// }
///////////////////// KONIEC ORIGINALS /////////////////////

//import dataJSON from '../mapofmunrosapi/test.json';

// const eo = function () {
//   fetch('http://localhost:1234/public/test.json')
//     .then(response => {
//       return response.json();
//     })
//     .then(data => console.log(data));
// };
// eo();
