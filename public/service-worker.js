// we don't need to add a <script src="./service-worker.js"> tag, because navigator.serviceWorker.register("./service-worker.js") does that for us.
const APP_PREFIX = 'budget-tracker';   // this is the app name and you can name it whatever you want 
const VERSION = 'version_01'; // since the version changes often, we need to set a variable for that and we can change it later 
const CACHE_NAME = APP_PREFIX + VERSION;
const FILES_TO_CACHE = [ 
  "./index.html",
];

// Look at the listener. Why don't we use window.addEventListener instead of self? Well, 
//service workers run before the window object has even been created. So instead we use the self keyword to instantiate listeners on
// the service worker. The context of self here refers to the service worker object.
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) { // here we are going to open the cache_name with the caches.open methode 
      console.log('installing cache : ' + CACHE_NAME) // let us know if it did open the cache_name
      return cache.addAll(FILES_TO_CACHE) // if so, then add all my files listed in the files_to_cache
    })
  )
})


self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keyList) { //.keys() returns an array of all cache names, which we're calling keyList. 
      //keyList is a parameter that contains all cache names
      // filter out ones that has this app prefix to create keeplist
      let cacheKeeplist = keyList.filter(function(key) {
        return key.indexOf(APP_PREFIX);
      });
      // add current cache name to keeplist
      cacheKeeplist.push(CACHE_NAME);

      return Promise.all(
        keyList.map(function(key, i) {
          if (cacheKeeplist.indexOf(key) === -1) {
            console.log('deleting cache : ' + keyList[i]);
            return caches.delete(keyList[i]);
          }
        })
      );
    })
  );
});

// retrieve informations from the cache
self.addEventListener('fetch', function (e) {
  console.log('fetch request : ' + e.request.url)
  e.respondWith(
    caches.match(e.request).then(function (request) {
      if (request) { // if cache is available, respond with cache
        console.log('responding with cache : ' + e.request.url)
        return request
      } else {       // if there are no cache, try fetching request
        console.log('file is not cached, fetching : ' + e.request.url)
        return fetch(e.request)
      }

      // You can omit if/else for console.log & put one line below like this too.
      // return request || fetch(e.request)
    })
  )
})
