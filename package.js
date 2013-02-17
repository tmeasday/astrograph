Package.describe({
  summary: "A Data Browser for Meteor apps"
});

Package.on_use(function (api, where) {
  api.use('autopublish', 'client');
  api.use('templating', 'client');
  
  api.add_files(['data_browser.html', 'data_browser.js', 'data_browser.css'], 'client');
});

