window.VeloNancy = (() => {
	let module = {};
	let map, parkingIcon, locationIcon;

	module.init = () => {
		this.map = L.map('map').setView([48.691928, 6.1888433], 13);
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(this.map);

		this.parkingIcon = L.icon({
			iconUrl: 'public/img/parking.png',

			iconSize:     [32, 37],
			iconAnchor:   [16, 35],
			popupAnchor:  [0, -35]
		});

		this.locationIcon = L.icon({
			iconUrl: 'public/img/location.png',

			iconSize:     [32, 37],
			iconAnchor:   [16, 35],
			popupAnchor:  [0, -35]
		});

		let prLocation = module.query('/stations', 'GET')
		prLocation.done((data) => {
			$.each(data, (k, v) => {
				module.addStation(v);
			})
		});
	}

	module.query = (url, method, data = null) => {
		let pr = $.ajax(url, {
			type: method,
			dataType: 'json',
			context: this,
			data: data
		});
		pr.fail((jqXHR, status, error) => {
			alert('Error ajax query');
		})
		return pr;
	}

	module.addStation = (data) => {
		L.marker([data.lat, data.lng], {
			icon: this.locationIcon
		})
		.addTo(this.map)
		.bindPopup(`<h4>${data.name}</h4>${data.fullAddress}`);
	}

	return module;
})();

$(() => {
	VeloNancy.init();
});