var smtp = require('smtp-protocol')
  , sendmail = require('sendmail')()
  , concat = require('concat-stream')

module.exports = ricochet

function ricochet(alias_lookup) {
  var server = smtp.createServer(request_response)

  return server

  function request_response(req) {
    var alias_address

    req.on('to', to_response)
    req.on('message', message_response)

    function to_response(to, ack) {
      alias_lookup(to, determine)

      function determine(err, alias) {
        if (err || !alias) return ack.reject()
        alias_address = alias

        ack.accept()
      }
    }
    function message_response(stream, ack) {
      stream.pipe(concat(send_mail))
      ack.accept()
    }

    function send_mail(data) {
      var bits = data.split('\n')
        , subject = bits[0]
        , content = bits.slice(1).join('\n')

      sendmail(
          {
              from: req.from
            , to: alias_address
            , subject: subject
            , content: content
          }
        , check_success
      )
    }

    function check_success(err, reply) {
      if (err) console.error(err)
    }
  }
}
