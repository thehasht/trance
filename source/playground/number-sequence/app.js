require('./test')
const { User } = require('./user')

try {
    const user = new User({
        name: 'Hari'
    })
    user.save()
} catch (error) {
    console.log(error)
}