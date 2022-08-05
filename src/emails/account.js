const sgMail = require('@sendgrid/mail')

const sendgridAPIKey = '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'

sgMail.setApiKey(sendgridAPIKey)

sgMail.send({
    to: 'harshitster@gmail.com',
    from: 'harshit.utd@gmial.com',
    subject: 'This is my first creation!',
    text: 'I hope this one actually get to you.'
}).then(function () {
    console.log('Email sent')
}).catch(function (error) {
    console.error(error)
})