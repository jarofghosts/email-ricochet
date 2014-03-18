var smtp = require('smtp-protocol')

module.exports = ricochet

function ricochet(domain, alias_lookup) {
  var server = smtp.createServer(request_response)

  return server

  function request_response(req) {
    var from_alias
      , to_alias

    req.on('greeting', function(cmd, ack) {
      ack.accept(250, domain + '- relay server')
    })
    req.on('from', from_response)
    req.on('to', to_response)
    req.on('message', message_response)

    function from_response(from, ack) {
      alias_lookup(from, determine)

      function determine(err, alias) {
        if(err || !alias) return ack.reject()
        from_alias = alias

        ack.accept(250, domain)
      }
    }

    function to_response(to, ack) {
      alias_lookup(to, determine)

      function determine(err, alias) {
        if (err || !alias) return ack.reject()
        to_alias = alias

        ack.accept(250, domain)
      }
    }

    function message_response(stream, ack) {
      smtp.connect(to_alias.split('@')[1], 25, send_mail)

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
