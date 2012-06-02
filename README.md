Pages is an application framework built on top of [Backbone](http://www.backbone.js.org)

It was created for several reasons:
* Enable 3rd parties to provide plugins to replace default behavior
* Provide enhanced support for events
* Encapsulate DRY code
* Allow modular routers to be downloaded only when associated routes are hit

Although many common plugin implementations will be available within this project, 3rd party contributions are welcome.

### Plugins
* Content Provider: used to provide content (usually for templates)
* Template Engine: used to merge content with data
* I18N
* Module Loader: used to lazy load router code
* Object Manager: encapsulates handling of all view plugins
* View Handlers: things that respond to events that are meaningful to a view
  * Subview: allow views to contain other views
  * Model: allow views to contain models that make UI contributions
  * Collection: allow views to contain collections that make UI contributions
  * Mixin: provide additional functionality to views

[Learn more about Pages in the Wiki](https://github.com/jhudson8/backbone-pages/wiki)

