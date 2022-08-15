const AWS = require('aws-sdk');
require('dotenv').config()
AWS.config.update({region: 'us-east-1'});
const sqs = new AWS.SQS();
const sqsURL = `https://sqs.us-east-1.amazonaws.com/${process.env.ACCOUNT_ID}/MyQueue`;
import {APIGatewayAuthorizerHandler} from 'aws-lambda';

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

export const handler : APIGatewayAuthorizerHandler = async (event) => {
    try{
        if(!event['body']) return {statusCode: 400, body: 'No body found'};

        let body : any = JSON.parse(event['body']);
        
        console.log(`Received event => `, body);
        
        let mailValidated : any = validMail(body);
    
        console.log('This is the mail validated received => ', mailValidated);
        
        if(mailValidated['statusCode']) return mailValidated;
        
    
        let mailFormatted : FormattedMail = formatMail(mailValidated);
        
        console.log('This is the message received => ', mailFormatted);
        
        
        let message : SQSInfo = {
            MessageBody: JSON.stringify(mailFormatted),
            QueueUrl: sqsURL
        };
        
        console.log('This is the message queue in the SQS =>', message);
        
        
        let response = await sqs.sendMessage(message).promise();
        return {statusCode: 200, body: `Message added to the SQS with this ID => ${JSON.stringify(response.MessageId)}`};
        
    }catch(error){
        
        console.error(error);
        return {statusCode: 400, body: `The was an error sending your message, please try again later`};
        
    }
}

function validMail(mail : MailReceived) : any {
    console.log('Received mail in validMail function => ', mail);
    
    if(!mail['to']) return {statusCode: 400, body: 'Please enter a mail destination'};
    
    const mailRegex = /(.+?)@(.+?)\.[a-z]{2,}/g;
    if(mailRegex.test(mail['to'])!== true) return {statusCode: 400, body: 'Pleas enter a valid mail destination'};
    
    return mail;
}

function formatMail(mail : MailReceived) : FormattedMail {

    //console.log('Mail received in formatMail function => ', mailF);
    let date = new Date;
    let dateFormatted : string = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.getHours()}:${date.getMinutes()}`;
    
    let data : FormattedMail = {...mail, "timestamps":dateFormatted};
    console.log('This is the data created ub formatMail function =>', data);
    
    return data;
}

export const sqsHandler = async (event) =>{

    let message : any = event.Records[0].body;

    console.log('This is the message received in the SQS => ', message);
}