window.VeloNancy = (() => {
    let module = {};
    let map, parkingIcon, locationIcon, parkingEventIcon, locationEventIcon;

    module.init = () => {
        this.map = L.map('map').setView([48.691928, 6.1888433], 13);
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        this.locationIcon = L.icon({
            iconUrl: 'public/img/location.png',

            iconSize:     [32, 37],
            iconAnchor:   [16, 35],
            popupAnchor:  [0, -35]
        });

        this.locationEventIcon = L.icon({
            iconUrl: 'public/img/location_event.png',

            iconSize:     [32, 37],
            iconAnchor:   [16, 35],
            popupAnchor:  [0, -35]
        });

        this.parkingIcon = L.icon({
            iconUrl: 'public/img/parking.png',

            iconSize:     [32, 37],
            iconAnchor:   [16, 35],
            popupAnchor:  [0, -35]
        });

        this.parkingEventIcon = L.icon({
            iconUrl: 'public/img/parking_event.png',

            iconSize:     [32, 37],
            iconAnchor:   [16, 35],
            popupAnchor:  [0, -35]
        });

        let prLocation = module.query('/api/stations', 'GET')
        prLocation.done((data) => {
            $.each(data, (k, v) => {
                module.addStation(v);
            })
        });

        let prParkings = module.query('/api/parkings', 'GET')
        prParkings.done((data) => {
            $.each(data, (k, v) => {
                module.addParking(v);
            })
        });

        let prEvents = module.query('/api/events', 'GET')
        prEvents.done((data) => {
            $.each(data, (k, v) => {
                module.addEvent(v);
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
    	let places_libres = $('<p>').text(`Vélos disponibles: ${data.details.free}/${data.details.total}`)[0].outerHTML;
    	let open = ((data.open == 1) ? $('<p>').addClass('text-success').text('Ouvert') : $('<p>').addClass('text-danger').text('Fermé'))[0].outerHTML;
        L.marker([data.lat, data.lng], {
            icon: this.locationIcon
        })
        .addTo(this.map)
        .bindPopup(`<h6>${data.name}</h6><span>${data.fullAddress}</span>${places_libres}${open}`);
    }

    module.addParking = (data) => {
        let horaire = $('<p>').addClass('text-success').text('Ouvert');
        let places_libres = $('<p>').text(`Places libres: ${data.places}/${data.capacite}`)[0].outerHTML;
        if (data.places === null) {
            horaire = $('<p>').addClass('text-danger').text('Fermé');
            places_libres = '';
        }

        L.marker([data.geometry.y, data.geometry.x], {
            icon: this.parkingIcon
        })
        .addTo(this.map)
        .bindPopup(`<h6>${data.nom.toUpperCase()}</h6><span>${data.adresse} - ${data.nom}</span>${places_libres}${horaire[0].outerHTML}`);
    }

    module.addEvent = (data) => {
        let name = `<a href="/events/${data._id}">${data.nom.toUpperCase()}</a>`;
        let adresse = data.id_rue + " " + data.adresse
        let places_libres = $('<p>').text(`Places libres: ${data.capacite}/${data.places_disponibles}`)[0].outerHTML;
        let open = ((data.statut == 'open') ? $('<p>').addClass('text-success').text('Ouvert') : $('<p>').addClass('text-danger').text('Fermé'))[0].outerHTML;
        let seeMore = `<a href="/events/${data._id}">Voir plus</a>`;
        L.marker([data.lat, data.lng], {
            icon: (data.type == 'parkingsVoitures') ? this.parkingEventIcon : this.locationEventIcon
        })
        .addTo(this.map)
        .bindPopup(`<h6>${name}</h6><span>${adresse}</span>${places_libres}${open}${seeMore}`);
    }

    return module;
})();

$(() => {
    VeloNancy.init();
});