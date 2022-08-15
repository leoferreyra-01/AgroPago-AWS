const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const sqs = new AWS.SQS();
const sqsURL = `https://sqs.us-east-1.amazonaws.com/957429122486/mailingSQS`;

exports.handler = async (event) => {
    try{
        let body = JSON.parse(event['body']);
        
        console.log(`Received event => `, body);
        
        if(!body) return {statusCode: 400, body:'Please enter a mail destination'};
        
        
        body = validMail(body);
    
        console.log('This is the mail validated received => ', body);
        
        if(body['statusCode']) return body;
        
    
        let data = formatMail(body);
        
        console.log('This is the message received => ', data);
        
        
        let message = {
            MessageBody: JSON.stringify(data),
            QueueUrl: sqsURL
        };
        
        console.log('This is the message queue in the SQS =>', message);
        
        
        let response = await sqs.sendMessage(message).promise();
        return {statusCode: 200, body: 'Message sent correctly to the SQS queue'};
        
    }catch(error){
        
        console.error(error);
        return {statusCode: 400, body: `The was an error sending your message, please try again later`};
        
    }
    
};

function validMail(mail){
    let mailR = mail;
    
    console.log('Received mail in validMail function => ', mailR);
    
    if(!mailR['to']) return {statusCode: 400, body: 'Please enter a mail destination'};
    
    const mailRegex = /(.+?)@(.+?)\.[a-z]{2,}/g;
    if(mailRegex.test(mailR['to'])!== true) return {statusCode: 400, body: 'Pleas enter a valid mail destination'};
    
    return mail;
}

function formatMail(mail) {
    let mailF = mail;

    //console.log('Mail received in formatMail function => ', mailF);
    let date = new Date;
    date = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.getHours()}:${date.getMinutes()}`;
    
    let data = {...mailF, "timestamps":date};
    console.log('This is the data created ub formatmail function =>', data);
    
    return data;
}