const socket = io()

const $loginForm = document.querySelector('#login-form')
const $loginFormEmail = document.querySelector('#login-form-email')
const $loginFormPassword = document.querySelector('#login-form-password')

$loginForm.addEventListener('submit', function (event) {
    event.preventDefault()

    const email = $loginFormEmail.value
    const password = $loginFormEmail.value

    socket.emit('login', { email, password })
})