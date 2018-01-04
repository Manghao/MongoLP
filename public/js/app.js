window.VeloNancy = (() => {
    let module = {};
    let map, parkingIcon, locationIcon;

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

        this.parkingIcon = L.icon({
            iconUrl: 'public/img/parking.png',

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

        let prParkings = module.query('/parkings', 'GET')
        prParkings.done((data) => {
            $.each(data, (k, v) => {
                module.addParking(v);
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

    return module;
})();

$(() => {
    VeloNancy.init();
});