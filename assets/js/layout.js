(function(){
  function join(base, rel){
    if(!base.endsWith('/')) base += '/';
    return base + rel;
  }
  function renderHeaderFooter(){
    var base = window.DH.base;
    var site = window.DH.site;

    var header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML =
      '<div class="navbar">' +
        '<a class="brand" href="'+ join(base,'') +'">' +
          '<div class="logo" aria-hidden="true"></div>' +
          '<span>'+ site.name +'</span>' +
        '</a>' +
        '<nav class="navlinks">' +
          site.nav.slice(1).map(function(item){
            return '<a data-nav="'+ item.href +'" href="'+ join(base,item.href) +'">'+ item.label +'</a>';
          }).join('') +
        '</nav>' +
        '<button class="mobile-btn" id="dhMobileBtn" aria-label="Menu">☰</button>' +
      '</div>' +
      '<div class="mobile-menu" id="dhMobileMenu">' +
        site.nav.map(function(item){
          return '<a data-nav="'+ item.href +'" href="'+ join(base,item.href) +'">'+ item.label +'</a>';
        }).join('') +
      '</div>';

    document.body.prepend(header);

    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.textContent = '© ' + new Date().getFullYear() + ' ' + site.name;
    document.body.append(footer);

    var btn = header.querySelector('#dhMobileBtn');
    var menu = header.querySelector('#dhMobileMenu');
    btn.addEventListener('click', function(){ menu.classList.toggle('show'); });

    // active link
    var here = window.location.pathname;
    header.querySelectorAll('[data-nav]').forEach(function(a){
      var rel = a.getAttribute('data-nav');
      var full = join(base, rel);
      if (here === full || here === full.replace(/\/$/,'') || here.startsWith(full)){
        a.classList.add('active');
      }
    });
  }

  window.DH = window.DH || {};
  window.DH.renderLayout = renderHeaderFooter;
})();