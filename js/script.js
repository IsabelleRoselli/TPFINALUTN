var menuBtn = document.getElementById('menuBtn');
var sidebar = document.getElementById('sidebar');
var closeBtn = document.getElementById('closeBtn');
var sidebarOverlay = document.getElementById('sidebarOverlay');
var sidebarLinks = document.querySelectorAll('.sidebar-link');

menuBtn.addEventListener('click', function() {
  sidebar.classList.add('active');
  sidebarOverlay.classList.add('active');
});

var closeSidebar = function() {
  sidebar.classList.remove('active');
  sidebarOverlay.classList.remove('active');
};

closeBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

for (var i = 0; i < sidebarLinks.length; i++) {
  sidebarLinks[i].addEventListener('click', closeSidebar);
}