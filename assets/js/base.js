(function(){
  function getBasePath(){
    var parts = window.location.pathname.split('/').filter(Boolean);
    // github project site: /<repo>/...
    if (window.location.hostname.endsWith('github.io') && parts.length >= 1){
      return '/' + parts[0] + '/';
    }
    return '/';
  }
  window.DH = window.DH || {};
  window.DH.base = getBasePath();
  window.DH.site = {
    name: 'DreamHub',
    tagline: 'Education, blogs and apps in one place.',
    nav: [
      {label:'Home', href:''},
      {label:'Education', href:'education/'},
      {label:'Apps', href:'apps/'},
      {label:'Blog', href:'blog/'},
      {label:'About', href:'about/'},
      {label:'Contact', href:'contact/'},
    ]
  };
})();