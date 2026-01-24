
(function(){
  var path = location.pathname;
  var active = null;
  if(path.includes('/education/')) active='education';
  else if(path.includes('/apps/')) active='apps';
  else if(path.includes('/blog/')) active='blog';
  else if(path.includes('/about/')) active='about';
  else if(path.includes('/contact/')) active='contact';
  document.querySelectorAll('a[data-nav]').forEach(function(a){
    if(active && a.getAttribute('data-nav')===active) a.classList.add('active');
  });
})();
