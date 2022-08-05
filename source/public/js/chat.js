const socket = io();

const $searchFriendForm = document.querySelector('#search-friend-form')
const $searchFriendInput = document.querySelector('#search-friend-input')
const $searchFriendButton = document.querySelector('#search-friend-button')
const $list = document.querySelector('#list')
const $search = document.querySelector('#search')
const $requests = document.querySelector('#requests')
const $chatMain = document.querySelector('#chat__main')
const $users = document.querySelector('#users')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const messageSectionTemplate = document.querySelector('#message-section-template').innerHTML
const addFoundFriendTemplate = document.querySelector('#add-found-friend-template').innerHTML
const friendRequestTemplate = document.querySelector('#friend-request-template').innerHTML
const friendsListTemplate = document.querySelector('#friends-list').innerHTML
const listElementTemplate = document.querySelector('#list-element-template').innerHTML

const { email } = Qs.parse(location.search, { ignoreQueryPrefix: true })

socket.on('connect', function () {
    socket.emit('handshake', { email, connection_id: socket.id }, function (error) {
        if (error) {
            console.log(error)
        } else {
            console.log('Record Saved')
            socket.emit('loadFriendsList', email, function (error, users) {
                if (error) {
                    console.log(error)
                } else {
                    const html = Mustache.render(friendsListTemplate, {
                        users
                    })
                    $list.innerHTML = html
                }
            }) 
        }
    })
})

socket.on('message', function (options) {
    const html = Mustache.render(messageTemplate, {
        userName: options.userName,
        createdAt: moment(options.createdAt).format('k:mm a'),
        message: options.message
    })
    const chatMessages = document.querySelector('#chat__messages')
    chatMessages.insertAdjacentHTML('beforeend', html)
})

socket.on('locationMessage', function (options) {
    console.log('ok - 3')
    const html = Mustache.render(locationMessageTemplate, {
        userName: options.userName,
        createdAt: moment(options.createdAt).format('k:mm a'),
        url: options.url
    })
    const chatMessages = document.querySelector('#chat__messages')
    chatMessages.insertAdjacentHTML('beforeend', html)
})

socket.on('addFriendRequest', function (from) {
    const html = Mustache.render(friendRequestTemplate, {
        userName: from.name
    })
    $requests.insertAdjacentHTML('beforeend', html)
    const acceptButton = document.querySelector('#friend-request-form-accept')
    acceptButton.addEventListener('click', function (event) {
        event.preventDefault()
        acceptButton.setAttribute('disabled', 'true')
        socket.emit('addFriend', from, function (error) {
            if (error) {
                return console.log(error)
            }
            acceptButton.removeAttribute('disabled')
            const divElement = acceptButton.parentElement.parentElement
            divElement.parentElement.removeChild(acceptButton.parentElement.parentElement)
        })
    })
})  

$searchFriendForm.addEventListener('submit', function (event) {
    event.preventDefault()
    $searchFriendButton.setAttribute('disabled', 'true')

    const email = $searchFriendInput.value
    socket.emit('searchFriend', { email }, function (error, to) {
        if (error) {
            return alert('No user found.')
        }

        const html = Mustache.render(addFoundFriendTemplate, {
            userName: to.name,
            userEmail: to.email
        })
        $search.insertAdjacentHTML('beforeend', html)
        const recordForm = document.querySelector('#found-friend-record-form')
        recordForm.addEventListener('submit', function (event) {
            event.preventDefault()
            const requestButton = event.target.elements.requestButton
            requestButton.setAttribute('disabled', 'true')
            socket.emit('sendFriendRequest', to.email, socket.id, function (error) {
                if (error) {
                    return console.log("error")
                }
                $searchFriendButton.removeAttribute('disabled')
                $searchFriendInput.value = ''
                requestButton.removeAttribute('disabled')
                const divElement = recordForm.parentElement
                divElement.parentElement.removeChild(divElement)
            })
        })
    })
})

socket.on('addFriendToList', function (user) {
    const newFriend = user.friends.slice(-1)[0]
    const html = Mustache.render(listElementTemplate, { 
        userName: newFriend.name,
    })
    $users.insertAdjacentHTML('beforeend', html)
})

$list.addEventListener('click', function (event) {
    event.stopPropagation()
    const listElement = event.target
    const toName = listElement.getAttribute('toName')
    const toEmail = listElement.getAttribute('toEmail')

    const html = Mustache.render(messageSectionTemplate, {
        userName: toName
    })
    $chatMain.innerHTML = html
    const messageForm = document.querySelector('#message-form')
    const messageFormInput = document.querySelector('#message-form-input')
    const messageFormButton = document.querySelector('#message-form-button')
    const locationFormButton = document.querySelector('#location-form-button')

    messageForm.addEventListener('submit', function (event) {
        event.preventDefault()
        messageFormButton.setAttribute('disabled', 'true')
        locationFormButton.setAttribute('disabled', 'true')
        const value = messageFormInput.value
        if (value) {
            socket.emit('sendMessage', { toEmail, value }, function (error) {
                if (error) {
                    console.log(error)
                }
                messageFormInput.value = ''
                messageFormInput.focus()
                messageFormButton.removeAttribute('disabled')
                locationFormButton.removeAttribute('disabled')
            })
        } else {
            messageFormButton.removeAttribute('disabled')
            locationFormButton.removeAttribute('disabled')
        }
    })

    locationFormButton.addEventListener('click', function (event) {
        event.preventDefault()
        if (!navigator.geolocation) {
            return alert('Geolocation is not supported by browser.')
        }
        messageFormButton.setAttribute('disabled', 'true')
        locationFormButton.setAttribute('disabled', 'true')

        navigator.geolocation.getCurrentPosition(function (position) {
            const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }

            socket.emit('sendLocation', { toEmail, coords }, function (error) {
                if (error) {
                    console.log(error)
                }
                messageFormButton.removeAttribute('disabled')
                locationFormButton.removeAttribute('disabled')
            })
        })
    })
})