/*For coap client : https://www.npmjs.com/package/node-coap-client*/
/*For mqtt client : https://www.npmjs.com/package/mqtt*/
/*
{"type_msg":"cmd","ip_address":["192.168.0.110","192.168.0.111","192.168.0.112","192.168.0.193"],"url":"actuators/light","payload":"pwm=50","type_cmd":"post"}
{
	"type_msg":"res",
	"msg":"ok"
}
*/
// mosquitto_pub -h ""5.196.12.31 -t "tw/cmd_led" -m '{"type_msg":"cmd","ip_address":["192.168.0.110","192.168.0.111","192.168.0.112","192.168.0.113"],"url":"actuators/light","payload":"pwm=0","type_cmd":"post"}
const coap = require("node-coap-client").CoapClient;
var mqtt = require('mqtt');
var mqtt_client  = mqtt.connect('mqtt://5.196.12.31');

//MODE_OFF=0 MODE_ON=1 MODE_AUTO=2;
var MODE_LAMPE = 1;
var MODE_LAMPE_OFF 	= 0;
var MODE_LAMPE_ON	= 1;
var MODE_LAMPE_AUTO	= 2;


var list_eyo = [	
	"192.168.0.110",
	"192.168.0.111",
	"192.168.0.112",
	"192.168.0.113"
];

//Will use after
var timer_no_person = 0 ;
var pwm_state_on = 60;
var pwm_state_off = 0;
var pwm_state_auto = 60;

async function loop_infinite (){
	var presence_total = 0;

	if (MODE_LAMPE == MODE_LAMPE_OFF ){
	}
	else if (MODE_LAMPE == MODE_LAMPE_ON){
	}
	else if (MODE_LAMPE == MODE_LAMPE_AUTO){
		//Step 1: Update total presence
		for (var i = 0; i < list_eyo.length; i++) {
			var url_coap = 'coap://' +  list_eyo[i] + ':5683/sensors/presence'; //Get number presence in this room
			var buf = "";
			var coap_cmd = "get";
			await coap
			    .request(
			        url_coap,
			        coap_cmd,
			        buf,
			        options
			    )
			    .then(response => { /* handle response */
			    	var res = response.payload.toString();
			    	presence_total += res*1;
			    })
			    .catch(err => { /* handle error */
			    	console.log(err);
			    });
		}
		//Step 2: Update timer
		if (presence_total == 0 ){
			timer_no_person += 5000;
		}
		else {
			timer_no_person = 0;
			//Turn ON
			var message = '{"type_msg":"cmd","ip_address":["192.168.0.110","192.168.0.111","192.168.0.112","192.168.0.113"],"url":"actuators/light","payload":"pwm=60","type_cmd":"post"}';
			dojob (message);
		}
		//Step 3: CMD led
		if (timer_no_person > 10*1000){
			//Turn OFF			
			var message = '{"type_msg":"cmd","ip_address":["192.168.0.110","192.168.0.111","192.168.0.112","192.168.0.113"],"url":"actuators/light","payload":"pwm=0","type_cmd":"post"}';
			dojob (message);
		}
	}
}
loop_infinite();


mqtt_client.on('connect', function () {
  mqtt_client.subscribe('tw/cmd_led', function (err) {
  	if (!err) {
     console.log("connected");
    }
  })
})

mqtt_client.on('message', function (topic, message) {
  	// message is Buffer
  	var string_message = message.toString();
  	var message_res = '';
  	try {
    //console.log("new data arrived")
		dojob (string_message);
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
			if (buf == "mode=auto"){
				MODE_LAMPE = MODE_LAMPE_AUTO;
			}
			else
			{
				var coap_cmd = json.type_cmd;
				await coap
				    .request(
				        url_coap,
				        coap_cmd,
				        buf,
				        options
				    )
				    .then(response => { 
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
				    .catch(err => { 
				    	console.log(err);
				    });
				}
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


/*
setInterval(function(){ 
    //code goes here that will be run every 5 seconds.    
}, 5000);
*/