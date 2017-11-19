/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Todo Collection
	// ---------------

	// The collection of places is backed by *localStorage* instead of a remote
	// server.
	var Places = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Place,

		// Save all of the todo items under the `"map"` namespace.
		localStorage: new Backbone.LocalStorage('map-backbone'),

		// Filter down the list of all place items that are finished.
		zoneId: function (zoneId) {
			return this.where({zoneId: zoneId});
		},

		// We keep the Places in sequential order, despite being saved by unordered
		// GUID in the database. This generates the next order number for new items.
		nextOrder: function () {
			return this.length ? this.last().get('order') + 1 : 1;
		},

		// Places are sorted by their original insertion order.
		comparator: 'order'
	});

	// Create our global collection of **Places**.
	app.places = new Places();
})();
