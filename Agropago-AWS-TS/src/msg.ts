const AWS = require('aws-sdk');
require('dotenv').config()
AWS.config.update({region: 'us-east-1'});
const sqs = new AWS.SQS();
const sqsURL = `https://sqs.us-east-1.amazonaws.com/${process.env.ACCOUNT_ID}/MyQueue`;
import {APIGatewayAuthorizerHandler} from 'aws-lambda';

//Creo diferentes interfaces para los distintos tipos de mensajes que se van manejar.
interface MailReceived {
    to: string;
    message: string;
}

interface FormattedMail {
    to: string;
    message: string;
    timestamps: string;
}

interface SQSInfo {
    MessageBody: string;
    QueueUrl: string;
}

//Creo la funcion handler del mensaje que se recibe del api Gateway.
export const handler : APIGatewayAuthorizerHandler = async (event) => {
    try{
        // Si no recibo nada en el body, retorno un error.
        if(!event['body']) return {statusCode: 400, body: 'No body found'};

        let body : any = JSON.parse(event['body']);
        console.log(`Received event => `, body);
        
        // Valido el mail que se recibe.
        let mailValidated : any = validMail(body);
        console.log('This is the mail validated received => ', mailValidated);
        
        // Si el mail no es valido, retorno un error.
        if(mailValidated['statusCode']) return mailValidated;
        
        // Formateo el mail agregandole timestamps.
        let mailFormatted : FormattedMail = formatMail(mailValidated);
        console.log('This is the message received => ', mailFormatted);
        
        // Creo el mensaje que se va a enviar a la cola.
        let message : SQSInfo = {
            MessageBody: JSON.stringify(mailFormatted),
            QueueUrl: sqsURL
        };
        console.log('This is the message queue in the SQS =>', message);
        
        // Envio el mensaje a la cola de SQS.
        let response = await sqs.sendMessage(message).promise();
        return {statusCode: 200, body: `Message added to the SQS with this ID => ${JSON.stringify(response.MessageId)}`};
        
    }catch(error){
        
        console.error(error);
        return {statusCode: 400, body: `The was an error sending your message, please try again later`};
        
    }
}

// Creo una funcion que va a validar el mail que se recibe.
function validMail(mail : MailReceived) : any {
    console.log('Received mail in validMail function => ', mail);
    
    if(!mail['to']) return {statusCode: 400, body: 'Please enter a mail destination'};
    
    const mailRegex = /(.+?)@(.+?)\.[a-z]{2,}/g;
    if(mailRegex.test(mail['to'])!== true) return {statusCode: 400, body: 'Pleas enter a valid mail destination'};
    
    return mail;
}

// Creo una funcion que va a darle el formato indicado al mail que se recibe.
function formatMail(mail : MailReceived) : FormattedMail {

    //console.log('Mail received in formatMail function => ', mailF);
    let date = new Date;
    let dateFormatted : string = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.getHours()}:${date.getMinutes()}`;
    
    let data : FormattedMail = {...mail, "timestamps":dateFormatted};
    console.log('This is the data created ub formatMail function =>', data);
    
    return data;
}

// Creo una funcion handler que va a manejar los mensajes que se reciban en la cola SQS.
export const sqsHandler = async (event) =>{

    // Logeo el mensaje que se recibe de la cola de SQS.
    let message : any = event.Records[0].body;

    console.log('This is the message received in the SQS => ', message);
}