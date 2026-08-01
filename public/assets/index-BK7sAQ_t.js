// Compatibility shim for browsers still holding a cached HTML document that
// references this legacy entry filename. It fetches the current deployment's
// index.html, extracts the live entry module URL, and imports it.
(function () {
  var done = false;
  function fail() {
    if (done) return;
    done = true;
    try {
      if (!sessionStorage.getItem('__shimReload')) {
        sessionStorage.setItem('__shimReload', '1');
        location.reload();
      }
    } catch (e) {}
  }

  fetch('/?shim=' + Date.now(), { credentials: 'same-origin' })
    .then(function (r) { return r.text(); })
    .then(function (html) {
      var m = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
      if (m && m[1]) {
        done = true;
        return import(m[1]);
      }
      fail();
    })
    .catch(fail);
})();
