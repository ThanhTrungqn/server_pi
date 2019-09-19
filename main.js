/*For coap client : https://www.npmjs.com/package/node-coap-client*/
/*For mqtt client : https://www.npmjs.com/package/mqtt*/
/*
{
	"type_msg":"cmd",
	"ip_address":["192.168.12.190","192.168.12.191"],
	"url":"light/sensors",
	"payload":"abc=xyz",
	"type_cmd":"post"
}
{
	"type_msg":"res",
	"msg":"ok"
}
*/

const coap = require("node-coap-client").CoapClient;
var mqtt = require('mqtt')
var mqtt_client  = mqtt.connect('mqtt://5.196.12.31');

mqtt_client.on('connect', function () {
  mqtt_client.subscribe('tw/cmd_led', function (err) {
  	if (!err) {
     console.log("connected")
    }
  })
})
 
mqtt_client.on('message', function (topic, message) {
  	// message is Buffer
  	var string_message = message.toString();
  	console.log(string_message);
  	var message_res = '';
  	try {
    //console.log("new data arrived")
		dojob (string_message);
		console.log("xong");
	} 
	catch (e) {
    	console.log(e);
	}
})

async function dojob (string_message){
	var json = JSON.parse(string_message);
		if ( json.type_msg == "cmd" ){
			console.log ("start process cmd");
			console.log (string_message);
			for (var i = 0; i < json.ip_address.length; i++) {
				var url_coap = 'coap://' +  json.ip_address[i] + ':5683/' + json.url;
				var buf = Buffer.from(json.payload, 'utf8');
				var coap_cmd = json.type_cmd;
				await coap
				    .request(
				        url_coap,
				        coap_cmd,
				        buf,
				        options
				    )
				    .then(response => { /* handle response */
				    	var res = response.code.toString();
				    	console.log(json);
				    	if (res ==  "4.04"){
				    		console.log(response);
				    		var address_ip_process = json.ip_address[i];
				    		message_res = address_ip_process +  ' bad cmd ';
				    		var message_send = '{"type_msg":"res","msg":"'+ message_res + '"}';
				    		mqtt_client.publish('tw/cmd_led', message_send);
				    	}
				    	else
				    	{
				    		console.log("return here ===>>>>>>");
				    		var address_ip_process = json.ip_address[i];
				    		message_res = address_ip_process +  " good cmd ";
				    		var message_send = '{"type_msg":"res","msg":"'+ message_res + '"}';
				    		mqtt_client.publish('tw/cmd_led', message_send);
				    	}
				    })
				    .catch(err => { /* handle error */
				    	console.log(err);
				    });
			}
		}
}


var options  = {
    /** Whether to keep the socket connection alive. Speeds up subsequent requests */
    keepAlive: false,
    /** Whether we expect a confirmation of the request */
    confirmable: false,
    /** Whether this message will be retransmitted on loss */
    retransmit: true
}