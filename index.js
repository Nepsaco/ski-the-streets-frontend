const container = document.querySelector('#cardContainer')
const hero = document.querySelector('#heroContainer')
const BASE_URL = 'https://ski-the-streets.herokuapp.com'
// const BASE_URL = 'http://localhost:9000'
let API_KEY 
let myMap
let directionsRenderer
let directionsService
let stepDisplay
let latLngObject

let signedInUser = {id: 1, username: 'Adam'}

getMountainId()
    .then(mountains => mapArray(mountains, createCard))
displayFavorites()
// loadScript(API_KEY)
getApiKey()
    .then(loadScript)

// DOM Functions

function createCard(mountain){
    const card = document.createElement('div')
    const label = document.createElement('label')
    card.className = 'mountainCard'
    label.textContent = mountain.name
    label.id = mountain.mountain_id
    card.id = mountain.mountain_id

    appendElement(card, label)
    appendElement(container, card)
    card.addEventListener('click', mountainCardClick)
    return card
}

function mountainCardClick(event){
    getMountainInfo(event.target.id)
        .then(createHero)
        .then(clearHero)
}

function createHero(mountain){
    const heroCard = document.createElement('div')
    const h2 = document.createElement('h2')
    const ul = document.createElement('ul')
    const directions = document.createElement('div')
    const button = document.createElement('button')

    heroCard.className = 'heroCard'
    h2.textContent = mountain.name
    ul.innerHTML = `<li>Lifts: ${mountain.lift_count}</li>
    <li>Runs: ${mountain.run_count}</li>
    <li>Annual Snowfall: ${mountain.annual_snowfall}</li>
    <li>Skiable Acreage: ${mountain.skiable_acreage} acres</li>
    <li>Website: <a href="${mountain.official_website}" target="_black">Click to visit</a></li>`
    directions.id = 'right-panel'
    button.textContent = 'Add To Favories'
    button.id = mountain.id
    hero.className = ''

    appendElement(hero, heroCard)
    appendElement(heroCard, h2, ul, directions)
    appendElement(ul, button)

    button.addEventListener('click', handleFavoriteClick)
    calcRoute({lat: mountain.latitude, lng: mountain.longitude})

    return heroCard
}

function clearHero(element){
    if(hero.childElementCount != 1){
        hero.firstElementChild.remove() 
    }
}

function handleFavoriteClick(event) {
    event.target.remove()
    postFavorite()
}

function displayFavorites(){
    const favButton = document.querySelector('#favorites')
    const modal = document.querySelector('#modal')

    favButton.addEventListener('click', event => {
        modal.addEventListener('click', favoriteCardClick)
        modal.addEventListener('click', event => clearModal(event, modal))
        clearModalCards()
        toggleClass(modal)
        getUserAndFavorites()
            .then(users => mapArray(users[0].favorites, makeFavoriteCard))
    })
}

async function makeFavoriteCard(favorite){
    let mountain = await getMountainInfo(favorite.mountain_number)
    const latLngObject = {lat: mountain.latitude, lng: mountain.longitude}

    const modal = document.querySelector('#modal')
    const modalGuts = document.querySelector('#modal-guts')

    const card = document.createElement('div')
    const h2 = document.createElement('h2')

    h2.textContent = mountain.name
    h2.id = mountain.id
    card.className = 'favoriteCard'
    card.id = mountain.id


    appendElement(card, h2)
    appendElement(modalGuts, card)
}

function clearModal(event, element){
    if(event.target.id === 'modal'){
        toggleClass(element)
    }
}

function clearModalCards(){
    const modalGuts = document.querySelector('#modal-guts')
    while (modalGuts.firstChild) {
        modalGuts.removeChild(modalGuts.firstChild);
    }
}

async function favoriteCardClick(event){
    const modal = document.querySelector('#modal')
    const heroCard = document.querySelector('.heroCard')
    let mountain = await getMountainInfo(event.target.id)

    modal.addEventListener('click', event => {
        if (Number.isInteger(parseInt(event.target.id))){
            createHero(mountain)
            clearHero(heroCard)
            toggleClass(modal)
        }
    })
}

function toggleClass(element){
    if (element.className === 'hidden') {
        element.className = 'null'
    } else {
        element.className = 'hidden'
    }
}

// Backend functions

function getMountainId(){
    return fetch(`${BASE_URL}/mountains`)
        .then(handleResponse)
}

function getApiKey(){
    // dont push to production
    return fetch(`${BASE_URL}/token`)
        .then(handleResponse)
}

function getUserAndFavorites(){
    return fetch(`${BASE_URL}/users`)
        .then(handleResponse)
}

function postFavorite(){
    return fetch(`${BASE_URL}/favorites`, {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: signedInUser.id,
            mountain_number: event.target.id
        })
    })
}

function getMountainInfo(mountain_id){
    return fetch(`https://cors-anywhere.herokuapp.com/https://skimap.org/SkiAreas/view/${mountain_id}.json`)
        .then(handleResponse)
}

// Google Map Functions
//
function loadScript(key) {
    let script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=initMap`
    script.async = false;
    document.body.append(script);
}

function initMap(){
    directionsRenderer = new google.maps.DirectionsRenderer()
    directionsService = new google.maps.DirectionsService()

    const colorado = {lat:39.113, lng:-105.358}
    const mapProp = {
        center: colorado,
        zoom: 7
    }

    myMap = new google.maps.Map(document.getElementById('map'), mapProp)

    directionsRenderer.setMap(myMap)
}

function calcRoute(latLngObject) {

    var start = {lat:39.7392, lng:-104.9903}
    var request = {
        origin: start,
        destination: latLngObject,
        travelMode: 'DRIVING', 
        drivingOptions: {
            departureTime: new Date(Date.now() + 10), 
            trafficModel: 'pessimistic'
        }
    };

    directionsService.route(request, function(result, status) {
        if (status == 'OK') {
            directionsRenderer.setPanel(null)
            directionsRenderer.setPanel(document.getElementById('right-panel'))
            directionsRenderer.setDirections(result);
        }
    });
}

// Pure Helper Functions 

function handleResponse(response){
    return response.json()
}

function appendElement(container, ...element){
    container.append(...element)
}

function mapArray(array, definition){
    return array.map(definition)
}

