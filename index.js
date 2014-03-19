var default_domain = require('os').hostname()

var MailParser = require('mailparser').MailParser
  , concat = require('concat-stream')
  , sendmail = require('sendmail')()
  , smtp = require('smtp-protocol')

module.exports = ricochet

function ricochet(_domain, _alias_lookup) {
  var alias_lookup = _alias_lookup || default_lookup
    , domain = _domain || default_domain

  var server = smtp.createServer(request_response)
    , parser = new MailParser()

  return server

  function request_response(req) {
    var from_alias
      , to_alias

    req.on('greeting', welcome)
    req.on('from', from_response)
    req.on('to', to_response)
    req.on('message', message_response)

    function welcome(cmd, ack) {
      ack.accept(250, domain + '- relay server')
    }

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
      parser.once('end', send_mail)
      stream.pipe(parser)

      ack.accept(250, domain)

      function send_mail(data) {
        var mail = {}

        mail.from = from_alias
        mail.to = to_alias
        mail.subject = data.subject
        mail.content = data.text

        sendmail(mail, check_status)
      }
    }
  }
  function check_status(err, reply) {
    console.log(err, reply)
  }
}
