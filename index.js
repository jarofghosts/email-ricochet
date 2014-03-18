var smtp = require('smtp-protocol')
  , concat = require('concat-stream')

module.exports = ricochet

function ricochet(domain, alias_lookup) {
  var server = smtp.createServer(request_response)

  return server

  function request_response(req) {
    var to_alias

    req.on('to', to_response)
    req.on('message', message_response)

    function to_response(to, ack) {
      alias_lookup(to, determine)

      function determine(err, alias) {
        if (err || !alias) return ack.reject()
        to_alias = alias

        ack.accept()
      }
    }

    function message_response(stream, ack) {
      var bits = data.split('\n')
        , subject = bits[0]
        , content = bits.slice(1).join('\n')

      var address = req.from.split('@')
        , user = address[0]
        , host = address[1]

      alias_lookup(req.from, setup_client)

      function setup_client(err, from_alias) {
        smtp.connect(host, 25, send_mail)

        function send_mail(mail) {
          mail.helo(domain)
          mail.from(from_alias)
          mail.to(to_alias)
          mail.data()
          stream.pipe(mail.message())
          
          ack.accept()
          mail.quit()
        }
      }
    }
  }
}
